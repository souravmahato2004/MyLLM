"""
Interactive REPL against the pretrained GPT-2 124M weights.

Important: this is *not* a chatbot yet. Real GPT-2 was only trained on
next-token prediction over raw web text (no instruction-following or
dialogue fine-tuning), so it doesn't "answer" what you type the way
ChatGPT would — it just continues it, like autocomplete. To nudge it
toward answering rather than drifting into unrelated text, each of your
prompts is wrapped in a short "Q: ... A:" template with one worked example
ahead of it (few-shot priming) — a real technique, but a mitigation, not a
fix. Turning this into something that reliably behaves like a
conversational assistant is exactly what Phase 5 (instruction fine-tuning)
is for.

Each turn is independent — there's no conversation memory carried between
prompts, since a base model has no notion of "the last thing I said."
"""

from __future__ import annotations

import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src"))

import torch

from llm_core.pretrained import load_pretrained_gpt2
from llm_core.generate import generate_text
from llm_core.tokenizer import BPETokenizer
from llm_core.train import get_device

# Which base model to try: "124M" or "355M" (bigger = better, ~3x slower on CPU).
MODEL_SIZE = "124M"

FEW_SHOT_PRIMER = (
    "Q: What is the capital of France?\n"
    "A: The capital of France is Paris.\n\n"
)


def _print(text: str) -> None:
    # Avoids UnicodeEncodeError on Windows cp1252 consoles for characters
    # GPT-2 sometimes emits (em dashes, smart quotes, etc.)
    sys.stdout.buffer.write(text.encode("utf-8", errors="replace"))
    sys.stdout.buffer.write(b"\n")
    sys.stdout.flush()


def main() -> None:
    device = get_device()
    tokenizer = BPETokenizer()

    print(f"Loading pretrained GPT-2 {MODEL_SIZE} weights...")
    model = load_pretrained_gpt2(MODEL_SIZE, device=device)
    print("Ready. Type a prompt and press Enter (blank line or 'quit' to exit).")
    print("Reminder: this is raw GPT-2, not a fine-tuned chatbot - expect autocomplete-style answers.\n")

    while True:
        try:
            prompt = input("You: ")
        except EOFError:
            break
        if not prompt.strip() or prompt.strip().lower() in {"quit", "exit"}:
            break

        wrapped_prompt = FEW_SHOT_PRIMER + f"Q: {prompt}\nA:"
        encoded = tokenizer.encode(wrapped_prompt)
        idx = torch.tensor(encoded).unsqueeze(0).to(device)

        out = generate_text(
            model, idx,
            max_new_tokens=60,
            context_length=model.config.context_length,
            temperature=0.7,
            top_k=40,
        )
        decoded = tokenizer.decode(out.squeeze(0).tolist())

        # Only show what comes after our own prompt, and cut at the next
        # "Q:" if the model starts hallucinating a follow-up question.
        answer = decoded[len(wrapped_prompt):].split("Q:")[0].strip()

        _print("GPT-2: " + answer)
        print()


if __name__ == "__main__":
    main()
