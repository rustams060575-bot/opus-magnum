import type { AgentProvider } from './types';
import { httpProvider } from './http';
import { localGuide } from './local';

export type { AgentContext, AgentMessage, AgentProvider, AgentReply } from './types';

let provider: AgentProvider | null = null;

/** Replace the brain at runtime (e.g. from your own script tag): window.OpusAgent.register({ id, send }) */
export function registerProvider(p: AgentProvider): void {
  provider = p;
}

export function getProvider(): AgentProvider {
  if (provider) return provider;
  const url = (import.meta.env.VITE_AGENT_URL as string | undefined)?.trim();
  provider = url ? httpProvider(url) : localGuide;
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
