/**
 * Speeding Text Engine (inspired by React Bits Pro Speeding Text)
 * Numbers and short tokens that transition, count, or roll with true anisotropic
 * directional SVG motion blur (horizontal or vertical), velocity skew/stretch,
 * and physics spring settle — dropping back to 0 GPU filter cost at rest and
 * respecting `prefers-reduced-motion`.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

let defsInjected = false;

export function ensureSpeedBlurDefs(): void {
  if (defsInjected || typeof document === 'undefined') return;
  if (document.getElementById('deploy-speed-blur-defs')) {
    defsInjected = true;
    return;
  }
  defsInjected = true;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('id', 'deploy-speed-blur-defs');
  svg.setAttribute('class', 'speed-blur-defs');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const xLevels = [2.4, 5.5, 10.5, 17, 25];
  const yLevels = [1.8, 4.2, 8.2, 13.5, 20];

  const filtersMarkup = [
    ...xLevels.map(
      (sd, i) => `
      <filter id="spd-blur-x-${i + 1}" x="-40%" y="-25%" width="180%" height="150%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="${sd} 0" />
      </filter>`
    ),
    ...yLevels.map(
      (sd, i) => `
      <filter id="spd-blur-y-${i + 1}" x="-25%" y="-45%" width="150%" height="190%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0 ${sd}" />
      </filter>`
    ),
  ].join('');

  svg.innerHTML = `<defs>${filtersMarkup}</defs>`;
  document.body.appendChild(svg);
}

/**
 * Renders a numeric/metric string (e.g. "99.9%", "3×", "4×", "14d") into
 * velocity-blurred Speeding Text digit columns + static punctuation/units.
 * Each digit track contains 3 full revolutions (0..9 x 3) so single digits
 * spin through a full high-speed blurred cycle and hover bursts can spin +10
 * steps back to the exact same digit seamlessly.
 */
export function renderSpeedingOdometerHTML(valueStr: string): string {
  const chars = Array.from(valueStr);
  const totalNumericDigits = chars.filter((c) => c >= '0' && c <= '9').length;
  let digitIdx = 0;

  const repeatDigits = '012345678901234567890123456789'
    .split('')
    .map((d) => `<span class="spd-odo-digit">${d}</span>`)
    .join('');

  const inner = chars
    .map((ch) => {
      if (ch >= '0' && ch <= '9') {
        const rawTarget = Number(ch);
        const idx = digitIdx++;
        // Give single-digit stats ("3×", "4×") or trailing digits a full revolution + target
        // so every number builds real high-velocity motion blur before settling.
        let travelSteps = rawTarget;
        if (totalNumericDigits === 1) {
          travelSteps = 10 + rawTarget;
        } else if (idx > 0 && rawTarget < 6) {
          travelSteps = 10 + rawTarget;
        }
        return `<span class="spd-odo-col" aria-hidden="true"><span class="spd-odo-track" data-target-steps="${travelSteps}" data-digit-pos="${idx}" data-prev-val="0">${repeatDigits}</span></span>`;
      }
      return `<span class="spd-odo-static" aria-hidden="true">${ch}</span>`;
    })
    .join('');

  return `<span class="spd-odo-wrap" data-speed-odo aria-label="${valueStr}">${inner}</span>`;
}

function speedToTier(digitsPerSec: number): number {
  if (digitsPerSec < 0.45) return 0;
  if (digitsPerSec < 2.2) return 1;
  if (digitsPerSec < 5.5) return 2;
  if (digitsPerSec < 11) return 3;
  if (digitsPerSec < 19) return 4;
  return 5;
}

