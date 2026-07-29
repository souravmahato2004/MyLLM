"""
Kaggle GPU fine-tuning entrypoint — RESUMABLE, one-epoch-per-run.

This is the script you run on a Kaggle notebook. It fine-tunes GPT-2 on the
Dolly-15k chat dataset and is built for repeated single-epoch runs:

  * Run 1  -> no checkpoint yet, so it starts from OpenAI's pretrained GPT-2.
  * Run 2+ -> it finds the previous run's checkpoint (mounted as a read-only
              input dataset), restores BOTH the model weights and the optimizer
              state, and trains exactly one more epoch. Momentum carries across
              runs, so it's as if training never stopped.

It reuses your existing `llm_core` package unchanged — nothing in `src/` needs
editing. It also runs locally (falls back to CPU + project paths) if you want
to smoke-test the import before uploading.

Knobs are read from environment variables so you can tweak them from a notebook
cell without editing this (read-only on Kaggle) file. See notebook_cells.py.
"""

from __future__ import annotations

import json
import os
import pathlib
import sys

import torch


# --------------------------------------------------------------------------
# Locate the source + data. On Kaggle we search /kaggle/input so it doesn't
# matter how deeply your uploaded zip nested the folders.
# --------------------------------------------------------------------------
def _find_src_root() -> pathlib.Path:
    """Return the directory that contains the `llm_core` package."""
    for p in pathlib.Path("/kaggle/input").rglob("llm_core"):
        if (p / "tokenizer.py").exists():
            return p.parent  # the 'src' dir holding llm_core/
    raise FileNotFoundError(
        "Could not find the llm_core package under /kaggle/input — did you add "
        "the 'myllm-src' dataset as an input to this notebook?"
    )


def _find_data() -> pathlib.Path:
    for p in pathlib.Path("/kaggle/input").rglob("dolly-15k.json"):
        return p
    raise FileNotFoundError(
        "Could not find dolly-15k.json under /kaggle/input — make sure it's "
        "included in the 'myllm-src' dataset."
    )


ON_KAGGLE = pathlib.Path("/kaggle").exists()

if ON_KAGGLE:
    SRC_ROOT = _find_src_root()
    DATA_PATH = _find_data()
    # This run ALWAYS writes its checkpoint to the writable OUTPUT dir.
    CHECKPOINT_PATH = pathlib.Path("/kaggle/working/gpt2_chat.pt")
    # Where to look for a checkpoint to resume from, in priority order:
    #   1. this session's own output — so re-running for another epoch in the
    #      SAME session "just works" with no dataset juggling; then
    #   2. the persisted input dataset from a PREVIOUS session (working dir is
    #      wiped between sessions, so cross-session resume needs this).
    RESUME_CANDIDATES = [
        CHECKPOINT_PATH,
        pathlib.Path("/kaggle/input/gpt2-chat-ckpt/gpt2_chat.pt"),
    ]
    HF_CACHE_DIR = pathlib.Path("/kaggle/working/hf-cache")
else:
    PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
    SRC_ROOT = PROJECT_ROOT / "src"
    DATA_PATH = PROJECT_ROOT / "data" / "instruction" / "dolly-15k.json"
    CHECKPOINT_PATH = PROJECT_ROOT / "data" / "checkpoints" / "gpt2_chat.pt"
    RESUME_CANDIDATES = [CHECKPOINT_PATH]
    HF_CACHE_DIR = None

sys.path.insert(0, str(SRC_ROOT))

# Imports from llm_core must come AFTER sys.path is set up above.
from llm_core.checkpoint import load_checkpoint, save_checkpoint  # noqa: E402
from llm_core.instruction import (  # noqa: E402
    InstructionDataset,
    collate_instruction_batch,
    format_input,
)
from llm_core.generate import generate_text_simple  # noqa: E402
from llm_core.loss import calc_loss_batch, calc_loss_loader  # noqa: E402
from llm_core.pretrained import load_pretrained_gpt2  # noqa: E402
from llm_core.tokenizer import BPETokenizer  # noqa: E402
from torch.utils.data import DataLoader  # noqa: E402


# --- Knobs (overridable via environment variables) -------------------------
MODEL_SIZE = os.environ.get("MODEL_SIZE", "124M")          # "124M" or "355M"
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "8"))         # raise if GPU has room
NUM_EPOCHS = int(os.environ.get("NUM_EPOCHS", "1"))         # one epoch per run
LEARNING_RATE = float(os.environ.get("LEARNING_RATE", "5e-5"))
WEIGHT_DECAY = float(os.environ.get("WEIGHT_DECAY", "0.1"))
_max = os.environ.get("MAX_ENTRIES")                        # e.g. "100" for a smoke test
MAX_ENTRIES = int(_max) if _max else None                  # None = use all ~15k
# ---------------------------------------------------------------------------


def get_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def build_model_and_optimizer(device):
    """Resume from RESUME_FROM if it exists, else start from pretrained GPT-2.

    Returns (model, optimizer, start_epoch): start_epoch = how many epochs of
    fine-tuning already happened (0 on the very first run).
    """
    optimizer_kwargs = dict(lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)

    resume_from = next((p for p in RESUME_CANDIDATES if p.exists()), None)

    if resume_from is not None:
        print(f"Resuming from checkpoint: {resume_from}")
        model, saved_epoch = load_checkpoint(resume_from, device=device)
        optimizer = torch.optim.AdamW(model.parameters(), **optimizer_kwargs)
        # Restore Adam moment estimates so momentum carries across runs.
        ckpt = torch.load(resume_from, map_location=device, weights_only=False)
        optimizer.load_state_dict(ckpt["optimizer_state_dict"])
        start_epoch = saved_epoch + 1
        print(f"  (already trained {start_epoch} epoch(s))")
    else:
        print(f"No checkpoint found; starting from pretrained GPT-2 {MODEL_SIZE}")
        model = load_pretrained_gpt2(MODEL_SIZE, device=device, cache_dir=HF_CACHE_DIR)
        optimizer = torch.optim.AdamW(model.parameters(), **optimizer_kwargs)
        start_epoch = 0
    return model, optimizer, start_epoch


