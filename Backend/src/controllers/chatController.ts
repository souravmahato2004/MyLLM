import type { Request, Response } from 'express';

// The FastAPI inference microservice (LLMInference/src/inference_service).
// Override in Backend/.env with INFERENCE_URL if it runs elsewhere.
const INFERENCE_URL = process.env.INFERENCE_URL || 'http://localhost:8000';

/**
 * Gateway endpoint: takes a chat message from the frontend, forwards it to the
 * Python inference service's POST /generate, and returns the model's reply.
 *
 * Note: the model is single-turn (no conversation memory yet), so only the
 * latest message is sent as the instruction. Multi-turn history would be
 * assembled and bounded here later.
 */
export const sendChatMessage = async (req: Request, res: Response) => {
  const { message } = req.body;

  try {
    const inferenceRes = await fetch(`${INFERENCE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction: message,
        max_new_tokens: 128, // keep it snappy — CPU inference is slow
        temperature: 0.7, // sampling (not greedy) — breaks repetition loops
        top_k: 40,
      }),
    });

    if (!inferenceRes.ok) {
      const detail = await inferenceRes.text();
      console.error('Inference service error:', inferenceRes.status, detail);
      res.status(502).json({ error: 'The AI model service returned an error.' });
      return;
    }

    const data = (await inferenceRes.json()) as { response: string };
    res.status(200).json({ reply: data.response });
  } catch (error) {
    console.error('Chat proxy error:', error);
    res.status(503).json({
      error: 'The AI model service is unavailable. Is it running on port 8000?',
    });
  }
};

/**
 * Streaming variant: forwards the inference service's token-by-token stream
 * straight through to the frontend as it arrives (no buffering), so text
 * appears live. Reads the upstream body as a stream and writes each chunk.
 */
export const streamChatMessage = async (req: Request, res: Response) => {
  const { message } = req.body;

  try {
    const upstream = await fetch(`${INFERENCE_URL}/generate/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction: message,
        max_new_tokens: 128,
        temperature: 0.7, // sampling (not greedy) — breaks repetition loops
        top_k: 40,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      res.status(502).json({ error: 'The AI model service returned an error.' });
      return;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering (e.g. nginx)

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (error) {
    console.error('Chat stream error:', error);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'The AI model service is unavailable. Is it running on port 8000?',
      });
    } else {
      res.end();
    }
  }
};
