#!/bin/bash
set -e

echo "Deploying all microservices to Kubernetes..."

# Ensure we run from the project root
cd "$(dirname "$0")/.."

kubectl apply -f k8s/

echo "Deployment applied! Run 'kubectl get pods' to see the status."