def _bare(model):
    """The underlying GPTModel, whether or not it's wrapped in DataParallel.

    DataParallel hides the real model behind `.module`, so anything that needs
    the actual GPTModel (its `.config`, a clean state_dict for checkpoints,
    single-sequence generation) must go through this.
    """
    return model.module if isinstance(model, torch.nn.DataParallel) else model


def evaluate(model, train_loader, val_loader, device, eval_iter, amp_enabled=False):
    model.eval()
    with torch.no_grad(), torch.autocast(
        device_type="cuda", dtype=torch.float16, enabled=amp_enabled
    ):
        train_loss = calc_loss_loader(train_loader, model, device, num_batches=eval_iter)
        val_loss = calc_loss_loader(val_loader, model, device, num_batches=eval_iter)
    model.train()
    return train_loss, val_loss


def generate_sample(model, tokenizer, device, start_context):
    """Qualitative peek: generation is single-sequence, so run it on the bare
    model (DataParallel only helps for multi-example batches)."""
    bare = _bare(model)
    bare.eval()
    idx = torch.tensor(tokenizer.encode(start_context)).unsqueeze(0).to(device)
    with torch.no_grad():
        token_ids = generate_text_simple(
            bare, idx, max_new_tokens=50, context_length=bare.config.context_length
        )
    print(tokenizer.decode(token_ids.squeeze(0).tolist()).replace("\n", " "))
    bare.train()


def train_epochs(
    model, train_loader, val_loader, optimizer, device,
    num_epochs, start_epoch, eval_freq, eval_iter,
    start_context, tokenizer, checkpoint_path,
):
    """Train for `num_epochs`, saving a checkpoint at the END OF EVERY EPOCH.

    Per-epoch saving matters for a long (e.g. 10-epoch) run: if the Kaggle
    session times out at epoch 7, you still keep epoch 6 and resume from it.
    The saved epoch number is cumulative (start_epoch + offset), and we always
    save the *bare* model so the checkpoint stays a plain GPTModel — loadable
    by your local InferenceEngine with no DataParallel involved.

    Mixed precision (fp16 via autocast + GradScaler) runs the heavy matmuls in
    half precision on the GPU's tensor cores — ~2x faster and ~half the memory —
    while a fp32 master copy of the weights and fp32 loss keep it numerically
    stable. GradScaler multiplies the loss up before backward so small fp16
    gradients don't underflow to zero, then unscales before the optimizer step.
    Disabled automatically on CPU (fp16 autocast only helps on CUDA).
    """
    amp_enabled = device.type == "cuda"
    scaler = torch.amp.GradScaler("cuda", enabled=amp_enabled)
    print(f"Mixed precision (fp16): {'ON' if amp_enabled else 'OFF (CPU)'}\n")

    global_step = -1
    for e in range(num_epochs):
        epoch_num = start_epoch + e
        model.train()
        for input_batch, target_batch in train_loader:
            optimizer.zero_grad()
            with torch.autocast(device_type="cuda", dtype=torch.float16, enabled=amp_enabled):
                loss = calc_loss_batch(input_batch, target_batch, model, device)
            scaler.scale(loss).backward()   # scale up, then backprop
            scaler.step(optimizer)          # unscale + optimizer.step() (skips step on inf/nan)
            scaler.update()                 # adjust the scale factor for next step
            global_step += 1
            if global_step % eval_freq == 0:
                tr, vl = evaluate(model, train_loader, val_loader, device, eval_iter, amp_enabled)
                print(f"Epoch {epoch_num + 1} (step {global_step:06d}): "
                      f"train loss {tr:.3f}, val loss {vl:.3f}")

        generate_sample(model, tokenizer, device, start_context)
        save_checkpoint(_bare(model), optimizer, epoch_num, checkpoint_path)
        print(f"  saved checkpoint through epoch {epoch_num + 1} -> {checkpoint_path}\n")


def main() -> None:
    device = get_device()
    n_gpus = torch.cuda.device_count() if device.type == "cuda" else 0
    print(f"Device: {device}  |  GPUs visible: {n_gpus}  |  data: {DATA_PATH}")
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

    model, optimizer, start_epoch = build_model_and_optimizer(device)

    # Use every visible GPU. DataParallel splits each batch across them, so an
    # effective BATCH_SIZE of 8 becomes 4-per-GPU — both cards work, and the
    # per-GPU memory is halved (which is what fixes the batch-8 OOM).
    if n_gpus > 1:
        print(f"Using DataParallel across {n_gpus} GPUs "
              f"(batch {BATCH_SIZE} -> ~{BATCH_SIZE // n_gpus} per GPU).")
        model = torch.nn.DataParallel(model)

    start_context = format_input(val_data[0]) + "\n\n### Response:\n"

    print(f"\nFine-tuning epoch(s) {start_epoch + 1}..{start_epoch + NUM_EPOCHS}\n")
    train_epochs(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        optimizer=optimizer,
        device=device,
        num_epochs=NUM_EPOCHS,
        start_epoch=start_epoch,
        eval_freq=50,
        eval_iter=5,
        start_context=start_context,
        tokenizer=tokenizer,
        checkpoint_path=CHECKPOINT_PATH,
    )
    print(f"Done. Latest checkpoint at {CHECKPOINT_PATH}")


if __name__ == "__main__":
    main()
