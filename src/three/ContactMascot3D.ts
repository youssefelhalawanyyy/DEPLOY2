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

interface RigBoneInfo {
  bone: THREE.Bone;
  restQuat: THREE.Quaternion;
  restPos: THREE.Vector3;
  /** Local axis in this bone's bind space corresponding to world +X (sagittal pitch forward/back) */
  localWorldX: THREE.Vector3;
  /** Local axis in this bone's bind space corresponding to world +Y (vertical yaw) */
  localWorldY: THREE.Vector3;
  /** Local axis in this bone's bind space corresponding to world +Z (frontal roll / arm raise & wave) */
  localWorldZ: THREE.Vector3;
}

interface MappedSkeleton {
  lockedBody: RigBoneInfo[];
  // Screen-left leg & arm (anatomical R_* in GLB, X < 0)
  screenLeftThigh?: RigBoneInfo;
  screenLeftCalf?: RigBoneInfo;
  screenLeftFoot?: RigBoneInfo;
  screenLeftUpperArm?: RigBoneInfo;
  screenLeftForearm?: RigBoneInfo;
  screenLeftHand?: RigBoneInfo;
  // Screen-right leg & arm (anatomical L_* in GLB, X > 0 — open side of the "D")
  screenRightThigh?: RigBoneInfo;
  screenRightCalf?: RigBoneInfo;
  screenRightFoot?: RigBoneInfo;
  screenRightUpperArm?: RigBoneInfo;
  screenRightForearm?: RigBoneInfo;
  screenRightHand?: RigBoneInfo;
  thighLen: number;
  calfLen: number;
}

const WORLD_X = new THREE.Vector3(1, 0, 0);
const WORLD_Y = new THREE.Vector3(0, 1, 0);
const WORLD_Z = new THREE.Vector3(0, 0, 1);

const _qX = new THREE.Quaternion();
const _qY = new THREE.Quaternion();
const _qZ = new THREE.Quaternion();

function makeBoneInfo(bone: THREE.Bone): RigBoneInfo {
  bone.updateWorldMatrix(true, false);
  const worldQuat = new THREE.Quaternion();
  bone.getWorldQuaternion(worldQuat);
  const invWorldQuat = worldQuat.clone().invert();

  return {
    bone,
    restQuat: bone.quaternion.clone(),
    restPos: bone.position.clone(),
    localWorldX: WORLD_X.clone().applyQuaternion(invWorldQuat).normalize(),
    localWorldY: WORLD_Y.clone().applyQuaternion(invWorldQuat).normalize(),
    localWorldZ: WORLD_Z.clone().applyQuaternion(invWorldQuat).normalize(),
  };
}

/**
 * Applies clean world-space axis rotations (rotZ -> rotY -> rotX) on top of the bone's exact bind pose.
 */
function applyWorldDelta(info: RigBoneInfo | undefined, rotX = 0, rotY = 0, rotZ = 0): void {
  if (!info) return;
  info.bone.quaternion.copy(info.restQuat);
  if (Math.abs(rotZ) > 1e-4) {
    _qZ.setFromAxisAngle(info.localWorldZ, rotZ);
    info.bone.quaternion.multiply(_qZ);
  }
  if (Math.abs(rotY) > 1e-4) {
    _qY.setFromAxisAngle(info.localWorldY, rotY);
    info.bone.quaternion.multiply(_qY);
  }
  if (Math.abs(rotX) > 1e-4) {
    _qX.setFromAxisAngle(info.localWorldX, rotX);
    info.bone.quaternion.multiply(_qX);
  }
}

/**
 * Analytical Two-Bone IK Solver (Law of Cosines in the sagittal step plane)
 * with forward knee pole alignment so sneakers lift, swing forward, and plant cleanly.
 */
