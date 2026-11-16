// Shared instruments: cabinet drawing helpers, oscilloscope SM203G, digital multimeters, function generator, AC circuit solver.
import { h, g, txt, rect, circ, line, path, poly, dial, clamp, gauss } from './svg.js';
import { Knob, Toggle, Button, Rocker, LED, Display7, Socket, meterText } from './controls.js';

// ------------------------------------------------------------------ drawing helpers
// Draw an instrument cabinet seen from the front, with a little of the top visible. Returns the front-face group (origin top-left).
export function cabinet(parent, x, y, w, hh, o = {}) {
  const G = g(parent, { transform: `translate(${x},${y})` });
  const d = o.depth ?? 14;
  const shadow = rect(G, -2, hh - 4, w + 8, 10, { fill: '#000', opacity: 0.18, r: 5 });
  shadow.setAttribute('filter', 'url(#fBlur2)');
  if (d > 0) poly(G, [[0, 0], [d * 0.5, -d], [w - d * 0.5, -d], [w, 0]], { fill: o.top ?? 'url(#gCaseTop)', stroke: o.stroke ?? '#b9b4a9', sw: 0.6 });
  rect(G, 0, 0, w, hh, { fill: o.fill ?? 'url(#gCase)', stroke: o.stroke ?? '#b3aea3', sw: 0.8, r: o.r ?? 3 });
  if (o.bezel !== false) rect(G, 3, 3, w - 6, hh - 6, { fill: o.face ?? '#f4f2ed', stroke: o.faceStroke ?? '#cfcabf', sw: 0.5, r: 2 });
  if (o.feet !== false) { rect(G, 10, hh, 14, 3, { fill: '#555', r: 1 }); rect(G, w - 24, hh, 14, 3, { fill: '#555', r: 1 }); }
  return G;
}
export function vents(G, x, y, cols, rows, sp = 4, r = 0.9, color = '#8d8a83') {
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) circ(G, x + i * sp, y + j * sp, r, { fill: color });
}
export function sesLogo(G, x, y, s = 1) {
  const L = g(G, { transform: `translate(${x},${y}) scale(${s})` });
  poly(L, [[0, -4], [4, 0], [0, 4], [-4, 0]], { fill: 'none', stroke: '#c0392b', sw: 0.6 });
  for (let i = -2; i <= 2; i++) line(L, -2.4 + Math.abs(i) * 0.6, i * 0.9, 2.4 - Math.abs(i) * 0.6, i * 0.9, { stroke: '#c0392b', sw: 0.35 });
  return L;
}
export function sesName(G, x, y, s = 1) {
  txt(G, x, y, 'SES', { size: 6 * s, fill: '#b71c1c', weight: 800, anchor: 'start', family: 'Georgia, serif' });
  txt(G, x + 13 * s, y + 0.6 * s, 'INSTRUMENTS', { size: 3.4 * s, fill: '#b71c1c', weight: 700, anchor: 'start' });
  txt(G, x + 36 * s, y + 0.9 * s, 'PVT. LTD.', { size: 1.8 * s, fill: '#b71c1c', weight: 700, anchor: 'start' });
}

// ------------------------------------------------------------------ complex numbers + AC nodal solver
export const C = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
  div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
  abs: (a) => Math.hypot(a[0], a[1]), inv: (a) => C.div([1, 0], a),
};
// nets: array of net ids; ground: net id; elems: {a, b, z:[re,im]} or {a, b, src:[re,im], z:[re,im]} (Thevenin source: voltage src from b to a, i.e. V(a)-V(b)=src when open)
// returns { v: Map(net -> [re,im]), cur(elem) -> complex current a->b through element }
export function solveAC(nets, ground, elems) {
  const idx = new Map();
  nets.forEach(n => { if (n !== ground && !idx.has(n)) idx.set(n, idx.size); });
  const N = idx.size;
  const Y = Array.from({ length: N }, () => Array.from({ length: N }, () => [0, 0]));
  const I = Array.from({ length: N }, () => [0, 0]);
  const addY = (a, b, y) => {
    const ia = a === ground ? -1 : idx.get(a), ib = b === ground ? -1 : idx.get(b);
    if (ia >= 0) Y[ia][ia] = C.add(Y[ia][ia], y);
    if (ib >= 0) Y[ib][ib] = C.add(Y[ib][ib], y);
    if (ia >= 0 && ib >= 0) { Y[ia][ib] = C.sub(Y[ia][ib], y); Y[ib][ia] = C.sub(Y[ib][ia], y); }
  };
  for (let i = 0; i < N; i++) Y[i][i] = C.add(Y[i][i], [1e-12, 0]);
  for (const e of elems) {
    if (e.a === e.b) continue;
    const y = C.inv(e.z);
    addY(e.a, e.b, y);
    if (e.src) { // Norton current src/z injected into a, out of b
      const In = C.div(e.src, e.z);
      const ia = e.a === ground ? -1 : idx.get(e.a), ib = e.b === ground ? -1 : idx.get(e.b);
      if (ia >= 0) I[ia] = C.add(I[ia], In);
      if (ib >= 0) I[ib] = C.sub(I[ib], In);
    }
    if (e.isrc) { // ideal current source pushing isrc from b to a through external circuit (into node a)
      const ia = e.a === ground ? -1 : idx.get(e.a), ib = e.b === ground ? -1 : idx.get(e.b);
      if (ia >= 0) I[ia] = C.add(I[ia], e.isrc);
      if (ib >= 0) I[ib] = C.sub(I[ib], e.isrc);
    }
  }
  // Gaussian elimination
  for (let c = 0; c < N; c++) {
    let p = c, best = C.abs(Y[c][c]);
    for (let r = c + 1; r < N; r++) { const a = C.abs(Y[r][c]); if (a > best) { best = a; p = r; } }
    if (p !== c) { [Y[p], Y[c]] = [Y[c], Y[p]]; [I[p], I[c]] = [I[c], I[p]]; }
    const piv = Y[c][c];
    for (let r = c + 1; r < N; r++) {
      const f = C.div(Y[r][c], piv);
      if (f[0] === 0 && f[1] === 0) continue;
      for (let k = c; k < N; k++) Y[r][k] = C.sub(Y[r][k], C.mul(f, Y[c][k]));
      I[r] = C.sub(I[r], C.mul(f, I[c]));
    }
  }
  const V = Array(N);
  for (let r = N - 1; r >= 0; r--) {
    let s = I[r];
    for (let k = r + 1; k < N; k++) s = C.sub(s, C.mul(Y[r][k], V[k]));
    V[r] = C.div(s, Y[r][r]);
  }
  const v = (n) => n === ground ? [0, 0] : (idx.has(n) ? V[idx.get(n)] : [0, 0]);
  const cur = (e) => {
    const dv = C.sub(v(e.a), v(e.b));
    let i = C.div(e.src ? C.sub(dv, e.src) : dv, e.z);
    return i; // current a -> b through element
  };
  return { v, cur };
}

