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
  localWorldX: THREE.Vector3;
  localWorldY: THREE.Vector3;
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
  // Screen-right leg & arm (anatomical L_* in GLB, X > 0)
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
 * Purges any accidental Tripo auto-rig skin-weight bleed from the "D" frame, face, and front arrows
 * by pinning all central D-shell vertices 100% to a locked rigid root bone, leaving ONLY the actual
 * arm/hand extensions and lower legs/sneakers weighted to limb bones.
 */
function isolateDShellSkinWeights(skinnedMesh: THREE.SkinnedMesh): void {
  const geom = skinnedMesh.geometry;
  const posAttr = geom.attributes.position;
  const skinIdx = geom.attributes.skinIndex;
  const skinWgt = geom.attributes.skinWeight;
  if (!posAttr || !skinIdx || !skinWgt || !skinnedMesh.skeleton) return;

  // Find a locked central bone index in skeleton.bones (e.g. Head or Pelvis)
  const bones = skinnedMesh.skeleton.bones;
  let rigidBoneIdx = bones.findIndex((b) => /^(Head|Spine02|Pelvis|Hip)$/i.test(b.name));
  if (rigidBoneIdx < 0) rigidBoneIdx = 0;

  const smooth = (e0: number, e1: number, x: number) => {
    const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);

    // 1. Leg weight factor: 1.0 below y = 0.20, smoothly blending to 0.0 by y = 0.235 (below the "D" bottom bar)
    const legFactor = 1 - smooth(0.20, 0.235, y);

    // 2. Screen-left arm factor: x < -0.215 and 0.44 <= y <= 0.63
    const leftArmX = 1 - smooth(-0.25, -0.205, x);
    const leftArmY = smooth(0.43, 0.47, y) * (1 - smooth(0.60, 0.64, y));
    const leftArmFactor = leftArmX * leftArmY;

    // 3. Screen-right arm factor: x > +0.195 and 0.44 <= y <= 0.615 (keeps top-right arrow tip y > 0.62 100% rigid!)
    const rightArmX = smooth(0.185, 0.23, x);
    const rightArmY = smooth(0.43, 0.47, y) * (1 - smooth(0.595, 0.625, y));
    const rightArmFactor = rightArmX * rightArmY;

    const limbFactor = THREE.MathUtils.clamp(Math.max(legFactor, leftArmFactor, rightArmFactor), 0, 1);

    if (limbFactor <= 0.001) {
      // 100% rigid "D" logo body, face, or arrow vertex!
      skinIdx.setXYZW(i, rigidBoneIdx, 0, 0, 0);
      skinWgt.setXYZW(i, 1, 0, 0, 0);
    } else if (limbFactor < 0.999) {
      // Smooth socket blend at shoulder/hip seam
      const w0 = skinWgt.getX(i) * limbFactor;
      const w1 = skinWgt.getY(i) * limbFactor;
      const w2 = skinWgt.getZ(i) * limbFactor;
      const limbSum = w0 + w1 + w2;
      const rigidW = Math.max(0, 1 - limbSum);
      skinIdx.setW(i, rigidBoneIdx);
      skinWgt.setXYZW(i, w0, w1, w2, rigidW);
    }
  }

  skinIdx.needsUpdate = true;
  skinWgt.needsUpdate = true;
}

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

