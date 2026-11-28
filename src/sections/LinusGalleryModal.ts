import { PORTFOLIO_PROJECTS } from './ServicesStack';
import { SITE_CONFIG } from '../config/siteConfig';

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
    <dialog id="lr-project-dialog" class="lr-dialog" aria-labelledby="lr-dialog-title">
      <div class="lr-canvas" id="lr-canvas-scroll">
        <div id="lr-dialog-content"></div>
      </div>
    </dialog>
  `;
}

function buildProjectGalleryMarkup(projectIdx: number): string {
  const count = PORTFOLIO_PROJECTS.length;
  const normIdx = ((projectIdx % count) + count) % count;
  const project = PORTFOLIO_PROJECTS[normIdx];
  const nextIdx = (normIdx + 1) % count;
  const nextProject = PORTFOLIO_PROJECTS[nextIdx];

  const switcherHTML = PORTFOLIO_PROJECTS.map(
    (p, idx) => `
      <button
        type="button"
        class="lr-switch-item ${idx === normIdx ? 'is-active' : ''}"
        data-lr-switch="${idx}"
      >${p.tabNum} ${p.tabTitle}</button>
    `
  ).join('');

  const platesHTML = project.screens
    .map((scr, sIdx) => {
      const bandClass = sIdx % 2 === 0 ? 'lr-band-gallery' : 'lr-band-plinth';
      const imgClass = project.renderMode === 'poster' ? 'lr-plate-img is-portrait-plate' : 'lr-plate-img';
      return `
        <section class="lr-project-plate">
          <div class="lr-header-label">
            <div class="lr-line-medium">${project.tabTitle}</div>
            <div class="lr-line-medium">${pad2(sIdx + 1)} &mdash; ${scr.label}</div>
            <div class="lr-line-regular lr-desc-limit">${scr.caption}</div>
          </div>

          <figure class="lr-fullbleed-figure">
            <img
              class="${imgClass}"
              src="${scr.src}"
              alt="${project.tabTitle} — ${scr.label}"
              loading="${sIdx === 0 ? 'eager' : 'lazy'}"
              decoding="async"
            />
          </figure>

          <div class="lr-footer-label">
            <div class="lr-line-regular">2025&ndash;2026</div>
            <div class="lr-line-regular">DEPLOY Software Engineering</div>
          </div>
        </section>
        <div class="lr-section-band ${bandClass}" aria-hidden="true"></div>
      `;
    })
    .join('');

  const indexEntries = [
    ...project.features.map((f) => ({
      title: f.title,
      sub: f.detail,
    })),
    ...project.metrics.map((m) => ({
      title: `${m.value} — ${m.label}`,
      sub: project.statusPill,
    })),
    {
      title: 'Production Stack',
      sub: project.stack.join(', '),
    },
  ];

  const writingIndexHTML = indexEntries
    .map(
      (entry) => `
      <div class="lr-index-entry">
        <div class="lr-index-title">${entry.title}</div>
        <div class="lr-index-sub">${entry.sub}</div>
      </div>
    `
    )
    .join('');

  return `
    <!-- Top Editorial Exhibition Intro -->
    <header class="lr-top-bar">
      <div class="lr-header-label">
        <div class="lr-line-medium">DEPLOY &mdash; We Build, You Lead</div>
        <h1 id="lr-dialog-title" class="lr-h1-title">${project.title}</h1>
        <div class="lr-line-regular lr-desc-wide">${project.summary}</div>
      </div>

      <div class="lr-controls-strip">
        <div class="lr-switcher-group" role="group" aria-label="Switch case study">
          ${switcherHTML}
        </div>
        <div class="lr-actions-group">
          <button type="button" class="lr-filled-btn" data-lr-scroll-info>Information</button>
          <button type="button" class="lr-filled-btn" data-lr-start-project>Start a project</button>
          <button type="button" class="lr-filled-btn" data-lr-close autofocus>Close</button>
        </div>
      </div>
    </header>

    <div class="lr-section-band lr-band-gallery" aria-hidden="true"></div>

    <!-- Continuous Vertical Scroll of Full-Bleed Project Plates -->
    ${platesHTML}

    <!-- Carbon Black (#0a0a0a) Architecture & Specifications Index -->
    <section class="lr-dark-block" id="lr-information-block" aria-labelledby="lr-arch-label">
      <h2 id="lr-arch-label" class="lr-section-label is-on-dark">Architecture</h2>
      <div class="lr-index-grid">
        ${writingIndexHTML}
      </div>
    </section>

    <div class="lr-section-band lr-band-plinth" aria-hidden="true"></div>

    <!-- Gallery Gray (#e5e5e5) Editorial Notes & Colophon Footer -->
    <footer class="lr-about-footer">
      <div class="lr-section-label">Notes</div>
      <p class="lr-about-prose">
        ${project.challenge} ${project.summary} Engineered end-to-end by DEPLOY (${SITE_CONFIG.brand.email}) with 100% client code ownership. We build, you lead.
      </p>
      <div class="lr-footer-actions">
        <button type="button" class="lr-filled-btn" data-lr-start-project>${project.ctaLabel}</button>
        <button type="button" class="lr-filled-btn" data-lr-switch="${nextIdx}">Next: ${nextProject.tabTitle}</button>
        <button type="button" class="lr-filled-btn" data-lr-close>Back to portfolio</button>
      </div>
    </footer>
  `;
}

export function initLinusGalleryModal(
  onRequestAudit: (triggerEl?: HTMLElement | null) => void
): LinusGalleryController {
  const dialog = document.getElementById('lr-project-dialog') as HTMLDialogElement | null;
  const contentHost = document.getElementById('lr-dialog-content');

  if (!dialog || !contentHost) {
    return { openProject: () => {}, close: () => {} };
  }

  const renderProject = (idx: number) => {
    contentHost.innerHTML = buildProjectGalleryMarkup(idx);
    dialog.scrollTop = 0;
  };

  const openProject = (idx: number) => {
    renderProject(idx);
    dialog.removeAttribute('data-closing');
    if (!dialog.open) {
      dialog.showModal();
    }
    dialog.scrollTop = 0;
  };

  const close = () => {
    dialog.returnValue = '';
    void closeTopLayer(dialog);
  };

  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });

  dialog.addEventListener('close', () => {
    dialog.returnValue = '';
  });

  dialog.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

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
