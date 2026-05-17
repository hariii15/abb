from shared.prometheus.client import PrometheusClient
from shared.prometheus.normalizer import parse_prometheus_vector

class PodCollector:
    def __init__(self):
        self.prom = PrometheusClient.get_instance()

    def get_pod_restarts(self):
        query = 'sum(increase(kube_pod_container_status_restarts_total[5m])) by (pod)'
        try:
            results = self.prom.custom_query(query)
            return parse_prometheus_vector(results)
        except Exception:
            return []
            
    def get_pod_states(self):
        query = 'sum(kube_pod_status_phase{phase="Running"}) by (pod)'
        try:
            results = self.prom.custom_query(query)
            return parse_prometheus_vector(results)
        except Exception:
            return []
