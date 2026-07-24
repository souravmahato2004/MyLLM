"""
Phase 5 — interactive chat against the instruction fine-tuned model.

Unlike scripts/chat_pretrained.py (which needed few-shot priming to coax the
base model into answering), this loads the fine-tuned checkpoint, so a plain
instruction wrapped in the training prompt format is enough. Each turn is
still independent — no multi-turn memory yet.
"""

from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src"))

import torch

from llm_core.checkpoint import load_checkpoint
from llm_core.generate import generate_text
from llm_core.instruction import PAD_TOKEN_ID, format_input
from llm_core.tokenizer import BPETokenizer
from llm_core.train import get_device

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
CHECKPOINT_PATH = PROJECT_ROOT / "data" / "checkpoints" / "gpt2_124m_chat.pt"


def _print(text: str) -> None:
    # Windows cp1252 consoles choke on some tokens; force UTF-8 bytes out.
    sys.stdout.buffer.write(text.encode("utf-8", errors="replace"))
    sys.stdout.buffer.write(b"\n")
    sys.stdout.flush()


def extract_response(generated_text: str, prompt: str) -> str:
    answer = generated_text[len(prompt):]
    # Cut off if the model hallucinates a new section after its answer.
    for stop in ("### Instruction:", "### Input:", "### Response:", "<|endoftext|>"):
        answer = answer.split(stop)[0]
    return answer.strip()


def main() -> None:
    device = get_device()
    tokenizer = BPETokenizer()

    print(f"Loading fine-tuned checkpoint: {CHECKPOINT_PATH}")
    model, _ = load_checkpoint(CHECKPOINT_PATH, device=device)
    print("Ready. Type an instruction (blank line or 'quit' to exit).\n")

    while True:
        try:
            user = input("You: ")
        except EOFError:
            break
        if not user.strip() or user.strip().lower() in {"quit", "exit"}:
            break

        prompt = format_input({"instruction": user, "input": ""}) + "\n\n### Response:\n"
        idx = torch.tensor(tokenizer.encode(prompt)).unsqueeze(0).to(device)

        out = generate_text(
            model, idx,
            max_new_tokens=256,
            context_length=model.config.context_length,
            temperature=0.0,       # greedy = most coherent for a small model
            eos_id=PAD_TOKEN_ID,   # stop when it emits <|endoftext|>
        )
        decoded = tokenizer.decode(out.squeeze(0).tolist())
        _print("Bot: " + extract_response(decoded, prompt))
        print()


if __name__ == "__main__":
    main()
