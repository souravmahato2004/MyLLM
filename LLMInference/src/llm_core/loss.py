"""
Cross-entropy loss for next-token prediction.

The model outputs logits of shape (batch, seq_len, vocab_size); the targets
are token IDs of shape (batch, seq_len). `cross_entropy` wants a flat batch
of class-score rows against a flat batch of class indices, so both get
flattened over the (batch, seq_len) dimensions before comparison.
"""

from __future__ import annotations

import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader

from .model import GPTModel


def calc_loss_batch(
    input_batch: torch.Tensor,
    target_batch: torch.Tensor,
    model: GPTModel,
    device: torch.device,
) -> torch.Tensor:
    input_batch = input_batch.to(device)
    target_batch = target_batch.to(device)

    logits = model(input_batch)
    loss = F.cross_entropy(logits.flatten(0, 1), target_batch.flatten())
    return loss


def calc_loss_loader(
    data_loader: DataLoader,
    model: GPTModel,
    device: torch.device,
    num_batches: int | None = None,
) -> float:
    """Average loss over `num_batches` batches of `data_loader` (all of it if None).

    Used for both train-loss and val-loss reporting, so eval passes don't
    have to iterate the entire (possibly large) loader every time.
    """
    if len(data_loader) == 0:
        return float("nan")

    if num_batches is None:
        num_batches = len(data_loader)
    else:
        num_batches = min(num_batches, len(data_loader))

    total_loss = 0.0
    for i, (input_batch, target_batch) in enumerate(data_loader):
        if i >= num_batches:
            break
        loss = calc_loss_batch(input_batch, target_batch, model, device)
        total_loss += loss.item()

    return total_loss / num_batches
