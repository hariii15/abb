import sys
import os

# Set PYTHONPATH to include ai-platform
sys.path.append("/home/hari/abb/ai-platform")
# Set path to include metrics_engine/app
sys.path.append("/home/hari/abb/ai-platform/metrics_engine")

try:
    from app.routes.dependencies import get_dependency_graph
    print("Import successful. Executing...")
    res = get_dependency_graph()
    print("Execution successful!")
    print(res)
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
