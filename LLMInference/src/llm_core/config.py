"""
Model configuration.

`GPT_CONFIG_124M` mirrors the smallest original GPT-2 checkpoint's
hyperparameters — useful later (Phase 4) when we load OpenAI's pretrained
124M weights into this architecture, since the shapes must match exactly.

`GPT_CONFIG_TINY` is a much smaller config for fast local smoke-testing on
CPU (this machine has no CUDA) — enough to verify the architecture is wired
correctly without waiting minutes per forward pass.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GPTConfig:
    vocab_size: int      # size of the BPE vocabulary (GPT-2: 50257)
    context_length: int  # max sequence length the model was trained/sized for
    emb_dim: int          # embedding / residual-stream dimension
    n_heads: int          # number of attention heads (emb_dim must be divisible by this)
    n_layers: int         # number of stacked transformer blocks
    drop_rate: float      # dropout probability, applied in embeddings/attention/FFN
    qkv_bias: bool        # whether Q/K/V linear projections carry a bias term


GPT_CONFIG_124M = GPTConfig(
    vocab_size=50257,
    context_length=1024,
    emb_dim=768,
    n_heads=12,
    n_layers=12,
    drop_rate=0.1,
    qkv_bias=False,
)

GPT_CONFIG_TINY = GPTConfig(
    vocab_size=50257,
    context_length=64,
    emb_dim=64,
    n_heads=4,
    n_layers=2,
    drop_rate=0.1,
    qkv_bias=False,
)
