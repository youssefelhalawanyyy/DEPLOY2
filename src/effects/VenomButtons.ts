/**
 * DEPLOY Blue Venom Liquid Button System
 * Ported from Originkit's VenomButton SDF WebGL + Verlet rope physics,
 * adapted to a single shared viewport WebGL + 2D overlay in DEPLOY brand blue
 * so every primary CTA button on the page gets live liquid symbiote tendrils
 * with only 1 WebGL context and zero idle GPU cost.
 */

const MS = 6; // thick SDF strands rendered in WebGL
const NP = 10; // Verlet points per strand
const MSPK = 6; // recoil spikes

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAG = `precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform vec4 uPill;
uniform vec4 uPts[${MS * NP}];
uniform vec4 uBox[${MS}];
uniform float uCount;
uniform vec4 uSpk[${MSPK}];
uniform vec4 uSpkR[${MSPK}];
uniform vec4 uMound;
uniform vec2 uMoundR;
uniform float uLean;
uniform vec3 uBase;
uniform vec3 uShine;
uniform float uRim;
uniform float uGlint;

vec2 smin(vec2 a, vec2 b, float k){
  float h = clamp(0.5 + 0.5 * (b.x - a.x) / k, 0.0, 1.0);
  return vec2(mix(b.x, a.x, h) - k * h * (1.0 - h), mix(b.y, a.y, h));
}

float cone(vec2 p, vec2 a, vec2 b, float ra, float rb, out float r){
  vec2 pb = b - a;
  p -= a;
  float h = dot(pb, pb);
  float t = clamp(dot(p, pb) / (h + 1e-4), 0.0, 1.0);
  r = mix(ra, rb, t);
  float bb = ra - rb;
  if (h <= bb * bb + 1e-3) {
    return ra > rb ? length(p) - ra : length(p - pb) - rb;
  }
  vec2 q = vec2(dot(p, vec2(pb.y, -pb.x)), dot(p, pb)) / h;
  q.x = abs(q.x);
  vec2 c = vec2(sqrt(h - bb * bb), bb);
  float k = c.x * q.y - c.y * q.x;
  float m = dot(c, q);
  float n = dot(q, q);
  if (k < 0.0) return sqrt(h * n) - ra;
  if (k > c.x) return sqrt(h * (n + 1.0 - 2.0 * q.y)) - rb;
  return m - ra;
}

vec2 field(vec2 p){
  float rr = uPill.w * 0.5;
  vec2 c = vec2(uPill.x + uPill.z * 0.5, uPill.y + rr);
  float a = max(0.0, uPill.z * 0.5 - rr);
  vec2 q = p - c;
  vec2 body = vec2(length(q - vec2(clamp(q.x, -a, a), 0.0)) - rr, rr);
  float r;
  if (uMoundR.x > 0.01) {
    float dm = cone(p, uMound.xy, uMound.zw, uMoundR.x, uMoundR.y, r);
    body = smin(body, vec2(dm, rr), 14.0);
  }
  vec2 st = vec2(1e5, 2.0);
  for (int s = 0; s < ${MS}; s++) {
    if (float(s) >= uCount) break;
    vec4 bx = uBox[s];
    vec2 ob = max(max(bx.xy - p, p - bx.zw), 0.0);
    if (dot(ob, ob) > 400.0) continue;
    vec2 one = vec2(1e5, 2.0);
    for (int i = 0; i < ${NP - 1}; i++) {
      vec4 A = uPts[s * ${NP} + i];
      vec4 B = uPts[s * ${NP} + i + 1];
      if (length(p - (A.xy + B.xy) * 0.5) - 0.5 * length(B.xy - A.xy) - max(A.z, B.z) > one.x) continue;
      float d = cone(p, A.xy, B.xy, A.z, B.z, r);
      if (d < one.x) one = vec2(d, r + 0.3);
    }
    st = smin(st, one, 3.5);
  }
  for (int k = 0; k < ${MSPK}; k++) {
    if (uSpkR[k].y < 0.5) continue;
    float d = cone(p, uSpk[k].xy, uSpk[k].zw, uSpkR[k].x, 0.35, r);
    st = smin(st, vec2(d, r + 1.0), 3.0);
  }
  vec2 res = smin(body, st, 11.0);
  res.y = max(res.y, body.y * clamp(-body.x / 6.0, 0.0, 1.0));
  return res;
}

float dist(vec2 p){ return field(p).x; }

float env(vec3 R){
  R.x += uLean * 0.18;
  float up = -R.y;
  float e = 0.06;
  e += smoothstep(0.3, 0.5, up) * smoothstep(0.75, 0.55, up) * smoothstep(0.8, 0.5, abs(R.x)) * 2.4;
  e += smoothstep(0.8, 0.95, up) * 0.55;
  e += smoothstep(-0.5, -0.7, R.x) * smoothstep(0.5, 0.25, abs(R.y)) * 1.05;
  e += smoothstep(0.6, 0.85, R.x) * smoothstep(0.6, 0.2, abs(R.y)) * 0.5;
  e += smoothstep(0.25, 0.7, R.y) * 0.95;
  return e;
}

void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec2 f = field(p);
  float d = f.x;
  float aa = clamp(0.5 - d * uDpr, 0.0, 1.0);
  if (aa <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float B = max(f.y, 0.8);
  float s = clamp(-d, 0.0, B);
  float z = sqrt(max(1e-3, s * (2.0 * B - s)));
  float slope = min((B - s) / z, 6.0);
  float e = 0.5;
  vec2 g = vec2(dist(p + vec2(e, 0.0)) - d, dist(p + vec2(0.0, e)) - d);
  g = length(g) > 1e-6 ? normalize(g) : vec2(0.0);
  vec3 n = normalize(vec3(g * slope, 1.0));
  vec3 R = reflect(vec3(0.0, 0.0, -1.0), n);
  float fres = 0.10 + 0.90 * pow(1.0 - max(n.z, 0.0), 2.6);
  // Rich DEPLOY blue-to-cyan lacquer shading
  vec3 col = uBase + min(env(R) * fres * uRim, 0.95) * uShine;
  col += pow(max(dot(R, normalize(vec3(-0.35, -0.75, 0.56))), 0.0), 60.0) * 1.05 * uGlint;
  col += pow(max(dot(R, normalize(vec3(0.55, -0.35, 0.76))), 0.0), 120.0) * 0.50 * uGlint;

  // Keep the interior of the DOM button semi-transparent so the crisp button text always stays 100% legible,
  // while the outer rim, mound, strands, and spikes are full glossy DEPLOY blue lacquer!
  float rr = uPill.w * 0.5;
  vec2 c = vec2(uPill.x + uPill.z * 0.5, uPill.y + rr);
  float halfLen = max(0.0, uPill.z * 0.5 - rr);
  vec2 q = p - c;
  float pillD = length(q - vec2(clamp(q.x, -halfLen, halfLen), 0.0)) - rr;
  float outsidePill = smoothstep(-3.0, 1.5, pillD);
  float finalAlpha = aa * outsidePill;

  gl_FragColor = vec4(col * finalAlpha, finalAlpha);
}`;

