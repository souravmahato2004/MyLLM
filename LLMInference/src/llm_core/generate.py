"""
Simplest possible text generation: greedy decoding. Not the final sampling
strategy (temperature/top-k come in Phase 3) — this exists purely to prove
the model plumbing works end-to-end. Output will be gibberish: the model
is randomly initialized, not trained.
"""

from __future__ import annotations

import torch

from .model import GPTModel


def generate_text_simple(model: GPTModel, idx: torch.Tensor, max_new_tokens: int, context_length: int) -> torch.Tensor:
    model.eval()
    for _ in range(max_new_tokens):
        idx_cond = idx[:, -context_length:]  # crop to the model's max context
        with torch.no_grad():
            logits = model(idx_cond)
        logits = logits[:, -1, :]  # only the prediction for the *next* token matters
        probas = torch.softmax(logits, dim=-1)
        idx_next = torch.argmax(probas, dim=-1, keepdim=True)  # greedy: always pick the top token
        idx = torch.cat((idx, idx_next), dim=1)
    return idx
