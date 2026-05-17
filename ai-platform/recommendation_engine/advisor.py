import os
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from shared.logging.logger import get_logger

logger = get_logger(__name__)

class InfrastructureAdvisor:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.llm = None
        
        if self.api_key:
            try:
                self.llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo")
                logger.info("LangChain Advisor initialized with OpenAI.")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI: {e}")
        else:
            logger.info("No API key found. Advisor will use fallback templates.")

    def get_explanation(self, anomaly: dict, recommendation: dict):
        """
        Uses an LLM to generate a human-friendly explanation for the recommendation.
        Falls back to a template if no LLM is available.
        """
        if not self.llm:
            return recommendation["message"]

        try:
            prompt = ChatPromptTemplate.from_template("""
            You are a senior Kubernetes SRE. 
            An anomaly was detected in the cluster: {anomaly}
            The automated engine suggested this fix: {action}
            
            Provide a short, 1-2 sentence professional explanation for why this fix is necessary 
            and what the likely root cause is. Keep it technical but readable.
            """)
            
            chain = prompt | self.llm
            response = chain.invoke({
                "anomaly": str(anomaly),
                "action": recommendation["action"]
            })
            
            return response.content.strip()
            
        except Exception as e:
            logger.error(f"LLM Advisor failed: {e}")
            return recommendation["message"]
