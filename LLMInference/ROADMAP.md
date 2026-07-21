# Project Roadmap — Custom GPT-2 → ChatGPT-style Web App

Reference: *Build a Large Language Model (From Scratch)* — Sebastian Raschka
(`D:\MyLLM\Reference\Build-a-large-language-models-Sebatian-Raschka.pdf`)

Order matters: the AI core (Phases 1-4) is built and validated in complete
isolation, with no web/db code, before any service work starts.

---

## Phase 1 — Data Pipeline ✅ done, verified
- [x] Project scaffold, isolated venv (`.venv`, Python 3.11.9), requirements.txt
- [x] `BPETokenizer` — tiktoken GPT-2 encoding wrapper (`src/llm_core/tokenizer.py`)
- [x] `GPTDatasetV1` + `create_dataloader_v1` — sliding-window (input, target) batches (`src/llm_core/dataset.py`)
- [x] pytest suite passing (6/6) — `tests/test_tokenizer.py`, `tests/test_dataset.py`
- [X] Download real corpus (`scripts/download_sample_data.py`) and sanity-check token/batch counts on it

## Phase 2 — Model Architecture (book ch. 3–4) *(current)*
- [ ] Token + positional embedding layers
- [ ] Scaled dot-product self-attention → causal masking → Multi-Head Attention
- [ ] LayerNorm, GELU activation, position-wise FeedForward block
- [ ] Transformer block (attention + FFN + residual connections + dropout)
- [ ] Full `GPTModel` class stacking N transformer blocks + output head
- [ ] Weight initialization; parameter count sanity check against real GPT-2 sizes (124M/355M/...)

## Phase 3 — Pretraining (book ch. 5)
- [ ] Cross-entropy loss over shifted logits/targets
- [ ] Training loop: forward → loss → backward → optimizer step, with train/val split
- [ ] Text generation loop: greedy decoding, then temperature + top-k sampling
- [ ] Checkpoint save/load
- [ ] **GPU decision point**: this machine is CPU-only (AMD RX 6600M, no CUDA on
      Windows). Either (a) train a tiny model on CPU for learning purposes only,
      or (b) rent/borrow GPU time (Colab/Kaggle/cloud) for anything real.

## Phase 4 — Loading Pretrained GPT-2 Weights (book ch. 5)
- [ ] Download OpenAI's released GPT-2 weights
- [ ] Map/convert them into our from-scratch architecture's state_dict
- [ ] Validate with known-good generations (this becomes the model actually
      worth serving, since from-scratch pretraining on a personal CPU won't
      reach usable quality)

## Phase 5 — Fine-tuning (book ch. 6–7)
- [ ] Instruction fine-tuning: reformat a Q&A/chat-style dataset, fine-tune so
      the model responds conversationally instead of just continuing text —
      this is what makes it feel "ChatGPT-style" rather than a raw autocomplete
- [ ] (Optional, from the book) Classification fine-tuning exercise (spam
      classifier) as an architecture-reuse checkpoint before the harder
      instruction-tuning step

--- Everything above is pure PyTorch, no web code. Below is the web system. ---

## Phase 6 — AI Inference Microservice
- [ ] FastAPI service wrapping the fine-tuned model
- [ ] `POST /generate` — request: prompt + sampling params; response: generated text
- [ ] Streaming response (SSE or chunked) so the frontend can render tokens as
      they're produced, like ChatGPT
- [ ] Model loaded once at startup (singleton), not per-request
- [ ] Dockerfile for this service

## Phase 7 — Main Backend / API Gateway
- [ ] **Decision to make after Phase 5**: Node.js (Express/NestJS) vs. staying
      in FastAPI for the gateway. Either way it owns: auth, chat/session
      persistence in PostgreSQL, and proxying/streaming requests to the
      inference microservice
- [ ] Auth (JWT or session-based)
- [ ] Chat history persistence — schema for users, conversations, messages
- [ ] Streaming pass-through from inference service to frontend

## Phase 8 — Frontend
- [ ] Next.js/React chat UI
- [ ] Streamed token rendering
- [ ] Conversation list / history sidebar, new-chat flow

## Phase 9 — Infrastructure
- [ ] Docker Compose: frontend + gateway + inference service + Postgres
- [ ] Environment/config management per service, internal networking between
      containers

## Phase 10 — Future: Agentic Fine-tuning
- [ ] Fine-tune the model for tool/task execution (function-calling-style
      outputs), once the base chat product works end-to-end

---

## Notes / decisions log
- venv (Python 3.11.9) lives at `D:\MyLLM\LLMInference\.venv`, installed via
  `uv`. torch 2.13.0+cpu, tiktoken 0.13.0, numpy 2.4.6 confirmed working —
  no DLL/Application Control issue on this venv (an earlier venv attempt on
  `D:\` did hit a one-time Application Control block on torch's DLL; it did
  not recur here, likely a first-seen-binary flag rather than a hard
  drive-based rule).
- GPU: AMD RX 6600M — no CUDA on Windows. Training-speed decisions deferred
  to Phase 3.
