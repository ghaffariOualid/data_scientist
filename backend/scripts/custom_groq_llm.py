import os
import logging
import dotenv
from typing import Any, Dict, List, Optional, Union
from crewai.llm import BaseLLM
import requests
import json

# Load .env file from the parent directory (project root)
dotenv.load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CustomGroqLLM(BaseLLM):
    """Classe LLM personnalisée pour utiliser Groq avec CrewAI."""

    def __init__(
        self,
        model: str = "llama-3.3-70b-versatile",  # Modèle par défaut
        temperature: float = 0.7,
        api_key: Optional[str] = None,
        **kwargs
    ):
        """Initialise le LLM."""
        self.model_name = model
        self.temperature = temperature
        self.api_key = api_key or os.getenv("GROQ_API_KEY")

        if not self.api_key:
            raise ValueError("GROQ_API_KEY must be provided either as an argument or as an environment variable")

        logger.info(f"Initializing CustomGroqLLM with model: {model}")
        logger.info(f"API Key set: {self.api_key[:20]}..." if self.api_key else "No API key")
        super().__init__(model=model, **kwargs)
        # Réassigner l'API key après l'appel à super() car BaseLLM pourrait l'écraser
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        logger.info(f"API Key after super(): {self.api_key[:20]}..." if self.api_key else "No API key after super()")

    def call(
        self,
        prompt: Union[str, List, Dict],
        **kwargs
    ) -> str:
        """Appelle l'API Groq et retourne la sortie avec retry en cas d'erreur de limite de débit."""
        import time

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        # Convertit le prompt en chaîne si ce n'est pas déjà le cas
        if isinstance(prompt, (list, dict)):
            # Si c'est une liste ou un dictionnaire, convertit-le en représentation de chaîne
            prompt_str = str(prompt)
            logger.debug(f"Converting complex prompt to string. Type: {type(prompt)}")
        else:
            prompt_str = prompt

        # Préparer les messages pour l'API Groq
        messages = [{"role": "user", "content": prompt_str}]

        data = {
            "model": self.model_name,
            "messages": messages,
            "temperature": self.temperature
        }

        # Paramètres de retry
        max_retries = 5  # Augmenter le nombre de tentatives
        retry_delay = 30  # Augmenter le délai entre les tentatives (secondes)

        for retry in range(max_retries):
            logger.debug(f"Sending request to Groq API (attempt {retry+1}/{max_retries})")
            logger.debug(f"Headers: {headers}")
            logger.debug(f"Data: {data}")
            try:
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=data
                )

                if response.status_code == 200:
                    result = response.json()
                    logger.debug("Received response from Groq API")

                    # Extraire le contenu de la réponse
                    if "choices" in result and len(result["choices"]) > 0:
                        return result["choices"][0]["message"]["content"]
                    else:
                        return "No response content found"

                elif response.status_code == 429 or "rate_limit_exceeded" in response.text:
                    # Erreur de limite de débit
                    if retry < max_retries - 1:
                        wait_time = retry_delay * (retry + 1)  # Backoff exponentiel simple
                        logger.warning(f"Rate limit exceeded. Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                    else:
                        error_msg = f"Groq API rate limit exceeded after {max_retries} retries: {response.text}"
                        logger.error(error_msg)
                        raise ValueError(error_msg)

                else:
                    error_msg = f"Groq API returned error: {response.text}"
                    logger.error(error_msg)
                    raise ValueError(error_msg)

            except Exception as e:
                if retry < max_retries - 1 and ("rate_limit_exceeded" in str(e) or "429" in str(e)):
                    wait_time = retry_delay * (retry + 1)
                    logger.warning(f"Error with Groq API (possibly rate limit). Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Error calling Groq API: {str(e)}")
                    raise

    def stream(
        self,
        prompt: Union[str, List, Dict],
        **kwargs
    ) -> str:
        """Le streaming n'est pas pris en charge dans cette implémentation."""
        logger.warning("Stream method called but not supported. Falling back to call method.")
        return self.call(prompt, **kwargs)

    def get_model(self) -> str:
        """Retourne le nom du modèle."""
        return self.model_name
