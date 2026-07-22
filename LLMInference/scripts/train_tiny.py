"""
Real (if small) Phase 3 training run: GPT_CONFIG_TINY on the-verdict.txt.

Not a unit test — this actually trains the model and prints train/val loss
plus a generated sample after every epoch, so you can watch the loss drop
and the sample text drift away from pure noise.
"""

from __future__ import annotations

import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src"))

import torch

from llm_core.config import GPT_CONFIG_TINY
from llm_core.model import GPTModel
from llm_core.dataset import create_dataloader_v1
from llm_core.tokenizer import BPETokenizer
from llm_core.train import train_model_simple, get_device

DATA_PATH = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw" / "the-verdict.txt"
CHECKPOINT_PATH = pathlib.Path(__file__).resolve().parent.parent / "data" / "checkpoints" / "tiny_model.pt"


def main() -> None:
    text = DATA_PATH.read_text(encoding="utf-8")

    split_idx = int(0.9 * len(text))
    train_text, val_text = text[:split_idx], text[split_idx:]

    train_loader = create_dataloader_v1(
        train_text,
        batch_size=2,
        context_length=GPT_CONFIG_TINY.context_length,
        stride=GPT_CONFIG_TINY.context_length,
        shuffle=True,
    )
    val_loader = create_dataloader_v1(
        val_text,
        batch_size=2,
        context_length=GPT_CONFIG_TINY.context_length,
        stride=GPT_CONFIG_TINY.context_length,
        shuffle=False,
    )

    device = get_device()  # CPU for now; use_dml=True once torch-directml is installed/verified
    model = GPTModel(GPT_CONFIG_TINY)
    optimizer = torch.optim.AdamW(model.parameters(), lr=5e-4, weight_decay=0.1)
    tokenizer = BPETokenizer()

    train_losses, val_losses, tokens_seen = train_model_simple(
        model, train_loader, val_loader, optimizer, device,
        num_epochs=10,
        eval_freq=5,
        eval_iter=5,
        start_context="Every effort moves you",
        tokenizer=tokenizer,
        checkpoint_path=CHECKPOINT_PATH,
    )

    print("\nFinal train loss:", train_losses[-1])
    print("Final val loss:  ", val_losses[-1])
    print("Checkpoint saved to:", CHECKPOINT_PATH)


if __name__ == "__main__":
    main()
