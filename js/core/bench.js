// The lab bench: an SVG world (mm units) with pan / zoom, layers, tooltip, context menu and a sim loop.
import { h, g, rect, circ, txt, line, path, clamp } from './svg.js';

export class Bench {
  constructor(host, { W = 1600, H = 900 } = {}) {
    this.host = host; this.W = W; this.H = H;
    this.svg = h('svg', { class: 'bench-svg' }, host);
    this.defs = h('defs', {}, this.svg);
    this._defs();
    this.world = g(this.svg, {});
    this.layers = {
      bg: g(this.world), back: g(this.world), inst: g(this.world), table: g(this.world),
      wires: g(this.world), front: g(this.world), top: g(this.world),
    };
    this.vb = { x: 0, y: 0, w: W, h: H };
    this._applyVB();
    this.updaters = [];
    this.timeScale = 1;
    this.simTime = 0;
    this._bgClick = [];
    this._initPanZoom();
    this._initTip();
    this._drawRoom();
    this._last = performance.now();
    this._timer = setInterval(() => this._loop(performance.now()), 33);
  }

  destroy() {
    clearInterval(this._timer);
    this.svg.remove();
    this.tipEl.style.display = 'none';
    this.closeMenu();
  }

  // ---------- defs: gradients, patterns, filters ----------
  _defs() {
    const d = this.defs;
    const lin = (id, stops, x2 = 0, y2 = 1) => {
      const gr = h('linearGradient', { id, x1: 0, y1: 0, x2, y2 }, d);
      stops.forEach(([o, c]) => h('stop', { offset: o, 'stop-color': c }, gr));
    };
    const rad = (id, stops, fx = 0.35, fy = 0.3) => {
      const gr = h('radialGradient', { id, cx: 0.5, cy: 0.5, r: 0.6, fx, fy }, d);
      stops.forEach(([o, c]) => h('stop', { offset: o, 'stop-color': c }, gr));
    };
    lin('gChrome', [[0, '#f4f6f8'], [0.35, '#b9c0c6'], [0.55, '#eef1f3'], [1, '#8d959c']]);
    lin('gChromeH', [[0, '#f4f6f8'], [0.4, '#aab2b9'], [0.6, '#eef1f3'], [1, '#858d94']], 1, 0);
    rad('gChromeR', [[0, '#ffffff'], [0.5, '#c5ccd2'], [1, '#7f878e']]);
    rad('gCream', [[0, '#fbf8ee'], [0.7, '#e7e1cf'], [1, '#c9c2ad']]);
    rad('gBlackKnob', [[0, '#5a5a5a'], [0.6, '#232323'], [1, '#0c0c0c']]);
    rad('gRedCap', [[0, '#ff7a6e'], [0.6, '#d32f2f'], [1, '#8e1a1a']]);
    rad('gBlueKnob', [[0, '#6f8fe8'], [0.6, '#2a4fb5'], [1, '#162d73']]);
    rad('gGrayKnob', [[0, '#ffffff'], [0.6, '#e2e0da'], [1, '#a9a69e']]);
    lin('gCase', [[0, '#f3f1ec'], [1, '#dad6cd']]);
    lin('gCaseTop', [[0, '#e9e6df'], [1, '#d3cfc5']]);
    lin('gBlackMetal', [[0, '#4a4d52'], [0.5, '#2c2e32'], [1, '#1b1c1f']]);
    lin('gBlackMetalH', [[0, '#1b1c1f'], [0.45, '#4a4d52'], [1, '#1b1c1f']], 1, 0);
    lin('gGlass', [[0, 'rgba(220,240,255,0.55)'], [0.5, 'rgba(190,220,240,0.25)'], [1, 'rgba(220,240,255,0.5)']], 1, 0);
    lin('gTubeGlass', [[0, 'rgba(255,255,255,0.65)'], [0.3, 'rgba(200,225,240,0.18)'], [0.7, 'rgba(200,225,240,0.18)'], [1, 'rgba(255,255,255,0.5)']]);
    lin('gGrayCoil', [[0, '#c8ccd0'], [0.4, '#eef0f2'], [1, '#8f969c']]);
    lin('gBluePanel', [[0, '#3557c9'], [1, '#203a96']]);
    lin('gWall', [[0, '#f4f3ef'], [1, '#e7e5df']]);
    lin('gScreen', [[0, '#24465f'], [1, '#14293a']]);
    // wood pattern
    const pat = h('pattern', { id: 'pWood', width: 400, height: 120, patternUnits: 'userSpaceOnUse' }, d);
    rect(pat, 0, 0, 400, 120, { fill: '#d6a46a' });
    for (let i = 0; i < 26; i++) {
      const y = (i * 4.7 + (i % 3) * 1.3) % 120;
      path(pat, `M0,${y} C100,${y + 3} 200,${y - 3} 400,${y + (i % 2 ? 1 : -1)}`,
        { stroke: i % 4 === 0 ? '#c38f55' : '#dcae78', sw: i % 4 === 0 ? 1.2 : 0.6, opacity: 0.7 });
    }
    // shadow filter
    const f = h('filter', { id: 'fShadow', x: '-20%', y: '-20%', width: '140%', height: '150%' }, d);
    h('feDropShadow', { dx: 0, dy: 5, stdDeviation: 4, 'flood-color': '#000', 'flood-opacity': 0.28 }, f);
    const f2 = h('filter', { id: 'fShadowS', x: '-20%', y: '-20%', width: '140%', height: '150%' }, d);
    h('feDropShadow', { dx: 0, dy: 1.5, stdDeviation: 1.2, 'flood-color': '#000', 'flood-opacity': 0.35 }, f2);
    const f3 = h('filter', { id: 'fGlow', x: '-100%', y: '-100%', width: '300%', height: '300%' }, d);
    h('feGaussianBlur', { stdDeviation: 1.6, result: 'b' }, f3);
    const mg = h('feMerge', {}, f3); h('feMergeNode', { in: 'b' }, mg); h('feMergeNode', { in: 'SourceGraphic' }, mg);
    const f4 = h('filter', { id: 'fBlur2' }, d); h('feGaussianBlur', { stdDeviation: 2 }, f4);
  }

