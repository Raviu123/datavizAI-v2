from app.ai.providers.base import BaseLLMProvider
from app.ai.providers.openrouter import OpenRouterAdapter
from app.config import settings

class LLMProviderFactory:
    @staticmethod
    def get_provider(provider_name: str = None) -> BaseLLMProvider:
        provider = (provider_name or settings.LLM_PROVIDER).lower()
        if provider == "openrouter":
            return OpenRouterAdapter()
        # Fallback to OpenRouterAdapter as primary provider
        return OpenRouterAdapter()
