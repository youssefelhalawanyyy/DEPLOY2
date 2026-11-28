import { PORTFOLIO_PROJECTS, type PortfolioProject, type PortfolioScreen } from './ServicesStack';
import { SITE_CONFIG } from '../config/siteConfig';
import { morphSpeedingText, streakRevealElement } from '../effects/SpeedingText';
import { enhanceScrollTypographyAndSections, splitHeadingForScroll } from '../effects/PageScrollChoreography';

export interface LinusGalleryController {
  openProject: (projectIdx: number) => void;
  close: () => void;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

let supportsDisplayTransition: boolean | undefined;
function canTransitionDisplay(): boolean {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit(): boolean {
  return Boolean(window.CSS?.supports?.('overlay', 'auto')) && canTransitionDisplay();
}

async function closeTopLayer(dialog: HTMLDialogElement): Promise<void> {
  if (!dialog.open) return;
  if (!supportsTopLayerExit()) {
    dialog.setAttribute('data-closing', '');
    const animations = dialog.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => window.setTimeout(r, 600)),
      ]);
    }
    if (!dialog.hasAttribute('data-closing')) return;
    dialog.removeAttribute('data-closing');
  }
  if (dialog.open) dialog.close();
}

export function renderLinusGalleryModalHTML(): string {
  return `
    <dialog id="lr-project-dialog" class="lr-dialog h51-dialog" aria-labelledby="lr-dialog-title">
      <div class="h51-modal-shell" id="lr-canvas-scroll">
        <div id="lr-dialog-content"></div>

        <!-- Inline High-Resolution Print Zoom Overlay inside Top Layer -->
        <div class="h51-zoom-overlay" id="h51-zoom-overlay" hidden>
          <div class="h51-zoom-backdrop" data-zoom-close></div>
          <div class="h51-zoom-card">
            <div class="h51-zoom-bar">
              <div>
                <span class="h51-zoom-kicker" id="h51-zoom-kicker"></span>
                <p class="h51-zoom-caption" id="h51-zoom-caption"></p>
              </div>
              <div class="h51-zoom-controls">
                <button type="button" class="h51-icon-btn" id="h51-zoom-prev" aria-label="Previous print">&lsaquo;</button>
                <button type="button" class="h51-icon-btn" id="h51-zoom-next" aria-label="Next print">&rsaquo;</button>
                <button type="button" class="h51-icon-btn" data-zoom-close aria-label="Close print zoom">&times;</button>
              </div>
            </div>
            <img id="h51-zoom-img" class="h51-zoom-img" src="" alt="" />
          </div>
        </div>
      </div>
    </dialog>
  `;
}

function buildWallColumnItems(
  project: PortfolioProject,
  colOffset: number,
  countPerSet = 5
): Array<{ screen: PortfolioScreen; sIdx: number }> {
  const total = project.screens.length;
  const base: Array<{ screen: PortfolioScreen; sIdx: number }> = [];
  for (let i = 0; i < countPerSet; i++) {
    const sIdx = (colOffset + i) % total;
    base.push({ screen: project.screens[sIdx], sIdx });
  }
  // Duplicate set 2x so CSS translate3d(0, -50%, 0) loops seamlessly without any jump
  return [...base, ...base];
}

