import sys
import pathlib

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src"))

from llm_core.dataset import create_dataloader_v1

SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog. " * 30


def test_batch_shapes():
    dataloader = create_dataloader_v1(
        SAMPLE_TEXT, batch_size=4, context_length=16, stride=8, shuffle=False
    )
    inputs, targets = next(iter(dataloader))
    assert inputs.shape == (4, 16)
    assert targets.shape == (4, 16)


def test_target_is_input_shifted_by_one():
    dataloader = create_dataloader_v1(
        SAMPLE_TEXT, batch_size=1, context_length=16, stride=8, shuffle=False
    )
    inputs, targets = next(iter(dataloader))
    assert (targets[:, :-1] == inputs[:, 1:]).all()


def test_raises_on_corpus_shorter_than_context_length():
    with pytest.raises(ValueError):
        create_dataloader_v1("too short", batch_size=1, context_length=64, stride=1)
