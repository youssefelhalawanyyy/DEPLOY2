const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const phase = (progress: number, start: number, end: number) => {
  const t = clamp01((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
};

export function initImpactScroll(section: HTMLElement) {
  const runway = section.querySelector<HTMLElement>('.h33-hero-runway')!;
  const stage = runway.querySelector<HTMLElement>('.h33-hero-grid')!;
  const metrics = section.querySelector<HTMLElement>('.h33-metrics-ledger')!;
  const steps = Array.from(section.querySelectorAll<HTMLElement>('[data-impact-reveal]'));
  const knot = section.querySelector<HTMLElement>('.h33-knot-motion')!;
  const pinnedKnot = window.matchMedia('(max-width: 768px) and (min-height: 680px) and (orientation: portrait)');
  const pinned = window.matchMedia('(min-width: 1000px) and (min-height: 740px)');
  const revealTargets = steps.map(() => 1);
  const reveals = steps.map(() => 1);
  let turnTarget = 0;
  let turn = 0;
  let drawnTurn = '';
  let initialized = false;

  return {
    measure(viewport: number, reduced: boolean) {
      const top = runway.getBoundingClientRect().top;
      const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      const end = stickyTop - (runway.offsetHeight - stage.offsetHeight);
      const desktopProgress = clamp01((viewport * 0.79 - top) / Math.max(1, viewport * 0.79 - end));
      // Measure normal-flow wrappers so the animation never feeds back into itself.
      const enter = (el: HTMLElement, start = 0.94, end = 0.58) =>
        clamp01((viewport * start - el.getBoundingClientRect().top) / (viewport * (start - end)));
      const metricsProgress = enter(metrics, 0.96, 0.51);
      let metricIndex = 0;
      steps.forEach((element, index) => {
        const isMetric = element.dataset.impactReveal === 'metric';
        const start = isMetric ? metricIndex++ * 0.19 : index * 0.075;
        const progress = isMetric ? metricsProgress : desktopProgress;
        revealTargets[index] = reduced ? 1 : isMetric || pinned.matches
          ? phase(progress, start, start + 0.55)
          : phase(enter(element.parentElement!), 0, 1);
        if (!initialized) reveals[index] = revealTargets[index];
      });
      const knotRect = knot.getBoundingClientRect();
      const travel = Math.max(1, knot.offsetHeight - (knot.firstElementChild as HTMLElement).offsetHeight);
      const knotProgress = pinnedKnot.matches
        ? clamp01((viewport * 0.86 - knotRect.top) / (viewport * 0.65 + travel))
        : enter(knot, 0.99, 0.21);
      turnTarget = reduced ? 0.5 : pinned.matches ? desktopProgress : knotProgress;
      if (!initialized) turn = turnTarget;
      initialized = true;
    },
    update(damping: number) {
      let moving = false;
      steps.forEach((element, index) => {
        reveals[index] += (revealTargets[index] - reveals[index]) * damping;
        const unsettled = Math.abs(revealTargets[index] - reveals[index]) >= 0.0005;
        if (!unsettled) reveals[index] = revealTargets[index];
        moving ||= unsettled;
        const value = reveals[index].toFixed(3);
        if (element.style.getPropertyValue('--impact-reveal') !== value) {
          element.style.setProperty('--impact-reveal', value);
        }
      });
      turn += (turnTarget - turn) * damping;
      moving ||= Math.abs(turnTarget - turn) >= 0.0005;
      if (!moving) turn = turnTarget;
      const value = turn.toFixed(3);
      if (value !== drawnTurn) {
        stage.style.setProperty('--impact-turn', value);
        drawnTurn = value;
      }
      return { turn, moving };
    },
  };
}
