import json
import re
import time
import httpx
from typing import Dict, Any, Optional
from app.ai.providers.base import BaseLLMProvider
from app.config import settings
from app.core.logging import get_logger

logger = get_logger("app.ai.openrouter")

class OpenRouterAdapter(BaseLLMProvider):
    """
    OpenRouter API Adapter implementation of BaseLLMProvider.
    Uses OpenRouter OpenAI-compatible chat completions API endpoint.
    """
    
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.model = model or settings.OPENROUTER_MODEL
        self.base_url = (base_url or settings.OPENROUTER_BASE_URL).rstrip("/")
        
    def _get_headers(self) -> Dict[str, str]:
        clean_key = (self.api_key or "").strip()
        if not clean_key:
            err_msg = "OPENROUTER_API_KEY is empty. Please set your API key in backend/.env"
            logger.error(f"[OpenRouter Config Error] {err_msg}")
            raise ValueError(err_msg)
        return {
            "Authorization": f"Bearer {clean_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://datavizai.local",
            "X-Title": settings.APP_NAME,
        }

    async def _post_chat_completion(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Helper method to execute HTTP POST to OpenRouter with comprehensive logging & error handling."""
        endpoint = f"{self.base_url}/chat/completions"
        model_name = payload.get("model", self.model)
        start_time = time.time()

        logger.info(f"[OpenRouter API Request] Model: '{model_name}' | Target: {endpoint}")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    endpoint,
                    headers=self._get_headers(),
                    json=payload,
                )
                elapsed = round(time.time() - start_time, 2)

                # If status code is not 200, handle detailed HTTP error
                if response.status_code != 200:
                    try:
                        err_body = response.json()
                        err_msg = err_body.get("error", {}).get("message") or json.dumps(err_body)
                    except Exception:
                        err_msg = response.text or "Unknown response body"

                    logger.error(
                        f"[OpenRouter HTTP Error] Status {response.status_code} ({response.reason_phrase}) "
                        f"in {elapsed}s | Detail: {err_msg}"
                    )
                    raise RuntimeError(f"OpenRouter API Error (HTTP {response.status_code}): {err_msg}")

                res_json = response.json()
                gen_id = response.headers.get("X-Generation-Id", "N/A")
                logger.info(f"[OpenRouter Response] Status 200 OK | Gen ID: {gen_id} | Time: {elapsed}s")

                if "choices" not in res_json or not res_json["choices"]:
                    err_detail = res_json.get("error", {}).get("message") or str(res_json)
                    logger.error(f"[OpenRouter Empty Choice Error] Detail: {err_detail}")
                    raise RuntimeError(f"OpenRouter returned empty choices: {err_detail}")

                return res_json

        except httpx.TimeoutException:
            elapsed = round(time.time() - start_time, 2)
            logger.error(f"[OpenRouter Timeout Error] Request timed out after {elapsed}s (Limit: 30s)")
            raise RuntimeError("OpenRouter API request timed out after 30 seconds.")
        except httpx.RequestError as req_err:
            elapsed = round(time.time() - start_time, 2)
            logger.error(f"[OpenRouter Network Error] Connection failed in {elapsed}s | Detail: {req_err}")
            raise RuntimeError(f"OpenRouter network connection error: {req_err}")

    async def generate(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        temperature: float = 0.2
    ) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }

        res_json = await self._post_chat_completion(payload)
        return res_json["choices"][0]["message"]["content"]

    async def analyze_json(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        temperature: float = 0.1
    ) -> Dict[str, Any]:
        json_system_prompt = (system_prompt or "") + "\nIMPORTANT: Respond ONLY with a valid raw JSON object. Do NOT add markdown codeblocks, prose, or explanation."
        
        messages = [
            {"role": "system", "content": json_system_prompt},
            {"role": "user", "content": prompt}
        ]

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }

        res_json = await self._post_chat_completion(payload)
        content = res_json["choices"][0]["message"]["content"].strip()

        # Remove markdown code block fences if present
        if "```" in content:
            code_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content, re.IGNORECASE)
            if code_match:
                content = code_match.group(1).strip()
            else:
                content = re.sub(r"^```(?:json)?", "", content, flags=re.MULTILINE)
                content = re.sub(r"```$", "", content, flags=re.MULTILINE).strip()

        # Find first { and last }
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1 and end > start:
            content = content[start : end + 1]

        try:
            return json.loads(content)
        except json.JSONDecodeError as decode_err:
            logger.error(f"[OpenRouter JSON Parse Error] Failed to parse JSON response: {decode_err} | Content preview: '{content[:150]}...'")
            raise RuntimeError(f"Failed to parse JSON response from OpenRouter: {decode_err}")
