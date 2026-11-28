export interface PortfolioScreen {
  label: string;
  src: string;
  webp?: string;
}

export interface PortfolioProject {
  id: string;
  code: string;
  indexLabel: string;
  title: string;
  body: string;
  bullets: string[];
  screens: PortfolioScreen[];
}

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'enterprise-erp',
    code: '§ 01 — ENTERPRISE ERP',
    indexLabel: '01 / 03',
    title: 'Retail Operations & AI Hub.',
    body: 'Multi-branch vault telemetry, payroll & AI copilot.',
    bullets: ['FIRESTORE LIVE', 'AI COPILOT', 'PAYROLL & HR', 'EN / AR'],
    screens: [
      { label: 'Dashboard', src: './portfolio/anh/dashboard.png', webp: './portfolio/anh/dashboard-640.webp' },
      { label: 'AI Copilot', src: './portfolio/anh/ai-assistant.png' },
      { label: 'Revenue Trend', src: './portfolio/anh/revenue-trend.png', webp: './portfolio/anh/revenue-trend-640.webp' },
      { label: 'Safe Report', src: './portfolio/anh/safe-report.png' },
      { label: 'Products', src: './portfolio/anh/products.png', webp: './portfolio/anh/products-640.webp' },
      { label: 'Payroll', src: './portfolio/anh/payroll.png' },
      { label: 'Employees', src: './portfolio/anh/employees.png' },
      { label: 'Payments', src: './portfolio/anh/payments.png' },
      { label: 'Returns', src: './portfolio/anh/supplier-returns.png' },
      { label: 'Store Ops', src: './portfolio/anh/cleaning.png' },
    ],
  },
  {
    id: 'armia-boutique',
    code: '§ 02 — LUXURY E-COMMERCE',
    indexLabel: '02 / 03',
    title: 'Armia Boutique & PWA.',
    body: 'Shop-the-Look storefront, installable PWA & admin.',
    bullets: ['HOTSPOT LOOKBOOK', 'INSTALLABLE PWA', 'SLIDE CART', 'ADMIN SUITE'],
    screens: [
      { label: 'Storefront', src: './portfolio/armia/storefront-home.png', webp: './portfolio/armia/storefront-home-1024.webp' },
      { label: 'Collections', src: './portfolio/armia/collections.png', webp: './portfolio/armia/collections-640.webp' },
      { label: 'Cart Drawer', src: './portfolio/armia/cart-drawer.png' },
      { label: 'Checkout', src: './portfolio/armia/checkout.png', webp: './portfolio/armia/checkout-640.webp' },
      { label: 'Admin Portal', src: './portfolio/armia/admin-portal.png' },
    ],
  },
  {
    id: 'fb-pos',
    code: '§ 03 — F&B POS SAAS',
    indexLabel: '03 / 03',
    title: 'Hospitality POS & Kitchen.',
    body: 'Touch POS terminal, recipe stock & live analytics.',
    bullets: ['TOUCH POS', 'LIVE VELOCITY', 'RECIPE STOCK', 'LOYALTY CRM'],
    screens: [
      { label: 'Dashboard', src: './portfolio/fb-pos/dashboard.png' },
      { label: 'POS Terminal', src: './portfolio/fb-pos/pos-terminal.png', webp: './portfolio/fb-pos/pos-terminal-480.webp' },
      { label: 'Inventory', src: './portfolio/fb-pos/inventory.png', webp: './portfolio/fb-pos/inventory-480.webp' },
      { label: 'Customers', src: './portfolio/fb-pos/customers.png' },
      { label: 'Staff Login', src: './portfolio/fb-pos/login.png' },
    ],
  },
];

// Deterministic PRNG (mulberry32) matching DraggableGrid
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fillAndShuffle<T>(items: T[], target: number, seed: number): T[] {
  if (items.length === 0) return [];
  const rand = mulberry32(seed);
  const out: T[] = [];
  const refill = () => {
    const pool = items.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  };
  let pool = refill();
  while (out.length < target) {
    if (pool.length === 0) pool = refill();
    const next = pool.pop()!;
    if (out.length > 0 && next === out[out.length - 1] && pool.length > 0) {
      const swap = pool.pop()!;
      out.push(swap);
      pool.push(next);
    } else {
      out.push(next);
    }
  }
  return out;
}

const GRID_COLS = 6;
const GRID_ROWS = 6;
const TILE_W = 210;
const TILE_H = 150;
const TILE_GAP = 14;
const TILE_RADIUS = 12;

export interface ServicesController {
  update: () => void;
}

