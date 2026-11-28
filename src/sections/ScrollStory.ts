import { SITE_CONFIG } from '../config/siteConfig';
import type { DeployLogo3DController } from '../three/DeployLogo3D';

export interface ScrollStoryController {
  update: (progress: number) => void;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const invLerp = (a: number, b: number, v: number) => clamp01((v - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

const CYLINDER_LINES = [
  'Websites built to convert.',
  'SaaS engineered to scale.',
  'Company systems, unified.',
  'AI wired into real ops.',
  '100% your code & stack.',
  'We build, <span class="cyl-accent">you lead.</span>',
];
const CYL_STEP_DEG = 27;

export function renderScrollStoryHTML(): string {
  const { story } = SITE_CONFIG;
  const beatsHtml = story.beats
    .map(
      (b, idx) => `
      <div class="story-beat-copy" data-beat-index="${idx}" aria-hidden="${idx === 0 ? 'false' : 'true'}">
        <div class="story-beat-eyebrow">${b.num} &middot; ${b.tag}</div>
        <h2 class="story-beat-title">${b.title}</h2>
        <p class="story-beat-body">${b.body}</p>
        ${b.source ? `<p class="story-beat-source">${b.source}</p>` : ''}
      </div>
    `
    )
    .join('');

  const diagPills = story.diagnosticsBefore
    .map(
      (label, i) => `
      <span class="diag-pill" data-diag-index="${i}" data-before="${label}" data-after="${story.diagnosticsAfter[i]}">${label}</span>
    `
    )
    .join('');

  return `
    <section id="story" class="story-section" aria-label="From search question to Zeroth">
      <div class="story-sticky">
        <div class="story-bg-wash" aria-hidden="true"></div>
        <div class="story-stage">
          <!-- Spotlight glow before search bar opens -->
          <div class="story-spotlight" aria-hidden="true"></div>

          <!-- Search bar (Beats 01, 06, 07, 08) -->
          <div class="story-search-bar" aria-hidden="true">
            <svg class="story-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
            </svg>
            <span class="story-search-text"></span>
            <span class="story-search-cursor"></span>
          </div>

          <!-- Production System Box (Beats 07, 08, morphs in Beat 09) -->
          <div class="story-ai-box" aria-hidden="true">
            <div class="story-ai-heading">DEPLOYED</div>
            <div class="story-ai-lines">
              <div class="ai-line ai-line-1"></div>
              <div class="ai-line ai-line-2">
                <div class="ai-line-quoted-bar"></div>
                <div class="ai-line-pill"></div>
              </div>
              <div class="ai-line ai-line-3"></div>
              <div class="ai-line ai-line-4"></div>
            </div>
            <div class="story-ai-source">
              <span class="ai-source-label">STACK</span>
              <span class="ai-source-brand">${story.exampleBrand}</span>
            </div>
          </div>

          <!-- Citation leader arcs SVG (Beat 08) -->
          <svg class="story-citation-arcs" viewBox="0 0 800 320" fill="none" aria-hidden="true">
            <path class="cite-arc cite-arc-1" d="M 350 285 C 345 180, 290 115, 225 110" />
            <path class="cite-arc cite-arc-2" d="M 368 285 C 370 190, 345 140, 320 132" />
            <path class="cite-arc cite-arc-3" d="M 386 285 C 405 205, 425 150, 560 118" />
          </svg>

          <!-- Tilted Search Result Card Stack (result-card-set) -->
          <div class="story-card-stack" data-asset-slot="result-card-set" aria-hidden="true">
            <div class="result-card ghost-card ghost-above-2">
              <span class="rc-num">45</span>
              <div class="rc-body"><div class="rc-bar w-60"></div><div class="rc-bar w-85 dim"></div></div>
            </div>
            <div class="result-card ghost-card ghost-above-1">
              <span class="rc-num">46</span>
              <div class="rc-body"><div class="rc-bar w-70"></div><div class="rc-bar w-90 dim"></div></div>
            </div>

            <div class="result-card hero-result-card">
              <span class="rc-num rc-main-num">47</span>
              <div class="rc-body">
                <div class="rc-meta-row">
                  <span class="rc-favicon"></span>
                  <div class="rc-title-bar"></div>
                </div>
                <div class="rc-stars" aria-label="5 out of 5 stars">★★★★★</div>
                <div class="rc-bar rc-desc-1"></div>
                <div class="rc-bar rc-desc-2"></div>
              </div>
            </div>

            <div class="result-card ghost-card ghost-below-1">
              <span class="rc-num">48</span>
              <div class="rc-body"><div class="rc-bar w-65"></div><div class="rc-bar w-80 dim"></div></div>
            </div>
            <div class="result-card ghost-card ghost-below-2">
              <span class="rc-num">49</span>
              <div class="rc-body"><div class="rc-bar w-55"></div><div class="rc-bar w-75 dim"></div></div>
            </div>

            <!-- Sweeping Glass Lens for Beat 04 (The Fix) -->
            <div class="story-fix-lens"></div>
          </div>

          <!-- Beat 09: DEPLOY 3D GLB Logo + 3D Cylinder Text Reveal Finale -->
          <div class="story-zeroth-finale">
            <div class="deploy-logo-3d-host" id="deploy-logo-3d-host" data-asset-slot="zeroth-logo"></div>
            <div class="zeroth-morph-mark" aria-hidden="true">
              <picture>
                <source srcset="./deploy-mark.webp" type="image/webp" />
                <img class="finale-logo-fallback" src="./logo-mark.png" alt="DEPLOY logo" width="84" height="84" />
              </picture>
            </div>
            <div class="zm-copy-block">
              <div class="zm-tag">${story.zerothMorph.tag}</div>

              <!-- 3D Text Reveal: Lines of text turning on a 3D cylinder as you scroll -->
              <div class="cyl-text-viewport" aria-label="${CYLINDER_LINES.map((l) => l.replace(/<[^>]+>/g, '')).join(' ')}">
                <div class="cyl-text-drum" id="story-cyl-drum" aria-hidden="true">
                  ${CYLINDER_LINES.map(
                    (line, idx) => `
                    <div
                      class="cyl-text-line ${idx === 0 ? 'is-equator' : ''}"
                      data-cyl-line="${idx}"
                      style="transform: rotateX(${-idx * CYL_STEP_DEG}deg) translateZ(var(--cyl-radius));"
                    >${line}</div>
                  `
                  ).join('')}
                </div>
              </div>

              <p class="zm-subtitle">${story.zerothMorph.subtitle}</p>
            </div>
          </div>
        </div>

        <!-- Bottom-left narrative copy container -->
        <div class="story-copy-panel">
          ${beatsHtml}
          <div class="story-diag-pills" aria-hidden="true">${diagPills}</div>
        </div>

        <!-- 9-dash progress indicator -->
        <div class="story-progress-dots" aria-hidden="true">
          ${Array.from({ length: 9 })
            .map((_, i) => `<span class="story-dot" data-dot="${i}"></span>`)
            .join('')}
        </div>
      </div>

      <!-- Accessible reduced-motion / static summary -->
      <div class="story-reduced-fallback">
        <div class="container">
          ${story.beats
            .map(
              (b) => `
            <article class="reduced-beat-card">
              <span class="eyebrow">${b.num} &middot; ${b.tag}</span>
              <h3>${b.title}</h3>
              <p>${b.body}</p>
              ${b.source ? `<p class="muted-source">${b.source}</p>` : ''}
            </article>
          `
            )
            .join('')}
          <div class="reduced-zeroth-finale">
            <div class="zeroth-morph-mark is-static" aria-hidden="true">
              <picture>
                <source srcset="./deploy-mark.webp" type="image/webp" />
                <img class="finale-logo-fallback" src="./logo-mark.png" alt="DEPLOY logo" width="96" height="96" />
              </picture>
            </div>
            <span class="eyebrow">${story.zerothMorph.tag}</span>
            <h2>${story.zerothMorph.title.replace('\n', '<br />')}</h2>
            <p>${story.zerothMorph.subtitle}</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function initScrollStory(section: HTMLElement): ScrollStoryController {
  const sticky = section.querySelector<HTMLElement>('.story-sticky')!;
  const bgWash = section.querySelector<HTMLElement>('.story-bg-wash')!;
  const spotlight = section.querySelector<HTMLElement>('.story-spotlight')!;
  const searchBar = section.querySelector<HTMLElement>('.story-search-bar')!;
  const searchText = section.querySelector<HTMLElement>('.story-search-text')!;
  const aiBox = section.querySelector<HTMLElement>('.story-ai-box')!;
  const aiQuotedBar = section.querySelector<HTMLElement>('.ai-line-quoted-bar')!;
  const aiPill = section.querySelector<HTMLElement>('.ai-line-pill')!;
  const aiSource = section.querySelector<HTMLElement>('.story-ai-source')!;
  const citationArcs = section.querySelector<SVGSVGElement>('.story-citation-arcs')!;
  const cardStack = section.querySelector<HTMLElement>('.story-card-stack')!;
  const mainCard = section.querySelector<HTMLElement>('.hero-result-card')!;
  const mainNum = section.querySelector<HTMLElement>('.rc-main-num')!;
  const ghostAbove1 = section.querySelector<HTMLElement>('.ghost-above-1 .rc-num')!;
  const ghostAbove2 = section.querySelector<HTMLElement>('.ghost-above-2 .rc-num')!;
  const ghostBelow1 = section.querySelector<HTMLElement>('.ghost-below-1 .rc-num')!;
  const ghostBelow2 = section.querySelector<HTMLElement>('.ghost-below-2 .rc-num')!;
  const fixLens = section.querySelector<HTMLElement>('.story-fix-lens')!;
  const zerothFinale = section.querySelector<HTMLElement>('.story-zeroth-finale')!;
  const cylDrum = section.querySelector<HTMLElement>('#story-cyl-drum');
  const cylLineEls = Array.from(section.querySelectorAll<HTMLElement>('.cyl-text-line'));
  const logo3DHost = section.querySelector<HTMLElement>('#deploy-logo-3d-host');
  const logoFallback = section.querySelector<HTMLElement>('.story-zeroth-finale .zeroth-morph-mark');
  const copyPanel = section.querySelector<HTMLElement>('.story-copy-panel')!;
  const diagContainer = section.querySelector<HTMLElement>('.story-diag-pills')!;
  const diagPills = Array.from(section.querySelectorAll<HTMLElement>('.diag-pill'));
  const beatEls = Array.from(section.querySelectorAll<HTMLElement>('.story-beat-copy'));
  const dotEls = Array.from(section.querySelectorAll<HTMLElement>('.story-dot'));

  // Lazy-load the segmented 3D GLB logo only when the user approaches the Scroll Story section
  let logo3D: DeployLogo3DController | null = null;
  let logo3DLoading = false;
  const ensureLogo3D = () => {
    if (logo3D || logo3DLoading || !logo3DHost || !SITE_CONFIG.assets.zerothLogo.glbUrl) return;
    logo3DLoading = true;
    import('../three/DeployLogo3D').then(({ mountDeployLogo3D }) => {
      logo3D = mountDeployLogo3D(logo3DHost, SITE_CONFIG.assets.zerothLogo.glbUrl!, logoFallback);
    });
  };
  const storyIo = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        ensureLogo3D();
        storyIo.disconnect();
      }
    },
    { rootMargin: '500px' }
  );
  storyIo.observe(section);

  const query = SITE_CONFIG.story.queryText;

  // Beat windows in normalized progress 0..1:
  // 0.00 - 0.13: Beat 01 (The Question)
  // 0.13 - 0.22: Beat 02 (The List)
  // 0.22 - 0.33: Beat 03 (Result 47)
  // 0.33 - 0.46: Beat 04 (The Fix - lens sweeps across)
  // 0.46 - 0.59: Beat 05 (The Climb 47 -> 2)
  // 0.59 - 0.69: Beat 06 (Number One)
  // 0.69 - 0.78: Beat 07 (The Floor Above - AI Overview pushes in)
  // 0.78 - 0.88: Beat 08 (Quoted - arcs + yellow highlight)
  // 0.88 - 1.00: Beat 09 (Zeroth - dark to light morph)

  // Beat windows in normalized progress 0..1 (with generous 0.75..1.00 runway for Beat 09 3D Cylinder Text Reveal):
  const beatRanges: Array<[number, number]> = [
    [0.0, 0.105],
    [0.105, 0.185],
    [0.185, 0.28],
    [0.28, 0.39],
    [0.39, 0.50],
    [0.50, 0.585],
    [0.585, 0.67],
    [0.67, 0.75],
  ];

  const update = (rawP: number) => {
    const p = clamp01(rawP);

    // Determine active beat 0..8
    let activeBeat = 8;
    for (let i = 0; i < beatRanges.length; i++) {
      if (p < beatRanges[i][1]) {
        activeBeat = i;
        break;
      }
    }

    dotEls.forEach((d, idx) => {
      d.classList.toggle('is-active', idx === activeBeat);
      d.classList.toggle('is-light', p > 0.77);
    });

    beatEls.forEach((el, idx) => {
      const [start, end] = beatRanges[idx];
      const fadeIn = idx === 0 ? 1 : smooth(invLerp(start - 0.015, start + 0.022, p));
      const fadeOut = 1 - smooth(invLerp(end - 0.022, end + 0.008, p));
      const opacity = Math.min(fadeIn, fadeOut);
      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - fadeIn) * 14).toFixed(1)}px, 0)`;
      el.setAttribute('aria-hidden', opacity < 0.1 ? 'true' : 'false');
    });

    // Spotlight intro: already visible at p = 0 so there is zero empty black space entering Story
    const spotOpacity = (1 - smooth(invLerp(0.04, 0.095, p))) * 0.85;
    spotlight.style.opacity = spotOpacity.toFixed(3);

    // Search bar visibility: immediately visible in Beat 01 (0.00..0.12) and returns in Beats 06-08 (0.49..0.76)
    const sb1 = 1 - smooth(invLerp(0.098, 0.12, p));
    const sb2 = smooth(invLerp(0.49, 0.53, p)) * (1 - smooth(invLerp(0.735, 0.77, p)));
    const sbOpacity = Math.max(sb1, sb2);
    const sbY = sb2 > sb1 ? -225 : lerp(-34, -18, invLerp(0.0, 0.10, p));
    searchBar.style.opacity = sbOpacity.toFixed(3);
    searchBar.style.transform = `translate3d(-50%, ${sbY.toFixed(1)}px, 0) scale(${lerp(0.96, 1, sbOpacity).toFixed(3)})`;

    // Typewriter query text during Beat 01 (starts with prompt visible at p = 0)
    if (p < 0.13) {
      const minChars = 6;
      const charCount = Math.max(minChars, Math.floor(lerp(minChars, query.length, invLerp(0.005, 0.08, p))));
      searchText.textContent = query.slice(0, charCount);
    } else {
      searchText.textContent = '';
    }

    // Card stack entrance (Beat 02..08)
    const stackIn = smooth(invLerp(0.105, 0.145, p));
    const stackOut = 1 - smooth(invLerp(0.74, 0.78, p));
    const stackOpacity = stackIn * stackOut;
    cardStack.style.opacity = stackOpacity.toFixed(3);

    // 3D perspective tilt: tilted in Beats 02-05, flattens upright in Beat 06-08
    const flatten = smooth(invLerp(0.47, 0.53, p));
    const rotX = lerp(18, 0, flatten);
    const rotY = lerp(-12, 0, flatten);
    const rotZ = lerp(-3.5, 0, flatten);

    // Card stack Y offset: centered vertically (-50%), then pushes down in Beat 07 when DEPLOYED box moves in above it
    const aiPushDown = smooth(invLerp(0.58, 0.635, p));
    const stackY = lerp(24, -18, stackIn) + aiPushDown * 116;
    const stackScale = lerp(0.92, 1.0, stackIn) * lerp(1, 0.86, aiPushDown);
    cardStack.style.transform = `translate3d(-50%, calc(-50% + ${stackY.toFixed(1)}px), 0) perspective(1100px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${stackScale.toFixed(3)})`;

    // Ghost cards fade out once we reach #1
    const ghostOpacity = 1 - smooth(invLerp(0.485, 0.54, p));
    cardStack.style.setProperty('--ghost-opacity', ghostOpacity.toFixed(3));

    // Beat 04: The Fix lens sweeps left-to-right across card 47 (0.29..0.375)
    const fixSweep = invLerp(0.29, 0.375, p);
    const lensVis = smooth(invLerp(0.28, 0.305, p)) * (1 - smooth(invLerp(0.365, 0.39, p)));
    fixLens.style.opacity = lensVis.toFixed(3);
    fixLens.style.transform = `translate3d(${lerp(-280, 290, fixSweep).toFixed(1)}px, -50%, 40px)`;

    // Card brightness & fixed state
    const isFixed = fixSweep > 0.35;
    mainCard.classList.toggle('is-fixed', isFixed);
    mainCard.classList.toggle('is-dimmed-by-ai', aiPushDown > 0.35);

    // Diagnostic pills visibility (Beats 03-04: 0.185..0.40)
    const diagVis = smooth(invLerp(0.185, 0.215, p)) * (1 - smooth(invLerp(0.385, 0.405, p)));
    diagContainer.style.opacity = diagVis.toFixed(3);
    diagPills.forEach((pill, idx) => {
      const threshold = 0.2 + idx * 0.22;
      const flipped = fixSweep >= threshold && idx < 3;
      pill.textContent = flipped ? pill.dataset.after! : pill.dataset.before!;
      pill.classList.toggle('is-fixed', flipped);
    });

    // Beat 05-06: Rank countdown 47 -> 2 -> 1
    let currentRank = 47;
    if (p >= 0.39 && p < 0.51) {
      const climbT = smooth(invLerp(0.39, 0.50, p));
      currentRank = Math.max(2, Math.round(lerp(47, 2, Math.pow(climbT, 0.72))));
    } else if (p >= 0.51) {
      currentRank = 1;
    }
    mainNum.textContent = String(currentRank);
    ghostAbove1.textContent = String(Math.max(1, currentRank - 1));
    ghostAbove2.textContent = String(Math.max(1, currentRank - 2));
    ghostBelow1.textContent = String(currentRank + 1);
    ghostBelow2.textContent = String(currentRank + 2);

    // Beat 07-08: AI Overview box descends above #1
    const aiIn = smooth(invLerp(0.58, 0.625, p));
    const aiOut = 1 - smooth(invLerp(0.745, 0.78, p));
    const aiOpacity = aiIn * aiOut;
    aiBox.style.opacity = aiOpacity.toFixed(3);
    aiBox.style.transform = `translate3d(-50%, ${lerp(-145, -108, aiIn).toFixed(1)}px, 0) scale(${lerp(0.95, 1, aiIn).toFixed(3)})`;

    // Beat 08: Citation arcs & yellow quoted highlight (0.67..0.75)
    const quoteT = smooth(invLerp(0.675, 0.72, p));
    const arcsOpacity = quoteT * aiOut;
    citationArcs.style.opacity = arcsOpacity.toFixed(3);
    citationArcs.style.setProperty('--arc-progress', quoteT.toFixed(3));
    aiQuotedBar.style.opacity = quoteT.toFixed(3);
    aiPill.style.opacity = smooth(invLerp(0.695, 0.73, p)).toFixed(3);
    aiSource.style.opacity = smooth(invLerp(0.705, 0.74, p)).toFixed(3);

    // Beat 09: Dark -> Off-white wash + 3D Cylinder Text Reveal + 3D DEPLOY Logo arrow launch (0.74..1.0)
    const morphT = smooth(invLerp(0.735, 0.785, p));
    bgWash.style.opacity = morphT.toFixed(3);
    sticky.classList.toggle('is-light-mode', morphT > 0.55);

    const finaleIn = smooth(invLerp(0.755, 0.80, p));
    zerothFinale.style.opacity = finaleIn.toFixed(3);
    zerothFinale.style.transform = `translate3d(0, ${lerp(24, 0, finaleIn).toFixed(1)}px, 0)`;

    // 3D Cylinder Text Rotation: turns smoothly from Line 0 (0deg) to final Climax Line (+135deg) as user scrolls
    const cylProgress = invLerp(0.79, 0.982, p);
    const maxDrumDeg = (CYLINDER_LINES.length - 1) * CYL_STEP_DEG;
    const drumAngleDeg = cylProgress * maxDrumDeg;
    if (cylDrum) {
      cylDrum.style.transform = `rotateX(${drumAngleDeg.toFixed(2)}deg)`;
    }
    cylLineEls.forEach((lineEl, idx) => {
      const relDeg = drumAngleDeg - idx * CYL_STEP_DEG;
      const absDeg = Math.abs(relDeg);
      if (absDeg >= 88) {
        lineEl.style.opacity = '0';
        lineEl.classList.remove('is-equator');
      } else {
        const cosVal = Math.cos((relDeg * Math.PI) / 180);
        const lineOp = Math.pow(Math.max(0, cosVal), 2.15);
        lineEl.style.opacity = lineOp.toFixed(3);
        lineEl.classList.toggle('is-equator', absDeg < CYL_STEP_DEG * 0.5);
      }
    });

    if (logo3D) {
      const logoTravelT = invLerp(0.76, 0.99, p);
      logo3D.setProgress(logoTravelT, finaleIn);
    }

    // Hide left copy panel during finale
    copyPanel.style.opacity = (1 - smooth(invLerp(0.73, 0.765, p))).toFixed(3);
  };

  update(0);
  return { update };
}
