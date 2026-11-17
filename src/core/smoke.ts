import gsap from 'gsap';

/**
 * A living background for the hero: domain-warped fractal noise rendered as slowly
 * churning smoke, blended onto the parchment with `multiply`. It swells with each heartbeat.
 * Runs at a fraction of screen resolution and only while the hero is on screen.
 */
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform vec2 r;
uniform float t;
uniform float b;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * n(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / r;
  vec2 p = (uv - 0.5) * vec2(r.x / r.y, 1.0) * 2.4;
  float tt = t * 0.06;
  vec2 q = vec2(fbm(p + tt), fbm(p + vec2(5.2, 1.3) - tt));
  vec2 w = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + tt * 1.4), fbm(p + 3.0 * q + vec2(8.3, 2.8) - tt * 1.2));
  float f = fbm(p + 3.0 * w);
  float s = smoothstep(0.32, 0.92, f);
  float d = length(uv - 0.5);
  float vig = smoothstep(0.25, 0.95, d);
  float dens = s * (0.52 + 0.4 * b) + vig * 0.32;
  vec3 smokeCol = mix(vec3(0.34, 0.06, 0.04), vec3(0.05, 0.0, 0.0), s);
  gl_FragColor = vec4(mix(vec3(1.0), smokeCol, clamp(dens, 0.0, 0.95)), 1.0);
}`;

export class Smoke {
  private gl: WebGLRenderingContext | null;
  private prog: WebGLProgram | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private visible = true;
  private beat = 0;
  private t0 = performance.now();
  private tick = 0;
  private io: IntersectionObserver;
  private fn = () => this.frame();
  private readonly scale = 0.42;

  constructor(private canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!this.gl) {
      canvas.style.display = 'none';
      this.io = new IntersectionObserver(() => undefined);
      return;
    }
    const gl = this.gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      canvas.style.display = 'none';
      this.io = new IntersectionObserver(() => undefined);
      return;
    }
    this.prog = prog;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['r', 't', 'b']) this.u[n] = gl.getUniformLocation(prog, n);
    this.resize();
    addEventListener('resize', this.onResize);
    this.io = new IntersectionObserver((e) => (this.visible = e[0].isIntersecting), { threshold: 0 });
    this.io.observe(canvas);
    gsap.ticker.add(this.fn);
  }

  private onResize = () => this.resize();

  private resize() {
    const w = Math.max(2, Math.round(this.canvas.clientWidth * this.scale));
    const h = Math.max(2, Math.round(this.canvas.clientHeight * this.scale));
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl?.viewport(0, 0, w, h);
  }

  setBeat(v: number) {
    this.beat = v;
  }

  private frame() {
    const gl = this.gl;
    if (!gl || !this.visible || document.hidden) return;
    // ~30 fps is plenty for slow smoke
    if (++this.tick % 2) return;
    gl.uniform2f(this.u.r, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.t, (performance.now() - this.t0) / 1000);
    gl.uniform1f(this.u.b, this.beat);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    gsap.ticker.remove(this.fn);
    removeEventListener('resize', this.onResize);
    this.io.disconnect();
    const lose = this.gl?.getExtension('WEBGL_lose_context');
    lose?.loseContext();
  }
}
