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
  /** Local axis in this bone's space that corresponds to world +X (pitch forward/back) */
  localPitchAxis: THREE.Vector3;
  /** Local axis in this bone's space that corresponds to world +Z (lateral abduction / wave) */
  localRollAxis: THREE.Vector3;
  /** Local axis in this bone's space that corresponds to world +Y (yaw) */
  localYawAxis: THREE.Vector3;
}

interface MappedSkeleton {
  lockedBody: RigBoneInfo[];
  leftThigh?: RigBoneInfo;
  leftCalf?: RigBoneInfo;
  leftFoot?: RigBoneInfo;
  rightThigh?: RigBoneInfo;
  rightCalf?: RigBoneInfo;
  rightFoot?: RigBoneInfo;
  leftUpperArm?: RigBoneInfo;
  leftForearm?: RigBoneInfo;
  leftHand?: RigBoneInfo;
  rightUpperArm?: RigBoneInfo;
  rightForearm?: RigBoneInfo;
  rightHand?: RigBoneInfo;
  leftEye?: THREE.Bone;
  rightEye?: THREE.Bone;
  head?: THREE.Bone;
  thighLen: number;
  calfLen: number;
}

const WORLD_X = new THREE.Vector3(1, 0, 0);
const WORLD_Y = new THREE.Vector3(0, 1, 0);
const WORLD_Z = new THREE.Vector3(0, 0, 1);

const _tmpQ1 = new THREE.Quaternion();
const _tmpQ2 = new THREE.Quaternion();
const _tmpQ3 = new THREE.Quaternion();

function makeBoneInfo(bone: THREE.Bone): RigBoneInfo {
  bone.updateWorldMatrix(true, false);
  const worldQuat = new THREE.Quaternion();
  bone.getWorldQuaternion(worldQuat);
  const invWorldQuat = worldQuat.clone().invert();

  return {
    bone,
    restQuat: bone.quaternion.clone(),
    restPos: bone.position.clone(),
    localPitchAxis: WORLD_X.clone().applyQuaternion(invWorldQuat).normalize(),
    localYawAxis: WORLD_Y.clone().applyQuaternion(invWorldQuat).normalize(),
    localRollAxis: WORLD_Z.clone().applyQuaternion(invWorldQuat).normalize(),
  };
}

/**
 * Applies world-aligned pitch/roll/yaw deltas cleanly on top of a bone's exact bind pose,
 * regardless of the bone's internal Tripo/Mixamo roll orientation.
 */
function applyBoneAngles(info: RigBoneInfo | undefined, pitch: number, roll = 0, yaw = 0): void {
  if (!info) return;
  info.bone.quaternion.copy(info.restQuat);
  if (Math.abs(pitch) > 1e-4) {
    _tmpQ1.setFromAxisAngle(info.localPitchAxis, pitch);
    info.bone.quaternion.multiply(_tmpQ1);
  }
  if (Math.abs(roll) > 1e-4) {
    _tmpQ2.setFromAxisAngle(info.localRollAxis, roll);
    info.bone.quaternion.multiply(_tmpQ2);
  }
  if (Math.abs(yaw) > 1e-4) {
    _tmpQ3.setFromAxisAngle(info.localYawAxis, yaw);
    info.bone.quaternion.multiply(_tmpQ3);
  }
}

