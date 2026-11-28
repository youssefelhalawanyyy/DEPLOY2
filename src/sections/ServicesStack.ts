import { mountFlexCarousel, type FlexCarouselController, type FlexCarouselItem } from '../three/FlexCarouselEngine';

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

function toCarouselItems(project: PortfolioProject): FlexCarouselItem[] {
  return project.screens.map((scr) => ({
    src: scr.src,
    fullSrc: scr.src,
    alt: `${project.tabTitle} — ${scr.label}`,
    title: scr.label,
    subtitle: `${scr.tag} · ${project.tabTitle}`,
  }));
}

export interface ServicesController {
  update: (progress: number) => void;
}

export function renderServicesHTML(): string {
  const first = PORTFOLIO_PROJECTS[0];

  return `
    <section id="services" class="services-section" aria-labelledby="services-heading">
      <div class="portfolio-sticky-stage">
        <!-- 1. Top Seamless Header + Project Switcher Tabs (same #f5f4ef background) -->
        <div class="container pf-seamless-top">
          <div class="pf-top-row">
            <div class="pf-active-head">
              <div class="pf-meta-row">
                <span class="eyebrow" id="pf-active-code">${first.code}</span>
                <span class="pf-status-pill">
                  <span class="pf-live-dot" aria-hidden="true"></span>
                  <span id="pf-active-status">${first.statusPill}</span>
                </span>
              </div>
              <h2 id="services-heading" class="pf-seamless-title">${first.title}</h2>
              <p class="pf-seamless-summary" id="pf-active-summary">${first.summary}</p>
            </div>

            <div class="pf-top-controls">
              <!-- Accessible Single-Row Project Tablist with CSS Anchor-Positioned Underline -->
              <div class="portfolio-tablist is-seamless" role="tablist" aria-label="Featured software case studies">
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
                      <span class="pf-tab-sub">${project.screens.length} screens</span>
                    </span>
                  </button>
                `
                ).join('')}
              </div>

              <div class="pf-action-pair">
                <button
                  type="button"
                  class="pf-view-more-btn"
                  id="pf-view-more-active"
                  data-open-lr-project="0"
                >
                  View more
                </button>
                <button type="button" class="btn-yellow-pill pf-compact-cta" data-open-audit>
                  <span id="pf-active-cta-label">${first.ctaLabel}</span> <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Full-Bleed Seamless WebGL2 FlexCarousel Stage (same #f5f4ef background, scrubs on scroll!) -->
        <div class="pf-flex-carousel-bleed">
          <div id="portfolio-flex-carousel" class="pf-flex-carousel-host"></div>
        </div>

        <!-- 3. Bottom Seamless Metrics & Scroll Progress Strip -->
        <div class="container pf-seamless-bottom">
          <div class="pf-inline-metrics" id="pf-active-metrics">
            ${first.metrics
              .map(
                (m) => `
              <div class="pf-inline-metric">
                <strong>${m.value}</strong>
                <span>${m.label}</span>
              </div>
            `
              )
              .join('')}
          </div>

          <div class="pf-scroll-tracker" aria-hidden="true">
            <span class="pf-scroll-hint">SCROLL TO FLOW THROUGH ALL SCREENS &middot; CLICK IMAGE TO FOCUS</span>
            <div class="pf-scroll-bar">
              <span class="pf-scroll-bar-fill" id="pf-scroll-bar-fill"></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function initServicesStack(section: HTMLElement): ServicesController {
  const tabs = Array.from(section.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const carouselHost = section.querySelector<HTMLElement>('#portfolio-flex-carousel');

  const codeEl = section.querySelector<HTMLElement>('#pf-active-code');
  const statusEl = section.querySelector<HTMLElement>('#pf-active-status');
  const titleEl = section.querySelector<HTMLElement>('#services-heading');
  const summaryEl = section.querySelector<HTMLElement>('#pf-active-summary');
  const viewMoreBtn = section.querySelector<HTMLButtonElement>('#pf-view-more-active');
  const ctaLabelEl = section.querySelector<HTMLElement>('#pf-active-cta-label');
  const metricsHost = section.querySelector<HTMLElement>('#pf-active-metrics');
  const scrollBarFill = section.querySelector<HTMLElement>('#pf-scroll-bar-fill');

  let activeIdx = 0;
  let latestScrollP = 0;
  let flexCtrl: FlexCarouselController | null = null;

  if (carouselHost) {
    flexCtrl = mountFlexCarousel(carouselHost, {
      items: toCarouselItems(PORTFOLIO_PROJECTS[0]),
      cardHeight: 0.56,
      gap: 12,
      squeeze: 0.2,
      focusOnClick: true,
      captions: true,
      fit: 'natural',
      radius: 0,
      lensWidth: 0.74,
      lensHeight: 1.18,
      tilt: 62,
      roundness: 1,
      bend: 0.34,
      reach: 0.38,
      curl: 'twist',
      dispersion: 0.45,
      liquid: 0,
      followCursor: false,
    });
  }

  const selectTab = (nextIdx: number, moveFocus = false) => {
    const count = PORTFOLIO_PROJECTS.length;
    const clamped = ((nextIdx % count) + count) % count;
    if (clamped === activeIdx && !moveFocus) return;
    activeIdx = clamped;
    const project = PORTFOLIO_PROJECTS[clamped];

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

    if (codeEl) codeEl.textContent = project.code;
    if (statusEl) statusEl.textContent = project.statusPill;
    if (titleEl) titleEl.textContent = project.title;
    if (summaryEl) summaryEl.textContent = project.summary;
    if (viewMoreBtn) viewMoreBtn.dataset.openLrProject = String(clamped);
    if (ctaLabelEl) ctaLabelEl.textContent = project.ctaLabel;
    if (metricsHost) {
      metricsHost.innerHTML = project.metrics
        .map(
          (m) => `
          <div class="pf-inline-metric">
            <strong>${m.value}</strong>
            <span>${m.label}</span>
          </div>
        `
        )
        .join('');
    }

    flexCtrl?.setItems(toCarouselItems(project), latestScrollP);
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

  return {
    update(progress: number) {
      latestScrollP = Math.max(0, Math.min(1, progress));
      if (scrollBarFill) {
        scrollBarFill.style.transform = `scaleX(${latestScrollP.toFixed(4)})`;
      }
      flexCtrl?.setScrollProgress(latestScrollP);
    },
  };
}
