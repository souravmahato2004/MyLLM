# =============================================================================
# Kaggle notebook cells — copy each block below into its own notebook cell.
# (This file is just for copy/paste; you don't "run" it directly.)
# =============================================================================


# --- CELL 1: install the one dependency Kaggle is missing --------------------
# torch + transformers are preinstalled on the Kaggle GPU image; tiktoken isn't.
get_ipython().system("pip install -q tiktoken")


# --- CELL 2: sanity-check the GPU is attached --------------------------------
import torch
print("CUDA available:", torch.cuda.is_available())
print("Device:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU")


# --- CELL 3 (OPTIONAL): 2-minute smoke test on 100 rows ----------------------
# Run this ONCE the first time to prove the whole pipeline works before you
# commit to a full run. Delete/skip it afterwards.
import os
os.environ["MAX_ENTRIES"] = "100"
os.environ["BATCH_SIZE"] = "8"
get_ipython().system("python $(find /kaggle/input -name finetune_kaggle.py | head -1)")


# --- CELL 4: the real run (multi-epoch, both GPUs + fp16, resumes automatically)
# The script auto-uses: DataParallel across both T4s AND mixed precision (fp16).
# fp16 makes it ~2x faster and halves memory, so batch can go higher than before.
# It saves a checkpoint after EVERY epoch, so a timeout at epoch 7 still leaves
# you epoch 6 to resume from.
import os
os.environ.pop("MAX_ENTRIES", None)   # None = use all ~15k rows
os.environ["BATCH_SIZE"] = "16"       # fp16 frees memory; try 24/32, drop on OOM
os.environ["NUM_EPOCHS"] = "10"       # run all 10 epochs in this one session
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
os.environ["PYTORCH_ALLOC_CONF"] = "expandable_segments:True"
get_ipython().system("python $(find /kaggle/input -name finetune_kaggle.py | head -1)")

# Checkpoint is refreshed each epoch at /kaggle/working/gpt2_chat.pt.
# When done: download it (Output panel) or Save Version, then update the
# gpt2-chat-ckpt dataset if you want to resume/extend later (README_KAGGLE.md).
