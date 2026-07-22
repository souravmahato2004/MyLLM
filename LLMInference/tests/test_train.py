import sys
import pathlib

import torch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src"))

from llm_core.config import GPT_CONFIG_TINY
from llm_core.model import GPTModel
from llm_core.dataset import create_dataloader_v1
from llm_core.loss import calc_loss_batch, calc_loss_loader
from llm_core.generate import generate_text
from llm_core.tokenizer import BPETokenizer
from llm_core.checkpoint import save_checkpoint, load_checkpoint
from llm_core.train import train_model_simple, get_device

SAMPLE_TEXT = (
    "In the heart of the old city stood a library older than memory itself. "
    "Every evening, as the sun dipped below the rooftops, the librarian would "
    "light a single candle and begin her rounds, checking that every book "
    "still remembered its own story. "
) * 20


def _make_loaders():
    split = int(0.9 * len(SAMPLE_TEXT))
    train_text, val_text = SAMPLE_TEXT[:split], SAMPLE_TEXT[split:]

    train_loader = create_dataloader_v1(
        train_text, batch_size=2, context_length=GPT_CONFIG_TINY.context_length, stride=8, shuffle=True
    )
    val_loader = create_dataloader_v1(
        val_text, batch_size=2, context_length=GPT_CONFIG_TINY.context_length, stride=8, shuffle=False
    )
    return train_loader, val_loader


def test_calc_loss_batch_is_a_positive_scalar():
    device = get_device()
    model = GPTModel(GPT_CONFIG_TINY)
    train_loader, _ = _make_loaders()
    input_batch, target_batch = next(iter(train_loader))

    loss = calc_loss_batch(input_batch, target_batch, model, device)
    assert loss.dim() == 0
    assert loss.item() > 0


def test_calc_loss_loader_averages_over_batches():
    device = get_device()
    model = GPTModel(GPT_CONFIG_TINY)
    train_loader, _ = _make_loaders()

    loss = calc_loss_loader(train_loader, model, device, num_batches=2)
    assert isinstance(loss, float)
    assert loss > 0


def test_generate_text_greedy_matches_deterministic_shape():
    tokenizer = BPETokenizer()
    model = GPTModel(GPT_CONFIG_TINY)

    encoded = tokenizer.encode("Hello, I am")
    idx = torch.tensor(encoded).unsqueeze(0)

    out = generate_text(model, idx, max_new_tokens=5, context_length=GPT_CONFIG_TINY.context_length, temperature=0.0)
    assert out.shape == (1, len(encoded) + 5)


def test_generate_text_with_temperature_and_top_k_runs():
    tokenizer = BPETokenizer()
    model = GPTModel(GPT_CONFIG_TINY)

    encoded = tokenizer.encode("Hello, I am")
    idx = torch.tensor(encoded).unsqueeze(0)

    out = generate_text(
        model, idx, max_new_tokens=5, context_length=GPT_CONFIG_TINY.context_length,
        temperature=1.0, top_k=10,
    )
    assert out.shape == (1, len(encoded) + 5)


def test_train_model_simple_reduces_loss_list_lengths_are_consistent():
    device = get_device()
    model = GPTModel(GPT_CONFIG_TINY)
    optimizer = torch.optim.AdamW(model.parameters(), lr=5e-4)
    tokenizer = BPETokenizer()
    train_loader, val_loader = _make_loaders()

    train_losses, val_losses, tokens_seen = train_model_simple(
        model, train_loader, val_loader, optimizer, device,
        num_epochs=1, eval_freq=1, eval_iter=1,
        start_context="Hello, I am", tokenizer=tokenizer,
    )

    assert len(train_losses) == len(val_losses) == len(tokens_seen)
    assert len(train_losses) > 0


def test_checkpoint_round_trip(tmp_path):
    model = GPTModel(GPT_CONFIG_TINY)
    optimizer = torch.optim.AdamW(model.parameters(), lr=5e-4)
    checkpoint_path = tmp_path / "model.pt"

    save_checkpoint(model, optimizer, epoch=3, path=checkpoint_path)
    loaded_model, epoch = load_checkpoint(checkpoint_path)

    assert epoch == 3
    original_params = list(model.state_dict().values())
    loaded_params = list(loaded_model.state_dict().values())
    assert all(torch.equal(a, b) for a, b in zip(original_params, loaded_params))