// ------------------------------------------------------------------ Oscilloscope (Scientific SM203G, 30 MHz)
const VDIV = [20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005];
const VDIV_L = ['20 V', '10 V', '5 V', '2 V', '1 V', '.5 V', '.2 V', '.1 V', '50 mV', '20 mV', '10 mV', '5 mV'];
const TDIV = [0.2, 0.1, 0.05, 0.02, 0.01, 5e-3, 2e-3, 1e-3, 5e-4, 2e-4, 1e-4, 5e-5, 2e-5, 1e-5, 5e-6, 2e-6, 1e-6];
const TDIV_L = ['.2 s', '.1 s', '50 ms', '20 ms', '10 ms', '5 ms', '2 ms', '1 ms', '.5 ms', '.2 ms', '.1 ms', '50 µs', '20 µs', '10 µs', '5 µs', '2 µs', '1 µs'];

export class CRO {
  constructor(ctx, parent, x, y, o = {}) {
    const { bench } = ctx;
    this.ctx = ctx; this.id = o.id ?? 'cro';
    this.on = false; this.warm = 0;
    this.input = () => ({ ch1: null, ch2: null }); // set by experiment: t -> volts at the BNC centre pins
    this.period = 0.02;
    const W = 300, H = 150;
    this.W = W; this.H = H;
    const F = cabinet(parent, x, y, W, H, { depth: 16, face: '#ecebe6' });
    this.G = F;
    // handle feet (front stand)
    rect(F, 18, H, 18, 22, { fill: '#e8e6e0', stroke: '#b5b1a8', sw: 0.6 });
    rect(F, W - 36, H, 18, 22, { fill: '#e8e6e0', stroke: '#b5b1a8', sw: 0.6 });
    // screen bezel
    rect(F, 7, 7, 136, 112, { fill: '#d9d7d1', stroke: '#aaa69c', sw: 0.6, r: 6 });
    rect(F, 14, 12, 122, 98, { fill: '#2b2f33', r: 5 });
    this.sx = 20; this.sy = 16; this.sw = 110; this.sh = 88; // 10 x 8 div, 11 mm/div
    rect(F, this.sx, this.sy, this.sw, this.sh, { fill: 'url(#gScreen)', r: 2 });
    this.scr = g(F);
    this._graticule(this.scr);
    this.trace = path(F, '', { stroke: '#9effc6', sw: 0.7, cap: 'round', join: 'round', opacity: 0 });
    this.trace2 = path(F, '', { stroke: '#9effc6', sw: 0.7, cap: 'round', join: 'round', opacity: 0 });
    this.trace.setAttribute('filter', 'url(#fGlow)'); this.trace2.setAttribute('filter', 'url(#fGlow)');
    rect(F, this.sx, this.sy, this.sw, this.sh, { fill: 'url(#gGlass)', opacity: 0.35, r: 2, pe: 'none' });
    // ---- branding
    txt(F, 168, 52, 'scientific', { size: 7, fill: '#1d5fc2', weight: 800, anchor: 'start', italic: false });
    txt(F, 168, 63, '30MHz', { size: 4.4, fill: '#222', anchor: 'start' });
    txt(F, 168, 69, 'Oscilloscope', { size: 4.4, fill: '#222', anchor: 'start' });
    txt(F, 168, 75, 'SM203G', { size: 4.4, fill: '#222', anchor: 'start' });
    rect(F, 150, 8, 143, 72, { stroke: '#bdb9ae', sw: 0.5, r: 3 });
    rect(F, 150, 83, 143, 62, { stroke: '#bdb9ae', sw: 0.5, r: 3 });
    // ---- top-right controls
    txt(F, 160, 13, 'POWER', { size: 2.6 }); txt(F, 160, 16.4, 'on/off', { size: 2.2 });
    this.power = new Button(bench, F, { x: 160, y: 23, w: 9, h: 6, color: '#d63a2f', latch: true, name: 'POWER on/off', onPress: v => this._power(v) });
    this.pled = new LED(F, { x: 170, y: 23, r: 1.2, color: '#ff3b26' });
    txt(F, 186, 13, 'X-Y', { size: 2.6 });
    this.xy = new Button(bench, F, { x: 186, y: 22, w: 6, h: 6, latch: true, name: 'X-Y mode', onPress: () => this.dirty = true });
    txt(F, 200, 13, 'TR', { size: 2.4 }); circ(F, 200, 21, 1.6, { fill: '#333' });
    txt(F, 186, 31, 'X-POS', { size: 2.6 });
    this.xpos = new Knob(bench, F, { x: 186, y: 40, r: 5.5, style: 'gray', min: -1, max: 1, value: 0, name: 'X-POS', wheel: 0.01, onChange: () => this.dirty = true });
    txt(F, 186, 52, 'HOLD OFF', { size: 2.2 });
    new Knob(bench, F, { x: 186, y: 61, r: 4.5, style: 'gray', name: 'HOLD OFF (not used here)' });
    txt(F, 245, 12, 'TIME/DIV', { size: 3 });
    this.tdiv = new Knob(bench, F, { x: 245, y: 36, r: 11, style: 'scope', steps: TDIV, labels: TDIV_L, index: 5, sweep: 320, name: 'TIME/DIV', onChange: () => this.dirty = true });
    dial(F, 245, 36, 15, TDIV_L.map((l, i) => i % 2 ? '' : l.replace(' ', '')), { sweep: 320, size: 2.1 });
    txt(F, 281, 12, 'AT/NORM', { size: 2.4 });
    new Button(bench, F, { x: 281, y: 19, w: 6, h: 5, latch: true, name: 'AT/NORM (auto trigger)' });
    txt(F, 281, 27, 'LEVEL', { size: 2.4 });
    new Knob(bench, F, { x: 281, y: 35, r: 4.5, style: 'gray', name: 'Trigger LEVEL' });
    txt(F, 281, 46, 'TRIG INP', { size: 2.2 });
    new Socket(bench, F, { x: 281, y: 57, kind: 'bnc', id: this.id + '.trig', name: 'TRIG INP (not used)', scale: 0.8 });
    // ---- lower-right: vertical channels
    txt(F, 160, 88, 'Y-POS I', { size: 2.6 });
    this.ypos1 = new Knob(bench, F, { x: 160, y: 96, r: 4.5, style: 'gray', min: -1, max: 1, value: 0, name: 'Y-POS I', wheel: 0.01, onChange: () => this.dirty = true });
    txt(F, 281, 88, 'Y-POS II', { size: 2.6 });
    this.ypos2 = new Knob(bench, F, { x: 281, y: 96, r: 4.5, style: 'gray', min: -1, max: 1, value: 0, name: 'Y-POS II', wheel: 0.01, onChange: () => this.dirty = true });
    this.vdiv1 = new Knob(bench, F, { x: 193, y: 106, r: 9.5, style: 'scope', steps: VDIV, labels: VDIV_L, index: 4, sweep: 300, name: 'CH I VOLTS/DIV', onChange: () => this.dirty = true });
    dial(F, 193, 106, 13, VDIV_L.map((l, i) => i % 2 ? '' : l.replace(' ', '')), { sweep: 300, size: 2 });
    this.vdiv2 = new Knob(bench, F, { x: 250, y: 106, r: 9.5, style: 'scope', steps: VDIV, labels: VDIV_L, index: 4, sweep: 300, name: 'CH II VOLTS/DIV', onChange: () => this.dirty = true });
    dial(F, 250, 106, 13, VDIV_L.map((l, i) => i % 2 ? '' : l.replace(' ', '')), { sweep: 300, size: 2 });
    txt(F, 221, 92, 'VAR GAIN', { size: 2.2 }); txt(F, 221, 96, 'CAL', { size: 2.2 });
    txt(F, 221, 101, 'CH I', { size: 2 }); circ(F, 221, 104, 1, { fill: '#333' });
    txt(F, 221, 108, 'CH II', { size: 2 }); circ(F, 221, 111, 1, { fill: '#333' });
    txt(F, 221, 116, 'VOLTS/DIV', { size: 2 });
    txt(F, 160, 103, 'INVERT', { size: 2.2 });
    this.inv1 = new Button(bench, F, { x: 160, y: 109, w: 5, h: 5, latch: true, name: 'CH I INVERT', onPress: () => this.dirty = true });
    txt(F, 281, 103, 'INVERT', { size: 2.2 });
    this.inv2 = new Button(bench, F, { x: 281, y: 109, w: 5, h: 5, latch: true, name: 'CH II INVERT', onPress: () => this.dirty = true });
    txt(F, 157, 118, 'AC  DC', { size: 2 });
    this.dc1 = new Button(bench, F, { x: 157, y: 124, w: 5, h: 5, color: '#2c4c9a', latch: true, value: true, name: 'CH I AC/DC', onText: 'DC', offText: 'AC', onPress: () => this.dirty = true });
    txt(F, 166, 118, 'GD', { size: 2 });
    this.gd1 = new Button(bench, F, { x: 166, y: 124, w: 5, h: 5, color: '#2c4c9a', latch: true, name: 'CH I GD (ground)', onPress: () => this.dirty = true });
    txt(F, 285, 118, 'AC  DC', { size: 2 });
    this.dc2 = new Button(bench, F, { x: 285, y: 124, w: 5, h: 5, color: '#2c4c9a', latch: true, value: true, name: 'CH II AC/DC', onText: 'DC', offText: 'AC', onPress: () => this.dirty = true });
    txt(F, 276, 118, 'GD', { size: 2 });
    this.gd2 = new Button(bench, F, { x: 276, y: 124, w: 5, h: 5, color: '#2c4c9a', latch: true, name: 'CH II GD (ground)', onPress: () => this.dirty = true });
    txt(F, 176, 127, 'CH I (Y)', { size: 2.4 });
    this.ch1 = new Socket(bench, F, { x: 176, y: 136, kind: 'bnc', id: this.id + '.ch1', name: 'CRO CH I (Y) input' });
    this.gnd = new Socket(bench, F, { x: 189, y: 136, kind: 'banana', color: 'black', id: this.id + '.gnd', name: 'CRO ground jack ⏚', scale: 0.7 });
    txt(F, 198, 127, 'CH I/II', { size: 2 }); new Button(bench, F, { x: 202, y: 136, w: 5, h: 5, latch: true, name: 'CH I/II trigger select' });
    txt(F, 215, 127, 'DUAL', { size: 2 }); this.dual = new Button(bench, F, { x: 215, y: 136, w: 5, h: 5, latch: true, name: 'DUAL', onPress: () => this.dirty = true });
    txt(F, 228, 127, 'ADD', { size: 2 }); new Button(bench, F, { x: 228, y: 136, w: 5, h: 5, latch: true, name: 'ADD (not used here)' });
    txt(F, 262, 127, 'CH II (X)', { size: 2.4 });
    this.ch2 = new Socket(bench, F, { x: 262, y: 136, kind: 'bnc', id: this.id + '.ch2', name: 'CRO CH II (X) input' });
    // ---- below screen
    txt(F, 28, 124, 'INTENS', { size: 2.6 });
    this.intens = new Knob(bench, F, { x: 28, y: 134, r: 5, style: 'gray', value: 0.6, name: 'INTENS (brightness)', onChange: () => this.dirty = true });
    txt(F, 50, 124, 'FOCUS', { size: 2.6 });
    this.focus = new Knob(bench, F, { x: 50, y: 134, r: 5, style: 'gray', value: 0.3, name: 'FOCUS', onChange: () => this.dirty = true });
    txt(F, 72, 124, 'X-MAG x10', { size: 2.2 }); new Button(bench, F, { x: 72, y: 134, w: 5, h: 5, latch: true, name: 'X-MAG ×10 (keep released)' });
    txt(F, 92, 124, 'CAL', { size: 2.2 }); circ(F, 92, 130, 1.4, { fill: '#111' }); circ(F, 92, 138, 1.4, { fill: '#111' });
    txt(F, 118, 124, 'TESTER', { size: 2.2 }); new Button(bench, F, { x: 112, y: 134, w: 5, h: 5, latch: true, name: 'Component tester (keep off)' }); circ(F, 124, 134, 2.4, { fill: '#222' });
    // zoom-in
    const zoomBtn = g(F); rect(zoomBtn, 108, 112, 26, 6, { fill: '#2a3038', r: 1.5 }); txt(zoomBtn, 121, 115, 'look closely', { size: 2.4, fill: '#fff' });
    bench.interactive(zoomBtn, { tip: 'Look closely at the screen (opens a magnified view with a tracing grid)', click: () => this.openZoom() });
    this.dirty = true;
    this.pts = []; this.pts2 = [];
    bench.addUpdater((dt, sdt) => this._tick(dt, sdt));
  }
  _graticule(G) {
    const { sx, sy, sw, sh } = this;
    const c = 'rgba(150,200,220,0.55)';
    for (let i = 0; i <= 10; i++) line(G, sx + i * 11, sy, sx + i * 11, sy + sh, { stroke: c, sw: 0.3 });
    for (let j = 0; j <= 8; j++) line(G, sx, sy + j * 11, sx + sw, sy + j * 11, { stroke: c, sw: 0.3 });
    for (let i = 0; i <= 50; i++) line(G, sx + i * 2.2, sy + sh / 2 - 0.9, sx + i * 2.2, sy + sh / 2 + 0.9, { stroke: c, sw: 0.25 });
    for (let j = 0; j <= 40; j++) line(G, sx + sw / 2 - 0.9, sy + j * 2.2, sx + sw / 2 + 0.9, sy + j * 2.2, { stroke: c, sw: 0.25 });
  }
  _power(v) {
    this.on = v; this.pled.set(v);
    if (!v) this.warm = 0;
    this.dirty = true;
  }
  connected(sockId) { return this.ctx.wires.countAt(this[sockId]) > 0; }
  // compute trace points in division units: x in [-5,5], y in [-4,4]
  compute() {
    const xy = this.xy.value;
    const N = xy ? 400 : 500;
    const v1 = this.vdiv1.value, v2 = this.vdiv2.value;
    const T = this.period || 0.02;
    const pts = [], pts2 = [];
    const samples = [];
    const span = xy ? T : this.tdiv.value * 10;
    const t0 = xy ? 0 : 0;
    for (let i = 0; i < N; i++) {
      const t = t0 + (i / (N - 1)) * span;
      samples.push(this.input(t));
    }
    const chan = (k) => {
      const raw = samples.map(s => s[k] ?? null);
      const isNull = raw.every(v => v === null);
      let vals = raw.map(v => (v ?? 0) + (isNull ? gauss() * 0.0004 : 0));
      const gd = k === 'ch1' ? this.gd1.value : this.gd2.value;
      const dc = k === 'ch1' ? this.dc1.value : this.dc2.value;
      if (gd) vals = vals.map(() => 0);
      else if (!dc) { const m = vals.reduce((a, b) => a + b, 0) / vals.length; vals = vals.map(v => v - m); }
      const inv = k === 'ch1' ? this.inv1.value : this.inv2.value;
      if (inv) vals = vals.map(v => -v);
      return vals;
    };
    const y1 = chan('ch1'), y2 = chan('ch2');
    const xo = this.xpos.value * 5, yo1 = this.ypos1.value * 4, yo2 = this.ypos2.value * 4;
    for (let i = 0; i < N; i++) {
      if (xy) pts.push([y2[i] / v2 + xo, y1[i] / v1 + yo1]);
      else {
        const x = -5 + (i / (N - 1)) * 10 + xo;
        pts.push([x, y1[i] / v1 + yo1]);
        if (this.dual.value) pts2.push([x, y2[i] / v2 + yo2]);
      }
    }
    this.pts = pts; this.pts2 = pts2;
  }
  _toD(pts) {
    const { sx, sy, sw, sh } = this;
    let d = '';
    pts.forEach((p, i) => {
      const X = sx + sw / 2 + clamp(p[0], -5.6, 5.6) * 11, Y = sy + sh / 2 - clamp(p[1], -4.6, 4.6) * 11;
      d += (i ? 'L' : 'M') + X.toFixed(2) + ',' + Y.toFixed(2);
    });
    return d;
  }
  _tick(dt, sdt) {
    if (this.on && this.warm < 1) { this.warm = Math.min(1, this.warm + sdt / 4); this.dirty = true; }
    this._acc = (this._acc || 0) + dt;
    if (!this.dirty && this._acc < 0.12) return;
    this._acc = 0; this.dirty = false;
    if (!this.on || this.warm < 0.6) { this.trace.setAttribute('opacity', 0); this.trace2.setAttribute('opacity', 0); return; }
    this.compute();
    const op = clamp(this.intens.value * 1.4, 0, 1) * clamp((this.warm - 0.6) / 0.4, 0, 1);
    const fw = 0.45 + Math.abs(this.focus.value - 0.55) * 4;
    this.trace.setAttribute('d', this._toD(this.pts));
    this.trace.setAttribute('opacity', op); this.trace.setAttribute('stroke-width', fw);
    if (this.pts2.length) { this.trace2.setAttribute('d', this._toD(this.pts2)); this.trace2.setAttribute('opacity', op); this.trace2.setAttribute('stroke-width', fw); }
    else this.trace2.setAttribute('opacity', 0);
  }
  openZoom() {
    let paper = false;
    const W = 560, H = 448;
    const footer = (win) => {
      const d = document.createElement('div'); d.className = 'ctrls';
      const b = document.createElement('button'); b.className = 'btn sm'; b.textContent = 'Lay tracing (butter) paper with mm grid';
      b.onclick = () => { paper = !paper; b.textContent = paper ? 'Remove tracing paper' : 'Lay tracing (butter) paper with mm grid'; };
      const s = document.createElement('span'); s.className = 'muted'; s.textContent = '1 division = 1 cm on the screen graticule.';
      d.append(b, s); return d;
    };
    this.ctx.ui.canvasWindow(this.id + '-zoom', 'Oscilloscope screen (close-up)', {
      w: W, h: H, footer,
      draw: (c) => {
        const k = W / 10;
        c.fillStyle = '#15293a'; c.fillRect(0, 0, W, H);
        if (paper) { c.fillStyle = 'rgba(250,248,240,0.82)'; c.fillRect(0, 0, W, H); }
        c.strokeStyle = paper ? 'rgba(210,120,90,0.35)' : 'rgba(150,200,220,0.25)'; c.lineWidth = 0.5;
        if (paper) for (let i = 0; i <= 100; i++) { c.beginPath(); c.moveTo(i * k / 10, 0); c.lineTo(i * k / 10, H); c.stroke(); }
        if (paper) for (let j = 0; j <= 80; j++) { c.beginPath(); c.moveTo(0, j * k / 10); c.lineTo(W, j * k / 10); c.stroke(); }
        c.strokeStyle = paper ? 'rgba(200,90,60,0.7)' : 'rgba(150,200,220,0.6)'; c.lineWidth = 1;
        for (let i = 0; i <= 10; i++) { c.beginPath(); c.moveTo(i * k, 0); c.lineTo(i * k, H); c.stroke(); }
        for (let j = 0; j <= 8; j++) { c.beginPath(); c.moveTo(0, j * k); c.lineTo(W, j * k); c.stroke(); }
        for (let i = 0; i <= 50; i++) { c.beginPath(); c.moveTo(i * k / 5, H / 2 - 4); c.lineTo(i * k / 5, H / 2 + 4); c.stroke(); }
        for (let j = 0; j <= 40; j++) { c.beginPath(); c.moveTo(W / 2 - 4, j * k / 5); c.lineTo(W / 2 + 4, j * k / 5); c.stroke(); }
        if (!this.on || this.warm < 0.6) return;
        const op = clamp(this.intens.value * 1.4, 0, 1);
        const fw = 1 + Math.abs(this.focus.value - 0.55) * 9;
        const drawPts = (pts) => {
          if (!pts.length) return;
          c.beginPath();
          pts.forEach((p, i) => { const X = W / 2 + p[0] * k, Y = H / 2 - p[1] * k; i ? c.lineTo(X, Y) : c.moveTo(X, Y); });
          c.strokeStyle = paper ? `rgba(20,40,160,${op})` : `rgba(158,255,198,${op})`;
          c.shadowColor = paper ? 'transparent' : '#6effb0'; c.shadowBlur = paper ? 0 : 6;
          c.lineWidth = fw; c.stroke(); c.shadowBlur = 0;
        };
        drawPts(this.pts); drawPts(this.pts2);
      },
    });
  }
}

