import type { AgentProvider } from './types';
import { httpProvider } from './http';
import { localGuide, DISTRESS } from './local';
import { agentFor } from '../i18n/agent';

export type { AgentContext, AgentMessage, AgentProvider, AgentReply } from './types';

let provider: AgentProvider | null = null;

/** Replace the brain at runtime (e.g. from your own script tag): window.OpusAgent.register({ id, send }) */
export function registerProvider(p: AgentProvider): void {
  provider = p;
}

export function getProvider(): AgentProvider {
  if (provider) return provider;
  const url = (import.meta.env.VITE_AGENT_URL as string | undefined)?.trim();
  if (!url) provider = localGuide;
  else {
    const remote = httpProvider(url);
    // the scripted guide stays in charge of the greeting, the mood chips and any sign of distress; the model does the rest,
    // and if the network or server fails the scripted guide quietly takes over
    provider = {
      id: remote.id,
      greet: localGuide.greet,
      async send(messages, ctx, signal) {
        const last = messages[messages.length - 1]?.text.trim() ?? '';
        if (DISTRESS.test(last) || agentFor(ctx.lang).moods.some((m) => m === last)) return localGuide.send(messages, ctx, signal);
        try {
          return await remote.send(messages, ctx, signal);
        } catch {
          if (signal?.aborted) throw new Error('aborted');
          return localGuide.send(messages, ctx, signal);
        }
      },
    };
  }
  return provider;
}

declare global {
  interface Window {
    OpusAgent?: { register: (p: AgentProvider) => void; provider: () => string };
  }
}
if (typeof window !== 'undefined') {
  window.OpusAgent = { register: registerProvider, provider: () => getProvider().id };
}
