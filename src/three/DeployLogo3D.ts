import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface DeployLogo3DController {
  setProgress: (t: number, visibleOpacity: number) => void;
  destroy: () => void;
}

// Each arrow is split into several meshes in the source model.
const ARROW_GROUPS = [
  { indices: new Set([6, 14, 16, 29]), delay: 0, lane: 0 },
  { indices: new Set([0, 2, 5, 18, 28]), delay: 0.12, lane: 1 },
  { indices: new Set([7, 12]), delay: 0.23, lane: 2 },
  { indices: new Set([10, 11, 27]), delay: 0.34, lane: 3 },
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function mountDeployLogo3D(
  container: HTMLElement,
  glbUrl: string,
  fallbackEl: HTMLElement | null
): DeployLogo3DController {
  let renderer: THREE.WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    return { setProgress: () => {}, destroy: () => {} };
  }

  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.className = 'deploy-logo-3d-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const exhaust = document.createElement('canvas');
  exhaust.className = 'deploy-logo-3d-canvas deploy-logo-exhaust';
  exhaust.setAttribute('aria-hidden', 'true');
  const plume = exhaust.getContext('2d');
  container.append(exhaust, renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 6.8);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
  keyLight.position.set(4, 6, 7);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x22c1ec, 1.0);
  fillLight.position.set(-5, 2, 4);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xdbe8ff, 1.1);
  rimLight.position.set(0, -4, -4);
  scene.add(rimLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.48);
  scene.add(ambient);

  const pivot = new THREE.Group();
  scene.add(pivot);

  const arrows: Array<{ group: THREE.Group; rest: THREE.Vector3; tail: THREE.Vector3; delay: number; lane: number }> = [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const flightOffset = new THREE.Vector3();
  const nozzle = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const toLogoSpace = new THREE.Matrix3();
  let modelLoaded = false;
  let scrollT = 0;
  let currentOpacity = 0;
  let rafId = 0;

  const loader = new GLTFLoader();
  loader.load(
    encodeURI(glbUrl),
    (gltf) => {
      const model = gltf.scene;

      // Normalize overall bounding box and center the pivot cleanly
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      const normScale = 1.75 / maxDim;
      model.scale.setScalar(normScale);
      model.position.set(-center.x * normScale, -center.y * normScale, -center.z * normScale);

      pivot.add(model);
      const meshes = new Map<number, THREE.Mesh>();
      model.traverse((child) => {
        const index = child.name.match(/tripo_part_(\d+)/i);
        if (index && child instanceof THREE.Mesh) meshes.set(Number(index[1]), child);
      });

      for (const { indices, delay, lane } of ARROW_GROUPS) {
        const parts = [...indices].flatMap(index => {
          const mesh = meshes.get(index);
          return mesh ? [mesh] : [];
        });
        if (!parts.length) continue;

        const bounds = new THREE.Box3();
        parts.forEach(part => bounds.expandByObject(part));
        const group = new THREE.Group();
        group.position.copy(bounds.getCenter(new THREE.Vector3()));
        pivot.add(group);
        parts.forEach(part => group.attach(part));
        // Find the rear of the arrow in its own coordinates so exhaust follows its rotation.
        const tail = new THREE.Vector3();
        const vertex = new THREE.Vector3();
        let rear = Infinity;
        for (const part of parts) {
          const positions = part.geometry.getAttribute('position');
          for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i).applyMatrix4(part.matrix);
            const alongArrow = vertex.x + vertex.y;
            if (alongArrow < rear) {
              rear = alongArrow;
              tail.copy(vertex);
            }
          }
        }
        arrows.push({ group, rest: group.position.clone(), tail, delay, lane });
      }

      modelLoaded = true;
      scheduleFrame();
      if (fallbackEl) {
        fallbackEl.style.display = 'none';
      }
    },
    undefined,
    (err) => {
      console.warn('Could not load segmented 3D GLB logo, keeping 2D fallback:', err);
    }
  );

  const resize = () => {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer!.setSize(w, h, false);
    const resolution = Math.min(window.devicePixelRatio, 2);
    exhaust.width = Math.round(w * resolution);
    exhaust.height = Math.round(h * resolution);
    plume?.setTransform(resolution, 0, 0, resolution, 0, 0);
    scheduleFrame();
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  reducedMotion.addEventListener('change', scheduleFrame);

  function scheduleFrame() {
    if (!rafId && modelLoaded && currentOpacity > 0.005) {
      rafId = window.requestAnimationFrame(renderFrame);
    }
  }

  function renderFrame() {
    rafId = 0;
    if (!modelLoaded || currentOpacity <= 0.005) return;

    const reduced = reducedMotion.matches;

    const width = container.clientWidth;
    const height = container.clientHeight;
    plume?.clearRect(0, 0, width, height);
    if (!width || !height) return;
    const narrow = width < 768;
    const halfH = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const halfW = halfH * camera.aspect;

    const glide = reduced ? 1 : smooth(clamp01(scrollT / 0.23));
    const launch = reduced ? 0 : clamp01((scrollT - 0.26) / 0.74);
    const logoWidth = Math.min(width * (narrow ? 0.27 : 0.19), height * 0.245, 250);
    const landingX = -halfW * (narrow ? 0.63 : 0.73);
    const landingY = -halfH * (narrow ? 0.47 : 0.45);
    const ignition = clamp01(launch / 0.16);
    const recoil = Math.sin(Math.PI * ignition) ** 2 * 0.10;

    pivot.position.set(
      lerp(-halfW * (narrow ? 0.68 : 0.77), landingX, glide) - recoil,
      lerp(halfH * (narrow ? -0.22 : 0.08), landingY, glide) - recoil,
      0
    );
    pivot.rotation.set(lerp(0.12, -0.04, glide), lerp(-0.28, 0.13, glide), lerp(0.16, -0.05, glide));
    pivot.scale.setScalar((logoWidth / width) * (2 * halfW / 1.75) * lerp(0.82, 1, glide));
    pivot.updateMatrixWorld(true);
    toLogoSpace.setFromMatrix4(pivot.matrixWorld).invert();

    for (const { group, rest, tail, delay, lane } of arrows) {
      const t = clamp01((launch - delay) / (1 - delay));
      // Build thrust early, then keep accelerating toward the corner.
      const distance = t * t * (0.72 + 0.28 * t);
      const dx = halfW * (0.82 - lane * 0.083) - landingX;
      const dy = halfH * (0.56 - lane * 0.058) - landingY;
      const lift = halfH * 0.88;

      flightOffset.set(dx * distance, (dy + lift * (1 - distance)) * distance, 0);
      flightOffset.applyMatrix3(toLogoSpace);
      group.position.copy(rest).add(flightOffset);
      const heading = Math.atan2(dy + lift * (1 - 2 * distance), dx);
      group.rotation.z = (heading - Math.PI / 4 - pivot.rotation.z) * smooth(clamp01(t * 9));

      if (!plume || t <= 0 || t >= 0.999) continue;
      group.updateWorldMatrix(false, false);
      nozzle.copy(tail).applyMatrix4(group.matrixWorld).project(camera);
      forward.copy(tail);
      forward.x += 0.1;
      forward.y += 0.1;
      forward.applyMatrix4(group.matrixWorld).project(camera);

      const thrust = smooth(clamp01(t * 24)) * (1 - smooth(clamp01((t - 0.80) / 0.20)));
      const scale = logoWidth * (lane === 0 ? 1 : 0.64);
      const ripple = Math.sin(t * 125 + lane * 2);
      const length = scale * (0.24 + 0.30 * thrust + ripple * 0.035);
      const spread = scale * (0.035 + thrust * 0.027);
      const curl = Math.sin(t * 91 + lane) * spread * 0.55;
      const angle = Math.atan2((nozzle.y - forward.y) * height, (forward.x - nozzle.x) * width);

      plume.save();
      plume.translate((nozzle.x + 1) * width / 2, (1 - nozzle.y) * height / 2);
      plume.rotate(angle);
      plume.globalAlpha = thrust;

      const fire = plume.createLinearGradient(0, 0, -length, 0);
      fire.addColorStop(0, '#fff5be');
      fire.addColorStop(0.18, '#ffbf37');
      fire.addColorStop(0.50, '#fa650e');
      fire.addColorStop(1, 'rgba(230, 51, 7, 0)');
      plume.fillStyle = fire;
      plume.shadowColor = '#ff7b16';
      plume.shadowBlur = spread * 0.9;
      plume.beginPath();
      plume.moveTo(spread * 0.55, -spread * 0.36);
      plume.bezierCurveTo(-length * 0.19, -spread, -length * 0.50, -spread * 0.4, -length, curl);
      plume.bezierCurveTo(-length * 0.60, spread * 0.1, -length * 0.25, spread, spread * 0.55, spread * 0.36);
      plume.closePath();
      plume.fill();

      const core = plume.createLinearGradient(0, 0, -length * 0.58, 0);
      core.addColorStop(0, '#fffdf3');
      core.addColorStop(0.45, '#ffe18a');
      core.addColorStop(1, 'rgba(255, 177, 45, 0)');
      plume.shadowBlur = 0;
      plume.fillStyle = core;
      plume.beginPath();
      plume.moveTo(spread * 0.4, -spread * 0.20);
      plume.quadraticCurveTo(-length * 0.22, -spread * 0.40, -length * 0.58, curl * 0.3);
      plume.quadraticCurveTo(-length * 0.24, spread * 0.40, spread * 0.4, spread * 0.20);
      plume.fill();

      plume.fillStyle = '#ec6414';
      for (let i = 0; i < 5; i++) {
        const age = (t * (5 + i * 0.32) + i * 0.21) % 1;
        plume.globalAlpha = thrust * (1 - age) * 0.68;
        plume.beginPath();
        plume.ellipse(-length * (0.42 + age * 0.88), spread * Math.sin(i * 2.4 + lane) * (0.4 + age), 1 + spread * 0.24, 0.7 + spread * 0.07, 0, 0, Math.PI * 2);
        plume.fill();
      }
      plume.restore();
    }

    renderer!.render(scene, camera);
  }

  return {
    setProgress(t: number, visibleOpacity: number) {
      const nextT = clamp01(t);
      const nextOpacity = clamp01(visibleOpacity);
      if (nextT === scrollT && nextOpacity === currentOpacity) return;
      scrollT = nextT;
      currentOpacity = nextOpacity;
      container.style.opacity = currentOpacity.toFixed(3);
      scheduleFrame();
    },
    destroy() {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      reducedMotion.removeEventListener('change', scheduleFrame);
      pmrem.dispose();
      envTex.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
      exhaust.remove();
    },
  };
}
