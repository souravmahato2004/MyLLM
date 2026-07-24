"""
Inference engine: the bridge between the HTTP layer and `llm_core`.

Holds the loaded model + tokenizer and turns a plain instruction into a
response, reusing exactly the same prompt-format / generate / extract logic
as scripts/chat.py (so the API answers identically to the local REPL).
Constructed once at app startup; a single instance serves every request.
"""

from __future__ import annotations

import torch

from llm_core.checkpoint import load_checkpoint
from llm_core.generate import generate_text
from llm_core.instruction import PAD_TOKEN_ID, format_input
from llm_core.tokenizer import BPETokenizer
from llm_core.train import get_device


class InferenceEngine:
    def __init__(self, checkpoint_path: str) -> None:
        self.device = get_device()
        self.tokenizer = BPETokenizer()
        # load_checkpoint rebuilds the model from the saved config + weights,
        # already moved to device and in eval mode.
        self.model, _ = load_checkpoint(checkpoint_path, device=self.device)

    def _build_prompt(self, instruction: str, input_text: str = "") -> str:
        return (
            format_input({"instruction": instruction, "input": input_text})
            + "\n\n### Response:\n"
        )

    @staticmethod
    def _extract_response(generated_text: str, prompt: str) -> str:
        answer = generated_text[len(prompt):]
        # Cut off if the model hallucinates a new section after its answer.
        for stop in ("### Instruction:", "### Input:", "### Response:", "<|endoftext|>"):
            answer = answer.split(stop)[0]
        return answer.strip()

    def generate(
        self,
        instruction: str,
        input_text: str = "",
        max_new_tokens: int = 256,
        temperature: float = 0.0,
        top_k: int | None = None,
    ) -> str:
        prompt = self._build_prompt(instruction, input_text)
        idx = torch.tensor(self.tokenizer.encode(prompt)).unsqueeze(0).to(self.device)
        out = generate_text(
            self.model,
            idx,
            max_new_tokens=max_new_tokens,
            context_length=self.model.config.context_length,
            temperature=temperature,
            top_k=top_k,
            eos_id=PAD_TOKEN_ID,
        )
        decoded = self.tokenizer.decode(out.squeeze(0).tolist())
        return self._extract_response(decoded, prompt)
