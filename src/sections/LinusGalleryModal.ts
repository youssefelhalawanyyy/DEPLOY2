import { PORTFOLIO_PROJECTS, type PortfolioProject, type PortfolioScreen } from './ServicesStack';
import { SITE_CONFIG } from '../config/siteConfig';
import { morphSpeedingText, streakRevealElement } from '../effects/SpeedingText';

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

  const col1 = buildWallColumnItems(project, 0, 5);
  const col2 = buildWallColumnItems(project, 2, 5);
  const col3 = buildWallColumnItems(project, 4, 5);

  const renderPrintCard = (item: { screen: PortfolioScreen; sIdx: number }, isClone: boolean) => `
    <button
      type="button"
      class="h51-print-frame ${project.renderMode === 'poster' ? 'is-poster-print' : 'is-wide-print'}"
      data-print-idx="${item.sIdx}"
      ${isClone ? 'tabindex="-1" aria-hidden="true"' : `aria-label="Inspect print ${pad2(item.sIdx + 1)}: ${item.screen.label}"`}
    >
      <div class="h51-print-mat">
        <div class="h51-print-art">
          <img
            src="${item.screen.webp || item.screen.src}"
            alt="${isClone ? '' : `${project.tabTitle} — ${item.screen.label}`}"
            loading="lazy"
            decoding="async"
            draggable="false"
          />
        </div>
        <div class="h51-print-plaque">
          <span class="h51-plaque-title">FIG. ${pad2(item.sIdx + 1)} &mdash; ${item.screen.label}</span>
          <span class="h51-plaque-tag">${item.screen.tag}</span>
        </div>
      </div>
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
    <!-- Sticky Studio Top Bar -->
    <header class="h51-topbar">
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

        <!-- Live Interactive Print Inspector Readout (syncs on wall hover/focus) -->
        <div class="h51-stagger h51-s5 h51-inspector-card" id="h51-inspector-card">
          <div class="h51-insp-top">
            <span class="h51-insp-badge" id="h51-insp-badge">PRINT <span id="h51-insp-num" data-spd-value="01">01</span> / ${pad2(project.screens.length)} &middot; <span id="h51-insp-tag" data-spd-value="${firstScreen.tag}">${firstScreen.tag}</span></span>
            <button type="button" class="h51-insp-zoom-btn" id="h51-insp-open" data-print-idx="0">
              Expand print &#8599;
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

      <!-- Right Column: Gallery Wall of Matted Prints Receding in 3D Perspective -->
      <div class="h51-wall-viewport" id="h51-wall-viewport">
        <div class="h51-wall-spotlight" aria-hidden="true"></div>
        <div class="h51-wall-mask">
          <div class="h51-wall-plane" id="h51-wall-plane">
            ${renderColumn(col1, 1)}
            ${renderColumn(col2, 2)}
            ${renderColumn(col3, 3)}
          </div>
        </div>
        <div class="h51-wall-caption-pill" aria-hidden="true">
          <span>3D PERSPECTIVE GALLERY WALL &middot; HOVER OR CLICK ANY PRINT TO INSPECT</span>
        </div>
      </div>
    </section>

    <!-- SECTION 2: ARCHITECTURAL DEEP DIVE & TRANSFORMATION -->
    <section class="h51-deepdive-section" id="lr-information-block">
      <div class="h51-container">
        <div class="h51-transformation-grid">
          <div class="h51-trans-card is-challenge">
            <span class="h51-sec-kicker">01 &middot; THE BOTTLENECK</span>
            <h2>What held operations back</h2>
            <p>${project.challenge}</p>
          </div>

          <div class="h51-trans-arrow" aria-hidden="true">&rarr;</div>

          <div class="h51-trans-card is-solution">
            <span class="h51-sec-kicker">02 &middot; ENGINEERED OUTCOME</span>
            <h2>Unified production architecture</h2>
            <p>${project.summary}</p>
            <ul class="h51-stack-row" aria-label="Production stack">
              ${project.stack.map((s) => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- 4 Engineered Subsystems Bento -->
        <div class="h51-modules-block">
          <div class="h51-section-head">
            <span class="h51-sec-kicker">03 &middot; CORE SUBSYSTEMS</span>
            <h2>Engineered from database schema to pixel.</h2>
          </div>

          <div class="h51-modules-grid">
            ${project.features
              .map(
                (feat, fIdx) => `
              <article class="h51-module-card">
                <div class="h51-mod-top">
                  <span class="h51-mod-num">MODULE ${pad2(fIdx + 1)}</span>
                  <span class="h51-mod-check" aria-hidden="true">&#10003;</span>
                </div>
                <h3>${feat.title}</h3>
                <p>${feat.detail}</p>
              </article>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Complete Annotated Screen Exhibition Grid -->
        <div class="h51-screens-block">
          <div class="h51-section-head">
            <span class="h51-sec-kicker">04 &middot; COMPLETE EXHIBITION (${project.screens.length} PLATES)</span>
            <h2>Every production screen, annotated.</h2>
          </div>

          <div class="h51-plates-grid ${project.renderMode === 'poster' ? 'is-poster-grid' : ''}">
            ${project.screens
              .map(
                (scr, sIdx) => `
              <article class="h51-plate-card">
                <button
                  type="button"
                  class="h51-plate-media"
                  data-print-idx="${sIdx}"
                  aria-label="Zoom ${scr.label}"
                >
                  <img
                    src="${scr.src}"
                    alt="${project.tabTitle} — ${scr.label}"
                    loading="lazy"
                    decoding="async"
                  />
                  <span class="h51-plate-zoom-chip">Click to zoom &#8599;</span>
                </button>
                <div class="h51-plate-meta">
                  <div class="h51-plate-meta-top">
                    <span class="h51-plate-idx">PLATE ${pad2(sIdx + 1)}</span>
                    <span class="h51-plate-tag">${scr.tag}</span>
                  </div>
                  <h3>${scr.label}</h3>
                  <p>${scr.caption}</p>
                </div>
              </article>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Bottom Launch & Next Project Banner -->
        <footer class="h51-bottom-banner">
          <div>
            <span class="h51-sec-kicker">DEPLOY SOFTWARE ENGINEERING &middot; ${SITE_CONFIG.brand.email}</span>
            <h2>We build, you lead. Ready to ship yours?</h2>
          </div>
          <div class="h51-bottom-actions">
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
    bindWallInteractions();
    contentHost.querySelectorAll<HTMLElement>('.h51-kpi-card strong').forEach((el, kIdx) => {
      streakRevealElement(el, { axis: 'x', delayMs: 80 + kIdx * 55, durationMs: 420 });
    });
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
