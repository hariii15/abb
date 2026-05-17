from shared.logging.logger import get_logger
from shared.utils.pod_utils import normalize_pod_name

logger = get_logger(__name__)

def parse_prometheus_vector(results) -> list[dict]:
    """
    Safely parses a raw Prometheus JSON array and normalizes label names.
    Returns a clean list of dictionaries: {"pod": ..., "value": ..., "timestamp": ...}
    NO engine should directly consume raw Prometheus JSON outside of this normalizer.
    """
    if not isinstance(results, list):
        logger.warning(f"parse_prometheus_vector expected list, got {type(results)}")
        return []

    normalized = []
    for item in results:
        # 1. Defensive type checking
        if not isinstance(item, dict):
            logger.warning(f"Skipping malformed metric item (not dict): {item}")
            continue
            
        metric = item.get('metric', {})
        value_arr = item.get('value', [])
        
        if not isinstance(metric, dict):
            continue

        # 2. Defensive array parsing (Tuple index out of range fix)
        if not isinstance(value_arr, list) or len(value_arr) < 2:
            logger.warning(f"Skipping malformed metric value array: {value_arr}")
            continue
            
        try:
            timestamp = float(value_arr[0])
            value = float(value_arr[1])
        except (ValueError, TypeError) as e:
            logger.warning(f"Failed to cast metric values: {e}")
            continue

        # 3. Normalize pod label
        pod_val = metric.get('pod') or metric.get('pod_name') or metric.get('kubernetes_pod_name')
        
        # If no pod label, check if it's a PVC metric
        if not pod_val:
            pvc_val = metric.get('persistentvolumeclaim')
            if pvc_val:
                pod_val = pvc_val # Use PVC name directly for storage metrics
                
        if not pod_val:
            continue
            
        # NORMALIZE: Strip hash/replica set (auth-service-77ffc9d5c4-9wc4v -> auth-service)
        pod_val = normalize_pod_name(pod_val)
            
        namespace_val = metric.get('namespace', 'default')
            
        normalized.append({
            "pod": pod_val,
            "namespace": namespace_val,
            "value": value,
            "timestamp": timestamp
        })
        
    return normalized
