from shared.prometheus.client import PrometheusClient
from shared.prometheus.normalizer import parse_prometheus_vector

class StorageCollector:
    def __init__(self):
        self.prom = PrometheusClient.get_instance()

    def get_pvc_usage(self):
        query = 'sum(kubelet_volume_stats_used_bytes) by (persistentvolumeclaim, namespace) / sum(kubelet_volume_stats_capacity_bytes) by (persistentvolumeclaim, namespace) * 100'
        try:
            results = self.prom.custom_query(query)
            return parse_prometheus_vector(results)
        except Exception:
            return []
