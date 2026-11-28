import { SITE_CONFIG } from '../config/siteConfig';
import { morphSpeedingText, streakRevealElement } from '../effects/SpeedingText';

export interface ProcessController {
  update: (progress: number) => void;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Sweeping engineering curve shifted cleanly into a 940x540 canvas so all 4 callouts have generous breathing room
const CURVE_PATH =
  'M 20 420 C 80 420, 120 386, 185 384 C 260 382, 290 322, 375 320 C 445 318, 490 308, 520 280 C 548 254, 578 304, 620 290 C 668 274, 710 212, 785 210 C 835 208, 868 188, 900 172';

// Anchor coordinates along the SVG viewBox (0 0 940 540) for each of the 4 steps
const NODE_ANCHORS = [
  { x: 185, y: 384, threshold: 0.18 },
  { x: 375, y: 320, threshold: 0.42 },
  { x: 620, y: 290, threshold: 0.68 },
  { x: 785, y: 210, threshold: 0.88 },
];

export function renderProcessHTML(): string {
  const { process } = SITE_CONFIG;
  return `
    <section id="process" class="process-section" aria-labelledby="process-heading" data-asset-slot="process-diagram">
      <div class="process-sticky">
        <div class="container process-grid">
          <div class="process-intro">
            <div class="eyebrow" data-scroll-copy>${process.eyebrow}</div>
            <h2 id="process-heading" class="section-title-xl" data-scroll-heading>
              ${process.titleLine1}<br />${process.titleLine2}
            </h2>
            <p class="section-lead" data-scroll-copy data-scroll-stagger="1">${process.subtitle}</p>

            <!-- Live Speeding Text Step Counter synced to engineering curve -->
            <div class="process-live-counter" aria-live="polite" data-scroll-copy data-scroll-stagger="2">
              <div class="plc-num-row">
                <span class="plc-active-num" id="proc-speed-num" data-spd-value="${process.steps[0].num}">${process.steps[0].num}</span>
                <span class="plc-total">/ 0${process.steps.length}</span>
              </div>
              <div class="plc-meta">
                <strong class="plc-step-name" id="proc-speed-title" data-spd-value="${process.steps[0].title}">${process.steps[0].title}</strong>
                <span class="plc-step-time" id="proc-speed-time" data-spd-value="${process.steps[0].timeframe}">${process.steps[0].timeframe}</span>
              </div>
            </div>
          </div>

          <div class="process-diagram-wrap">
            <svg class="process-svg" viewBox="0 0 940 540" fill="none" aria-hidden="true">
              <!-- Dashed baseline trajectory -->
              <path
                d="${CURVE_PATH}"
                stroke="rgba(12, 12, 13, 0.16)"
                stroke-width="2"
                stroke-dasharray="5 7"
                stroke-linecap="round"
              />
              <!-- Live scroll-drawn solid path -->
              <path
                class="process-live-path"
                d="${CURVE_PATH}"
                stroke="#0c0c0d"
                stroke-width="2.6"
                stroke-linecap="round"
              />

              <!-- Step anchor dots & hairline stems -->
              ${NODE_ANCHORS.map(
                (pt, i) => `
                <g class="process-node-g" data-step-dot="${i}">
                  <line
                    x1="${pt.x}"
                    y1="${pt.y}"
                    x2="${pt.x}"
                    y2="${process.steps[i].position === 'below' ? pt.y + 42 : pt.y - 42}"
                    stroke="rgba(12,12,13,0.22)"
                    stroke-width="1"
                  />
                  <circle class="process-node-pulse" cx="${pt.x}" cy="${pt.y}" r="11" fill="none" stroke="#22c1ec" stroke-width="1.4" />
                  <circle cx="${pt.x}" cy="${pt.y}" r="4.5" fill="#0c0c0d" />
                </g>
              `
              ).join('')}

              <!-- Moving head circle -->
              <circle class="process-head-dot" cx="20" cy="420" r="8" fill="#f5f4ef" stroke="#0c0c0d" stroke-width="2.5" />
            </svg>

            <!-- Expected Dip callout -->
            <div class="process-dip-note" aria-hidden="true">
              <span>${process.dipNote}</span>
            </div>

            <!-- Step callout cards positioned relative to the diagram -->
            <div class="process-steps-layer">
              ${process.steps
                .map(
                  (step, idx) => `
                <article class="process-step-card step-pos-${idx} is-${step.position}" data-step-card="${idx}">
                  <h3 class="ps-title"><span class="ps-num">${step.num}</span> ${step.title}</h3>
                  <div class="ps-time">${step.timeframe}</div>
                  <p class="ps-body">${step.body}</p>
                  <div class="ps-deliv-label">DELIVERABLE</div>
                  <p class="ps-deliv">${step.deliverable}</p>
                </article>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Narrow viewport / reduced-motion linear step list -->
      <div class="process-mobile-list">
        <div class="container">
          <div class="process-mobile-header">
            <div class="eyebrow" data-scroll-copy>${process.eyebrow}</div>
            <h2 class="section-title-xl" data-scroll-heading>${process.titleLine1}<br />${process.titleLine2}</h2>
            <p class="section-lead" data-scroll-copy data-scroll-stagger="1">${process.subtitle}</p>
          </div>
          <ol class="process-mobile-cards">
            ${process.steps
              .map(
                (step, sIdx) => `
              <li class="process-mobile-card" data-scroll-card data-scroll-stagger="${sIdx % 2}">
                <div class="pm-top">
                  <span class="ps-num">${step.num}</span>
                  <h3>${step.title}</h3>
                  <span class="ps-time">${step.timeframe}</span>
                </div>
                <p class="ps-body">${step.body}</p>
                <div class="ps-deliv-label">DELIVERABLE</div>
                <p class="ps-deliv">${step.deliverable}</p>
              </li>
            `
              )
              .join('')}
          </ol>
        </div>
      </div>
    </section>
  `;
}

export function initProcessDiagram(section: HTMLElement): ProcessController {
  const { process } = SITE_CONFIG;
  const livePath = section.querySelector<SVGPathElement>('.process-live-path');
  const headDot = section.querySelector<SVGCircleElement>('.process-head-dot');
  const stepCards = Array.from(section.querySelectorAll<HTMLElement>('.process-step-card'));
  const stepDots = Array.from(section.querySelectorAll<SVGGElement>('.process-node-g'));
  const dipNote = section.querySelector<HTMLElement>('.process-dip-note');

  const speedNumEl = section.querySelector<HTMLElement>('#proc-speed-num');
  const speedTitleEl = section.querySelector<HTMLElement>('#proc-speed-title');
  const speedTimeEl = section.querySelector<HTMLElement>('#proc-speed-time');

  const revealedStates = NODE_ANCHORS.map(() => false);
  let activeStepIdx = 0;

  const totalLen = livePath ? livePath.getTotalLength() : 1000;
  if (livePath) {
    livePath.style.strokeDasharray = `${totalLen}`;
    livePath.style.strokeDashoffset = `${totalLen}`;
  }

  // Mobile cards: streak step numbers when scrolled into view
  const mobileCards = Array.from(section.querySelectorAll<HTMLElement>('.process-mobile-card'));
  if (mobileCards.length > 0) {
    const mobIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            mobIo.unobserve(entry.target);
            const numEl = entry.target.querySelector<HTMLElement>('.ps-num');
            const timeEl = entry.target.querySelector<HTMLElement>('.ps-time');
            streakRevealElement(numEl, { axis: 'x', durationMs: 380 });
            streakRevealElement(timeEl, { axis: 'x', delayMs: 60, durationMs: 380 });
          }
        });
      },
      { threshold: 0.2 }
    );
    mobileCards.forEach((card) => mobIo.observe(card));
  }

  const update = (rawP: number) => {
    const p = clamp01(rawP);
    if (livePath && headDot) {
      const drawLen = totalLen * p;
      livePath.style.strokeDashoffset = `${totalLen - drawLen}`;
      const pt = livePath.getPointAtLength(drawLen);
      headDot.setAttribute('cx', pt.x.toFixed(1));
      headDot.setAttribute('cy', pt.y.toFixed(1));
      headDot.setAttribute('fill', p > 0.88 ? '#22c1ec' : '#f5f4ef');
    }

    let nextActiveIdx = 0;
    NODE_ANCHORS.forEach((anchor, i) => {
      const revealed = p >= anchor.threshold;
      if (revealed) nextActiveIdx = i;

      if (revealed !== revealedStates[i]) {
        revealedStates[i] = revealed;
        if (revealed && stepCards[i]) {
          const numEl = stepCards[i].querySelector<HTMLElement>('.ps-num');
          const timeEl = stepCards[i].querySelector<HTMLElement>('.ps-time');
          streakRevealElement(numEl, { axis: 'x', durationMs: 400 });
          streakRevealElement(timeEl, { axis: 'x', delayMs: 55, durationMs: 380 });
        }
      }

      stepCards[i]?.classList.toggle('is-revealed', revealed);
      stepDots[i]?.classList.toggle('is-revealed', revealed);
    });

    if (nextActiveIdx !== activeStepIdx) {
      const dir: 1 | -1 = nextActiveIdx > activeStepIdx ? 1 : -1;
      activeStepIdx = nextActiveIdx;
      const step = process.steps[activeStepIdx];
      morphSpeedingText(speedNumEl, step.num, { axis: 'y', direction: dir, durationMs: 360 });
      morphSpeedingText(speedTitleEl, step.title, { axis: 'x', direction: dir, durationMs: 360 });
      morphSpeedingText(speedTimeEl, step.timeframe, { axis: 'x', direction: dir, durationMs: 380, delayMs: 30 });
    }

    if (dipNote) {
      dipNote.classList.toggle('is-revealed', p >= 0.56);
    }
  };

  update(0);
  return { update };
}
