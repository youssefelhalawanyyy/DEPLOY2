import { SITE_CONFIG } from '../config/siteConfig';

export interface ModalsController {
  openAudit: () => void;
  openFilm: () => void;
  openLegal: (kind: 'impressum' | 'datenschutz') => void;
}

export function renderModalsHTML(): string {
  const { auditForm, filmModal, legal } = SITE_CONFIG;
  return `
    <!-- Audit Request Modal -->
    <dialog id="audit-dialog" class="zeroth-dialog" aria-labelledby="audit-dialog-title">
      <div class="dialog-panel">
        <div class="dialog-header">
          <div>
            <div class="eyebrow">CUSTOM SOFTWARE &amp; ENGINEERING</div>
            <h2 id="audit-dialog-title" class="dialog-title">${auditForm.title}</h2>
          </div>
          <button type="button" class="dialog-close" data-close-dialog aria-label="Close project dialog">&times;</button>
        </div>
        <p class="dialog-subtitle">${auditForm.subtitle}</p>

        <form id="audit-form" class="audit-form" novalidate>
          <div class="form-field">
            <label for="audit-name">Your name</label>
            <input
              type="text"
              id="audit-name"
              name="name"
              required
              autocomplete="name"
              placeholder="e.g. Alex Weber"
              data-error="audit-name-error"
            />
            <div id="audit-name-error" class="error-msg">
              <span role="img" aria-label="Error">!</span> Please enter your name.
            </div>
          </div>

          <div class="form-field">
            <label for="audit-email">Work email</label>
            <span id="audit-email-hint" class="field-hint">Format: name@company.com</span>
            <input
              type="email"
              id="audit-email"
              name="email"
              required
              autocomplete="email"
              placeholder="alex@company.example"
              aria-describedby="audit-email-hint"
              data-error="audit-email-error"
            />
            <div id="audit-email-error" class="error-msg">
              <span role="img" aria-label="Error">!</span> Enter a valid work email address in the format name@company.com.
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-field">
              <label for="audit-website">Company or project URL</label>
              <span id="audit-website-hint" class="field-hint">Include https://</span>
              <input
                type="url"
                id="audit-website"
                name="website"
                required
                autocomplete="url"
                placeholder="https://example.com"
                aria-describedby="audit-website-hint"
                data-error="audit-website-error"
              />
              <div id="audit-website-error" class="error-msg">
                <span role="img" aria-label="Error">!</span> Enter a valid URL starting with https://.
              </div>
            </div>

            <div class="form-field">
              <label for="audit-city">What are we building?</label>
              <input
                type="text"
                id="audit-city"
                name="city"
                required
                placeholder="Website, SaaS, or Company System"
                data-error="audit-city-error"
              />
              <div id="audit-city-error" class="error-msg">
                <span role="img" aria-label="Error">!</span> Tell us what type of software you need.
              </div>
            </div>
          </div>

          <div class="form-field">
            <label for="audit-query">Key goals or integrations (optional)</label>
            <input
              type="text"
              id="audit-query"
              name="query"
              placeholder="e.g. Stripe billing, internal ERP, custom dashboard"
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-yellow-pill">${auditForm.submitLabel} &rarr;</button>
            <span class="form-demo-note">${auditForm.note}</span>
          </div>
        </form>

        <div id="audit-success" class="audit-success" hidden>
          <div class="success-badge">RECEIVED</div>
          <h3>${auditForm.successTitle}</h3>
          <p>${auditForm.successBody}</p>
          <div class="success-summary" id="audit-success-summary"></div>
          <button type="button" class="btn-outline-light" id="audit-reset-btn">Submit another enquiry</button>
        </div>
      </div>
    </dialog>

    <!-- Watch the Film Modal -->
    <dialog id="film-dialog" class="zeroth-dialog" aria-labelledby="film-dialog-title">
      <div class="dialog-panel dialog-panel-wide">
        <div class="dialog-header">
          <div>
            <div class="eyebrow">SCROLL STORY OVERVIEW</div>
            <h2 id="film-dialog-title" class="dialog-title">${filmModal.title}</h2>
          </div>
          <button type="button" class="dialog-close" data-close-dialog aria-label="Close film modal">&times;</button>
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

    <!-- Legal Modal (Impressum / Datenschutz) -->
    <dialog id="legal-dialog" class="zeroth-dialog" aria-labelledby="legal-dialog-title">
      <div class="dialog-panel">
        <div class="dialog-header">
          <div>
            <div class="eyebrow">REFERENCE STUDY NOTICE</div>
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
  const auditDialog = document.getElementById('audit-dialog') as HTMLDialogElement;
  const filmDialog = document.getElementById('film-dialog') as HTMLDialogElement;
  const legalDialog = document.getElementById('legal-dialog') as HTMLDialogElement;
  const legalTitle = document.getElementById('legal-dialog-title')!;
  const legalBody = document.getElementById('legal-dialog-body')!;

  const form = document.getElementById('audit-form') as HTMLFormElement;
  const successBox = document.getElementById('audit-success') as HTMLElement;
  const successSummary = document.getElementById('audit-success-summary') as HTMLElement;
  const resetBtn = document.getElementById('audit-reset-btn') as HTMLButtonElement;

  // Close buttons & backdrop click
  [auditDialog, filmDialog, legalDialog].forEach((dlg) => {
    dlg.querySelectorAll('[data-close-dialog]').forEach((btn) => {
      btn.addEventListener('click', () => dlg.close());
    });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });
  });

  // Film chapter jump buttons
  filmDialog.querySelectorAll<HTMLButtonElement>('.film-chapter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.chapterIdx || '0');
      filmDialog.close();
      onJumpToChapter(idx);
    });
  });

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

  const fields = Array.from(form.querySelectorAll<HTMLInputElement>('input'));
  fields.forEach((f) => f.setAttribute('aria-invalid', 'false'));

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
    for (const f of fields) {
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
    const website = String(data.get('website') || '').trim();
    const city = String(data.get('city') || '').trim();

    successSummary.textContent = `Prepared for ${name} · ${website} · ${city}`;
    form.hidden = true;
    successBox.hidden = false;
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    fields.forEach((f) => {
      f.setAttribute('aria-invalid', 'false');
      f.classList.remove('user-invalid-fallback');
      linkError(f, false);
      flagged.delete(f);
      announced.delete(f);
    });
    successBox.hidden = true;
    form.hidden = false;
    fields[0]?.focus();
  });

  return {
    openAudit() {
      if (!auditDialog.open) auditDialog.showModal();
    },
    openFilm() {
      if (!filmDialog.open) filmDialog.showModal();
    },
    openLegal(kind) {
      const { legal } = SITE_CONFIG;
      legalTitle.textContent = kind === 'impressum' ? legal.impressumTitle : legal.datenschutzTitle;
      const paragraphs = kind === 'impressum' ? legal.impressumBody : legal.datenschutzBody;
      legalBody.innerHTML = paragraphs.map((p) => `<p>${p}</p>`).join('');
      if (!legalDialog.open) legalDialog.showModal();
    },
  };
}
