import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface ContactMascot3DController {
  destroy: () => void;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 122);
  grad.addColorStop(0, 'rgba(6, 182, 212, 0.26)');
  grad.addColorStop(0.38, 'rgba(6, 182, 212, 0.10)');
  grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.04)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function mountContactMascot3D(
  container: HTMLElement,
  sectionEl: HTMLElement,
  glbUrl: string
): ContactMascot3DController {
  let renderer: THREE.WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    container.innerHTML = `<img src="./logo-mark.png" alt="DEPLOY Mascot" class="contact-logo-fallback" />`;
    return { destroy: () => {} };
  }

  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.domElement.className = 'contact-logo-3d-canvas';
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D DEPLOY Mascot');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.86, 4.15);

  const controls = new OrbitControls(camera, renderer.domElement);
  if (isTouch) {
    // OrbitControls sets an inline touch-action of none. Give vertical swipes back to the page.
    renderer.domElement.style.touchAction = 'pan-y';
  }
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minPolarAngle = Math.PI * 0.36;
  controls.maxPolarAngle = Math.PI * 0.58;
  controls.target.set(0, 0.80, 0);
  controls.update();

  // Studio environment + Electric Cyan #06B6D4 rim light + warm-white key light
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const keyLight = new THREE.DirectionalLight(0xfff9f0, 2.25);
  keyLight.position.set(3.2, 5.2, 4.6);
  scene.add(keyLight);

  const cyanRim = new THREE.DirectionalLight(0x06b6d4, 2.85);
  cyanRim.position.set(-4.2, 2.6, -3.0);
  scene.add(cyanRim);

  const backRim = new THREE.DirectionalLight(0x00aeef, 1.55);
  backRim.position.set(3.2, 2.0, -3.5);
  scene.add(backRim);

  const ambient = new THREE.AmbientLight(0xdbeafe, 0.46);
  scene.add(ambient);

  const BASE_Y_OFFSET = -0.14;

  // Soft glowing cyan floor halo directly beneath the sneakers (blends invisibly into #000000)
  const shadowTex = createContactShadowTexture();
  const shadowGeo = new THREE.PlaneGeometry(1.7, 1.7);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.88,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, BASE_Y_OFFSET + 0.002, 0);
  scene.add(contactShadow);

  // Mascot pivot — keeps the model 100% "as it is" (zero bone deformation) and animates ONLY whole-character jumps & turns
  const mascotPivot = new THREE.Group();
  mascotPivot.position.set(0, BASE_Y_OFFSET, 0);
  scene.add(mascotPivot);

  let loaded = false;

  const loader = new GLTFLoader();
  loader.load(
    encodeURI(glbUrl),
    (gltf) => {
      const root = gltf.scene;

      // Normalize height & plant sneakers cleanly on y = 0 inside mascotPivot without touching any bone pose
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const MASCOT_HEIGHT = 1.66;
      const scale = MASCOT_HEIGHT / Math.max(size.y, 0.001);
      root.scale.setScalar(scale);
      root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      root.rotation.set(0, 0, 0);
      mascotPivot.add(root);
      loaded = true;
    },
    undefined,
    (err) => {
      console.warn('Could not load mascot GLB:', err);
    }
  );

  // Scroll velocity gently energizes the jump & turn cadence as user scrolls into Contact
  let scrollVelocity = 0;
  let dampedVelocity = 0;
  let touchProgress = 0;

  const st = ScrollTrigger.create({
    trigger: sectionEl,
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => {
      if (isTouch) touchProgress = self.progress;
      scrollVelocity = THREE.MathUtils.clamp(Math.abs(self.getVelocity()) / 1000, 0, 1.5);
    },
  });

  // Playful target yaw sequence: center -> toward "Start your project" button (-left) -> center -> +right
  const TURN_ANGLES = [0, -0.42, 0.06, 0.36];
  let hopIndex = 0;
  let cyclePhase = 0;
  let currentYaw = 0;
  let targetYaw = 0;
  let spinBonus = 0;

  // Clicking the mascot triggers an energetic 360-degree spin jump
  const onClick = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    spinBonus += Math.PI * 2;
    if (cyclePhase < 0.45 || cyclePhase > 0.9) {
      cyclePhase = 0.46;
    }
  };
  container.addEventListener('click', onClick);

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

  let isVisible = true;
  const visIo = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0]?.isIntersecting ?? true;
    },
    { rootMargin: '250px' }
  );
  visIo.observe(container);

  const clock = new THREE.Clock();
  let rafId = 0;

  const animate = () => {
    rafId = window.requestAnimationFrame(animate);
    if (!isVisible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    controls.update();

    if (!loaded) {
      renderer!.render(scene, camera);
      return;
    }

    scrollVelocity = THREE.MathUtils.lerp(scrollVelocity, 0, Math.min(1, dt * 5.0));
    dampedVelocity = THREE.MathUtils.lerp(dampedVelocity, scrollVelocity, Math.min(1, dt * 6.0));

    if (reduced) {
      mascotPivot.position.set(0, BASE_Y_OFFSET, 0);
      mascotPivot.rotation.set(0, 0, 0);
      renderer!.render(scene, camera);
      return;
    }

    // Advance hop-and-turn rhythm (~2.2s per cycle, slightly livelier while scrolling)
    const speed = 0.45 + dampedVelocity * 0.28;
    const prevPhase = cyclePhase;
    cyclePhase = (cyclePhase + dt * speed) % 1;

    // Pick next playful turn angle right as each hop takes off (phase crosses 0.46)
    if (prevPhase < 0.46 && cyclePhase >= 0.46) {
      hopIndex = (hopIndex + 1) % TURN_ANGLES.length;
      targetYaw = TURN_ANGLES[hopIndex];
    }

    // Parabolic jump arc during phase [0.46 .. 0.86], grounded stance otherwise
    let jumpY = 0;
    let airTiltZ = 0;
    if (cyclePhase >= 0.46 && cyclePhase <= 0.86) {
      const u = (cyclePhase - 0.46) / 0.40; // 0 -> 1
      const jumpPeak = 0.25 + Math.min(0.1, dampedVelocity * 0.08) + (spinBonus > 0.2 ? 0.1 : 0);
      jumpY = 4 * u * (1 - u) * jumpPeak;
      airTiltZ = Math.sin(u * Math.PI) * (targetYaw >= currentYaw ? 0.045 : -0.045);
    }

    // Smooth yaw turn + optional click 360 spin decay
    currentYaw = THREE.MathUtils.lerp(currentYaw, targetYaw, Math.min(1, dt * 5.8));
    if (spinBonus > 0.001) {
      const stepSpin = spinBonus * Math.min(1, dt * 7.5);
      spinBonus -= stepSpin;
    } else {
      spinBonus = 0;
    }

    mascotPivot.position.set(0, BASE_Y_OFFSET + jumpY, 0);
    const scrollTurn = isTouch ? (touchProgress - 0.5) * 1.15 : 0;
    mascotPivot.rotation.set(0, currentYaw + spinBonus + scrollTurn, airTiltZ);

    // Ground halo scales & softens smoothly as mascot jumps up and sharpens on landing
    const shadowScale = THREE.MathUtils.clamp(1 - jumpY * 0.85, 0.58, 1);
    contactShadow.scale.set(shadowScale, shadowScale, 1);
    shadowMat.opacity = THREE.MathUtils.clamp(0.88 * (1 - jumpY * 1.35), 0.28, 0.88);

    renderer!.render(scene, camera);
  };

  animate();

  return {
    destroy() {
      window.cancelAnimationFrame(rafId);
      st.kill();
      visIo.disconnect();
      ro.disconnect();
      controls.dispose();
      container.removeEventListener('click', onClick);
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
      pmrem.dispose();
      envTex.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    },
  };
}
