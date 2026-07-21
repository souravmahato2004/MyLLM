"""
PyTorch Dataset/DataLoader for next-token-prediction training.

Turns raw text into (input, target) chunks using a sliding window over
the token-ID stream:

    tokens:  [t0, t1, t2, t3, t4, t5, ...]
    input:   [t0, t1, t2, t3]          (context_length = 4)
    target:  [t1, t2, t3, t4]          (input shifted right by 1)

`stride` controls how far the window moves between samples. stride ==
context_length gives non-overlapping chunks (no data reuse); stride <
context_length overlaps windows, which is the usual choice for small
corpora since it multiplies the number of training examples.
"""

from __future__ import annotations

import torch
from torch.utils.data import Dataset, DataLoader

from .tokenizer import BPETokenizer


class GPTDatasetV1(Dataset):
    """Sliding-window dataset of (input_ids, target_ids) pairs."""

    def __init__(self, text: str, tokenizer: BPETokenizer, context_length: int, stride: int) -> None:
        self.input_ids: list[torch.Tensor] = []
        self.target_ids: list[torch.Tensor] = []

        token_ids = tokenizer.encode(text)
        if len(token_ids) <= context_length:
            raise ValueError(
                f"Corpus has only {len(token_ids)} tokens, which is too few for a "
                f"context_length of {context_length}. Use a longer text or a smaller context_length."
            )

        # Slide a fixed-size window across the token stream, stepping by `stride`.
        for i in range(0, len(token_ids) - context_length, stride):
            input_chunk = token_ids[i : i + context_length]
            target_chunk = token_ids[i + 1 : i + context_length + 1]
            self.input_ids.append(torch.tensor(input_chunk, dtype=torch.long))
            self.target_ids.append(torch.tensor(target_chunk, dtype=torch.long))

    def __len__(self) -> int:
        return len(self.input_ids)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor]:
        return self.input_ids[idx], self.target_ids[idx]


def create_dataloader_v1(
    text: str,
    batch_size: int = 4,
    context_length: int = 256,
    stride: int = 128,
    shuffle: bool = True,
    drop_last: bool = True,
    num_workers: int = 0,
) -> DataLoader:
    """Build a DataLoader that yields (input_ids, target_ids) batches.

    drop_last=True avoids a smaller-than-batch_size final batch, which would
    otherwise produce loss spikes during training.
    """
    tokenizer = BPETokenizer()
    dataset = GPTDatasetV1(text, tokenizer, context_length, stride)

    return DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        drop_last=drop_last,
        num_workers=num_workers,
    )


if __name__ == "__main__":
    # Minimal smoke test using an inline string so this runs with no external
    # data file required. Swap in data/raw/the-verdict.txt once it's downloaded
    # (see scripts/download_sample_data.py).
    demo_text = (
        "In the heart of the old city stood a library older than memory itself. "
        "Every evening, as the sun dipped below the rooftops, the librarian would "
        "light a single candle and begin her rounds, checking that every book "
        "still remembered its own story. "
    ) * 20  # repeated to have enough tokens for the demo window sizes below

    dataloader = create_dataloader_v1(
        demo_text, batch_size=2, context_length=8, stride=4, shuffle=False
    )

    data_iter = iter(dataloader)
    inputs, targets = next(data_iter)
    print("Inputs shape: ", inputs.shape)
    print("Inputs:\n", inputs)
    print("Targets:\n", targets)
