"""
Phase 6 — FastAPI inference microservice.

Wraps the fine-tuned GPT-2 chat model in a small HTTP API. Loads the model
once at startup and exposes it over REST so the rest of the web stack
(gateway, frontend) can call it without importing PyTorch or knowing anything
about the model internals.
"""
