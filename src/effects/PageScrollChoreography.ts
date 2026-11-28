/**
 * Full-Page Scroll Choreography & Kinetic Text Reveal Engine
 *
 * - Splits `[data-scroll-heading]` elements into accessible screen-reader-intact
 *   headings + masked visual `.st-word` tokens driven by native CSS
 *   `animation-timeline: view()` on the compositor thread.
 * - Drives `[data-scroll-copy]` (eyebrows, paragraphs, list pills) and
 *   `[data-scroll-card]` (bento cards, transformation blocks, case cards, footer
 *   blocks) with staggered scroll-linked depth, scale, and opacity.
 * - Includes an automatic IntersectionObserver + passive rAF scroll fallback
 *   solely for browsers where `CSS.supports('(animation-timeline: view()) and (animation-range: entry)')`
 *   is false, while respecting `prefers-reduced-motion: reduce`.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / Math.max(0.0001, b - a));
  return t * t * (3 - 2 * t);
};

export function splitHeadingForScroll(el: HTMLElement): void {
  if (el.dataset.stSplit === '1') return;
  const rawHTML = el.innerHTML.trim();
  const plainText = (el.textContent || '').replace(/\s+/g, ' ').trim();
  if (!plainText) return;
  el.dataset.stSplit = '1';

  // Preserve explicit <br> line breaks while wrapping each word in a clip mask
  const segments = rawHTML.split(/(<br\s*\/?>)/gi);
  const allTokens: Array<{ type: 'br' } | { type: 'word'; text: string }> = [];

  for (const seg of segments) {
    if (/^<br\s*\/?>$/i.test(seg)) {
      allTokens.push({ type: 'br' });
    } else {
      const temp = document.createElement('span');
      temp.innerHTML = seg;
      const words = (temp.textContent || '').trim().split(/\s+/).filter(Boolean);
      for (const w of words) {
        allTokens.push({ type: 'word', text: w });
      }
    }
  }

  const wordCount = Math.max(1, allTokens.filter((t) => t.type === 'word').length);
  let wIdx = 0;

  const visualHTML = allTokens
    .map((tok) => {
      if (tok.type === 'br') return '<br />';
      const bucket = Math.min(11, Math.floor((wIdx / wordCount) * 12));
      wIdx++;
      const escaped = tok.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<span class="st-word-mask"><span class="st-word st-b${bucket}" data-w-bucket="${bucket}">${escaped}</span></span>`;
    })
    .join(' ');

  const safeSr = plainText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  el.innerHTML = `<span class="visually-hidden">${safeSr}</span><span class="st-words-visual" aria-hidden="true">${visualHTML}</span>`;
}

export function enhanceScrollTypographyAndSections(
  rootEl: ParentNode,
  scrollContainer: HTMLElement | null = null
): () => void {
  const headings = Array.from(rootEl.querySelectorAll<HTMLElement>('[data-scroll-heading]'));
  headings.forEach(splitHeadingForScroll);

  const supportsViewTimeline =
    typeof window !== 'undefined' &&
    Boolean(window.CSS?.supports?.('(animation-timeline: view()) and (animation-range: entry)'));

  const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');

  // When native CSS Scroll-Driven Animations are supported, the browser compositor
  // drives all `[data-scroll-heading]`, `[data-scroll-copy]`, and `[data-scroll-card]`
  // animations directly with zero JS scroll work.
  if (supportsViewTimeline) {
    return () => {};
  }

  // Fallback for browsers without `animation-timeline: view()`
  const trackedEls = Array.from(
    rootEl.querySelectorAll<HTMLElement>('[data-scroll-heading], [data-scroll-copy], [data-scroll-card]')
  );
  if (!trackedEls.length) return () => {};

  trackedEls.forEach((el) => el.classList.add('st-js-fallback'));

  const activeSet = new Set<HTMLElement>();
  let rafId = 0;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          activeSet.add(target);
        } else {
          activeSet.delete(target);
        }
      }
      scheduleFallback();
    },
    {
      root: scrollContainer,
      rootMargin: '80px 0px 80px 0px',
      threshold: 0,
    }
  );

  trackedEls.forEach((el) => io.observe(el));

  const updateFallback = () => {
    rafId = 0;
    if (motionMq.matches) {
      trackedEls.forEach((el) => {
        el.style.opacity = '';
        el.style.transform = '';
        el.querySelectorAll<HTMLElement>('.st-word').forEach((w) => {
          w.style.opacity = '';
          w.style.transform = '';
        });
      });
      return;
    }

    const viewTop = scrollContainer
      ? scrollContainer.getBoundingClientRect().top + scrollContainer.clientTop
      : 0;
    const viewH = scrollContainer ? scrollContainer.clientHeight : window.innerHeight;

    activeSet.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const relTop = rect.top - viewTop;
      // Normalized entry progress: 0 when top hits bottom of viewport, 1 when well inside viewport
      const isBottom = el.hasAttribute('data-scroll-bottom');
      const endY = isBottom ? viewH * 0.88 : viewH * 0.62;
      const p = clamp01((viewH - relTop) / Math.max(1, viewH - endY));

      if (el.hasAttribute('data-scroll-heading')) {
        const words = el.querySelectorAll<HTMLElement>('.st-word');
        words.forEach((w) => {
          const b = Number(w.dataset.wBucket || '0') / 11;
          const wp = smoothstep(b * 0.42, b * 0.42 + 0.58, p);
          w.style.opacity = (0.14 + 0.86 * wp).toFixed(3);
          w.style.transform = `translate3d(0, ${((1 - wp) * 92).toFixed(1)}%, 0)`;
        });
      } else if (el.hasAttribute('data-scroll-card')) {
        const stagger = Number(el.dataset.scrollStagger || '0') * 0.1;
        const cp = smoothstep(stagger, Math.min(1, stagger + 0.78), p);
        const shiftX = Number(el.dataset.scrollX || '0') * (1 - cp);
        const shiftY = (1 - cp) * 38;
        const sc = 0.95 + 0.05 * cp;
        el.style.opacity = (0.12 + 0.88 * cp).toFixed(3);
        el.style.transform = `translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, 0) scale(${sc.toFixed(3)})`;
      } else {
        const stagger = Number(el.dataset.scrollStagger || '0') * 0.08;
        const cp = smoothstep(stagger, Math.min(1, stagger + 0.75), p);
        el.style.opacity = (0.12 + 0.88 * cp).toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - cp) * 24).toFixed(1)}px, 0)`;
      }
    });
  };

  const scheduleFallback = () => {
    if (!rafId) rafId = window.requestAnimationFrame(updateFallback);
  };

  const targetScroller: EventTarget = scrollContainer ?? window;
  targetScroller.addEventListener('scroll', scheduleFallback, { passive: true });
  window.addEventListener('resize', scheduleFallback, { passive: true });
  motionMq.addEventListener('change', scheduleFallback);
  scheduleFallback();

  return () => {
    window.cancelAnimationFrame(rafId);
    io.disconnect();
    targetScroller.removeEventListener('scroll', scheduleFallback);
    window.removeEventListener('resize', scheduleFallback);
    motionMq.removeEventListener('change', scheduleFallback);
  };
}
