import { Renderer, Program, Mesh, Triangle, Plane, Texture, RenderTarget } from 'ogl';

export interface FlexCarouselItem {
  src: string;
  fullSrc?: string;
  alt?: string;
  title?: string;
  subtitle?: string;
}

export interface FlexCarouselOptions {
  items: FlexCarouselItem[];
  cardHeight?: number;
  gap?: number;
  squeeze?: number;
  focusOnClick?: boolean;
  captions?: boolean;
  fit?: 'natural' | 'portrait' | 'square' | 'landscape';
  radius?: number;
  lensWidth?: number;
  lensHeight?: number;
  tilt?: number;
  roundness?: number;
  bend?: number;
  reach?: number;
  curl?: 'twist' | 'rise' | 'fall';
  dispersion?: number;
  liquid?: number;
  followCursor?: boolean;
  onSelect?: (index: number, item: FlexCarouselItem) => void;
  onChange?: (index: number, item: FlexCarouselItem) => void;
}

export interface FlexCarouselController {
  setItems: (items: FlexCarouselItem[], currentScrollP?: number) => void;
  setScrollProgress: (progress: number) => void;
  goToIndex: (index: number) => void;
  destroy: () => void;
}

interface Slot {
  item: FlexCarouselItem;
  index: number;
  texture: Texture;
  aspect: number;
  loaded: boolean;
  failed: boolean;
  ready: number;
  color: number[];
  image: number[];
  dispose: () => void;
}

interface Metrics {
  cardH: number;
  widths: number[];
  centers: number[];
  gap: number;
  loop: number;
}

