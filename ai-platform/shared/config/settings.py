import os

# Base Configs
# Default to localhost for local dev; can be overridden via ENV in production
PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://localhost:9090")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
