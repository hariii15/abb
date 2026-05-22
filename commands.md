minikube start
kubectl get pods

kubectl port-forward svc/monitoring-kube-prometheus-prometheus -n monitoring 9090:9090

kubectl port-forward svc/monitoring-grafana -n monitoring 3000:80

cd ai-platform/metrics_engine
PYTHONPATH=.. python3 -m uvicorn app.main:app --port 8000 --reload

cd apps/plc-dashboard
npm run dev

curl http://127.0.0.1:8000/dependencies

bash /home/hari/abb/scratch/trigger_cpu_spike.sh
bash /home/hari/abb/scratch/trigger_memory_leak.sh
bash /home/hari/abb/scratch/trigger_storage_stress.sh
bash /home/hari/abb/scratch/cleanup_demo.sh


1. Run all plc services:
hari@haris-jarvis:~/abb/plc-services$ npm start

2. Run PLC dashboard:
hari@haris-jarvis:~/abb/apps/plc-dashboard$ npm run dev

3. Run Metric Engine:
hari@haris-jarvis:~/abb/ai-platform/metrics_engine$ PYTHONPATH=.. python3 -m uvicorn app.main:app --port 8000 --reload

4. Run AI Dashboard:
hari@haris-jarvis:~/abb/apps/ai-dashboard$ npm run dev

kubectl port-forward svc/monitoring-kube-prometheus-prometheus -n monitoring 9090:9090
kubectl port-forward svc/monitoring-grafana -n monitoring 3000:80


chmod +x /home/hari/abb/start_services.sh
/home/hari/abb/start_services.sh