export function renderServicesHTML(): string {
  const gridW = GRID_COLS * TILE_W + (GRID_COLS - 1) * TILE_GAP;
  const gridH = GRID_ROWS * TILE_H + (GRID_ROWS - 1) * TILE_GAP;

  return `
    <section id="services" class="services-section" aria-labelledby="services-heading">
      <div class="container">
        <header class="section-header-light">
          <div class="eyebrow">PORTFOLIO</div>
          <h2 id="services-heading" class="section-title-xl">
            Selected builds.
          </h2>
          <p class="section-lead">
            Drag to explore &middot; Click any screen to expand.
          </p>
        </header>

        <div class="services-stack">
          ${PORTFOLIO_PROJECTS.map((project, index) => {
            const cells = fillAndShuffle(project.screens, GRID_COLS * GRID_ROWS, 0xc0ffee + index * 97);
            return `
            <article class="service-card portfolio-card" data-project-idx="${index}" style="--stack-index:${index}">
              <div class="service-card-bar">
                <span class="service-code-pill">${project.code}</span>
                <span class="service-index">${project.indexLabel}</span>
              </div>
              <div class="service-card-grid portfolio-card-grid">
                <div class="service-card-copy">
                  <div>
                    <h3 class="service-card-title">${project.title}</h3>
                    <p class="service-card-body">${project.body}</p>
                  </div>
                  <ul class="service-tag-pills">
                    ${project.bullets.map((b) => `<li>${b}</li>`).join('')}
                  </ul>
                </div>

                <div class="portfolio-drag-shell" data-drag-viewer="${index}">
                  <div class="pd-hud-bar">
                    <span class="pd-hud-title">DRAG TO EXPLORE &middot; ${project.screens.length} SCREENS</span>
                    <span class="pd-hud-hint">CLICK TILE TO EXPAND</span>
                  </div>
                  <div class="pd-viewport" tabindex="0" aria-label="Draggable screenshot gallery for ${project.title}">
                    <div
                      class="pd-grid"
                      style="width:${gridW}px;height:${gridH}px;grid-template-columns:repeat(${GRID_COLS},${TILE_W}px);grid-auto-rows:${TILE_H}px;gap:${TILE_GAP}px;"
                    >
                      ${cells
                        .map(
                          (screen) => `
                        <div
                          class="pd-tile"
                          data-src="${screen.src}"
                          data-label="${screen.label}"
                          style="width:${TILE_W}px;height:${TILE_H}px;border-radius:${TILE_RADIUS}px;"
                        >
                          <img
                            src="${screen.webp || screen.src}"
                            alt="${project.title} — ${screen.label}"
                            draggable="false"
                            loading="lazy"
                          />
                          <span class="pd-tile-label">${screen.label}</span>
                        </div>
                      `
                        )
                        .join('')}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          `;
          }).join('')}
        </div>
      </div>

      <!-- Full-screen Portfolio Lightbox -->
      <dialog id="portfolio-lightbox" class="zeroth-dialog portfolio-lightbox" aria-label="Project screenshot preview">
        <div class="lightbox-panel">
          <div class="lightbox-header">
            <span id="lightbox-caption" class="lightbox-caption"></span>
            <button type="button" class="dialog-close" id="lightbox-close" aria-label="Close preview">&times;</button>
          </div>
          <img id="lightbox-img" class="lightbox-img" src="" alt="" />
        </div>
      </dialog>
    </section>
  `;
}

