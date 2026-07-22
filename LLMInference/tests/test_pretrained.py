import sys
import pathlib

import pytest
import torch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src"))

transformers = pytest.importorskip(
    "transformers", reason="transformers not installed; install it to test pretrained-weight loading"
)

import dataclasses

from llm_core.config import GPT_CONFIG_124M
from llm_core.model import GPTModel
from llm_core.loss import calc_loss_batch
from llm_core.pretrained import load_pretrained_gpt2_124m
from llm_core.tokenizer import BPETokenizer
from llm_core.train import get_device

SAMPLE_SENTENCE = "The quick brown fox jumps over the lazy dog, and then it ran away quickly into the forest."


def test_pretrained_weights_load_with_correct_shapes():
    device = get_device()
    model = load_pretrained_gpt2_124m(device=device)
    assert model.config.qkv_bias is True

    tokenizer = BPETokenizer()
    ids = tokenizer.encode("Hello, I am")
    idx = torch.tensor(ids).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(idx)
    assert logits.shape == (1, len(ids), GPT_CONFIG_124M.vocab_size)


def test_pretrained_loss_much_lower_than_random_init():
    """The real signal that weight-mapping is *correct*, not just shape-compatible:
    a wrong transpose/slice would still produce valid shapes but garbage
    predictions, so loss on real English text should stay near the random-init
    baseline. Correctly loaded GPT-2 should be dramatically better."""
    device = get_device()
    tokenizer = BPETokenizer()
    ids = tokenizer.encode(SAMPLE_SENTENCE)
    input_ids = torch.tensor(ids[:-1]).unsqueeze(0)
    target_ids = torch.tensor(ids[1:]).unsqueeze(0)

    pretrained = load_pretrained_gpt2_124m(device=device)
    pretrained_loss = calc_loss_batch(input_ids, target_ids, pretrained, device).item()

    random_config = dataclasses.replace(GPT_CONFIG_124M, qkv_bias=True)
    random_model = GPTModel(random_config).to(device)
    random_loss = calc_loss_batch(input_ids, target_ids, random_model, device).item()

    assert pretrained_loss < random_loss - 2.0
