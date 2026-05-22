#!/bin/bash
set -e

echo "Unplugging Campus Application..."
kubectl delete -f /home/hari/abb/k8s/ --ignore-not-found=true

echo "Plugging in PLC Application..."
kubectl apply -f /home/hari/abb/k8s-plc/

echo "PLC Application deployed successfully!"
kubectl get pods
