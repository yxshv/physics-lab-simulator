// Tiny SVG helpers. World units are millimetres.
export const NS = 'http://www.w3.org/2000/svg';

export function h(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  if (attrs) {
    for (const k in attrs) {
      const v = attrs[k];
      if (v === undefined || v === null || v === false) continue;
      if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    }
  }
  if (parent) parent.appendChild(el);
  return el;
}

export const g = (parent, attrs) => h('g', attrs, parent);

export function txt(parent, x, y, s, o = {}) {
  return h('text', {
    x, y,
    'font-size': o.size ?? 6,
    fill: o.fill ?? '#222',
    'font-weight': o.weight ?? 600,
    'text-anchor': o.anchor ?? 'middle',
    'dominant-baseline': o.base ?? 'central',
    'font-family': o.family ?? 'Arial, Helvetica, sans-serif',
    'font-style': o.italic ? 'italic' : undefined,
    'letter-spacing': o.ls,
    transform: o.transform,
    opacity: o.opacity,
    'pointer-events': 'none',
    text: s,
  }, parent);
}

export function rect(parent, x, y, w, hh, o = {}) {
  return h('rect', {
    x, y, width: w, height: hh, rx: o.r, ry: o.r,
    fill: o.fill ?? 'none', stroke: o.stroke, 'stroke-width': o.sw,
    filter: o.filter, opacity: o.opacity, transform: o.transform,
    'pointer-events': o.pe,
  }, parent);
}

export function circ(parent, cx, cy, r, o = {}) {
  return h('circle', {
    cx, cy, r, fill: o.fill ?? 'none', stroke: o.stroke, 'stroke-width': o.sw,
    filter: o.filter, opacity: o.opacity, 'stroke-dasharray': o.dash, 'pointer-events': o.pe,
  }, parent);
}

export function line(parent, x1, y1, x2, y2, o = {}) {
  return h('line', {
    x1, y1, x2, y2, stroke: o.stroke ?? '#222', 'stroke-width': o.sw ?? 0.5,
    'stroke-linecap': o.cap ?? 'butt', opacity: o.opacity, 'stroke-dasharray': o.dash, 'pointer-events': 'none',
  }, parent);
}

export function path(parent, d, o = {}) {
  return h('path', {
    d, fill: o.fill ?? 'none', stroke: o.stroke, 'stroke-width': o.sw,
    'stroke-linecap': o.cap, 'stroke-linejoin': o.join, filter: o.filter, opacity: o.opacity,
    transform: o.transform, 'pointer-events': o.pe,
  }, parent);
}

export function poly(parent, pts, o = {}) {
  return h('polygon', {
    points: pts.map(p => p.join(',')).join(' '), fill: o.fill ?? '#000', stroke: o.stroke,
    'stroke-width': o.sw, opacity: o.opacity,
  }, parent);
}

// Tick marks + labels around a knob. angles: 0 = 12 o'clock, clockwise positive (degrees).
export function dial(parent, x, y, r, labels, { sweep = 300, size = 3.2, ticks = true, color = '#333', start } = {}) {
  const n = labels.length;
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? 0.5 : i / (n - 1);
    const a = ((start ?? -sweep / 2) + f * sweep) * Math.PI / 180;
    const sx = Math.sin(a), cy = -Math.cos(a);
    if (ticks) line(parent, x + sx * r * 0.82, y + cy * r * 0.82, x + sx * r * 0.95, y + cy * r * 0.95, { stroke: color, sw: 0.4 });
    if (labels[i] !== '') txt(parent, x + sx * (r + size * 0.9), y + cy * (r + size * 0.9), labels[i], { size, fill: color, weight: 600 });
  }
}

// An arc arrow above a knob ("increase" mark), like SES front panels.
export function arcArrow(parent, x, y, r, { color = '#333', sw = 0.5 } = {}) {
  const a0 = -60 * Math.PI / 180, a1 = 60 * Math.PI / 180;
  const p = (a) => [x + Math.sin(a) * r, y - Math.cos(a) * r];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  path(parent, `M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}`, { stroke: color, sw });
  poly(parent, [[x1 + 1.6, y1 - 0.2], [x1 - 0.6, y1 - 1.6], [x1 - 0.2, y1 + 1.2]], { fill: color });
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// Deterministic RNG
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Gaussian noise
export function gauss(r = Math.random) {
  let u = 0, v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