function buildHero51ProjectMarkup(projectIdx: number, wallPaused: boolean): string {
  const count = PORTFOLIO_PROJECTS.length;
  const normIdx = ((projectIdx % count) + count) % count;
  const project = PORTFOLIO_PROJECTS[normIdx];
  const nextIdx = (normIdx + 1) % count;
  const nextProject = PORTFOLIO_PROJECTS[nextIdx];
  const firstScreen = project.screens[0];

  const col1 = buildWallColumnItems(project, 0, 9);
  const col2 = buildWallColumnItems(project, 3, 9);
  const col3 = buildWallColumnItems(project, 6, 9);

  const renderPrintCard = (item: { screen: PortfolioScreen; sIdx: number }, isClone: boolean) => `
    <button
      type="button"
      class="h51-print-frame ${project.renderMode === 'poster' ? 'is-poster-print' : 'is-wide-print'}"
      data-print-idx="${item.sIdx}"
      ${isClone ? 'tabindex="-1" aria-hidden="true"' : `aria-label="Inspect screen ${pad2(item.sIdx + 1)}: ${item.screen.label}"`}
    >
      <img
        src="${item.screen.webp || item.screen.src}"
        alt="${isClone ? '' : `${project.tabTitle} — ${item.screen.label}`}"
        loading="lazy"
        decoding="async"
        draggable="false"
      />
    </button>
  `;

  const renderColumn = (items: Array<{ screen: PortfolioScreen; sIdx: number }>, colNum: number) => `
    <div class="h51-wall-col h51-col-${colNum}">
      <div class="h51-col-track ${wallPaused ? 'is-paused' : ''}">
        ${items.map((item, idx) => renderPrintCard(item, idx >= items.length / 2)).join('')}
      </div>
    </div>
  `;

  return `
    <!-- Sticky State-Aware Studio Top Bar + Live Scroll Progress -->
    <header class="h51-topbar" id="h51-topbar">
      <div class="h51-topbar-inner">
        <div class="h51-topbar-left">
          <button type="button" class="h51-back-pill" data-lr-close autofocus>
            <span aria-hidden="true">&larr;</span> Portfolio
          </button>
          <span class="h51-studio-tag">DEPLOY &middot; WE BUILD, YOU LEAD</span>
        </div>

        <nav class="h51-project-tabs" aria-label="Switch case study">
          ${PORTFOLIO_PROJECTS.map(
            (p, idx) => `
            <button
              type="button"
              class="h51-ptab ${idx === normIdx ? 'is-active' : ''}"
              data-lr-switch="${idx}"
            >
              <span class="h51-ptab-num">${p.tabNum}</span>
              <span>${p.tabTitle}</span>
            </button>
          `
          ).join('')}
        </nav>

        <div class="h51-topbar-right">
          <button
            type="button"
            class="h51-pause-btn"
            id="h51-wall-pause-btn"
            aria-label="${wallPaused ? 'Play gallery wall motion' : 'Pause gallery wall motion'}"
          >
            <span aria-hidden="true">${wallPaused ? '&#9654;' : '&#10074;&#10074;'}</span>
            <span>${wallPaused ? 'Play wall' : 'Pause wall'}</span>
          </button>
          <button type="button" class="h51-cta-btn" data-lr-start-project>
            Start a project <span aria-hidden="true">&rarr;</span>
          </button>
          <button type="button" class="h51-close-circle" data-lr-close aria-label="Close case study">&times;</button>
        </div>
      </div>
      <div class="h51-scroll-progress" aria-hidden="true">
        <span class="h51-scroll-progress-fill" id="h51-scroll-progress-fill"></span>
      </div>
    </header>

    <!-- HERO 51: SPLIT HERO WITH GALLERY WALL OF PRINTS RECEDING IN PERSPECTIVE -->
    <section class="h51-split-hero" id="h51-hero-stage">
      <!-- Left Column: Editorial & Technical Story + Live Print Inspector -->
      <div class="h51-copy-col">
        <div class="h51-stagger h51-s1 h51-eyebrow-row">
          <span class="h51-code-chip">${project.code}</span>
          <span class="h51-live-chip"><i aria-hidden="true"></i>${project.statusPill}</span>
        </div>

        <h1 id="lr-dialog-title" class="h51-stagger h51-s2 h51-hero-title">
          ${project.title}
        </h1>

        <p class="h51-stagger h51-s3 h51-hero-lead">
          ${project.summary}
        </p>

        <!-- 4 KPI Metrics Strip -->
        <div class="h51-stagger h51-s4 h51-kpi-grid" aria-label="Production metrics">
          ${project.metrics
            .map(
              (m) => `
            <div class="h51-kpi-card">
              <strong>${m.value}</strong>
              <span>${m.label}</span>
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Live Interactive Screen Inspector Readout (syncs on wall hover/focus) -->
        <div class="h51-stagger h51-s5 h51-inspector-card" id="h51-inspector-card">
          <div class="h51-insp-top">
            <span class="h51-insp-badge" id="h51-insp-badge">SCREEN <span id="h51-insp-num" data-spd-value="01">01</span> / ${pad2(project.screens.length)} &middot; <span id="h51-insp-tag" data-spd-value="${firstScreen.tag}">${firstScreen.tag}</span></span>
            <button type="button" class="h51-insp-zoom-btn" id="h51-insp-open" data-print-idx="0">
              Full screen &#8599;
            </button>
          </div>
          <strong class="h51-insp-title" id="h51-insp-title">${firstScreen.label}</strong>
          <p class="h51-insp-desc" id="h51-insp-desc">${firstScreen.caption}</p>
        </div>

        <div class="h51-stagger h51-s6 h51-hero-actions">
          <button type="button" class="h51-primary-btn" data-lr-scroll-info>
            Explore architecture &amp; all ${project.screens.length} screens <span aria-hidden="true">&darr;</span>
          </button>
          <button type="button" class="h51-secondary-btn" data-lr-start-project>
            ${project.ctaLabel} <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>

      <!-- Right Stage: Frameless Zero-Gap 3D Perspective Image Ribbon (Pics Only, Unboxed) -->
      <div class="h51-wall-viewport" id="h51-wall-viewport">
        <div class="h51-wall-mask">
          <div class="h51-wall-plane" id="h51-wall-plane">
            ${renderColumn(col1, 1)}
            ${renderColumn(col2, 2)}
            ${renderColumn(col3, 3)}
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: ARCHITECTURAL DEEP DIVE & TRANSFORMATION -->
    <section class="h51-deepdive-section" id="lr-information-block">
      <div class="h51-container">
        <div class="h51-transformation-grid">
          <div class="h51-trans-card is-challenge" data-scroll-card data-scroll-x="-32" data-scroll-stagger="0" style="--card-from-x: -32px;">
            <span class="h51-sec-kicker" data-scroll-copy>01 &middot; THE BOTTLENECK</span>
            <h2 data-scroll-heading>What held operations back</h2>
            <p data-scroll-copy data-scroll-stagger="1">${project.challenge}</p>
          </div>

          <div class="h51-trans-arrow" aria-hidden="true" data-scroll-card data-scroll-stagger="1">&rarr;</div>

          <div class="h51-trans-card is-solution" data-scroll-card data-scroll-x="32" data-scroll-stagger="2" style="--card-from-x: 32px;">
            <span class="h51-sec-kicker" data-scroll-copy>02 &middot; ENGINEERED OUTCOME</span>
            <h2 data-scroll-heading>Unified production architecture</h2>
            <p data-scroll-copy data-scroll-stagger="1">${project.summary}</p>
            <ul class="h51-stack-row" aria-label="Production stack">
              ${project.stack.map((s, sIdx) => `<li data-scroll-copy data-scroll-stagger="${(sIdx % 3) + 1}">${s}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- 4 Engineered Subsystems Bento -->
        <div class="h51-modules-block">
          <div class="h51-section-head">
            <span class="h51-sec-kicker" data-scroll-copy>03 &middot; CORE SUBSYSTEMS</span>
            <h2 data-scroll-heading>Engineered from database schema to pixel.</h2>
          </div>

          <div class="h51-modules-grid">
            ${project.features
              .map(
                (feat, fIdx) => `
              <article class="h51-module-card" data-scroll-card data-scroll-stagger="${fIdx % 2}" style="--card-from-x: ${fIdx % 2 === 0 ? '-20px' : '20px'};">
                <div class="h51-mod-top">
                  <span class="h51-mod-num">MODULE ${pad2(fIdx + 1)}</span>
                  <span class="h51-mod-check" aria-hidden="true">&#10003;</span>
                </div>
                <h3 data-scroll-heading>${feat.title}</h3>
                <p data-scroll-copy data-scroll-stagger="1">${feat.detail}</p>
              </article>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Section 04: Scroll Stack Annotated Screen Exhibition -->
        <div class="h51-screens-block" id="h51-exhibition-block">
          <div class="h51-section-head h51-exhibition-head">
            <div>
              <span class="h51-sec-kicker" data-scroll-copy>04 &middot; COMPLETE EXHIBITION (${project.screens.length} PLATES)</span>
              <h2 data-scroll-heading>Every production screen, annotated.</h2>
            </div>
            <div class="h51-stack-counter-pill" aria-hidden="true" data-scroll-copy data-scroll-stagger="1">
              <span>STACKING PLATE</span>
              <strong><span id="h51-stack-active-num" data-spd-value="01">01</span> / ${pad2(project.screens.length)}</strong>
            </div>
          </div>

          <div class="h51-scroll-stack" id="h51-scroll-stack">
            <div class="h51-scroll-stack__inner" id="h51-scroll-stack-inner">
              ${project.screens
                .map(
                  (scr, sIdx) => `
                ${sIdx > 0 ? '<div class="h51-stack-spacer" aria-hidden="true"></div>' : ''}
                <div
                  class="h51-stack-slot"
                  data-stack-slot="${sIdx}"
                  style="z-index: ${sIdx + 1};"
                >
                  <article class="h51-stack-card">
                    <header class="h51-stack-bar">
                      <div class="h51-stack-bar-left">
                        <span class="h51-stack-plate-pill">PLATE ${pad2(sIdx + 1)}</span>
                        <h3 class="h51-stack-title">${scr.label}</h3>
                      </div>
                      <div class="h51-stack-bar-right">
                        <span class="h51-stack-tag">${scr.tag}</span>
                        <span class="h51-stack-fraction">${pad2(sIdx + 1)} / ${pad2(project.screens.length)}</span>
                      </div>
                    </header>

                    <button
                      type="button"
                      class="h51-stack-media"
                      data-print-idx="${sIdx}"
                      aria-label="Zoom Plate ${pad2(sIdx + 1)}: ${scr.label}"
                    >
                      <img
                        src="${scr.src}"
                        alt="${project.tabTitle} — ${scr.label}"
                        loading="${sIdx < 2 ? 'eager' : 'lazy'}"
                        decoding="async"
                        draggable="false"
                      />
                      <span class="h51-plate-zoom-chip">Click to zoom &#8599;</span>
                    </button>

                    <footer class="h51-stack-foot">
                      <p>${scr.caption}</p>
                    </footer>

                    <span class="h51-stack-card__shade" aria-hidden="true"></span>
                  </article>
                </div>
              `
                )
                .join('')}
              <div class="h51-stack-end" aria-hidden="true"></div>
            </div>
          </div>
        </div>

        <!-- Bottom Launch & Next Project Banner -->
        <footer class="h51-bottom-banner" data-scroll-card data-scroll-bottom>
          <div>
            <span class="h51-sec-kicker" data-scroll-copy data-scroll-bottom>DEPLOY SOFTWARE ENGINEERING &middot; ${SITE_CONFIG.brand.email}</span>
            <h2 data-scroll-heading data-scroll-bottom>We build, you lead. Ready to ship yours?</h2>
          </div>
          <div class="h51-bottom-actions" data-scroll-copy data-scroll-bottom data-scroll-stagger="1">
            <button type="button" class="h51-cta-btn is-large" data-lr-start-project>
              ${project.ctaLabel} <span aria-hidden="true">&rarr;</span>
            </button>
            <button type="button" class="h51-next-proj-btn" data-lr-switch="${nextIdx}">
              Next: ${nextProject.tabTitle} <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </footer>
      </div>
    </section>
  `;
}

export function initLinusGalleryModal(
  onRequestAudit: (triggerEl?: HTMLElement | null) => void
): LinusGalleryController {
  const dialog = document.getElementById('lr-project-dialog') as HTMLDialogElement | null;
  const contentHost = document.getElementById('lr-dialog-content');
  const zoomOverlay = document.getElementById('h51-zoom-overlay');
  const zoomImg = document.getElementById('h51-zoom-img') as HTMLImageElement | null;
  const zoomKicker = document.getElementById('h51-zoom-kicker');
  const zoomCaption = document.getElementById('h51-zoom-caption');
  const zoomPrev = document.getElementById('h51-zoom-prev');
  const zoomNext = document.getElementById('h51-zoom-next');

  if (!dialog || !contentHost) {
    return { openProject: () => {}, close: () => {} };
  }

  let currentProjectIdx = 0;
  let currentZoomIdx = 0;
  let wallPaused = false;
  let tiltRaf = 0;
  let stackCleanup: (() => void) | null = null;
  let pageScrollCleanup: (() => void) | null = null;
  let targetTiltX = 0;
  let targetTiltY = 0;
  let curTiltX = 0;
  let curTiltY = 0;

  const openZoom = (screenIdx: number) => {
    const project = PORTFOLIO_PROJECTS[currentProjectIdx];
    if (!project || !zoomOverlay || !zoomImg || !zoomKicker || !zoomCaption) return;
    const total = project.screens.length;
    const norm = ((screenIdx % total) + total) % total;
    currentZoomIdx = norm;
    const scr = project.screens[norm];
    zoomImg.src = scr.src;
    zoomImg.alt = `${project.tabTitle} — ${scr.label}`;
    zoomKicker.textContent = `${project.tabTitle} · PLATE ${pad2(norm + 1)} / ${pad2(total)} — ${scr.label}`;
    zoomCaption.textContent = scr.caption;
    zoomOverlay.hidden = false;
  };

  const closeZoom = () => {
    if (zoomOverlay) zoomOverlay.hidden = true;
  };

  zoomPrev?.addEventListener('click', () => openZoom(currentZoomIdx - 1));
  zoomNext?.addEventListener('click', () => openZoom(currentZoomIdx + 1));

  let lastInspectedIdx = 0;

  const updateInspector = (screenIdx: number) => {
    const project = PORTFOLIO_PROJECTS[currentProjectIdx];
    if (!project) return;
    const scr = project.screens[screenIdx];
    if (!scr || screenIdx === lastInspectedIdx) return;
    const dir: 1 | -1 = screenIdx > lastInspectedIdx ? 1 : -1;
    lastInspectedIdx = screenIdx;

    const numEl = contentHost.querySelector<HTMLElement>('#h51-insp-num');
    const tagEl = contentHost.querySelector<HTMLElement>('#h51-insp-tag');
    const title = contentHost.querySelector<HTMLElement>('#h51-insp-title');
    const desc = contentHost.querySelector<HTMLElement>('#h51-insp-desc');
    const openBtn = contentHost.querySelector<HTMLElement>('#h51-insp-open');
    morphSpeedingText(numEl, pad2(screenIdx + 1), { axis: 'y', direction: dir, durationMs: 320 });
    morphSpeedingText(tagEl, scr.tag, { axis: 'x', direction: dir, durationMs: 340 });
    if (title) title.textContent = scr.label;
    if (desc) desc.textContent = scr.caption;
    if (openBtn) openBtn.dataset.printIdx = String(screenIdx);
  };

  const syncWallPlaybackRate = (rate: number) => {
    contentHost.querySelectorAll<HTMLElement>('.h51-col-track').forEach((track) => {
      track.getAnimations().forEach((anim) => {
        try {
          anim.playbackRate = rate;
        } catch {
          // ignore
        }
      });
    });
  };

  const bindWallInteractions = () => {
    const heroStage = contentHost.querySelector<HTMLElement>('#h51-hero-stage');
    const wallViewport = contentHost.querySelector<HTMLElement>('#h51-wall-viewport');
    const wallPlane = contentHost.querySelector<HTMLElement>('#h51-wall-plane');
    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (wallViewport) {
      wallViewport.addEventListener('pointerenter', () => {
        if (!wallPaused && !reduced()) syncWallPlaybackRate(0.22);
      });
      wallViewport.addEventListener('pointerleave', () => {
        if (!wallPaused && !reduced()) syncWallPlaybackRate(1);
      });
    }

    // Update live inspector card whenever user hovers or focuses any print on the 3D wall
    contentHost.querySelectorAll<HTMLElement>('.h51-print-frame').forEach((frame) => {
      const idx = Number(frame.dataset.printIdx || '0');
      frame.addEventListener('pointerenter', () => updateInspector(idx));
      frame.addEventListener('focus', () => updateInspector(idx));
    });

    // Subtle 3D cursor-parallax depth on the receding perspective wall
    if (heroStage && wallPlane) {
      heroStage.addEventListener(
        'pointermove',
        (e) => {
          if (reduced()) return;
          const r = heroStage.getBoundingClientRect();
          const nx = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
          const ny = ((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1;
          targetTiltY = nx * 4.2;
          targetTiltX = -ny * 3.2;
        },
        { passive: true }
      );
      heroStage.addEventListener('pointerleave', () => {
        targetTiltX = 0;
        targetTiltY = 0;
      });
    }

    window.cancelAnimationFrame(tiltRaf);
    const stepTilt = () => {
      if (!dialog.open) return;
      curTiltX += (targetTiltX - curTiltX) * 0.08;
      curTiltY += (targetTiltY - curTiltY) * 0.08;
      if (wallPlane && !reduced()) {
        wallPlane.style.setProperty('--tilt-x', `${curTiltX.toFixed(2)}deg`);
        wallPlane.style.setProperty('--tilt-y', `${curTiltY.toFixed(2)}deg`);
      }
      tiltRaf = window.requestAnimationFrame(stepTilt);
    };
    tiltRaf = window.requestAnimationFrame(stepTilt);
  };

  const bindScrollStack = () => {
    stackCleanup?.();
    stackCleanup = null;

    const stackRoot = contentHost.querySelector<HTMLElement>('#h51-scroll-stack');
    const stackInner = contentHost.querySelector<HTMLElement>('#h51-scroll-stack-inner');
    const activeNumEl = contentHost.querySelector<HTMLElement>('#h51-stack-active-num');
    const topbarEl = contentHost.querySelector<HTMLElement>('#h51-topbar');
    const progressFillEl = contentHost.querySelector<HTMLElement>('#h51-scroll-progress-fill');
    const heroStageEl = contentHost.querySelector<HTMLElement>('#h51-hero-stage');
    const heroCopyEl = heroStageEl?.querySelector<HTMLElement>('.h51-copy-col') ?? null;
    const wallPlaneEl = contentHost.querySelector<HTMLElement>('#h51-wall-plane');
    if (!stackRoot || !stackInner) return;

    const slots = Array.from(stackInner.querySelectorAll<HTMLElement>('[data-stack-slot]'));
    if (!slots.length) return;

    const cards = slots.map((s) => s.querySelector<HTMLElement>('.h51-stack-card'));
    const shades = slots.map((s) => s.querySelector<HTMLElement>('.h51-stack-card__shade'));
    const cache = new Map<string, string>();
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let rafId = 0;
    let lastActivePlate = 0;

    const write = (key: string, val: string, apply: (v: string) => void) => {
      if (cache.get(key) === val) return;
      cache.set(key, val);
      apply(val);
    };

    const clamp = (min: number, v: number, max: number) => Math.max(min, Math.min(max, v));
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    const updateStack = () => {
      rafId = 0;
      if (!dialog.open) return;

      if (motionMq.matches) {
        if (heroCopyEl) {
          write('hc-tf', '', (v) => { heroCopyEl.style.transform = v; });
          write('hc-op', '', (v) => { heroCopyEl.style.opacity = v; });
        }
        if (wallPlaneEl) {
          write('wp-sy', '0px', (v) => { wallPlaneEl.style.setProperty('--scroll-shift-y', v); });
          write('wp-ry', '0deg', (v) => { wallPlaneEl.style.setProperty('--scroll-rot-y', v); });
          write('wp-rx', '0deg', (v) => { wallPlaneEl.style.setProperty('--scroll-rot-x', v); });
        }
        cards.forEach((card, i) => {
          if (!card) return;
          write(`tf-${i}`, '', (v) => { card.style.transform = v; });
          write(`op-${i}`, '1', (v) => { card.style.opacity = v; });
          write(`pe-${i}`, '', (v) => { card.style.pointerEvents = v; });
          const shade = shades[i];
          if (shade) write(`dm-${i}`, '0', (v) => { shade.style.opacity = v; });
        });
        return;
      }

      // 1. Live Modal Scroll Progress & State-Aware Topbar
      const scrollTop = dialog.scrollTop;
      const maxScroll = Math.max(1, dialog.scrollHeight - dialog.clientHeight);
      const totalP = clamp01(scrollTop / maxScroll);
      if (progressFillEl) {
        write('prog', `scaleX(${totalP.toFixed(4)})`, (v) => {
          progressFillEl.style.transform = v;
        });
      }
      if (topbarEl) {
        topbarEl.classList.toggle('is-stuck', scrollTop > 8);
      }

      // 2. Split Hero Foreground Copy & 3D Wall Scroll Parallax
      if (heroStageEl) {
        const heroH = Math.max(1, heroStageEl.offsetHeight);
        if (scrollTop <= heroH * 1.15) {
          const heroP = clamp01(scrollTop / (heroH * 0.88));
          if (heroCopyEl) {
            const copyY = -heroP * 64;
            const copySc = 1 - heroP * 0.036;
            const copyOp = Math.max(0.14, 1 - heroP * 0.86);
            write('hc-tf', `translate3d(0, ${copyY.toFixed(1)}px, 0) scale(${copySc.toFixed(4)})`, (v) => {
              heroCopyEl.style.transform = v;
            });
            write('hc-op', copyOp.toFixed(3), (v) => {
              heroCopyEl.style.opacity = v;
            });
          }
          if (wallPlaneEl) {
            write('wp-sy', `${(-heroP * 92).toFixed(1)}px`, (v) => {
              wallPlaneEl.style.setProperty('--scroll-shift-y', v);
            });
            write('wp-ry', `${(-heroP * 7.5).toFixed(2)}deg`, (v) => {
              wallPlaneEl.style.setProperty('--scroll-rot-y', v);
            });
            write('wp-rx', `${(heroP * 4.2).toFixed(2)}deg`, (v) => {
              wallPlaneEl.style.setProperty('--scroll-rot-x', v);
            });
          }
        }
      }

      const viewHeight = dialog.clientHeight || window.innerHeight;
      const viewTop = dialog.getBoundingClientRect().top + dialog.clientTop;
      const isMobile = window.innerWidth <= 720;
      const stackTop = Math.round(clamp(isMobile ? 86 : 108, viewHeight * 0.135, 138));
      write('stackTop', `${stackTop}px`, (v) => {
        stackRoot.style.setProperty('--stack-top', v);
      });

      const pinY = viewTop + stackTop;
      const heights = slots.map((slot) => slot.offsetHeight);
      const tops = slots.map((slot) => slot.getBoundingClientRect().top);

      // Accumulate exact stack depth as each subsequent card slides up over the pinned deck
      const depths = slots.map(() => 0);
      let frontIdx = 0;
      for (let j = 1; j < slots.length; j++) {
        const prevH = heights[j - 1];
        const span = Math.max(1, prevH * 0.9);
        const start = pinY + prevH * 0.95;
        const cover = clamp01((start - tops[j]) / span);
        if (cover > 0.45) frontIdx = j;
        for (let i = 0; i < j; i++) {
          depths[i] += cover;
        }
      }

      if (frontIdx !== lastActivePlate) {
        const dir: 1 | -1 = frontIdx > lastActivePlate ? 1 : -1;
        lastActivePlate = frontIdx;
        morphSpeedingText(activeNumEl, pad2(frontIdx + 1), { axis: 'y', direction: dir, durationMs: 300 });
      }

      const peekStep = isMobile ? 14 : 22;
      const itemScale = 0.046;
      const baseScale = 0.8;
      const dimStep = 0.16;

      slots.forEach((_, i) => {
        const card = cards[i];
        const shade = shades[i];
        if (!card) return;

        const depth = depths[i];
        if (depth < 0.001) {
          write(`tf-${i}`, '', (v) => { card.style.transform = v; });
          write(`op-${i}`, '1', (v) => { card.style.opacity = v; });
          write(`pe-${i}`, '', (v) => { card.style.pointerEvents = v; });
          if (shade) write(`dm-${i}`, '0', (v) => { shade.style.opacity = v; });
          return;
        }

        const clampedPeekDepth = Math.min(depth, 3.6);
        const peekY = -clampedPeekDepth * peekStep;
        const scale = Math.max(baseScale, 1 - depth * itemScale);
        const tilt = -Math.min(depth, 1.35) * 2.1;
        const dim = 1 - Math.pow(1 - dimStep, depth);

        // Smoothly fade buried cards away once 2+ newer cards stack over them
        const fadeProgress = clamp01((depth - 2.15) / 1.45);
        const smoothFade = 1 - fadeProgress * fadeProgress * (3 - 2 * fadeProgress);

        const tf = `perspective(1200px) translate3d(0, ${peekY.toFixed(1)}px, 0) rotateX(${tilt.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        const op = smoothFade.toFixed(3);
        const pe = smoothFade < 0.05 ? 'none' : '';

        write(`tf-${i}`, tf, (v) => { card.style.transform = v; });
        write(`op-${i}`, op, (v) => { card.style.opacity = v; });
        write(`pe-${i}`, pe, (v) => { card.style.pointerEvents = v; });
        if (shade) write(`dm-${i}`, dim.toFixed(3), (v) => { shade.style.opacity = v; });
      });
    };

    const schedule = () => {
      if (!rafId) rafId = window.requestAnimationFrame(updateStack);
    };

    const depthsAtFocus = (targetIdx: number): number => {
      const viewHeight = dialog.clientHeight || window.innerHeight;
      const viewTop = dialog.getBoundingClientRect().top + dialog.clientTop;
      const stackTop = Math.round(clamp(window.innerWidth <= 720 ? 86 : 108, viewHeight * 0.135, 138));
      const pinY = viewTop + stackTop;
      let d = 0;
      for (let j = targetIdx + 1; j < slots.length; j++) {
        const prevH = slots[j - 1].offsetHeight;
        const cover = clamp01((pinY + prevH * 0.95 - slots[j].getBoundingClientRect().top) / Math.max(1, prevH * 0.9));
        d += cover;
      }
      return d;
    };

    // Keyboard accessibility: if a user tabs into an earlier buried slot, scroll it cleanly to depth 0
    const focusHandlers: Array<() => void> = [];
    slots.forEach((slot, idx) => {
      const onFocusIn = () => {
        if (motionMq.matches || depthsAtFocus(idx) < 0.5) return;
        const innerTopInDialog =
          stackInner.getBoundingClientRect().top -
          (dialog.getBoundingClientRect().top + dialog.clientTop) +
          dialog.scrollTop;
        let offsetBefore = 0;
        for (let k = 0; k < idx; k++) {
          const spacerEl = slots[k].nextElementSibling as HTMLElement | null;
          const spacerH = spacerEl?.classList.contains('h51-stack-spacer') ? spacerEl.offsetHeight : 0;
          offsetBefore += slots[k].offsetHeight + spacerH;
        }
        const viewHeight = dialog.clientHeight || window.innerHeight;
        const stackTop = Math.round(clamp(window.innerWidth <= 720 ? 86 : 108, viewHeight * 0.135, 138));
        dialog.scrollTo({ top: Math.max(0, innerTopInDialog + offsetBefore - stackTop), behavior: 'smooth' });
      };
      slot.addEventListener('focusin', onFocusIn);
      focusHandlers.push(() => slot.removeEventListener('focusin', onFocusIn));
    });

    const ro = new ResizeObserver(schedule);
    ro.observe(dialog);
    ro.observe(stackInner);
    dialog.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    motionMq.addEventListener('change', schedule);
    updateStack();

    stackCleanup = () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      dialog.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      motionMq.removeEventListener('change', schedule);
      focusHandlers.forEach((fn) => fn());
    };
  };

  const renderProject = (idx: number) => {
    const count = PORTFOLIO_PROJECTS.length;
    currentProjectIdx = ((idx % count) + count) % count;
    lastInspectedIdx = 0;
    closeZoom();
    contentHost.innerHTML = buildHero51ProjectMarkup(currentProjectIdx, wallPaused);
    dialog.scrollTop = 0;
    targetTiltX = 0;
    targetTiltY = 0;
    curTiltX = 0;
    curTiltY = 0;
    const heroTitleEl = contentHost.querySelector<HTMLElement>('#lr-dialog-title');
    if (heroTitleEl) splitHeadingForScroll(heroTitleEl);
    pageScrollCleanup?.();
    pageScrollCleanup = enhanceScrollTypographyAndSections(contentHost, dialog);
    bindWallInteractions();
    bindScrollStack();

    // Streak-reveal hero KPIs immediately and module numbers as they scroll into view
    contentHost.querySelectorAll<HTMLElement>('.h51-kpi-card strong').forEach((el, kIdx) => {
      streakRevealElement(el, { axis: 'x', delayMs: 80 + kIdx * 55, durationMs: 420 });
    });

    const modBadges = Array.from(contentHost.querySelectorAll<HTMLElement>('.h51-mod-num'));
    if (modBadges.length) {
      const modIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              modIo.unobserve(entry.target);
              streakRevealElement(entry.target as HTMLElement, { axis: 'x', durationMs: 380 });
            }
          });
        },
        { root: dialog, threshold: 0.25 }
      );
      modBadges.forEach((b) => modIo.observe(b));
      const prevCleanup = pageScrollCleanup;
      pageScrollCleanup = () => {
        modIo.disconnect();
        prevCleanup?.();
      };
    }
  };

  const openProject = (idx: number) => {
    dialog.removeAttribute('data-closing');
    if (!dialog.open) {
      dialog.showModal();
    }
    renderProject(idx);
  };

  const close = () => {
    closeZoom();
    window.cancelAnimationFrame(tiltRaf);
    stackCleanup?.();
    stackCleanup = null;
    pageScrollCleanup?.();
    pageScrollCleanup = null;
    dialog.returnValue = '';
    void closeTopLayer(dialog);
  };

  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    if (zoomOverlay && !zoomOverlay.hidden) {
      closeZoom();
      return;
    }
    close();
  });

  dialog.addEventListener('keydown', (e) => {
    if (zoomOverlay && !zoomOverlay.hidden) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        openZoom(currentZoomIdx - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        openZoom(currentZoomIdx + 1);
      }
    }
  });

  dialog.addEventListener('close', () => {
    window.cancelAnimationFrame(tiltRaf);
    stackCleanup?.();
    stackCleanup = null;
    pageScrollCleanup?.();
    pageScrollCleanup = null;
    dialog.returnValue = '';
  });

  dialog.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    if (target.closest('[data-zoom-close]')) {
      closeZoom();
      return;
    }

    const printTrigger = target.closest<HTMLElement>('[data-print-idx]');
    if (printTrigger) {
      const pIdx = Number(printTrigger.dataset.printIdx || '0');
      openZoom(pIdx);
      return;
    }

    if (target.closest('#h51-wall-pause-btn')) {
      wallPaused = !wallPaused;
      const pauseBtn = contentHost.querySelector<HTMLButtonElement>('#h51-wall-pause-btn');
      if (pauseBtn) {
        // Per modern-web-guidance `motion`: when label switches between Pause and Play, omit aria-pressed
        pauseBtn.setAttribute(
          'aria-label',
          wallPaused ? 'Play gallery wall motion' : 'Pause gallery wall motion'
        );
        pauseBtn.innerHTML = `<span aria-hidden="true">${wallPaused ? '&#9654;' : '&#10074;&#10074;'}</span><span>${wallPaused ? 'Play wall' : 'Pause wall'}</span>`;
      }
      contentHost.querySelectorAll<HTMLElement>('.h51-col-track').forEach((tr) => {
        tr.classList.toggle('is-paused', wallPaused);
      });
      if (!wallPaused) syncWallPlaybackRate(1);
      return;
    }

    if (target.closest('[data-lr-close]')) {
      close();
      return;
    }

    const switchBtn = target.closest<HTMLElement>('[data-lr-switch]');
    if (switchBtn) {
      const nextIdx = Number(switchBtn.dataset.lrSwitch || '0');
      renderProject(nextIdx);
      return;
    }

    if (target.closest('[data-lr-scroll-info]')) {
      const infoEl = dialog.querySelector<HTMLElement>('#lr-information-block');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      infoEl?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      return;
    }

    const startBtn = target.closest<HTMLElement>('[data-lr-start-project]');
    if (startBtn) {
      dialog.close();
      onRequestAudit(startBtn);
    }
  });

  document.querySelectorAll<HTMLElement>('[data-open-lr-project]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.openLrProject || '0');
      openProject(idx);
    });
  });

  return {
    openProject,
    close,
  };
}
