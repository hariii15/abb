import re

def normalize_pod_name(name: str) -> str:
    """
    Normalizes a Kubernetes pod name by removing the replica set and pod hash.
    Example: auth-service-77ffc9d5c4-9wc4v -> auth-service
    """
    if not name:
        return name
    # Pattern: -[hash of 8-10 chars]-[hash of 5 chars]
    return re.sub(r'-[a-z0-9]{8,10}-[a-z0-9]{5}$', '', name)
