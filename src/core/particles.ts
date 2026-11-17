import gsap from 'gsap';

export type ParticleMode = 'dust' | 'ember' | 'ash' | 'gold' | 'snow' | 'star' | 'none';

interface Cfg {
  color: [number, number, number];
  alpha: number;
  size: [number, number];
  vy: number; // px/s, negative = up
  vx: number;
  sway: number;
  flicker: number;
  fromBottom: boolean;
}

const MODES: Record<Exclude<ParticleMode, 'none'>, Cfg> = {
  dust: { color: [255, 214, 140], alpha: 0.5, size: [0.6, 1.8], vy: -8, vx: 4, sway: 14, flicker: 0.2, fromBottom: false },
  ember: { color: [255, 110, 40], alpha: 0.9, size: [0.8, 2.6], vy: -46, vx: 6, sway: 22, flicker: 0.7, fromBottom: true },
  ash: { color: [210, 205, 200], alpha: 0.5, size: [0.8, 2.2], vy: 16, vx: -6, sway: 24, flicker: 0.1, fromBottom: false },
  gold: { color: [255, 205, 110], alpha: 0.75, size: [0.8, 2.4], vy: -14, vx: 3, sway: 18, flicker: 0.5, fromBottom: false },
  snow: { color: [225, 240, 255], alpha: 0.8, size: [0.8, 2.8], vy: 38, vx: -14, sway: 20, flicker: 0.05, fromBottom: false },
  star: { color: [150, 190, 255], alpha: 0.9, size: [0.6, 2.0], vy: -3, vx: 2, sway: 5, flicker: 1, fromBottom: false },
};

interface P {
  x: number;
  y: number;
  r: number;
  ph: number;
  sp: number;
  life: number;
  max: number;
}

/** Ambient particle layer. The mode is cross-faded when the scene changes. */
export class Particles {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private ps: P[] = [];
  private mode: Exclude<ParticleMode, 'none'> = 'dust';
  private cfg: Cfg = { ...MODES.dust };
  private level = { v: 1 };
  private count: number;
  private t = 0;
  private running = true;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    const small = matchMedia('(max-width: 899px)').matches;
    this.count = small ? 38 : 84;
    this.resize();
    addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => (this.running = !document.hidden));
    for (let i = 0; i < this.count; i++) this.ps.push(this.spawn(true));
    gsap.ticker.add((_, dtMs) => this.frame(Math.min(dtMs, 64) / 1000));
  }

  private resize() {
    this.dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.w = innerWidth;
    this.h = innerHeight;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private spawn(initial = false): P {
    const c = this.cfg;
    const max = 6 + Math.random() * 9;
    return {
      x: Math.random() * this.w,
      y: initial ? Math.random() * this.h : c.fromBottom ? this.h + 10 : c.vy > 0 ? -10 : Math.random() * this.h,
      r: c.size[0] + Math.random() * (c.size[1] - c.size[0]),
      ph: Math.random() * Math.PI * 2,
      sp: 0.4 + Math.random() * 0.9,
      life: initial ? Math.random() * max : 0,
      max,
    };
  }

  setMode(m: ParticleMode) {
    if (m === 'none') {
      gsap.to(this.level, { v: 0, duration: 1.2 });
      return;
    }
    this.mode = m;
    const target = MODES[m];
    gsap.to(this.level, { v: 1, duration: 1.2 });
    // Tween the config numbers and colour smoothly.
    gsap.to(this.cfg, {
      alpha: target.alpha,
      vy: target.vy,
      vx: target.vx,
      sway: target.sway,
      flicker: target.flicker,
      duration: 1.6,
      ease: 'sine.inOut',
    });
    gsap.to(this.cfg.color, { 0: target.color[0], 1: target.color[1], 2: target.color[2], duration: 1.6 });
    this.cfg.size = target.size;
    this.cfg.fromBottom = target.fromBottom;
  }

  private frame(dt: number) {
    if (!this.running) return;
    const { ctx, cfg } = this;
    this.t += dt;
    ctx.clearRect(0, 0, this.w, this.h);
    if (this.level.v < 0.01) return;
    ctx.globalCompositeOperation = 'lighter';
    const [cr, cg, cb] = cfg.color.map(Math.round);
    for (let i = 0; i < this.ps.length; i++) {
      const p = this.ps[i];
      p.life += dt;
      p.y += cfg.vy * p.sp * dt;
      p.x += (cfg.vx + Math.sin(this.t * p.sp + p.ph) * cfg.sway * 0.4) * dt;
      if (p.life > p.max || p.y < -20 || p.y > this.h + 20 || p.x < -20 || p.x > this.w + 20) {
        this.ps[i] = this.spawn();
        continue;
      }
      const k = p.life / p.max;
      const fade = Math.sin(Math.PI * k); // fade in/out over life
      const tw = 1 - cfg.flicker * (0.5 + 0.5 * Math.sin(this.t * 6 * p.sp + p.ph));
      const a = cfg.alpha * fade * tw * this.level.v;
      if (a < 0.01) continue;
      const rad = p.r * 3.2;
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
      grd.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`);
      grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
