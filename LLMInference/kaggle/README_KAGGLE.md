# Fine-tuning GPT-2 on Kaggle GPU — resumable, one epoch per run

This folder packages everything needed to fine-tune the 124M model on the
Dolly-15k chat dataset using a free Kaggle GPU, doing **repeated single-epoch
runs that each resume from the last checkpoint**. Run it N times = N epochs,
but you get to inspect quality and validation loss between each run.

Files here:
- `finetune_kaggle.py` — the training entrypoint (resumable). Runs on Kaggle.
- `notebook_cells.py`   — the cells to paste into the Kaggle notebook.
- `README_KAGGLE.md`    — this guide.

---

## What to zip and upload

The Kaggle notebook needs your source **and** the data in one dataset. From
`D:\MyLLM\LLMInference`, create a zip whose **root** contains these folders:

```
src/                              <- the llm_core package
kaggle/                           <- this folder (finetune_kaggle.py)
data/instruction/dolly-15k.json   <- the training data
```

Important: zip the **contents** so `src/`, `kaggle/`, and `data/` sit at the
top level of the zip — not the parent `LLMInference` folder. (The script
searches `/kaggle/input` recursively for `llm_core` and `dolly-15k.json`, so a
little nesting is tolerated, but a flat layout is cleanest.)

Do NOT include `.venv/`, `data/pretrained/`, or `data/checkpoints/` — they're
big and unnecessary (GPT-2 weights are downloaded fresh on run 1).

---

## One-time setup on kaggle.com

1. **Datasets -> New Dataset** -> upload your zip. Title it **`myllm-src`**
   (this makes the mount path `/kaggle/input/myllm-src/...`). Create it.

2. **Create -> New Notebook.** In the right sidebar:
   - **Accelerator**: `GPU T4 x2` (or P100 — only one GPU is used).
   - **Internet**: **ON** (run 1 downloads GPT-2's weights from Hugging Face).
   - **Add Input**: add your `myllm-src` dataset.

3. Paste the cells from `notebook_cells.py` into the notebook (one block per
   cell).

---

## Run 1 (starts from pretrained GPT-2)

1. Run Cell 1 (install tiktoken) and Cell 2 (confirm the GPU shows up).
2. (Recommended) Run **Cell 3** — the 100-row smoke test. It should finish in
   ~2 minutes and print a sample answer. This proves the pipeline end-to-end.
3. Run **Cell 4** — the real run. One epoch over ~15k rows on a T4 is roughly
   10–20 minutes. Watch the `train loss` / `val loss` lines.
4. When it finishes, the checkpoint is at **`/kaggle/working/gpt2_chat.pt`**.
   Download it from the **Output** panel on the right (or click **Save Version**
   -> "Save & Run All" to persist the output for later).

---

## More epochs in the SAME session (no saving needed)

The script resumes from `/kaggle/working/gpt2_chat.pt` first. So while the
session is still alive, you can just **re-run Cell 4 again** and it picks up
where the last epoch left off — restoring model **and** optimizer state — with
zero dataset juggling. You'll see:
`Resuming from checkpoint /kaggle/working/gpt2_chat.pt ... (already trained N epoch(s))`.

Do this as many times as you like. Watch the **validation loss** each run; stop
when it flattens or starts creeping up (after that, more epochs just overfit).

## Continue LATER in a NEW session (this is when you must save)

Kaggle **wipes `/kaggle/working` when the session ends**, so to resume tomorrow
the checkpoint has to live in a **dataset**:

1. Download the latest `/kaggle/working/gpt2_chat.pt` (Output panel), or click
   **Save Version** to persist the output.
2. First time: **Datasets -> New Dataset** -> upload it -> title it exactly
   **`gpt2-chat-ckpt`** (the script looks for
   `/kaggle/input/gpt2-chat-ckpt/gpt2_chat.pt`).
   Later times: open that dataset -> **New Version** -> upload the newer file.
3. In your next session, **Add Input -> `gpt2-chat-ckpt`** (point it at the
   latest version). Now Cell 4 resumes from it, because the working dir starts
   empty and the script falls back to the input dataset.

So the rule of thumb: **save only when you're about to end a session** — not
after every single epoch.

> Kaggle gives ~30 GPU-hours/week and up to ~9–12h per session, so one epoch
> per run leaves plenty of headroom; you could even bump `NUM_EPOCHS` to 2–3
> per run once you trust the setup.

---

## Use the fine-tuned model locally for chat

Your `InferenceEngine` already rebuilds the model straight from a checkpoint —
no code change needed. Just drop the final downloaded file at:

```
D:\MyLLM\LLMInference\data\checkpoints\gpt2_chat.pt
```

That's the path your local chat scripts / inference service already expect.
It loads the config + weights from the checkpoint and runs on CPU for inference.

---

## Knobs (set as env vars in the notebook cell, no file editing needed)

| Env var         | Default | Meaning                                    |
|-----------------|---------|--------------------------------------------|
| `MODEL_SIZE`    | `124M`  | `124M` (faster) or `355M` (better, slower) |
| `BATCH_SIZE`    | `8`     | Raise for speed; lower to `4` if you OOM   |
| `NUM_EPOCHS`    | `1`     | Epochs per run                             |
| `LEARNING_RATE` | `5e-5`  | AdamW learning rate                        |
| `MAX_ENTRIES`   | (unset) | Set to `100` for a quick smoke test        |
