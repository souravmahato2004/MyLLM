"""
Downloads the small public-domain short story ("The Verdict" by Edith
Wharton) that Raschka's book uses as the toy training corpus for early
chapters. ~20KB of text — enough to sanity-check the tokenizer and
dataloader, not to train a real model on.

Run: python scripts/download_sample_data.py
"""

from __future__ import annotations

import pathlib
import urllib.request

URL = ("https://raw.githubusercontent.com/rasbt/LLMs-from-scratch/main/ch02/01_main-chapter-code/the-verdict.txt")

OUT_PATH = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw" / "the-verdict.txt"


def main() -> None:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading sample corpus from:\n  {URL}")
    urllib.request.urlretrieve(URL, OUT_PATH)
    size_kb = OUT_PATH.stat().st_size / 1024
    print(f"Saved to {OUT_PATH} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