export function updateSpeedingOdometer(
  container: Element,
  progress: number,
  dt: number,
  reduced: boolean
): void {
  const tracks = container.querySelectorAll<HTMLElement>('.spd-odo-track');
  const p = reduced ? 1 : clamp01(progress);
  const safeDt = Math.max(0.004, Math.min(0.1, dt));

  tracks.forEach((track) => {
    if (track.dataset.hoverSpinning === '1') return;

    const targetSteps = Number(track.dataset.targetSteps || '0');
    const pos = Number(track.dataset.digitPos || '0');
    const stagger = pos * 0.065;
    const localP = reduced ? 1 : clamp01((p - stagger) / Math.max(0.28, 1 - stagger));
    // Fast initial launch, crisp quintic settle
    const eased = 1 - Math.pow(1 - localP, 3.4);
    const currentVal = targetSteps * eased;

    const prevVal = Number(track.dataset.prevVal || '0');
    track.dataset.prevVal = currentVal.toFixed(4);

    const speed = reduced ? 0 : Math.abs(currentVal - prevVal) / safeDt;
    const tier = speedToTier(speed);
    const stretch = Math.min(1, speed / 22);

    if (tier > 0) {
      track.dataset.blurY = String(tier);
      track.classList.add('is-streaking');
      const sy = 1 + stretch * 0.18;
      const sx = 1 - stretch * 0.05;
      track.style.transform = `translate3d(0, -${currentVal.toFixed(4)}em, 0) scale3d(${sx.toFixed(3)}, ${sy.toFixed(3)}, 1)`;
    } else {
      delete track.dataset.blurY;
      track.classList.remove('is-streaking');
      track.style.transform = `translate3d(0, -${currentVal.toFixed(4)}em, 0)`;
    }
  });

  // Also streak static unit suffixes (%, ×, d) subtly as progress completes
  const statics = container.querySelectorAll<HTMLElement>('.spd-odo-static');
  statics.forEach((st) => {
    if (reduced || p >= 0.96 || p <= 0.02) {
      delete st.dataset.blurX;
      st.style.transform = '';
      st.style.opacity = reduced || p >= 0.15 ? '1' : '0.35';
    } else {
      const unitP = clamp01((p - 0.18) / 0.62);
      const easeU = 1 - Math.pow(1 - unitP, 3);
      const dx = (1 - easeU) * 12;
      st.style.opacity = (0.35 + 0.65 * easeU).toFixed(3);
      st.style.transform = `translate3d(${dx.toFixed(1)}px, 0, 0) skewX(${(-(1 - easeU) * 10).toFixed(1)}deg)`;
      if (unitP > 0.02 && unitP < 0.78) {
        st.dataset.blurX = unitP < 0.4 ? '2' : '1';
      } else {
        delete st.dataset.blurX;
      }
    }
  });
}

/**
 * Attaches an interactive hover speed-blur revolution to `[data-speed-odo]` elements
 * so hovering a platform metric whips its digits through a high-speed +10 revolution
 * with directional motion blur before snapping back onto the exact target value.
 */
export function bindSpeedingOdometerHover(root: ParentNode = document): void {
  const wraps = root.querySelectorAll<HTMLElement>('[data-speed-odo]');
  wraps.forEach((wrap) => {
    if (wrap.dataset.hoverBound === '1') return;
    wrap.dataset.hoverBound = '1';

    wrap.addEventListener('pointerenter', () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const tracks = Array.from(wrap.querySelectorAll<HTMLElement>('.spd-odo-track'));
      tracks.forEach((track, idx) => {
        if (track.dataset.hoverSpinning === '1') return;
        const baseSteps = Number(track.dataset.targetSteps || '0');
        // Ensure we only trigger once the counter has settled near its target
        const curVal = Number(track.dataset.prevVal || '0');
        if (Math.abs(curVal - baseSteps) > 0.4) return;

        track.dataset.hoverSpinning = '1';
        const startVal = baseSteps % 10;
        const endVal = startVal + 10;
        const duration = 460 + idx * 55;
        const t0 = performance.now();

        const step = (now: number) => {
          const elapsed = now - t0;
          const t = clamp01(elapsed / duration);
          // EaseInOutCubic with sharp velocity peak at t=0.5
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          // Derivative of eased gives instantaneous velocity bell curve (0 -> 3 -> 0)
          const deriv = t < 0.5 ? 12 * t * t : 12 * (1 - t) * (1 - t);
          const v = startVal + 10 * eased;
          const speed = (10 * deriv) / (duration / 1000);
          const tier = speedToTier(speed);
          const stretch = Math.min(1, speed / 26);

          if (tier > 0 && t < 0.96) {
            track.dataset.blurY = String(tier);
            track.classList.add('is-streaking');
            track.style.transform = `translate3d(0, -${v.toFixed(4)}em, 0) scale3d(${(1 - stretch * 0.05).toFixed(3)}, ${(1 + stretch * 0.18).toFixed(3)}, 1)`;
          } else {
            delete track.dataset.blurY;
            track.classList.remove('is-streaking');
            track.style.transform = `translate3d(0, -${v.toFixed(4)}em, 0)`;
          }

          if (t < 1) {
            window.requestAnimationFrame(step);
          } else {
            delete track.dataset.blurY;
            track.classList.remove('is-streaking');
            track.dataset.hoverSpinning = '0';
            track.dataset.prevVal = baseSteps.toFixed(4);
            track.style.transform = `translate3d(0, -${baseSteps.toFixed(4)}em, 0)`;
          }
        };

        window.requestAnimationFrame(step);
      });
    });
  });
}

