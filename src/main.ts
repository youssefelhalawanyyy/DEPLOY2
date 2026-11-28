import './styles/main.css';
import { SITE_CONFIG } from './config/siteConfig';
import { mountHeroGlassSphere } from './three/HeroGlassSphere';
import { renderScrollStoryHTML, initScrollStory } from './sections/ScrollStory';
import { initMobileScroll } from './sections/MobileScroll';
import { initImpactScroll } from './sections/ImpactScroll';
import { renderServicesHTML, initServicesStack } from './sections/ServicesStack';
import { renderProcessHTML, initProcessDiagram } from './sections/ProcessDiagram';
import { renderModalsHTML, initModalsAndForms } from './sections/ModalsAndForms';
import { renderLinusGalleryModalHTML, initLinusGalleryModal } from './sections/LinusGalleryModal';
import { mountGridSignalCanvas, initInteractiveSpotlightCards } from './effects/VisualAnimations';
import {
  ensureSpeedBlurDefs,
  renderSpeedingOdometerHTML,
  updateSpeedingOdometer,
  bindSpeedingOdometerHover,
} from './effects/SpeedingText';
import { enhanceScrollTypographyAndSections } from './effects/PageScrollChoreography';
import type { LightKnotController } from './three/LightKnotHero33';

const impactEmailHint = 'Get a scoped architecture plan in 24 hours.';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function renderLogoMark(slotId = 'zeroth-logo'): string {
  return `
    <picture class="brand-logo-picture" data-asset-slot="${slotId}" aria-hidden="true">
      <source srcset="./deploy-mark.webp" type="image/webp" />
      <img class="brand-logo-img" src="./logo-mark.png" alt="" width="28" height="28" />
    </picture>
  `;
}

function renderWhyNowWords(): string {
  const { whyNow } = SITE_CONFIG;
  const words = whyNow.statementBeforeHighlight.trim().split(/\s+/);
  const beforeSpans = words
    .map((w, i) => `<span class="wn-word" data-word-idx="${i}">${w}</span>`)
    .join(' ');
  const highlightIdx = words.length;
  return `${beforeSpans} <span class="wn-word wn-highlight" data-word-idx="${highlightIdx}">${whyNow.highlightWord}</span><span class="wn-word" data-word-idx="${highlightIdx + 1}">${whyNow.statementAfterHighlight}</span>`;
}