export function initServicesStack(section: HTMLElement): ServicesController {
  const lightbox = section.querySelector<HTMLDialogElement>('#portfolio-lightbox');
  const lightboxImg = section.querySelector<HTMLImageElement>('#lightbox-img');
  const lightboxCaption = section.querySelector<HTMLElement>('#lightbox-caption');
  const lightboxClose = section.querySelector<HTMLButtonElement>('#lightbox-close');

  lightboxClose?.addEventListener('click', () => lightbox?.close());
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.close();
  });

  const gridW = GRID_COLS * TILE_W + (GRID_COLS - 1) * TILE_GAP;
  const gridH = GRID_ROWS * TILE_H + (GRID_ROWS - 1) * TILE_GAP;
  const clamp = (v: number, mn: number, mx: number) => Math.min(Math.max(v, mn), mx);

  const shells = Array.from(section.querySelectorAll<HTMLElement>('.portfolio-drag-shell'));

  shells.forEach((shell) => {
    const pIdx = Number(shell.dataset.dragViewer || '0');
    const project = PORTFOLIO_PROJECTS[pIdx];
    const viewport = shell.querySelector<HTMLElement>('.pd-viewport');
    const grid = shell.querySelector<HTMLElement>('.pd-grid');
    if (!project || !viewport || !grid) return;

    let vw = viewport.clientWidth || 620;
    let vh = viewport.clientHeight || 420;
    let minX = Math.min(TILE_GAP, vw - gridW - TILE_GAP);
    let maxX = TILE_GAP;
    let minY = Math.min(TILE_GAP, vh - gridH - TILE_GAP);
    let maxY = TILE_GAP;

    let posX = maxX;
    let posY = maxY;
    let velX = 0;
    let velY = 0;
    let dragging = false;
    let pointerId: number | null = null;
    let startClientX = 0;
    let startClientY = 0;
    let lastClientX = 0;
    let lastClientY = 0;
    let lastTime = 0;
    let downTile: HTMLElement | null = null;
    let momentumRaf = 0;

    const applyTransform = () => {
      grid.style.transform = `translate3d(${posX.toFixed(2)}px, ${posY.toFixed(2)}px, 0)`;
    };

    const updateBounds = () => {
      vw = viewport.clientWidth || 620;
      vh = viewport.clientHeight || 420;
      minX = Math.min(TILE_GAP, vw - gridW - TILE_GAP);
      maxX = TILE_GAP;
      minY = Math.min(TILE_GAP, vh - gridH - TILE_GAP);
      maxY = TILE_GAP;
      posX = clamp(posX, minX, maxX);
      posY = clamp(posY, minY, maxY);
      applyTransform();
    };

    updateBounds();
    const ro = new ResizeObserver(updateBounds);
    ro.observe(viewport);

    const stepMomentum = () => {
      if (dragging) return;
      posX = clamp(posX + velX, minX, maxX);
      posY = clamp(posY + velY, minY, maxY);
      velX *= 0.92;
      velY *= 0.92;
      applyTransform();
      if (Math.abs(velX) > 0.25 || Math.abs(velY) > 0.25) {
        momentumRaf = window.requestAnimationFrame(stepMomentum);
      } else {
        velX = 0;
        velY = 0;
      }
    };

    viewport.addEventListener('pointerdown', (e) => {
      window.cancelAnimationFrame(momentumRaf);
      dragging = true;
      pointerId = e.pointerId;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(e.pointerId);
      startClientX = e.clientX;
      startClientY = e.clientY;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      lastTime = performance.now();
      velX = 0;
      velY = 0;
      downTile = (e.target as HTMLElement | null)?.closest<HTMLElement>('.pd-tile') || null;
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = e.clientX - lastClientX;
      const dy = e.clientY - lastClientY;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      lastTime = now;

      posX = clamp(posX + dx, minX, maxX);
      posY = clamp(posY + dy, minY, maxY);
      // Track velocity normalized to ~16ms frame
      velX = (dx / dt) * 16;
      velY = (dy / dt) * 16;
      applyTransform();
    });

    const endDrag = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pointerId) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      try {
        viewport.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      pointerId = null;

      const moved = Math.hypot(e.clientX - startClientX, e.clientY - startClientY);
      if (moved < 5 && downTile) {
        const fullSrc = downTile.dataset.src || '';
        const label = downTile.dataset.label || '';
        if (fullSrc && lightbox && lightboxImg && lightboxCaption) {
          lightboxImg.src = fullSrc;
          lightboxImg.alt = `${project.title} — ${label}`;
          lightboxCaption.textContent = `${project.title} · ${label}`;
          if (!lightbox.open) lightbox.showModal();
        }
      } else if (Math.hypot(velX, velY) > 0.6) {
        momentumRaf = window.requestAnimationFrame(stepMomentum);
      }
      downTile = null;
    };

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    // Subtle kinetic auto-drift when visible & untouched (pauses instantly on hover/touch)
    let hovered = false;
    let inView = false;
    viewport.addEventListener('pointerenter', () => {
      hovered = true;
    });
    viewport.addEventListener('pointerleave', () => {
      hovered = false;
    });
    const visIo = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0.15 }
    );
    visIo.observe(viewport);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let driftPhase = pIdx * 2.1;
    const tickDrift = () => {
      window.requestAnimationFrame(tickDrift);
      if (!inView || dragging || hovered || Math.hypot(velX, velY) > 0.3 || reduced.matches) return;
      driftPhase += 0.008;
      posX = clamp(posX + Math.cos(driftPhase) * 0.42, minX, maxX);
      posY = clamp(posY + Math.sin(driftPhase * 0.75) * 0.32, minY, maxY);
      applyTransform();
    };
    window.requestAnimationFrame(tickDrift);
  });

  return {
    update: () => {},
  };
}
