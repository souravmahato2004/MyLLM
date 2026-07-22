import sys
import pathlib

import torch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src"))

from llm_core.config import GPT_CONFIG_TINY, GPT_CONFIG_124M
from llm_core.model import GPTModel
from llm_core.generate import generate_text_simple
from llm_core.tokenizer import BPETokenizer


def test_forward_pass_output_shape():
    model = GPTModel(GPT_CONFIG_TINY)
    batch = torch.randint(0, GPT_CONFIG_TINY.vocab_size, (2, 10))  # (batch=2, seq_len=10)
    logits = model(batch)
    assert logits.shape == (2, 10, GPT_CONFIG_TINY.vocab_size)


def test_124m_param_count_is_in_the_right_ballpark():
    model = GPTModel(GPT_CONFIG_124M)
    n_params = sum(p.numel() for p in model.parameters())
    # Real GPT-2 124M is ~163M raw params before weight tying; just sanity-check magnitude
    assert 100_000_000 < n_params < 250_000_000


def test_generate_text_simple_end_to_end():
    tokenizer = BPETokenizer()
    model = GPTModel(GPT_CONFIG_TINY)

    prompt = "Hello, I am"
    encoded = tokenizer.encode(prompt)
    idx = torch.tensor(encoded).unsqueeze(0)  # add batch dimension

    out = generate_text_simple(model, idx, max_new_tokens=5, context_length=GPT_CONFIG_TINY.context_length)
    assert out.shape == (1, len(encoded) + 5)

    decoded = tokenizer.decode(out.squeeze(0).tolist())
    assert isinstance(decoded, str) and len(decoded) > 0
