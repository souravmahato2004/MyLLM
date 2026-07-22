"""
Training loop: forward -> loss -> backward -> optimizer step, with periodic
train/val loss tracking and a qualitative sample generation per epoch so
you can watch the model's output stop being pure noise over time.

Device selection is abstracted behind `get_device()` rather than hardcoded
to CPU: this machine has no CUDA (AMD RX 6600M), but PyTorch's DirectML
backend (`torch-directml`, a separate pip install) can target this GPU via
DirectX 12. Pass `use_dml=True` once that package is installed and verified
working; until then this defaults to CPU with no behavior change.
"""

from __future__ import annotations

import torch

from .checkpoint import save_checkpoint
from .generate import generate_text_simple
from .loss import calc_loss_batch, calc_loss_loader
from .model import GPTModel
from .tokenizer import BPETokenizer


def get_device(use_dml: bool = False) -> torch.device:
    if use_dml:
        import torch_directml  # noqa: PLC0415 - optional dependency, only imported if requested

        return torch_directml.device()
    return torch.device("cpu")


def evaluate_model(
    model: GPTModel,
    train_loader,
    val_loader,
    device: torch.device,
    eval_iter: int,
) -> tuple[float, float]:
    """Loss on a capped number of batches from each loader — cheap enough to
    call mid-epoch without materially slowing down training."""
    model.eval()
    with torch.no_grad():
        train_loss = calc_loss_loader(train_loader, model, device, num_batches=eval_iter)
        val_loss = calc_loss_loader(val_loader, model, device, num_batches=eval_iter)
    model.train()
    return train_loss, val_loss


def generate_and_print_sample(
    model: GPTModel,
    tokenizer: BPETokenizer,
    device: torch.device,
    start_context: str,
) -> None:
    model.eval()
    context_length = model.config.context_length
    encoded = tokenizer.encode(start_context)
    idx = torch.tensor(encoded).unsqueeze(0).to(device)

    with torch.no_grad():
        token_ids = generate_text_simple(model, idx, max_new_tokens=50, context_length=context_length)

    decoded_text = tokenizer.decode(token_ids.squeeze(0).tolist())
    print(decoded_text.replace("\n", " "))
    model.train()


def train_model_simple(
    model: GPTModel,
    train_loader,
    val_loader,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
    num_epochs: int,
    eval_freq: int,
    eval_iter: int,
    start_context: str,
    tokenizer: BPETokenizer,
    checkpoint_path: str | None = None,
) -> tuple[list[float], list[float], list[int]]:
    """Train `model` for `num_epochs`, evaluating every `eval_freq` steps.

    Returns (train_losses, val_losses, tokens_seen) sampled at each eval
    point, for plotting a loss curve afterwards. If `checkpoint_path` is
    given, saves model+optimizer state at the end of every epoch.
    """
    train_losses, val_losses, track_tokens_seen = [], [], []
    tokens_seen, global_step = 0, -1

    model.to(device)

    for epoch in range(num_epochs):
        model.train()
        for input_batch, target_batch in train_loader:
            optimizer.zero_grad()
            loss = calc_loss_batch(input_batch, target_batch, model, device)
            loss.backward()
            optimizer.step()

            tokens_seen += input_batch.numel()
            global_step += 1

            if global_step % eval_freq == 0:
                train_loss, val_loss = evaluate_model(model, train_loader, val_loader, device, eval_iter)
                train_losses.append(train_loss)
                val_losses.append(val_loss)
                track_tokens_seen.append(tokens_seen)
                print(
                    f"Epoch {epoch + 1} (step {global_step:06d}): "
                    f"train loss {train_loss:.3f}, val loss {val_loss:.3f}"
                )

        generate_and_print_sample(model, tokenizer, device, start_context)

        if checkpoint_path is not None:
            save_checkpoint(model, optimizer, epoch, checkpoint_path)

    return train_losses, val_losses, track_tokens_seen
