export const PHONE_LAYOUT = '(max-width: 768px), (hover: none) and (pointer: coarse) and (max-width: 950px) and (max-height: 520px)';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function initMobileScroll(process: HTMLElement, clients: HTMLElement, contact: HTMLElement) {
  const phone = window.matchMedia(PHONE_LAYOUT);
  const processList = process.querySelector<HTMLElement>('.process-mobile-cards')!;
  const steps = Array.from(processList.querySelectorAll<HTMLElement>('.process-mobile-card'));
  const lastStep = steps[steps.length - 1];
  const marquee = clients.querySelector<HTMLElement>('.marquee-shell')!;
  const mascot = contact.querySelector<HTMLElement>('.contact-logo-panel')!;
  const pending = new Map<HTMLElement, number>();
  const rendered = new Map<HTMLElement, number>();
  const progress = (rect: DOMRect, viewport: number) =>
    clamp01((viewport * 0.92 - rect.top) / (viewport * 0.62 + rect.height * 0.38));

  return {
    phone,
    measure(viewport: number, reduced: boolean) {
      if (!phone.matches || reduced) return;
      const rail = processList.getBoundingClientRect();
      const focus = viewport * 0.58;
      const distance = lastStep.offsetTop + 12;
      processList.style.setProperty('--process-rail-height', `${distance}px`);
      pending.set(processList, clamp01((focus - rail.top - 18) / Math.max(1, distance)));
      steps.forEach(step => {
        const rect = step.getBoundingClientRect();
        pending.set(step, clamp01(1 - Math.abs(rect.top + Math.min(rect.height / 2, 80) - focus) / (viewport * 0.38)));
      });
      pending.set(marquee, progress(marquee.getBoundingClientRect(), viewport));
      pending.set(mascot, progress(mascot.getBoundingClientRect(), viewport));
    },
    update(damping: number) {
      if (!phone.matches) return false;
      let moving = false;
      for (const [element, target] of pending) {
        const current = rendered.get(element) ?? target;
        if (Math.abs(target - current) < 0.0005 && rendered.has(element)) continue;
        const next = current + (target - current) * damping;
        moving ||= Math.abs(target - next) >= 0.0005;
        rendered.set(element, next);
        element.style.setProperty('--phone-scroll', next.toFixed(4));
      }
      return moving;
    },
  };
}
