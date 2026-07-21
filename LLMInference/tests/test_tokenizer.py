import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src"))

from llm_core.tokenizer import BPETokenizer


def test_roundtrip_encode_decode():
    tokenizer = BPETokenizer()
    text = "Hello, do you like tea?"
    assert tokenizer.decode(tokenizer.encode(text)) == text


def test_vocab_size_matches_gpt2():
    tokenizer = BPETokenizer()
    assert tokenizer.vocab_size == 50257


def test_endoftext_special_token_is_encoded_as_single_id():
    tokenizer = BPETokenizer()
    ids = tokenizer.encode("<|endoftext|>")
    assert ids == [50256]
