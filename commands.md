minikube start
kubectl get pods

kubectl port-forward svc/monitoring-kube-prometheus-prometheus -n monitoring 9090:9090

kubectl port-forward svc/monitoring-grafana -n monitoring 3000:80

cd ai-platform/metrics_engine
PYTHONPATH=.. python3 -m uvicorn app.main:app --port 8000 --reload

cd apps/campus-web
npm run dev

curl http://127.0.0.1:8000/dependencies

bash /home/hari/abb/scratch/trigger_cpu_spike.sh
bash /home/hari/abb/scratch/trigger_memory_leak.sh
bash /home/hari/abb/scratch/trigger_storage_stress.sh
bash /home/hari/abb/scratch/cleanup_demo.sh
