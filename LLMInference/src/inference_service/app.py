"""
FastAPI application for the inference microservice.

Endpoints:
  GET  /health    — liveness/readiness probe (used later by Docker/K8s)
  POST /generate  — instruction in, generated response out

The model is loaded once in the `lifespan` startup hook and reused for every
request (loading a 124M model per request would be unusably slow). Interactive
API docs are served at /docs automatically.
"""

from __future__ import annotations

import contextlib
import pathlib

from fastapi import FastAPI

from .engine import InferenceEngine
from .schemas import GenerateRequest, GenerateResponse

# app.py is at LLMInference/src/inference_service/app.py -> parents[2] = LLMInference/
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[2]
CHECKPOINT_PATH = PROJECT_ROOT / "data" / "checkpoints" / "gpt2_124m_chat.pt"

# Process-lifetime holder for the loaded engine (populated at startup).
state: dict[str, InferenceEngine] = {}


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load the model ONCE.
    state["engine"] = InferenceEngine(str(CHECKPOINT_PATH))
    yield
    # Shutdown: drop the reference.
    state.clear()


app = FastAPI(title="LLM Inference Service", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "model_loaded": "engine" in state}


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest) -> GenerateResponse:
    engine = state["engine"]
    text = engine.generate(
        instruction=req.instruction,
        input_text=req.input,
        max_new_tokens=req.max_new_tokens,
        temperature=req.temperature,
        top_k=req.top_k,
    )
    return GenerateResponse(response=text)
