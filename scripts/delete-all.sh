#!/bin/bash
set -e

echo "Deleting all microservices from Kubernetes..."

# Ensure we run from the project root
cd "$(dirname "$0")/.."

kubectl delete -f k8s/

echo "All resources deleted."
