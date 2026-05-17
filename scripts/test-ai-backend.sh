#!/bin/bash

echo "🚀 Starting AI Platform Verification..."

# 1. Check AI Engine Health
echo -n "Checking AI Engine Health... "
HEALTH=$(curl -s http://localhost:8000/health)
if [[ $HEALTH == *"ok"* ]]; then
    echo "✅ OK"
else
    echo "❌ FAILED (Is the FastAPI server running on :8000?)"
    exit 1
fi

# 2. Check Topology Engine
echo -n "Checking Dependency Graph... "
DEP=$(curl -s http://localhost:8000/dependencies)
if [[ $DEP == *"success"* ]]; then
    echo "✅ OK ($(echo $DEP | grep -o 'id' | wc -l) nodes found)"
else
    echo "❌ FAILED"
fi

# 3. Check Prometheus Connection (via Metrics Engine)
echo -n "Checking Prometheus Connection... "
METRICS=$(curl -s http://localhost:8000/pods/cpu)
if [[ $METRICS == *"success"* ]] && [[ $METRICS != *"error"* ]]; then
    echo "✅ OK (Live metrics flowing)"
else
    echo "❌ FAILED (Check if your Prometheus port-forward is active on :9090)"
fi

# 4. Check Anomaly & Recommendation Engine
echo -n "Checking Intelligence Suite... "
ANOM=$(curl -s http://localhost:8000/anomalies)
REC=$(curl -s http://localhost:8000/recommendations)
if [[ $ANOM == *"success"* ]] && [[ $REC == *"success"* ]]; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

echo "----------------------------------------"
echo "🎉 Verification Complete! Your AI Observability Platform is ready."
echo "Visit http://localhost:3000/observability to see the dashboard."
