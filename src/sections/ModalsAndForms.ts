import { SITE_CONFIG } from '../config/siteConfig';

export interface ModalsController {
  openAudit: (triggerEl?: HTMLElement | null) => void;
  openFilm: (triggerEl?: HTMLElement | null) => void;
  openLegal: (kind: 'impressum' | 'datenschutz', triggerEl?: HTMLElement | null) => void;
}

const BUILD_TYPES = [
  { id: 'website', icon: '◈', title: 'Website / 3D Web', sub: 'Brand, marketing & motion' },
  { id: 'saas', icon: '⚡', title: 'SaaS Platform', sub: 'Multi-tenant, auth & billing' },
  { id: 'erp', icon: '⊞', title: 'Company System', sub: 'Custom ERP, POS & portals' },
  { id: 'ai', icon: '✦', title: 'AI & Automation', sub: 'Copilots, agents & pipelines' },
];

const TIMELINES = ['2–4 Weeks', '1–2 Months', '3+ Months', 'Flexible'];
const SCOPES = ['MVP / V1', 'Full System', 'Scale & Revamp', 'Retainer'];

export function renderModalsHTML(): string {
  const { filmModal, legal, brand } = SITE_CONFIG;
  return `
    <!-- Portal shockwave burst layer -->
    <div id="portal-burst-layer" class="portal-burst-layer" aria-hidden="true"></div>

    <!-- Interactive 2-Step Project Configurator Modal -->
    <dialog id="audit-dialog" class="zeroth-dialog project-modal" aria-labelledby="audit-dialog-title">
      <div class="dialog-panel project-dialog-panel">
        <div class="dialog-glow-rim" aria-hidden="true"></div>

        <div class="dialog-header">
          <div>
            <div class="project-step-meta">
              <span class="eyebrow" id="project-step-eyebrow">STEP 01 / 02 &middot; CONFIGURE SCOPE</span>
            </div>
            <h2 id="audit-dialog-title" class="dialog-title">Start your build.</h2>
          </div>
          <button type="button" class="dialog-close" data-close-dialog aria-label="Close project configurator">&times;</button>
        </div>

        <!-- Animated Progress Bar -->
        <div class="project-progress-bar" aria-hidden="true">
          <span class="project-progress-fill" id="project-progress-fill" style="width: 50%"></span>
        </div>

        <form id="audit-form" class="audit-form" novalidate>
          <!-- STEP 1: Interactive Visual Scope Picker -->
          <div class="project-step is-active" id="project-step-1">
            <div class="cfg-group">
              <span class="cfg-label" id="build-type-label">What are we engineering? <small>(select one or more)</small></span>
              <div class="cfg-cards-grid" role="group" aria-labelledby="build-type-label">
                ${BUILD_TYPES.map(
                  (b, idx) => `
                  <button
                    type="button"
                    class="cfg-type-card ${idx === 0 ? 'is-selected' : ''}"
                    data-build-type="${b.title}"
                    aria-pressed="${idx === 0 ? 'true' : 'false'}"
                  >
                    <span class="cfg-card-icon" aria-hidden="true">${b.icon}</span>
                    <span class="cfg-card-text">
                      <strong>${b.title}</strong>
                      <span>${b.sub}</span>
                    </span>
                    <span class="cfg-card-check" aria-hidden="true">&#10003;</span>
                  </button>
                `
                ).join('')}
              </div>
            </div>

            <div class="cfg-row-split">
              <fieldset class="cfg-fieldset">
                <legend class="cfg-label">Target timeline</legend>
                <div class="cfg-pills-wrap">
                  ${TIMELINES.map(
                    (t, i) => `
                    <label class="cfg-radio-pill">
                      <input type="radio" name="timeline" value="${t}" ${i === 1 ? 'checked' : ''} />
                      <span>${t}</span>
                    </label>
                  `
                  ).join('')}
                </div>
              </fieldset>

              <fieldset class="cfg-fieldset">
                <legend class="cfg-label">Engagement</legend>
                <div class="cfg-pills-wrap">
                  ${SCOPES.map(
                    (s, i) => `
                    <label class="cfg-radio-pill">
                      <input type="radio" name="scope" value="${s}" ${i === 1 ? 'checked' : ''} />
                      <span>${s}</span>
                    </label>
                  `
                  ).join('')}
                </div>
              </fieldset>
            </div>

            <div class="project-step-footer">
              <span class="step-footer-hint">30-min architecture call &middot; 100% code ownership</span>
              <button type="button" class="btn-yellow-pill" id="project-next-btn">
                Continue <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>

          <!-- STEP 2: Contact Details & Brief -->
          <div class="project-step" id="project-step-2" hidden>
            <div class="selected-scope-bar">
              <div class="selected-scope-chips" id="selected-scope-chips"></div>
              <button type="button" class="scope-back-btn" id="project-back-btn">&larr; Edit scope</button>
            </div>

            <div class="form-row-2">
              <div class="form-field">
                <label for="audit-name">Your name</label>
                <input
                  type="text"
                  id="audit-name"
                  name="name"
                  required
                  autocomplete="name"
                  placeholder="Alex Weber"
                  data-error="audit-name-error"
                />
                <div id="audit-name-error" class="error-msg">
                  <span role="img" aria-label="Error">!</span> Please enter your name.
                </div>
              </div>

              <div class="form-field">
                <label for="audit-email">Work email</label>
                <input
                  type="email"
                  id="audit-email"
                  name="email"
                  required
                  autocomplete="email"
                  placeholder="alex@company.com"
                  data-error="audit-email-error"
                />
                <div id="audit-email-error" class="error-msg">
                  <span role="img" aria-label="Error">!</span> Enter a valid email (e.g. alex@company.com).
                </div>
              </div>
            </div>

            <div class="form-field">
              <label for="audit-company">Company or current website <span class="opt-tag">(optional)</span></label>
              <input
                type="text"
                id="audit-company"
                name="company"
                autocomplete="organization"
                placeholder="Acme Corp / acme.com"
              />
            </div>

            <div class="form-field">
              <label for="audit-brief">Project brief <span class="opt-tag">(optional)</span></label>
              <textarea
                id="audit-brief"
                name="brief"
                rows="3"
                placeholder="Key workflows, integrations, or goals..."
              ></textarea>
            </div>

            <div class="project-step-footer">
              <button type="button" class="scope-back-btn" id="project-back-btn-2">&larr; Back</button>
              <button type="submit" class="btn-yellow-pill" id="project-submit-btn">
                <span class="submit-btn-label">Deploy brief &rarr;</span>
              </button>
            </div>
          </div>
        </form>

        <!-- STEP 3: Animated Deployment Success State -->
        <div id="audit-success" class="audit-success-stage" hidden>
          <div class="success-ring-wrap" aria-hidden="true">
            <svg class="success-ring-svg" viewBox="0 0 72 72" fill="none">
              <circle class="sr-circle" cx="36" cy="36" r="32" stroke="#22c1ec" stroke-width="2.5" />
              <path class="sr-check" d="M22 36.5L31.5 46L50 27" stroke="#22c1ec" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <div class="success-status-pills" aria-hidden="true">
            <span class="ss-pill is-lit">&#10003; SCOPE LOCKED</span>
            <span class="ss-pill is-lit" style="animation-delay:0.12s">&#10003; BRIEF COMPILED</span>
            <span class="ss-pill is-lit" style="animation-delay:0.24s">&#10003; READY TO SHIP</span>
          </div>

          <h3 class="success-heading">Brief ready for kickoff.</h3>
          <p class="success-sub">Your architecture scope is packaged below.</p>

          <div class="success-summary-card" id="audit-success-summary"></div>

          <div class="success-actions-row">
            <a id="audit-mailto-link" href="mailto:${brand.email}" class="btn-yellow-pill">
              Send via Email &rarr;
            </a>
            <button type="button" class="btn-outline-light" id="audit-reset-btn">Configure another</button>
          </div>
        </div>
      </div>
    </dialog>

    <!-- Watch the Film / Chapters Modal -->
    <dialog id="film-dialog" class="zeroth-dialog" aria-labelledby="film-dialog-title">
      <div class="dialog-panel dialog-panel-wide">
        <div class="dialog-glow-rim" aria-hidden="true"></div>
        <div class="dialog-header">
          <div>
            <div class="eyebrow">SCROLL STORY OVERVIEW</div>
            <h2 id="film-dialog-title" class="dialog-title">${filmModal.title}</h2>
          </div>
          <button type="button" class="dialog-close" data-close-dialog aria-label="Close chapters modal">&times;</button>
        </div>
        <p class="dialog-subtitle">${filmModal.subtitle}</p>
        <div class="film-chapters">
          ${filmModal.chapters
            .map(
              (ch, i) => `
            <button type="button" class="film-chapter-btn" data-chapter-idx="${i}">
              <span class="fc-time">${ch.time}</span>
              <span class="fc-label">${ch.label}</span>
              <span class="fc-summary">${ch.summary}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>
    </dialog>

    <!-- Legal Modal -->
    <dialog id="legal-dialog" class="zeroth-dialog" aria-labelledby="legal-dialog-title">
      <div class="dialog-panel">
        <div class="dialog-glow-rim" aria-hidden="true"></div>
        <div class="dialog-header">
          <div>
            <div class="eyebrow">LEGAL</div>
            <h2 id="legal-dialog-title" class="dialog-title">${legal.impressumTitle}</h2>
          </div>
          <button type="button" class="dialog-close" data-close-dialog aria-label="Close legal notice">&times;</button>
        </div>
        <div id="legal-dialog-body" class="legal-dialog-body"></div>
      </div>
    </dialog>
  `;
}

export function initModalsAndForms(onJumpToChapter: (chapterIdx: number) => void): ModalsController {
  const burstLayer = document.getElementById('portal-burst-layer')!;
  const auditDialog = document.getElementById('audit-dialog') as HTMLDialogElement;
  const filmDialog = document.getElementById('film-dialog') as HTMLDialogElement;
  const legalDialog = document.getElementById('legal-dialog') as HTMLDialogElement;
  const legalTitle = document.getElementById('legal-dialog-title')!;
  const legalBody = document.getElementById('legal-dialog-body')!;

  const form = document.getElementById('audit-form') as HTMLFormElement;
  const step1 = document.getElementById('project-step-1') as HTMLElement;
  const step2 = document.getElementById('project-step-2') as HTMLElement;
  const stepEyebrow = document.getElementById('project-step-eyebrow') as HTMLElement;
  const dialogTitle = document.getElementById('audit-dialog-title') as HTMLElement;
  const progressFill = document.getElementById('project-progress-fill') as HTMLElement;
  const nextBtn = document.getElementById('project-next-btn') as HTMLButtonElement;
  const backBtn1 = document.getElementById('project-back-btn') as HTMLButtonElement;
  const backBtn2 = document.getElementById('project-back-btn-2') as HTMLButtonElement;
  const scopeChipsEl = document.getElementById('selected-scope-chips') as HTMLElement;

  const successBox = document.getElementById('audit-success') as HTMLElement;
  const successSummary = document.getElementById('audit-success-summary') as HTMLElement;
  const mailtoLink = document.getElementById('audit-mailto-link') as HTMLAnchorElement;
  const resetBtn = document.getElementById('audit-reset-btn') as HTMLButtonElement;

  const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Trigger a luminous DEPLOY-cyan portal shockwave from the exact clicked button & morph dialog open
  const openDialogWithPortal = (dlg: HTMLDialogElement, triggerEl?: HTMLElement | null) => {
    const panel = dlg.querySelector<HTMLElement>('.dialog-panel');
    if (triggerEl && !isReduced()) {
      const r = triggerEl.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      // Spawn expanding shockwave ring + glow burst from button center
      const wave = document.createElement('div');
      wave.className = 'portal-shockwave';
      wave.style.left = `${cx}px`;
      wave.style.top = `${cy}px`;
      burstLayer.appendChild(wave);
      window.setTimeout(() => wave.remove(), 750);

      // Compute transform-origin relative to viewport center so panel unfolds out of the clicked button
      const ox = cx - window.innerWidth / 2;
      const oy = cy - window.innerHeight / 2;
      if (panel) {
        panel.style.setProperty('--origin-x', `${(ox * 0.38).toFixed(0)}px`);
        panel.style.setProperty('--origin-y', `${(oy * 0.38).toFixed(0)}px`);
      }
    } else if (panel) {
      panel.style.setProperty('--origin-x', '0px');
      panel.style.setProperty('--origin-y', '22px');
    }

    dlg.classList.remove('is-closing');
    if (!dlg.open) dlg.showModal();
    requestAnimationFrame(() => {
      dlg.classList.add('is-open');
    });
  };

  const closeDialogSmoothly = (dlg: HTMLDialogElement) => {
    if (!dlg.open) return;
    if (isReduced()) {
      dlg.classList.remove('is-open', 'is-closing');
      dlg.close();
      return;
    }
    dlg.classList.remove('is-open');
    dlg.classList.add('is-closing');
    window.setTimeout(() => {
      dlg.classList.remove('is-closing');
      if (dlg.open) dlg.close();
    }, 240);
  };

  [auditDialog, filmDialog, legalDialog].forEach((dlg) => {
    dlg.querySelectorAll('[data-close-dialog]').forEach((btn) => {
      btn.addEventListener('click', () => closeDialogSmoothly(dlg));
    });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) closeDialogSmoothly(dlg);
    });
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeDialogSmoothly(dlg);
    });
  });

  filmDialog.querySelectorAll<HTMLButtonElement>('.film-chapter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.chapterIdx || '0');
      closeDialogSmoothly(filmDialog);
      onJumpToChapter(idx);
    });
  });

  // Step 1: Multi-select build type cards
  const typeCards = Array.from(form.querySelectorAll<HTMLButtonElement>('.cfg-type-card'));
  typeCards.forEach((card) => {
    card.addEventListener('click', () => {
      const selectedCount = typeCards.filter((c) => c.classList.contains('is-selected')).length;
      const isSelected = card.classList.contains('is-selected');
      // Keep at least 1 selected
      if (isSelected && selectedCount <= 1) return;
      const next = !isSelected;
      card.classList.toggle('is-selected', next);
      card.setAttribute('aria-pressed', String(next));
    });
  });

  const getScopeState = () => {
    const types = typeCards
      .filter((c) => c.classList.contains('is-selected'))
      .map((c) => c.dataset.buildType || '');
    const timeline =
      (form.querySelector<HTMLInputElement>('input[name="timeline"]:checked')?.value) || '1–2 Months';
    const scope =
      (form.querySelector<HTMLInputElement>('input[name="scope"]:checked')?.value) || 'Full System';
    return { types, timeline, scope };
  };

  const showStep = (stepNum: 1 | 2) => {
    if (stepNum === 1) {
      step2.hidden = true;
      step2.classList.remove('is-active');
      step1.hidden = false;
      requestAnimationFrame(() => step1.classList.add('is-active'));
      stepEyebrow.innerHTML = 'STEP 01 / 02 &middot; CONFIGURE SCOPE';
      dialogTitle.textContent = 'Start your build.';
      progressFill.style.width = '50%';
    } else {
      const { types, timeline, scope } = getScopeState();
      scopeChipsEl.innerHTML = [...types, timeline, scope]
        .map((label) => `<span class="summary-chip">${label}</span>`)
        .join('');
      step1.hidden = true;
      step1.classList.remove('is-active');
      step2.hidden = false;
      requestAnimationFrame(() => step2.classList.add('is-active'));
      stepEyebrow.innerHTML = 'STEP 02 / 02 &middot; YOUR DETAILS';
      dialogTitle.textContent = 'Where do we send the plan?';
      progressFill.style.width = '100%';
      document.getElementById('audit-name')?.focus();
    }
  };

  nextBtn.addEventListener('click', () => showStep(2));
  backBtn1.addEventListener('click', () => showStep(1));
  backBtn2.addEventListener('click', () => showStep(1));

  // Accessible :user-invalid + aria-invalid + aria-describedby sync with polite live region
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', 'polite');
  announcer.className = 'visually-hidden';
  document.body.appendChild(announcer);

  let announceTimer: number | undefined;
  let announcedField: HTMLElement | null = null;
  const flagged = new WeakSet<Element>();
  const announced = new WeakSet<Element>();
  const dirtyFallback = new WeakMap<Element, { interacted: boolean; blurred: boolean }>();
  const supportsUserInvalid = CSS.supports('selector(:user-invalid)');

  const linkError = (el: HTMLElement, shown: boolean) => {
    const errorId = el.dataset.error;
    if (!errorId) return;
    const ids = (el.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter((id) => id && id !== errorId);
    if (shown) ids.push(errorId);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
    else el.removeAttribute('aria-describedby');
  };

  const announceError = (el: HTMLInputElement) => {
    const errorId = el.dataset.error;
    if (!errorId) return;
    const errEl = document.getElementById(errorId);
    if (!errEl) return;
    const labelText = el.labels?.[0]?.textContent?.trim() || '';
    const msg = errEl.textContent?.replace(/\s+/g, ' ').trim() || '';
    window.clearTimeout(announceTimer);
    announcer.textContent = '';
    announcedField = el;
    announceTimer = window.setTimeout(() => {
      announcer.textContent = labelText ? `${labelText}: ${msg}` : msg;
    }, 500);
  };

  const syncAria = (el: Element | null, announce = false, forceInvalidCheck = false) => {
    if (!(el instanceof HTMLInputElement)) return;
    let isInvalid = false;

    if (supportsUserInvalid) {
      isInvalid = forceInvalidCheck ? !el.validity.valid : el.matches(':user-invalid');
      if (forceInvalidCheck) {
        el.classList.toggle('user-invalid-fallback', isInvalid);
      }
    } else {
      const state = dirtyFallback.get(el);
      isInvalid = Boolean((forceInvalidCheck || (state?.interacted && state?.blurred)) && !el.validity.valid);
      el.classList.toggle('user-invalid-fallback', isInvalid);
    }

    if (isInvalid) {
      if (announce && !announced.has(el)) {
        announceError(el);
        announced.add(el);
      }
      el.setAttribute('aria-invalid', 'true');
      linkError(el, true);
      flagged.add(el);
    } else if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
      el.setAttribute('aria-invalid', 'false');
      el.classList.remove('user-invalid-fallback');
      linkError(el, false);
      flagged.delete(el);
      announced.delete(el);
      if (announcedField === el) {
        window.clearTimeout(announceTimer);
        announcer.textContent = '';
      }
    }
  };

  const requiredFields = Array.from(form.querySelectorAll<HTMLInputElement>('input[required]'));
  requiredFields.forEach((f) => f.setAttribute('aria-invalid', 'false'));

  form.addEventListener(
    'blur',
    (e) => {
      const target = e.target as HTMLInputElement;
      if (!supportsUserInvalid && target instanceof HTMLInputElement) {
        const s = dirtyFallback.get(target) || { interacted: false, blurred: false };
        s.blurred = true;
        dirtyFallback.set(target, s);
      }
      syncAria(target, true);
    },
    true
  );

  form.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (!supportsUserInvalid && target instanceof HTMLInputElement) {
      const s = dirtyFallback.get(target) || { interacted: false, blurred: false };
      s.interacted = true;
      dirtyFallback.set(target, s);
    }
    syncAria(target, false);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstInvalid: HTMLInputElement | null = null;
    for (const f of requiredFields) {
      if (!f.validity.valid) {
        announced.add(f);
        syncAria(f, false, true);
        if (!firstInvalid) firstInvalid = f;
      } else {
        syncAria(f, false, false);
      }
    }
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const company = String(data.get('company') || '').trim();
    const brief = String(data.get('brief') || '').trim();
    const { types, timeline, scope } = getScopeState();

    successSummary.innerHTML = `
      <div class="ss-row"><span>CLIENT</span><strong>${name}${company ? ` &middot; ${company}` : ''}</strong></div>
      <div class="ss-row"><span>BUILD</span><strong>${types.join(', ')}</strong></div>
      <div class="ss-row"><span>TIMELINE</span><strong>${timeline} &middot; ${scope}</strong></div>
      <div class="ss-row"><span>EMAIL</span><strong>${email}</strong></div>
    `;

    const subject = encodeURIComponent(`DEPLOY Project Brief — ${types.join(' + ')} (${company || name})`);
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : '',
      `Systems: ${types.join(', ')}`,
      `Timeline: ${timeline}`,
      `Engagement: ${scope}`,
      brief ? `\nBrief:\n${brief}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    mailtoLink.href = `mailto:${SITE_CONFIG.brand.email}?subject=${subject}&body=${encodeURIComponent(bodyLines)}`;

    stepEyebrow.innerHTML = 'DEPLOYED &middot; BRIEF READY';
    dialogTitle.textContent = 'Let’s build.';
    form.hidden = true;
    successBox.hidden = false;
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    requiredFields.forEach((f) => {
      f.setAttribute('aria-invalid', 'false');
      f.classList.remove('user-invalid-fallback');
      linkError(f, false);
      flagged.delete(f);
      announced.delete(f);
    });
    successBox.hidden = true;
    form.hidden = false;
    showStep(1);
  });

  return {
    openAudit(triggerEl) {
      openDialogWithPortal(auditDialog, triggerEl);
    },
    openFilm(triggerEl) {
      openDialogWithPortal(filmDialog, triggerEl);
    },
    openLegal(kind, triggerEl) {
      const { legal } = SITE_CONFIG;
      legalTitle.textContent = kind === 'impressum' ? legal.impressumTitle : legal.datenschutzTitle;
      const paragraphs = kind === 'impressum' ? legal.impressumBody : legal.datenschutzBody;
      legalBody.innerHTML = paragraphs.map((p) => `<p>${p}</p>`).join('');
      openDialogWithPortal(legalDialog, triggerEl);
    },
  };
}
