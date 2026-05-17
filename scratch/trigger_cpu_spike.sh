#!/bin/bash
# Find CCTV service pod
CCTV_POD=$(kubectl get pods -l app=cctv-service -o jsonpath='{.items[0].metadata.name}')

if [ -z "$CCTV_POD" ]; then
    echo "❌ CCTV Service Pod not found!"
    exit 1
fi

echo "🚀 CCTV Pod Found: $CCTV_POD"
echo "📂 Copying cpu_burner.js to pod..."
kubectl cp /home/hari/abb/scratch/cpu_burner.js $CCTV_POD:/app/cpu_burner.js

echo "🔥 Triggering CPU Burner inside the pod (in the background)..."
kubectl exec $CCTV_POD -- node /app/cpu_burner.js > /dev/null 2>&1 &

echo "✅ CPU Burner started successfully! Monitoring Prometheus. CPU will spike shortly."
