"""
Building blocks used inside every transformer block: normalization,
activation, and the position-wise feed-forward network.
"""

from __future__ import annotations

import torch
import torch.nn as nn

from .config import GPTConfig


class LayerNorm(nn.Module):
    """Normalizes each token's embedding vector to mean 0 / var 1, then
    applies a learnable scale and shift so the network can undo it if that
    turns out to help. Unlike BatchNorm, this normalizes per-token across
    the embedding dimension, independent of batch size or other tokens —
    important since sequence lengths and batch sizes vary."""

    def __init__(self, emb_dim: int, eps: float = 1e-5) -> None:
        super().__init__()
        self.eps = eps
        self.scale = nn.Parameter(torch.ones(emb_dim))
        self.shift = nn.Parameter(torch.zeros(emb_dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        mean = x.mean(dim=-1, keepdim=True)
        var = x.var(dim=-1, keepdim=True, unbiased=False)
        norm_x = (x - mean) / torch.sqrt(var + self.eps)
        return self.scale * norm_x + self.shift


class GELU(nn.Module):
    """Smooth activation function GPT-2 uses instead of ReLU. This is the
    tanh-based approximation from the original GPT-2 paper (exact GELU
    needs the error function; this approximation is what OpenAI's released
    weights were actually trained with, so we match it exactly)."""

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return 0.5 * x * (
            1 + torch.tanh(
                torch.sqrt(torch.tensor(2.0 / torch.pi))
                * (x + 0.044715 * x**3)
            )
        )


class FeedForward(nn.Module):
    """Per-token MLP: expand to 4x the embedding dim, apply GELU, project
    back down. Attention mixes information *across* tokens; this is where
    each token gets independently processed/transformed — and it's where
    most of the model's parameters actually live."""

    def __init__(self, config: GPTConfig) -> None:
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(config.emb_dim, 4 * config.emb_dim),
            GELU(),
            nn.Linear(4 * config.emb_dim, config.emb_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.layers(x)
