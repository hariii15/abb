#!/bin/bash
# Find Storage service pod
STORAGE_POD=$(kubectl get pods -l app=storage-service -o jsonpath='{.items[0].metadata.name}')

if [ -z "$STORAGE_POD" ]; then
    echo "❌ Storage Service Pod not found!"
    exit 1
fi

echo "🚀 Storage Pod Found: $STORAGE_POD"
echo "📂 Copying storage_stresser.sh to pod..."
kubectl cp /home/hari/abb/scratch/storage_stresser.sh $STORAGE_POD:/tmp/storage_stresser.sh

echo "📦 Triggering Storage Stresser inside the pod..."
kubectl exec $STORAGE_POD -- sh /tmp/storage_stresser.sh

# Create host sentinel file for sub-millisecond detection
touch /tmp/storage_stressed

echo "✅ Storage Stresser executed successfully! PVC/disk space has been filled."