function solveTwoBoneLegIK(
  thighLen: number,
  calfLen: number,
  targetZ: number,
  targetY: number
): { hipAngle: number; kneeAngle: number } {
  const maxReach = (thighLen + calfLen) * 0.992;
  const minReach = Math.abs(thighLen - calfLen) + 0.008;
  const dist = THREE.MathUtils.clamp(Math.hypot(targetZ, targetY), minReach, maxReach);

  const cosKnee = THREE.MathUtils.clamp(
    (thighLen * thighLen + calfLen * calfLen - dist * dist) / (2 * thighLen * calfLen),
    -1,
    1
  );
  const kneeAngle = Math.max(0, Math.PI - Math.acos(cosKnee));

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

function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 14, 128, 128, 122);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.84)');
  grad.addColorStop(0.42, 'rgba(6, 182, 212, 0.17)');
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
  renderer.toneMappingExposure = 1.18;
  renderer.domElement.className = 'contact-logo-3d-canvas';
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D DEPLOY Mascot');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.98, 3.65);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minPolarAngle = Math.PI * 0.34;
  controls.maxPolarAngle = Math.PI * 0.6;
  controls.target.set(0, 0.88, 0);
  controls.update();

  // Studio environment + Electric Cyan #06B6D4 rim light + warm-white key light
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const keyLight = new THREE.DirectionalLight(0xfff9f0, 2.25);
  keyLight.position.set(3.2, 5.2, 4.6);
  scene.add(keyLight);

  const cyanRim = new THREE.DirectionalLight(0x06b6d4, 2.95);
  cyanRim.position.set(-4.2, 2.6, -3.0);
  scene.add(cyanRim);

  const backRim = new THREE.DirectionalLight(0x00aeef, 1.6);
  backRim.position.set(3.2, 2.0, -3.5);
  scene.add(backRim);

  const ambient = new THREE.AmbientLight(0xdbeafe, 0.44);
  scene.add(ambient);

  // Soft ContactShadows plane directly under the sneakers
  const shadowTex = createContactShadowTexture();
  const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.92,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.002;
  scene.add(contactShadow);

  const stageGroup = new THREE.Group();
  const bodyMotionGroup = new THREE.Group();
  stageGroup.add(bodyMotionGroup);
  scene.add(stageGroup);

  let mapped: MappedSkeleton | null = null;
  let eyelidLeftPivot: THREE.Group | null = null;
  let eyelidRightPivot: THREE.Group | null = null;
  let blinkMorphMesh: THREE.Mesh | null = null;
  let blinkMorphIdx = -1;
  let loaded = false;

  const loader = new GLTFLoader();
  loader.load(
    encodeURI(glbUrl),
    (gltf) => {
      const root = gltf.scene;

      // Normalize height to 1.74 world units and plant sneakers cleanly on y = 0
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const MASCOT_HEIGHT = 1.74;
      const scale = MASCOT_HEIGHT / Math.max(size.y, 0.001);
      root.scale.setScalar(scale);
      root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      bodyMotionGroup.add(root);
      bodyMotionGroup.updateMatrixWorld(true);

      const skel: MappedSkeleton = {
        lockedBody: [],
        thighLen: 0.24,
        calfLen: 0.25,
      };

      const LOCKED_PATTERN = /^(BoneRoot|Hip|Pelvis|Waist|Spine\d*|NeckTwist\d*|Head|FacialBone|neutral_bone)$/i;
      let rEyeBone: THREE.Bone | null = null;
      let lEyeBone: THREE.Bone | null = null;

      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.morphTargetDictionary) {
          for (const [mName, idx] of Object.entries(obj.morphTargetDictionary)) {
            if (/blink|eyelid/i.test(mName)) {
              blinkMorphMesh = obj;
              blinkMorphIdx = idx;
            }
          }
        }

        if (!(obj instanceof THREE.Bone)) return;
        const n = obj.name;

        if (LOCKED_PATTERN.test(n)) {
          skel.lockedBody.push(makeBoneInfo(obj));
          return;
        }

        // Note: Mascot faces +Z toward viewer, so anatomical R_* is screen-left (X < 0)
        // and anatomical L_* is screen-right (X > 0, the open curved side of the "D"!)
        if (/^R_Eye$/i.test(n)) rEyeBone = obj;
        else if (/^L_Eye$/i.test(n)) lEyeBone = obj;
        else if (/^R_Thigh$/i.test(n)) skel.screenLeftThigh = makeBoneInfo(obj);
        else if (/^R_Calf$/i.test(n)) skel.screenLeftCalf = makeBoneInfo(obj);
        else if (/^R_Foot$/i.test(n)) skel.screenLeftFoot = makeBoneInfo(obj);
        else if (/^L_Thigh$/i.test(n)) skel.screenRightThigh = makeBoneInfo(obj);
        else if (/^L_Calf$/i.test(n)) skel.screenRightCalf = makeBoneInfo(obj);
        else if (/^L_Foot$/i.test(n)) skel.screenRightFoot = makeBoneInfo(obj);
        else if (/^R_Upperarm$/i.test(n)) skel.screenLeftUpperArm = makeBoneInfo(obj);
        else if (/^R_Forearm$/i.test(n)) skel.screenLeftForearm = makeBoneInfo(obj);
        else if (/^R_Hand$/i.test(n)) skel.screenLeftHand = makeBoneInfo(obj);
        else if (/^L_Upperarm$/i.test(n)) skel.screenRightUpperArm = makeBoneInfo(obj);
        else if (/^L_Forearm$/i.test(n)) skel.screenRightForearm = makeBoneInfo(obj);
        else if (/^L_Hand$/i.test(n)) skel.screenRightHand = makeBoneInfo(obj);
      });

      // Measure scaled thigh & calf segment lengths for exact Two-Bone IK
      if (skel.screenRightThigh && skel.screenRightCalf && skel.screenRightFoot) {
        const pThigh = new THREE.Vector3();
        const pCalf = new THREE.Vector3();
        const pFoot = new THREE.Vector3();
        skel.screenRightThigh.bone.getWorldPosition(pThigh);
        skel.screenRightCalf.bone.getWorldPosition(pCalf);
        skel.screenRightFoot.bone.getWorldPosition(pFoot);
        skel.thighLen = Math.max(0.08, pThigh.distanceTo(pCalf));
        skel.calfLen = Math.max(0.08, pCalf.distanceTo(pFoot));
      }

      // Attach curvature-matched cyan/blue eyelid meshes in clean upright bodyMotionGroup space
      // directly at the exact world-converted coordinates of R_Eye & L_Eye
      if (blinkMorphIdx < 0 && rEyeBone && lEyeBone) {
        const lidMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x00aeef,
          emissiveIntensity: 0.2,
          roughness: 0.28,
          metalness: 0.15,
        });
        const lidGeo = new THREE.SphereGeometry(0.056, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);

        const attachEyelid = (eyeBone: THREE.Bone, surfaceOffsetZ: number) => {
          const wp = new THREE.Vector3();
          eyeBone.getWorldPosition(wp);
          bodyMotionGroup.worldToLocal(wp);
          const pivot = new THREE.Group();
          pivot.position.set(wp.x, wp.y + 0.032, wp.z + surfaceOffsetZ * scale);
          const mesh = new THREE.Mesh(lidGeo, lidMat);
          mesh.position.set(0, -0.032, 0);
          mesh.scale.set(1.05, 1.0, 0.42);
          pivot.add(mesh);
          pivot.scale.set(1, 0.01, 1);
          pivot.visible = false;
          bodyMotionGroup.add(pivot);
          return pivot;
        };

        eyelidLeftPivot = attachEyelid(rEyeBone, 0.014);
        eyelidRightPivot = attachEyelid(lEyeBone, 0.019);
      }

      mapped = skel;
      loaded = true;
    },
    undefined,
    (err) => {
      console.warn('Could not load rigged mascot GLB:', err);
    }
  );

  // GSAP ScrollTrigger scrubbed to #contact
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

  // Hover & click over the mascot triggers / boosts the friendly "wave goodbye" gesture
  let isHoveringCard = false;
  let clickWaveUntil = 0;
  const clock = new THREE.Clock();

  const onEnter = () => {
    isHoveringCard = true;
  };
  const onLeave = () => {
    isHoveringCard = false;
  };
  const onClick = () => {
    clickWaveUntil = clock.elapsedTime + 3.2;
  };
  container.addEventListener('pointerenter', onEnter);
  container.addEventListener('pointerleave', onLeave);
  container.addEventListener('click', onClick);

  // Cursor look-at tracking
  const pointerNdc = { x: -0.15, y: 0.04 };
  let smoothLookYaw = -0.1;
  let smoothLookPitch = 0;

  const onPointerMove = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    pointerNdc.x = THREE.MathUtils.clamp((e.clientX - cx) / (window.innerWidth * 0.45), -1, 1);
    pointerNdc.y = THREE.MathUtils.clamp((e.clientY - cy) / (window.innerHeight * 0.45), -1, 1);
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // Randomized natural eye blink timer every 2.5–4.5s (70ms fast close, 110ms smooth open + double-blinks)
  let nextBlinkAt = 2.5;
  let blinkPhase = 0;
  let blinkTimer = 0;
  let pendingDoubleBlink = false;

  const updateBlink = (dt: number, elapsed: number) => {
    let blinkAmt = 0;
    if (blinkPhase === 0) {
      if (elapsed >= nextBlinkAt) {
        blinkPhase = 1;
        blinkTimer = 0;
        pendingDoubleBlink = Math.random() < 0.32;
      }
    } else if (blinkPhase === 1) {
      blinkTimer += dt;
      const t = THREE.MathUtils.clamp(blinkTimer / 0.07, 0, 1);
      blinkAmt = t * t;
      if (t >= 1) {
        blinkPhase = 2;
        blinkTimer = 0;
      }
    } else if (blinkPhase === 2) {
      blinkTimer += dt;
      const t = THREE.MathUtils.clamp(blinkTimer / 0.11, 0, 1);
      blinkAmt = 1 - (1 - Math.pow(1 - t, 3));
      if (t >= 1) {
        if (pendingDoubleBlink) {
          pendingDoubleBlink = false;
          blinkPhase = 1;
          blinkTimer = 0;
        } else {
          blinkPhase = 0;
          nextBlinkAt = elapsed + 2.5 + Math.random() * 2.0;
        }
      }
    }

    if (blinkMorphMesh && blinkMorphIdx >= 0 && blinkMorphMesh.morphTargetInfluences) {
      blinkMorphMesh.morphTargetInfluences[blinkMorphIdx] = blinkAmt;
    } else if (eyelidLeftPivot && eyelidRightPivot) {
      const show = blinkAmt > 0.04;
      eyelidLeftPivot.visible = show;
      eyelidRightPivot.visible = show;
      if (show) {
        const sy = Math.max(0.05, blinkAmt);
        eyelidLeftPivot.scale.set(1, sy, 1);
        eyelidRightPivot.scale.set(1, sy, 1);
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

  let isVisible = true;
  const visIo = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0]?.isIntersecting ?? true;
    },
    { rootMargin: '250px' }
  );
  visIo.observe(container);

  let rafId = 0;
  let walkPhase = 0;
  let curLHip = 0;
  let curLKnee = 0;
  let curRHip = 0;
  let curRKnee = 0;
  let curWaveBlend = 0.85;

  const animate = () => {
    rafId = window.requestAnimationFrame(animate);
    if (!isVisible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    controls.update();

    if (!loaded || !mapped) {
      renderer!.render(scene, camera);
      return;
    }

    // 1. Strictly lock the central "D" body, face, and front arrow bones to their exact bind pose
    for (const locked of mapped.lockedBody) {
      locked.bone.quaternion.copy(locked.restQuat);
      locked.bone.position.copy(locked.restPos);
    }

    // 2. Smoothly damp scroll velocity so walk settles seamlessly into grounded stance
    scrollVelocity = THREE.MathUtils.lerp(scrollVelocity, 0, Math.min(1, dt * 5.5));
    dampedVelocity = THREE.MathUtils.lerp(dampedVelocity, scrollVelocity, Math.min(1, dt * 6.5));

    // Walk-in phase as user scrolls into CTA (0.05 -> 0.42), then grounded stance facing the user
    const walkInFactor = 1 - THREE.MathUtils.smoothstep(scrollProgress, 0.30, 0.44);
    const inCtaZone = THREE.MathUtils.smoothstep(scrollProgress, 0.24, 0.44);

    const activeWalkSpeed = reduced ? 0 : Math.min(1.35, dampedVelocity * 1.1 + walkInFactor * 0.55);
    const walkWeight = reduced ? 0 : THREE.MathUtils.clamp(activeWalkSpeed * 1.05, 0, 1);

    walkPhase += dt * (2.8 + activeWalkSpeed * 5.0) * walkWeight;

    // Walk forward into frame along +Z, settling cleanly centered facing the user
    const walkInZ = reduced ? 0 : THREE.MathUtils.lerp(-0.62, 0.0, THREE.MathUtils.smoothstep(scrollProgress, 0.06, 0.42));
    const walkInX = reduced ? 0 : THREE.MathUtils.lerp(0.22, 0.0, THREE.MathUtils.smoothstep(scrollProgress, 0.06, 0.42));
    const targetFacingY = reduced ? -0.14 : THREE.MathUtils.lerp(-0.08, -0.18, inCtaZone);

    stageGroup.position.x = THREE.MathUtils.lerp(stageGroup.position.x, walkInX, Math.min(1, dt * 6));
    stageGroup.position.z = THREE.MathUtils.lerp(stageGroup.position.z, walkInZ, Math.min(1, dt * 6));
    stageGroup.rotation.y = THREE.MathUtils.lerp(stageGroup.rotation.y, targetFacingY, Math.min(1, dt * 5));

    contactShadow.position.x = stageGroup.position.x;
    contactShadow.position.z = stageGroup.position.z;

    // 3. Body Physics (2x step vertical bounce, gentle hip sway, breathing & subtle cursor tracking)
    const idleBreath = reduced ? 0 : Math.sin(elapsed * 2.1) * 0.014;
    const idleSway = reduced ? 0 : Math.sin(elapsed * 1.15) * 0.022;
    const bounce2x = Math.abs(Math.sin(walkPhase)) * 0.042 * walkWeight;
    const swayZ = Math.sin(walkPhase) * 0.048 * walkWeight + idleSway * (1 - walkWeight);
    const counterYaw = -Math.sin(walkPhase) * 0.065 * walkWeight;

    const targetLookYaw = THREE.MathUtils.clamp(pointerNdc.x * 0.2, -0.24, 0.24);
    const targetLookPitch = THREE.MathUtils.clamp(pointerNdc.y * 0.12, -0.14, 0.14);
    smoothLookYaw = THREE.MathUtils.lerp(smoothLookYaw, targetLookYaw, Math.min(1, dt * 5));
    smoothLookPitch = THREE.MathUtils.lerp(smoothLookPitch, targetLookPitch, Math.min(1, dt * 5));

    bodyMotionGroup.position.y = bounce2x + idleBreath;
    bodyMotionGroup.rotation.z = swayZ - smoothLookYaw * 0.12;
    bodyMotionGroup.rotation.y = counterYaw + smoothLookYaw;
    bodyMotionGroup.rotation.x = smoothLookPitch + idleBreath * 0.5;

    // 4. Two-Bone IK Leg Walk Cycle (zero foot sliding)
    const strideLen = (mapped.thighLen + mapped.calfLen) * 0.34 * walkWeight;
    const stepLift = (mapped.thighLen + mapped.calfLen) * 0.18 * walkWeight;
    const baseFootY = -(mapped.thighLen + mapped.calfLen) * 0.96;

    const lIK = solveTwoBoneLegIK(
      mapped.thighLen,
      mapped.calfLen,
      Math.sin(walkPhase) * strideLen,
      baseFootY + Math.max(0, Math.cos(walkPhase)) * stepLift
    );
    const rIK = solveTwoBoneLegIK(
      mapped.thighLen,
      mapped.calfLen,
      Math.sin(walkPhase + Math.PI) * strideLen,
      baseFootY + Math.max(0, Math.cos(walkPhase + Math.PI)) * stepLift
    );

    const legDamp = Math.min(1, dt * 12);
    curLHip = THREE.MathUtils.lerp(curLHip, lIK.hipAngle * walkWeight, legDamp);
    curLKnee = THREE.MathUtils.lerp(curLKnee, lIK.kneeAngle * walkWeight, legDamp);
    curRHip = THREE.MathUtils.lerp(curRHip, rIK.hipAngle * walkWeight, legDamp);
    curRKnee = THREE.MathUtils.lerp(curRKnee, rIK.kneeAngle * walkWeight, legDamp);

    applyWorldDelta(mapped.screenLeftThigh, curLHip, 0, 0);
    applyWorldDelta(mapped.screenLeftCalf, curLKnee, 0, 0);
    applyWorldDelta(mapped.screenLeftFoot, -(curLHip + curLKnee) * 0.5, 0, 0);

    applyWorldDelta(mapped.screenRightThigh, curRHip, 0, 0);
    applyWorldDelta(mapped.screenRightCalf, curRKnee, 0, 0);
    applyWorldDelta(mapped.screenRightFoot, -(curRHip + curRKnee) * 0.5, 0, 0);

    // 5. FIX T-POSE & ARM CLIPPING — Screen-Left Arm (R_Upperarm / R_Forearm / R_Hand):
    // R_Upperarm points along -X in T-pose. Rotating +60 deg (+1.05 rad) around World +Z drops it
    // cleanly downward beside the "D", and +0.28 rad around World +Y nudges it slightly forward (+Z)
    // so it NEVER clips behind the front blue arrows!
    const leftArmWalkSwing = Math.sin(walkPhase + Math.PI) * 0.34 * walkWeight;
    const restDownZ = 1.05 + idleBreath * 1.1; // ~60 degrees downward from horizontal T-pose
    const restForwardY = 0.28; // slightly forward clear of blue arrows
    const restPitchX = -0.14 + leftArmWalkSwing;

    applyWorldDelta(mapped.screenLeftUpperArm, restPitchX, restForwardY, restDownZ);
    applyWorldDelta(
      mapped.screenLeftForearm,
      -0.22 - Math.max(0, Math.sin(walkPhase + Math.PI - 0.5)) * 0.25 * walkWeight,
      0.16,
      -0.12
    );
    applyWorldDelta(mapped.screenLeftHand, 0, 0, -0.08);

    // 6. FRIENDLY "WAVE GOODBYE" ANIMATION — Screen-Right Arm (L_Upperarm / L_Forearm / L_Hand, open side of "D"):
    // Triggered as welcoming/goodbye loop in CTA section AND boosted on hover/click!
    const interactiveWave = isHoveringCard || elapsed < clickWaveUntil;
    // Gentle periodic wave envelope in CTA (waves warmly, pauses briefly, waves again; continuous while hovered/clicked)
    const periodicLoop = 0.5 + 0.5 * Math.sin(elapsed * 0.85);
    const autoWaveActive = inCtaZone > 0.35 && periodicLoop > 0.22;
    const wantWave = !reduced && (interactiveWave || autoWaveActive) ? 1 : 0;

    curWaveBlend = THREE.MathUtils.lerp(curWaveBlend, wantWave * (1 - walkWeight * 0.55), Math.min(1, dt * 5.5));

    // When not waving (e.g. walking in or reduced motion), rest screen-right arm naturally downward (-1.02 rad around +Z)
    // When waving, raise screen-right arm upward ~48 deg (+0.84 rad around +Z) beside top-right curve of "D"!
    const rightDownWalkSwing = Math.sin(walkPhase) * 0.34 * walkWeight;
    const rightUpZ = THREE.MathUtils.lerp(-1.02 - idleBreath * 1.1, 0.82, curWaveBlend);
    const rightFwdY = THREE.MathUtils.lerp(-0.22, -0.18, curWaveBlend);
    const rightPitchX = THREE.MathUtils.lerp(-0.12 + rightDownWalkSwing, -0.06, curWaveBlend);

    // Bend elbow upward (~65-75 deg total) & animate smooth side-to-side wrist/forearm wave with phase follow-through
    const waveAngle = reduced ? 0 : Math.sin(elapsed * 6.0) * 0.35 * curWaveBlend;
    const handFollow = reduced ? 0 : Math.sin(elapsed * 6.0 - 0.48) * 0.38 * curWaveBlend;
    const elbowUpBendZ = THREE.MathUtils.lerp(0.15, 0.44, curWaveBlend) + waveAngle;

    applyWorldDelta(mapped.screenRightUpperArm, rightPitchX, rightFwdY, rightUpZ);
    applyWorldDelta(mapped.screenRightForearm, -0.1 * curWaveBlend, 0, elbowUpBendZ);
    applyWorldDelta(mapped.screenRightHand, 0, 0, handFollow);

    // 7. Natural Randomized Eye Blinking
    if (!reduced) {
      updateBlink(dt, elapsed);
    }

    // Grounded ContactShadow pulse
    const shScale = 1 - bounce2x * 2.2;
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
      container.removeEventListener('pointerenter', onEnter);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('click', onClick);
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
