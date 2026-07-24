"""
Phase 5 setup: download the instruction fine-tuning dataset.

This is the ~1,100-entry Alpaca-style dataset from Sebastian Raschka's book
repo — each entry is {"instruction", "input", "output"}. Small enough to
fine-tune on modest hardware, which is exactly why the book uses it.
"""

from __future__ import annotations

import json
import pathlib
import urllib.request

URL = (
    "https://raw.githubusercontent.com/rasbt/LLMs-from-scratch/main/"
    "ch07/01_main-chapter-code/instruction-data.json"
)
DEST = (
    pathlib.Path(__file__).resolve().parent.parent
    / "data" / "instruction" / "instruction-data.json"
)


def main() -> None:
    DEST.parent.mkdir(parents=True, exist_ok=True)
    if DEST.exists():
        print(f"Already present: {DEST}")
    else:
        print(f"Downloading instruction data to {DEST} ...")
        urllib.request.urlretrieve(URL, DEST)

    with open(DEST, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"OK - {len(data)} entries.")
    print("Sample entry:")
    print(json.dumps(data[0], indent=2))


if __name__ == "__main__":
    main()