/**
 * Analytical Two-Bone IK Solver (Law of Cosines in the sagittal step plane)
 * with forward knee pole alignment so sneakers lift, swing, and plant without sliding.
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
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
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
  renderer.toneMappingExposure = 1.18;
  renderer.domElement.className = 'contact-logo-3d-canvas';
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D DEPLOY Mascot');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 1.02, 3.6);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minPolarAngle = Math.PI * 0.34;
  controls.maxPolarAngle = Math.PI * 0.6;
  controls.target.set(0, 0.9, 0);
  controls.update();

  // Studio environment + Electric Cyan #06B6D4 rim light + warm-white key light
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const keyLight = new THREE.DirectionalLight(0xfff9f0, 2.25);
  keyLight.position.set(3.2, 5.2, 4.6);
  scene.add(keyLight);

  const cyanRim = new THREE.DirectionalLight(0x06b6d4, 2.9);
  cyanRim.position.set(-4.2, 2.6, -3.0);
  scene.add(cyanRim);

  const backRim = new THREE.DirectionalLight(0x00aeef, 1.6);
  backRim.position.set(3.2, 2.0, -3.5);
  scene.add(backRim);

  const ambient = new THREE.AmbientLight(0xdbeafe, 0.42);
  scene.add(ambient);

  // Soft ContactShadow plane directly beneath the sneakers
  const shadowTex = createContactShadowTexture();
  const shadowGeo = new THREE.PlaneGeometry(1.55, 1.55);
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

  // Root trajectory group + inner rigid-body tilt/bounce group
  const stageGroup = new THREE.Group();
  const bodyMotionGroup = new THREE.Group();
  stageGroup.add(bodyMotionGroup);
  scene.add(stageGroup);

  let mapped: MappedSkeleton | null = null;
  let eyelidLeft: THREE.Mesh | null = null;
  let eyelidRight: THREE.Mesh | null = null;
  let blinkMorphMesh: THREE.Mesh | null = null;
  let blinkMorphIdx = -1;
  let loaded = false;

  const loader = new GLTFLoader();
  loader.load(
    encodeURI(glbUrl),
    (gltf) => {
      const root = gltf.scene;

      // Normalize height to 1.76 world units and plant sneakers cleanly on y = 0
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const MASCOT_HEIGHT = 1.76;
      const scale = MASCOT_HEIGHT / Math.max(size.y, 0.001);
      root.scale.setScalar(scale);
      root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      bodyMotionGroup.add(root);
      root.updateMatrixWorld(true);

      // Traverse skeleton: lock central "D" body shell bones, map leg & arm chains
      const skel: MappedSkeleton = {
        lockedBody: [],
        thighLen: 0.105,
        calfLen: 0.11,
      };

      const LOCKED_PATTERN = /^(BoneRoot|Hip|Pelvis|Waist|Spine\d*|NeckTwist\d*|Head|FacialBone|neutral_bone)$/i;

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
          if (/^Head$/i.test(n)) skel.head = obj;
          return;
        }

        if (/^L_Eye$/i.test(n)) skel.leftEye = obj;
        else if (/^R_Eye$/i.test(n)) skel.rightEye = obj;
        else if (/^L_Thigh$/i.test(n)) skel.leftThigh = makeBoneInfo(obj);
        else if (/^L_Calf$/i.test(n)) skel.leftCalf = makeBoneInfo(obj);
        else if (/^L_Foot$/i.test(n)) skel.leftFoot = makeBoneInfo(obj);
        else if (/^R_Thigh$/i.test(n)) skel.rightThigh = makeBoneInfo(obj);
        else if (/^R_Calf$/i.test(n)) skel.rightCalf = makeBoneInfo(obj);
        else if (/^R_Foot$/i.test(n)) skel.rightFoot = makeBoneInfo(obj);
        else if (/^L_Upperarm$/i.test(n)) skel.leftUpperArm = makeBoneInfo(obj);
        else if (/^L_Forearm$/i.test(n)) skel.leftForearm = makeBoneInfo(obj);
        else if (/^L_Hand$/i.test(n)) skel.leftHand = makeBoneInfo(obj);
        else if (/^R_Upperarm$/i.test(n)) skel.rightUpperArm = makeBoneInfo(obj);
        else if (/^R_Forearm$/i.test(n)) skel.rightForearm = makeBoneInfo(obj);
        else if (/^R_Hand$/i.test(n)) skel.rightHand = makeBoneInfo(obj);
      });

      // Measure real thigh & calf segment lengths in model space for exact Two-Bone IK
      if (skel.leftThigh && skel.leftCalf && skel.leftFoot) {
        const pThigh = new THREE.Vector3();
        const pCalf = new THREE.Vector3();
        const pFoot = new THREE.Vector3();
        skel.leftThigh.bone.getWorldPosition(pThigh);
        skel.leftCalf.bone.getWorldPosition(pCalf);
        skel.leftFoot.bone.getWorldPosition(pFoot);
        skel.thighLen = Math.max(0.05, pThigh.distanceTo(pCalf));
        skel.calfLen = Math.max(0.05, pCalf.distanceTo(pFoot));
      }

      // Attach curvature-matched glossy cyan eyelid meshes (#06B6D4 / #00AEEF) directly on L_Eye / R_Eye
      if (blinkMorphIdx < 0 && skel.leftEye && skel.rightEye) {
        const lidGeo = new THREE.SphereGeometry(0.036, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52);
        const lidMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x00aeef,
          emissiveIntensity: 0.22,
          roughness: 0.26,
          metalness: 0.18,
        });

        eyelidLeft = new THREE.Mesh(lidGeo, lidMat);
        eyelidLeft.position.set(0, 0, 0.045);
        eyelidLeft.scale.set(1.1, 0.04, 0.65);
        eyelidLeft.visible = false;
        skel.leftEye.add(eyelidLeft);

        eyelidRight = new THREE.Mesh(lidGeo, lidMat);
        eyelidRight.position.set(0, 0, 0.045);
        eyelidRight.scale.set(1.1, 0.04, 0.65);
        eyelidRight.visible = false;
        skel.rightEye.add(eyelidRight);
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

  // Cursor look-at tracking
  const pointerNdc = { x: -0.25, y: 0.05 };
  let smoothLookYaw = -0.15;
  let smoothLookPitch = 0;

  const onPointerMove = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    pointerNdc.x = THREE.MathUtils.clamp((e.clientX - cx) / (window.innerWidth * 0.45), -1, 1);
    pointerNdc.y = THREE.MathUtils.clamp((e.clientY - cy) / (window.innerHeight * 0.45), -1, 1);
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // Randomized natural eye blink timer (2.5s–5.0s, 70ms fast close, 110ms ease-out open + double-blinks)
  let nextBlinkAt = 2.6;
  let blinkPhase = 0;
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
        eyelidLeft.scale.set(1.1, sy, 0.65);
        eyelidRight.scale.set(1.1, sy, 0.65);
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
  let curLArmPitch = 0;
  let curLForePitch = 0;
  let curRArmPitch = 0;
  let curRArmRoll = 0;
  let curRForeRoll = 0;
  let curRHandRoll = 0;

  const clock = new THREE.Clock();

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

    // 1. Lock all Central "D" Body Shell bones to exact bind pose so D-frame, face & arrows NEVER deform
    for (const locked of mapped.lockedBody) {
      locked.bone.quaternion.copy(locked.restQuat);
      locked.bone.position.copy(locked.restPos);
    }

    // 2. Smoothly damp scroll velocity back to 0 when scrolling pauses (never freezes mid-step)
    scrollVelocity = THREE.MathUtils.lerp(scrollVelocity, 0, Math.min(1, dt * 5.5));
    dampedVelocity = THREE.MathUtils.lerp(dampedVelocity, scrollVelocity, Math.min(1, dt * 6.5));

    const walkZone = 1 - THREE.MathUtils.smoothstep(scrollProgress, 0.34, 0.48);
    const waveZone = THREE.MathUtils.smoothstep(scrollProgress, 0.38, 0.56);

    const activeWalkSpeed = reduced ? 0 : Math.min(1.4, dampedVelocity * 1.15 + walkZone * 0.45);
    const walkWeight = reduced ? 0 : THREE.MathUtils.clamp(activeWalkSpeed * 1.1, 0, 1);

    walkPhase += dt * (2.8 + activeWalkSpeed * 5.2) * walkWeight;

    // 3. Trajectory: walks across dark stage & turns toward "Start your project ->" on the left
    const walkInX = reduced ? 0 : THREE.MathUtils.lerp(0.52, 0.0, THREE.MathUtils.smoothstep(scrollProgress, 0.08, 0.46));
    const walkInZ = reduced ? 0 : THREE.MathUtils.lerp(-0.42, 0.0, THREE.MathUtils.smoothstep(scrollProgress, 0.08, 0.46));
    const targetFacingY = reduced ? -0.32 : THREE.MathUtils.lerp(-0.16, -0.42, waveZone);

    stageGroup.position.x = THREE.MathUtils.lerp(stageGroup.position.x, walkInX, Math.min(1, dt * 6));
    stageGroup.position.z = THREE.MathUtils.lerp(stageGroup.position.z, walkInZ, Math.min(1, dt * 6));
    stageGroup.rotation.y = THREE.MathUtils.lerp(stageGroup.rotation.y, targetFacingY, Math.min(1, dt * 5));

    contactShadow.position.x = stageGroup.position.x;
    contactShadow.position.z = stageGroup.position.z;

    // 4. Body Physics on the Rigid "D" Shell (2x step vertical bounce, gentle counter-sway, breathing & cursor look-at)
    const idleBreath = reduced ? 0 : Math.sin(elapsed * 2.1) * 0.015;
    const idleSway = reduced ? 0 : Math.sin(elapsed * 1.05) * 0.025;
    const bounce2x = Math.abs(Math.sin(walkPhase)) * 0.045 * walkWeight;
    const swayZ = Math.sin(walkPhase) * 0.055 * walkWeight + idleSway * (1 - walkWeight);
    const counterYaw = -Math.sin(walkPhase) * 0.075 * walkWeight;

    const targetLookYaw = THREE.MathUtils.clamp(pointerNdc.x * 0.24, -0.28, 0.28);
    const targetLookPitch = THREE.MathUtils.clamp(pointerNdc.y * 0.14, -0.15, 0.16);
    smoothLookYaw = THREE.MathUtils.lerp(smoothLookYaw, targetLookYaw, Math.min(1, dt * 5));
    smoothLookPitch = THREE.MathUtils.lerp(smoothLookPitch, targetLookPitch, Math.min(1, dt * 5));

    bodyMotionGroup.position.y = bounce2x + idleBreath;
    bodyMotionGroup.rotation.z = swayZ - smoothLookYaw * 0.15;
    bodyMotionGroup.rotation.y = counterYaw + smoothLookYaw;
    bodyMotionGroup.rotation.x = smoothLookPitch + idleBreath * 0.6;

    // 5. Human-Like Two-Bone IK Leg Walk Cycle (world-axis aligned relative to bind pose)
    const strideLen = (mapped.thighLen + mapped.calfLen) * 0.36 * walkWeight;
    const stepLift = (mapped.thighLen + mapped.calfLen) * 0.18 * walkWeight;
    const baseFootY = -(mapped.thighLen + mapped.calfLen) * 0.96;

    const lSin = Math.sin(walkPhase);
    const lCos = Math.cos(walkPhase);
    const rSin = Math.sin(walkPhase + Math.PI);
    const rCos = Math.cos(walkPhase + Math.PI);

    const leftIK = solveTwoBoneLegIK(mapped.thighLen, mapped.calfLen, lSin * strideLen, baseFootY + Math.max(0, lCos) * stepLift);
    const rightIK = solveTwoBoneLegIK(mapped.thighLen, mapped.calfLen, rSin * strideLen, baseFootY + Math.max(0, rCos) * stepLift);

    const dampK = Math.min(1, dt * 12);
    curLHip = THREE.MathUtils.lerp(curLHip, leftIK.hipAngle * walkWeight, dampK);
    curLKnee = THREE.MathUtils.lerp(curLKnee, leftIK.kneeAngle * walkWeight, dampK);
    curRHip = THREE.MathUtils.lerp(curRHip, rightIK.hipAngle * walkWeight, dampK);
    curRKnee = THREE.MathUtils.lerp(curRKnee, rightIK.kneeAngle * walkWeight, dampK);

    applyBoneAngles(mapped.leftThigh, curLHip, 0, 0);
    applyBoneAngles(mapped.leftCalf, curLKnee, 0, 0);
    applyBoneAngles(mapped.leftFoot, -(curLHip + curLKnee) * 0.5, 0, 0);

    applyBoneAngles(mapped.rightThigh, curRHip, 0, 0);
    applyBoneAngles(mapped.rightCalf, curRKnee, 0, 0);
    applyBoneAngles(mapped.rightFoot, -(curRHip + curRKnee) * 0.5, 0, 0);

    // 6. Opposite-Phase Arm Swing + Delayed Forearm Follow-Through + CTA Wave Gesture
    const leftSwing = Math.sin(walkPhase + Math.PI) * 0.48 * walkWeight;
    const rightSwing = Math.sin(walkPhase) * 0.48 * walkWeight;
    const waveBlend = waveZone * (1 - walkWeight * 0.72);
    const waveOsc = reduced ? 0 : Math.sin(elapsed * 5.2) * 0.24;

    curLArmPitch = THREE.MathUtils.lerp(curLArmPitch, leftSwing, Math.min(1, dt * 10));
    curLForePitch = THREE.MathUtils.lerp(
      curLForePitch,
      -0.16 - Math.max(0, Math.sin(walkPhase + Math.PI - 0.55)) * 0.34 * walkWeight,
      Math.min(1, dt * 10)
    );

    curRArmPitch = THREE.MathUtils.lerp(curRArmPitch, THREE.MathUtils.lerp(rightSwing, -0.35, waveBlend), Math.min(1, dt * 8));
    curRArmRoll = THREE.MathUtils.lerp(curRArmRoll, THREE.MathUtils.lerp(0, 0.85, waveBlend), Math.min(1, dt * 6));
    curRForeRoll = THREE.MathUtils.lerp(curRForeRoll, THREE.MathUtils.lerp(0, 0.35 + waveOsc, waveBlend), Math.min(1, dt * 8));
    curRHandRoll = THREE.MathUtils.lerp(curRHandRoll, THREE.MathUtils.lerp(0, waveOsc * 0.75, waveBlend), Math.min(1, dt * 10));

    applyBoneAngles(mapped.leftUpperArm, curLArmPitch, idleBreath * 1.4, 0);
    applyBoneAngles(mapped.leftForearm, curLForePitch, 0, 0);

    applyBoneAngles(mapped.rightUpperArm, curRArmPitch, curRArmRoll, 0);
    applyBoneAngles(mapped.rightForearm, -0.18 * waveBlend, curRForeRoll, 0);
    applyBoneAngles(mapped.rightHand, 0, curRHandRoll, 0);

    // 7. Natural Eye Blinking
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
