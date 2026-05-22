#!/bin/bash
set -e

echo "Building PLC Microservice Docker Images..."

# Backend Services
cd /home/hari/abb/plc-services

for service in api-gateway plc-controller sensor-service motor-service conveyor-service robot-arm-service alarm-service energy-service notification-service; do
  echo "Building plc-${service}:latest..."
  docker build -t plc-${service}:latest ./$service
  
  # Optional: If you are using minikube, uncomment the line below to load the image into the cluster
  # minikube image load plc-${service}:latest
done

# Frontend Dashboard
echo "Building plc-dashboard:latest..."
cd /home/hari/abb/apps/plc-dashboard
docker build -t plc-dashboard:latest .
# minikube image load plc-dashboard:latest

echo "All images built successfully!"
