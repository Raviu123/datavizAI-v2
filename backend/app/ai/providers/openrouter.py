import json
import re
import httpx
from typing import Dict, Any, Optional
from app.ai.providers.base import BaseLLMProvider
from app.config import settings

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
            raise ValueError("OPENROUTER_API_KEY is empty. Set your key in .env")
        return {
            "Authorization": f"Bearer {clean_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://datavizai.local",
            "X-Title": settings.APP_NAME,
        }

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

        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self._get_headers(),
                json=payload,
            )
            response.raise_for_status()
            res_json = response.json()

            if "choices" not in res_json or not res_json["choices"]:
                error_detail = res_json.get("error", {}).get("message") or str(res_json)
                raise RuntimeError(f"OpenRouter API error: {error_detail}")

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

        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self._get_headers(),
                json=payload,
            )
            response.raise_for_status()
            res_json = response.json()

            if "choices" not in res_json or not res_json["choices"]:
                error_detail = res_json.get("error", {}).get("message") or str(res_json)
                raise RuntimeError(f"OpenRouter API error: {error_detail}")

            content = res_json["choices"][0]["message"]["content"]

            # Robust JSON extraction
            cleaned = content.strip()
            if "```" in cleaned:
                cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.MULTILINE)
                cleaned = re.sub(r"```$", "", cleaned, flags=re.MULTILINE).strip()

            # Find first { and last }
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                cleaned = match.group(0)

            return json.loads(cleaned)