interface Strand {
  x: Float32Array;
  y: Float32Array;
  px: Float32Array;
  py: Float32Array;
  spread: number;
  s: number;
  slack: number;
  width: number;
  ox: number;
  oy: number;
  reachK: number;
  ex: number;
  ey: number;
  follow: number;
  seg: number;
  phase: number;
  hair: boolean;
}

interface Spike {
  s: number;
  tilt: number;
  len: number;
  age: number;
  life: number;
}

const GRIP_OFFSETS: Array<[number, number]> = [
  [0, 0],
  [5, 6],
  [-5, 5],
  [8, 11],
  [-3, 10],
  [4, -4],
];

export function initVenomButtons(selector = '.btn-yellow-pill, .nav-audit-btn'): () => void {
  const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMq.matches) return () => {};

  const glCanvas = document.createElement('canvas');
  glCanvas.className = 'venom-gl-overlay';
  glCanvas.setAttribute('aria-hidden', 'true');

  const webCanvas = document.createElement('canvas');
  webCanvas.className = 'venom-web-overlay';
  webCanvas.setAttribute('aria-hidden', 'true');

  document.body.appendChild(glCanvas);
  document.body.appendChild(webCanvas);

  const hx = webCanvas.getContext('2d');
  const gl = glCanvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });

  if (!gl || !hx) {
    glCanvas.remove();
    webCanvas.remove();
    return () => {};
  }

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) {
    glCanvas.remove();
    webCanvas.remove();
    return () => {};
  }
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    glCanvas.remove();
    webCanvas.remove();
    return () => {};
  }

  gl.useProgram(prog);
  const uni = (n: string) => gl.getUniformLocation(prog, n)!;
  const U = {
    uRes: uni('uRes'),
    uDpr: uni('uDpr'),
    uPill: uni('uPill'),
    uPts: uni('uPts'),
    uBox: uni('uBox'),
    uCount: uni('uCount'),
    uSpk: uni('uSpk'),
    uSpkR: uni('uSpkR'),
    uMound: uni('uMound'),
    uMoundR: uni('uMoundR'),
    uLean: uni('uLean'),
    uBase: uni('uBase'),
    uShine: uni('uShine'),
    uRim: uni('uRim'),
    uGlint: uni('uGlint'),
  };

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  const aLoc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

  const quadData = new Float32Array(8);
  const pts = new Float32Array(MS * NP * 4);
  const box = new Float32Array(MS * 4);
  const spk = new Float32Array(MSPK * 4);
  const spkR = new Float32Array(MSPK * 4);

  let w = window.innerWidth;
  let h = window.innerHeight;
  let dpr = Math.min(2, window.devicePixelRatio || 1);

  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    glCanvas.width = Math.max(1, Math.round(w * dpr));
    glCanvas.height = Math.max(1, Math.round(h * dpr));
    webCanvas.width = glCanvas.width;
    webCanvas.height = glCanvas.height;
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Pointer state
  const ptr = { x: -9999, y: -9999, inside: false };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    ptr.inside = true;
    wake();
  };
  const onLeave = () => {
    ptr.inside = false;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('scroll', wake, { passive: true });

  // Active button & simulation state
  let activeBtn: HTMLElement | null = null;
  const pill = { x: 0, y: 0, w: 0, h: 0, r: 0, ls: 0, P: 1 };
  let mode: 'idle' | 'seek' | 'grow' | 'hold' | 'snap' = 'idle';
  let violentSnap = false;
  let grow = 0;
  let seekF = 0;
  let stretch = 0;
  let mound = 0;
  let moundV = 0;
  let moundS = 0;
  let moundDir = { x: 0, y: 1 };
  let lean = 0;
  let list: Strand[] = [];
  let webs: Array<[number, number, number, number, number]> = [];
  const spikes: Spike[] = [];
  let glDirty = false;
  let ovDirty = false;

  const SENSE = 210;
  const REACH = 115;
  const RELEASE = 185;

  const readPill = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    pill.x = r.left;
    pill.y = r.top;
    pill.w = r.width;
    pill.h = r.height;
    pill.r = r.height / 2;
    pill.ls = Math.max(0, r.width - r.height);
    pill.P = 2 * pill.ls + 2 * Math.PI * pill.r || 1;
  };

  const at = (s: number) => {
    const { x, y, w: W, h: H, r, ls, P } = pill;
    s = ((s % P) + P) % P;
    if (s < ls) return { x: x + r + s, y, nx: 0, ny: -1 };
    s -= ls;
    if (s < Math.PI * r) {
      const a = -Math.PI / 2 + s / r;
      return { x: x + W - r + Math.cos(a) * r, y: y + r + Math.sin(a) * r, nx: Math.cos(a), ny: Math.sin(a) };
    }
    s -= Math.PI * r;
    if (s < ls) return { x: x + W - r - s, y: y + H, nx: 0, ny: 1 };
    s -= ls;
    const a = Math.PI / 2 + s / r;
    return { x: x + r + Math.cos(a) * r, y: y + r + Math.sin(a) * r, nx: Math.cos(a), ny: Math.sin(a) };
  };

  const nearest = (qx: number, qy: number) => {
    const { x, w: W, r, ls } = pill;
    const cy = pill.y + r;
    const cx = Math.max(x + r, Math.min(x + W - r, qx));
    const dist = Math.hypot(qx - cx, qy - cy) - r;
    let s: number;
    if (qx > x + W - r) s = ls + (Math.atan2(qy - cy, qx - cx) + Math.PI / 2) * r;
    else if (qx < x + r) {
      let a = Math.atan2(qy - cy, qx - cx);
      if (a < -Math.PI / 2) a += Math.PI * 2;
      s = 2 * ls + Math.PI * r + (a - Math.PI / 2) * r;
    } else s = qy < cy ? qx - (x + r) : ls + Math.PI * r + (x + W - r - qx);
    return { s, dist };
  };

  const loopDiff = (a: number, b: number) => {
    const P = pill.P;
    let d = (b - a) % P;
    if (d > P / 2) d -= P;
    if (d < -P / 2) d += P;
    return d;
  };

  const findNearestButton = (): { el: HTMLElement | null; dist: number; s: number } => {
    const btns = document.querySelectorAll<HTMLElement>(selector);
    let bestEl: HTMLElement | null = null;
    let bestDist = Infinity;
    let bestS = 0;

    for (const btn of btns) {
      const r = btn.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.bottom < -SENSE || r.top > h + SENSE) continue;
      // Skip hidden modal buttons
      if (btn.closest('dialog:not([open])')) continue;

      const rad = r.height / 2;
      const cy = r.top + rad;
      const cx = Math.max(r.left + rad, Math.min(r.right - rad, ptr.x));
      const d = Math.hypot(ptr.x - cx, ptr.y - cy) - rad;
      if (d < bestDist) {
        bestDist = d;
        bestEl = btn;
        readPill(btn);
        bestS = nearest(ptr.x, ptr.y).s;
      }
    }
    return { el: bestEl, dist: bestDist, s: bestS };
  };

  const spawn = (startS: number) => {
    list = [];
    const total = MS * 2 - 1;
    const root = at(startS);
    for (let k = 0; k < total; k++) {
      const hair = k % 2 === 1;
      const mi = Math.floor(k / 2);
      const g = GRIP_OFFSETS[mi % GRIP_OFFSETS.length];
      list.push({
        x: new Float32Array(NP).fill(root.x),
        y: new Float32Array(NP).fill(root.y),
        px: new Float32Array(NP).fill(root.x),
        py: new Float32Array(NP).fill(root.y),
        spread: (k / (total - 1)) * 2 - 1 + (Math.random() - 0.5) * 0.14,
        s: startS,
        slack: 1.04 + Math.random() * (hair ? 0.18 : 0.12),
        width: hair ? 0.48 : 0.78 + Math.random() * 0.4,
        ox: g[0],
        oy: g[1],
        reachK: hair ? 0.35 : 0.58 + Math.random() * 0.36,
        ex: root.x,
        ey: root.y,
        follow: 10 + Math.random() * 7,
        seg: 0,
        phase: Math.random() * 10,
        hair,
      });
    }
    webs = [];
    for (let k = 0; k < list.length - 1; k++) {
      const i = 3 + Math.floor(Math.random() * (NP - 5));
      const j = Math.max(2, Math.min(NP - 2, i + Math.round((Math.random() - 0.5) * 3)));
      webs.push([k, k + 1, i, j, (Math.random() - 0.5) * 4]);
    }
    grow = 0;
    mode = 'seek';
  };

  const snap = (violent: boolean) => {
    if (mode === 'idle' || mode === 'snap') return;
    mode = 'snap';
    violentSnap = violent;
    if (!violent) return;
    moundV -= 95;
    const seen = new Set<number>();
    for (const st of list) {
      if (st.hair) continue;
      const key = Math.round(st.s / 10);
      if (seen.has(key) || spikes.length >= MSPK) continue;
      seen.add(key);
      spikes.push({
        s: st.s,
        tilt: (Math.random() - 0.5) * 0.75,
        len: 9 + Math.random() * 14,
        age: 0,
        life: 0.9 + Math.random() * 0.5,
      });
    }
  };

  // DEPLOY Blue lacquer palette
  const BASE_RGB: [number, number, number] = [0.06, 0.34, 0.72]; // Deep DEPLOY royal blue
  const SHINE_RGB: [number, number, number] = [0.32, 0.88, 1.0]; // Electric DEPLOY cyan reflection

  let raf = 0;
  let prev = -1;
  let t0 = -1;

  function wake() {
    if (!raf && ptr.inside && !reducedMq.matches) {
      prev = -1;
      raf = window.requestAnimationFrame(frame);
    }
  }

  const frame = (now: number) => {
    raf = 0;
    if (reducedMq.matches) return;
    const dt = prev < 0 ? 0 : Math.min(0.033, (now - prev) / 1000);
    prev = now;
    if (t0 < 0) t0 = now;
    const time = (now - t0) / 1000;

    if (mode === 'idle') {
      if (!ptr.inside) return;
      const hit = findNearestButton();
      if (hit.el && hit.dist < SENSE) {
        activeBtn = hit.el;
        readPill(activeBtn);
        moundS = hit.s;
        spawn(hit.s);
      } else {
        if (glDirty) {
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          glDirty = false;
        }
        if (ovDirty) {
          hx.setTransform(dpr, 0, 0, dpr, 0, 0);
          hx.clearRect(0, 0, w, h);
          ovDirty = false;
        }
        return;
      }
    }

    raf = window.requestAnimationFrame(frame);

    if (!activeBtn || !document.contains(activeBtn)) {
      mode = 'idle';
      activeBtn = null;
      list = [];
      return;
    }

    readPill(activeBtn);
    const near = nearest(ptr.x, ptr.y);
    const D = Math.max(0, near.dist);
    const cx = pill.x + pill.w / 2;
    lean += ((ptr.inside ? Math.max(-1, Math.min(1, (ptr.x - cx) / (pill.w * 1.5))) : 0) - lean) * Math.min(1, dt * 4);

    if (mode === 'snap' && !violentSnap && ptr.inside && D < SENSE) mode = 'seek';
    else if (mode === 'seek' && (!ptr.inside || D > SENSE + 25)) snap(false);
    else if (mode === 'seek' && D < REACH) {
      mode = 'grow';
      grow = 0;
    } else if ((mode === 'grow' || mode === 'hold') && (!ptr.inside || D > RELEASE)) {
      snap(true);
    }

    const holding = mode === 'hold' || mode === 'grow';
    const seeking = mode === 'seek';
    const fT = seeking ? Math.max(0, Math.min(1, (SENSE - D) / Math.max(1, SENSE - REACH))) : holding ? 1 : 0;
    seekF += (fT - seekF) * Math.min(1, dt * 5);
    stretch = holding ? Math.min(1, D / Math.max(1, RELEASE)) : 0;

    if (mode === 'grow') {
      grow = Math.min(1, grow + dt / 0.28);
      if (grow >= 1) mode = 'hold';
    }

    // Verlet rope simulation
    const spreadPx = Math.max(12, Math.min(pill.w * 0.3, D * 0.35 + 12)) * (seeking ? 0.65 : 1);
    let alive = 0;
    for (const st of list) {
      const target = near.s + st.spread * spreadPx;
      st.s += loopDiff(st.s, target) * Math.min(1, dt * (mode === 'snap' ? 1.5 : 6));
      const root = at(st.s);
      const rx = root.x - root.nx * 3;
      const ry = root.y - root.ny * 3;
      let pinTip = false;
      const gx0 = ptr.x + st.ox;
      const gy0 = ptr.y + st.oy;

      if (seeking) {
        const vx = gx0 - rx;
        const vy = gy0 - ry;
        const vl = Math.hypot(vx, vy) || 1;
        const ease = seekF * seekF * (3 - 2 * seekF);
        const dart = Math.pow(Math.max(0, Math.sin(time * 1.9 + st.phase * 3.1)), 10) * 0.26;
        const len = Math.max(3, vl * st.reachK * 0.82 * ease * (1 + dart));
        const sway = Math.sin(time * 2.7 + st.phase) * (3 + 8 * ease);
        const tx = rx + (vx / vl) * len - (vy / vl) * sway;
        const ty = ry + (vy / vl) * len + (vx / vl) * sway;
        const k = 1 - Math.exp(-dt * 6);
        st.ex += (tx - st.ex) * k;
        st.ey += (ty - st.ey) * k;
        pinTip = true;
        st.seg = (Math.hypot(st.ex - rx, st.ey - ry) * (st.slack + 0.05)) / (NP - 1);
      } else if (holding) {
        let gx = gx0;
        let gy = gy0;
        if (mode === 'grow') {
          const coil = Math.pow(1 - grow, 1.6) * (st.hair ? 6 : 11);
          const a = st.phase + grow * 7.5;
          gx += Math.cos(a) * coil;
          gy += Math.sin(a) * coil * 0.8;
        }
        const k = 1 - Math.exp(-dt * (mode === 'grow' ? 20 + st.follow : st.follow * 1.4));
        st.ex += (gx - st.ex) * k;
        st.ey += (gy - st.ey) * k;
        pinTip = true;
        st.seg = (Math.hypot(st.ex - rx, st.ey - ry) * st.slack) / (NP - 1);
      } else {
        st.seg *= Math.exp(-dt * 6.0);
        if (st.seg * (NP - 1) > 1.5) alive++;
      }

      const damp = mode === 'snap' ? 0.86 : 0.92;
      for (let i = 1; i < NP; i++) {
        const vx = (st.x[i] - st.px[i]) * damp;
        const vy = (st.y[i] - st.py[i]) * damp;
        st.px[i] = st.x[i];
        st.py[i] = st.y[i];
        const mid = Math.sin((i / (NP - 1)) * Math.PI);
        const wx = Math.sin(time * 1.6 + st.phase + i * 0.55) * 12 * mid;
        const wy = Math.cos(time * 1.3 + st.phase * 1.3 + i * 0.45) * 12 * mid;
        st.x[i] += vx + wx * dt * dt;
        st.y[i] += vy + (220 + wy) * dt * dt;
      }
      st.x[0] = st.px[0] = rx;
      st.y[0] = st.py[0] = ry;
      if (pinTip) {
        st.x[NP - 1] = st.ex;
        st.y[NP - 1] = st.ey;
      }

      const len = Math.max(0.01, st.seg);
      for (let it = 0; it < 10; it++) {
        for (let i = 0; i < NP - 1; i++) {
          const dx = st.x[i + 1] - st.x[i];
          const dy = st.y[i + 1] - st.y[i];
          const d = Math.hypot(dx, dy) || 0.0001;
          const diff = (d - len) / d;
          const a = i === 0 ? 0 : 0.5;
          const b = pinTip && i + 1 === NP - 1 ? 0 : i === 0 ? 1 : 0.5;
          const m = a + b || 1;
          st.x[i] += dx * diff * (a / m);
          st.y[i] += dy * diff * (a / m);
          st.x[i + 1] -= dx * diff * (b / m);
          st.y[i + 1] -= dy * diff * (b / m);
        }
      }
    }

    if (mode === 'snap' && alive === 0 && spikes.length === 0) {
      mode = 'idle';
      list = [];
      webs = [];
      activeBtn = null;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      glDirty = false;
      hx.setTransform(dpr, 0, 0, dpr, 0, 0);
      hx.clearRect(0, 0, w, h);
      ovDirty = false;
      return;
    }

    const moundTarget = holding ? 5 + 14 * stretch : seeking ? 3 + 8 * seekF : 0;
    moundV += ((moundTarget - mound) * 150 - moundV * 9) * dt;
    mound += moundV * dt;
    if (holding || seeking) {
      moundS += loopDiff(moundS, near.s) * Math.min(1, dt * 6);
      const e = at(moundS);
      const tx = ptr.x - e.x;
      const ty = ptr.y - e.y;
      const tl = Math.hypot(tx, ty) || 1;
      moundDir = { x: e.nx * 0.55 + (tx / tl) * 0.45, y: e.ny * 0.55 + (ty / tl) * 0.45 };
    }

    for (let k = spikes.length - 1; k >= 0; k--) {
      spikes[k].age += dt;
      if (spikes[k].age > spikes[k].life) spikes.splice(k, 1);
    }

    // Upload uniforms
    const thin = 1 - 0.48 * stretch;
    const mains = list.filter((s) => !s.hair).slice(0, MS);
    let minX = pill.x;
    let minY = pill.y;
    let maxX = pill.x + pill.w;
    let maxY = pill.y + pill.h;
    const grow2 = seeking ? 0.55 + 0.45 * seekF : 1;

    mains.forEach((st, si) => {
      let bx0 = Infinity;
      let by0 = Infinity;
      let bx1 = -Infinity;
      let by1 = -Infinity;
      for (let i = 0; i < NP; i++) {
        const f = i / (NP - 1);
        let r = st.width * (2.9 - 1.85 * f) * thin * grow2;
        if (holding) r *= 1 + 0.24 * Math.sin(f * 9 - time * 6 + st.phase) * Math.sin(f * Math.PI);
        if (mode === 'snap') r *= 1.15;
        const o = (si * NP + i) * 4;
        const rr = Math.max(0.55, r);
        pts[o] = st.x[i];
        pts[o + 1] = st.y[i];
        pts[o + 2] = rr;
        pts[o + 3] = 1;
        bx0 = Math.min(bx0, st.x[i] - rr);
        bx1 = Math.max(bx1, st.x[i] + rr);
        by0 = Math.min(by0, st.y[i] - rr);
        by1 = Math.max(by1, st.y[i] + rr);
      }
      box[si * 4] = bx0;
      box[si * 4 + 1] = by0;
      box[si * 4 + 2] = bx1;
      box[si * 4 + 3] = by1;
      minX = Math.min(minX, bx0);
      maxX = Math.max(maxX, bx1);
      minY = Math.min(minY, by0);
      maxY = Math.max(maxY, by1);
    });

    spk.fill(0);
    spkR.fill(0);
    spikes.forEach((sp, k) => {
      const p = sp.age / sp.life;
      const up = p < 0.15 ? 1 - Math.pow(1 - p / 0.15, 3) : p > 0.45 ? Math.max(0, 1 - (p - 0.45) / 0.55) : 1;
      const len = sp.len * (p > 0.45 ? up * up * (3 - 2 * up) : up);
      const b = at(sp.s);
      const sway = Math.sin(sp.age * 14) * Math.exp(-sp.age * 3) * 0.35;
      const ang = Math.atan2(b.ny, b.nx) + sp.tilt + sway;
      const tx = b.x + Math.cos(ang) * len;
      const ty = b.y + Math.sin(ang) * len;
      spk[k * 4] = b.x - b.nx * 2;
      spk[k * 4 + 1] = b.y - b.ny * 2;
      spk[k * 4 + 2] = tx;
      spk[k * 4 + 3] = ty;
      spkR[k * 4] = 2.4 * Math.min(1, up + 0.2);
      spkR[k * 4 + 1] = len > 0.6 ? 1 : 0;
      minX = Math.min(minX, tx);
      maxX = Math.max(maxX, tx);
      minY = Math.min(minY, ty);
      maxY = Math.max(maxY, ty);
    });

    const me = at(moundS);
    const mlen = Math.max(0, mound);
    const mr = mlen > 0.3 ? (8 + spreadPx * 0.28) * Math.min(1, mound / 6) : 0;
    const mtx = me.x + moundDir.x * mlen;
    const mty = me.y + moundDir.y * mlen;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uRes, glCanvas.width, glCanvas.height);
    gl.uniform1f(U.uDpr, dpr);
    gl.uniform4f(U.uPill, pill.x, pill.y, pill.w, pill.h);
    gl.uniform4fv(U.uPts, pts);
    gl.uniform4fv(U.uBox, box);
    gl.uniform1f(U.uCount, mains.length);
    gl.uniform4fv(U.uSpk, spk);
    gl.uniform4fv(U.uSpkR, spkR);
    gl.uniform4f(U.uMound, me.x - me.nx * 6, me.y - me.ny * 6, mtx, mty);
    gl.uniform2f(U.uMoundR, mr, mr * 0.45);
    gl.uniform1f(U.uLean, lean);
    gl.uniform3f(U.uBase, BASE_RGB[0], BASE_RGB[1], BASE_RGB[2]);
    gl.uniform3f(U.uShine, SHINE_RGB[0], SHINE_RGB[1], SHINE_RGB[2]);
    gl.uniform1f(U.uRim, 1.0);
    gl.uniform1f(U.uGlint, 1.0);

    const pad = 30;
    const x0 = Math.max(0, minX - pad);
    const x1 = Math.min(w, maxX + pad);
    const y0 = Math.max(0, minY - pad);
    const y1 = Math.min(h, maxY + pad);
    const X = (v: number) => (v / w) * 2 - 1;
    const Y = (v: number) => 1 - (v / h) * 2;
    quadData.set([X(x0), Y(y0), X(x1), Y(y0), X(x0), Y(y1), X(x1), Y(y1)]);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    glDirty = true;

    // Fine DEPLOY-blue hairs & symbiote web threads
    hx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hx.clearRect(0, 0, w, h);
    ovDirty = true;
    hx.lineCap = 'round';
    hx.lineJoin = 'round';

    if (list.length && (holding || mode === 'snap')) {
      hx.strokeStyle = 'rgba(34, 193, 236, 0.85)';
      for (const st of list) {
        if (!st.hair) continue;
        hx.lineWidth = 0.85 * thin;
        hx.beginPath();
        hx.moveTo(st.x[0], st.y[0]);
        for (let i = 1; i < NP - 1; i++) {
          hx.quadraticCurveTo(st.x[i], st.y[i], (st.x[i] + st.x[i + 1]) / 2, (st.y[i] + st.y[i + 1]) / 2);
        }
        hx.lineTo(st.x[NP - 1], st.y[NP - 1]);
        hx.stroke();
      }

      if (mode === 'hold') {
        hx.strokeStyle = 'rgba(115, 226, 255, 0.55)';
        hx.lineWidth = 0.6;
        for (const [a, b, i, j, kink] of webs) {
          const As = list[a];
          const Bs = list[b];
          if (!As || !Bs) continue;
          hx.beginPath();
          hx.moveTo(As.x[i], As.y[i]);
          hx.lineTo((As.x[i] + Bs.x[j]) / 2 + kink, (As.y[i] + Bs.y[j]) / 2 - Math.abs(kink) * 0.4);
          hx.lineTo(Bs.x[j], Bs.y[j]);
          hx.stroke();
        }
      }
    }
  };

  return () => {
    window.cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('scroll', wake);
    document.removeEventListener('pointerleave', onLeave);
    glCanvas.remove();
    webCanvas.remove();
  };
}
