"""
A single transformer block: causal self-attention + feed-forward network,
each wrapped in a pre-LayerNorm + residual ("shortcut") connection.
"""

from __future__ import annotations

import torch.nn as nn

from .attention import MultiHeadAttention
from .config import GPTConfig
from .layers import FeedForward, LayerNorm


class TransformerBlock(nn.Module):
    def __init__(self, config: GPTConfig) -> None:
        super().__init__()
        self.att = MultiHeadAttention(
            d_in=config.emb_dim,
            d_out=config.emb_dim,
            context_length=config.context_length,
            num_heads=config.n_heads,
            dropout=config.drop_rate,
            qkv_bias=config.qkv_bias,
        )
        self.ff = FeedForward(config)
        self.norm1 = LayerNorm(config.emb_dim)
        self.norm2 = LayerNorm(config.emb_dim)
        self.drop_shortcut = nn.Dropout(config.drop_rate)

    def forward(self, x):
        shortcut = x
        x = self.norm1(x)
        x = self.att(x)
        x = self.drop_shortcut(x)
        x = x + shortcut  # residual connection around attention

        shortcut = x
        x = self.norm2(x)
        x = self.ff(x)
        x = self.drop_shortcut(x)
        x = x + shortcut  # residual connection around feed-forward

        return x
