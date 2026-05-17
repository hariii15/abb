#!/bin/bash
echo "🛡️ Cleaning up and restoring cluster state..."

# 1. CCTV Service (CPU Spike)
CCTV_POD=$(kubectl get pods -l app=cctv-service -o jsonpath='{.items[0].metadata.name}')
if [ -n "$CCTV_POD" ]; then
    echo "Killing cpu_burner.js in CCTV pod..."
    kubectl exec $CCTV_POD -- pkill -f cpu_burner || echo "No CPU burner running in cctv."
fi

# 2. Auth Service (Memory Leak)
AUTH_POD=$(kubectl get pods -l app=auth-service -o jsonpath='{.items[0].metadata.name}')
if [ -n "$AUTH_POD" ]; then
    echo "Killing memory_leaker.js in Auth pod..."
    kubectl exec $AUTH_POD -- pkill -f memory_leaker || echo "No Memory leaker running in auth."
fi

# 3. Storage Service (Storage Stress)
STORAGE_POD=$(kubectl get pods -l app=storage-service -o jsonpath='{.items[0].metadata.name}')
if [ -n "$STORAGE_POD" ]; then
    echo "Removing stress file in Storage pod..."
    kubectl exec $STORAGE_POD -- rm -f /tmp/stress_file || echo "No storage stress file to clean."
fi

echo "✅ Cleanup complete! Services should return to normal metrics within the next query cycles."
