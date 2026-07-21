"""
Byte Pair Encoding (BPE) tokenizer wrapper.

Uses OpenAI's `tiktoken` library with the "gpt2" encoding — the same
vocabulary (50,257 tokens) used by the original GPT-2 model. Wrapping it
in a small class keeps the rest of the pipeline decoupled from the
underlying tokenizer library, so it can be swapped later without touching
the dataset/model code.
"""

from __future__ import annotations

import tiktoken


class BPETokenizer:
    """Thin wrapper around tiktoken's GPT-2 byte-pair encoder."""

    def __init__(self, encoding_name: str = "gpt2") -> None:
        self._encoding = tiktoken.get_encoding(encoding_name)
        # <|endoftext|> is GPT-2's document-separator token. Allowing it
        # explicitly lets us insert it between concatenated documents
        # without tiktoken raising on a "special" token.
        self._allowed_special = {"<|endoftext|>"}

    @property
    def vocab_size(self) -> int:
        return self._encoding.n_vocab

    def encode(self, text: str) -> list[int]:
        return self._encoding.encode(text, allowed_special=self._allowed_special)

    def decode(self, token_ids: list[int]) -> str:
        return self._encoding.decode(token_ids)


if __name__ == "__main__":
    tokenizer = BPETokenizer()
    sample = "Hello, do you like tea? <|endoftext|> In the sunlit terraces..."

    ids = tokenizer.encode(sample)
    decoded = tokenizer.decode(ids)

    print(f"Vocab size: {tokenizer.vocab_size}")
    print(f"Text:    {sample}")
    print(f"Token IDs: {ids}")
    print(f"Decoded: {decoded}")
    assert decoded == sample, "Round-trip encode/decode should be lossless"