  _drawRoom() {
    const L = this.layers.bg, W = this.W;
    rect(L, -2000, -2000, W + 4000, 2330, { fill: 'url(#gWall)' });
    // partition / trunking with sockets
    rect(L, -2000, 250, W + 4000, 80, { fill: '#e6e4dc', stroke: '#cfccc2', sw: 1 });
    rect(L, -2000, 250, W + 4000, 6, { fill: '#f2f0ea' });
    for (let x = 60; x < W; x += 420) this._socketPlate(L, x, 268);
    // table
    rect(L, -2000, 330, W + 4000, 2000, { fill: 'url(#pWood)' });
    rect(L, -2000, 330, W + 4000, 6, { fill: '#b98549', opacity: 0.6 });
    line(L, -2000, this.H - 2, W + 2000, this.H - 2, { stroke: '#a8763d', sw: 3 });
  }

  _socketPlate(L, x, y) {
    rect(L, x, y, 150, 46, { fill: '#fbfbf8', stroke: '#c9c7c0', sw: 0.8, r: 3, filter: 'url(#fShadowS)' });
    // 5-pin socket
    const s = (cx) => {
      circ(L, cx, y + 23, 13, { fill: '#f6f6f2', stroke: '#d0cec6', sw: 0.6 });
      circ(L, cx, y + 14, 2.4, { fill: '#555' });
      circ(L, cx - 7, y + 27, 1.8, { fill: '#555' }); circ(L, cx + 7, y + 27, 1.8, { fill: '#555' });
      circ(L, cx - 3.5, y + 21, 1.1, { fill: '#555' }); circ(L, cx + 3.5, y + 21, 1.1, { fill: '#555' });
    };
    s(x + 25); s(x + 125);
    rect(L, x + 52, y + 10, 18, 26, { fill: '#f1f1ec', stroke: '#c7c5bd', sw: 0.6, r: 1 });
    rect(L, x + 78, y + 10, 18, 26, { fill: '#f1f1ec', stroke: '#c7c5bd', sw: 0.6, r: 1 });
    rect(L, x + 58, y + 13, 6, 3, { fill: '#c0392b' });
  }

