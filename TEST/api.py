"""
Minimal FastAPI app — the from-scratch skeleton.

Same shape as the real inference service (src/inference_service/app.py), just
without the model: a health check plus one POST endpoint with a validated body.
Run it with:  uv run uvicorn api:app --reload
Then open:     http://127.0.0.1:8000/docs
"""

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Test API", version="0.1.0")


# Pydantic model = the "shape" of the request body (auto-validated + auto-docs).
class EchoRequest(BaseModel):
    message: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/echo")
def echo(req: EchoRequest) -> dict[str, str]:
    return {"you_said": req.message}
