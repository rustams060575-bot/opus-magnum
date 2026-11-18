/**
 * The guide ("psychologist agent") contract. The site only knows this interface; the brain behind it can be swapped:
 *  - the built-in LocalGuide (scripted, works offline, nothing leaves the device),
 *  - an HTTP provider that talks to your own backend (set VITE_AGENT_URL at build time),
 *  - or anything registered at runtime: window.OpusAgent.register({ id, send }).
 * See docs/AGENT_INTEGRATION.md.
 */
export interface AgentMessage {
  role: 'user' | 'assistant';
  text: string;
}

/** What the guide may know about where the visitor is. Notes and diary are NEVER included. */
export interface AgentContext {
  lang: string;
  /** 0 = intro / general, 1..7 = stage, 8 = epilogue */
  stage: number;
  stageTitle: string;
  /** the stage's own reflective question (from the site copy) */
  stageQuestion: string;
  /** the visitor's self-reported mood chip, if they picked one */
  mood?: string;
  /** how many visitor messages so far */
  turn: number;
}

export interface AgentReply {
  text: string;
  /** optional quick replies the UI shows as chips */
  chips?: string[];
  /** set when the provider wants the UI to offer saving a thought to the stage note */
  offerSave?: boolean;
}

export interface AgentProvider {
  id: string;
  /** first messages when a conversation starts or the stage changes */
  greet?(ctx: AgentContext): Promise<AgentReply> | AgentReply;
  send(messages: AgentMessage[], ctx: AgentContext, signal?: AbortSignal): Promise<AgentReply>;
}
