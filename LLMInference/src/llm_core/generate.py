"""
Text generation from model logits.

`generate_text_simple` is greedy decoding (always the top token) — kept
around as the plumbing smoke test from Phase 2. `generate_text` adds
temperature scaling and top-k filtering on top, so repeated calls with an
untrained/undertrained model don't just loop the same tokens.
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


def generate_text(
    model: GPTModel,
    idx: torch.Tensor,
    max_new_tokens: int,
    context_length: int,
    temperature: float = 0.0,
    top_k: int | None = None,
    eos_id: int | None = None,
) -> torch.Tensor:
    """Sampling-based generation: temperature scaling + top-k filtering.

    `temperature == 0.0` falls back to greedy (argmax) decoding, same as
    `generate_text_simple` — this is what makes it a strict superset rather
    than a separate code path to maintain.
    """
    model.eval()
    for _ in range(max_new_tokens):
        idx_cond = idx[:, -context_length:]
        with torch.no_grad():
            logits = model(idx_cond)
        logits = logits[:, -1, :]

        if top_k is not None:
            top_logits, _ = torch.topk(logits, top_k)
            min_logit = top_logits[:, -1]
            logits = torch.where(
                logits < min_logit.unsqueeze(-1),
                torch.tensor(float("-inf")).to(logits.device),
                logits,
            )

        if temperature > 0.0:
            logits = logits / temperature
            probas = torch.softmax(logits, dim=-1)
            idx_next = torch.multinomial(probas, num_samples=1)
        else:
            idx_next = torch.argmax(logits, dim=-1, keepdim=True)

        if eos_id is not None and (idx_next == eos_id).all():
            break

        idx = torch.cat((idx, idx_next), dim=1)
    return idx