interface Instance {
  index: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

const FIT_ASPECT: Record<string, number> = { portrait: 0.75, square: 1, landscape: 4 / 3 };
const TAPS = 12;
const PIXEL_BUDGET = 4.5e6;
const RISE_DURATION = 1.65;

const wrap = (value: number, size: number) => ((((value + size / 2) % size) + size) % size) - size / 2;
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const easeOutQuint = (value: number) => 1 - Math.pow(1 - clamp01(value), 5);
const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const cardVertex = `#version 300 es
in vec3 position;
in vec2 uv;
uniform vec4 uRect;
uniform vec2 uResolution;
out vec2 vUv;
out vec2 vLocal;
void main() {
  vUv = uv;
  vLocal = vec2(position.x, -position.y) * uRect.zw;
  vec2 px = uRect.xy + vLocal;
  gl_Position = vec4(px.x / uResolution.x * 2.0 - 1.0, 1.0 - px.y / uResolution.y * 2.0, 0.0, 1.0);
}
`;

const cardFragment = `#version 300 es
precision highp float;
uniform sampler2D tMap;
uniform vec2 uSize;
uniform vec2 uImage;
uniform float uRadius;
uniform float uAlpha;
uniform float uReady;
uniform float uShift;
uniform float uDpr;
uniform vec3 uPlaceholder;
in vec2 vUv;
in vec2 vLocal;
out vec4 fragColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  float sd = roundedBox(vLocal, uSize * 0.5, min(uRadius, min(uSize.x, uSize.y) * 0.5));
  float mask = clamp(0.5 - sd * uDpr, 0.0, 1.0);
  vec2 local = vLocal / uSize + 0.5;
  float cardAspect = uSize.x / uSize.y;
  float imageAspect = uImage.x / max(uImage.y, 1.0);
  vec2 scale = imageAspect > cardAspect ? vec2(cardAspect / imageAspect, 1.0) : vec2(1.0, imageAspect / cardAspect);
  scale /= 1.06;
  vec2 uv = vec2(local.x, 1.0 - local.y);
  uv = (uv - 0.5) * scale + 0.5;
  uv.x += uShift * (1.0 - scale.x) * 0.5;
  vec3 image = texture(tMap, uv).rgb;
  vec3 color = mix(uPlaceholder, image, uReady);
  float alpha = mask * uAlpha;
  fragColor = vec4(color * alpha, alpha);
}
`;

const lensVertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const lensFragment = `#version 300 es
precision highp float;
uniform sampler2D tScene;
uniform vec2 uResolution;
uniform float uDpr;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uAngle;
uniform float uExponent;
uniform float uInner;
uniform float uOuter;
uniform float uFlow;
uniform float uCurl;
uniform float uDispersion;
uniform float uStrength;
uniform float uSceneAlpha;
out vec4 fragColor;

void main() {
  vec2 frag = gl_FragCoord.xy / uDpr;
  vec2 uv = frag / uResolution;
  vec2 rel = frag - vec2(uCenter.x, uResolution.y - uCenter.y);
  float ca = cos(uAngle);
  float sa = sin(uAngle);
  vec2 local = vec2(ca * rel.x + sa * rel.y, -sa * rel.x + ca * rel.y);
  vec2 k = max(abs(local) / uHalf, vec2(1e-5));
  float nd = pow(pow(k.x, uExponent) + pow(k.y, uExponent), 1.0 / uExponent);
  vec2 grad = pow(k, vec2(uExponent - 1.0)) * sign(local) / uHalf * pow(nd, 1.0 - uExponent);
  float glen = max(length(grad), 1e-6);
  float edge = (nd - 1.0) / glen;
  vec2 outward = grad / glen;
  vec2 normal = vec2(ca * outward.x - sa * outward.y, sa * outward.x + ca * outward.y);
  vec2 along = vec2(-normal.y, normal.x);

  float t = clamp((edge + uInner) / (uInner + uOuter), 0.0, 1.0);
  float ramp = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  float slope = 16.0 * t * t * (1.0 - t) * (1.0 - t);
  float reachX = rel.x / (uResolution.x * 0.5);
  float side = smoothstep(0.02, 0.3, abs(reachX)) * (uCurl == 0.0 ? sign(reachX) : uCurl);
  float lift = ramp * side * uFlow * uStrength;
  vec2 swirl = along * along.y * side * slope * uFlow * uStrength * 0.35;
  vec2 drift = vec2(0.0, -lift) - swirl;
  vec2 shifted = uv + drift / uResolution;

  vec2 texels = uResolution * uDpr;
  vec2 gx = dFdx(shifted);
  vec2 gy = dFdy(shifted);
  gx *= min(1.0, 3.0 / max(length(gx * texels), 1e-4));
  gy *= min(1.0, 3.0 / max(length(gy * texels), 1e-4));

  vec4 color = textureGrad(tScene, shifted, gx, gy);
  vec2 spread = vec2(0.0, side * slope * uFlow * uStrength) / uResolution * uDispersion;
  float spreadPx = length(spread * texels);
  if (color.a > 0.002 && spreadPx > 0.25) {
    vec3 base = color.rgb / color.a;
    vec3 sumColor = vec3(0.0);
    vec3 sumWeight = vec3(0.0);
    for (int i = 0; i < ${TAPS}; i++) {
      float s = (float(i) + 0.5) / float(${TAPS});
      vec4 c = textureGrad(tScene, shifted + spread * (s - 0.5), gx, gy);
      vec3 w = max(1.0 - abs(vec3(s) - vec3(0.15, 0.5, 0.85)) * 2.6, 0.0) * c.a;
      sumColor += c.rgb * (w / max(c.a, 0.002));
      sumWeight += w;
    }
    vec3 split = mix(base, sumColor / max(sumWeight, vec3(1e-4)), clamp(sumWeight * 2.0, 0.0, 1.0));
    color.rgb = mix(color.rgb, clamp(split, 0.0, 1.0) * color.a, smoothstep(0.25, 1.5, spreadPx));
  }

  fragColor = color * uSceneAlpha;
}
`;

function buildReelDigitsHTML(): string {
  const col = () =>
    `<span class="flex-carousel__digit"><span class="flex-carousel__reel">${'0123456789'
      .split('')
      .map((n) => `<span>${n}</span>`)
      .join('')}</span></span>`;
  return `<span class="flex-carousel__digits">${col()}${col()}</span>`;
}

export function mountFlexCarousel(
  container: HTMLElement,
  opts: FlexCarouselOptions
): FlexCarouselController {
  const s = {
    cardHeight: opts.cardHeight ?? 0.54,
    gap: opts.gap ?? 12,
    squeeze: opts.squeeze ?? 0.2,
    focusOnClick: opts.focusOnClick ?? true,
    captions: opts.captions ?? true,
    fit: opts.fit ?? 'natural',
    radius: opts.radius ?? 0,
    lensWidth: opts.lensWidth ?? 0.74,
    lensHeight: opts.lensHeight ?? 1.18,
    tilt: opts.tilt ?? 62,
    roundness: opts.roundness ?? 1,
    bend: opts.bend ?? 0.34,
    reach: opts.reach ?? 0.38,
    curl: opts.curl ?? 'twist',
    dispersion: opts.dispersion ?? 0.45,
    liquid: opts.liquid ?? 0,
    followCursor: opts.followCursor ?? false,
  };

  container.classList.add('flex-carousel');
  container.style.setProperty('--flex-carousel-half', `${Math.min(Math.max(s.cardHeight, 0.05), 1) * 50}%`);
  container.setAttribute('role', 'region');
  container.setAttribute('aria-roledescription', 'carousel');
  container.setAttribute('aria-label', 'Project screens carousel');
  container.tabIndex = 0;

  // Caption + Rolling Reel Counter + Polite Live Region
  const captionEl = document.createElement('div');
  captionEl.className = 'flex-carousel__caption';
  captionEl.setAttribute('aria-hidden', 'true');
  captionEl.innerHTML = `
    <span class="flex-carousel__title">
      <span class="fc-title-main"></span>
      <span class="flex-carousel__subtitle"></span>
    </span>
    <span class="flex-carousel__count">
      ${buildReelDigitsHTML()}
      <span class="flex-carousel__slash">/</span>
      <span class="fc-total-count">01</span>
    </span>
  `;

  const liveEl = document.createElement('div');
  liveEl.className = 'flex-carousel__live';
  liveEl.setAttribute('aria-live', 'polite');
  liveEl.setAttribute('aria-atomic', 'true');

  if (s.captions) container.appendChild(captionEl);
  container.appendChild(liveEl);

  const titleMainEl = captionEl.querySelector<HTMLElement>('.fc-title-main')!;
  const subtitleEl = captionEl.querySelector<HTMLElement>('.flex-carousel__subtitle')!;
  const countWrapEl = captionEl.querySelector<HTMLElement>('.flex-carousel__count')!;
  const totalCountEl = captionEl.querySelector<HTMLElement>('.fc-total-count')!;
  const reelEls = Array.from(captionEl.querySelectorAll<HTMLElement>('.flex-carousel__reel'));

  let currentItems = opts.items.slice();

  const updateCaptionDOM = (index: number, focusOpen: boolean) => {
    const item = currentItems[index] || currentItems[0];
    if (!item) return;
    titleMainEl.textContent = item.title || item.alt || '';
    subtitleEl.textContent = item.subtitle || '';
    subtitleEl.hidden = !item.subtitle;
    totalCountEl.textContent = String(currentItems.length).padStart(2, '0');
    const digits = String(index + 1).padStart(2, '0');
    reelEls.forEach((reel, idx) => {
      reel.style.transform = `translateY(${-Number(digits[idx] || 0) * 10}%)`;
    });
    if (focusOpen) countWrapEl.setAttribute('data-hidden', '');
    else countWrapEl.removeAttribute('data-hidden');
    liveEl.textContent = `${item.title || item.alt || 'Screen'}, ${index + 1} of ${currentItems.length}`;
  };

  // Attempt WebGL2 initialization via OGL
  let renderer: Renderer | null = null;
  try {
    renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
    });
  } catch {
    renderer = null;
  }

  if (!renderer || !renderer.isWebgl2) {
    renderer?.gl.getExtension('WEBGL_lose_context')?.loseContext();
    // Clean CSS fallback if WebGL2 is unavailable
    const fallbackStrip = document.createElement('div');
    fallbackStrip.className = 'fc-css-fallback';
    container.prepend(fallbackStrip);
    const renderFallback = (list: FlexCarouselItem[]) => {
      fallbackStrip.innerHTML = list
        .map(
          (it) => `<img src="${it.src}" alt="${it.alt || it.title || ''}" loading="lazy" decoding="async" />`
        )
        .join('');
    };
    renderFallback(currentItems);
    updateCaptionDOM(0, false);
    return {
      setItems: (next) => {
        currentItems = next.slice();
        renderFallback(currentItems);
        updateCaptionDOM(0, false);
      },
      setScrollProgress: (p) => {
        const maxScroll = Math.max(0, fallbackStrip.scrollWidth - fallbackStrip.clientWidth);
        fallbackStrip.scrollLeft = clamp01(p) * maxScroll;
        const idx = Math.min(currentItems.length - 1, Math.round(clamp01(p) * Math.max(0, currentItems.length - 1)));
        updateCaptionDOM(idx, false);
      },
      goToIndex: (i) => updateCaptionDOM(i, false),
      destroy: () => {
        fallbackStrip.remove();
        captionEl.remove();
        liveEl.remove();
      },
    };
  }

  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  const canvas = gl.canvas as HTMLCanvasElement;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.setAttribute('aria-hidden', 'true');
  container.prepend(canvas);

  const cardProgram = new Program(gl, {
    vertex: cardVertex,
    fragment: cardFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tMap: { value: new Texture(gl) },
      uRect: { value: [0, 0, 1, 1] },
      uResolution: { value: [1, 1] },
      uSize: { value: [1, 1] },
      uImage: { value: [1, 1] },
      uRadius: { value: s.radius },
      uAlpha: { value: 1 },
      uReady: { value: 0 },
      uShift: { value: 0 },
      uDpr: { value: 1 },
      uPlaceholder: { value: [0.88, 0.87, 0.85] },
    },
  });
  cardProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const cardMesh = new Mesh(gl, { geometry: new Plane(gl), program: cardProgram });

  const target = new RenderTarget(gl, {
    width: 2,
    height: 2,
    depth: false,
    minFilter: gl.LINEAR_MIPMAP_LINEAR,
    magFilter: gl.LINEAR,
  });

  const lensUniforms = {
    tScene: { value: target.texture },
    uResolution: { value: [1, 1] },
    uDpr: { value: 1 },
    uCenter: { value: [0, 0] },
    uHalf: { value: [1, 1] },
    uAngle: { value: 0 },
    uExponent: { value: 2 },
    uInner: { value: 60 },
    uOuter: { value: 80 },
    uFlow: { value: 0 },
    uCurl: { value: 0 },
    uDispersion: { value: 0 },
    uStrength: { value: 0 },
    uSceneAlpha: { value: 0 },
  };

  const lensMesh = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, {
      vertex: lensVertex,
      fragment: lensFragment,
      uniforms: lensUniforms,
      depthTest: false,
      depthWrite: false,
    }),
  });

  const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const anisotropy = renderer.getExtension('EXT_texture_filter_anisotropic') ? 8 : 0;

  let slots: Slot[] = [];
  let width = 1;
  let height = 1;
  let pos = 0;
  let vel = 0;
  let goal = 0;
  let scrollP = 0;
  let manualOffset = 0;
  let raf = 0;
  let last = performance.now();
  let visible = true;
  let alive = true;
  let dirty = true;
  let activeIndex = -1;
  let deform = 0;
  let deformVel = 0;
  let layout: Metrics | null = null;
  let resnap = false;
  let hover = '';
  let lift = 1;
  let energy = 0;
  let lastPos = 0;
  let instances: Instance[] = [];

  const introState = { running: false, done: false, t: 0, readyAt: performance.now() };
  const focus = { index: -1, pending: -1, t: 0, v: 0, target: 0 };
  const pointer = {
    x: 0,
    y: 0,
    over: false,
    down: false,
    id: -1,
    startX: 0,
    startY: 0,
    startOffset: 0,
    dragging: false,
    touch: false,
    samples: [] as Array<{ x: number; t: number }>,
  };

  const loadSlot = (item: FlexCarouselItem, index: number): Slot => {
    const texture = new Texture(gl, {
      generateMipmaps: true,
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      magFilter: gl.LINEAR,
      anisotropy,
    });
    const slot: Slot = {
      item,
      index,
      texture,
      aspect: 1.55,
      loaded: false,
      failed: false,
      ready: 0,
      color: [0.89, 0.88, 0.86],
      image: [16, 10],
      dispose: () => {},
    };
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      if (!alive || !slots.includes(slot)) return;
      texture.image = image;
      texture.update();
      slot.image = [image.naturalWidth || 1, image.naturalHeight || 1];
      slot.aspect = slot.image[0] / slot.image[1];
      try {
        const probe = document.createElement('canvas');
        probe.width = 8;
        probe.height = 8;
        const ctx = probe.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(image, 0, 0, 8, 8);
          const data = ctx.getImageData(0, 0, 8, 8).data;
          const avg = [0, 0, 0];
          for (let i = 0; i < data.length; i += 4) {
            avg[0] += data[i];
            avg[1] += data[i + 1];
            avg[2] += data[i + 2];
          }
          slot.color = avg.map((v) => v / 64 / 255);
        }
      } catch {
        slot.color = [0.89, 0.88, 0.86];
      }
      slot.loaded = true;
      dirty = true;
      start();
    };
    image.onerror = () => {
      if (!alive) return;
      slot.failed = true;
      dirty = true;
      start();
    };
    image.src = item.src;
    slot.dispose = () => {
      image.onload = null;
      image.onerror = null;
      gl.deleteTexture(texture.texture);
    };
    return slot;
  };

  const computeMetrics = (): Metrics => {
    const cardH = Math.max(40, s.cardHeight * height);
    const fixed = FIT_ASPECT[s.fit];
    const widths = slots.map((slot) => (fixed || slot.aspect) * cardH);
    const centers: number[] = [];
    let cursor = 0;
    for (let i = 0; i < widths.length; i++) {
      centers.push(cursor + widths[i] / 2);
      cursor += widths[i] + s.gap;
    }
    return { cardH, widths, centers, gap: s.gap, loop: Math.max(cursor, 1) };
  };

  const scrollTargetFor = (m: Metrics, p: number): number => {
    if (!m.centers.length) return 0;
    const first = m.centers[0];
    const lastCenter = m.centers[m.centers.length - 1];
    return first + clamp01(p) * Math.max(0, lastCenter - first);
  };

  const nearest = (m: Metrics, at: number) => {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < m.centers.length; i++) {
      const dist = Math.abs(wrap(m.centers[i] - at, m.loop));
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  };

  const snapPoint = (m: Metrics, at: number) => {
    const i = nearest(m, at);
    return at + wrap(m.centers[i] - at, m.loop);
  };

  const openFocus = (index: number) => {
    focus.index = index;
    focus.pending = -1;
    focus.target = 1;
    updateCaptionDOM(index, true);
    dirty = true;
    start();
  };

  const closeFocus = () => {
    focus.pending = -1;
    if (focus.target === 0) return false;
    focus.target = 0;
    if (activeIndex >= 0) updateCaptionDOM(activeIndex, false);
    dirty = true;
    start();
    return true;
  };

  let resizePending = true;
  const applyResize = () => {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    renderer!.dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (width * height)));
    renderer!.setSize(width, height);
    target.setSize(Math.max(2, Math.round(width * renderer!.dpr)), Math.max(2, Math.round(height * renderer!.dpr)));
    lensUniforms.tScene.value = target.texture;
    dirty = true;
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive) return;
    if (resizePending) {
      resizePending = false;
      applyResize();
    }
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;

    if (!slots.length) {
      if (visible) raf = window.requestAnimationFrame(frame);
      return;
    }

    const reducedMotion = reducedMq.matches;
    const m = computeMetrics();
    const n = slots.length;
    let animating = false;

    const baseScrollPos = scrollTargetFor(m, scrollP);

    if (resnap || !layout) {
      goal = baseScrollPos + manualOffset;
      pos = goal;
      vel = 0;
      resnap = false;
    } else if (layout.loop !== m.loop) {
      goal = baseScrollPos + manualOffset;
      animating = true;
    }
    layout = m;

    if (!pointer.dragging) {
      goal = baseScrollPos + manualOffset;
      const stiffness = 62;
      const damping = 2 * Math.sqrt(stiffness);
      const steps = Math.ceil(dt / (1 / 240));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        const acc = stiffness * (goal - pos) - damping * vel;
        vel += acc * h;
        pos += vel * h;
      }
      if (Math.abs(goal - pos) < 0.05 && Math.abs(vel) < 0.5) {
        pos = goal;
        vel = 0;
      } else {
        animating = true;
      }
    } else {
      animating = true;
    }

    // Intro "rise" animation
    if (!introState.running && !introState.done) {
      const anyReady = slots.some((sl) => sl.loaded) || now - introState.readyAt > 1200;
      if (anyReady) {
        if (reducedMotion) {
          introState.done = true;
          introState.t = 1;
        } else {
          introState.running = true;
          introState.t = 0;
        }
      }
    }
    if (introState.running) {
      introState.t = Math.min(1, introState.t + dt / RISE_DURATION);
      if (introState.t >= 1) {
        introState.running = false;
        introState.done = true;
      }
      animating = true;
    }

    const current = nearest(m, pos);
    if (current !== activeIndex) {
      activeIndex = current;
      updateCaptionDOM(current, focus.target > 0);
      opts.onChange?.(current, currentItems[current]);
    }

    if (focus.pending >= 0 && Math.abs(goal - pos) < 1.8 && Math.abs(vel) < 35) {
      if (current === focus.pending) openFocus(current);
      else focus.pending = -1;
    }

    const travel = Math.abs(pos - lastPos) / dt;
    lastPos = pos;
    const energyTarget = reducedMotion ? 0 : Math.min(travel / 2400, 1);
    energy += (energyTarget - energy) * (1 - Math.exp(-dt / (energyTarget > energy ? 0.07 : 0.35)));
    if (energy > 0.001) animating = true;

    const push = Math.max(-1, Math.min(1, vel / 2200));
    const deformK = 120;
    const deformC = 2 * Math.sqrt(deformK) * 0.32;
    deformVel += (deformK * (push - deform) - deformC * deformVel) * dt;
    deform += deformVel * dt;

    const focusK = 64;
    focus.v += (focusK * (focus.target - focus.t) - 2 * Math.sqrt(focusK) * focus.v) * dt;
    focus.t += focus.v * dt;
    if (Math.abs(focus.target - focus.t) < 0.0005 && Math.abs(focus.v) < 0.001) {
      focus.t = focus.target;
      focus.v = 0;
    } else {
      animating = true;
    }

    const focusAmount = clamp01(focus.t);
    const focusEase = easeInOut(focusAmount);
    const focusW = focus.index >= 0 && focus.index < n ? m.widths[focus.index] : m.cardH;
    const focusScale = Math.max(1, Math.min(1.36, (height * 0.84) / m.cardH, (width * 0.92) / focusW));
    const nextLift = 1 + (focusScale - 1) * focusEase;
    if (Math.abs(nextLift - lift) > 0.0005) {
      lift = nextLift;
      container.style.setProperty('--flex-carousel-lift', lift.toFixed(4));
    }

    for (let i = 0; i < n; i++) {
      const slot = slots[i];
      if (slot.loaded && slot.ready < 1) {
        slot.ready = Math.min(1, slot.ready + dt / 0.42);
        animating = true;
      }
    }

    const introT = introState.running ? introState.t : introState.done ? 1 : 0;
    const introStrength = introT >= 1 ? 1 : easeInOut((introT - 0.25) / 0.7);
    const sceneAlpha = !introState.done && !introState.running ? 0 : 1;

    if (dirty || animating || pointer.dragging) {
      dirty = false;
      instances = [];
      const dpr = renderer!.dpr;
      const homeX = width / 2;
      const homeY = height * 0.46;

      cardProgram.uniforms.uResolution.value = [width, height];
      cardProgram.uniforms.uDpr.value = dpr;
      cardProgram.uniforms.uRadius.value = s.radius;

      const shrink = 1 - clamp01(s.squeeze) * energy;
      const draws: Array<{ i: number; rel: number; x: number; y: number; cw: number; ch: number; alpha: number }> = [];

      for (let i = 0; i < n; i++) {
        const w = m.widths[i];
        const baseRel = wrap(m.centers[i] - pos, m.loop);
        for (let k = -3; k <= 3; k++) {
          const rel = baseRel + k * m.loop;
          if (Math.abs(rel) - w / 2 > width + 40) continue;

          let fxAlpha = 1;
          let fxY = 0;
          let fxScale = 1;
          if (introT < 1) {
            const delay = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.34;
            const local = clamp01((introT - delay) / 0.6);
            fxAlpha = clamp01(local * 4);
            fxY = (1 - easeOutQuint(local)) * height * 0.55;
            fxScale = 0.54 + 0.46 * easeInOut((local - 0.18) / 0.82);
          }

          let x = homeX + rel;
          let scale = shrink * fxScale;
          let alpha = fxAlpha;

          if (focusAmount > 0) {
            if (i === focus.index && Math.abs(rel) < w) {
              scale *= 1 + (focusScale - 1) * focusEase;
            } else {
              const order = Math.min(Math.abs(rel) / width, 1) * 0.25;
              const part = easeInOut(focusAmount * 1.25 - order);
              x += Math.sign(rel) * part * width * 0.7;
              alpha *= 1 - part;
            }
          }

          const cw = w * scale;
          if (alpha <= 0.001 || x + cw / 2 < -40 || x - cw / 2 > width + 40) continue;
          draws.push({ i, rel, x, y: homeY + fxY, cw, ch: m.cardH * scale, alpha });
        }
      }

      draws.sort((a, b) => Math.abs(b.rel) - Math.abs(a.rel));
      let first = true;
      for (const draw of draws) {
        const slot = slots[draw.i];
        cardProgram.uniforms.tMap.value = slot.texture;
        cardProgram.uniforms.uRect.value = [draw.x, draw.y, draw.cw + 2, draw.ch + 2];
        cardProgram.uniforms.uSize.value = [draw.cw, draw.ch];
        cardProgram.uniforms.uImage.value = slot.image;
        cardProgram.uniforms.uAlpha.value = draw.alpha;
        cardProgram.uniforms.uReady.value = slot.ready;
        cardProgram.uniforms.uShift.value = reducedMotion ? 0 : Math.max(-1, Math.min(1, draw.rel / (width * 0.75)));
        cardProgram.uniforms.uPlaceholder.value = slot.color;
        renderer!.render({ scene: cardMesh, target, clear: first });
        first = false;
        instances.push({
          index: draw.i,
          x0: draw.x - draw.cw / 2,
          x1: draw.x + draw.cw / 2,
          y0: draw.y - draw.ch / 2,
          y1: draw.y + draw.ch / 2,
        });
      }

      if (first) {
        renderer!.bindFramebuffer(target);
        gl.viewport(0, 0, target.width, target.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }

      renderer!.bindFramebuffer();
      target.texture.bind();
      gl.generateMipmap(gl.TEXTURE_2D);

      const halfW = (s.lensWidth * width) / 2;
      const halfH = (s.lensHeight * width) / 2;
      const spanW = Math.max(halfW, 1);
      const spanH = Math.max(halfH, 1);
      const inner = Math.max(4, s.reach * (spanW + spanH) * 0.5);

      lensUniforms.uResolution.value = [width, height];
      lensUniforms.uDpr.value = dpr;
      lensUniforms.uCenter.value = [homeX, homeY];
      lensUniforms.uHalf.value = [spanW, spanH];
      lensUniforms.uAngle.value = (s.tilt * Math.PI) / 180;
      lensUniforms.uExponent.value = 2 + Math.pow(1 - clamp01(s.roundness), 1.5) * 10;
      lensUniforms.uInner.value = inner;
      lensUniforms.uOuter.value = inner * 1.6;
      lensUniforms.uFlow.value = s.bend * (spanW + spanH) * 0.45;
      lensUniforms.uCurl.value = s.curl === 'rise' ? 1 : s.curl === 'fall' ? -1 : 0;
      lensUniforms.uDispersion.value = s.dispersion * 0.12;
      lensUniforms.uStrength.value = (reducedMotion ? 0 : introStrength) * (1 - focusEase);
      lensUniforms.uSceneAlpha.value = sceneAlpha;
      renderer!.render({ scene: lensMesh });
    }

    let nextHover = '';
    if (pointer.over && !pointer.dragging && introState.done && s.focusOnClick) {
      const hit = instances.find(
        (inst) => pointer.x >= inst.x0 && pointer.x <= inst.x1 && pointer.y >= inst.y0 && pointer.y <= inst.y1
      );
      if (focus.target > 0) nextHover = 'close';
      else if (hit) nextHover = 'open';
    }
    if (nextHover !== hover) {
      hover = nextHover;
      if (hover) container.setAttribute('data-hover', hover);
      else container.removeAttribute('data-hover');
    }

    if (visible && (animating || !introState.done || dirty || pointer.down)) {
      raf = window.requestAnimationFrame(frame);
    }
  };

  const start = () => {
    if (raf || !visible || !alive) return;
    last = performance.now();
    raf = window.requestAnimationFrame(frame);
  };

  const setItems = (next: FlexCarouselItem[], currentScrollP?: number) => {
    if (currentScrollP !== undefined) scrollP = clamp01(currentScrollP);
    manualOffset = 0;
    currentItems = next.slice();
    slots.forEach((sl) => sl.dispose());
    slots = currentItems.map(loadSlot);
    activeIndex = -1;
    layout = null;
    resnap = true;
    focus.target = 0;
    focus.t = 0;
    focus.v = 0;
    focus.pending = -1;
    introState.done = false;
    introState.running = false;
    introState.t = 0;
    introState.readyAt = performance.now();
    updateCaptionDOM(0, false);
    dirty = true;
    start();
  };

  const localPoint = (e: PointerEvent) => {
    const r = container.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== undefined && e.button > 0) return;
    if (introState.running) {
      introState.t = 1;
      introState.running = false;
      introState.done = true;
    }
    const [x, y] = localPoint(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.touch = e.pointerType === 'touch';
    pointer.startX = x;
    pointer.startY = y;
    pointer.x = x;
    pointer.y = y;
    pointer.startOffset = manualOffset;
    pointer.dragging = false;
    pointer.samples = [{ x, t: performance.now() }];
    dirty = true;
    start();
  };

  const onPointerMove = (e: PointerEvent) => {
    const [x, y] = localPoint(e);
    pointer.x = x;
    pointer.y = y;
    pointer.over = true;
    if (pointer.down && e.pointerId === pointer.id) {
      const dx = x - pointer.startX;
      const dy = y - pointer.startY;
      const slop = pointer.touch ? 10 : 5;
      if (!pointer.dragging) {
        if (pointer.touch && Math.abs(dy) > slop && Math.abs(dy) > Math.abs(dx)) {
          pointer.down = false;
          return;
        }
        if (Math.abs(dx) > slop) {
          pointer.dragging = true;
          pointer.startX = x;
          pointer.startOffset = manualOffset;
          closeFocus();
          try {
            container.setPointerCapture(e.pointerId);
          } catch {
            // ignore
          }
          container.setAttribute('data-dragging', '');
        }
      }
      if (pointer.dragging && layout) {
        manualOffset = pointer.startOffset - (x - pointer.startX);
        pos = scrollTargetFor(layout, scrollP) + manualOffset;
        goal = pos;
        vel = 0;
        const now = performance.now();
        pointer.samples.push({ x, t: now });
        while (pointer.samples.length > 2 && now - pointer.samples[0].t > 100) pointer.samples.shift();
      }
    }
    dirty = true;
    start();
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!pointer.down || e.pointerId !== pointer.id) return;
    pointer.down = false;
    container.removeAttribute('data-dragging');
    const m = computeMetrics();
    const base = scrollTargetFor(m, scrollP);

    if (pointer.dragging) {
      pointer.dragging = false;
      const now = performance.now();
      const firstS = pointer.samples[0];
      const lastS = pointer.samples[pointer.samples.length - 1];
      let velocity = 0;
      if (firstS && lastS && lastS.t > firstS.t && now - lastS.t < 70) {
        velocity = -((lastS.x - firstS.x) / (lastS.t - firstS.t)) * 1000;
      }
      vel = velocity;
      const landing = snapPoint(m, pos + velocity * 0.28);
      manualOffset = landing - base;
      goal = landing;
      start();
      return;
    }

    if (closeFocus()) return;
    const [x, y] = localPoint(e);
    const hit = instances.find((inst) => x >= inst.x0 && x <= inst.x1 && y >= inst.y0 && y <= inst.y1);
    if (!hit) return;
    if (hit.index === activeIndex && Math.abs(goal - pos) < 3) {
      opts.onSelect?.(hit.index, currentItems[hit.index]);
      if (s.focusOnClick) openFocus(hit.index);
    } else {
      const rel = (hit.x0 + hit.x1) / 2 - width / 2;
      const landing = snapPoint(m, pos + rel);
      manualOffset = landing - base;
      goal = landing;
      if (s.focusOnClick) focus.pending = hit.index;
      start();
    }
  };

  const onPointerLeave = () => {
    pointer.over = false;
    dirty = true;
    start();
  };

  const onPointerCancel = () => {
    pointer.down = false;
    pointer.dragging = false;
    container.removeAttribute('data-dragging');
    start();
  };

  const onWheel = (e: WheelEvent) => {
    // Only capture horizontal trackpad swipes; let vertical wheel scroll the page naturally!
    if (e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    closeFocus();
    manualOffset += Math.max(-120, Math.min(120, e.deltaX)) * 1.15;
    dirty = true;
    start();
  };

  const goToIndex = (index: number) => {
    const m = computeMetrics();
    if (!m.centers.length) return;
    closeFocus();
    const norm = ((index % m.centers.length) + m.centers.length) % m.centers.length;
    const base = scrollTargetFor(m, scrollP);
    const desired = goal + wrap(m.centers[norm] - goal, m.loop);
    manualOffset = desired - base;
    dirty = true;
    start();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToIndex((activeIndex < 0 ? 0 : activeIndex) + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToIndex((activeIndex < 0 ? 0 : activeIndex) - 1);
    } else if (e.key === 'Escape') {
      if (closeFocus()) e.preventDefault();
    } else if ((e.key === 'Enter' || e.key === ' ') && activeIndex >= 0) {
      e.preventDefault();
      if (!closeFocus() && s.focusOnClick) openFocus(activeIndex);
    }
  };

  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerup', onPointerUp);
  container.addEventListener('pointerleave', onPointerLeave);
  container.addEventListener('pointercancel', onPointerCancel);
  container.addEventListener('wheel', onWheel, { passive: false });
  container.addEventListener('keydown', onKeyDown);

  const ro = new ResizeObserver(() => {
    resizePending = true;
    start();
  });
  ro.observe(container);

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) start();
    },
    { rootMargin: '250px' }
  );
  io.observe(container);

  setItems(currentItems, 0);

  return {
    setItems,
    setScrollProgress(p: number) {
      const clamped = clamp01(p);
      const delta = Math.abs(clamped - scrollP);
      if (delta < 0.0001) return;
      if (delta > 0.002 && focus.target > 0) {
        closeFocus();
      }
      // Smoothly blend any manual horizontal offset back to 0 as user scrolls vertically
      manualOffset *= Math.max(0, 1 - delta * 14);
      scrollP = clamped;
      dirty = true;
      start();
    },
    goToIndex,
    destroy() {
      alive = false;
      visible = false;
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointerleave', onPointerLeave);
      container.removeEventListener('pointercancel', onPointerCancel);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('keydown', onKeyDown);
      slots.forEach((sl) => sl.dispose());
      slots = [];
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
      captionEl.remove();
      liveEl.remove();
    },
  };
}
