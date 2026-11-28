import * as THREE from 'three';

export interface LightKnotController {
  setScrollProgress: (p: number) => void;
  destroy: () => void;
}

const KNOT_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;

  uniform float uTime;
  uniform float uEnergy;

  void main() {
    vUv = uv;
    // Subtle living harmonic breath along the knot normal
    float pulse = sin(uv.x * 18.8495559 - uTime * 2.4) * 0.018 * (1.0 + uEnergy * 0.8);
    vec3 displaced = position + normal * pulse;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const KNOT_FRAGMENT = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;

  uniform float uTime;
  uniform float uEnergy;

  void main() {
    float tau = 6.2831853;
    float ndv = clamp(abs(dot(normalize(vNormalView), normalize(vViewDir))), 0.0, 1.0);
    float fresnel = pow(1.0 - ndv, 2.15);

    // Three braided optical-fiber light strands winding along the torus knot
    float strandPhase = vUv.y * tau * 3.0 + vUv.x * tau * 5.0 - uTime * (2.1 + uEnergy * 1.4);
    float ribbons = pow(0.5 + 0.5 * cos(strandPhase), 3.6);

    // High-speed traveling photon surge along knot arc length
    float surge1 = pow(0.5 + 0.5 * sin(vUv.x * tau * 2.0 - uTime * 3.1), 5.0);
    float surge2 = pow(0.5 + 0.5 * sin(vUv.x * tau * 3.0 + uTime * 2.2 + 1.7), 6.0);
    float surge = clamp(surge1 * 0.85 + surge2 * 0.65, 0.0, 1.35);

    // DEPLOY dark studio palette: deep midnight -> royal cobalt -> electric cyan -> incandescent white
    vec3 colDeep = vec3(0.018, 0.055, 0.145);
    vec3 colCobalt = vec3(0.082, 0.431, 0.769);   // #156ec4
    vec3 colCyan = vec3(0.133, 0.757, 0.925);     // #22c1ec
    vec3 colHot = vec3(0.92, 0.985, 1.0);

    vec3 base = mix(colDeep, colCobalt, clamp(ribbons * 0.85 + fresnel * 0.7, 0.0, 1.0));
    base = mix(base, colCyan, clamp(ribbons * 0.72 + surge * 0.55 + fresnel * 0.48, 0.0, 1.0));

    float hotCore = pow(clamp(ribbons * 0.68 + surge * 0.62, 0.0, 1.0), 2.6) + pow(fresnel, 3.2) * 0.65;
    vec3 finalCol = mix(base, colHot, clamp(hotCore * (0.78 + uEnergy * 0.28), 0.0, 1.0));

    // Subtle vertical studio key-light sheen
    float sheen = 0.5 + 0.5 * normalize(vNormalView).y;
    finalCol += colCyan * sheen * 0.12;

    gl_FragColor = vec4(finalCol, 0.97);
  }
`;

const HALO_VERTEX = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const HALO_FRAGMENT = /* glsl */ `
  precision mediump float;

  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uEnergy;

  void main() {
    float ndv = clamp(abs(dot(normalize(vNormalView), normalize(vViewDir))), 0.0, 1.0);
    float glow = pow(ndv, 2.1) * (0.36 + uEnergy * 0.18);
    float wave = 0.75 + 0.25 * sin(vUv.x * 18.8495 - uTime * 2.5);
    vec3 col = mix(vec3(0.082, 0.431, 0.769), vec3(0.133, 0.757, 0.925), wave);
    gl_FragColor = vec4(col * glow * wave, glow);
  }
`;

function evalTorusKnotPoint(u: number, p: number, q: number, radius: number, tubeScale: number, out: THREE.Vector3) {
  const cu = Math.cos(u);
  const su = Math.sin(u);
  const quOverP = (q / p) * u;
  const cs = Math.cos(quOverP);
  const r = radius * (1 + tubeScale * cs);
  out.set(r * cu, r * su, radius * tubeScale * Math.sin(quOverP));
}

export function mountLightKnotHero33(container: HTMLElement): LightKnotController {
  let renderer: THREE.WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    container.classList.add('h33-knot-css-fallback');
    return { setScrollProgress: () => {}, destroy: () => {} };
  }

  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarse ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'h33-knot-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 5.6);

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const knotGroup = new THREE.Group();
  rootGroup.add(knotGroup);

  // 1. Core Optical-Fiber Braided Torus Knot
  const tubularSegs = isCoarse ? 180 : 280;
  const radialSegs = isCoarse ? 32 : 48;
  const coreGeo = new THREE.TorusKnotGeometry(1.12, 0.27, tubularSegs, radialSegs, 2, 3);
  const uniforms = {
    uTime: { value: 0 },
    uEnergy: { value: 0 },
  };
  const coreMat = new THREE.ShaderMaterial({
    vertexShader: KNOT_VERTEX,
    fragmentShader: KNOT_FRAGMENT,
    uniforms,
    transparent: true,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  knotGroup.add(coreMesh);

  // 2. Volumetric Additive Bloom Aura Shell
  const haloGeo = new THREE.TorusKnotGeometry(1.12, 0.48, isCoarse ? 110 : 160, 24, 2, 3);
  const haloMat = new THREE.ShaderMaterial({
    vertexShader: HALO_VERTEX,
    fragmentShader: HALO_FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
  const haloMesh = new THREE.Mesh(haloGeo, haloMat);
  knotGroup.add(haloMesh);

  // Sparse particles add depth around the knot.
  const particleCount = isCoarse ? 30 : 54;
  const pPositions = new Float32Array(particleCount * 3);
  const pPhases = new Float32Array(particleCount);
  const pRadii = new Float32Array(particleCount);
  const pOffsets = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    pPhases[i] = Math.random() * Math.PI * 4;
    pRadii[i] = 0.36 + Math.random() * 0.26;
    pOffsets[i * 3] = (Math.random() - 0.5) * 0.42;
    pOffsets[i * 3 + 1] = (Math.random() - 0.5) * 0.42;
    pOffsets[i * 3 + 2] = (Math.random() - 0.5) * 0.42;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

  // Soft radial glow sprite generated procedurally in 32x32 canvas
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = 32;
  spriteCanvas.height = 32;
  const sCtx = spriteCanvas.getContext('2d');
  if (sCtx) {
    const grad = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(240, 253, 255, 1)');
    grad.addColorStop(0.35, 'rgba(34, 193, 236, 0.85)');
    grad.addColorStop(1, 'rgba(21, 110, 196, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 32, 32);
  }
  const spriteTex = new THREE.CanvasTexture(spriteCanvas);
  const pMat = new THREE.PointsMaterial({
    size: isCoarse ? 0.11 : 0.095,
    map: spriteTex,
    transparent: true,
    opacity: 0.54,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(pGeo, pMat);
  knotGroup.add(particles);

  // Interactive Drag + Inertia + Scroll State
  let rotX = 0.32;
  let rotY = -0.45;
  let velX = 0;
  let velY = 0;
  let scrollP = 0;
  let smoothScrollP = 0;
  let prevScrollP = 0;
  let energy = 0;

  let isDown = false;
  let isDraggingKnot = false;
  let activePointerId = -1;
  let lastX = 0;
  let lastY = 0;
  let startX = 0;
  let startY = 0;

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    isDown = true;
    isDraggingKnot = e.pointerType === 'mouse';
    activePointerId = e.pointerId;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    if (e.pointerType === 'mouse') {
      container.setAttribute('data-dragging', '');
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isDown || e.pointerId !== activePointerId) return;
    const dxTotal = e.clientX - startX;
    const dyTotal = e.clientY - startY;

    // On touch devices, only lock onto knot spin when gesture has clear horizontal/diagonal intent
    // so vertical page scrolling never gets trapped!
    if (!isDraggingKnot) {
      if (Math.hypot(dxTotal, dyTotal) < 7) return;
      if (Math.abs(dyTotal) > Math.abs(dxTotal) * 1.25) {
        isDown = false;
        activePointerId = -1;
        return;
      }
      isDraggingKnot = true;
      container.setAttribute('data-dragging', '');
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    if (e.cancelable) e.preventDefault();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    const sens = 0.0075;
    rotY += dx * sens;
    rotX = Math.max(-1.35, Math.min(1.35, rotX + dy * sens));
    velY = dx * sens * 14;
    velX = dy * sens * 14;
    energy = Math.min(1, energy + Math.hypot(dx, dy) * 0.018);
  };

  const endDrag = (e: PointerEvent) => {
    if (e.pointerId !== activePointerId) return;
    isDown = false;
    isDraggingKnot = false;
    activePointerId = -1;
    container.removeAttribute('data-dragging');
    try {
      if (container.hasPointerCapture(e.pointerId)) {
        container.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
  };

  container.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', endDrag, { passive: true });
  window.addEventListener('pointercancel', endDrag, { passive: true });

  const resize = () => {
    if (!renderer) return;
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let inView = true;
  let alive = true;
  let rafId = 0;
  const clock = new THREE.Clock();
  const tmpVec = new THREE.Vector3();

  const updateParticles = (t: number) => {
    const posAttr = pGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < particleCount; i++) {
      const u = pPhases[i] + t * 0.42;
      evalTorusKnotPoint(u, 2, 3, 1.12, pRadii[i], tmpVec);
      posAttr.setXYZ(
        i,
        tmpVec.x + pOffsets[i * 3],
        tmpVec.y + pOffsets[i * 3 + 1],
        tmpVec.z + pOffsets[i * 3 + 2]
      );
    }
    posAttr.needsUpdate = true;
  };
  updateParticles(0);

  const tick = () => {
    rafId = 0;
    if (!alive || !inView || !renderer) return;
    rafId = window.requestAnimationFrame(tick);

    const dt = Math.min(0.05, Math.max(0.001, clock.getDelta()));
    const reduced = reducedMq.matches;

    smoothScrollP += (scrollP - smoothScrollP) * (reduced ? 1 : 1 - Math.exp(-dt * 6.5));
    const scrollVel = Math.abs(smoothScrollP - prevScrollP) / dt;
    prevScrollP = smoothScrollP;

    if (!reduced) {
      uniforms.uTime.value += dt * (1 + energy * 0.65);
      if (!isDraggingKnot) {
        rotY += (velY + 0.28) * dt;
        rotX += velX * dt;
        // Gently relax X tilt toward graceful viewing angle
        rotX += (0.28 - rotX) * dt * 0.9;
        const damp = Math.exp(-dt * 3.4);
        velX *= damp;
        velY *= damp;
      }
      const targetEnergy = Math.min(1, scrollVel * 1.4);
      energy += (targetEnergy - energy) * (1 - Math.exp(-dt * (targetEnergy > energy ? 8 : 2.4)));
      uniforms.uEnergy.value = energy;
      updateParticles(uniforms.uTime.value);
    }

    // Combine user drag orientation with scroll-driven untwist & subtle scale arc
    const scrollAngleY = reduced ? 0 : (smoothScrollP - 0.5) * 5.3;
    const scrollAngleZ = reduced ? 0 : (smoothScrollP - 0.5) * 0.68;
    const scaleArc = reduced ? 0.8 : 0.73 + 0.10 * Math.sin(smoothScrollP * Math.PI);

    const scrollPitch = reduced ? 0 : Math.sin(smoothScrollP * Math.PI) * 0.38;
    knotGroup.rotation.set(rotX + scrollPitch, rotY + scrollAngleY, scrollAngleZ);
    rootGroup.scale.setScalar(scaleArc + energy * 0.04);

    renderer.render(scene, camera);
  };

  const io = new IntersectionObserver(
    (entries) => {
      inView = Boolean(entries[0]?.isIntersecting);
      if (inView && !rafId) {
        clock.getDelta();
        rafId = window.requestAnimationFrame(tick);
      }
    },
    { rootMargin: '250px' }
  );
  io.observe(container);
  rafId = window.requestAnimationFrame(tick);

  return {
    setScrollProgress(p: number) {
      scrollP = Math.max(0, Math.min(1, p));
    },
    destroy() {
      alive = false;
      window.cancelAnimationFrame(rafId);
      io.disconnect();
      ro.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      coreGeo.dispose();
      coreMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      spriteTex.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    },
  };
}
