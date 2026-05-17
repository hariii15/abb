from shared.prometheus.client import PrometheusClient
from shared.prometheus.normalizer import parse_prometheus_vector

class MemoryCollector:
    def __init__(self):
        self.prom = PrometheusClient.get_instance()

    def get_pod_memory_usage(self):
        query = 'sum(container_memory_usage_bytes) by (pod)'
        try:
            results = self.prom.custom_query(query)
            return parse_prometheus_vector(results)
        except Exception:
            return []
