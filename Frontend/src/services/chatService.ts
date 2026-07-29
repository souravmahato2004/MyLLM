import apiClient from './client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Sends a chat message to the backend gateway (POST /api/chat), which proxies
 * it to the Python inference service and returns the model's reply.
 */
export async function sendChatMessage(message: string): Promise<string> {
  const { data } = await apiClient.post<{ reply: string }>('/api/chat', { message });
  return data.reply;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

/**
 * Streaming variant: calls the gateway's /api/chat/stream and invokes `onToken`
 * for each text chunk as it arrives. Uses the native fetch + ReadableStream API
 * because axios buffers the whole response and can't stream in the browser.
 */
export async function streamChatMessage(
  message: string,
  onToken: (delta: string) => void
): Promise<void> {
  const token = localStorage.getItem('access_token');

  const res = await fetch(`${API_BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Chat stream failed with status ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onToken(decoder.decode(value, { stream: true }));
  }
}
