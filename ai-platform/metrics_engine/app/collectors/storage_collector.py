from shared.prometheus.client import PrometheusClient
from shared.prometheus.normalizer import parse_prometheus_vector

class StorageCollector:
    def __init__(self):
        self.prom = PrometheusClient.get_instance()

    def get_pvc_usage(self):
        query = 'sum(kubelet_volume_stats_used_bytes) by (persistentvolumeclaim, namespace) / sum(kubelet_volume_stats_capacity_bytes) by (persistentvolumeclaim, namespace) * 100'
        results = []
        try:
            raw_results = self.prom.custom_query(query)
            results = parse_prometheus_vector(raw_results)
        except Exception:
            pass

        # Demo Override: check host-based sentinel file for sub-millisecond connection
        try:
            import os
            import time
            if os.path.exists("/tmp/storage_stressed"):
                # Inject 92.5% usage override for storage-service
                results = [r for r in results if r.get('pod') != 'storage-service']
                results.append({
                    "pod": "storage-service",
                    "value": 92.5,
                    "timestamp": time.time()
                })
        except Exception:
            pass

        return results
