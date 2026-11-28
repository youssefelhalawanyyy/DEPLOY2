import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface DeployLogo3DController {
  setProgress: (t: number, visibleOpacity: number) => void;
  destroy: () => void;
}

interface AnimatedPart {
  obj: THREE.Object3D;
  restPos: THREE.Vector3;
  restRot: THREE.Euler;
  role: 'body' | 'arrow' | 'shard';
  delay: number;
  speed: number;
  dir: THREE.Vector3;
}

// Exact part index groups from `public/blue letter d 3d model.glb`
const ARROW_1_BIG = new Set([6, 14, 16, 29]); // Hero top-right arrow
const ARROW_2_MID = new Set([0, 2, 5, 18, 28]); // Long middle diagonal arrow
const ARROW_3_TOP = new Set([7, 12]); // Upper-left diagonal arrow
const ARROW_4_BOT = new Set([10, 11, 27]); // Lower-left diagonal arrow
const SHARD_PARTS = new Set([3, 13, 15, 19, 21, 24, 25, 26]); // Small inner accent blocks

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeInCubic = (t: number) => t * t * t;
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
  container.appendChild(renderer.domElement);

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

  const animatedParts: AnimatedPart[] = [];
  let modelLoaded = false;
  let scrollT = 0;
  let currentT = 0;
  let currentOpacity = 0;
  let rafId = 0;
  const clock = new THREE.Clock();

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

      // Classify each segmented tripo_part_N for the arrow-launch choreography
      model.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const match = child.name.match(/tripo_part_(\d+)/i);
        const idx = match ? Number(match[1]) : -1;

        let role: AnimatedPart['role'] = 'body';
        let delay = 0;
        let speed = 1;
        const dir = new THREE.Vector3(1.0, 0.96, 0.22).normalize();

        if (ARROW_1_BIG.has(idx)) {
          role = 'arrow';
          delay = 0.0;
          speed = 1.18;
          dir.set(1.05, 1.0, 0.28).normalize();
        } else if (ARROW_2_MID.has(idx)) {
          role = 'arrow';
          delay = 0.14;
          speed = 1.12;
          dir.set(1.02, 0.96, 0.2).normalize();
        } else if (ARROW_3_TOP.has(idx)) {
          role = 'arrow';
          delay = 0.24;
          speed = 1.05;
          dir.set(0.96, 1.04, 0.15).normalize();
        } else if (ARROW_4_BOT.has(idx)) {
          role = 'arrow';
          delay = 0.32;
          speed = 1.0;
          dir.set(1.08, 0.88, 0.18).normalize();
        } else if (SHARD_PARTS.has(idx)) {
          role = 'shard';
          delay = 0.18;
          speed = 0.55;
          dir.set(0.9, 0.95, 0.35).normalize();
        }

        animatedParts.push({
          obj: child,
          restPos: child.position.clone(),
          restRot: child.rotation.clone(),
          role,
          delay,
          speed,
          dir,
        });
      });

      pivot.add(model);
      modelLoaded = true;
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
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  const renderFrame = () => {
    rafId = window.requestAnimationFrame(renderFrame);
    if (!modelLoaded || currentOpacity <= 0.005) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elapsed = clock.elapsedTime;

    currentT += (scrollT - currentT) * (reduced ? 1 : Math.min(1, dt * 6.5));

    const isNarrow = container.clientWidth < 768;
    const halfFovTan = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const halfH = camera.position.z * halfFovTan;
    const halfW = halfH * camera.aspect;

    // Phase 1 (t: 0.00 -> 0.42): Logo glides from upper-center down to bottom-left launch position
    const glideT = reduced ? 0 : smooth(clamp01((currentT - 0.04) / 0.38));

    // Phase 2 (t: 0.44 -> 1.00): Logo holds in bottom-left and THROWS the arrows diagonally up-right across screen
    const fireT = reduced ? 0 : clamp01((currentT - 0.44) / 0.56);

    const startX = 0;
    const startY = isNarrow ? 0.88 : 0.92;
    const leftBottomX = isNarrow ? -halfW * 0.42 : -halfW * 0.66;
    const leftBottomY = isNarrow ? -halfH * 0.34 : -halfH * 0.38;

    // Subtle recoil kick on the D launcher when arrows fire
    const recoil = Math.sin(clamp01(fireT * 2.5) * Math.PI) * 0.14;
    const floatY = reduced ? 0 : Math.sin(elapsed * 1.5) * 0.035 * (1 - fireT);

    pivot.position.set(
      lerp(startX, leftBottomX, glideT) - recoil,
      lerp(startY, leftBottomY, glideT) - recoil * 0.7 + floatY,
      0
    );

    // Smooth 3D framing rotation: faces forward cleanly, tilts slightly toward top-right for launch
    if (reduced) {
      pivot.rotation.set(0.05, 0.12, 0);
    } else {
      pivot.rotation.y = lerp(-0.32, 0.24, glideT) + Math.sin(elapsed * 0.7) * 0.04;
      pivot.rotation.x = lerp(0.06, -0.06, glideT);
      pivot.rotation.z = lerp(0, -0.04, glideT);
    }

    const entryScale = 0.75 + 0.25 * smooth(clamp01(currentT * 4.5));
    const mobileScale = isNarrow ? 0.68 : 0.92;
    pivot.scale.setScalar(entryScale * mobileScale);

    // Animate individual segmented parts (arrows shoot diagonally up-right across the screen!)
    const throwDist = isNarrow ? 4.2 : 5.6;
    for (const part of animatedParts) {
      if (part.role === 'body') {
        part.obj.position.copy(part.restPos);
        part.obj.rotation.copy(part.restRot);
        continue;
      }

      const localT = clamp01((fireT - part.delay) / Math.max(0.15, 1 - part.delay));
      const travel = easeInCubic(localT) * throwDist * part.speed;

      part.obj.position.set(
        part.restPos.x + part.dir.x * travel,
        part.restPos.y + part.dir.y * travel,
        part.restPos.z + part.dir.z * travel
      );

      // Slight aerodynamic spin/tilt as each arrow launches
      const spin = localT * localT * (part.role === 'shard' ? 1.4 : 0.45);
      part.obj.rotation.set(
        part.restRot.x + spin * 0.35,
        part.restRot.y + spin * 0.55,
        part.restRot.z - localT * 0.12
      );
    }

    renderer!.render(scene, camera);
  };

  renderFrame();

  return {
    setProgress(t: number, visibleOpacity: number) {
      scrollT = clamp01(t);
      currentOpacity = clamp01(visibleOpacity);
      renderer!.domElement.style.opacity = currentOpacity.toFixed(3);
    },
    destroy() {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      pmrem.dispose();
      envTex.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    },
  };
}
