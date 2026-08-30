from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseLLMProvider(ABC):
    """
    Abstract Base Class for LLM Providers (OpenRouter, OpenAI, Anthropic, Gemini, etc.)
    Ensures that domain code remains agnostic of the underlying provider.
    """
    
    @abstractmethod
    async def generate(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        temperature: float = 0.2
    ) -> str:
        """Generates plain text response from the model."""
        pass

    @abstractmethod
    async def analyze_json(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        temperature: float = 0.1
    ) -> Dict[str, Any]:
        """Generates structured JSON response from the model."""
        pass
