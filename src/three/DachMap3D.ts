import { SITE_CONFIG } from '../config/siteConfig';

export interface DachMapController {
  selectCity: (cityId: string) => void;
  destroy: () => void;
}

interface DotPoint {
  x: number;
  y: number;
  isBorder: boolean;
}

// Coarse DACH (Germany + Austria + Switzerland) silhouette polygon in normalized 0..1 coordinates
const DACH_POLY: Array<[number, number]> = [
  [0.37, 0.06],
  [0.50, 0.08],
  [0.62, 0.14],
  [0.66, 0.26],
  [0.64, 0.40],
  [0.57, 0.48],
  [0.64, 0.56],
  [0.78, 0.57],
  [0.92, 0.64],
  [0.89, 0.78],
  [0.72, 0.84],
  [0.56, 0.80],
  [0.45, 0.88],
  [0.24, 0.90],
  [0.17, 0.81],
  [0.25, 0.72],
  [0.22, 0.58],
  [0.15, 0.46],
  [0.19, 0.31],
  [0.28, 0.20],
];

function pointInPoly(px: number, py: number, poly: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-6) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function generateDachDots(): DotPoint[] {
  const dots: DotPoint[] = [];
  const cols = 38;
  const rows = 32;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) / cols;
      const y = (r + 0.5) / rows;
      if (pointInPoly(x, y, DACH_POLY)) {
        const edge =
          !pointInPoly(x + 0.03, y, DACH_POLY) ||
          !pointInPoly(x - 0.03, y, DACH_POLY) ||
          !pointInPoly(x, y + 0.03, DACH_POLY) ||
          !pointInPoly(x, y - 0.03, DACH_POLY);
        dots.push({ x, y, isBorder: edge });
      }
    }
  }
  return dots;
}

