import type { AgentContext, AgentMessage, AgentProvider, AgentReply } from './types';

/**
 * Talks to your own backend. Request:  POST <url>  { messages: AgentMessage[], context: AgentContext }
 * Response: { reply: string, chips?: string[], offerSave?: boolean }   (also accepted: { text } or { message })
 * Never put an API key in the browser: keep it on the server behind this endpoint.
 */
export function httpProvider(url: string): AgentProvider {
  return {
    id: 'http',
    async send(messages: AgentMessage[], context: AgentContext, signal?: AbortSignal): Promise<AgentReply> {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: messages.slice(-20), context }),
        signal,
      });
      if (!r.ok) throw new Error(`agent ${r.status}`);
      const j = (await r.json()) as { reply?: string; text?: string; message?: string; chips?: string[]; offerSave?: boolean };
      const text = j.reply ?? j.text ?? j.message ?? '';
      if (!text) throw new Error('empty agent reply');
      return { text, chips: j.chips, offerSave: j.offerSave };
    },
  };
}
