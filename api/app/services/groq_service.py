from typing import Any, Dict, Optional

from groq import Groq

from app.core.config import get_settings


class GroqService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client: Optional[Groq] = (
            None if not self.settings.groq_api_key else Groq(api_key=self.settings.groq_api_key)
        )

    def chat(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0,
        max_tokens: int = 3000,
    ) -> str:
        """Convenience wrapper — returns text only."""
        return self.chat_with_usage(prompt, model=model, temperature=temperature, max_tokens=max_tokens)["text"]

    def chat_with_usage(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0,
        max_tokens: int = 3000,
    ) -> Dict[str, Any]:
        """
        Returns {"text": str, "model": str, "input_tokens": int|None, "output_tokens": int|None}.
        Raises RuntimeError if GROQ_API_KEY is not set.
        """
        if self.client is None:
            raise RuntimeError("GROQ_API_KEY is not configured")

        resolved_model = model or self.settings.groq_llm_model
        completion = self.client.chat.completions.create(
            model=resolved_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_completion_tokens=max_tokens,
        )
        usage = completion.usage
        return {
            "text": completion.choices[0].message.content or "",
            "model": resolved_model,
            "input_tokens": usage.prompt_tokens if usage else None,
            "output_tokens": usage.completion_tokens if usage else None,
        }
