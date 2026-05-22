import os
from langchain_openai import ChatOpenAI
from shared.logging.logger import get_logger

logger = get_logger(__name__)

# Dynamically load the .env file if it exists in services
def _load_env_keys():
    possible_paths = [
        "/home/hari/abb/services/.env",
        "../services/.env",
        "../../services/.env",
        "./services/.env"
    ]
    for path in possible_paths:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    for line in f:
                        line = line.strip()
                        if "=" in line and not line.startswith("#"):
                            k, v = line.split("=", 1)
                            # Remove surrounding quotes if present
                            k = k.strip()
                            v = v.strip().strip("'").strip('"')
                            os.environ[k] = v
                logger.info(f"Loaded environment keys from {path}")
                break
            except Exception as e:
                logger.warning(f"Failed to parse env file {path}: {e}")

_load_env_keys()

API_KEY = os.getenv("OPENROUTER_API_KEY", "dummy-key")

def get_llm():
    """
    Instantiates an OpenAI-compatible client pointed at OpenRouter.
    Uses Llama-3-8B as a fast, cheap, and capable reasoning engine.
    """
    if API_KEY == "dummy-key":
        logger.warning("OPENROUTER_API_KEY is not set. LLM calls will fail!")
        
    return ChatOpenAI(
        model="deepseek/deepseek-v4-flash:free",
        openai_api_key=API_KEY,
        openai_api_base="https://openrouter.ai/api/v1",
        max_tokens=200,
        temperature=0.2,
        timeout=5,
        max_retries=1
    )
