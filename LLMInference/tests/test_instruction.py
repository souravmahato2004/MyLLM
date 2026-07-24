"""Phase 5 — tests for the instruction data pipeline (format + collate)."""

from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src"))

from llm_core.instruction import (  # noqa: E402
    IGNORE_INDEX,
    InstructionDataset,
    collate_instruction_batch,
    format_input,
)
from llm_core.tokenizer import BPETokenizer  # noqa: E402


def test_format_input_adds_input_block_only_when_present():
    with_input = format_input({"instruction": "Sort these", "input": "3,1,2"})
    without_input = format_input({"instruction": "Say hi", "input": ""})
    assert "### Instruction:" in with_input
    assert "### Input:" in with_input
    assert "### Input:" not in without_input


def test_collate_pads_to_equal_length_and_masks_extra_padding():
    batch = [[1, 2, 3], [4, 5]]  # different lengths -> must be padded
    inputs, targets = collate_instruction_batch(batch, allowed_max_length=None)

    assert inputs.shape == targets.shape
    assert inputs.shape[0] == 2
    # target is input shifted by one: first target of row 0 is the 2nd input token
    assert targets[0, 0].item() == 2
    # the shorter row gets filler padding that must be ignored in the loss
    assert (targets[1] == IGNORE_INDEX).sum().item() >= 1


def test_dataset_produces_integer_token_lists():
    ds = InstructionDataset(
        [{"instruction": "Say hi", "input": "", "output": "Hi!"}], BPETokenizer()
    )
    assert len(ds) == 1
    assert all(isinstance(t, int) for t in ds[0])