// ------------------------------------------------------------------ Digital multimeter (lying on the bench, seen from above)
const DMM_POS = [
  { k: 'off', l: 'OFF' },
  { k: 'V', r: 600, d: 0, l: '600', u: 'V' }, { k: 'V', r: 200, d: 1, l: '200', u: 'V' }, { k: 'V', r: 20, d: 2, l: '20', u: 'V' }, { k: 'V', r: 2, d: 3, l: '2', u: 'V' }, { k: 'V', r: 0.2, d: 1, l: '200m', u: 'mV', scale: 1000 },
  { k: 'R', r: 200, d: 1, l: '200', u: 'Ω' }, { k: 'R', r: 2e3, d: 3, l: '2k', u: 'kΩ', scale: 1e-3 }, { k: 'R', r: 2e4, d: 2, l: '20k', u: 'kΩ', scale: 1e-3 }, { k: 'R', r: 2e5, d: 1, l: '200k', u: 'kΩ', scale: 1e-3 }, { k: 'R', r: 2e6, d: 3, l: '2M', u: 'MΩ', scale: 1e-6 },
  { k: 'Hz', l: 'Hz', u: 'kHz' },
  { k: 'A20', r: 20, d: 2, l: '20A', u: 'A' }, { k: 'mA', r: 0.2, d: 1, l: '200m', u: 'mA', scale: 1000 }, { k: 'mA', r: 0.02, d: 2, l: '20m', u: 'mA', scale: 1000 }, { k: 'mA', r: 0.002, d: 3, l: '2m', u: 'mA', scale: 1000 },
];
export class Multimeter {
  // source(meter) must return {V:{dc,ac}, mA:{dc,ac}, A20:{dc,ac}, R: ohms|Infinity|null, Hz} of what is connected to the jacks
  constructor(ctx, parent, x, y, o = {}) {
    const { bench } = ctx;
    this.ctx = ctx; this.id = o.id ?? 'dmm'; this.style = o.style ?? 'peaktech';
    this.source = () => ({ V: { dc: 0, ac: 0 }, mA: { dc: 0, ac: 0 }, A20: { dc: 0, ac: 0 }, R: Infinity, Hz: 0 });
    this.on = false; this.ac = false; this.hold = false; this.fuse = true; this.held = null;
    const G = g(parent, { transform: `translate(${x},${y}) rotate(${o.rot ?? 0})` });
    this.G = G;
    const dark = this.style === 'dt603';
    // holster + face
    rect(G, -3, 3, 96, 186, { fill: '#000', opacity: 0.25, r: 12, filter: 'url(#fBlur2)' });
    rect(G, 0, 0, 90, 180, { fill: '#2f86d6', stroke: '#1a4f86', sw: 0.8, r: 11 });
    rect(G, 6, 6, 78, 168, { fill: dark ? '#22262b' : '#f3f4f2', stroke: dark ? '#111' : '#b9bcc0', sw: 0.6, r: 6 });
    const ink = dark ? '#e8e8e8' : '#222';
    txt(G, 45, 12, dark ? 'BLUETECH  DT603' : 'PeakTech®  2010', { size: 3.4, fill: dark ? '#f4c430' : '#1f4fc4', weight: 800 });
    this.disp = new Display7(G, { x: 45, y: 32, w: 66, h: 26, digits: 4, style: 'lcd', ann: [
      { key: 'AC', x: -27, y: -9.5, text: 'AC', size: 3 }, { key: 'DC', x: -27, y: -9.5, text: 'DC', size: 3 },
      { key: 'HOLD', x: -14, y: -9.5, text: 'H', size: 3 }, { key: 'BAT', x: 26, y: -9.5, text: '', size: 3 },
      ...['mV', 'V', 'mA', 'A', 'Ω', 'kΩ', 'MΩ', 'kHz'].map(u => ({ key: u, x: 27, y: 9.5, text: u, size: 3.2 })),
    ], digitH: 0.62, dy: 1 });
    this.disp.blank();
    // buttons
    const bt = (bx, label, name, fn, color) => {
      txt(G, bx, 52, label, { size: 2.4, fill: ink });
      return new Button(bench, G, { x: bx, y: 58, w: 11, h: 5, color: color ?? (dark ? '#f4c430' : '#d9dbe0'), name, onPress: fn });
    };
    bt(16, 'POWER', 'POWER', () => { this.on = !this.on; this.held = null; this.hold = false; if (this.on) this.ac = false; }, dark ? '#e53935' : '#5b8fd9');
    bt(34, 'HOLD', 'HOLD (freezes the reading)', () => { if (this.on) { this.hold = !this.hold; this.held = null; } });
    bt(52, 'LIGHT', 'Backlight', () => { this.light = !this.light; });
    bt(70, 'AC/DC', 'DC/AC selection — press for AC', () => { if (this.on) this.ac = !this.ac; });
    // selector
    const sweep = 330;
    const labels = DMM_POS.map(p => p.l);
    circ(G, 45, 110, 30, { fill: dark ? '#2b2f35' : '#e8e9e6', stroke: dark ? '#111' : '#c0c2c4', sw: 0.6 });
    dial(G, 45, 110, 25, labels, { sweep, size: 2.6, color: ink, ticks: true });
    txt(G, 18, 86, 'V⎓~', { size: 3, fill: ink }); txt(G, 74, 86, 'A', { size: 3, fill: ink }); txt(G, 10, 122, 'Ω', { size: 3, fill: ink }); txt(G, 45, 146, 'Hz', { size: 0.1, fill: ink });
    this.sel = new Knob(bench, G, { x: 45, y: 110, r: 15, style: 'black', steps: DMM_POS.map((_, i) => i), labels: DMM_POS.map(p => (p.k === 'off' ? 'OFF' : `${p.l} ${p.k === 'mA' ? 'A' : p.k === 'A20' ? '' : p.k === 'R' ? 'Ω' : p.k === 'V' ? 'V' : ''}`).trim()), index: 0, sweep, name: 'Function / range selector', onChange: () => { this.held = null; } });
    // jacks
    const jy = 162;
    const jk = (jx, label, id, color) => {
      txt(G, jx, jy - 10, label, { size: 2.6, fill: ink });
      return new Socket(bench, G, { x: jx, y: jy, id: this.id + '.' + id, color, name: `${o.name ?? 'Multimeter'} ${label} jack` });
    };
    this.j20 = jk(14, '20A', 'a20', 'red');
    this.jma = jk(35, 'mA', 'ma', 'red');
    this.jcom = jk(56, 'COM', 'com', 'black');
    this.jv = jk(77, 'VΩHz', 'v', 'red');
    txt(G, 45, 174, dark ? 'CAT III 600V   FUSED' : 'CAT III 600V    10A / 200mA FUSED', { size: 2, fill: ink });
    bench.addUpdater((dt) => this._tick(dt));
  }
  get pos() { return DMM_POS[this.sel.idx]; }
  _tick(dt) {
    this._acc = (this._acc || 0) + dt;
    if (this._acc < 0.35) return;
    this._acc = 0;
    if (!this.on || this.pos.k === 'off') { this.disp.blank(); return; }
    if (this.hold && this.held) return;
    const p = this.pos;
    const s = this.source(this);
    let str = '', anns = [];
    const pick = (q) => (this.ac ? q.ac : q.dc);
    if (p.k === 'V') {
      const v = pick(s.V) * (1 + gauss() * 0.0008) + gauss() * p.r * 2e-5;
      str = meterText(v * (p.scale ?? 1), p.d, { max: p.r === 600 ? 600 : 1999 });
      anns = [this.ac ? 'AC' : 'DC', p.u];
    } else if (p.k === 'mA' || p.k === 'A20') {
      const q = p.k === 'mA' ? s.mA : s.A20;
      let i = this.fuse || p.k === 'A20' ? pick(q) : 0;
      if (p.k === 'mA' && this.fuse && Math.abs(q.ac) + Math.abs(q.dc) > 0.25) {
        this.fuse = false; i = 0;
        this.ctx.ui.remark('The multimeter’s 200 mA fuse has blown — too much current through the mA jack. Check your circuit (an ammeter must be in series).', 'bad');
      }
      i = i * (1 + gauss() * 0.001) + gauss() * p.r * 2e-5;
      str = meterText(i * (p.scale ?? 1), p.d);
      anns = [this.ac ? 'AC' : 'DC', p.u];
    } else if (p.k === 'R') {
      const R = s.R;
      if (R === null) str = '----'; // powered circuit -> nonsense
      else if (!isFinite(R) || R > p.r * 0.9995) str = '1   ';
      else str = meterText(R * (p.scale ?? 1), p.d);
      anns = [p.u];
    } else if (p.k === 'Hz') {
      const f = s.Hz || 0;
      str = f >= 1000 ? (f / 1000).toFixed(3) : f.toFixed(1);
      anns = [f >= 1000 ? 'kHz' : 'kHz'];
    }
    if (this.hold) { this.held = str; anns.push('HOLD'); }
    this.disp.set(str, anns);
  }
  replaceFuse() { this.fuse = true; }
}

