from typing import Any, Dict, List, Optional

from openai import OpenAI

from app.core.config import get_settings

# Logprob threshold from Pipeline B research (avg_logprob < -1.5 → below_threshold)
LOGPROB_THRESHOLD = -1.5


def compute_logprob_data(logprobs_content: List[Any]) -> Dict[str, Any]:
    """
    Compute Pipeline B logprob metrics from the token logprob list returned
    by the Fanar SOAP generation call.

    normalised_score = max(0.0, min(1.0, (avg_logprob + 5) / 5))
    Research confirmed uncertain tokens are clinical words, not structural noise.
    """
    if not logprobs_content:
        return {
            "avg_logprob": None,
            "normalised_score": None,
            "below_threshold": False,
            "token_count": 0,
            "top_uncertain_tokens": [],
        }

    values = [t.logprob for t in logprobs_content if getattr(t, "logprob", None) is not None]
    if not values:
        return {
            "avg_logprob": None,
            "normalised_score": None,
            "below_threshold": False,
            "token_count": 0,
            "top_uncertain_tokens": [],
        }

    avg = sum(values) / len(values)
    score = max(0.0, min(1.0, (avg + 5) / 5))
    uncertain = sorted(
        [{"token": t.token, "logprob": round(t.logprob, 3)}
         for t in logprobs_content
         if getattr(t, "logprob", None) is not None and t.logprob < LOGPROB_THRESHOLD],
        key=lambda x: x["logprob"],
    )
    return {
        "avg_logprob": round(avg, 3),
        "normalised_score": round(score, 3),
        "below_threshold": avg < LOGPROB_THRESHOLD,
        "token_count": len(values),
        "top_uncertain_tokens": uncertain[:10],
    }


class FanarService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.model = self.settings.fanar_llm_model  # Fanar-S-1-7B
        self.client: Optional[OpenAI] = (
            None
            if not self.settings.fanar_api_key
            else OpenAI(
                base_url=self.settings.fanar_base_url,
                api_key=self.settings.fanar_api_key,
            )
        )

    def chat(self, prompt: str, temperature: float = 0) -> str:
        return self.chat_with_usage(prompt, temperature)["text"]

    def chat_with_usage(self, prompt: str, temperature: float = 0) -> Dict[str, Any]:
        """Returns {"text", "input_tokens", "output_tokens"}."""
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

    def chat_with_logprobs(self, prompt: str, temperature: float = 0) -> Dict[str, Any]:
        """
        Like chat_with_usage but also requests token log-probabilities.
        Used exclusively for Step 3 (SOAP generation) of Pipeline B.

        Returns {"text", "input_tokens", "output_tokens", "logprob_data"}.

        NOTE: Fanar must support logprobs via the OpenAI-compatible endpoint.
        If the API does not return logprobs, logprob_data fields will be None.
        """
        if self.client is None:
            raise RuntimeError("FANAR_API_KEY is not configured")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            logprobs=True,
        )
        usage = response.usage
        logprobs_content = []
        choice = response.choices[0]
        if choice.logprobs and choice.logprobs.content:
            logprobs_content = choice.logprobs.content

        return {
            "text": choice.message.content or "",
            "input_tokens": usage.prompt_tokens if usage else None,
            "output_tokens": usage.completion_tokens if usage else None,
            "logprob_data": compute_logprob_data(logprobs_content),
        }