export function mountDachMap(
  canvas: HTMLCanvasElement,
  readoutEl: HTMLElement,
  cityButtons: HTMLButtonElement[],
  onAuditClick: () => void
): DachMapController {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { selectCity: () => {}, destroy: () => {} };
  }

  const dots = generateDachDots();
  const cities = SITE_CONFIG.contact.cities;
  let activePin = {
    label: cities[0].name.toUpperCase(),
    lat: cities[0].lat,
    lon: cities[0].lon,
    x: cities[0].x,
    y: cities[0].y,
    avgPos: cities[0].avgPos,
    pinCount: 1,
  };

  let rotX = 0.32;
  let rotY = -0.14;
  let targetRotX = 0.32;
  let targetRotY = -0.14;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragMoved = false;
  let rafId = 0;
  let pulse = 0;
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateReadout = () => {
    const pinCode = String(activePin.pinCount).padStart(2, '0');
    readoutEl.innerHTML = `
      <div class="map-readout-top">NODE ${pinCode} &middot; ${activePin.label}</div>
      <div class="map-readout-coords">${activePin.lat} &nbsp;&nbsp; ${activePin.lon}</div>
      <div class="map-readout-metric">Cloud edge 5&times;5 &middot; avg. latency ${activePin.avgPos}</div>
      <div class="map-readout-sub">DEPLOY INFRASTRUCTURE &middot;</div>
      <button type="button" class="map-readout-link">START YOUR PROJECT BRIEF &rarr;</button>
    `;
    const btn = readoutEl.querySelector('.map-readout-link');
    btn?.addEventListener('click', onAuditClick);
  };

  const setActiveButton = (cityId: string | null) => {
    cityButtons.forEach((b) => {
      const match = b.dataset.city === cityId;
      b.classList.toggle('is-active', match);
      b.setAttribute('aria-pressed', match ? 'true' : 'false');
    });
  };

  const selectCity = (cityId: string) => {
    const found = cities.find((c) => c.id === cityId);
    if (!found) return;
    activePin = {
      label: found.name.toUpperCase(),
      lat: found.lat,
      lon: found.lon,
      x: found.x,
      y: found.y,
      avgPos: found.avgPos,
      pinCount: activePin.pinCount + 1,
    };
    if (activePin.pinCount === 2 && cityId === 'koeln') {
      activePin.pinCount = 1;
    }
    setActiveButton(found.id);
    updateReadout();
  };

  // Initial state
  setActiveButton(cities[0].id);
  updateReadout();

  const project = (nx: number, ny: number, nz: number, w: number, h: number) => {
    const cx = nx - 0.5;
    const cy = ny - 0.5;

    // Rotate around Y then X
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const x1 = cx * cosY + nz * sinY;
    const z1 = -cx * sinY + nz * cosY;

    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const y2 = cy * cosX - z1 * sinX;
    const z2 = cy * sinX + z1 * cosX;

    const fov = 2.4;
    const scale = fov / (fov + z2 + 0.6);
    const size = Math.min(w * 0.92, h * 0.96);
    return {
      sx: w * 0.5 + x1 * size * scale,
      sy: h * 0.52 + y2 * size * scale,
      scale,
    };
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const onPointerDown = (e: PointerEvent) => {
    isDragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.hypot(dx, dy) > 4) dragMoved = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    targetRotY = Math.max(-0.55, Math.min(0.55, targetRotY + dx * 0.005));
    targetRotX = Math.max(-0.2, Math.min(0.68, targetRotX + dy * 0.005));
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!isDragging) return;
    isDragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (!dragMoved) {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / Math.max(1, rect.width);
      const clickY = (e.clientY - rect.top) / Math.max(1, rect.height);

      // Snap to nearest city if close, otherwise drop custom pin
      let nearest = cities[0];
      let bestDist = Infinity;
      for (const c of cities) {
        const p = project(c.x, c.y, 0, rect.width, rect.height);
        const dist = Math.hypot(p.sx / rect.width - clickX, p.sy / rect.height - clickY);
        if (dist < bestDist) {
          bestDist = dist;
          nearest = c;
        }
      }

      if (bestDist < 0.14) {
        selectCity(nearest.id);
      } else {
        const clampedX = Math.max(0.2, Math.min(0.84, clickX));
        const clampedY = Math.max(0.16, Math.min(0.84, clickY));
        const lat = (54.8 - clampedY * 8.2).toFixed(2);
        const lon = (5.2 + clampedX * 12.2).toFixed(2);
        const avg = (1.8 + ((clampedX + clampedY) * 1.4) % 1.8).toFixed(1);
        activePin = {
          label: 'CUSTOM PIN',
          lat: `${lat}° N`,
          lon: `${lon}° E`,
          x: clampedX,
          y: clampedY,
          avgPos: avg,
          pinCount: activePin.pinCount + 1,
        };
        setActiveButton(null);
        updateReadout();
      }
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);

  const draw = () => {
    rafId = window.requestAnimationFrame(draw);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;

    rotX += (targetRotX - rotX) * 0.1;
    rotY += (targetRotY - rotY) * 0.1;
    if (!reducedMotion()) pulse += 0.03;

    ctx.clearRect(0, 0, w, h);

    // Draw DACH dot matrix
    for (const d of dots) {
      const p = project(d.x, d.y, 0, w, h);
      ctx.fillStyle = d.isBorder ? 'rgba(242, 242, 239, 0.24)' : 'rgba(242, 242, 239, 0.11)';
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, d.isBorder ? 1.55 : 1.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw city markers & labels
    ctx.font = '500 10px "JetBrains Mono", ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    for (const c of cities) {
      const p = project(c.x, c.y, 0, w, h);
      const isSelected = activePin.label === c.name.toUpperCase();
      ctx.fillStyle = isSelected ? '#22c1ec' : 'rgba(242, 242, 239, 0.5)';
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, isSelected ? 3.2 : 2.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isSelected ? '#22c1ec' : 'rgba(242, 242, 239, 0.44)';
      ctx.fillText(c.name.toUpperCase(), p.sx + 7, p.sy);
    }

    // Draw 5x5 local SEO map-pack grid around active pin
    const gridSpacing = 0.026;
    const ranks = [
      [3, 2, 1, 2, 4],
      [2, 1, 1, 1, 3],
      [2, 1, 1, 2, 2],
      [3, 2, 1, 2, 3],
      [5, 3, 2, 3, 4],
    ];
    for (let gy = -2; gy <= 2; gy++) {
      for (let gx = -2; gx <= 2; gx++) {
        const px = activePin.x + gx * gridSpacing;
        const py = activePin.y + gy * gridSpacing;
        const rank = ranks[gy + 2][gx + 2];
        const pt = project(px, py, -0.015, w, h);
        const isTop3 = rank <= 3;

        ctx.fillStyle = isTop3 ? '#22c1ec' : 'rgba(34, 193, 236, 0.25)';
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, (isTop3 ? 5.6 : 4.2) * pt.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = `700 ${Math.round(7.5 * pt.scale)}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(String(rank), pt.sx, pt.sy + 0.5);
      }
    }
    ctx.textAlign = 'left';

    // Elevated Zeroth pin marker above the active center
    const basePt = project(activePin.x, activePin.y, -0.02, w, h);
    const hoverZ = -0.1 - (reducedMotion() ? 0 : Math.sin(pulse) * 0.012);
    const topPt = project(activePin.x, activePin.y, hoverZ, w, h);

    ctx.strokeStyle = 'rgba(34, 193, 236, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(basePt.sx, basePt.sy);
    ctx.lineTo(topPt.sx, topPt.sy);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#22c1ec';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(topPt.sx, topPt.sy, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  draw();

  return {
    selectCity,
    destroy() {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
    },
  };
}
