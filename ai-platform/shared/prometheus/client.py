from prometheus_api_client import PrometheusConnect
from shared.config.settings import PROMETHEUS_URL
from shared.logging.logger import get_logger

logger = get_logger(__name__)

class PrometheusClient:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            logger.info(f"Connecting to Prometheus at {PROMETHEUS_URL}")
            cls._instance = PrometheusConnect(url=PROMETHEUS_URL, disable_ssl=True)
        return cls._instance

    @staticmethod
    def normalize_results(results):
        """
        Normalizes Prometheus results by ensuring 'pod' is always the key, 
        even if the source uses 'pod_name' or 'kubernetes_pod_name'.
        """
        if not isinstance(results, list): return results
        
        normalized = []
        for item in results:
            if not isinstance(item, dict) or 'metric' not in item: continue
            metric = item['metric']
            
            # Find the pod name in common label variants
            pod_val = metric.get('pod') or metric.get('pod_name') or metric.get('kubernetes_pod_name')
            if pod_val:
                metric['pod'] = pod_val
                normalized.append(item)
        return normalized
