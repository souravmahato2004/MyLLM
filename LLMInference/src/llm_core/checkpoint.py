"""
Checkpoint save/load.

Saves model + optimizer state together so a training run can resume with
the optimizer's momentum/Adam moment estimates intact, not just the raw
weights. `config` is saved alongside so a checkpoint can be reloaded into a
freshly constructed `GPTModel` without the caller having to remember which
`GPTConfig` it was trained with.
"""

from __future__ import annotations

from pathlib import Path

import torch

from .config import GPTConfig
from .model import GPTModel


def save_checkpoint(
    model: GPTModel,
    optimizer: torch.optim.Optimizer,
    epoch: int,
    path: str | Path,
) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "config": model.config,
            "epoch": epoch,
        },
        path,
    )


def load_checkpoint(
    path: str | Path,
    device: torch.device | str = "cpu",
    optimizer: torch.optim.Optimizer | None = None,
) -> tuple[GPTModel, int]:
    """Rebuild a `GPTModel` (and optionally restore optimizer state) from a checkpoint.

    Returns the model (already moved to `device`, in eval mode) and the
    epoch it was saved at. Pass `optimizer` if resuming training rather than
    just running inference.
    """
    checkpoint = torch.load(path, map_location=device, weights_only=False)

    config: GPTConfig = checkpoint["config"]
    model = GPTModel(config)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    if optimizer is not None:
        optimizer.load_state_dict(checkpoint["optimizer_state_dict"])

    return model, checkpoint["epoch"]
