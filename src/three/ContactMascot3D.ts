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

interface HumanoidRig {
  hips: THREE.Bone;
  spine: THREE.Bone;
  chest: THREE.Bone;
  head: THREE.Bone;
  leftThigh: THREE.Bone;
  leftCalf: THREE.Bone;
  leftFoot: THREE.Bone;
  rightThigh: THREE.Bone;
  rightCalf: THREE.Bone;
  rightFoot: THREE.Bone;
  leftUpperArm: THREE.Bone;
  leftForearm: THREE.Bone;
  leftHand: THREE.Bone;
  rightUpperArm: THREE.Bone;
  rightForearm: THREE.Bone;
  rightHand: THREE.Bone;
}

const BONE_PATTERNS: Record<keyof HumanoidRig, RegExp> = {
  hips: /hips|pelvis|root/i,
  spine: /spine(?!2|3)|waist/i,
  chest: /spine[12]|chest|upperchest|torso/i,
  head: /head|neck/i,
  leftThigh: /(left|l_).*?(thigh|upleg|upperleg)/i,
  leftCalf: /(left|l_).*?(calf|shin|leg|lowerleg|knee)/i,
  leftFoot: /(left|l_).*?(foot|ankle)/i,
  rightThigh: /(right|r_).*?(thigh|upleg|upperleg)/i,
  rightCalf: /(right|r_).*?(calf|shin|leg|lowerleg|knee)/i,
  rightFoot: /(right|r_).*?(foot|ankle)/i,
  leftUpperArm: /(left|l_).*?(upperarm|arm|shoulder)/i,
  leftForearm: /(left|l_).*?(forearm|lowerarm|elbow)/i,
  leftHand: /(left|l_).*?(hand|wrist)/i,
  rightUpperArm: /(right|r_).*?(upperarm|arm|shoulder)/i,
  rightForearm: /(right|r_).*?(forearm|lowerarm|elbow)/i,
  rightHand: /(right|r_).*?(hand|wrist)/i,
};

/**
 * Analytical Two-Bone IK Solver (Law of Cosines in the sagittal/step plane).
 * Returns hip pitch (rad) and knee pitch (rad) to plant a foot at (targetZ, targetY)
 * relative to the hip joint without sliding.
 */
function solveTwoBoneLegIK(
  thighLen: number,
  calfLen: number,
  targetZ: number,
  targetY: number
): { hipAngle: number; kneeAngle: number } {
  const maxReach = (thighLen + calfLen) * 0.992;
  const minReach = Math.abs(thighLen - calfLen) + 0.01;
  const dist = THREE.MathUtils.clamp(Math.hypot(targetZ, targetY), minReach, maxReach);

  // Law of cosines for knee bend (positive bends knee backward/naturally)
  const cosKnee = THREE.MathUtils.clamp(
    (thighLen * thighLen + calfLen * calfLen - dist * dist) / (2 * thighLen * calfLen),
    -1,
    1
  );
  const kneeInterior = Math.acos(cosKnee);
  const kneeAngle = Math.max(0, Math.PI - kneeInterior);

  // Angle from straight down (-Y) to target
  const baseAngle = Math.atan2(targetZ, -targetY);
  const cosAlpha = THREE.MathUtils.clamp(
    (thighLen * thighLen + dist * dist - calfLen * calfLen) / (2 * thighLen * dist),
    -1,
    1
  );
  const alpha = Math.acos(cosAlpha);
  const hipAngle = -(baseAngle + alpha);

  return { hipAngle, kneeAngle };
}

/**
 * If a GLB mesh is unrigged (no SkinnedMesh), auto-builds a clean 16-bone humanoid skeleton
 * and computes smooth anatomical vertex weights so full IK walk, arm swing, wave, and head
 * tracking work seamlessly out of the box.
 */
