# LLMInference

A GPT-2 style large language model built from scratch in PyTorch, following
Sebastian Raschka's *Build a Large Language Model (From Scratch)*
(`D:\MyLLM\Reference\Build-a-large-language-models-Sebatian-Raschka.pdf`).

End goal: fine-tune this model into the backend of a ChatGPT-style web app,
served via a FastAPI inference microservice behind a full web stack (see
[`ROADMAP.md`](./ROADMAP.md) for the complete plan, Phase 1 through
deployment).

The AI core is built and validated in complete isolation first — no web,
API, or database code — before any service work starts.

## Status

Phase 1 (data pipeline) implemented: BPE tokenizer + sliding-window
DataLoader. See [`ROADMAP.md`](./ROADMAP.md) for what's done and what's next.

## Project structure

```
LLMInference/
  src/llm_core/
    tokenizer.py         BPETokenizer — tiktoken GPT-2 BPE wrapper
    dataset.py            GPTDatasetV1 + create_dataloader_v1 (sliding-window batches)
  tests/                  pytest tests for tokenizer + dataset
  scripts/
    download_sample_data.py   fetches the book's toy corpus ("the-verdict.txt")
  data/raw/               local corpus files (gitignored)
  requirements.txt
  ROADMAP.md              full project plan, phase by phase
```

## Setup

> **Note:** the venv must live under `C:\`, not `D:\`. This machine's
> Application Control policy blocks loading PyTorch's DLLs from a venv on the
> `D:\` drive. Project source stays here on `D:\MyLLM\LLMInference`; only the
> venv itself needs to be on `C:`.

Using [`uv`](https://github.com/astral-sh/uv):

```powershell
# create the venv on C:
uv venv "$env:USERPROFILE\venvs\myllm"

# activate it
& "$env:USERPROFILE\venvs\myllm\Scripts\Activate.ps1"

# install project dependencies
cd D:\MyLLM\LLMInference
uv pip install -r requirements.txt

# verify
python -c "import torch, tiktoken, numpy; print(torch.__version__, tiktoken.__version__, numpy.__version__)"
```

## Try it

```powershell
python src\llm_core\tokenizer.py        # round-trip encode/decode demo
python src\llm_core\dataset.py          # sliding-window batch demo
python scripts\download_sample_data.py  # download the real toy corpus
python -m pytest tests -v
```

## Hardware notes

- GPU: AMD RX 6600M — no CUDA support on Windows, so PyTorch runs CPU-only.
  Fine through architecture-building (Phase 2); pretraining speed becomes a
  real constraint at Phase 3 (see `ROADMAP.md` notes).
