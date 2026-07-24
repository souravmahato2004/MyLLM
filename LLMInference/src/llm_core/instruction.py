"""
Instruction fine-tuning data pipeline (Phase 5 — chatting).

Unlike `dataset.py` (a sliding window over one long text stream), instruction
tuning has many *independent, variable-length* examples. That needs two things
`dataset.py` doesn't:

  1. Padding — examples in a batch differ in length, so shorter ones get
     padded with <|endoftext|> (50256) up to the batch's longest.
  2. Loss masking — we don't want the model penalised for what it predicts at
     those padding positions, so in the *targets* every padding token past the
     first is set to -100. `F.cross_entropy` ignores -100 by default, so
     `calc_loss_batch` needs no change at all. (The first padding token is kept
     as a real target: that's the end-of-response signal we DO want it to learn.)

Prompt format is the Alpaca style the book uses: a fixed preamble, then
"### Instruction:", an optional "### Input:", and "### Response:".
"""

from __future__ import annotations

import torch
from torch.utils.data import Dataset

from .tokenizer import BPETokenizer

PAD_TOKEN_ID = 50256   # GPT-2's <|endoftext|>, reused as the pad / end token
IGNORE_INDEX = -100    # cross_entropy skips these target positions

PROMPT_PREAMBLE = (
    "Below is an instruction that describes a task. "
    "Write a response that appropriately completes the request."
)


def format_input(entry: dict) -> str:
    """Render one entry into the prompt text *without* the response.

    The response is appended separately during training; at inference we stop
    right after "### Response:\\n" and let the model generate the rest.
    """
    instruction = f"\n\n### Instruction:\n{entry['instruction']}"
    # Many entries have an empty "input"; only add that block when it's present.
    input_block = f"\n\n### Input:\n{entry['input']}" if entry.get("input") else ""
    return PROMPT_PREAMBLE + instruction + input_block


class InstructionDataset(Dataset):
    """Pre-tokenizes each entry into a flat list of (prompt + response) IDs."""

    def __init__(self, data: list[dict], tokenizer: BPETokenizer) -> None:
        self.encoded_texts: list[list[int]] = []
        for entry in data:
            prompt = format_input(entry)
            response = f"\n\n### Response:\n{entry['output']}"
            self.encoded_texts.append(tokenizer.encode(prompt + response))

    def __len__(self) -> int:
        return len(self.encoded_texts)

    def __getitem__(self, idx: int) -> list[int]:
        return self.encoded_texts[idx]


def collate_instruction_batch(
    batch: list[list[int]],
    pad_token_id: int = PAD_TOKEN_ID,
    ignore_index: int = IGNORE_INDEX,
    allowed_max_length: int | None = 1024,
) -> tuple[torch.Tensor, torch.Tensor]:
    """Turn a list of variable-length token lists into aligned (inputs, targets).

    For each example: append one end token, right-pad to the batch's longest,
    then split into input (all but last) and target (shifted by one). Every
    padding token in the target *after the first* becomes -100 so the loss
    ignores it.
    """
    batch_max_len = max(len(item) + 1 for item in batch)  # +1 for the end token

    inputs_list, targets_list = [], []
    for item in batch:
        new_item = item + [pad_token_id]  # append exactly one end token
        padded = new_item + [pad_token_id] * (batch_max_len - len(new_item))

        inputs = torch.tensor(padded[:-1], dtype=torch.long)
        targets = torch.tensor(padded[1:], dtype=torch.long)

        # Mask every padding token in the target except the first real end token.
        pad_positions = torch.nonzero(targets == pad_token_id).squeeze(-1)
        if pad_positions.numel() > 1:
            targets[pad_positions[1:]] = ignore_index

        if allowed_max_length is not None:
            inputs = inputs[:allowed_max_length]
            targets = targets[:allowed_max_length]

        inputs_list.append(inputs)
        targets_list.append(targets)

    return torch.stack(inputs_list), torch.stack(targets_list)
