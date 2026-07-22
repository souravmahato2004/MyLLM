"""
Causal multi-head self-attention.

Self-attention lets every token "look at" every other token in the sequence
to decide what's relevant to it. Causal masking blocks each token from
looking at tokens that come *after* it — required for next-token prediction,
otherwise the model could just "peek" at the answer during training.
"""

from __future__ import annotations

import torch
import torch.nn as nn


class MultiHeadAttention(nn.Module):
    def __init__(self, d_in: int, d_out: int, context_length: int, dropout: float,
                 num_heads: int, qkv_bias: bool = False) -> None:
        super().__init__()
        assert d_out % num_heads == 0, "d_out must be divisible by num_heads"

        self.d_out = d_out
        self.num_heads = num_heads
        self.head_dim = d_out // num_heads

        self.W_query = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.W_key = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.W_value = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.out_proj = nn.Linear(d_out, d_out)  # mixes the heads back together
        self.dropout = nn.Dropout(dropout)

        # Upper-triangular mask (excluding diagonal): True where attention
        # must be blocked (future positions). Registered as a buffer so it
        # moves with .to(device) but isn't a trainable parameter.
        self.register_buffer(
            "mask",
            torch.triu(torch.ones(context_length, context_length), diagonal=1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, num_tokens, _ = x.shape

        queries = self.W_query(x)
        keys = self.W_key(x)
        values = self.W_value(x)

        # (b, num_tokens, d_out) -> (b, num_tokens, num_heads, head_dim)
        # -> (b, num_heads, num_tokens, head_dim), so each head attends independently
        queries = queries.view(b, num_tokens, self.num_heads, self.head_dim).transpose(1, 2)
        keys = keys.view(b, num_tokens, self.num_heads, self.head_dim).transpose(1, 2)
        values = values.view(b, num_tokens, self.num_heads, self.head_dim).transpose(1, 2)

        # Raw attention scores: how much should each token attend to each other token
        attn_scores = queries @ keys.transpose(2, 3)

        # Block future positions before softmax by setting their score to -inf
        mask_bool = self.mask.bool()[:num_tokens, :num_tokens]
        attn_scores.masked_fill_(mask_bool, -torch.inf)

        # Scale by sqrt(head_dim) to keep softmax gradients well-behaved,
        # then normalize into a probability distribution per query token
        attn_weights = torch.softmax(attn_scores / keys.shape[-1] ** 0.5, dim=-1)
        attn_weights = self.dropout(attn_weights)

        # Weighted sum of values, then merge heads back into one vector per token
        context_vec = (attn_weights @ values).transpose(1, 2)
        context_vec = context_vec.contiguous().view(b, num_tokens, self.d_out)
        context_vec = self.out_proj(context_vec)

        return context_vec
