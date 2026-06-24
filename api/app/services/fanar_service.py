from typing import Any, Dict, Optional

from openai import OpenAI

from app.core.config import get_settings


class FanarService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.model = "Fanar"
        self.client: Optional[OpenAI] = (
            None
            if not self.settings.fanar_api_key
            else OpenAI(
                base_url=self.settings.fanar_base_url,
                api_key=self.settings.fanar_api_key,
            )
        )

    def chat(self, prompt: str, temperature: float = 0) -> str:
        """Convenience wrapper — returns text only."""
        return self.chat_with_usage(prompt, temperature)["text"]

    def chat_with_usage(self, prompt: str, temperature: float = 0) -> Dict[str, Any]:
        """
        Returns {"text": str, "input_tokens": int|None, "output_tokens": int|None}.
        Raises RuntimeError if FANAR_API_KEY is not set.
        """
        if self.client is None:
            raise RuntimeError("FANAR_API_KEY is not configured")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
        )
        usage = response.usage
        return {
            "text": response.choices[0].message.content or "",
            "input_tokens": usage.prompt_tokens if usage else None,
            "output_tokens": usage.completion_tokens if usage else None,
        }
