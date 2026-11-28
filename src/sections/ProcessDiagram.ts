import { SITE_CONFIG } from '../config/siteConfig';

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
            <div class="eyebrow">${process.eyebrow}</div>
            <h2 id="process-heading" class="section-title-xl">
              ${process.titleLine1}<br />${process.titleLine2}
            </h2>
            <p class="section-lead">${process.subtitle}</p>
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
            <div class="eyebrow">${process.eyebrow}</div>
            <h2 class="section-title-xl">${process.titleLine1}<br />${process.titleLine2}</h2>
            <p class="section-lead">${process.subtitle}</p>
          </div>
          <ol class="process-mobile-cards">
            ${process.steps
              .map(
                (step) => `
              <li class="process-mobile-card">
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
  const livePath = section.querySelector<SVGPathElement>('.process-live-path');
  const headDot = section.querySelector<SVGCircleElement>('.process-head-dot');
  const stepCards = Array.from(section.querySelectorAll<HTMLElement>('.process-step-card'));
  const stepDots = Array.from(section.querySelectorAll<SVGGElement>('.process-node-g'));
  const dipNote = section.querySelector<HTMLElement>('.process-dip-note');

  const totalLen = livePath ? livePath.getTotalLength() : 1000;
  if (livePath) {
    livePath.style.strokeDasharray = `${totalLen}`;
    livePath.style.strokeDashoffset = `${totalLen}`;
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

    NODE_ANCHORS.forEach((anchor, i) => {
      const revealed = p >= anchor.threshold;
      stepCards[i]?.classList.toggle('is-revealed', revealed);
      stepDots[i]?.classList.toggle('is-revealed', revealed);
    });

    if (dipNote) {
      dipNote.classList.toggle('is-revealed', p >= 0.56);
    }
  };

  update(0);
  return { update };
}
