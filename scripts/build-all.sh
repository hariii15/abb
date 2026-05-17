#!/bin/bash
set -e

echo "Building all microservices Docker images..."

# Ensure we run from the project root
cd "$(dirname "$0")/.."

docker build -t campus-api-gateway:latest -f services/api-gateway/Dockerfile .
docker build -t campus-auth-service:latest -f services/auth-service/Dockerfile .
docker build -t campus-cctv-service:latest -f services/cctv-service/Dockerfile .
docker build -t campus-energy-service:latest -f services/energy-service/Dockerfile .
docker build -t campus-notification-service:latest -f services/notification-service/Dockerfile .
docker build -t campus-storage-service:latest -f services/storage-service/Dockerfile .

echo "All images built successfully!"