  // ---------- view box / pan / zoom ----------
  _applyVB() {
    const v = this.vb;
    this.svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
  }
  _scale() { // world units per screen px
    const r = this.svg.getBoundingClientRect();
    return Math.max(this.vb.w / r.width, this.vb.h / r.height);
  }
  toWorld(cx, cy) {
    const pt = new DOMPoint(cx, cy).matrixTransform(this.world.getScreenCTM().inverse());
    return { x: pt.x, y: pt.y };
  }
  // world coordinate of a local point inside element el
  worldOf(el, x = 0, y = 0) {
    const m = this.world.getCTM().inverse().multiply(el.getCTM());
    const p = new DOMPoint(x, y).matrixTransform(m);
    return { x: p.x, y: p.y };
  }
  zoomTo(x, y, w, hh, animate = true) {
    const r = this.svg.getBoundingClientRect();
    const asp = r.width / Math.max(1, r.height);
    let W = w, H = hh;
    if (W / H < asp) W = H * asp; else H = W / asp;
    const target = { x: x + w / 2 - W / 2, y: y + hh / 2 - H / 2, w: W, h: H };
    if (!animate) { this.vb = target; this._applyVB(); return; }
    const from = { ...this.vb }, t0 = performance.now(), dur = 450;
    const step = (t) => {
      const k = clamp((t - t0) / dur, 0, 1), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      for (const key of ['x', 'y', 'w', 'h']) this.vb[key] = from[key] + (target[key] - from[key]) * e;
      this._applyVB();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  fit() { this.zoomTo(0, 0, this.W, this.H); }

  _initPanZoom() {
    const svg = this.svg;
    let pan = null;
    svg.addEventListener('pointerdown', (e) => {
      if (e.target.closest('[data-ctrl]')) return;
      this.closeMenu();
      pan = { x: e.clientX, y: e.clientY, vx: this.vb.x, vy: this.vb.y, moved: false, id: e.pointerId };
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', (e) => {
      if (!pan) return;
      const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) pan.moved = true;
      if (pan.moved) {
        const s = this._scale();
        this.vb.x = pan.vx - dx * s; this.vb.y = pan.vy - dy * s;
        this._applyVB();
        svg.style.cursor = 'grabbing';
      }
    });
    const end = (e) => {
      if (!pan) return;
      if (!pan.moved) this._bgClick.forEach(f => f(e));
      pan = null; svg.style.cursor = '';
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX) || true) {
        const k = Math.exp(clamp(e.deltaY, -60, 60) * 0.0025 * (e.ctrlKey ? 3 : 1));
        const p = this.toWorld(e.clientX, e.clientY);
        const nw = clamp(this.vb.w * k, 60, this.W * 1.6);
        const kk = nw / this.vb.w;
        this.vb.x = p.x - (p.x - this.vb.x) * kk;
        this.vb.y = p.y - (p.y - this.vb.y) * kk;
        this.vb.w *= kk; this.vb.h *= kk;
        this._applyVB();
      }
    }, { passive: false });
    new ResizeObserver(() => this._applyVB()).observe(this.host);
  }
  onBgClick(f) { this._bgClick.push(f); }

  // ---------- tooltip & context menu ----------
  _initTip() {
    this.tipEl = document.getElementById('tip');
    this.menuEl = document.getElementById('menu');
  }
  tip(e, text) {
    if (!text) return this.untip();
    const t = this.tipEl;
    t.innerHTML = text;
    t.style.display = 'block';
    const x = Math.min(window.innerWidth - t.offsetWidth - 8, e.clientX + 16);
    const y = Math.min(window.innerHeight - t.offsetHeight - 8, e.clientY + 18);
    t.style.left = x + 'px'; t.style.top = y + 'px';
  }
  untip() { this.tipEl.style.display = 'none'; }
  menu(e, title, items) {
    const m = this.menuEl;
    m.innerHTML = '';
    if (title) { const hd = document.createElement('div'); hd.className = 'menu-title'; hd.textContent = title; m.appendChild(hd); }
    items.filter(Boolean).forEach(it => {
      const b = document.createElement('button');
      b.textContent = it.label;
      if (it.disabled) b.disabled = true;
      b.onclick = () => { this.closeMenu(); it.fn(); };
      m.appendChild(b);
    });
    if (!items.filter(Boolean).length) { const d = document.createElement('div'); d.className = 'menu-empty'; d.textContent = 'Nothing to do here right now'; m.appendChild(d); }
    m.style.display = 'block';
    m.style.left = Math.min(window.innerWidth - m.offsetWidth - 8, e.clientX + 4) + 'px';
    m.style.top = Math.min(window.innerHeight - m.offsetHeight - 8, e.clientY + 4) + 'px';
  }
  closeMenu() { if (this.menuEl) this.menuEl.style.display = 'none'; }

  // make an element interactive (tooltip + click / menu)
  interactive(el, { tip, click, menu, title }) {
    el.setAttribute('data-ctrl', '1');
    el.style.cursor = 'pointer';
    const tipf = typeof tip === 'function' ? tip : () => tip;
    el.addEventListener('pointerenter', e => this.tip(e, tipf()));
    el.addEventListener('pointermove', e => this.tip(e, tipf()));
    el.addEventListener('pointerleave', () => this.untip());
    el.addEventListener('pointerdown', e => e.stopPropagation());
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (click) click(e);
      else if (menu) this.menu(e, typeof title === 'function' ? title() : title, menu());
    });
  }

  // ---------- loop ----------
  addUpdater(fn) { this.updaters.push(fn); }
  _loop(t) {
    const dt = Math.min(0.1, (t - this._last) / 1000);
    this._last = t;
    const sdt = dt * this.timeScale;
    this.simTime += sdt;
    for (const f of this.updaters) {
      try { f(dt, sdt); } catch (err) { console.error(err); }
    }
  }
}
