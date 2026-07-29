"""
Phase 5 — download a better chat/instruction dataset: databricks-dolly-15k.

~15k human-written instruction/response pairs across conversational categories
(open QA, brainstorming, creative writing, classification, summarization, ...) —
noticeably more "chatty" and higher quality than the 1,100-entry starter set.

Dolly ships as JSONL with keys {instruction, context, response, category}. We
normalize it into our pipeline's {instruction, input, output} shape (context ->
input, response -> output) and save a JSON list, so finetune_chat.py can consume
it unchanged.
"""

from __future__ import annotations

import json
import pathlib
import urllib.request

URL = (
    "https://huggingface.co/datasets/databricks/databricks-dolly-15k/"
    "resolve/main/databricks-dolly-15k.jsonl"
)
RAW_DEST = (
    pathlib.Path(__file__).resolve().parent.parent
    / "data" / "instruction" / "databricks-dolly-15k.jsonl"
)
DEST = (
    pathlib.Path(__file__).resolve().parent.parent
    / "data" / "instruction" / "dolly-15k.json"
)


def main() -> None:
    RAW_DEST.parent.mkdir(parents=True, exist_ok=True)

    if RAW_DEST.exists():
        print(f"Already downloaded: {RAW_DEST}")
    else:
        print(f"Downloading Dolly-15k to {RAW_DEST} ...")
        urllib.request.urlretrieve(URL, RAW_DEST)

    # Normalize JSONL -> our {instruction, input, output} list.
    normalized: list[dict[str, str]] = []
    with open(RAW_DEST, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            entry = json.loads(line)
            output = entry.get("response", "").strip()
            if not output:
                continue  # skip entries with no answer
            normalized.append(
                {
                    "instruction": entry.get("instruction", "").strip(),
                    "input": entry.get("context", "").strip(),
                    "output": output,
                }
            )

    with open(DEST, "w", encoding="utf-8") as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)

    print(f"OK - normalized {len(normalized)} entries -> {DEST}")
    print("Sample entry:")
    print(json.dumps(normalized[0], indent=2))


if __name__ == "__main__":
    main()
