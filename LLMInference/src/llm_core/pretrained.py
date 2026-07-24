"""
Load OpenAI's released GPT-2 124M weights into our from-scratch `GPTModel`.

We fetch the weights via Hugging Face's `transformers` library
(`GPT2LMHeadModel.from_pretrained("gpt2")`) rather than OpenAI's original
TensorFlow checkpoint files — same trained weights, just distributed as a
PyTorch state_dict already, so no TensorFlow dependency is needed just to
read them once.

Two structural differences between HF's GPT-2 and our architecture that
the mapping below has to account for:

1. **qkv_bias**: our `GPT_CONFIG_124M` defaults to `qkv_bias=False` (a
   reasonable default when training from scratch), but the real GPT-2 was
   trained *with* biases on its attention/projection layers. Loading these
   weights needs a config with `qkv_bias=True`, or the bias tensors have
   nowhere to go.
2. **Combined qkv projection + Conv1D layout**: HF's GPT2 stores Q/K/V as
   one fused `c_attn` layer (out_features = 3 * emb_dim) instead of three
   separate `nn.Linear`s, and uses `Conv1D`, whose weight is stored
   `(in_features, out_features)` — the transpose of `nn.Linear`'s
   `(out_features, in_features)`. Every weight below gets `.T`'d and the
   fused qkv tensor gets split into three equal chunks before assignment.

Weight tying: GPT-2's output head reuses the token embedding matrix instead
of learning a separate one (this is *why* real GPT-2 124M has ~124M
params while our from-scratch untied config has ~163M — see
`test_124m_param_count_is_in_the_right_ballpark`). So `out_head.weight`
gets assigned the same tensor as `tok_emb.weight`, not its own slice of
the checkpoint.
"""

from __future__ import annotations

import dataclasses
from pathlib import Path

import torch
import torch.nn as nn

from .config import GPT_CONFIG_124M
from .model import GPTModel

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PRETRAINED_CACHE_DIR = PROJECT_ROOT / "data" / "pretrained" / "huggingface"


def _assign(target: nn.Parameter, source: torch.Tensor) -> nn.Parameter:
    if target.shape != source.shape:
        raise ValueError(f"Shape mismatch: target {target.shape} vs source {source.shape}")
    return nn.Parameter(source.clone().detach())


def load_pretrained_gpt2_124m(
    device: torch.device | str = "cpu",
    cache_dir: str | Path | None = None,
) -> GPTModel:
    """Download (and cache) OpenAI's GPT-2 124M weights and return a
    `GPTModel` with them loaded, in eval mode on `device`.

    By default the Hugging Face files are cached inside this project under
    `data/pretrained/huggingface/` so the downloaded weights stay visible
    beside the rest of the learning artifacts.
    """
    from transformers import GPT2LMHeadModel  # noqa: PLC0415 - optional, only needed here

    resolved_cache_dir = DEFAULT_PRETRAINED_CACHE_DIR if cache_dir is None else Path(cache_dir)

    try:
        # Prefer the project-local downloaded weights and avoid contacting the hub
        # once the model is already cached.
        hf_model = GPT2LMHeadModel.from_pretrained(
            "gpt2",
            cache_dir=resolved_cache_dir,
            local_files_only=True,
        )
    except OSError:
        # First run: no local cache yet, so download once into `resolved_cache_dir`.
        hf_model = GPT2LMHeadModel.from_pretrained("gpt2", cache_dir=resolved_cache_dir)
    hf_sd = hf_model.state_dict()

    config = dataclasses.replace(GPT_CONFIG_124M, qkv_bias=True)
    model = GPTModel(config)

    model.tok_emb.weight = _assign(model.tok_emb.weight, hf_sd["transformer.wte.weight"])
    model.pos_emb.weight = _assign(model.pos_emb.weight, hf_sd["transformer.wpe.weight"])

    for b in range(config.n_layers):
        prefix = f"transformer.h.{b}."
        block = model.trf_blocks[b]

        q_w, k_w, v_w = hf_sd[prefix + "attn.c_attn.weight"].chunk(3, dim=-1)
        q_b, k_b, v_b = hf_sd[prefix + "attn.c_attn.bias"].chunk(3, dim=-1)
        block.att.W_query.weight = _assign(block.att.W_query.weight, q_w.T)
        block.att.W_key.weight = _assign(block.att.W_key.weight, k_w.T)
        block.att.W_value.weight = _assign(block.att.W_value.weight, v_w.T)
        block.att.W_query.bias = _assign(block.att.W_query.bias, q_b)
        block.att.W_key.bias = _assign(block.att.W_key.bias, k_b)
        block.att.W_value.bias = _assign(block.att.W_value.bias, v_b)

        block.att.out_proj.weight = _assign(block.att.out_proj.weight, hf_sd[prefix + "attn.c_proj.weight"].T)
        block.att.out_proj.bias = _assign(block.att.out_proj.bias, hf_sd[prefix + "attn.c_proj.bias"])

        block.ff.layers[0].weight = _assign(block.ff.layers[0].weight, hf_sd[prefix + "mlp.c_fc.weight"].T)
        block.ff.layers[0].bias = _assign(block.ff.layers[0].bias, hf_sd[prefix + "mlp.c_fc.bias"])
        block.ff.layers[2].weight = _assign(block.ff.layers[2].weight, hf_sd[prefix + "mlp.c_proj.weight"].T)
        block.ff.layers[2].bias = _assign(block.ff.layers[2].bias, hf_sd[prefix + "mlp.c_proj.bias"])

        block.norm1.scale = _assign(block.norm1.scale, hf_sd[prefix + "ln_1.weight"])
        block.norm1.shift = _assign(block.norm1.shift, hf_sd[prefix + "ln_1.bias"])
        block.norm2.scale = _assign(block.norm2.scale, hf_sd[prefix + "ln_2.weight"])
        block.norm2.shift = _assign(block.norm2.shift, hf_sd[prefix + "ln_2.bias"])

    model.final_norm.scale = _assign(model.final_norm.scale, hf_sd["transformer.ln_f.weight"])
    model.final_norm.shift = _assign(model.final_norm.shift, hf_sd["transformer.ln_f.bias"])

    # Weight tying: output head reuses the token embedding matrix.
    model.out_head.weight = _assign(model.out_head.weight, hf_sd["transformer.wte.weight"])

    model.to(device)
    model.eval()
    return model
