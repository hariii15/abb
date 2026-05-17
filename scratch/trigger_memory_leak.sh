#!/bin/bash
# Find Auth service pod
AUTH_POD=$(kubectl get pods -l app=auth-service -o jsonpath='{.items[0].metadata.name}')

if [ -z "$AUTH_POD" ]; then
    echo "❌ Auth Service Pod not found!"
    exit 1
fi

echo "🚀 Auth Pod Found: $AUTH_POD"
echo "📂 Copying memory_leaker.js to pod..."
kubectl cp /home/hari/abb/scratch/memory_leaker.js $AUTH_POD:/app/memory_leaker.js

echo "💧 Triggering Memory Leaker inside the pod (in the background)..."
kubectl exec $AUTH_POD -- node /app/memory_leaker.js > /dev/null 2>&1 &

echo "✅ Memory Leaker started successfully! RAM usage will grow by 50MB every 5 seconds."