// ------------------------------------------------------------------ Function generator (Scientific 3 MHz)
const RANGES = [1, 10, 100, 1e3, 1e4, 1e5, 1e6];
const RANGE_L = ['1', '10', '100', '1k', '10k', '100k', '1M'];
const WAVES = ['SINE', 'SQUARE', 'TRIANGLE'];
export class FuncGen {
  constructor(ctx, parent, x, y, o = {}) {
    const { bench } = ctx;
    this.ctx = ctx; this.id = o.id ?? 'fg';
    this.on = false; this.range = 3; this.wave = 0; this.z600 = false;
    const W = 240, H = 100;
    const F = cabinet(parent, x, y, W, H, { depth: 14 });
    this.F = F;
    vents(F, 150, -10, 1, 1, 1, 0); // nothing
    // top vents on the top face
    for (let i = 0; i < 4; i++) for (let a = 0; a < 6; a++) for (let b = 0; b < 2; b++) circ(F, 30 + i * 50 + a * 5, -9 + b * 4, 0.9, { fill: '#9c988f' });
    txt(F, 14, 12, 'scientific', { size: 5.5, fill: '#1d5fc2', weight: 800, anchor: 'start' });
    txt(F, 14, 19, o.model ?? '3 MHz Function Generator  SM5071', { size: 2.8, fill: '#333', anchor: 'start' });
    // LCD
    rect(F, 14, 24, 104, 22, { fill: '#111', r: 2 });
    this.lcdBg = rect(F, 16, 26, 100, 18, { fill: '#33402a', r: 1 });
    this.lcd1 = txt(F, 112, 32, '', { size: 6.4, fill: '#0b0f07', anchor: 'end', family: 'Menlo, Consolas, monospace', weight: 700 });
    this.lcd2 = txt(F, 20, 40, '', { size: 3.6, fill: '#0b0f07', anchor: 'start', family: 'Menlo, Consolas, monospace', weight: 700 });
    // power
    txt(F, 18, 70, 'POWER', { size: 2.4 });
    this.power = new Button(bench, F, { x: 18, y: 80, w: 9, h: 9, color: '#d63a2f', latch: true, name: 'POWER', onPress: v => { this.on = v; this._lcd(); this._changed(); } });
    // range buttons
    txt(F, 75, 52, 'RANGE (Hz)', { size: 2.6 });
    this.rbtn = RANGE_L.map((l, i) => {
      const bx = 36 + i * 13;
      txt(F, bx, 58, l, { size: 2.4 });
      return new Button(bench, F, { x: bx, y: 64, w: 8, h: 5, latch: true, value: i === this.range, name: `Range ${l} Hz decade`, onPress: () => { this.range = i; this.rbtn.forEach((b, j) => b.set(j === i, true)); this._lcd(); this._changed(); } });
    });
    txt(F, 75, 74, 'FUNC', { size: 2.4 });
    new Button(bench, F, { x: 75, y: 81, w: 9, h: 5, name: 'FUNC (waveform select)', onPress: () => { this.wave = (this.wave + 1) % 3; this._lcd(); this._changed(); } });
    txt(F, 94, 74, '50Ω/600Ω', { size: 2.2 });
    this.zb = new Button(bench, F, { x: 94, y: 81, w: 8, h: 5, latch: true, name: 'Output impedance 50 Ω / 600 Ω (keep released = 50 Ω)', onText: '600 Ω', offText: '50 Ω', onPress: v => { this.z600 = v; this._changed(); } });
    txt(F, 112, 74, 'SWEEP', { size: 2.2 }); new Button(bench, F, { x: 112, y: 81, w: 8, h: 5, latch: true, name: 'SWEEP (not used)' });
    txt(F, 130, 74, '-20dB', { size: 2.2 }); new Button(bench, F, { x: 130, y: 81, w: 8, h: 5, latch: true, name: '−20 dB attenuator (keep released)', onPress: v => { this.att1 = v; this._changed(); } });
    txt(F, 146, 74, '-20dB', { size: 2.2 }); new Button(bench, F, { x: 146, y: 81, w: 8, h: 5, latch: true, name: '−20 dB attenuator (keep released)', onPress: v => { this.att2 = v; this._changed(); } });
    // knobs
    txt(F, 150, 14, 'FRQ', { size: 2.8 });
    this.frq = new Knob(bench, F, { x: 150, y: 32, r: 9, style: 'whiteround', value: 0.3, sweep: 300, wheel: 0.002, drag: 0.0015, name: 'FRQ (frequency) — scroll for fine, Shift for finer', onChange: () => { this._lcd(); this._changed(); } });
    dial(F, 150, 32, 12.5, ['.3', '', '', '', '', '', '', '', '', '3'], { size: 2.2 });
    txt(F, 180, 14, 'AMPL', { size: 2.8 });
    this.ampl = new Knob(bench, F, { x: 180, y: 32, r: 7.5, style: 'whiteround', value: 0, name: 'AMPL (amplitude)', wheel: 0.01, onChange: () => { this._lcd(); this._changed(); } });
    txt(F, 206, 14, 'OFFSET', { size: 2.4 });
    new Knob(bench, F, { x: 206, y: 32, r: 6, style: 'whiteround', value: 0.5, name: 'OFFSET (keep centred / off)' });
    txt(F, 228, 14, 'WIDTH', { size: 2.4 });
    new Knob(bench, F, { x: 228, y: 32, r: 5, style: 'whiteround', value: 0.5, name: 'WIDTH (not used)' });
    txt(F, 186, 62, 'SPEED', { size: 2.2 }); new Knob(bench, F, { x: 186, y: 72, r: 5, style: 'whiteround', name: 'SWEEP SPEED (not used)' });
    txt(F, 218, 60, 'OUTPUT', { size: 2.6 }); txt(F, 218, 64, '50Ω', { size: 2 });
    if (o.adapter) {
      this.out = new Socket(bench, F, { x: 218, y: 78, kind: 'bnc', id: this.id + '.out', name: 'FG OUTPUT (BNC)' });
      // BNC-to-4mm adapter fitted on the output
      const A = g(F);
      rect(A, 206, 70, 24, 22, { fill: 'rgba(230,240,250,0.55)', stroke: '#8a9aa8', sw: 0.6, r: 3 });
      txt(A, 218, 88.5, 'BNC→4mm', { size: 2 });
      this.hi = new Socket(bench, F, { x: 211, y: 80, id: this.id + '.hi', color: 'red', name: 'FG output (adapter, red)', scale: 0.8 });
      this.lo = new Socket(bench, F, { x: 225, y: 80, id: this.id + '.lo', color: 'black', name: 'FG output (adapter, black/ground)', scale: 0.8 });
    } else {
      this.out = new Socket(bench, F, { x: 218, y: 78, kind: 'bnc', id: this.id + '.out', name: 'FG OUTPUT (BNC)' });
    }
    this.listeners = [];
    this._lcd();
  }
  onChange(f) { this.listeners.push(f); }
  _changed() { this.listeners.forEach(f => f()); }
  get freq() { return RANGES[this.range] * (0.3 + 2.7 * this.frq.value); }
  get vppOpen() { // open-circuit peak-to-peak volts
    let v = 20 * this.ampl.value;
    if (this.att1) v /= 10; if (this.att2) v /= 10;
    return this.on ? v : 0;
  }
  get vrmsOpen() { const vp = this.vppOpen / 2; return [vp / Math.SQRT2, vp, vp / Math.sqrt(3)][this.wave]; }
  get zout() { return this.z600 ? 600 : 50; }
  get waveName() { return WAVES[this.wave]; }
  _lcd() {
    if (!this.on) { this.lcdBg.setAttribute('fill', '#33402a'); this.lcd1.textContent = ''; this.lcd2.textContent = ''; return; }
    this.lcdBg.setAttribute('fill', '#b5d36a');
    const f = this.freq;
    let s;
    if (f >= 1e6) s = (f / 1e6).toFixed(4) + ' MHz';
    else if (f >= 1e3) s = (f / 1e3).toFixed(f >= 1e5 ? 2 : f >= 1e4 ? 3 : 4) + ' kHz';
    else s = f.toFixed(f >= 100 ? 2 : f >= 10 ? 3 : 4) + ' Hz';
    this.lcd1.textContent = s;
    this.lcd2.textContent = `${WAVES[this.wave].padEnd(9)} AMPL ${(this.vppOpen).toFixed(1)}Vpp`;
  }
}
