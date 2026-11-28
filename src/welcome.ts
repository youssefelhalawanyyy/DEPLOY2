const welcome = document.querySelector<HTMLElement>('.deploy-welcome');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
const isHomeEntry = (!location.hash || location.hash === '#top') && scrollY < 8;

if (welcome && !reducedMotion.matches && (navigation?.type === 'reload' || isHomeEntry)) {
  window.requestAnimationFrame(() => playWelcome(welcome));
}

function playWelcome(overlay: HTMLElement) {
  const duration = 4000;
  const mark = overlay.querySelector<HTMLElement>('.deploy-welcome__mark')!;
  const face = mark.querySelector<HTMLElement>('.deploy-welcome__face')!;
  const fallback = mark.querySelector<HTMLElement>('.deploy-welcome__fallback')!;
  const letters = Array.from(overlay.querySelectorAll<HTMLElement>('.deploy-welcome__letter'));
  const motion = new AbortController();
  let timeout: number;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    motion.abort();
    window.clearTimeout(timeout);
    overlay.remove();
  };

  const animate = (element: HTMLElement, frames: Keyframe[], timing: KeyframeAnimationOptions) =>
    element.animate(frames, { fill: 'both', ...timing });

  const pose = (x: number, y: number, roll: number, scale = 1) =>
    `translate3d(${x}%, ${y}%, 0) rotateZ(${roll}deg) scale(${scale})`;

  const frames: Keyframe[] = [
    { offset: 0, transform: pose(0, 0, 0) },
    { offset: 0.085, transform: pose(0, 0, 0), easing: 'ease-in' },
    { offset: 0.11, transform: pose(0, 8, -11, 0.9) },
  ];

  const hopStart = 440;
  const hopDuration = 364;
  letters.slice(0, -1).forEach((letter, i) => {
    const start = hopStart + i * hopDuration;
    const landing = start + hopDuration;
    const x = 116 + i * 100;
    frames.push(
      { offset: (start + hopDuration * 0.49) / duration, transform: pose(x - 48, -87, -12), easing: 'ease-in' },
      { offset: landing / duration, transform: pose(x, -30, 10, 0.92), easing: 'ease-out' },
    );
    animate(letter, [
      { transform: 'translate3d(0, 0, 0)', opacity: 1 },
      { offset: 0.18, transform: 'translate3d(0, 15%, 0) rotateZ(5deg)', opacity: 1 },
      { transform: `translate3d(${i % 2 ? 10 : -10}%, 150%, 0) rotateZ(${i % 2 ? 24 : -24}deg)`, opacity: 0 },
    ], { delay: landing - 34, duration: 480, easing: 'cubic-bezier(.42, 0, .85, 1)' });
  });

  animate(letters[letters.length - 1], [
    { opacity: 1, transform: 'translateY(0) scale(1)' },
    { opacity: 0, transform: 'translateY(100%) scale(0.45)' },
  ], { delay: 2700, duration: 410, easing: 'ease-in' });

  frames.push(
    { offset: 0.765, transform: pose(388, -40, -9, 1.12), easing: 'cubic-bezier(.5, 0, .35, 1)' },
    { offset: 0.90, transform: pose(328, -6, 14, 1.65) },
    { offset: 1, transform: pose(328, -6, 24, 2.5) },
  );

  const sprite = new Image();
  sprite.onload = () => {
    if (!finished) mark.classList.add('has-sprite');
  };
  sprite.src = new URL('deploy-welcome-turn.webp', document.baseURI).href;

  overlay.hidden = false;
  animate(mark, frames, { duration });
  animate(face, [
    { backgroundPosition: '0% center' },
    { backgroundPosition: '100% center' },
  ], { delay: 2820, duration: 345, iterations: 2, easing: 'steps(15, end)' });
  animate(fallback, [
    { transform: 'rotateY(0deg)' },
    { transform: 'rotateY(720deg)' },
  ], { delay: 2820, duration: 690, easing: 'ease-in-out' });

  const reveal = animate(overlay, [
    { opacity: 1 },
    { offset: 0.78, opacity: 1, easing: 'cubic-bezier(.25, .65, .35, 1)' },
    { opacity: 0 },
  ], { duration });

  timeout = window.setTimeout(finish, duration);
  void reveal.finished.then(finish, finish);

  const eventOptions = { signal: motion.signal, passive: true };
  // Browser scroll restoration on refresh should leave the intro running.
  window.addEventListener('wheel', finish, eventOptions);
  window.addEventListener('hashchange', finish, eventOptions);
  window.addEventListener('pagehide', finish, eventOptions);
  window.addEventListener('pointerdown', finish, eventOptions);
  window.addEventListener('keydown', event => {
    if (['Escape', 'Tab', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) finish();
  }, eventOptions);
  reducedMotion.addEventListener('change', finish, eventOptions);
}
