"""
Phase 4 validation: generate text from OpenAI's real GPT-2 124M weights and
confirm it's actually coherent English — the real test of whether the
weight-mapping in `llm_core.pretrained` is correct, since a subtly wrong
mapping (wrong transpose, wrong bias slice, etc.) would still run without
crashing but produce garbage.

First run downloads ~550MB via the `transformers` library and caches it
under the Hugging Face cache dir (`~/.cache/huggingface`) — subsequent runs
are fast.
"""

from __future__ import annotations

import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src"))

import torch

from llm_core.pretrained import load_pretrained_gpt2_124m
from llm_core.generate import generate_text
from llm_core.tokenizer import BPETokenizer
from llm_core.train import get_device

OUTPUT_PATH = pathlib.Path(__file__).resolve().parent / "pretrained_output.txt"


def main() -> None:
    device = get_device()
    tokenizer = BPETokenizer()

    print("Loading pretrained GPT-2 124M weights (downloads on first run)...")
    model = load_pretrained_gpt2_124m(device=device)

    prompt = "Every effort moves you"
    encoded = tokenizer.encode(prompt)
    idx = torch.tensor(encoded).unsqueeze(0).to(device)

    out = generate_text(
        model, idx, max_new_tokens=40, context_length=model.config.context_length,
        temperature=0.0,  # greedy: deterministic, easiest to sanity-check by eye
    )
    decoded = tokenizer.decode(out.squeeze(0).tolist())

    OUTPUT_PATH.write_text(decoded, encoding="utf-8")
    print(f"Generated text written to {OUTPUT_PATH}")
    print("Open that file and confirm it reads as coherent English, not gibberish.")


if __name__ == "__main__":
    main()