export interface SpeedMorphOptions {
  axis?: 'x' | 'y';
  direction?: 1 | -1;
  durationMs?: number;
  delayMs?: number;
}

const morphStateMap = new WeakMap<
  HTMLElement,
  {
    lastTime: number;
    currentText: string;
    settleTimer: number;
    cleanupTimer: number;
  }
>();

/**
 * Transitions any number, metric, or short label into `nextText` with a directional
 * speed-blur whip. Automatically switches between:
 * - Twin-layer directional whip + physics spring settle (for discrete switches like tabs/steps)
 * - Continuous 60fps velocity-blurred stream (for rapid scroll countdowns like 47 -> 1)
 */
export function morphSpeedingText(
  el: HTMLElement | null,
  nextText: string,
  opts: SpeedMorphOptions = {}
): void {
  if (!el) return;
  ensureSpeedBlurDefs();

  let state = morphStateMap.get(el);
  if (!state) {
    state = {
      lastTime: 0,
      currentText: (el.dataset.spdValue ?? el.textContent ?? '').trim(),
      settleTimer: 0,
      cleanupTimer: 0,
    };
    morphStateMap.set(el, state);
  }

  if (state.currentText === nextText) return;
  const prevText = state.currentText;
  state.currentText = nextText;
  el.dataset.spdValue = nextText;

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    window.clearTimeout(state.settleTimer);
    window.clearTimeout(state.cleanupTimer);
    delete el.dataset.blurX;
    delete el.dataset.blurY;
    el.classList.remove('spd-is-streaming');
    el.textContent = nextText;
    return;
  }

  const now = performance.now();
  const deltaMs = now - state.lastTime;
  state.lastTime = now;

  const axis = opts.axis ?? 'x';
  const dir = opts.direction ?? 1;
  const durationMs = opts.durationMs ?? 380;
  const delayMs = opts.delayMs ?? 0;

  window.clearTimeout(state.settleTimer);
  window.clearTimeout(state.cleanupTimer);

  // High-frequency rapid ticking (e.g. scroll-scrubbed countdown 47 -> 46 -> ... -> 1):
  // keep a single ultra-fast node with live directional motion blur + velocity stretch!
  if (deltaMs < 95 && delayMs === 0) {
    el.classList.add('spd-is-streaming');
    el.textContent = nextText;
    if (axis === 'y') {
      el.dataset.blurY = deltaMs < 35 ? '4' : '3';
      delete el.dataset.blurX;
      el.style.transform = `translate3d(0, ${(dir * -6).toFixed(1)}%, 0) scaleY(1.14)`;
    } else {
      el.dataset.blurX = deltaMs < 35 ? '4' : '3';
      delete el.dataset.blurY;
      el.style.transform = `translate3d(${(dir * -5).toFixed(1)}%, 0, 0) skewX(${(dir * -12).toFixed(1)}deg) scaleX(1.1)`;
    }

    state.settleTimer = window.setTimeout(() => {
      if (axis === 'y') el.dataset.blurY = '1';
      else el.dataset.blurX = '1';
      el.style.transform = 'translate3d(0, 0, 0) scale(1)';

      state!.cleanupTimer = window.setTimeout(() => {
        delete el.dataset.blurX;
        delete el.dataset.blurY;
        el.style.transform = '';
        el.classList.remove('spd-is-streaming');
      }, 95);
    }, 85);
    return;
  }

  // Discrete transition: twin-layer outgoing speed-whip + incoming blurred spring arrival
  el.classList.remove('spd-is-streaming');
  delete el.dataset.blurX;
  delete el.dataset.blurY;
  el.style.transform = '';

  const runSwap = () => {
    // Ensure we still match the latest target text
    if (state!.currentText !== nextText) return;

    el.setAttribute('aria-label', nextText);
    el.innerHTML = '';

    const stage = document.createElement('span');
    stage.className = `spd-swap-stage is-axis-${axis}`;
    stage.setAttribute('aria-hidden', 'true');
    stage.style.setProperty('--spd-dur', `${durationMs}ms`);
    stage.style.setProperty('--spd-dir', String(dir));

    const outSpan = document.createElement('span');
    outSpan.className = 'spd-swap-out';
    outSpan.textContent = prevText;

    const inSpan = document.createElement('span');
    inSpan.className = 'spd-swap-in is-entering';
    inSpan.textContent = nextText;

    if (axis === 'x') {
      outSpan.dataset.blurX = '4';
      inSpan.dataset.blurX = '5';
    } else {
      outSpan.dataset.blurY = '4';
      inSpan.dataset.blurY = '5';
    }

    stage.append(outSpan, inSpan);
    el.appendChild(stage);

    // Force style calculation on initial blurred entry state, then release into physics spring
    void inSpan.offsetWidth;
    outSpan.classList.add('is-exiting');
    inSpan.classList.remove('is-entering');

    // Step down directional blur smoothly as velocity decays to zero
    state!.settleTimer = window.setTimeout(() => {
      if (axis === 'x') {
        inSpan.dataset.blurX = '2';
      } else {
        inSpan.dataset.blurY = '2';
      }
    }, Math.round(durationMs * 0.34));

    state!.cleanupTimer = window.setTimeout(() => {
      if (state!.currentText === nextText) {
        el.removeAttribute('aria-label');
        el.textContent = nextText;
      }
    }, durationMs + 40);
  };

  if (delayMs > 0) {
    state.settleTimer = window.setTimeout(runSwap, delayMs);
  } else {
    runSwap();
  }
}

