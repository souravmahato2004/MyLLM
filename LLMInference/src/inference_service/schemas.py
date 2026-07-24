"""
Request/response schemas for the inference API.

Pydantic models give us two things for free: automatic request validation
(bad types / out-of-range values are rejected with a 422 before our code
runs) and auto-generated OpenAPI docs at /docs.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    instruction: str = Field(..., description="The instruction or question for the model.")
    input: str = Field("", description="Optional extra context for the instruction.")
    max_new_tokens: int = Field(256, ge=1, le=1024, description="Max tokens to generate.")
    temperature: float = Field(
        0.0, ge=0.0, le=2.0,
        description="0.0 = greedy/deterministic; higher = more random.",
    )
    top_k: int | None = Field(None, ge=1, description="Optional top-k sampling filter.")


class GenerateResponse(BaseModel):
    response: str = Field(..., description="The model's generated answer.")
