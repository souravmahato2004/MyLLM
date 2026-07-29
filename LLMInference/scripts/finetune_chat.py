"""
Phase 5 — instruction fine-tune GPT-2 into a chat model.

Starts from OpenAI's pretrained weights (via load_pretrained_gpt2, size chosen
by MODEL_SIZE below) and fine-tunes on the chat dataset (Dolly-15k) so the
model learns to *respond* to an
instruction instead of just continuing text. Reuses the Phase 3 training loop
(train_model_simple) as-is.

CPU-only note: this is slow. Do a smoke run first with MAX_ENTRIES = 100 to
confirm the pipeline end-to-end, then set it back to None for the real run.
"""

from __future__ import annotations

import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src"))

import torch
from torch.utils.data import DataLoader

from llm_core.instruction import (
    InstructionDataset,
    collate_instruction_batch,
    format_input,
)
from llm_core.pretrained import load_pretrained_gpt2
from llm_core.tokenizer import BPETokenizer
from llm_core.train import get_device, train_model_simple

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "instruction" / "dolly-15k.json"
CHECKPOINT_PATH = PROJECT_ROOT / "data" / "checkpoints" / "gpt2_chat.pt"

# --- Knobs -----------------------------------------------------------------
MODEL_SIZE = "124M"   # "124M" (faster) or "355M" (better quality, ~3x slower)
MAX_ENTRIES = None    # Dolly has ~15k; subset for a sane CPU run (None = all).
                      # Tip: set 100 for a quick end-to-end smoke test first.
NUM_EPOCHS = 1
BATCH_SIZE = 2        # small on purpose: CPU-only, keeps memory/time sane
LEARNING_RATE = 5e-5
WEIGHT_DECAY = 0.1
# ---------------------------------------------------------------------------


def main() -> None:
    device = get_device()
    tokenizer = BPETokenizer()

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    if MAX_ENTRIES is not None:
        data = data[:MAX_ENTRIES]

    train_end = int(len(data) * 0.85)
    val_end = train_end + int(len(data) * 0.05)
    train_data, val_data = data[:train_end], data[train_end:val_end]
    print(f"{len(data)} entries -> {len(train_data)} train, {len(val_data)} val")

    train_loader = DataLoader(
        InstructionDataset(train_data, tokenizer),
        batch_size=BATCH_SIZE, shuffle=True, drop_last=True,
        collate_fn=collate_instruction_batch, num_workers=0,
    )
    val_loader = DataLoader(
        InstructionDataset(val_data, tokenizer),
        batch_size=BATCH_SIZE, shuffle=False, drop_last=False,
        collate_fn=collate_instruction_batch, num_workers=0,
    )

    print(f"Loading pretrained GPT-2 {MODEL_SIZE} as the starting point...")
    model = load_pretrained_gpt2(MODEL_SIZE, device=device)

    optimizer = torch.optim.AdamW(
        model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY
    )

    # Per-epoch qualitative sample: watch a held-out instruction get answered.
    start_context = format_input(val_data[0]) + "\n\n### Response:\n"

    print("Fine-tuning. On CPU this is SLOW (many minutes per epoch)...\n")
    train_model_simple(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        optimizer=optimizer,
        device=device,
        num_epochs=NUM_EPOCHS,
        eval_freq=5,
        eval_iter=5,
        start_context=start_context,
        tokenizer=tokenizer,
        checkpoint_path=str(CHECKPOINT_PATH),
    )
    print(f"\nDone. Fine-tuned checkpoint saved to {CHECKPOINT_PATH}")


if __name__ == "__main__":
    main()
