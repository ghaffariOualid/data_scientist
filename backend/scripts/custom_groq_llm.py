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
        model: str = "llama-3.3-70b-versatile",  # Modèle par défaut - performant et équilibré
        temperature: float = 0.1,  # Réduit pour plus de cohérence et fiabilité
        api_key: Optional[str] = None,
        max_tokens: int = 2048,  # Limite raisonnable pour les réponses
        **kwargs
    ):
        """Initialise le LLM."""
        self.model_name = model
        self.temperature = temperature
        self.max_tokens = max_tokens
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
        import uuid

        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        # Convertit le prompt en chaîne si ce n'est pas déjà le cas
        if isinstance(prompt, (list, dict)):
            # Si c'est une liste ou un dictionnaire, convertit-le en représentation de chaîne
            prompt_str = str(prompt)
            logger.debug(f"[{request_id}] Converting complex prompt to string. Type: {type(prompt)}")
        else:
            prompt_str = prompt

        # Préparer les messages pour l'API Groq
        messages = [{"role": "user", "content": prompt_str}]

        data = {
            "model": self.model_name,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }

        # Log request details
        prompt_length = len(prompt_str)
        logger.info(f"[{request_id}] Groq API request - Model: {self.model_name}, Prompt length: {prompt_length}, Temperature: {self.temperature}")

        # Paramètres de retry
        max_retries = 5  # Augmenter le nombre de tentatives
        retry_delay = 30  # Augmenter le délai entre les tentatives (secondes)

        for retry in range(max_retries):
            attempt_start = time.time()
            logger.debug(f"[{request_id}] Sending request to Groq API (attempt {retry+1}/{max_retries})")

            try:
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=60  # Add timeout
                )

                attempt_duration = time.time() - attempt_start

                if response.status_code == 200:
                    result = response.json()
                    total_duration = time.time() - start_time

                    # Extract response details
                    if "choices" in result and len(result["choices"]) > 0:
                        response_content = result["choices"][0]["message"]["content"]
                        response_length = len(response_content)

                        # Log success metrics
                        logger.info(f"[{request_id}] Groq API success - Duration: {total_duration:.2f}s, Response length: {response_length}, Attempts: {retry+1}")

                        # Log usage if available
                        if "usage" in result:
                            usage = result["usage"]
                            logger.info(f"[{request_id}] Token usage - Prompt: {usage.get('prompt_tokens', 'N/A')}, Completion: {usage.get('completion_tokens', 'N/A')}, Total: {usage.get('total_tokens', 'N/A')}")

                        return response_content
                    else:
                        logger.warning(f"[{request_id}] No response content found in successful API response")
                        return "No response content found"

                elif response.status_code == 429 or "rate_limit_exceeded" in response.text:
                    # Erreur de limite de débit
                    attempt_duration = time.time() - attempt_start
                    logger.warning(f"[{request_id}] Rate limit exceeded (attempt {retry+1}) - Duration: {attempt_duration:.2f}s, Response: {response.text[:200]}...")

                    if retry < max_retries - 1:
                        wait_time = retry_delay * (retry + 1)  # Backoff exponentiel simple
                        logger.warning(f"[{request_id}] Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                    else:
                        error_msg = f"Groq API rate limit exceeded after {max_retries} retries: {response.text}"
                        logger.error(f"[{request_id}] {error_msg}")
                        raise ValueError(error_msg)

                else:
                    attempt_duration = time.time() - attempt_start
                    error_msg = f"Groq API returned error {response.status_code}: {response.text}"
                    logger.error(f"[{request_id}] API Error (attempt {retry+1}) - Duration: {attempt_duration:.2f}s, Status: {response.status_code}, Response: {response.text[:200]}...")

                    # Don't retry for client errors (4xx except 429)
                    if 400 <= response.status_code < 500 and response.status_code != 429:
                        raise ValueError(error_msg)

                    if retry < max_retries - 1:
                        wait_time = retry_delay * (retry + 1)
                        logger.warning(f"[{request_id}] Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                    else:
                        raise ValueError(error_msg)

            except requests.exceptions.Timeout:
                attempt_duration = time.time() - attempt_start
                logger.warning(f"[{request_id}] Request timeout (attempt {retry+1}) - Duration: {attempt_duration:.2f}s")
                if retry < max_retries - 1:
                    wait_time = retry_delay * (retry + 1)
                    time.sleep(wait_time)
                else:
                    raise ValueError(f"Groq API request timeout after {max_retries} attempts")

            except requests.exceptions.RequestException as req_error:
                attempt_duration = time.time() - attempt_start
                logger.error(f"[{request_id}] Request error (attempt {retry+1}) - Duration: {attempt_duration:.2f}s, Error: {str(req_error)}")
                if retry < max_retries - 1:
                    wait_time = retry_delay * (retry + 1)
                    time.sleep(wait_time)
                else:
                    raise ValueError(f"Groq API request failed: {str(req_error)}")

            except Exception as e:
                attempt_duration = time.time() - attempt_start
                if retry < max_retries - 1 and ("rate_limit_exceeded" in str(e) or "429" in str(e)):
                    logger.warning(f"[{request_id}] Error with Groq API (possibly rate limit, attempt {retry+1}) - Duration: {attempt_duration:.2f}s, Error: {str(e)}")
                    wait_time = retry_delay * (retry + 1)
                    logger.warning(f"[{request_id}] Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"[{request_id}] Unexpected error calling Groq API (attempt {retry+1}) - Duration: {attempt_duration:.2f}s, Error: {str(e)}")
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
