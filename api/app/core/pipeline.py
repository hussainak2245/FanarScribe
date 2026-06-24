"""
Per-request pipeline step tracking.
Every LLM call records provider, model, timing, and token usage so the
response JSON always shows exactly what ran and how long it took.
"""
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class PipelineStep:
    step: str
    provider: str
    model: str
    status: str = "pending"
    duration_ms: float = 0.0
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    fallback: bool = False
    error: Optional[str] = None
    _started_at: float = field(default_factory=time.perf_counter, repr=False)

    def finish(self, error: Optional[str] = None) -> None:
        self.duration_ms = round((time.perf_counter() - self._started_at) * 1000, 2)
        self.status = "error" if error else "completed"
        if error:
            self.error = error

    def as_dict(self) -> Dict[str, Any]:
        out: Dict[str, Any] = {
            "step": self.step,
            "provider": self.provider,
            "model": self.model,
            "status": self.status,
            "duration_ms": self.duration_ms,
        }
        if self.input_tokens is not None:
            out["input_tokens"] = self.input_tokens
        if self.output_tokens is not None:
            out["output_tokens"] = self.output_tokens
        if self.fallback:
            out["fallback"] = True
        if self.error:
            out["error"] = self.error
        return out


class PipelineLog:
    def __init__(self) -> None:
        self._steps: List[PipelineStep] = []
        self._started_at: float = time.perf_counter()

    def start_step(self, step: str, provider: str, model: str) -> PipelineStep:
        s = PipelineStep(step=step, provider=provider, model=model)
        self._steps.append(s)
        return s

    def total_ms(self) -> float:
        return round((time.perf_counter() - self._started_at) * 1000, 2)

    def to_dict(self) -> Dict[str, Any]:
        fanar_calls = sum(1 for s in self._steps if s.provider == "fanar" and not s.fallback and s.status == "completed")
        fallback_calls = sum(1 for s in self._steps if s.fallback)
        return {
            "total_ms": self.total_ms(),
            "fanar_calls": fanar_calls,
            "fallback_calls": fallback_calls,
            "steps": [s.as_dict() for s in self._steps],
        }
