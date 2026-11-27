import * as THREE from 'three';
import { SITE_CONFIG } from '../config/siteConfig';

export interface HeroSphereController {
  setScrollProgress: (p: number) => void;
  setPointer: (nx: number, ny: number) => void;
  setActive: (active: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  destroy: () => void;
  isWebGL: boolean;
}

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewPos;
  varying vec4 vClipPos;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mvPosition.xyz;
    vNormalView = normalize(normalMatrix * normal);
    vClipPos = projectionMatrix * mvPosition;
    gl_Position = vClipPos;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uQueryTex;
  uniform sampler2D uHeadlineTex;
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uPointer;
  uniform float uZoomFade;
  uniform float uVisibility;
  uniform vec2 uSphereCenterNdc;
  uniform vec2 uSphereRadiusNdc;

  varying vec3 vNormalView;
  varying vec3 vViewPos;
  varying vec4 vClipPos;

  void main() {
    vec3 N = normalize(vNormalView);
    vec3 V = normalize(vViewPos);
    float ndotv = clamp(dot(N, V), 0.0, 1.0);

    // Normalized 2D lens coordinates (-1..1) from view-space normal
    vec2 p = N.xy;
    float r = length(p);
    float r2 = dot(p, p);
    vec2 dir = r > 0.0001 ? p / r : vec2(0.0);

    // Screen UV (0..1) of this fragment in the hero viewport
    vec2 screenUv = (vClipPos.xy / vClipPos.w) * 0.5 + 0.5;

    // Thick convex optical lens refraction:
    // Crystal-clear slight magnification in center, strong radial bend at outer 16% bevel
    float rimBend = smoothstep(0.76, 0.99, r);
    vec2 lensOffset = p * uSphereRadiusNdc * 0.5;
    vec2 refractedScreenUv = screenUv - lensOffset * (0.14 + 0.52 * rimBend * rimBend);

    // Chromatic dispersion ONLY at the thick outer glass rim
    float chroma = (0.0012 + 0.015 * pow(rimBend, 1.6)) * (1.0 - 0.7 * uScroll);

    // Sample the "Be the answer." letterform mask with RGB rim dispersion
    float maskR = texture2D(uHeadlineTex, clamp(refractedScreenUv + dir * chroma, 0.0, 1.0)).r;
    float maskG = texture2D(uHeadlineTex, clamp(refractedScreenUv, 0.0, 1.0)).r;
    float maskB = texture2D(uHeadlineTex, clamp(refractedScreenUv - dir * chroma, 0.0, 1.0)).r;

    // On scroll zoom (00:05 - 00:13), smoothly open the mask so the full query wall appears
    float openWall = smoothstep(0.22, 0.62, uScroll);
    vec3 letterMask = mix(vec3(maskR, maskG, maskB), vec3(1.0), openWall);

    // Crisp, flat-projected query text UV inside the lens (minimal distortion in center)
    vec2 queryUv = screenUv * vec2(1.45, 1.45) - lensOffset * (0.22 + 0.65 * rimBend * rimBend);
    queryUv.x += uTime * 0.012;
    queryUv.y -= uScroll * 0.12;

    vec3 qR = texture2D(uQueryTex, fract(queryUv + dir * chroma * 1.4)).rgb;
    vec3 qG = texture2D(uQueryTex, fract(queryUv)).rgb;
    vec3 qB = texture2D(uQueryTex, fract(queryUv - dir * chroma * 1.4)).rgb;
    vec3 queryCol = vec3(qR.r, qG.g, qB.b);

    // Where the white letterforms are behind the lens -> show crisp white search queries!
    // Where the dark background is behind the lens -> show deep glossy obsidian glass!
    vec3 obsidian = vec3(0.014, 0.015, 0.018);

    // Slight refracted white letter fringe right at the extreme bevel edge
    vec3 edgeLetterGlow = vec3(maskR, maskG, maskB) * rimBend * 0.62 * (1.0 - openWall);
    vec3 interior = mix(obsidian, queryCol * 1.12, clamp(letterMask, 0.0, 1.0)) + edgeLetterGlow;

    // Subtle dark glass vignette inside the outer rim channel
    float bezelChannel = smoothstep(0.89, 0.945, r) * (1.0 - smoothstep(0.965, 0.995, r));
    interior = mix(interior, vec3(0.01, 0.012, 0.016), bezelChannel * 0.72 * (1.0 - uScroll * 0.8));

    // Double crisp concentric glass rim reflections (signature look from reference)
    float outerRing = smoothstep(0.962, 0.985, r) * (1.0 - smoothstep(0.988, 1.0, r));
    float innerRing = smoothstep(0.908, 0.924, r) * (1.0 - smoothstep(0.930, 0.946, r));

    // Directional tint along rim (cool silver-white + subtle warm tint on opposite side)
    float rimAngleHighlight = 0.45 + 0.55 * clamp(dot(normalize(p + vec2(0.0001)), normalize(vec2(-0.55, 0.75))), 0.0, 1.0);
    float rimOppHighlight = 0.35 + 0.65 * clamp(dot(normalize(p + vec2(0.0001)), normalize(vec2(0.65, -0.65))), 0.0, 1.0);

    vec3 ringColor = vec3(0.84, 0.88, 0.96) * rimAngleHighlight + vec3(0.75, 0.78, 0.84) * rimOppHighlight * 0.5;
    interior += ringColor * outerRing * 0.92 * (1.0 - uScroll * 0.85);
    interior += vec3(0.82, 0.85, 0.92) * innerRing * 0.46 * (1.0 - uScroll * 0.85);

    // Clean curved optical glass reflection arc (lower-left & upper-right subtle reflection)
    float arcDist = abs(r - 0.73);
    float arcBand = (1.0 - smoothstep(0.0, 0.036, arcDist));
    float arcAngle1 = smoothstep(0.55, 0.88, dot(dir, normalize(vec2(-0.62, -0.78))));
    float arcAngle2 = smoothstep(0.62, 0.92, dot(dir, normalize(vec2(0.55, 0.83))));
    interior += vec3(0.92, 0.94, 0.98) * arcBand * (arcAngle1 * 0.24 + arcAngle2 * 0.14) * (1.0 - uScroll * 0.85);

    // Soft glass Fresnel sheen
    float fresnel = pow(1.0 - ndotv, 3.5);
    interior += vec3(0.62, 0.72, 0.92) * fresnel * 0.14 * (1.0 - uScroll * 0.85);

    // Smooth anti-aliased sphere silhouette
    float edgeAA = 1.0 - smoothstep(0.988, 1.0, r);
    float alpha = edgeAA * (1.0 - uZoomFade) * uVisibility;

    gl_FragColor = vec4(interior, clamp(alpha, 0.0, 1.0));
  }
`;

function createQueryFieldTexture(queries: string[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#030304';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textBaseline = 'middle';
  const rowHeight = 46;
  const rows = Math.ceil(canvas.height / rowHeight);

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight + rowHeight / 2;
    let x = ((r * 173) % 340) - 240;
    let qIdx = (r * 3) % queries.length;

    while (x < canvas.width + 380) {
      const q = queries[qIdx % queries.length];
      const isBright = (r + qIdx) % 3 !== 0;

      ctx.font = '600 22px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = isBright ? 'rgba(246, 246, 243, 0.96)' : 'rgba(205, 205, 200, 0.62)';
      ctx.fillText(q, x, y);

      const w = ctx.measureText(q).width;
      x += w + 34;

      // Subtle dot separator
      ctx.fillStyle = (r + qIdx) % 5 === 0 ? 'rgba(34, 193, 236, 0.85)' : 'rgba(242, 242, 239, 0.35)';
      ctx.beginPath();
      ctx.arc(x - 17, y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      qIdx++;
    }
  }

  return canvas;
}

function renderHeadlineMaskCanvas(
  maskCanvas: HTMLCanvasElement,
  hostEl: HTMLElement,
  titleEl: HTMLElement | null
): void {
  const rect = hostEl.getBoundingClientRect();
  const w = Math.max(2, Math.round(rect.width));
  const h = Math.max(2, Math.round(rect.height));

  if (maskCanvas.width !== w || maskCanvas.height !== h) {
    maskCanvas.width = w;
    maskCanvas.height = h;
  }

  const ctx = maskCanvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  if (!titleEl) return;

  const spans = Array.from(titleEl.querySelectorAll<HTMLElement>('span'));
  const style = window.getComputedStyle(titleEl);
  const fontSize = parseFloat(style.fontSize) || 140;
  const fontWeight = style.fontWeight || '900';
  const fontFamily = style.fontFamily || 'Inter, sans-serif';

  ctx.fillStyle = '#ffffff';
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Apply letter-spacing if supported
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = style.letterSpacing || '-0.055em';
  }

  spans.forEach((span) => {
    const sRect = span.getBoundingClientRect();
    const cx = sRect.left - rect.left + sRect.width / 2;
    const cy = sRect.top - rect.top + sRect.height / 2;
    ctx.fillText(span.textContent || '', cx, cy);
  });
}

export function mountHeroGlassSphere(
  container: HTMLElement,
  readingQueryEl: HTMLElement | null,
  headlineEl: HTMLElement | null = null
): HeroSphereController {
  const queries = SITE_CONFIG.hero.queries;
  let scrollProgress = 0;
  let hasPointerMoved = false;
  let isActive = false;
  let currentVisibility = 0;
  let targetPointerX = 0;
  let targetPointerY = 0;
  let currentPointerX = 0;
  let currentPointerY = 0;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rafId = 0;
  let lastQueryIdx = -1;

  const updateReadingLabel = (idx: number) => {
    if (!readingQueryEl) return;
    const safeIdx = ((idx % queries.length) + queries.length) % queries.length;
    if (safeIdx !== lastQueryIdx) {
      lastQueryIdx = safeIdx;
      readingQueryEl.textContent = queries[safeIdx];
    }
  };
  updateReadingLabel(0);

  let renderer: THREE.WebGLRenderer | null = null;
  if (SITE_CONFIG.motion.enableWebGL) {
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      renderer = null;
    }
  }

  if (!renderer) {
    container.classList.add('hero-sphere-fallback-active');
    const fallbackEl = document.createElement('div');
    fallbackEl.className = 'hero-sphere-css-fallback';
    fallbackEl.setAttribute('aria-hidden', 'true');
    fallbackEl.innerHTML = `
      <div class="css-lens-inner">
        <div class="css-lens-queries">${queries
          .slice(0, 12)
          .map((q) => `<span>${q}</span>`)
          .join('')}</div>
      </div>
    `;
    container.appendChild(fallbackEl);

    let tick = 0;
    const interval = window.setInterval(() => {
      if (!reducedMotion) {
        tick++;
        updateReadingLabel(tick);
      }
    }, 2800);

    return {
      isWebGL: false,
      setScrollProgress(p: number) {
        scrollProgress = p;
        const scale = 1 + p * 3.2;
        const opacity = Math.max(0, 1 - Math.max(0, (p - 0.72) / 0.28));
        fallbackEl.style.transform = `translate3d(0, 0, 0) scale(${scale.toFixed(3)})`;
        fallbackEl.style.opacity = opacity.toFixed(3);
      },
      setPointer(nx: number, ny: number) {
        if (reducedMotion) return;
        fallbackEl.style.setProperty('--px', `${(nx * 18).toFixed(1)}px`);
        fallbackEl.style.setProperty('--py', `${(ny * 14).toFixed(1)}px`);
      },
      setActive(active: boolean) {
        isActive = active;
        fallbackEl.style.opacity = active || scrollProgress > 0.04 ? '1' : '0';
      },
      setReducedMotion(r: boolean) {
        reducedMotion = r;
      },
      destroy() {
        window.clearInterval(interval);
        fallbackEl.remove();
      },
    };
  }

  const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouchDevice ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'hero-sphere-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 5.2);

  const queryCanvas = createQueryFieldTexture(queries);
  const queryTex = new THREE.CanvasTexture(queryCanvas);
  queryTex.wrapS = THREE.RepeatWrapping;
  queryTex.wrapT = THREE.RepeatWrapping;
  queryTex.minFilter = THREE.LinearMipmapLinearFilter;
  queryTex.magFilter = THREE.LinearFilter;
  queryTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  queryTex.needsUpdate = true;

  const headlineMaskCanvas = document.createElement('canvas');
  const headlineTex = new THREE.CanvasTexture(headlineMaskCanvas);
  headlineTex.minFilter = THREE.LinearFilter;
  headlineTex.magFilter = THREE.LinearFilter;
  headlineTex.flipY = true;

  const uniforms = {
    uQueryTex: { value: queryTex },
    uHeadlineTex: { value: headlineTex },
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uZoomFade: { value: 0 },
    uVisibility: { value: 0 },
    uSphereCenterNdc: { value: new THREE.Vector2(0, 0) },
    uSphereRadiusNdc: { value: new THREE.Vector2(0.3, 0.3) },
  };

  const geometry = new THREE.SphereGeometry(1.02, 72, 72);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
    transparent: true,
    depthWrite: false,
  });

  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  const updateMaskTexture = () => {
    renderHeadlineMaskCanvas(headlineMaskCanvas, container, headlineEl);
    headlineTex.needsUpdate = true;
  };

  const resize = () => {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer!.setSize(w, h, false);
    updateMaskTexture();
  };

  resize();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateMaskTexture);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);

  const clock = new THREE.Clock();
  let elapsed = 0;

  let isInViewport = true;
  const io = new IntersectionObserver(
    (entries) => {
      isInViewport = entries[0]?.isIntersecting ?? true;
    },
    { rootMargin: '200px' }
  );
  io.observe(container);

  const renderFrame = () => {
    rafId = window.requestAnimationFrame(renderFrame);
    if (!isInViewport) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reducedMotion) {
      elapsed += dt;
    }

    const follow = reducedMotion ? 0 : SITE_CONFIG.motion.sphereFollowStrength;
    currentPointerX += (targetPointerX - currentPointerX) * (follow || 0.08);
    currentPointerY += (targetPointerY - currentPointerY) * (follow || 0.08);

    const isNarrow = container.clientWidth < 768;
    const halfFovTan = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const viewHalfH = camera.position.z * halfFovTan;
    const viewHalfW = viewHalfH * camera.aspect;

    // On mobile/touch devices, gently glide the lens across DEPLOY automatically until touched
    const mobileAutoActive = isTouchDevice && !reducedMotion;
    const autoGlideX = mobileAutoActive ? Math.sin(elapsed * 0.85) * (viewHalfW * 0.52) : -0.34;
    const autoGlideY = mobileAutoActive ? Math.cos(elapsed * 1.1) * 0.12 : -0.14;

    const restX = isNarrow ? autoGlideX : -0.34;
    const restY = isNarrow ? autoGlideY : -0.14;
    const centerFactor = Math.min(1, scrollProgress * 2.2);

    const desiredX = hasPointerMoved && !reducedMotion ? currentPointerX * viewHalfW : restX;
    const desiredY = hasPointerMoved && !reducedMotion ? -currentPointerY * viewHalfH : restY;
    const floatY = reducedMotion || hasPointerMoved ? 0 : Math.sin(elapsed * 0.85) * 0.025 * (1 - centerFactor);

    sphere.position.x = desiredX * (1 - centerFactor);
    sphere.position.y = desiredY * (1 - centerFactor) + floatY;

    const targetVis = isActive || mobileAutoActive || scrollProgress > 0.04 ? 1 : 0;
    currentVisibility += (targetVis - currentVisibility) * 0.16;
    if (Math.abs(targetVis - currentVisibility) < 0.002) currentVisibility = targetVis;

    const baseScale = (isNarrow ? 0.62 : 0.94) * (0.84 + 0.16 * currentVisibility);
    const zoomCurve = Math.pow(Math.min(1, scrollProgress / 0.82), 2.15);
    const scale = baseScale + zoomCurve * (isNarrow ? 3.8 : 4.6);
    sphere.scale.setScalar(scale);

    const ndcRadiusY = (1.02 * scale) / viewHalfH;
    const ndcRadiusX = ndcRadiusY / Math.max(0.2, camera.aspect);
    uniforms.uSphereRadiusNdc.value.set(ndcRadiusX, ndcRadiusY);

    const zoomFade = Math.max(0, Math.min(1, (scrollProgress - 0.74) / 0.24));

    uniforms.uTime.value = elapsed;
    uniforms.uScroll.value = scrollProgress;
    uniforms.uPointer.value.set(currentPointerX, currentPointerY);
    uniforms.uZoomFade.value = zoomFade;
    uniforms.uVisibility.value = currentVisibility;

    if (!reducedMotion) {
      const idx = Math.floor(elapsed * 0.35 + (currentPointerX + 1) * 4.5);
      updateReadingLabel(idx);
    }

    renderer!.render(scene, camera);
  };

  renderFrame();

  return {
    isWebGL: true,
    setScrollProgress(p: number) {
      scrollProgress = Math.max(0, Math.min(1, p));
    },
    setPointer(nx: number, ny: number) {
      hasPointerMoved = true;
      targetPointerX = Math.max(-1.05, Math.min(1.05, nx));
      targetPointerY = Math.max(-1.05, Math.min(1.05, ny));
    },
    setActive(active: boolean) {
      isActive = active;
    },
    setReducedMotion(r: boolean) {
      reducedMotion = r;
    },
    destroy() {
      window.cancelAnimationFrame(rafId);
      io.disconnect();
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      queryTex.dispose();
      headlineTex.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    },
  };
}
