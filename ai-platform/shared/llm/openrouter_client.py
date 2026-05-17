import os
from langchain_openai import ChatOpenAI
from shared.logging.logger import get_logger

logger = get_logger(__name__)

# Fallback fake key for demo if .env is missing
API_KEY = os.getenv("OPENROUTER_API_KEY", "dummy-key")

def get_llm():
    """
    Instantiates an OpenAI-compatible client pointed at OpenRouter.
    Uses Llama-3-8B as a fast, cheap, and capable reasoning engine.
    """
    if API_KEY == "dummy-key":
        logger.warning("OPENROUTER_API_KEY is not set. LLM calls will fail!")
        
    return ChatOpenAI(
        model="meta-llama/llama-3-8b-instruct:free",
        openai_api_key=API_KEY,
        openai_api_base="https://openrouter.ai/api/v1",
        max_tokens=200,
        temperature=0.2
    )