function buildAppHTML(): string {
  const cfg = SITE_CONFIG;
  const marqueeNames = [...cfg.clients.names, ...cfg.clients.names];
  const marqueeQueries = [...cfg.clients.queries, ...cfg.clients.queries];

  return `
    <header class="site-header" id="site-header" data-theme="dark">
      <div class="header-inner">
        <a href="#top" class="brand-link" aria-label="${cfg.brand.name} home">
          ${renderLogoMark('zeroth-logo')}
          <span class="brand-wordmark">${cfg.brand.wordmark}</span>
        </a>

        <nav class="primary-nav" aria-label="Primary navigation">
          ${cfg.nav.links
            .map((l) => `<a class="nav-link" href="${l.href}">${l.label}</a>`)
            .join('')}
          <button type="button" class="nav-film-btn" data-open-film>
            <span aria-hidden="true">&#9656;</span> ${cfg.nav.filmCta}
          </button>
          <button type="button" class="nav-audit-btn" data-open-audit>
            ${cfg.nav.auditCta}
          </button>
        </nav>

        <button
          type="button"
          class="mobile-menu-toggle"
          id="mobile-menu-toggle"
          aria-expanded="false"
          aria-controls="mobile-nav-drawer"
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
        </button>
      </div>

      <div class="mobile-nav-drawer" id="mobile-nav-drawer" hidden>
        <div class="mobile-nav-links">
          ${cfg.nav.links
            .map((l) => `<a class="mobile-nav-link" href="${l.href}">${l.label}</a>`)
            .join('')}
          <button type="button" class="mobile-nav-link" data-open-film>&#9656; ${cfg.nav.filmCta}</button>
          <button type="button" class="btn-yellow-pill mobile-audit-cta" data-open-audit>
            ${cfg.nav.auditCta} &rarr;
          </button>
        </div>
      </div>
    </header>

    <main id="main-content">
      <!-- 1. HERO SECTION (Dark Grid + Giant White Display + 3D Glass Sphere) -->
      <section id="top" class="hero-section" aria-label="Hero">
        <div class="hero-sticky">
          <div class="hero-grid-bg" aria-hidden="true"></div>

          <div class="hero-top-eyebrow">${cfg.hero.eyebrow}</div>

          <div class="hero-display-wrap">
            <h1 class="hero-display-title">
              <span>${cfg.hero.headlineLine1}</span>
              ${cfg.hero.headlineLine2 ? `<span>${cfg.hero.headlineLine2}</span>` : ''}
            </h1>

            <div class="hero-reading-caption" id="hero-reading-caption">
              <div class="reading-label">${cfg.hero.readingLabel}</div>
              <div class="reading-query" id="hero-reading-query">${cfg.hero.queries[0]}</div>
            </div>
          </div>

          <div class="hero-sphere-host" id="hero-sphere-host" data-asset-slot="hero-glass-sphere"></div>

          <div class="hero-bottom-bar">
            <div class="hero-bottom-left">
              <p class="hero-tagline">${cfg.hero.description}</p>
              <div class="hero-cta-row">
                <button type="button" class="btn-yellow-pill" data-open-audit>
                  ${cfg.hero.primaryCta} <span aria-hidden="true">&rarr;</span>
                </button>
                <button type="button" class="btn-text-cta" data-open-film>
                  ${cfg.hero.secondaryCta} <span aria-hidden="true">&rsaquo;</span>
                </button>
              </div>
            </div>

            <div class="hero-lens-hint" aria-hidden="true">Hover over DEPLOY to explore what we build.</div>

            <aside class="hero-definition" aria-label="Definition of zeroth">
              <div class="def-term">${cfg.hero.definition.term}</div>
              <div class="def-phonetic">${cfg.hero.definition.phonetic} <em>${cfg.hero.definition.pos}</em></div>
              <ol class="def-list">
                ${cfg.hero.definition.entries.map((e) => `<li>${e}</li>`).join('')}
              </ol>
            </aside>
          </div>
        </div>
      </section>

      <!-- 2. WHY NOW (Scroll-Illuminated Editorial Statement + Stats) -->
      <section id="why-now" class="why-now-section" aria-labelledby="why-now-eyebrow">
        <div class="why-now-sticky">
          <div class="container why-now-inner">
            <div id="why-now-eyebrow" class="eyebrow" data-scroll-copy>${cfg.whyNow.eyebrow}</div>
            <p class="why-now-statement" id="why-now-statement">
              ${renderWhyNowWords()}
            </p>
            <div class="why-now-stats" id="why-now-stats">
              ${cfg.whyNow.stats
                .map(
                  (s) => `
                <div class="wn-stat-col">
                  <div class="wn-stat-val">${renderSpeedingOdometerHTML(s.value)}</div>
                  <div class="wn-stat-label">${s.label}</div>
                  <p class="wn-stat-source">${s.source}</p>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      </section>

      <!-- 3. NINE-BEAT SCROLL STORY (Question -> Result 47 -> Fix -> Climb -> #1 -> AI -> Quoted -> Zeroth) -->
      ${renderScrollStoryHTML()}

      <!-- Thin divider between Zeroth finale and Services -->
      <div class="section-divider-light" aria-hidden="true"></div>

      <!-- 4. SERVICES (6 Stacked Sticky Cards with Interactive Engineering Diagrams) -->
      ${renderServicesHTML()}

      <!-- 5. IMPACT / HERO 33: INTEGRATION PLATFORM STAGE + DRAGGABLE KNOT OF LIGHT + EMAIL SIGNUP -->
      <section id="results" class="results-section h33-impact-section" aria-labelledby="results-heading">
        <div class="h33-ambient-glow" aria-hidden="true"></div>

        <div class="container h33-container">
          <div class="h33-hero-runway">
            <div class="h33-hero-grid">
              <!-- Impact copy and project form -->
              <div class="h33-copy-col">
                <div>
                  <div class="h33-status-row" data-impact-reveal>
                    <span class="h33-status-pill">
                      <i aria-hidden="true"></i>
                      ${cfg.results.eyebrow}
                    </span>
                  </div>
                </div>

                <div>
                  <h2 id="results-heading" class="section-title-xl results-title h33-title" data-impact-reveal="title">
                    ${cfg.results.titleLine1}${cfg.results.titleLine2 ? `<br />${cfg.results.titleLine2}` : ''}
                  </h2>
                </div>

                <div>
                  <p class="h33-lead" data-impact-reveal>
                    ${
                      cfg.results.subtitle ||
                      'Websites, SaaS platforms, and internal company systems — wired into one resilient cloud architecture. We build, you lead.'
                    }
                  </p>
                </div>

                <!-- Hero 33 Accessible Inline Email Signup -->
                <div>
                  <form
                    id="h33-email-form"
                    class="h33-email-form"
                    aria-labelledby="h33-email-label-id"
                    action="https://formsubmit.co/${cfg.brand.email}"
                    method="POST"
                    novalidate
                    data-impact-reveal="form"
                  >
                    <input type="text" name="_honey" tabindex="-1" aria-hidden="true" class="visually-hidden" autocomplete="off" />
                    <label id="h33-email-label-id" for="h33-work-email" class="h33-email-label">
                      Work email <span aria-hidden="true">*</span>
                    </label>
                    <div class="h33-input-shell" id="h33-input-shell">
                      <input
                        type="email"
                        id="h33-work-email"
                        name="email"
                        autocomplete="email"
                        autocorrect="off"
                        autocapitalize="none"
                        spellcheck="false"
                        enterkeyhint="send"
                        placeholder="you@company.com"
                        aria-describedby="h33-email-feedback"
                        required
                      />
                      <button type="submit" class="btn-yellow-pill h33-submit-btn" id="h33-submit-btn">
                        <span class="h33-submit-label">Start a project</span>
                        <span aria-hidden="true">&rarr;</span>
                      </button>
                    </div>
                    <div class="h33-form-meta-row">
                      <span id="h33-email-feedback" class="h33-email-feedback" role="status" aria-live="polite">
                        ${impactEmailHint}
                      </span>
                      <button type="button" class="h33-scope-link" id="h33-open-full-scope">
                        Configure full scope &#8599;
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div class="h33-knot-motion">
                <div class="h33-knot-col" data-impact-reveal="knot">
                  <div class="h33-knot-host" id="h33-knot-host">
                    <div class="h33-knot-fallback-orb" aria-hidden="true"></div>
                  </div>
                  <span class="h33-knot-hint" aria-hidden="true">Drag to rotate</span>
                </div>
              </div>
            </div>
          </div>

          <div class="results-metrics-grid h33-metrics-ledger">
            ${cfg.results.metrics.map(m => `
              <div class="result-metric h33-metric-item" data-impact-reveal="metric">
                <div class="rm-number">${m.prefix || ''}${m.target}${m.suffix}</div>
                <div class="rm-label">${m.label}</div>
                <div class="rm-sublabel">${m.sublabel}</div>
              </div>
            `).join('')}
          </div>

          <h3 class="h33-cases-title" data-scroll-copy>Live deployments</h3>
          <div class="results-cases-grid h33-cases-grid">
            ${cfg.results.cases
              .map(
                (c, idx) => `
              <article class="case-card h33-case-card" data-scroll-card data-scroll-stagger="${idx}">
                <div class="case-meta" data-scroll-copy>${c.client} &middot; ${c.city}</div>
                <p class="case-summary" data-scroll-copy data-scroll-stagger="1">${c.summary}</p>
                <div class="h33-case-foot">
                  <div class="case-pill">${c.pill}</div>
                  <button type="button" class="h33-case-inspect-btn" data-open-lr-project="${idx}">
                    View build &#8599;
                  </button>
                </div>
              </article>
            `
              )
              .join('')}
          </div>

          ${cfg.results.footnote ? `<p class="results-footnote">${cfg.results.footnote}</p>` : ''}
        </div>
      </section>

      <!-- 6. FOUR-STEP PROCESS (Light Theme Pinned SVG Curve Diagram) -->
      ${renderProcessHTML()}

      <!-- 7. CLIENTS & QUERIES MARQUEE (With Accessible Pause/Play Toggle) -->
      <section class="clients-section" aria-labelledby="clients-heading">
        <div class="container">
          <div class="eyebrow" data-scroll-copy>${cfg.clients.eyebrow}</div>
          <h2 id="clients-heading" class="clients-title" data-scroll-heading>${cfg.clients.title}</h2>
        </div>

        <div class="marquee-shell" id="clients-marquee">
          <div class="marquee-track marquee-left" aria-label="Illustrative client names">
            ${marqueeNames
              .map((name, i) => `<span class="marquee-client ${i % 2 === 1 ? 'is-caps' : ''}">${name}</span>`)
              .join('')}
          </div>
          <div class="marquee-track marquee-right" aria-label="Illustrative target search queries">
            ${marqueeQueries
              .map(
                (q) => `
              <span class="marquee-query">
                ${q.text}
                <span class="mq-badge is-${q.accent}">${q.badge}</span>
              </span>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="container clients-footer-row" data-scroll-copy>
          <span class="clients-disclaimer">${cfg.clients.disclaimer}</span>
          <button
            type="button"
            class="marquee-pause-btn"
            id="marquee-pause-btn"
            aria-label="Pause scrolling client marquee"
          >
            <span aria-hidden="true">&#10074;&#10074;</span>
          </button>
        </div>
      </section>

      <!-- 8. CONTACT + INTERACTIVE 3D MASCOT -->
      <section id="contact" class="contact-section" aria-labelledby="contact-heading">
        <div class="container contact-grid">
          <div class="contact-copy">
            <div class="eyebrow" data-scroll-copy>${cfg.contact.eyebrow}</div>
            <h2 id="contact-heading" class="contact-headline">
              <span class="ch-muted" data-scroll-heading>${cfg.contact.mutedHeadline}</span>
              <span class="ch-bold" data-scroll-heading>${cfg.contact.boldHeadline}</span>
            </h2>
            <p class="contact-body" data-scroll-copy data-scroll-stagger="1">${cfg.contact.body}</p>

            <div class="contact-cta-row" data-scroll-copy data-scroll-stagger="2">
              <button type="button" class="btn-yellow-pill" data-open-audit>
                ${cfg.contact.primaryCta} <span aria-hidden="true">&rarr;</span>
              </button>
              <span class="contact-email">
                ${cfg.contact.emailPrefix}
                <a href="mailto:${cfg.brand.email}">${cfg.brand.email}</a>
              </span>
            </div>

            <p class="contact-caption" data-scroll-copy data-scroll-stagger="2">${cfg.contact.caption}</p>
          </div>

          <div class="contact-logo-panel" data-scroll-card data-scroll-stagger="1">
            <div class="contact-logo-stage" id="contact-logo-3d-host"></div>
            <div class="map-hint" data-scroll-copy>DRAG TO ROTATE &middot; DEPLOY 3D</div>
          </div>
        </div>
      </section>
    </main>

    <!-- 9. STUDIO FOOTER (Curved Dark Cap + Alabaster Light Stage) -->
    <footer class="site-footer" id="site-footer" data-asset-slot="legal-mark">
      <div class="footer-dark-cap" data-scroll-copy data-scroll-bottom>
        <div class="footer-cap-inner">
          <p class="footer-copy">${cfg.footer.copyright}</p>
          <nav class="footer-cap-nav" aria-label="Footer">
            <a href="#services" class="footer-cap-link">Portfolio</a>
            <a href="#results" class="footer-cap-link">Impact</a>
            <a href="#process" class="footer-cap-link">Process</a>
            ${cfg.footer.legalLinks
              .map(
                (l) => `<button type="button" class="footer-cap-link" data-open-legal="${l.id}">${l.label}</button>`
              )
              .join('')}
          </nav>
        </div>
      </div>

      <div class="footer-light-body">
        <div class="container footer-light-inner">
          <div class="footer-center-brand">
            <a href="#top" class="footer-wordmark-lockup" aria-label="${cfg.brand.name} back to top" data-scroll-card data-scroll-bottom>
              ${renderLogoMark('legal-mark')}
              <span class="fw-bold">deploy</span><span class="fw-light">studio</span>
            </a>
            <p class="footer-agency-sub" data-scroll-heading data-scroll-bottom>
              We Build, You Lead &mdash; Custom Websites, SaaS Platforms &amp; Company Systems
            </p>

            <div class="footer-social-row" aria-label="Studio links" data-scroll-copy data-scroll-bottom data-scroll-stagger="1">
              <a
                href="https://github.com/youssefelhalawanyyy"
                target="_blank"
                rel="noopener noreferrer"
                class="footer-social-circle"
                aria-label="DEPLOY on GitHub"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.02c-3.2.7-3.88-1.38-3.88-1.38-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.42.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/>
                </svg>
              </a>

              <a href="#services" class="footer-social-circle" aria-label="Explore Portfolio">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9.5"></circle>
                  <path d="M2.5 12h19M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19Z"></path>
                </svg>
              </a>

              <a href="#process" class="footer-social-circle" aria-label="Our Engineering Process">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </a>

              <a href="mailto:${cfg.brand.email}" class="footer-social-circle" aria-label="Email ${cfg.brand.email}">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                  <polyline points="3 7 12 13 21 7"></polyline>
                </svg>
              </a>
            </div>
          </div>

          <div class="footer-pill-actions" data-scroll-card data-scroll-bottom data-scroll-stagger="2">
            <button type="button" class="footer-white-pill" id="replay-tour-btn">
              <span aria-hidden="true">&uarr;</span> ${cfg.footer.replayLabel}
            </button>

            <button type="button" class="footer-white-pill" data-open-audit>
              Start a Project <span aria-hidden="true">&#8599;</span>
            </button>

            <a href="mailto:${cfg.brand.email}" class="footer-white-pill">
              Email Us <span aria-hidden="true">&#8599;</span>
            </a>
          </div>

          <p class="footer-dm-line" data-scroll-copy data-scroll-bottom data-scroll-stagger="2">
            If you have any questions feel free to reach out &mdash;
            <a href="mailto:${cfg.brand.email}">${cfg.brand.email}</a>
          </p>
        </div>
      </div>
    </footer>

    ${renderModalsHTML()}
    ${renderLinusGalleryModalHTML()}
  `;
}

function bootstrap() {
  const root = document.getElementById('app');
  if (!root) return;
  ensureSpeedBlurDefs();
  root.innerHTML = buildAppHTML();
  bindSpeedingOdometerHover(root);
  enhanceScrollTypographyAndSections(root, null);

  const header = document.getElementById('site-header')!;
  const heroSection = document.getElementById('top')!;
  const heroTopEyebrow = heroSection.querySelector<HTMLElement>('.hero-top-eyebrow');
  const heroBottomBar = heroSection.querySelector<HTMLElement>('.hero-bottom-bar')!;
  const heroDisplayTitle = heroSection.querySelector<HTMLElement>('.hero-display-title')!;
  const heroReadingCaption = document.getElementById('hero-reading-caption')!;
  const heroReadingQuery = document.getElementById('hero-reading-query');
  const heroSphereHost = document.getElementById('hero-sphere-host')!;

  const whyNowSection = document.getElementById('why-now')!;
  const whyNowWords = Array.from(document.querySelectorAll<HTMLElement>('.wn-word'));
  const whyNowStats = document.getElementById('why-now-stats')!;

  const storySection = document.getElementById('story')!;
  const servicesSection = document.getElementById('services')!;
  const resultsSection = document.getElementById('results')!;
  const processSection = document.getElementById('process')!;
  const clientsSection = document.querySelector<HTMLElement>('.clients-section')!;
  const contactSection = document.getElementById('contact')!;

  // 1. Mount Hero 3D Glass Sphere (passes headline element for exact letterform masking)
  const sphereCtrl = mountHeroGlassSphere(heroSphereHost, heroReadingQuery, heroDisplayTitle);

  // Pointer & touch tracking for Hero sphere — activates only when cursor/finger is over "DEPLOY"
  let isOverDeploy = false;
  heroReadingCaption.style.opacity = '0';
  heroReadingCaption.style.transition = 'opacity 0.22s ease';

  const setDeployHover = (active: boolean) => {
    isOverDeploy = active;
    sphereCtrl.setActive(active);
    heroReadingCaption.style.opacity = active ? '1' : '0';
  };

  const handleHeroPointer = (clientX: number, clientY: number) => {
    const rect = heroSphereHost.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((clientY - rect.top) / rect.height) * 2 - 1;
    sphereCtrl.setPointer(nx, ny);

    const titleRect = heroDisplayTitle.getBoundingClientRect();
    const pad = window.innerWidth < 768 ? 28 : 20;
    const over =
      clientX >= titleRect.left - pad &&
      clientX <= titleRect.right + pad &&
      clientY >= titleRect.top - pad &&
      clientY <= titleRect.bottom + pad;
    if (over !== isOverDeploy) {
      setDeployHover(over);
    }
  };

  window.addEventListener(
    'pointermove',
    (e) => handleHeroPointer(e.clientX, e.clientY),
    { passive: true }
  );

  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        handleHeroPointer(e.clientX, e.clientY);
      }
    },
    { passive: true }
  );

  document.addEventListener('pointerleave', () => setDeployHover(false));
  const endHeroTouch = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') setDeployHover(false);
  };
  window.addEventListener('pointerup', endHeroTouch, { passive: true });
  window.addEventListener('pointercancel', endHeroTouch, { passive: true });


  // 1b. Mount ambient traveling cyan grid pulses & micro-nodes in Hero
  const heroStickyEl = heroSection.querySelector<HTMLElement>('.hero-sticky');
  if (heroStickyEl) {
    mountGridSignalCanvas(heroStickyEl);
  }
  initInteractiveSpotlightCards();
  const storyCtrl = initScrollStory(storySection);
  const servicesCtrl = initServicesStack(servicesSection);
  const processCtrl = initProcessDiagram(processSection);

  // 3. Init Modals & Audit Form
  const modals = initModalsAndForms((chapterIdx) => {
    const storyRect = storySection.getBoundingClientRect();
    const storyTop = window.scrollY + storyRect.top;
    const storyScrollable = Math.max(1, storySection.offsetHeight - window.innerHeight);
    const targets = [
      0,
      storyTop + storyScrollable * 0.06,
      storyTop + storyScrollable * 0.33,
      storyTop + storyScrollable * 0.62,
      storyTop + storyScrollable * 0.80,
    ];
    window.scrollTo({ top: targets[chapterIdx] ?? 0, behavior: 'smooth' });
  });

  document.querySelectorAll<HTMLElement>('[data-open-audit]').forEach((el) => {
    el.addEventListener('click', () => modals.openAudit(el));
  });
  initLinusGalleryModal((triggerEl) => modals.openAudit(triggerEl));
  document.querySelectorAll<HTMLElement>('[data-open-film]').forEach((el) => {
    el.addEventListener('click', () => modals.openFilm(el));
  });
  document.querySelectorAll<HTMLElement>('[data-open-legal]').forEach((el) => {
    el.addEventListener('click', () => {
      const kind = el.dataset.openLegal as 'impressum' | 'datenschutz';
      modals.openLegal(kind, el);
    });
  });

  // Replay tour button
  document.getElementById('replay-tour-btn')?.addEventListener('click', () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  // Mobile navigation drawer
  const menuToggle = document.getElementById('mobile-menu-toggle') as HTMLButtonElement;
  const mobileDrawer = document.getElementById('mobile-nav-drawer') as HTMLElement;
  const closeDrawer = () => {
    mobileDrawer.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.classList.remove('is-open');
  };
  menuToggle.addEventListener('click', () => {
    const opening = mobileDrawer.hidden;
    mobileDrawer.hidden = !opening;
    menuToggle.setAttribute('aria-expanded', String(opening));
    menuToggle.classList.toggle('is-open', opening);
  });
  mobileDrawer.querySelectorAll('a, button').forEach((el) => {
    el.addEventListener('click', closeDrawer);
  });

  // Marquee Pause/Play toggle (WCAG 2.2.2)
  const marqueeEl = document.getElementById('clients-marquee')!;
  const pauseBtn = document.getElementById('marquee-pause-btn') as HTMLButtonElement;
  let marqueePaused = false;
  pauseBtn.addEventListener('click', () => {
    marqueePaused = !marqueePaused;
    marqueeEl.classList.toggle('is-paused', marqueePaused);
    pauseBtn.setAttribute(
      'aria-label',
      marqueePaused ? 'Play scrolling client marquee' : 'Pause scrolling client marquee'
    );
    pauseBtn.innerHTML = marqueePaused
      ? '<span aria-hidden="true">&#9654;</span>'
      : '<span aria-hidden="true">&#10074;&#10074;</span>';
  });

  // 4. Lazy-Mount Rigged & IK-Driven 3D DEPLOY Mascot only when user approaches Contact section
  const contactLogoHost = document.getElementById('contact-logo-3d-host');
  if (contactLogoHost) {
    let mascotMounted = false;
    const mascotIo = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !mascotMounted) {
          mascotMounted = true;
          mascotIo.disconnect();
          import('./three/ContactMascot3D').then(({ mountContactMascot3D }) => {
            mountContactMascot3D(
              contactLogoHost,
              contactSection,
              './tripo_convert_d4ce10d2-55d9-4093-944b-7692ec975245.glb'
            );
          });
        }
      },
      { rootMargin: '650px' }
    );
    mascotIo.observe(contactSection);
  }

  let lightKnotCtrl: LightKnotController | null = null;
  const knotHostEl = document.getElementById('h33-knot-host');
  if (knotHostEl) {
    let knotMounted = false;
    const knotIo = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !knotMounted) {
          knotMounted = true;
          knotIo.disconnect();
          import('./three/LightKnotHero33').then(({ mountLightKnotHero33 }) => {
            lightKnotCtrl = mountLightKnotHero33(knotHostEl);
          });
        }
      },
      { rootMargin: '650px' }
    );
    knotIo.observe(knotHostEl);
  }

  // Hero 33 Inline Email Signup Form (validates on blur & submit, clears on input, dispatches to studio email)
  const h33Form = document.getElementById('h33-email-form') as HTMLFormElement | null;
  const h33EmailInput = document.getElementById('h33-work-email') as HTMLInputElement | null;
  const h33InputShell = document.getElementById('h33-input-shell');
  const h33Feedback = document.getElementById('h33-email-feedback');
  const h33SubmitBtn = document.getElementById('h33-submit-btn') as HTMLButtonElement | null;
  const h33OpenScopeBtn = document.getElementById('h33-open-full-scope') as HTMLButtonElement | null;

  if (h33Form && h33EmailInput && h33Feedback && h33SubmitBtn) {
    let edited = false;

    const setFieldError = (msg: string) => {
      h33EmailInput.setAttribute('aria-invalid', 'true');
      h33InputShell?.classList.add('is-invalid');
      h33InputShell?.classList.remove('is-success');
      h33Feedback.classList.add('is-error');
      h33Feedback.classList.remove('is-success');
      h33Feedback.textContent = msg;
    };

    const clearFieldError = () => {
      h33EmailInput.removeAttribute('aria-invalid');
      h33InputShell?.classList.remove('is-invalid');
      if (h33Feedback.classList.contains('is-error')) {
        h33Feedback.classList.remove('is-error');
        h33Feedback.textContent = impactEmailHint;
      }
    };

    h33EmailInput.addEventListener('input', () => {
      edited = true;
      h33EmailInput.setCustomValidity('');
      clearFieldError();
    });

    h33EmailInput.addEventListener('blur', () => {
      if (!edited || !h33EmailInput.value.trim()) return;
      if (!h33EmailInput.validity.valid) {
        setFieldError('Please enter a valid work email (e.g. you@company.com).');
      }
    });

    h33OpenScopeBtn?.addEventListener('click', () => {
      const typed = h33EmailInput.value.trim();
      const modalEmail = document.getElementById('audit-email') as HTMLInputElement | null;
      if (typed && modalEmail && !modalEmail.value) {
        modalEmail.value = typed;
      }
      modals.openAudit(h33OpenScopeBtn);
    });

    h33Form.addEventListener('submit', (e) => {
      e.preventDefault();
      const honey = h33Form.querySelector<HTMLInputElement>('input[name="_honey"]');
      if (honey?.value) return;

      const emailVal = h33EmailInput.value.trim();
      if (!emailVal || !h33EmailInput.validity.valid) {
        edited = true;
        setFieldError('Please enter a valid email address to start your project.');
        h33EmailInput.focus();
        return;
      }

      clearFieldError();
      const modalEmail = document.getElementById('audit-email') as HTMLInputElement | null;
      if (modalEmail) modalEmail.value = emailVal;

      const labelSpan = h33SubmitBtn.querySelector<HTMLElement>('.h33-submit-label');
      h33SubmitBtn.disabled = true;
      if (labelSpan) labelSpan.textContent = 'Sending...';

      fetch(`https://formsubmit.co/ajax/${SITE_CONFIG.brand.email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `DEPLOY Quick-Start Request (${emailVal})`,
          email: emailVal,
          source: 'Impact Section — Hero 33 Email Signup',
          _captcha: 'false',
        }),
      })
        .then(() => {
          h33InputShell?.classList.add('is-success');
          h33Feedback.classList.remove('is-error');
          h33Feedback.classList.add('is-success');
          h33Feedback.textContent = `✓ Sent to ${SITE_CONFIG.brand.email} — we'll follow up within 24h.`;
          if (labelSpan) labelSpan.textContent = 'Request sent';
          window.setTimeout(() => {
            h33SubmitBtn.disabled = false;
            if (labelSpan) labelSpan.textContent = 'Start a project';
          }, 3200);
        })
        .catch(() => {
          h33SubmitBtn.disabled = false;
          if (labelSpan) labelSpan.textContent = 'Start a project';
          modals.openAudit(h33SubmitBtn);
        });
    });
  }

  // 5b. Lazy-Mount DEPLOY-blue WebGL Venom liquid button effect on pointer devices (skip on touch phones for 0 GPU overhead)
  const isTouchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (!isTouchOnly) {
    import('./effects/VenomButtons').then(({ initVenomButtons }) => {
      initVenomButtons('.btn-yellow-pill:not(.h33-submit-btn), .nav-audit-btn');
    });
  }

  // Reduced motion listener
  const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionMq.addEventListener('change', (e) => {
    sphereCtrl.setReducedMotion(e.matches);
  });

  // 6. Unified Smooth-Scrubbed Scroll Progress Engine
  // Uses frame-rate-independent exponential damping so mouse-wheel ticks & fast flicks
  // glide with weighted cinematic smoothness without hijacking native browser scrolling.
  let targetScrollNeeded = true;
  const onScroll = () => {
    targetScrollNeeded = true;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  const getSectionProgress = (el: HTMLElement): number => {
    const rect = el.getBoundingClientRect();
    const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
    return clamp01(-rect.top / scrollable);
  };

  // Phone stages use the actual pinned element height, which stays stable as browser chrome moves.
  const phoneStageProgress = (section: HTMLElement, stage: HTMLElement, inset = 0) =>
    clamp01((inset - section.getBoundingClientRect().top) / Math.max(1, section.offsetHeight - stage.offsetHeight));
  const storyStage = storySection.querySelector<HTMLElement>('.story-sticky')!;
  const portfolioStage = servicesSection.querySelector<HTMLElement>('.portfolio-sticky-stage')!;

  let smoothHeroP = 0;
  let smoothAnimP = 0;
  let smoothStatsVis = 0;
  let smoothStoryP = 0;
  let smoothServP = 0;
  let smoothProcP = 0;
  let targetHeroP = 0;
  let targetAnimP = 0;
  let targetStatsVis = 0;
  let targetStoryP = 0;
  let targetServP = 0;
  let targetProcP = 0;
  let initializedTargets = false;
  let lastFrameTime = performance.now();

  const impactScroll = initImpactScroll(resultsSection);
  const mobileScroll = initMobileScroll(processSection, clientsSection, contactSection);
  motionMq.addEventListener('change', onScroll);

  const tickScroll = (now: number) => {
    window.requestAnimationFrame(tickScroll);
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    const vh = window.innerHeight || 800;
    const reduced = motionMq.matches;
    const firstPhoneFrame = !initializedTargets && mobileScroll.phone.matches;

    if (targetScrollNeeded || !initializedTargets) {
      targetScrollNeeded = false;

      const isMobile = mobileScroll.phone.matches;
      targetHeroP = reduced ? 0 : isMobile && heroStickyEl
        ? phoneStageProgress(heroSection, heroStickyEl)
        : getSectionProgress(heroSection);
      if (reduced) {
        targetAnimP = 1;
        targetStatsVis = 1;
      } else if (isMobile) {
        const wnRect = whyNowSection.getBoundingClientRect();
        targetAnimP = clamp01((vh * 0.85 - wnRect.top) / (vh * 0.78));
        targetStatsVis = clamp01((vh * 0.9 - wnRect.top) / (vh * 0.55));
      } else {
        const wnP = getSectionProgress(whyNowSection);
        targetAnimP = clamp01((wnP - 0.03) / 0.58);
        targetStatsVis = clamp01((wnP - 0.54) / 0.24);
      }

      targetStoryP = isMobile ? phoneStageProgress(storySection, storyStage) : getSectionProgress(storySection);
      targetServP = reduced ? 0 : isMobile
        ? phoneStageProgress(servicesSection, portfolioStage, header.offsetHeight)
        : getSectionProgress(servicesSection);

      impactScroll.measure(vh, reduced);
      mobileScroll.measure(vh, reduced);

      targetProcP = reduced ? 1 : getSectionProgress(processSection);

      if (!initializedTargets) {
        smoothHeroP = targetHeroP;
        smoothAnimP = targetAnimP;
        smoothStatsVis = targetStatsVis;
        smoothStoryP = targetStoryP;
        smoothServP = targetServP;
        smoothProcP = targetProcP;
        initializedTargets = true;
      }

      // Adaptive Header Theme responds crisply to live section bounds
      const headerMid = 34;
      const storyLight = targetStoryP > 0.76 && storySection.getBoundingClientRect().bottom > headerMid;
      const inServices =
        servicesSection.getBoundingClientRect().top <= headerMid &&
        servicesSection.getBoundingClientRect().bottom > headerMid;
      const inProcess =
        processSection.getBoundingClientRect().top <= headerMid &&
        processSection.getBoundingClientRect().bottom > headerMid;
      const inClients =
        clientsSection.getBoundingClientRect().top <= headerMid &&
        clientsSection.getBoundingClientRect().bottom > headerMid;
      const footerEl = document.getElementById('site-footer');
      const inFooter = footerEl ? footerEl.getBoundingClientRect().top <= headerMid : false;
      const inContact = contactSection.getBoundingClientRect().top <= headerMid && !inFooter;

      const isLightHeader = inFooter || (!inContact && (storyLight || inServices || inProcess || inClients));
      header.dataset.theme = isLightHeader ? 'light' : 'dark';
    }

    // Smooth exponential damping factor (snaps instantly when reduced-motion is on)
    const damp = reduced ? 1 : 1 - Math.exp(-dt * 6.2);
    mobileScroll.update(damp);
    const impactTurn = impactScroll.update(damp);
    lightKnotCtrl?.setScrollProgress(impactTurn);
    const diffSum =
      Math.abs(targetHeroP - smoothHeroP) +
      Math.abs(targetAnimP - smoothAnimP) +
      Math.abs(targetStatsVis - smoothStatsVis) +
      Math.abs(targetStoryP - smoothStoryP) +
      Math.abs(targetServP - smoothServP) +
      Math.abs(targetProcP - smoothProcP);

    if (diffSum < 0.00015 && initializedTargets && damp < 1 && !firstPhoneFrame) {
      return;
    }

    smoothHeroP += (targetHeroP - smoothHeroP) * damp;
    smoothAnimP += (targetAnimP - smoothAnimP) * damp;
    smoothStatsVis += (targetStatsVis - smoothStatsVis) * damp;
    smoothStoryP += (targetStoryP - smoothStoryP) * damp;
    smoothServP += (targetServP - smoothServP) * damp;
    smoothProcP += (targetProcP - smoothProcP) * damp;

    // A. Hero scroll progress + physical depth parallax
    sphereCtrl.setScrollProgress(smoothHeroP);
    const uiFade = clamp01(1 - smoothHeroP * 2.8);
    heroBottomBar.style.opacity = uiFade.toFixed(3);
    heroBottomBar.style.transform = reduced ? '' : `translate3d(0, ${(smoothHeroP * 32).toFixed(1)}px, 0)`;
    if (heroTopEyebrow) {
      heroTopEyebrow.style.opacity = uiFade.toFixed(3);
      heroTopEyebrow.style.transform = reduced ? '' : `translate3d(0, ${(-smoothHeroP * 26).toFixed(1)}px, 0)`;
    }
    heroReadingCaption.style.opacity = (isOverDeploy ? uiFade : 0).toFixed(3);
    heroDisplayTitle.style.opacity = clamp01(1 - Math.max(0, smoothHeroP - 0.34) * 2.5).toFixed(3);
    heroDisplayTitle.style.transform = reduced
      ? ''
      : `translate3d(0, ${(-smoothHeroP * 56).toFixed(1)}px, 0) scale(${(1 - smoothHeroP * 0.045).toFixed(4)})`;

    // B. Why DEPLOY word-by-word illumination + rolling odometer stats
    const litCount = Math.floor(smoothAnimP * (whyNowWords.length + 1));
    whyNowWords.forEach((w, idx) => {
      w.classList.toggle('is-lit', idx < litCount);
    });
    whyNowStats.style.opacity = smoothStatsVis.toFixed(3);
    whyNowStats.style.transform = `translate3d(0, ${((1 - smoothStatsVis) * 20).toFixed(1)}px, 0)`;
    updateSpeedingOdometer(whyNowStats, smoothStatsVis, dt, reduced);

    // C. 9-Beat Scroll Story
    storyCtrl.update(smoothStoryP);

    // D. Services / Portfolio Scroll-Scrubbed FlexCarousel
    servicesCtrl.update(smoothServP);

    // E. Process 4-Step Curve
    processCtrl.update(smoothProcP);
  };

  window.requestAnimationFrame(tickScroll);
}

bootstrap();