const CENTRAL_LOCKED_BONE_REGEX =
  /^(BoneRoot|Hip|Pelvis|Waist|Spine\d*|NeckTwist\d*|Head|FacialBone|L_Clavicle|R_Clavicle|neutral_bone)$/i;

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
  // Pulled camera slightly back & centered cleanly so the waving hand has generous top headroom
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.82, 4.18);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minPolarAngle = Math.PI * 0.36;
  controls.maxPolarAngle = Math.PI * 0.58;
  controls.target.set(0, 0.76, 0);
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

  // Lowered mascot Y by -0.15 so top of waving hand never crops near card border
  const BASE_Y_OFFSET = -0.15;

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
  contactShadow.position.set(0, BASE_Y_OFFSET + 0.002, 0);
  scene.add(contactShadow);

  // Rigid upright stage group — NEVER rotates sideways!
  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, BASE_Y_OFFSET, 0);
  stageGroup.rotation.set(0, 0, 0);
  scene.add(stageGroup);

  let mapped: MappedSkeleton | null = null;
  let mixer: THREE.AnimationMixer | null = null;
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

      // Normalize height & plant sneakers cleanly on y = 0 inside stageGroup, facing straight +Z
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const MASCOT_HEIGHT = 1.68;
      const scale = MASCOT_HEIGHT / Math.max(size.y, 0.001);
      root.scale.setScalar(scale);
      root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      root.rotation.set(0, 0, 0);
      stageGroup.add(root);
      stageGroup.updateMatrixWorld(true);

      const skel: MappedSkeleton = {
        lockedBody: [],
        thighLen: 0.23,
        calfLen: 0.24,
      };

      let rEyeBone: THREE.Bone | null = null;
      let lEyeBone: THREE.Bone | null = null;

      root.traverse((obj) => {
        if (obj instanceof THREE.SkinnedMesh) {
          isolateDShellSkinWeights(obj);
        }

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

        if (CENTRAL_LOCKED_BONE_REGEX.test(n)) {
          skel.lockedBody.push(makeBoneInfo(obj));
          return;
        }

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

      // If embedded AnimationClips exist in a future GLB, strip all central spine/hip/root tracks
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(root);
        for (const rawClip of gltf.animations) {
          const clip = rawClip.clone();
          clip.tracks = clip.tracks.filter((track) => {
            const targetNode = track.name.split('.')[0];
            return !CENTRAL_LOCKED_BONE_REGEX.test(targetNode);
          });
          mixer.clipAction(clip).play();
        }
      }

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

      // Attach curvature-matched cyan/blue eyelid meshes directly on the rigid front face
      if (blinkMorphIdx < 0 && rEyeBone && lEyeBone) {
        const lidMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x00aeef,
          emissiveIntensity: 0.2,
          roughness: 0.28,
          metalness: 0.15,
        });
        const lidGeo = new THREE.SphereGeometry(0.054, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);

        const attachEyelid = (eyeBone: THREE.Bone, surfaceOffsetZ: number) => {
          const wp = new THREE.Vector3();
          eyeBone.getWorldPosition(wp);
          stageGroup.worldToLocal(wp);
          const pivot = new THREE.Group();
          pivot.position.set(wp.x, wp.y + 0.03, wp.z + surfaceOffsetZ * scale);
          const mesh = new THREE.Mesh(lidGeo, lidMat);
          mesh.position.set(0, -0.03, 0);
          mesh.scale.set(1.05, 1.0, 0.42);
          pivot.add(mesh);
          pivot.scale.set(1, 0.01, 1);
          pivot.visible = false;
          stageGroup.add(pivot);
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

  // Scroll progress & velocity binding (never rotates body sideways)
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
      scrollVelocity = THREE.MathUtils.clamp(Math.abs(self.getVelocity()) / 900, 0, 2.0);
    },
  });

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

  // Periodic natural eye blinking every 2.5–4.5s
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
  let curWaveBlend = 1.0;

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

    if (mixer) {
      mixer.update(dt);
    }

    // 1. FORCIBLY FREEZE ALL CENTRAL BODY / SPINE / HIP / ROOT BONES TO EXACT BIND POSE EVERY FRAME!
    // And keep stageGroup 100% upright & facing straight forward (0, 0, 0) — ZERO logo twisting!
    stageGroup.rotation.set(0, 0, 0);
    stageGroup.position.set(0, BASE_Y_OFFSET, 0);
    for (const locked of mapped.lockedBody) {
      locked.bone.quaternion.copy(locked.restQuat);
      locked.bone.position.copy(locked.restPos);
    }

    // 2. Smoothly bind subtle in-place leg step & wave speed to scroll progress/velocity
    scrollVelocity = THREE.MathUtils.lerp(scrollVelocity, 0, Math.min(1, dt * 5.5));
    dampedVelocity = THREE.MathUtils.lerp(dampedVelocity, scrollVelocity, Math.min(1, dt * 6.5));

    const entryStep = 1 - THREE.MathUtils.smoothstep(scrollProgress, 0.30, 0.46);
    const stepIntensity = reduced ? 0 : THREE.MathUtils.clamp(dampedVelocity * 0.9 + entryStep * 0.45, 0, 1);
    walkPhase += dt * (2.6 + stepIntensity * 4.2) * (0.22 + stepIntensity * 0.78);

    // Subtle in-place Two-Bone IK leg/sneaker step cycle (hips remain 100% frozen!)
    const activeLegWeight = reduced ? 0 : THREE.MathUtils.clamp(0.18 + stepIntensity * 0.82, 0, 1);
    const strideLen = (mapped.thighLen + mapped.calfLen) * 0.24 * activeLegWeight;
    const stepLift = (mapped.thighLen + mapped.calfLen) * 0.14 * activeLegWeight;
    const baseFootY = -(mapped.thighLen + mapped.calfLen) * 0.97;

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
    curLHip = THREE.MathUtils.lerp(curLHip, lIK.hipAngle * activeLegWeight, legDamp);
    curLKnee = THREE.MathUtils.lerp(curLKnee, lIK.kneeAngle * activeLegWeight, legDamp);
    curRHip = THREE.MathUtils.lerp(curRHip, rIK.hipAngle * activeLegWeight, legDamp);
    curRKnee = THREE.MathUtils.lerp(curRKnee, rIK.kneeAngle * activeLegWeight, legDamp);

    applyWorldDelta(mapped.screenLeftThigh, curLHip, 0, 0);
    applyWorldDelta(mapped.screenLeftCalf, curLKnee, 0, 0);
    applyWorldDelta(mapped.screenLeftFoot, -(curLHip + curLKnee) * 0.5, 0, 0);

    applyWorldDelta(mapped.screenRightThigh, curRHip, 0, 0);
    applyWorldDelta(mapped.screenRightCalf, curRKnee, 0, 0);
    applyWorldDelta(mapped.screenRightFoot, -(curRHip + curRKnee) * 0.5, 0, 0);

    // 3. SCREEN-LEFT ARM: Relaxed naturally downward at its side without clipping the blue arrows
    const subtleLeftSwing = reduced ? 0 : Math.sin(walkPhase + Math.PI) * 0.16 * activeLegWeight;
    applyWorldDelta(mapped.screenLeftUpperArm, -0.1 + subtleLeftSwing, 0.24, 1.02);
    applyWorldDelta(mapped.screenLeftForearm, -0.18, 0.14, -0.1);
    applyWorldDelta(mapped.screenLeftHand, 0, 0, -0.06);

    // 4. SCREEN-RIGHT ARM: Raised cleanly at top-right waving side-to-side (with generous headroom)
    const boostWave = isHoveringCard || elapsed < clickWaveUntil ? 1.25 : 1.0;
    const waveSpeed = 5.4 + dampedVelocity * 1.4;
    const targetWave = reduced ? 0 : 1;
    curWaveBlend = THREE.MathUtils.lerp(curWaveBlend, targetWave, Math.min(1, dt * 6));

    const waveAngle = reduced ? 0 : Math.sin(elapsed * waveSpeed) * 0.30 * boostWave * curWaveBlend;
    const handFollow = reduced ? 0 : Math.sin(elapsed * waveSpeed - 0.46) * 0.34 * boostWave * curWaveBlend;

    // Moderate ~36 deg raise (+0.62 rad) so hand waves cleanly beside top-right of "D" with plenty of headroom
    const rightUpZ = THREE.MathUtils.lerp(-0.98, 0.62, curWaveBlend);
    const elbowBendZ = THREE.MathUtils.lerp(0.12, 0.38, curWaveBlend) + waveAngle;

    applyWorldDelta(mapped.screenRightUpperArm, -0.05, -0.14, rightUpZ);
    applyWorldDelta(mapped.screenRightForearm, -0.08 * curWaveBlend, 0, elbowBendZ);
    applyWorldDelta(mapped.screenRightHand, 0, 0, handFollow);

    // 5. Periodic Eye Blinking every 2.5–4.5s
    if (!reduced) {
      updateBlink(dt, elapsed);
    }

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
