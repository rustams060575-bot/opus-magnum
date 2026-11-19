import { getProvider, type AgentContext, type AgentMessage, type AgentReply } from '../agent';
import { agentFor } from '../i18n/agent';
import { ensureMusic } from '../core/audio';

/**
 * The guide's chat sheet. It talks to whatever provider is registered (src/agent/index.ts): the built-in LocalGuide
 * today, your own agent later. The conversation lives in memory only. Notes and the diary are never sent to a provider.
 */
export interface AgentUiCtx {
  lang: () => string;
  stop: () => void;
  start: () => void;
  /** title + reflective question of a stage (1..7) */
  stage: (n: number) => { title: string; question: string };
  /** 0 = intro, 1..7, 8 = epilogue (where the visitor currently is) */
  current: () => number;
  saveNote: (stage: number, text: string) => void;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (s: string, k: string, v: string) => s.replace(`{${k}}`, v);

let c: AgentUiCtx;
let root: HTMLElement | null = null;
let msgs: AgentMessage[] = [];
let stageShown = -1;
let mood: string | undefined;
let busy = false;
let abort: AbortController | null = null;
let lastFocus: HTMLElement | null = null;
let pendingSave: { stage: number; text: string } | null = null;

export function initAgent(ctx: AgentUiCtx): void {
  c = ctx;
  addEventListener('keydown', (e) => {
    if (root && e.key === 'Escape') closeAgent();
  });
}

/** language switch: the old transcript would be in the wrong language */
export function resetAgent(): void {
  closeAgent();
  msgs = [];
  stageShown = -1;
  mood = undefined;
}

export function closeAgent(): void {
  if (!root) return;
  abort?.abort();
  const node = root;
  root = null;
  node.classList.remove('on');
  c.start();
  ensureMusic();
  setTimeout(() => node.remove(), 380);
  lastFocus?.focus?.({ preventScroll: true });
}

function context(stage: number): AgentContext {
  const info = stage >= 1 && stage <= 7 ? c.stage(stage) : { title: '', question: '' };
  return { lang: c.lang(), stage, stageTitle: info.title, stageQuestion: info.question, mood, turn: msgs.filter((m) => m.role === 'user' && m.text !== mood).length };
}

export function openAgent(stage = c.current()): void {
  if (root) return;
  const T = agentFor(c.lang()).ui;
  lastFocus = document.activeElement as HTMLElement | null;
  root = document.createElement('div');
  root.id = 'agent';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', T.title);
  root.innerHTML = `<div class="ag__sheet">
  <header class="ag__head"><div><b>${esc(T.title)}</b><small>${esc(T.sub)}</small></div><button class="ag__x" type="button" aria-label="${esc(T.close)}"><i></i><i></i></button></header>
  <div class="ag__log" role="log" aria-live="polite"></div>
  <div class="ag__chips"></div>
  <form class="ag__form"><textarea rows="1" maxlength="1200" placeholder="${esc(T.placeholder)}" aria-label="${esc(T.placeholder)}"></textarea><button type="submit" class="ag__send">${esc(T.send)}</button></form>
  <p class="ag__note">${esc(T.disclaimer)}</p>
</div>`;
  document.body.appendChild(root);
  c.stop();
  requestAnimationFrame(() => root?.classList.add('on'));
  const el = root;
  const log = el.querySelector<HTMLElement>('.ag__log')!;
  const chips = el.querySelector<HTMLElement>('.ag__chips')!;
  const form = el.querySelector<HTMLFormElement>('.ag__form')!;
  const ta = form.querySelector('textarea')!;
  const send = form.querySelector<HTMLButtonElement>('.ag__send')!;
  el.querySelector('.ag__x')!.addEventListener('click', closeAgent);
  el.addEventListener('pointerdown', (e) => {
    if (e.target === el) closeAgent();
  });

  const scroll = () => (log.scrollTop = log.scrollHeight);
  const bubble = (m: AgentMessage) => {
    const d = document.createElement('div');
    d.className = `ag__m ag__m--${m.role}`;
    d.textContent = m.text;
    log.appendChild(d);
    scroll();
  };
  const setChips = (items: string[] = [], save = false) => {
    chips.innerHTML = '';
    for (const t of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ag__chip';
      b.textContent = t;
      b.addEventListener('click', () => void say(t));
      chips.appendChild(b);
    }
    if (save && pendingSave) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ag__chip ag__chip--save';
      b.textContent = T.save;
      b.addEventListener('click', () => {
        if (!pendingSave) return;
        c.saveNote(pendingSave.stage, pendingSave.text);
        pendingSave = null;
        b.textContent = '✓ ' + T.saved;
        b.disabled = true;
      });
      chips.appendChild(b);
    }
  };
  const typing = () => {
    const d = document.createElement('div');
    d.className = 'ag__m ag__m--assistant ag__typing';
    d.setAttribute('aria-label', T.typing);
    d.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(d);
    scroll();
    return d;
  };
  const reply = (r: AgentReply) => {
    const m: AgentMessage = { role: 'assistant', text: r.text };
    msgs.push(m);
    bubble(m);
    setChips(r.chips, !!r.offerSave);
  };
  const lock = (v: boolean) => {
    busy = v;
    send.disabled = v;
    ta.disabled = v;
    if (!v) ta.focus({ preventScroll: true });
  };

  async function say(text: string): Promise<void> {
    text = text.trim();
    if (!text || busy) return;
    const stage = c.current();
    if (agentFor(c.lang()).moods.includes(text)) mood = text;
    const um: AgentMessage = { role: 'user', text };
    msgs.push(um);
    bubble(um);
    pendingSave = text.length > 8 && !agentFor(c.lang()).moods.includes(text) ? { stage: stage >= 1 && stage <= 7 ? stage : 0, text } : pendingSave;
    setChips();
    ta.value = '';
    ta.style.height = '';
    lock(true);
    const dots = typing();
    abort = new AbortController();
    const started = performance.now();
    try {
      const r = await getProvider().send(msgs, context(stage), abort.signal);
      // a short human pause, so the answer does not snap in
      const wait = Math.max(0, 750 - (performance.now() - started));
      if (wait) await new Promise((res) => setTimeout(res, wait));
      dots.remove();
      reply(r);
    } catch (err) {
      dots.remove();
      if ((err as Error).name === 'AbortError') return;
      const d = document.createElement('div');
      d.className = 'ag__m ag__m--error';
      d.textContent = T.error;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ag__chip';
      b.textContent = T.retry;
      b.addEventListener('click', () => {
        d.remove();
        msgs.pop();
        void say(text);
      });
      d.appendChild(b);
      log.appendChild(d);
    } finally {
      if (root) lock(false);
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void say(ta.value);
  });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void say(ta.value);
    }
  });
  ta.addEventListener('input', () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  });

  // restore the transcript, or begin
  msgs.forEach(bubble);
  void (async () => {
    const Tx = agentFor(c.lang());
    if (!msgs.length) {
      const p = getProvider();
      const g = await Promise.resolve(p.greet ? p.greet(context(stage)) : { text: stage >= 1 && stage <= 7 ? fill(Tx.hello, 't', c.stage(stage).title) : Tx.helloGeneral, chips: [...Tx.moods] });
      reply(g);
      stageShown = stage;
    } else if (stage !== stageShown && stage >= 1 && stage <= 7) {
      const info = c.stage(stage);
      reply({ text: `${fill(Tx.nowStage, 't', info.title)} ${fill(Tx.ask, 'q', info.question)}` });
      stageShown = stage;
    }
    ta.focus({ preventScroll: true });
  })();
}