/**
 * Streaks an element's existing number/text in from high horizontal or vertical
 * velocity with directional speed blur (ideal for section/card/modal entrances).
 */
export function streakRevealElement(
  el: HTMLElement | null,
  opts: { axis?: 'x' | 'y'; delayMs?: number; durationMs?: number } = {}
): void {
  if (!el) return;
  ensureSpeedBlurDefs();

  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const axis = opts.axis ?? 'x';
  const delayMs = opts.delayMs ?? 0;
  const durationMs = opts.durationMs ?? 420;

  el.style.setProperty('--spd-dur', `${durationMs}ms`);
  el.classList.remove('spd-streak-active');
  el.classList.add(axis === 'x' ? 'spd-streak-prep-x' : 'spd-streak-prep-y');

  const launch = () => {
    if (axis === 'x') el.dataset.blurX = '4';
    else el.dataset.blurY = '4';

    void el.offsetWidth;
    el.classList.add('spd-streak-active');
    el.classList.remove('spd-streak-prep-x', 'spd-streak-prep-y');

    window.setTimeout(() => {
      if (axis === 'x') el.dataset.blurX = '2';
      else el.dataset.blurY = '2';
    }, Math.round(durationMs * 0.36));

    window.setTimeout(() => {
      delete el.dataset.blurX;
      delete el.dataset.blurY;
      el.classList.remove('spd-streak-active');
      el.style.removeProperty('--spd-dur');
    }, durationMs + 30);
  };

  if (delayMs > 0) {
    window.setTimeout(launch, delayMs);
  } else {
    launch();
  }
}
