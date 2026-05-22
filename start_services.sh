#!/bin/bash

echo "Starting all services..."

# 1. Run all plc services
(cd /home/hari/abb/plc-services && npm start) &
PID1=$!

# 2. Run PLC dashboard
(cd /home/hari/abb/apps/plc-dashboard && npm run dev) &
PID2=$!

# 3. Run Metric Engine
(cd /home/hari/abb/ai-platform/metrics_engine && PYTHONPATH=.. python3 -m uvicorn app.main:app --port 8000 --reload) &
PID3=$!

# 4. Run AI Dashboard
(cd /home/hari/abb/apps/ai-dashboard && npm run dev) &
PID4=$!

# 5. Port forward Prometheus
kubectl port-forward svc/monitoring-kube-prometheus-prometheus -n monitoring 9090:9090 &
PID5=$!

# 6. Port forward Grafana
kubectl port-forward svc/monitoring-grafana -n monitoring 3000:80 &
PID6=$!

echo "All services started. Press Ctrl+C to stop all."

# Trap SIGINT to kill all background processes when the script is stopped
trap "echo 'Stopping all services...'; kill $PID1 $PID2 $PID3 $PID4 $PID5 $PID6; exit" SIGINT SIGTERM

# Wait for all background processes
wait $PID1 $PID2 $PID3 $PID4 $PID5 $PID6
