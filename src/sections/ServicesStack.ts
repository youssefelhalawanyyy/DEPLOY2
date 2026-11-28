export interface PortfolioScreen {
  label: string;
  tag: string;
  caption: string;
  src: string;
  webp?: string;
}

export interface PortfolioMetric {
  value: string;
  label: string;
}

export interface PortfolioFeature {
  title: string;
  detail: string;
}

export interface PortfolioProject {
  id: string;
  tabNum: string;
  tabTitle: string;
  tabSub: string;
  code: string;
  statusPill: string;
  title: string;
  summary: string;
  challenge: string;
  renderMode: 'framed-ui' | 'poster';
  posterTheme: 'erp' | 'atelier' | 'pos';
  rotationDirection: 'left' | 'right';
  duration: number;
  metrics: PortfolioMetric[];
  features: PortfolioFeature[];
  stack: string[];
  ctaLabel: string;
  screens: PortfolioScreen[];
}

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'enterprise-erp',
    tabNum: '01',
    tabTitle: 'Enterprise Retail ERP',
    tabSub: 'Company System · AI Hub',
    code: '§ 01 — MULTI-BRANCH ENTERPRISE ERP',
    statusPill: 'PRODUCTION LIVE · 31 MODULES',
    title: 'Multi-Branch Franchise ERP & AI Command Hub.',
    summary:
      'Replaced 14 disconnected spreadsheets and manual shift reports with one real-time cloud operating system governing daily safe drops, bank settlements, expiry alerts, HR payroll, and a bilingual AI manager copilot.',
    challenge:
      'Multi-location retail branches faced delayed cash-float reconciliation, unverified register voids, near-expiry inventory shrinkage, and slow end-of-month payroll calculations spread across isolated files.',
    renderMode: 'framed-ui',
    posterTheme: 'erp',
    rotationDirection: 'left',
    duration: 36,
    metrics: [
      { value: '31', label: 'Integrated Dept. Tools' },
      { value: 'Live', label: 'Firestore Vault Sync' },
      { value: 'EN / AR', label: 'Bilingual AI & UI' },
      { value: '100%', label: 'Shift Audit Trail' },
    ],
    features: [
      {
        title: 'Real-Time Safe & Bank Vaults',
        detail: 'Live cashier float verification, safe-drop reconciliation, bank deposit tracking, and audited void clearance.',
      },
      {
        title: 'Bilingual GPT Manager Copilot',
        detail: 'Conversational Arabic & English executive assistant answering live shift revenue, margin, and stock queries.',
      },
      {
        title: 'Expiry, Stock & Supplier Returns',
        detail: 'Automated near-expiry flagging, full SKU catalog CRUD, supplier payment ledgers, and return workflows.',
      },
      {
        title: 'HR Rosters, Attendance & Payroll',
        detail: 'Active-duty shift tracking, off-day scheduling, automated payroll calculation, and store hygiene checklists.',
      },
    ],
    stack: [
      'React',
      'TypeScript',
      'Cloud Firestore',
      'AI Copilot Engine',
      'Role-Based Auth',
      'RTL / LTR i18n',
      'Live Telemetry',
      'Automated Payroll',
    ],
    ctaLabel: 'Scope a custom ERP',
    screens: [
      {
        label: 'Executive Hub',
        tag: 'LIVE FIRESTORE',
        caption: 'Central command hub uniting safe vault balances, bank settlements, 7-day sales telemetry, and 31 department tools.',
        src: './portfolio/anh/dashboard.png',
        webp: './portfolio/anh/dashboard-640.webp',
      },
      {
        label: 'AI Copilot',
        tag: 'GPT-4 AR / EN',
        caption: 'Bilingual conversational manager assistant reporting daily shift performance and vault status in natural Arabic & English.',
        src: './portfolio/anh/ai-assistant.png',
      },
      {
        label: 'Revenue Trend',
        tag: 'SHIFT TELEMETRY',
        caption: '7-day verified shift sales analytics with branch-level breakdowns and cash-vs-card settlement ratios.',
        src: './portfolio/anh/revenue-trend.png',
        webp: './portfolio/anh/revenue-trend-640.webp',
      },
      {
        label: 'Safe Vault Report',
        tag: 'AUDIT TRAIL',
        caption: 'Granular safe drop reconciliation, cashier float verification, and shift handover audit logs.',
        src: './portfolio/anh/safe-report.png',
      },
      {
        label: 'Products & Expiry',
        tag: 'SKU & ALERTS',
        caption: 'Real-time product catalog with automated near-expiry and expired item alerts flagged for immediate branch action.',
        src: './portfolio/anh/products.png',
        webp: './portfolio/anh/products-640.webp',
      },
      {
        label: 'Payroll Engine',
        tag: 'HR & FINANCE',
        caption: 'Automated monthly payroll runs factoring attendance shifts, deductions, advances, and bonuses.',
        src: './portfolio/anh/payroll.png',
      },
      {
        label: 'Staff Directory',
        tag: 'ROSTERS & HR',
        caption: 'Employee roster management tracking active-duty staff, scheduled days off, and role permissions.',
        src: './portfolio/anh/employees.png',
      },
      {
        label: 'Supplier Payments',
        tag: 'ACCOUNTS PAYABLE',
        caption: 'Structured vendor invoice settlements, payment vouchers, and branch disbursement tracking.',
        src: './portfolio/anh/payments.png',
      },
      {
        label: 'Supplier Returns',
        tag: 'STOCK CONTROL',
        caption: 'Documented supplier return claims for damaged or near-expiry stock with instant inventory adjustment.',
        src: './portfolio/anh/supplier-returns.png',
      },
      {
        label: 'Store Operations',
        tag: 'QUALITY OPS',
        caption: 'Daily branch opening, hygiene, and operational compliance checklists verified per shift.',
        src: './portfolio/anh/cleaning.png',
      },
    ],
  },
  {
    id: 'armia-boutique',
    tabNum: '02',
    tabTitle: 'Armia Boutique & PWA',
    tabSub: 'Luxury E-Commerce · PWA',
    code: '§ 02 — BESPOKE LUXURY COMMERCE & PWA',
    statusPill: 'LIVE · ARMIABOUTIQUE.COM',
    title: 'Armia Boutique — Editorial Storefront, Dual PWAs & Atelier Admin.',
    summary:
      'A custom-engineered bilingual fashion flagship featuring interactive "Shop the Look" garment hotspots, installable PWAs for both shoppers and administrators, web push flash-deal alerts, and a complete back-office suite.',
    challenge:
      'Cookie-cutter store themes slowed mobile checkout, lacked multi-piece editorial outfit bundling, and offered no native app feel or instant VIP drop notifications without app-store friction.',
    renderMode: 'framed-ui',
    posterTheme: 'atelier',
    rotationDirection: 'right',
    duration: 34,
    metrics: [
      { value: '99/100', label: 'Performance Score' },
      { value: 'Dual PWA', label: 'Shopper + Admin Apps' },
      { value: '256-Bit', label: 'Firebase Role Auth' },
      { value: 'EN / AR', label: 'Instant RTL Switch' },
    ],
    features: [
      {
        title: 'Interactive "Shop the Look" Hotspots',
        detail: 'Tappable garment pins placed directly over lookbook photography with 1-click full-set cart bundling.',
      },
      {
        title: 'Installable PWA & VIP Push Alerts',
        detail: 'Home-screen app installation banner and opt-in web push notifications for private drops and flash sales.',
      },
      {
        title: 'Frictionless Slide Cart & Checkout',
        detail: 'Instant slide-out bag drawer, dynamic size charts, promo validation, and region-based shipping matrices.',
      },
      {
        title: 'Full Atelier Admin & Access Control',
        detail: 'Dedicated back-office for live orders, abandoned cart recovery, CRM, catalog CRUD, and 256-bit role-guarded staff access.',
      },
    ],
    stack: [
      'Bespoke Storefront',
      'Progressive Web App',
      'Web Push Concierge',
      'Firebase Auth 256-Bit',
      'Firestore Real-Time',
      'Hotspot Lookbook',
      'Abandoned Cart CRM',
      'EN / AR RTL',
    ],
    ctaLabel: 'Scope an e-commerce build',
    screens: [
      {
        label: 'Atelier Storefront',
        tag: 'SHOP THE LOOK',
        caption: 'Editorial homepage featuring interactive garment hotspots, PWA install banner, VIP push concierge, and EN/AR toggle.',
        src: './portfolio/armia/storefront-home.png',
        webp: './portfolio/armia/storefront-home-1024.webp',
      },
      {
        label: 'Curated Collections',
        tag: 'FAST FILTERING',
        caption: 'Sub-second collection browsing with fabric filters, wholesale & retail tiers, and instant quick-add.',
        src: './portfolio/armia/collections.png',
        webp: './portfolio/armia/collections-640.webp',
      },
      {
        label: 'Slide-Out Bag',
        tag: 'CONVERSION UX',
        caption: 'Zero-reload slide-over cart drawer with variant switching, bundle summaries, and live shipping thresholds.',
        src: './portfolio/armia/cart-drawer.png',
      },
      {
        label: 'Express Checkout',
        tag: 'LOCALIZED FLOW',
        caption: 'Streamlined mobile-first checkout with governorate shipping calculation and instant order confirmation.',
        src: './portfolio/armia/checkout.png',
        webp: './portfolio/armia/checkout-640.webp',
      },
      {
        label: 'Executive Admin',
        tag: '256-BIT PORTAL',
        caption: 'Role-guarded admin suite managing live orders, abandoned carts, push broadcasts, size charts, and staff credentials.',
        src: './portfolio/armia/admin-portal.png',
      },
    ],
  },
  {
    id: 'fb-pos',
    tabNum: '03',
    tabTitle: 'Hospitality POS SaaS',
    tabSub: 'Touch POS · Kitchen Ops',
    code: '§ 03 — HOSPITALITY POS & KITCHEN SAAS',
    statusPill: 'MULTI-REGISTER SAAS',
    title: 'F&B Touch POS Terminal, Kitchen Sync & Recipe Stock Engine.',
    summary:
      'High-velocity tablet and countertop POS engineered for busy restaurants and cafes — uniting sub-second cashier order entry, live kitchen ticket routing, automatic gram-level recipe deduction, and real-time net-profit telemetry.',
    challenge:
      'Peak-hour food counters lose margin and speed when legacy POS terminals lag, kitchen orders desync from register modifiers, and ingredient shrinkage is only discovered during manual weekly counts.',
    renderMode: 'poster',
    posterTheme: 'pos',
    rotationDirection: 'left',
    duration: 34,
    metrics: [
      { value: '< 80ms', label: 'Touch Tap Response' },
      { value: 'Auto', label: 'Recipe COGS Sync' },
      { value: 'Live', label: 'Hourly Sales Velocity' },
      { value: 'CRM', label: 'Loyalty & Gift Cards' },
    ],
    features: [
      {
        title: 'High-Speed Touch POS Terminal',
        detail: 'Dine-in, Takeaway & Table modes, barcode scan input, hold/resume tickets, VAT & discount overrides, and safe drops.',
      },
      {
        title: 'Recipe-Level Inventory Deduction',
        detail: 'Every item sold automatically deducts exact recipe ingredients, updates stock valuation, and triggers low-stock alerts.',
      },
      {
        title: 'Executive Velocity & Net Profit',
        detail: 'Live hourly sales velocity curves, net profit after expenses & COGS, and active multi-register shift monitoring.',
      },
      {
        title: 'Loyalty CRM, Gift Cards & Staff PIN',
        detail: 'Phone-lookup customer loyalty profiles, gift-card ticket redemption, PIN cashier login, and shift roster planning.',
      },
    ],
    stack: [
      'Touch-First POS UI',
      'Kitchen Order Sync',
      'Recipe COGS Engine',
      'Barcode & Cash Drawer',
      'Shift & Safe Drop Audit',
      'Loyalty & Gift Cards',
      'Staff PIN Security',
      'Live Profit Telemetry',
    ],
    ctaLabel: 'Scope a SaaS / POS system',
    screens: [
      {
        label: 'POS Terminal',
        tag: 'TOUCH REGISTER',
        caption: 'Fast tablet register with visual menu cards, Dine-In/Takeaway toggle, barcode scan, gift card lookup, and shift safe drops.',
        src: './portfolio/fb-pos/pos-terminal.png',
        webp: './portfolio/fb-pos/pos-terminal-480.webp',
      },
      {
        label: 'Executive Dashboard',
        tag: 'LIVE VELOCITY',
        caption: 'Real-time hourly sales velocity curve, net profit after COGS & expenses, active register status, and low-stock alerts.',
        src: './portfolio/fb-pos/dashboard.png',
      },
      {
        label: 'Recipe Inventory',
        tag: 'AUTO COGS',
        caption: 'Ingredient-level inventory valuation, recipe BOM mapping, purchase orders, and automated reorder thresholds.',
        src: './portfolio/fb-pos/inventory.png',
        webp: './portfolio/fb-pos/inventory-480.webp',
      },
      {
        label: 'Loyalty Customers',
        tag: 'GUEST CRM',
        caption: 'Customer phone lookup, repeat-visit order history, loyalty balances, and promotional gift-card redemption.',
        src: './portfolio/fb-pos/customers.png',
      },
      {
        label: 'Staff PIN Login',
        tag: 'SHIFT ACCESS',
        caption: 'Rapid cashier & manager PIN pad authentication tying every void, safe drop, and shift closeout to a verified operator.',
        src: './portfolio/fb-pos/login.png',
      },
    ],
  },
];