function autoSkinHumanoidMesh(mesh: THREE.Mesh): {
  skinned: THREE.SkinnedMesh;
  rig: HumanoidRig;
  thighLen: number;
  calfLen: number;
} {
  const geom = mesh.geometry.clone();
  geom.computeBoundingBox();
  const bb = geom.boundingBox!;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bb.getSize(size);
  bb.getCenter(center);

  // Normalize mesh so feet rest at y = 0 and height = 1.0
  const invH = 1 / Math.max(size.y, 0.001);
  geom.translate(-center.x, -bb.min.y, -center.z);
  geom.scale(invH, invH, invH);
  geom.computeBoundingBox();

  const w = size.x * invH;
  const hipY = 0.44;
  const kneeY = 0.23;
  const footY = 0.04;
  const spineY = 0.56;
  const chestY = 0.68;
  const headY = 0.78;
  const legX = w * 0.16;
  const shoulderX = w * 0.24;
  const elbowX = w * 0.35;
  const handX = w * 0.43;

  // Build hierarchical bones
  const hips = new THREE.Bone();
  hips.name = 'Hips';
  hips.position.set(0, hipY, 0);

  const spine = new THREE.Bone();
  spine.name = 'Spine';
  spine.position.set(0, spineY - hipY, 0);
  hips.add(spine);

  const chest = new THREE.Bone();
  chest.name = 'Chest';
  chest.position.set(0, chestY - spineY, 0);
  spine.add(chest);

  const head = new THREE.Bone();
  head.name = 'Head';
  head.position.set(0, headY - chestY, 0);
  chest.add(head);

  const leftThigh = new THREE.Bone();
  leftThigh.name = 'LeftThigh';
  leftThigh.position.set(-legX, 0, 0);
  hips.add(leftThigh);

  const leftCalf = new THREE.Bone();
  leftCalf.name = 'LeftCalf';
  leftCalf.position.set(0, kneeY - hipY, 0);
  leftThigh.add(leftCalf);

  const leftFoot = new THREE.Bone();
  leftFoot.name = 'LeftFoot';
  leftFoot.position.set(0, footY - kneeY, 0);
  leftCalf.add(leftFoot);

  const rightThigh = new THREE.Bone();
  rightThigh.name = 'RightThigh';
  rightThigh.position.set(legX, 0, 0);
  hips.add(rightThigh);

  const rightCalf = new THREE.Bone();
  rightCalf.name = 'RightCalf';
  rightCalf.position.set(0, kneeY - hipY, 0);
  rightThigh.add(rightCalf);

  const rightFoot = new THREE.Bone();
  rightFoot.name = 'RightFoot';
  rightFoot.position.set(0, footY - kneeY, 0);
  rightCalf.add(rightFoot);

  const leftUpperArm = new THREE.Bone();
  leftUpperArm.name = 'LeftUpperArm';
  leftUpperArm.position.set(-shoulderX, -0.02, 0);
  chest.add(leftUpperArm);

  const leftForearm = new THREE.Bone();
  leftForearm.name = 'LeftForearm';
  leftForearm.position.set(-(elbowX - shoulderX), -0.1, 0);
  leftUpperArm.add(leftForearm);

  const leftHand = new THREE.Bone();
  leftHand.name = 'LeftHand';
  leftHand.position.set(-(handX - elbowX), -0.09, 0);
  leftForearm.add(leftHand);

  const rightUpperArm = new THREE.Bone();
  rightUpperArm.name = 'RightUpperArm';
  rightUpperArm.position.set(shoulderX, -0.02, 0);
  chest.add(rightUpperArm);

  const rightForearm = new THREE.Bone();
  rightForearm.name = 'RightForearm';
  rightForearm.position.set(elbowX - shoulderX, -0.1, 0);
  rightUpperArm.add(rightForearm);

  const rightHand = new THREE.Bone();
  rightHand.name = 'RightHand';
  rightHand.position.set(handX - elbowX, -0.09, 0);
  rightForearm.add(rightHand);

  const bones: THREE.Bone[] = [
    hips, // 0
    spine, // 1
    chest, // 2
    head, // 3
    leftThigh, // 4
    leftCalf, // 5
    leftFoot, // 6
    rightThigh, // 7
    rightCalf, // 8
    rightFoot, // 9
    leftUpperArm, // 10
    leftForearm, // 11
    leftHand, // 12
    rightUpperArm, // 13
    rightForearm, // 14
    rightHand, // 15
  ];

  // Compute smooth anatomical skin weights per vertex
  const posAttr = geom.attributes.position;
  const vCount = posAttr.count;
  const skinIndices = new Uint16Array(vCount * 4);
  const skinWeights = new Float32Array(vCount * 4);

  const smoothstep = (e0: number, e1: number, x: number) => {
    const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };

  for (let i = 0; i < vCount; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const absX = Math.abs(vx);

    let b0 = 0;
    let b1 = 1;
    let w0 = 1;
    let w1 = 0;

    if (vy < hipY + 0.03) {
      // Lower body: Left (x < 0) vs Right (x >= 0) leg
      const isLeft = vx < 0;
      const thighIdx = isLeft ? 4 : 7;
      const calfIdx = isLeft ? 5 : 8;
      const footIdx = isLeft ? 6 : 9;

      if (vy < 0.11) {
        b0 = footIdx;
        b1 = calfIdx;
        w1 = smoothstep(0.05, 0.12, vy);
        w0 = 1 - w1;
      } else if (vy < kneeY + 0.05) {
        b0 = calfIdx;
        b1 = thighIdx;
        w1 = smoothstep(kneeY - 0.06, kneeY + 0.06, vy);
        w0 = 1 - w1;
      } else {
        b0 = thighIdx;
        b1 = 0; // hips
        w1 = smoothstep(hipY - 0.07, hipY + 0.04, vy);
        w0 = 1 - w1;
      }
    } else if (absX > shoulderX * 0.92 && vy > 0.36 && vy < 0.76) {
      // Arms (outside torso boundary)
      const isLeft = vx < 0;
      const upIdx = isLeft ? 10 : 13;
      const foreIdx = isLeft ? 11 : 14;
      const handIdx = isLeft ? 12 : 15;

      if (absX > elbowX + 0.03) {
        b0 = handIdx;
        b1 = foreIdx;
        w1 = 1 - smoothstep(elbowX + 0.02, handX, absX);
        w0 = 1 - w1;
      } else if (absX > shoulderX + 0.05) {
        b0 = foreIdx;
        b1 = upIdx;
        w1 = 1 - smoothstep(shoulderX + 0.04, elbowX + 0.03, absX);
        w0 = 1 - w1;
      } else {
        b0 = upIdx;
        b1 = 2; // chest
        w1 = 1 - smoothstep(shoulderX * 0.88, shoulderX + 0.06, absX);
        w0 = 1 - w1;
      }
    } else if (vy >= headY - 0.04) {
      // Head
      b0 = 3;
      b1 = 2;
      w1 = 1 - smoothstep(headY - 0.04, headY + 0.05, vy);
      w0 = 1 - w1;
    } else if (vy >= spineY) {
      // Chest
      b0 = 2;
      b1 = 1;
      w1 = 1 - smoothstep(spineY, chestY, vy);
      w0 = 1 - w1;
    } else {
      // Lower spine
      b0 = 1;
      b1 = 0;
      w1 = 1 - smoothstep(hipY, spineY, vy);
      w0 = 1 - w1;
    }

    const base = i * 4;
    skinIndices[base] = b0;
    skinIndices[base + 1] = b1;
    skinWeights[base] = w0;
    skinWeights[base + 1] = w1;
  }

  geom.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geom.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

  const skinned = new THREE.SkinnedMesh(geom, mesh.material);
  skinned.castShadow = true;
  skinned.receiveShadow = true;
  skinned.add(hips);
  const skeleton = new THREE.Skeleton(bones);
  skinned.bind(skeleton);

  return {
    skinned,
    rig: {
      hips,
      spine,
      chest,
      head,
      leftThigh,
      leftCalf,
      leftFoot,
      rightThigh,
      rightCalf,
      rightFoot,
      leftUpperArm,
      leftForearm,
      leftHand,
      rightUpperArm,
      rightForearm,
      rightHand,
    },
    thighLen: hipY - kneeY,
    calfLen: kneeY - footY,
  };
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 122);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
  grad.addColorStop(0.42, 'rgba(6, 182, 212, 0.16)');
  grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.12)');
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
  renderer.toneMappingExposure = 1.16;
  renderer.domElement.className = 'contact-logo-3d-canvas';
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D DEPLOY Mascot');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 1.05, 3.65);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minPolarAngle = Math.PI * 0.34;
  controls.maxPolarAngle = Math.PI * 0.6;
  controls.target.set(0, 0.92, 0);
  controls.update();

  // Studio environment + cool cyan #06B6D4 rim light + soft key light
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const keyLight = new THREE.DirectionalLight(0xf8fbff, 2.2);
  keyLight.position.set(3.2, 5.2, 4.5);
  scene.add(keyLight);

  const cyanRim = new THREE.DirectionalLight(0x06b6d4, 2.8);
  cyanRim.position.set(-4.2, 2.6, -3.0);
  scene.add(cyanRim);

  const backRim = new THREE.DirectionalLight(0x00aeef, 1.5);
  backRim.position.set(3.0, 2.0, -3.5);
  scene.add(backRim);

  const ambient = new THREE.AmbientLight(0xdbeafe, 0.42);
  scene.add(ambient);

  // Grounded contact shadow beneath sneakers
  const shadowTex = createContactShadowTexture();
  const shadowGeo = new THREE.PlaneGeometry(1.55, 1.55);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.9,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.002;
  scene.add(contactShadow);

  const stageGroup = new THREE.Group();
  scene.add(stageGroup);

  let rig: HumanoidRig | null = null;
  let thighLen = 0.21;
  let calfLen = 0.19;
  let restHipsY = 0.44;
  let eyelidLeft: THREE.Mesh | null = null;
  let eyelidRight: THREE.Mesh | null = null;
  let blinkMorphMesh: THREE.SkinnedMesh | THREE.Mesh | null = null;
  let blinkMorphIdx = -1;
  let loaded = false;

  const loader = new GLTFLoader();
  loader.load(
    encodeURI(glbUrl),
    (gltf) => {
      const root = gltf.scene;
      const foundBones: Partial<HumanoidRig> = {};
      let firstMesh: THREE.Mesh | null = null;
      let hasSkeleton = false;

      root.traverse((obj) => {
        if (obj instanceof THREE.Bone) {
          hasSkeleton = true;
          for (const [key, regex] of Object.entries(BONE_PATTERNS)) {
            if (!foundBones[key as keyof HumanoidRig] && regex.test(obj.name)) {
              foundBones[key as keyof HumanoidRig] = obj;
            }
          }
        }
        if (obj instanceof THREE.Mesh) {
          if (!firstMesh) firstMesh = obj;
          if (obj.morphTargetDictionary) {
            for (const [mName, idx] of Object.entries(obj.morphTargetDictionary)) {
              if (/blink|eyelid/i.test(mName)) {
                blinkMorphMesh = obj;
                blinkMorphIdx = idx;
              }
            }
          }
        }
      });

      const MASCOT_HEIGHT = 1.78;

      if (hasSkeleton && foundBones.hips && foundBones.leftThigh && foundBones.rightThigh) {
        // Use existing GLB skeleton directly
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const scale = MASCOT_HEIGHT / Math.max(size.y, 0.001);
        root.scale.setScalar(scale);
        root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
        stageGroup.add(root);
        rig = foundBones as HumanoidRig;
        restHipsY = rig.hips.position.y;
      } else if (firstMesh) {
        // Auto-skin the single-mesh mascot into a full 16-bone humanoid skeleton!
        const res = autoSkinHumanoidMesh(firstMesh);
        res.skinned.scale.setScalar(MASCOT_HEIGHT);
        stageGroup.add(res.skinned);
        rig = res.rig;
        thighLen = res.thighLen;
        calfLen = res.calfLen;
        restHipsY = rig.hips.position.y;
      }

      // Attach curvature-matched cyan eyelid meshes (#06B6D4) in local head space if no eye morphs exist
      if (rig?.head && blinkMorphIdx < 0) {
        const lidGeo = new THREE.SphereGeometry(0.042, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52);
        const lidMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x00aeef,
          emissiveIntensity: 0.18,
          roughness: 0.35,
          metalness: 0.15,
        });

        eyelidLeft = new THREE.Mesh(lidGeo, lidMat);
        eyelidLeft.position.set(-0.068, 0.095, 0.132);
        eyelidLeft.scale.set(1.15, 0.04, 0.72);
        eyelidLeft.visible = false;
        rig.head.add(eyelidLeft);

        eyelidRight = new THREE.Mesh(lidGeo, lidMat);
        eyelidRight.position.set(0.068, 0.095, 0.132);
        eyelidRight.scale.set(1.15, 0.04, 0.72);
        eyelidRight.visible = false;
        rig.head.add(eyelidRight);
      }

      loaded = true;
    },
    undefined,
    (err) => {
      console.warn('Could not load mascot GLB:', err);
    }
  );

  // GSAP ScrollTrigger choreography scrubbed to #contact
  let scrollProgress = 0.5;
  let scrollVelocity = 0;
  let dampedVelocity = 0;

  const st = ScrollTrigger.create({
    trigger: sectionEl,
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => {
      scrollProgress = self.progress;
      scrollVelocity = THREE.MathUtils.clamp(Math.abs(self.getVelocity()) / 900, 0, 2.2);
    },
  });

  // Cursor look-at head tracking
  const pointerNdc = { x: -0.25, y: 0.05 };
  let smoothHeadYaw = -0.18;
  let smoothHeadPitch = 0.0;

  const onPointerMove = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    pointerNdc.x = THREE.MathUtils.clamp((e.clientX - cx) / (window.innerWidth * 0.45), -1, 1);
    pointerNdc.y = THREE.MathUtils.clamp((e.clientY - cy) / (window.innerHeight * 0.45), -1, 1);
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // Randomized single & double eye blink scheduler (2.5s - 5.0s interval, 70ms close, 110ms ease-out open)
  let nextBlinkAt = 2.6;
  let blinkPhase = 0; // 0 = idle, 1 = closing, 2 = opening
  let blinkTimer = 0;
  let pendingDoubleBlink = false;

  const updateBlink = (dt: number, elapsed: number) => {
    let blinkAmt = 0;
    if (blinkPhase === 0) {
      if (elapsed >= nextBlinkAt) {
        blinkPhase = 1;
        blinkTimer = 0;
        pendingDoubleBlink = Math.random() < 0.34;
      }
    } else if (blinkPhase === 1) {
      blinkTimer += dt;
      const t = THREE.MathUtils.clamp(blinkTimer / 0.07, 0, 1); // fast 70ms close
      blinkAmt = t * t;
      if (t >= 1) {
        blinkPhase = 2;
        blinkTimer = 0;
      }
    } else if (blinkPhase === 2) {
      blinkTimer += dt;
      const t = THREE.MathUtils.clamp(blinkTimer / 0.11, 0, 1); // 110ms ease-out open
      blinkAmt = 1 - (1 - Math.pow(1 - t, 3));
      if (t >= 1) {
        if (pendingDoubleBlink) {
          pendingDoubleBlink = false;
          blinkPhase = 1;
          blinkTimer = 0;
        } else {
          blinkPhase = 0;
          nextBlinkAt = elapsed + 2.5 + Math.random() * 2.5;
        }
      }
    }

    if (blinkMorphMesh && blinkMorphIdx >= 0 && blinkMorphMesh.morphTargetInfluences) {
      blinkMorphMesh.morphTargetInfluences[blinkMorphIdx] = blinkAmt;
    } else if (eyelidLeft && eyelidRight) {
      const show = blinkAmt > 0.04;
      eyelidLeft.visible = show;
      eyelidRight.visible = show;
      if (show) {
        const sy = 0.05 + blinkAmt * 0.92;
        eyelidLeft.scale.set(1.15, sy, 0.72);
        eyelidRight.scale.set(1.15, sy, 0.72);
      }
    }
  };

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
  let walkPhase = 0;
  const clock = new THREE.Clock();

  let isVisible = true;
  const visIo = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0]?.isIntersecting ?? true;
    },
    { rootMargin: '250px' }
  );
  visIo.observe(container);

  const animate = () => {
    rafId = window.requestAnimationFrame(animate);
    if (!isVisible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    controls.update();

    if (!loaded || !rig) {
      renderer!.render(scene, camera);
      return;
    }

    // Smoothly damp scroll velocity back to 0 when scrolling stops (no frozen mid-step)
    scrollVelocity = THREE.MathUtils.lerp(scrollVelocity, 0, Math.min(1, dt * 5.5));
    dampedVelocity = THREE.MathUtils.lerp(dampedVelocity, scrollVelocity, Math.min(1, dt * 6.5));

    // Choreography phases across #contact scroll progress:
    // 0.00 -> 0.42: Walking in across stage
    // 0.42 -> 0.65: Turns toward "Start your project ->" button on the left & waves
    const walkZone = 1 - THREE.MathUtils.smoothstep(scrollProgress, 0.34, 0.48);
    const waveZone = THREE.MathUtils.smoothstep(scrollProgress, 0.38, 0.56);

    const activeWalkSpeed = reduced ? 0 : Math.min(1.4, dampedVelocity * 1.15 + walkZone * 0.45);
    const walkWeight = reduced ? 0 : THREE.MathUtils.clamp(activeWalkSpeed * 1.1, 0, 1);

    walkPhase += dt * (2.6 + activeWalkSpeed * 5.2) * walkWeight;

    // Lateral walk-in & orientation toward the CTA button on the left
    const walkInX = reduced ? 0 : THREE.MathUtils.lerp(0.52, 0.0, THREE.MathUtils.smoothstep(scrollProgress, 0.08, 0.46));
    const walkInZ = reduced ? 0 : THREE.MathUtils.lerp(-0.45, 0.0, THREE.MathUtils.smoothstep(scrollProgress, 0.08, 0.46));
    const targetFacingY = reduced ? -0.35 : THREE.MathUtils.lerp(-0.18, -0.44, waveZone);

    stageGroup.position.x = THREE.MathUtils.lerp(stageGroup.position.x, walkInX, Math.min(1, dt * 6));
    stageGroup.position.z = THREE.MathUtils.lerp(stageGroup.position.z, walkInZ, Math.min(1, dt * 6));
    stageGroup.rotation.y = THREE.MathUtils.lerp(stageGroup.rotation.y, targetFacingY, Math.min(1, dt * 5));

    // Grounded contact shadow tracks mascot position and softens slightly on bounce
    contactShadow.position.x = stageGroup.position.x;
    contactShadow.position.z = stageGroup.position.z;

    // ---- 1. Two-Bone IK Leg Walk Cycle (zero foot sliding) ----
    const strideLen = 0.13 * walkWeight;
    const stepLift = 0.065 * walkWeight;
    const baseFootY = -(thighLen + calfLen) * 0.96;

    const lSin = Math.sin(walkPhase);
    const lCos = Math.cos(walkPhase);
    const rSin = Math.sin(walkPhase + Math.PI);
    const rCos = Math.cos(walkPhase + Math.PI);

    const leftFootZ = lSin * strideLen;
    const leftFootY = baseFootY + Math.max(0, lCos) * stepLift;
    const rightFootZ = rSin * strideLen;
    const rightFootY = baseFootY + Math.max(0, rCos) * stepLift;

    const leftIK = solveTwoBoneLegIK(thighLen, calfLen, leftFootZ, leftFootY);
    const rightIK = solveTwoBoneLegIK(thighLen, calfLen, rightFootZ, rightFootY);

    rig.leftThigh.rotation.x = THREE.MathUtils.lerp(rig.leftThigh.rotation.x, leftIK.hipAngle * walkWeight, Math.min(1, dt * 12));
    rig.leftCalf.rotation.x = THREE.MathUtils.lerp(rig.leftCalf.rotation.x, leftIK.kneeAngle * walkWeight, Math.min(1, dt * 12));
    rig.leftFoot.rotation.x = THREE.MathUtils.lerp(rig.leftFoot.rotation.x, -(leftIK.hipAngle + leftIK.kneeAngle) * 0.45 * walkWeight, Math.min(1, dt * 12));

    rig.rightThigh.rotation.x = THREE.MathUtils.lerp(rig.rightThigh.rotation.x, rightIK.hipAngle * walkWeight, Math.min(1, dt * 12));
    rig.rightCalf.rotation.x = THREE.MathUtils.lerp(rig.rightCalf.rotation.x, rightIK.kneeAngle * walkWeight, Math.min(1, dt * 12));
    rig.rightFoot.rotation.x = THREE.MathUtils.lerp(rig.rightFoot.rotation.x, -(rightIK.hipAngle + rightIK.kneeAngle) * 0.45 * walkWeight, Math.min(1, dt * 12));

    // ---- 2. Secondary Motion: Hip Bounce (2x freq), Hip Sway, Idle Breathing & Torso Counter-Rotation ----
    const idleBreath = reduced ? 0 : Math.sin(elapsed * 2.1) * 0.014;
    const idleShift = reduced ? 0 : Math.sin(elapsed * 1.05) * 0.025;
    const bounce2x = Math.abs(Math.sin(walkPhase)) * 0.022 * walkWeight;
    const hipSwayZ = Math.sin(walkPhase) * 0.055 * walkWeight + idleShift * (1 - walkWeight);

    rig.hips.position.y = restHipsY + bounce2x + idleBreath * 0.35;
    rig.hips.rotation.z = hipSwayZ;
    rig.hips.rotation.y = Math.sin(walkPhase) * 0.09 * walkWeight;

    // Torso counter-rotates opposite to hips + organic breathing expansion
    rig.spine.rotation.y = -rig.hips.rotation.y * 0.85;
    rig.spine.rotation.z = -hipSwayZ * 0.55;
    rig.chest.rotation.y = -rig.hips.rotation.y * 0.55;
    rig.chest.rotation.x = idleBreath * 1.8;

    // ---- 3. Natural Arm Swing + CTA Wave Gesture ----
    const leftArmSwing = Math.sin(walkPhase + Math.PI) * 0.45 * walkWeight;
    const rightArmSwing = Math.sin(walkPhase) * 0.45 * walkWeight;

    // Left arm swings naturally with delayed forearm follow-through
    rig.leftUpperArm.rotation.x = THREE.MathUtils.lerp(rig.leftUpperArm.rotation.x, leftArmSwing, Math.min(1, dt * 10));
    rig.leftUpperArm.rotation.z = THREE.MathUtils.lerp(rig.leftUpperArm.rotation.z, 0.08 + idleBreath * 1.4, Math.min(1, dt * 8));
    rig.leftForearm.rotation.x = THREE.MathUtils.lerp(
      rig.leftForearm.rotation.x,
      -0.18 - Math.max(0, Math.sin(walkPhase + Math.PI - 0.55)) * 0.35 * walkWeight,
      Math.min(1, dt * 10)
    );

    // Right arm transitions seamlessly from walking swing -> friendly gesture/wave toward the CTA button
    const waveOsc = reduced ? 0 : Math.sin(elapsed * 5.2) * 0.24;
    const targetRightUpZ = THREE.MathUtils.lerp(-0.08 - idleBreath * 1.4, 0.82, waveZone * (1 - walkWeight * 0.7));
    const targetRightUpX = THREE.MathUtils.lerp(rightArmSwing, -0.35, waveZone * (1 - walkWeight * 0.7));
    const targetRightForeZ = THREE.MathUtils.lerp(0, 0.32 + waveOsc, waveZone * (1 - walkWeight * 0.7));
    const targetRightHandZ = THREE.MathUtils.lerp(0, waveOsc * 0.7, waveZone * (1 - walkWeight * 0.7));

    rig.rightUpperArm.rotation.z = THREE.MathUtils.lerp(rig.rightUpperArm.rotation.z, targetRightUpZ, Math.min(1, dt * 6));
    rig.rightUpperArm.rotation.x = THREE.MathUtils.lerp(rig.rightUpperArm.rotation.x, targetRightUpX, Math.min(1, dt * 8));
    rig.rightForearm.rotation.z = THREE.MathUtils.lerp(rig.rightForearm.rotation.z, targetRightForeZ, Math.min(1, dt * 8));
    rig.rightHand.rotation.z = THREE.MathUtils.lerp(rig.rightHand.rotation.z, targetRightHandZ, Math.min(1, dt * 10));

    // ---- 4. Cursor Look-At Head Tracking + Subtle Head Tilt ----
    const targetHeadYaw = THREE.MathUtils.clamp(pointerNdc.x * 0.42, -0.45, 0.45);
    const targetHeadPitch = THREE.MathUtils.clamp(pointerNdc.y * 0.26, -0.25, 0.28);
    smoothHeadYaw = THREE.MathUtils.lerp(smoothHeadYaw, targetHeadYaw, Math.min(1, dt * 5.5));
    smoothHeadPitch = THREE.MathUtils.lerp(smoothHeadPitch, targetHeadPitch, Math.min(1, dt * 5.5));

    rig.head.rotation.y = smoothHeadYaw;
    rig.head.rotation.x = smoothHeadPitch + idleBreath * 1.2;
    rig.head.rotation.z = -smoothHeadYaw * 0.18 + (reduced ? 0 : Math.sin(elapsed * 1.1) * 0.03);

    // ---- 5. Natural Randomized Eye Blinking ----
    if (!reduced) {
      updateBlink(dt, elapsed);
    }

    // Contact shadow subtly scales with hip bounce
    const shScale = 1 - bounce2x * 3.5;
    contactShadow.scale.set(shScale, shScale, 1);

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
      window.removeEventListener('pointermove', onPointerMove);
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
