import { agentFor } from '../i18n/agent';
import type { AgentContext, AgentMessage, AgentProvider, AgentReply } from './types';

/**
 * The built-in guide: a calm, scripted companion that works offline and sends nothing anywhere.
 * It reflects back what the visitor wrote, asks one gentle question at a time and offers to keep a thought.
 * It is a placeholder for the real agent: swap it by registering another provider (see src/agent/index.ts).
 */
const DISTRESS =
  /(suicid|kill myself|end my life|want to die|self[- ]?harm|hurt myself|не хочу жить|покончить с собой|убить себя|суицид|навредить себе|хочу умереть|no quiero vivir|quitarme la vida|autolesi|je veux mourir|me tuer|sterben will|umbringen|mich ritzen|quero morrer|me matar|не хочу жити|вбити себе|хочу померти)/i;

const fill = (s: string, k: string, v: string) => s.replace(`{${k}}`, v);
const snippet = (s: string) => {
  const w = s.trim().split(/\s+/);
  return w.length > 4 ? w.slice(0, 9).join(' ') + (w.length > 9 ? '…' : '') : '';
};

export const localGuide: AgentProvider = {
  id: 'local-guide',

  greet(ctx: AgentContext): AgentReply {
    const T = agentFor(ctx.lang);
    if (ctx.stage < 1 || ctx.stage > 7) return { text: `${T.helloGeneral} ${T.moodQ}`, chips: [...T.moods] };
    return { text: `${fill(T.hello, 't', ctx.stageTitle)} ${T.moodQ}`, chips: [...T.moods] };
  },

  async send(messages: AgentMessage[], ctx: AgentContext): Promise<AgentReply> {
    const T = agentFor(ctx.lang);
    const last = messages[messages.length - 1]?.text.trim() ?? '';
    const q = ctx.stage >= 1 && ctx.stage <= 7 ? ctx.stageQuestion : T.generalQ;

    if (DISTRESS.test(last)) return { text: T.care };

    // a mood chip: acknowledge it, then offer this stage's question
    const mood = T.moods.findIndex((m) => m === last);
    if (mood >= 0) return { text: `${T.moodReply[mood]} ${fill(T.ask, 'q', q)}` };

    // an ordinary turn: reflect back, then one gentle follow-up
    const t = ctx.turn;
    const parts: string[] = [T.ack[t % T.ack.length]];
    const s = snippet(last);
    if (s) parts.push(fill(T.quote, 'x', s));
    if (t > 0 && t % 4 === 0) return { text: `${parts.join(' ')} ${T.wrap}`, offerSave: true };
    parts.push(T.follow[t % T.follow.length]);
    return { text: parts.join(' ') };
  },
};