// Build a seamless 12-panel 3D cylinder ring matching ImageSlider3D geometry
const RING_SLOTS = 12;
// tan(180deg / 12) = tan(15deg) = 0.26794919
const TAN_HALF_STEP = Math.tan(Math.PI / RING_SLOTS).toFixed(6);

interface RingSlide {
  screen: PortfolioScreen;
  screenIdx: number;
  slotIdx: number;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function buildCylinderSlides(screens: PortfolioScreen[]): RingSlide[] {
  const out: RingSlide[] = [];
  for (let i = 0; i < RING_SLOTS; i++) {
    const screenIdx = i % screens.length;
    out.push({
      screen: screens[screenIdx],
      screenIdx,
      slotIdx: i,
    });
  }
  return out;
}

export interface ServicesController {
  update: () => void;
}

export function renderServicesHTML(): string {
  return `
    <section id="services" class="services-section" aria-labelledby="services-heading">
      <div class="container">
        <header class="portfolio-top-header">
          <div>
            <div class="eyebrow">PORTFOLIO &middot; PRODUCTION CASE STUDIES</div>
            <h2 id="services-heading" class="section-title-xl">
              Engineered &amp; shipped.
            </h2>
          </div>
          <p class="section-lead portfolio-lead">
            Select a system tab below to spin its 3D screen gallery, drag to orbit, or click any screen to inspect full resolution.
          </p>
        </header>

        <div class="portfolio-showcase-shell portfolio-card">
          <!-- Accessible Single-Row Project Tablist with CSS Anchor-Positioned Underline -->
          <div class="portfolio-tablist" role="tablist" aria-label="Featured software case studies">
            ${PORTFOLIO_PROJECTS.map(
              (project, idx) => `
              <button
                type="button"
                role="tab"
                id="pf-tab-${idx}"
                class="pf-tab-btn"
                aria-selected="${idx === 0 ? 'true' : 'false'}"
                tabindex="${idx === 0 ? '0' : '-1'}"
                data-pf-tab="${idx}"
              >
                <span class="pf-tab-num">${project.tabNum}</span>
                <span class="pf-tab-text">
                  <span class="pf-tab-title">${project.tabTitle}</span>
                  <span class="pf-tab-sub">${project.tabSub}</span>
                </span>
              </button>
            `
            ).join('')}
          </div>

          <!-- Tab Panels Container (zero gap so hidden="until-found" panels take 0px) -->
          <div class="portfolio-panels-host">
            ${PORTFOLIO_PROJECTS.map((project, pIdx) => {
              const ringSlides = buildCylinderSlides(project.screens);
              const hiddenAttr = pIdx === 0 ? '' : 'hidden="until-found"';

              return `
              <div
                role="tabpanel"
                id="pf-panel-${pIdx}"
                aria-labelledby="pf-tab-${pIdx}"
                class="pf-tabpanel"
                data-pf-panel="${pIdx}"
                ${hiddenAttr}
              >
                <article class="pf-case-study">
                  <!-- 1. Project Case-Study Top Summary + Key Metrics -->
                  <div class="pf-case-header">
                    <div class="pf-case-intro">
                      <div class="pf-meta-row">
                        <span class="service-code-pill">${project.code}</span>
                        <span class="pf-status-pill"><span class="pf-live-dot" aria-hidden="true"></span>${project.statusPill}</span>
                      </div>
                      <h3 class="pf-case-title">${project.title}</h3>
                      <p class="pf-case-summary">${project.summary}</p>
                      <div class="pf-intro-actions">
                        <button
                          type="button"
                          class="pf-view-more-btn"
                          data-open-lr-project="${pIdx}"
                        >
                          View more
                        </button>
                      </div>
                    </div>

                    <div class="pf-metrics-grid" aria-label="Key project metrics">
                      ${project.metrics
                        .map(
                          (m) => `
                        <div class="pf-metric-box">
                          <span class="pf-metric-val">${m.value}</span>
                          <span class="pf-metric-lbl">${m.label}</span>
                        </div>
                      `
                        )
                        .join('')}
                    </div>
                  </div>

                  <!-- 2. 3D Cylindrical ImageSlider3D Stage -->
                  <div class="pf-slider3d-theater" data-slider-project="${pIdx}">
                    <div class="pf-theater-hud">
                      <div class="pf-hud-left">
                        <span class="pf-hud-badge">360&deg; 3D GALLERY &middot; ${project.screens.length} SCREENS</span>
                        <span class="pf-hud-hint">DRAG TO SPIN &middot; CLICK CARD TO EXPAND</span>
                      </div>
                      <div class="pf-hud-controls">
                        <button type="button" class="pf-ctrl-btn" data-slider-prev="${pIdx}" aria-label="Rotate ${project.tabTitle} gallery left">&lsaquo;</button>
                        <button type="button" class="pf-ctrl-btn pf-pause-btn" data-slider-toggle="${pIdx}" aria-pressed="false" aria-label="Pause 3D rotation">
                          <span aria-hidden="true">&#10074;&#10074;</span>
                        </button>
                        <button type="button" class="pf-ctrl-btn" data-slider-next="${pIdx}" aria-label="Rotate ${project.tabTitle} gallery right">&rsaquo;</button>
                      </div>
                    </div>

                    <!-- Exact ImageSlider3D Perspective + Edge Fade Mask Container -->
                    <div
                      class="slider3d-viewport"
                      data-slider-viewport="${pIdx}"
                      data-direction="${project.rotationDirection}"
                      data-duration="${project.duration}"
                      tabindex="0"
                      role="region"
                      aria-label="${project.tabTitle} 3D interactive screenshot carousel"
                    >
                      <div class="slider3d-ambient-glow theme-${project.posterTheme}" aria-hidden="true"></div>
                      <div class="slider3d-rotor" data-slider-rotor="${pIdx}">
                        ${ringSlides
                          .map(({ screen, screenIdx, slotIdx }) => {
                            const angleTurn = `${slotIdx} * (1turn / ${RING_SLOTS})`;
                            const cardTransform = `rotateY(calc(${angleTurn})) translateZ(calc(-1 * (0.5 * var(--slider-card-w) + 0.52em) / ${TAN_HALF_STEP}))`;

                            if (project.renderMode === 'poster') {
                              return `
                              <div
                                class="slider3d-card is-poster-card"
                                data-project-idx="${pIdx}"
                                data-screen-idx="${screenIdx}"
                                style="transform: ${cardTransform};"
                              >
                                <img
                                  src="${screen.webp || screen.src}"
                                  alt="${project.tabTitle} — ${screen.label}"
                                  loading="lazy"
                                  decoding="async"
                                  draggable="false"
                                />
                                <div class="slider3d-card-hover-pill">
                                  <span>${screen.label}</span>
                                  <span aria-hidden="true">&#8599;</span>
                                </div>
                              </div>
                            `;
                            }

                            return `
                            <div
                              class="slider3d-card is-framed-card theme-${project.posterTheme}"
                              data-project-idx="${pIdx}"
                              data-screen-idx="${screenIdx}"
                              style="transform: ${cardTransform};"
                            >
                              <div class="sc-poster-top">
                                <span class="sc-poster-brand">
                                  <span class="sc-brand-dot" aria-hidden="true"></span>DEPLOY.
                                </span>
                                <span class="sc-poster-num">${pad2(screenIdx + 1)}</span>
                              </div>

                              <div class="sc-poster-headline">
                                <strong>${screen.label}</strong>
                                <span>${screen.tag}</span>
                              </div>

                              <div class="sc-device-stack">
                                <div class="sc-device-back" aria-hidden="true"></div>
                                <div class="sc-device-window">
                                  <div class="sc-window-bar" aria-hidden="true">
                                    <i></i><i></i><i></i>
                                    <span>${project.id}.app</span>
                                  </div>
                                  <div class="sc-window-screen">
                                    <img
                                      src="${screen.webp || screen.src}"
                                      alt="${project.tabTitle} — ${screen.label}"
                                      loading="lazy"
                                      decoding="async"
                                      draggable="false"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div class="sc-poster-foot">
                                <span>WE BUILD, YOU LEAD</span>
                                <span aria-hidden="true">&#8599;</span>
                              </div>
                            </div>
                          `;
                          })
                          .join('')}
                      </div>
                    </div>

                    <!-- Quick-Jump Screen Selector Strip -->
                    <div class="pf-screen-strip" aria-label="Jump to screen in ${project.tabTitle}">
                      ${project.screens
                        .map(
                          (scr, sIdx) => `
                        <button
                          type="button"
                          class="pf-screen-pill ${sIdx === 0 ? 'is-active' : ''}"
                          data-jump-project="${pIdx}"
                          data-jump-screen="${sIdx}"
                        >
                          <span class="pf-sp-idx">${pad2(sIdx + 1)}</span>
                          <span>${scr.label}</span>
                        </button>
                      `
                        )
                        .join('')}
                    </div>
                  </div>

                  <!-- 3. Detailed Case Study Breakdown: Challenge, Engineered Modules & Stack -->
                  <div class="pf-details-grid">
                    <div class="pf-detail-col pf-challenge-col">
                      <div class="pf-col-eyebrow">01 &middot; THE CHALLENGE</div>
                      <h4 class="pf-col-heading">What needed to change</h4>
                      <p class="pf-challenge-copy">${project.challenge}</p>
                      <div class="pf-challenge-actions">
                        <button
                          type="button"
                          class="pf-view-more-btn"
                          data-open-lr-project="${pIdx}"
                        >
                          View more
                        </button>
                        <button
                          type="button"
                          class="pf-inspect-all-btn"
                          data-open-lightbox-project="${pIdx}"
                        >
                          Quick viewer (${project.screens.length}) &rarr;
                        </button>
                      </div>
                    </div>

                    <div class="pf-detail-col pf-features-col">
                      <div class="pf-col-eyebrow">02 &middot; ENGINEERED ARCHITECTURE</div>
                      <div class="pf-features-list">
                        ${project.features
                          .map(
                            (f) => `
                          <div class="pf-feature-item">
                            <span class="pf-feat-icon" aria-hidden="true">&#10003;</span>
                            <div>
                              <strong>${f.title}</strong>
                              <p>${f.detail}</p>
                            </div>
                          </div>
                        `
                          )
                          .join('')}
                      </div>
                    </div>

                    <div class="pf-detail-col pf-stack-col">
                      <div class="pf-col-eyebrow">03 &middot; STACK &amp; DELIVERABLES</div>
                      <h4 class="pf-col-heading">Production specs</h4>
                      <ul class="pf-stack-pills">
                        ${project.stack.map((item) => `<li>${item}</li>`).join('')}
                      </ul>
                      <div class="pf-cta-box">
                        <button type="button" class="btn-yellow-pill pf-project-cta" data-open-audit>
                          ${project.ctaLabel} <span aria-hidden="true">&rarr;</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Full-Resolution Portfolio Lightbox with Prev / Next Screen Navigation -->
      <dialog id="portfolio-lightbox" class="zeroth-dialog portfolio-lightbox" aria-label="Project screenshot preview">
        <div class="lightbox-panel">
          <div class="lightbox-header">
            <div class="lightbox-meta">
              <span id="lightbox-caption" class="lightbox-caption"></span>
              <p id="lightbox-subcaption" class="lightbox-subcaption"></p>
            </div>
            <div class="lightbox-actions">
              <button type="button" class="pf-ctrl-btn" id="lightbox-prev" aria-label="Previous screenshot">&lsaquo;</button>
              <button type="button" class="pf-ctrl-btn" id="lightbox-next" aria-label="Next screenshot">&rsaquo;</button>
              <button type="button" class="dialog-close" id="lightbox-close" aria-label="Close preview">&times;</button>
            </div>
          </div>
          <img id="lightbox-img" class="lightbox-img" src="" alt="" />
        </div>
      </dialog>
    </section>
  `;
}

interface SliderInstanceState {
  pIdx: number;
  viewport: HTMLElement;
  rotor: HTMLElement;
  angleDeg: number;
  velDegPerSec: number;
  baseSpeedDegPerSec: number;
  directionSign: number;
  duration: number;
  dragging: boolean;
  hovered: boolean;
  paused: boolean;
  snapTargetDeg: number | null;
  holdTimer: number;
  pills: HTMLButtonElement[];
}

export function initServicesStack(section: HTMLElement): ServicesController {
  const tabs = Array.from(section.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(section.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

  const lightbox = section.querySelector<HTMLDialogElement>('#portfolio-lightbox');
  const lightboxImg = section.querySelector<HTMLImageElement>('#lightbox-img');
  const lightboxCaption = section.querySelector<HTMLElement>('#lightbox-caption');
  const lightboxSubcaption = section.querySelector<HTMLElement>('#lightbox-subcaption');
  const lightboxClose = section.querySelector<HTMLButtonElement>('#lightbox-close');
  const lightboxPrev = section.querySelector<HTMLButtonElement>('#lightbox-prev');
  const lightboxNext = section.querySelector<HTMLButtonElement>('#lightbox-next');

  let activeTabIdx = 0;
  let lbProjectIdx = 0;
  let lbScreenIdx = 0;

  const openLightbox = (pIdx: number, sIdx: number) => {
    const project = PORTFOLIO_PROJECTS[pIdx];
    if (!project || !lightbox || !lightboxImg || !lightboxCaption) return;
    const count = project.screens.length;
    const normIdx = ((sIdx % count) + count) % count;
    const screen = project.screens[normIdx];
    lbProjectIdx = pIdx;
    lbScreenIdx = normIdx;

    lightboxImg.src = screen.src;
    lightboxImg.alt = `${project.tabTitle} — ${screen.label}`;
    lightboxCaption.textContent = `${project.tabTitle} · ${pad2(normIdx + 1)} / ${pad2(count)} — ${screen.label}`;
    if (lightboxSubcaption) {
      lightboxSubcaption.textContent = screen.caption;
    }
    if (!lightbox.open) {
      lightbox.showModal();
    }
  };

  lightboxClose?.addEventListener('click', () => lightbox?.close());
  lightboxPrev?.addEventListener('click', () => openLightbox(lbProjectIdx, lbScreenIdx - 1));
  lightboxNext?.addEventListener('click', () => openLightbox(lbProjectIdx, lbScreenIdx + 1));
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.close();
  });
  lightbox?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      openLightbox(lbProjectIdx, lbScreenIdx - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      openLightbox(lbProjectIdx, lbScreenIdx + 1);
    }
  });

  section.querySelectorAll<HTMLButtonElement>('[data-open-lightbox-project]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pIdx = Number(btn.dataset.openLightboxProject || '0');
      openLightbox(pIdx, 0);
    });
  });

  // Tab switching (selection follows focus + hidden="until-found" + beforematch sync)
  const selectTab = (nextIdx: number, moveFocus = false) => {
    const clamped = ((nextIdx % tabs.length) + tabs.length) % tabs.length;
    activeTabIdx = clamped;

    tabs.forEach((tab, i) => {
      const isSelected = i === clamped;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      if (isSelected) {
        if (moveFocus) tab.focus({ preventScroll: true });
        try {
          tab.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' } as ScrollIntoViewOptions);
        } catch {
          tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      }
    });

    panels.forEach((panel, i) => {
      if (i === clamped) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', 'until-found');
      }
    });
  };

  tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => selectTab(idx, false));
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        selectTab(idx + 1, true);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        selectTab(idx - 1, true);
      } else if (e.key === 'Home') {
        e.preventDefault();
        selectTab(0, true);
      } else if (e.key === 'End') {
        e.preventDefault();
        selectTab(tabs.length - 1, true);
      }
    });
  });

  panels.forEach((panel, idx) => {
    panel.addEventListener('beforematch', () => {
      selectTab(idx, false);
    });
  });

  // Build 3D Cylinder Slider controllers per tab
  const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sliders: SliderInstanceState[] = [];

  PORTFOLIO_PROJECTS.forEach((project, pIdx) => {
    const viewport = section.querySelector<HTMLElement>(`[data-slider-viewport="${pIdx}"]`);
    const rotor = section.querySelector<HTMLElement>(`[data-slider-rotor="${pIdx}"]`);
    if (!viewport || !rotor) return;

    const pills = Array.from(
      section.querySelectorAll<HTMLButtonElement>(`[data-jump-project="${pIdx}"]`)
    );
    const directionSign = project.rotationDirection === 'left' ? 1 : -1;
    const duration = project.duration || 34;
    const computeBaseSpeed = () => {
      const effDuration = reducedMq.matches ? duration * 4 : duration;
      return (360 / effDuration) * directionSign;
    };

    const state: SliderInstanceState = {
      pIdx,
      viewport,
      rotor,
      angleDeg: 0,
      velDegPerSec: 0,
      baseSpeedDegPerSec: computeBaseSpeed(),
      directionSign,
      duration,
      dragging: false,
      hovered: false,
      paused: false,
      snapTargetDeg: null,
      holdTimer: 0,
      pills,
    };

    rotor.style.transform = 'rotateY(0deg)';

    // Hover slows cruise gently
    viewport.addEventListener('pointerenter', () => {
      state.hovered = true;
    });
    viewport.addEventListener('pointerleave', () => {
      state.hovered = false;
    });

    // Drag-to-spin + click-to-open-lightbox
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastT = 0;
    let downCard: HTMLElement | null = null;

    viewport.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      pointerId = e.pointerId;
      state.dragging = true;
      state.snapTargetDeg = null;
      state.holdTimer = 0;
      state.velDegPerSec = 0;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastT = performance.now();
      downCard = (e.target as HTMLElement | null)?.closest<HTMLElement>('.slider3d-card') || null;
      viewport.classList.add('is-dragging');
      try {
        viewport.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!state.dragging || e.pointerId !== pointerId) return;
      const now = performance.now();
      const dtMs = Math.max(4, now - lastT);
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      lastT = now;

      // In CSS 3D concave back-wall (z = -R), x' = -R * sin(angle), so dragging right (dx > 0) decreases angle
      const deltaDeg = -dx * 0.22;
      state.angleDeg += deltaDeg;
      state.velDegPerSec = (deltaDeg / dtMs) * 1000;
      state.rotor.style.transform = `rotateY(${state.angleDeg.toFixed(3)}deg)`;
    });

    const finishDrag = (e: PointerEvent) => {
      if (!state.dragging || e.pointerId !== pointerId) return;
      state.dragging = false;
      viewport.classList.remove('is-dragging');
      try {
        viewport.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      pointerId = null;

      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist < 6 && downCard) {
        const sIdx = Number(downCard.dataset.screenIdx || '0');
        openLightbox(pIdx, sIdx);
      }
      downCard = null;
    };

    viewport.addEventListener('pointerup', finishDrag);
    viewport.addEventListener('pointercancel', finishDrag);

    // Keyboard rotation on focused viewport
    viewport.addEventListener('keydown', (e) => {
      const stepDeg = 360 / RING_SLOTS;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        state.snapTargetDeg = (state.snapTargetDeg ?? state.angleDeg) - stepDeg;
        state.holdTimer = 1.6;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        state.snapTargetDeg = (state.snapTargetDeg ?? state.angleDeg) + stepDeg;
        state.holdTimer = 1.6;
      }
    });

    // HUD Prev / Next / Pause controls
    const prevBtn = section.querySelector<HTMLButtonElement>(`[data-slider-prev="${pIdx}"]`);
    const nextBtn = section.querySelector<HTMLButtonElement>(`[data-slider-next="${pIdx}"]`);
    const toggleBtn = section.querySelector<HTMLButtonElement>(`[data-slider-toggle="${pIdx}"]`);
    const stepDeg = 360 / RING_SLOTS;

    prevBtn?.addEventListener('click', () => {
      const base = state.snapTargetDeg ?? Math.round(state.angleDeg / stepDeg) * stepDeg;
      state.snapTargetDeg = base - stepDeg;
      state.holdTimer = 1.8;
    });

    nextBtn?.addEventListener('click', () => {
      const base = state.snapTargetDeg ?? Math.round(state.angleDeg / stepDeg) * stepDeg;
      state.snapTargetDeg = base + stepDeg;
      state.holdTimer = 1.8;
    });

    toggleBtn?.addEventListener('click', () => {
      state.paused = !state.paused;
      toggleBtn.setAttribute('aria-pressed', String(state.paused));
      toggleBtn.setAttribute('aria-label', state.paused ? 'Resume 3D rotation' : 'Pause 3D rotation');
      toggleBtn.innerHTML = state.paused
        ? '<span aria-hidden="true">&#9654;</span>'
        : '<span aria-hidden="true">&#10074;&#10074;</span>';
    });

    // Screen Quick-Jump Pills: rotate cylinder smoothly to center that exact screen
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const sIdx = Number(pill.dataset.jumpScreen || '0');
        // Slot sIdx sits at slotAngle = sIdx * stepDeg; centered when rotorAngle + slotAngle ≡ 0 (mod 360)
        const targetMod = -sIdx * stepDeg;
        const delta = ((((targetMod - state.angleDeg) % 360) + 540) % 360) - 180;
        state.snapTargetDeg = state.angleDeg + delta;
        state.velDegPerSec = 0;
        state.holdTimer = 2.4;
        pills.forEach((p, idx) => p.classList.toggle('is-active', idx === sIdx));
      });
    });

    sliders.push(state);
  });

  reducedMq.addEventListener('change', () => {
    sliders.forEach((s) => {
      const effDuration = reducedMq.matches ? s.duration * 4 : s.duration;
      s.baseSpeedDegPerSec = (360 / effDuration) * s.directionSign;
    });
  });

  // Pause rAF automatically when #services is >200px outside viewport (matching ImageSlider3D useInView margin="200px")
  let sectionInView = false;
  let rafId = 0;
  let lastFrameTime = performance.now();

  const tick = (now: number) => {
    if (!sectionInView) {
      rafId = 0;
      return;
    }
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    const active = sliders[activeTabIdx];
    if (active && !active.dragging) {
      if (active.snapTargetDeg !== null) {
        const diff = active.snapTargetDeg - active.angleDeg;
        active.angleDeg += diff * Math.min(1, dt * 8.5);
        if (Math.abs(diff) < 0.15) {
          active.angleDeg = active.snapTargetDeg;
          active.snapTargetDeg = null;
        }
      } else if (active.holdTimer > 0) {
        active.holdTimer = Math.max(0, active.holdTimer - dt);
      } else {
        // Decay manual throw momentum smoothly into continuous 360° cruise
        const cruise = active.paused
          ? 0
          : active.hovered
            ? active.baseSpeedDegPerSec * 0.28
            : active.baseSpeedDegPerSec;
        active.velDegPerSec *= Math.exp(-dt * 4.2);
        const speed = Math.abs(active.velDegPerSec) > 0.4 ? active.velDegPerSec + cruise * 0.25 : cruise;
        active.angleDeg += speed * dt;
      }

      active.rotor.style.transform = `rotateY(${active.angleDeg.toFixed(3)}deg)`;

      // Highlight whichever unique screen is currently closest to center (angle = 0 on back wall)
      const stepDeg = 360 / RING_SLOTS;
      const rawSlot = Math.round(-active.angleDeg / stepDeg);
      const normSlot = ((rawSlot % RING_SLOTS) + RING_SLOTS) % RING_SLOTS;
      const screenCount = PORTFOLIO_PROJECTS[active.pIdx].screens.length;
      const activeScreenIdx = normSlot % screenCount;
      if (active.snapTargetDeg === null) {
        active.pills.forEach((p, idx) => p.classList.toggle('is-active', idx === activeScreenIdx));
      }
    }

    rafId = window.requestAnimationFrame(tick);
  };

  const viewIo = new IntersectionObserver(
    (entries) => {
      const vis = entries[0]?.isIntersecting ?? false;
      sectionInView = vis;
      if (vis && !rafId) {
        lastFrameTime = performance.now();
        rafId = window.requestAnimationFrame(tick);
      }
    },
    { rootMargin: '200px 0px 200px 0px', threshold: 0 }
  );
  viewIo.observe(section);

  return {
    update: () => {},
  };
}
