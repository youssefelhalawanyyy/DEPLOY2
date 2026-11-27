import './styles/main.css';
import { SITE_CONFIG } from './config/siteConfig';
import { mountHeroGlassSphere } from './three/HeroGlassSphere';
import { renderScrollStoryHTML, initScrollStory } from './sections/ScrollStory';
import { renderServicesHTML, initServicesStack } from './sections/ServicesStack';
import { renderProcessHTML, initProcessDiagram } from './sections/ProcessDiagram';
import { renderModalsHTML, initModalsAndForms } from './sections/ModalsAndForms';

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
            <div id="why-now-eyebrow" class="eyebrow">${cfg.whyNow.eyebrow}</div>
            <p class="why-now-statement" id="why-now-statement">
              ${renderWhyNowWords()}
            </p>
            <div class="why-now-stats" id="why-now-stats">
              ${cfg.whyNow.stats
                .map(
                  (s) => `
                <div class="wn-stat-col">
                  <div class="wn-stat-val">${s.value}</div>
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

      <!-- 5. RESULTS (Dark Theme + Animated Counters + Illustrative Case Cards) -->
      <section id="results" class="results-section" aria-labelledby="results-heading">
        <div class="container">
          <div class="results-top-row">
            <div>
              <div class="eyebrow">${cfg.results.eyebrow}</div>
              <h2 id="results-heading" class="section-title-xl results-title">
                ${cfg.results.titleLine1}<br />${cfg.results.titleLine2}
              </h2>
              <p class="section-lead-dark">${cfg.results.subtitle}</p>
            </div>
            <div class="results-badge">${cfg.results.badge}</div>
          </div>

          <div class="results-metrics-grid" id="results-metrics-grid">
            ${cfg.results.metrics
              .map(
                (m, i) => `
              <div class="result-metric">
                <div
                  class="rm-number"
                  data-counter-idx="${i}"
                  data-prefix="${m.prefix || ''}"
                  data-target="${m.target}"
                  data-suffix="${m.suffix}"
                >${m.prefix || ''}0${m.suffix}</div>
                <div class="rm-label">${m.label}</div>
                <div class="rm-sublabel">${m.sublabel}</div>
              </div>
            `
              )
              .join('')}
          </div>

          <div class="results-cases-grid">
            ${cfg.results.cases
              .map(
                (c) => `
              <article class="case-card">
                <div class="case-meta">${c.client} &middot; ${c.city}</div>
                <p class="case-summary">${c.summary}</p>
                <div class="case-pill">${c.pill}</div>
              </article>
            `
              )
              .join('')}
          </div>

          <p class="results-footnote">${cfg.results.footnote}</p>
        </div>
      </section>

      <!-- 6. FOUR-STEP PROCESS (Light Theme Pinned SVG Curve Diagram) -->
      ${renderProcessHTML()}

      <!-- 7. CLIENTS & QUERIES MARQUEE (With Accessible Pause/Play Toggle) -->
      <section class="clients-section" aria-labelledby="clients-heading">
        <div class="container">
          <div class="eyebrow">${cfg.clients.eyebrow}</div>
          <h2 id="clients-heading" class="clients-title">${cfg.clients.title}</h2>
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

        <div class="container clients-footer-row">
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

      <!-- 8. CONTACT + INTERACTIVE 3D DACH MAP -->
      <section id="contact" class="contact-section" aria-labelledby="contact-heading">
        <div class="container contact-grid">
          <div class="contact-copy">
            <div class="eyebrow">${cfg.contact.eyebrow}</div>
            <h2 id="contact-heading" class="contact-headline">
              <span class="ch-muted">${cfg.contact.mutedHeadline}</span>
              <span class="ch-bold">${cfg.contact.boldHeadline}</span>
            </h2>
            <p class="contact-body">${cfg.contact.body}</p>

            <div class="contact-cta-row">
              <button type="button" class="btn-yellow-pill" data-open-audit>
                ${cfg.contact.primaryCta} <span aria-hidden="true">&rarr;</span>
              </button>
              <span class="contact-email">
                ${cfg.contact.emailPrefix}
                <a href="mailto:${cfg.brand.email}">${cfg.brand.email}</a>
              </span>
            </div>

            <p class="contact-caption">${cfg.contact.caption}</p>
          </div>

          <div class="contact-logo-panel">
            <div class="contact-logo-stage" id="contact-logo-3d-host"></div>
            <div class="map-hint">DRAG TO ROTATE &middot; DEPLOY 3D</div>
          </div>
        </div>
      </section>
    </main>

    <!-- 9. LEGAL / FOOTER ENDING -->
    <footer class="site-footer" data-asset-slot="legal-mark">
      <div class="container">
        <div class="footer-top-grid">
          <div class="footer-brand">
            <a href="#top" class="brand-link" aria-label="${cfg.brand.name} back to top">
              ${renderLogoMark('legal-mark')}
              <span class="brand-wordmark">${cfg.brand.wordmark}</span>
            </a>
          </div>

          <div class="footer-col">
            <div class="footer-col-title">SERVICES</div>
            <ul>
              ${cfg.footer.servicesLinks
                .map((s) => `<li><a href="#services">${s}</a></li>`)
                .join('')}
            </ul>
          </div>

          <div class="footer-col">
            <div class="footer-col-title">COMPANY</div>
            <ul>
              ${cfg.footer.studioLinks
                .map((l) => `<li><a href="${l.href}">${l.label}</a></li>`)
                .join('')}
            </ul>
          </div>

          <div class="footer-col">
            <div class="footer-col-title">STUDIO</div>
            <ul>
              ${cfg.footer.officeLines.map((o) => `<li>${o}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="footer-footnotes">
          ${cfg.footer.footnotes.map((fn) => `<p>${fn}</p>`).join('')}
        </div>

        <div class="footer-bottom-bar">
          <p class="footer-copy">${cfg.footer.copyright}</p>
          <div class="footer-bottom-links">
            ${cfg.footer.legalLinks
              .map(
                (l) => `<button type="button" class="footer-link-btn" data-open-legal="${l.id}">${l.label}</button>`
              )
              .join('')}
            <button type="button" class="footer-link-btn" id="replay-tour-btn">
              <span aria-hidden="true">&#8634;</span> ${cfg.footer.replayLabel}
            </button>
          </div>
        </div>
      </div>
    </footer>

    ${renderModalsHTML()}
  `;
}

function bootstrap() {
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = buildAppHTML();

  const header = document.getElementById('site-header')!;
  const heroSection = document.getElementById('top')!;
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

  // 2. Init Scroll Story, Services Stack, Process Diagram
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
      storyTop + storyScrollable * 0.08,
      storyTop + storyScrollable * 0.4,
      storyTop + storyScrollable * 0.75,
      storyTop + storyScrollable * 0.94,
    ];
    window.scrollTo({ top: targets[chapterIdx] ?? 0, behavior: 'smooth' });
  });

  document.querySelectorAll('[data-open-audit]').forEach((el) => {
    el.addEventListener('click', () => modals.openAudit());
  });
  document.querySelectorAll('[data-open-film]').forEach((el) => {
    el.addEventListener('click', () => modals.openFilm());
  });
  document.querySelectorAll<HTMLElement>('[data-open-legal]').forEach((el) => {
    el.addEventListener('click', () => {
      const kind = el.dataset.openLegal as 'impressum' | 'datenschutz';
      modals.openLegal(kind);
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

  // 5. Animated Results Odometer Counters (reversible & reduced-motion safe)
  const counterEls = Array.from(document.querySelectorAll<HTMLElement>('.rm-number'));
  const updateResultsCounters = (progress: number) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p = reduced ? 1 : clamp01(progress);
    const eased = 1 - Math.pow(1 - p, 3);
    counterEls.forEach((el) => {
      const prefix = el.dataset.prefix || '';
      const target = Number(el.dataset.target || '0');
      const suffix = el.dataset.suffix || '';
      const val = Math.round(target * eased);
      el.textContent = `${prefix}${val}${suffix}`;
    });
  };

  // 5b. Lazy-Mount DEPLOY-blue WebGL Venom liquid button effect on pointer devices (skip on touch phones for 0 GPU overhead)
  const isTouchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (!isTouchOnly) {
    import('./effects/VenomButtons').then(({ initVenomButtons }) => {
      initVenomButtons('.btn-yellow-pill, .nav-audit-btn');
    });
  }

  // 5c. Smooth compositor-only scroll reveal for cards across mobile & desktop
  const revealTargets = Array.from(
    document.querySelectorAll<HTMLElement>('.portfolio-card, .result-metric, .case-card, .process-mobile-card')
  );
  revealTargets.forEach((el) => el.classList.add('reveal-on-scroll'));
  const revealIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in-view');
          revealIo.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
  );
  revealTargets.forEach((el) => revealIo.observe(el));

  // Reduced motion listener
  const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionMq.addEventListener('change', (e) => {
    sphereCtrl.setReducedMotion(e.matches);
  });

  // 6. Unified Scroll Progress Engine (single rAF tick, forward & reverse safe)
  let scrollDirty = true;
  const onScroll = () => {
    scrollDirty = true;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  const getSectionProgress = (el: HTMLElement): number => {
    const rect = el.getBoundingClientRect();
    const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
    return clamp01(-rect.top / scrollable);
  };

  const tickScroll = () => {
    window.requestAnimationFrame(tickScroll);
    if (!scrollDirty) return;
    scrollDirty = false;

    const vh = window.innerHeight || 800;
    const reduced = motionMq.matches;

    // A. Hero scroll progress (0..1)
    const heroP = reduced ? 0 : getSectionProgress(heroSection);
    sphereCtrl.setScrollProgress(heroP);
    const uiFade = clamp01(1 - heroP * 3.2);
    heroBottomBar.style.opacity = uiFade.toFixed(3);
    heroReadingCaption.style.opacity = (isOverDeploy ? uiFade : 0).toFixed(3);
    heroDisplayTitle.style.opacity = clamp01(1 - Math.max(0, heroP - 0.32) * 2.8).toFixed(3);

    // B. Why Now word-by-word illumination (waits until pinned in the middle on desktop; viewport-based on mobile)
    const isMobile = window.innerWidth <= 768;
    let animP = 1;
    let statsVis = 1;
    if (!reduced) {
      if (isMobile) {
        const wnRect = whyNowSection.getBoundingClientRect();
        animP = clamp01((vh * 0.85 - wnRect.top) / (vh * 0.65));
        statsVis = clamp01((vh * 0.9 - wnRect.top) / (vh * 0.45));
      } else {
        const wnP = getSectionProgress(whyNowSection);
        animP = clamp01((wnP - 0.12) / 0.64);
        statsVis = clamp01((wnP - 0.72) / 0.16);
      }
    }
    const litCount = Math.floor(animP * (whyNowWords.length + 1));
    whyNowWords.forEach((w, idx) => {
      w.classList.toggle('is-lit', idx < litCount);
    });
    whyNowStats.style.opacity = statsVis.toFixed(3);
    whyNowStats.style.transform = `translate3d(0, ${((1 - statsVis) * 20).toFixed(1)}px, 0)`;

    // C. 9-Beat Scroll Story
    const storyP = getSectionProgress(storySection);
    storyCtrl.update(storyP);

    // D. Services Stack live diagrams
    servicesCtrl.update();

    // E. Results counters
    const resRect = resultsSection.getBoundingClientRect();
    const resP = clamp01((vh * 0.85 - resRect.top) / (vh * 0.45));
    updateResultsCounters(resP);

    // F. Process 4-Step Curve
    const procP = reduced ? 1 : getSectionProgress(processSection);
    processCtrl.update(procP);

    // G. Adaptive Header Theme (dark vs light sections)
    const headerMid = 34;
    const storyLight = storyP > 0.86 && storySection.getBoundingClientRect().bottom > headerMid;
    const inServices =
      servicesSection.getBoundingClientRect().top <= headerMid &&
      servicesSection.getBoundingClientRect().bottom > headerMid;
    const inProcess =
      processSection.getBoundingClientRect().top <= headerMid &&
      processSection.getBoundingClientRect().bottom > headerMid;
    const inClients =
      clientsSection.getBoundingClientRect().top <= headerMid &&
      clientsSection.getBoundingClientRect().bottom > headerMid;
    const inContact = contactSection.getBoundingClientRect().top <= headerMid;

    const isLightHeader = !inContact && (storyLight || inServices || inProcess || inClients);
    header.dataset.theme = isLightHeader ? 'light' : 'dark';
  };

  tickScroll();
}

bootstrap();
