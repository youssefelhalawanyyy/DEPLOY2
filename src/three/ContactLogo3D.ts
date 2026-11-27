import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface ContactLogo3DController {
  destroy: () => void;
}

export function mountContactLogo3D(container: HTMLElement, glbUrl: string): ContactLogo3DController {
  let renderer: THREE.WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    container.innerHTML = `<img src="./logo-mark.png" alt="DEPLOY 3D mark" class="contact-logo-fallback" />`;
    return { destroy: () => {} };
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.domElement.className = 'contact-logo-3d-canvas';
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D DEPLOY logo');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 5.4);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const cyanRim = new THREE.DirectionalLight(0x22c1ec, 2.2);
  cyanRim.position.set(-5, 3, -3);
  scene.add(cyanRim);

  const royalFill = new THREE.DirectionalLight(0x2563eb, 1.4);
  royalFill.position.set(4, -4, 3);
  scene.add(royalFill);

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const pivot = new THREE.Group();
  scene.add(pivot);

  let loaded = false;
  const loader = new GLTFLoader();
  loader.load(
    encodeURI(glbUrl),
    (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      const normScale = 2.45 / maxDim;
      model.scale.setScalar(normScale);
      model.position.set(-center.x * normScale, -center.y * normScale, -center.z * normScale);
      pivot.add(model);
      loaded = true;
    },
    undefined,
    (err) => {
      console.warn('Could not load Contact 3D GLB:', err);
    }
  );

  // Interactive drag-to-spin with momentum
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let rotY = 0;
  let rotX = 0.08;
  let velY = 0;
  let velX = 0;

  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    velX = 0;
    velY = 0;
    renderer!.domElement.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    velY = dx * 0.008;
    velX = dy * 0.006;
    rotY += velY;
    rotX = Math.max(-0.7, Math.min(0.7, rotX + velX));
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    try {
      renderer!.domElement.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointercancel', onPointerUp);

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

  let rafId = 0;
  const clock = new THREE.Clock();

  const renderFrame = () => {
    rafId = window.requestAnimationFrame(renderFrame);
    if (!loaded) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!dragging) {
      if (!reduced) {
        rotY += dt * 0.62 + velY;
        rotX += velX;
        // Gently spring X tilt back toward subtle breathing angle
        const targetX = Math.sin(elapsed * 0.8) * 0.14;
        rotX += (targetX - rotX) * Math.min(1, dt * 2.5);
      }
      velY *= 0.94;
      velX *= 0.92;
    }

    pivot.rotation.y = rotY;
    pivot.rotation.x = rotX;
    pivot.rotation.z = reduced ? 0 : Math.sin(elapsed * 0.7) * 0.06;
    pivot.position.y = reduced ? 0 : Math.sin(elapsed * 1.4) * 0.12;

    renderer!.render(scene, camera);
  };

  renderFrame();

  return {
    destroy() {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer?.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer?.domElement.removeEventListener('pointermove', onPointerMove);
      renderer?.domElement.removeEventListener('pointerup', onPointerUp);
      renderer?.domElement.removeEventListener('pointercancel', onPointerUp);
      pmrem.dispose();
      envTex.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    },
  };
}
