/**
 * Lightweight GPU-friendly visual animations:
 * 1. Dark-grid traveling cyan data pulses & floating micro-nodes Canvas (Hero)
 * 2. Cursor-reactive radial border spotlight + subtle 3D card tilt on Impact/Metric cards
 */

export function mountGridSignalCanvas(host: HTMLElement): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-signal-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return () => {};
  }

  let w = 1;
  let h = 1;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  const resize = () => {
    const r = host.getBoundingClientRect();
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  let visible = true;
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible && !raf) {
        prev = performance.now();
        raf = window.requestAnimationFrame(draw);
      } else if (!visible) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    { rootMargin: '150px' }
  );
  io.observe(host);

  const GRID = 64;
  interface Pulse {
    horiz: boolean;
    line: number;
    pos: number;
    speed: number;
    len: number;
  }

  const pulses: Pulse[] = Array.from({ length: 9 }, (_, i) => ({
    horiz: i % 2 === 0,
    line: 2 + ((i * 3) % 14),
    pos: Math.random() * 1200,
    speed: 75 + Math.random() * 95,
    len: 70 + Math.random() * 90,
  }));

  const nodes = Array.from({ length: 18 }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.012,
    vy: -0.008 - Math.random() * 0.014,
    r: 1.1 + Math.random() * 1.6,
    phase: Math.random() * Math.PI * 2,
  }));

  let raf = 0;
  let prev = performance.now();

  const draw = (now: number) => {
    raf = window.requestAnimationFrame(draw);
    if (!visible) {
      prev = now;
      return;
    }
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;

    ctx.clearRect(0, 0, w, h);

    // Traveling cyan signal beams along the 64px grid lines
    ctx.lineWidth = 1.4;
    for (const p of pulses) {
      p.pos += p.speed * dt;
      const limit = p.horiz ? w + p.len : h + p.len;
      if (p.pos > limit) {
        p.pos = -p.len;
        const maxLines = Math.max(3, Math.floor((p.horiz ? h : w) / GRID));
        p.line = 1 + Math.floor(Math.random() * (maxLines - 1));
      }

      const coord = p.line * GRID;
      if (p.horiz) {
        const grad = ctx.createLinearGradient(p.pos - p.len, coord, p.pos, coord);
        grad.addColorStop(0, 'rgba(34, 193, 236, 0)');
        grad.addColorStop(0.7, 'rgba(34, 193, 236, 0.28)');
        grad.addColorStop(1, 'rgba(130, 235, 255, 0.72)');
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(p.pos - p.len, coord);
        ctx.lineTo(p.pos, coord);
        ctx.stroke();
      } else {
        const grad = ctx.createLinearGradient(coord, p.pos - p.len, coord, p.pos);
        grad.addColorStop(0, 'rgba(34, 193, 236, 0)');
        grad.addColorStop(0.7, 'rgba(34, 193, 236, 0.24)');
        grad.addColorStop(1, 'rgba(130, 235, 255, 0.65)');
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(coord, p.pos - p.len);
        ctx.lineTo(coord, p.pos);
        ctx.stroke();
      }
    }

    // Subtle drifting luminous data nodes
    const t = now * 0.002;
    for (const n of nodes) {
      n.x = (n.x + n.vx * dt + 1) % 1;
      n.y = (n.y + n.vy * dt + 1) % 1;
      const alpha = 0.18 + 0.28 * (0.5 + 0.5 * Math.sin(t + n.phase));
      ctx.fillStyle = `rgba(34, 193, 236, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(n.x * w, n.y * h, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  raf = window.requestAnimationFrame(draw);

  return () => {
    window.cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    canvas.remove();
  };
}

export function initInteractiveSpotlightCards(selector = '.case-card'): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (reduced || isTouch) return;

  const cards = Array.from(document.querySelectorAll<HTMLElement>(selector));
  cards.forEach((card) => {
    card.classList.add('spotlight-card');
    card.addEventListener(
      'pointermove',
      (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const rx = ((y / r.height - 0.5) * -5).toFixed(2);
        const ry = ((x / r.width - 0.5) * 5).toFixed(2);
        card.style.setProperty('--mx', `${x.toFixed(0)}px`);
        card.style.setProperty('--my', `${y.toFixed(0)}px`);
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
      },
      { passive: true }
    );
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}
