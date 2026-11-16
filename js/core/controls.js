// Interactive front-panel controls drawn in SVG.
import { h, g, txt, rect, circ, line, path, poly, clamp } from './svg.js';

function hook(bench, el, tipFn) {
  el.setAttribute('data-ctrl', '1');
  el.style.cursor = 'pointer';
  el.addEventListener('pointerenter', e => bench.tip(e, tipFn()));
  el.addEventListener('pointermove', e => { if (!el._dragging) bench.tip(e, tipFn()); });
  el.addEventListener('pointerleave', () => bench.untip());
}

// ---------------------------------------------------------------- Knob
// Continuous (min..max), stepped (steps array), or endless screw (unitPerTurn).
export class Knob {
  constructor(bench, parent, o) {
    this.bench = bench;
    this.name = o.name || 'Knob';
    this.min = o.min ?? 0; this.max = o.max ?? 1;
    this.steps = o.steps || null;             // array of values
    this.labels = o.labels || null;           // labels for steps
    this.sweep = o.sweep ?? 300;
    this.onChange = o.onChange;
    this.wheelFrac = o.wheel ?? 0.01;         // fraction of range per notch (continuous)
    this.dragFrac = o.drag ?? 0.004;          // fraction per px (continuous)
    this.unitPerTurn = o.unitPerTurn ?? null; // endless screw: value units per 360°
    this.wheelUnits = o.wheelUnits ?? 0.01;   // endless: units per notch
    this.dragUnits = o.dragUnits ?? 0.01;     // endless: units per px
    this.hint = o.hint ?? (this.steps ? 'scroll or drag to switch' : 'drag or scroll to turn · Shift = fine');
    this.locked = false;
    this.idx = o.index ?? 0;
    this.value = this.steps ? this.steps[this.idx] : (o.value ?? this.min);
    this.el = g(parent, { transform: `translate(${o.x},${o.y})` });
    this.rot = g(this.el);
    drawKnob(this.rot, o.r ?? 6, o.style ?? 'ses');
    if (o.style === 'flat') this.rot.setAttribute('data-flat', '1');
    hook(bench, this.el, () => this.tip());
    this._drag();
    this._apply(true);
  }
  tip() {
    let s = `<b>${this.name}</b>`;
    if (this.steps) s += `: ${this.labels ? this.labels[this.idx] : this.steps[this.idx]}`;
    if (this.locked) s += '<br><i>locked</i>';
    return s + `<br><span class="tip-hint">${this.hint}</span>`;
  }
  get frac() { return (this.value - this.min) / (this.max - this.min); }
  set(v, silent) {
    if (this.steps) return this.setIndex(this.steps.indexOf(v), silent);
    const nv = this.unitPerTurn && this.min === undefined ? v : clamp(v, this.min, this.max);
    if (nv === this.value && !silent) return;
    this.value = nv;
    this._apply(silent);
  }
  setFrac(f, silent) { this.set(this.min + clamp(f, 0, 1) * (this.max - this.min), silent); }
  setIndex(i, silent) {
    i = clamp(i, 0, this.steps.length - 1);
    if (i === this.idx && !silent) return;
    this.idx = i; this.value = this.steps[i];
    this._apply(silent);
  }
  _angle() {
    if (this.steps) return (this.steps.length === 1 ? 0 : (this.idx / (this.steps.length - 1) - 0.5)) * this.sweep;
    if (this.unitPerTurn) return (this.value / this.unitPerTurn) * 360;
    return (this.frac - 0.5) * this.sweep;
  }
  _apply(silent) {
    this.rot.setAttribute('transform', `rotate(${this._angle()})`);
    if (!silent && this.onChange) this.onChange(this.value, this);
  }
  _nudge(dir, fine) {
    if (this.locked) return;
    if (this.steps) return this.setIndex(this.idx + dir);
    if (this.unitPerTurn) return this.set(this.value + dir * this.wheelUnits * (fine ? 0.1 : 1));
    this.set(this.value + dir * this.wheelFrac * (fine ? 0.1 : 1) * (this.max - this.min));
  }
  _drag() {
    const el = this.el;
    let st = null;
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); e.preventDefault();
      el.setPointerCapture(e.pointerId);
      st = { x: e.clientX, y: e.clientY, acc: 0, x0: e.clientX, y0: e.clientY, moved: false }; el._dragging = true;
    });
    el.addEventListener('pointermove', (e) => {
      if (!st || this.locked) return;
      if (!st.moved && Math.abs(e.clientX - st.x0) + Math.abs(e.clientY - st.y0) < 4) return;
      st.moved = true;
      const d = (e.clientX - st.x) - (e.clientY - st.y);
      st.x = e.clientX; st.y = e.clientY;
      const fine = e.shiftKey ? 0.1 : 1;
      if (this.steps) {
        st.acc += d;
        while (st.acc > 18) { st.acc -= 18; this.setIndex(this.idx + 1); }
        while (st.acc < -18) { st.acc += 18; this.setIndex(this.idx - 1); }
      } else if (this.unitPerTurn) {
        this.set(this.value + d * this.dragUnits * fine);
      } else {
        this.set(this.value + d * this.dragFrac * fine * (this.max - this.min));
      }
    });
    const up = (e) => {
      const tap = st && !st.moved && e.type === 'pointerup';
      st = null; el._dragging = false;
      if (tap) this.bench.knobPad(e, this);
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', e => e.stopPropagation());
    el.addEventListener('wheel', (e) => {
      e.preventDefault(); e.stopPropagation();
      this._nudge(e.deltaY < 0 ? 1 : -1, e.shiftKey);
      this.bench.tip(e, this.tip());
    }, { passive: false });
  }
}

export function drawKnob(G, r, style) {
  const knurl = (rr, color, n = 28, sw = 0.5) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      line(G, Math.sin(a) * rr * 0.86, -Math.cos(a) * rr * 0.86, Math.sin(a) * rr, -Math.cos(a) * rr, { stroke: color, sw });
    }
  };
  switch (style) {
    case 'ses': // cream skirted knob (SES instruments)
      circ(G, 0, 0.6, r * 1.32, { fill: 'rgba(0,0,0,0.18)' });
      circ(G, 0, 0, r * 1.3, { fill: '#e5e0d2', stroke: '#a7a191', sw: 0.5 });
      circ(G, 0, 0, r, { fill: 'url(#gCream)', stroke: '#a49e8f', sw: 0.5 });
      knurl(r, '#bdb6a4', 30, 0.4);
      line(G, 0, -r * 0.2, 0, -r * 1.28, { stroke: '#1a1a1a', sw: r * 0.14, cap: 'round' });
      break;
    case 'black':
      circ(G, 0, 0.7, r * 1.04, { fill: 'rgba(0,0,0,0.25)' });
      circ(G, 0, 0, r, { fill: 'url(#gBlackKnob)', stroke: '#000', sw: 0.4 });
      knurl(r, '#555', 24, 0.5);
      circ(G, 0, 0, r * 0.6, { fill: '#2a2a2a', stroke: '#777', sw: 0.3 });
      line(G, 0, -r * 0.15, 0, -r * 0.95, { stroke: '#f5f5f5', sw: r * 0.12, cap: 'round' });
      break;
    case 'blackcap': // black knob with chrome cap (BH tracer "P")
      circ(G, 0, 0.7, r * 1.04, { fill: 'rgba(0,0,0,0.25)' });
      circ(G, 0, 0, r, { fill: 'url(#gBlackKnob)', stroke: '#000', sw: 0.4 });
      knurl(r, '#444', 20, 0.9);
      circ(G, 0, 0, r * 0.55, { fill: 'url(#gChromeR)', stroke: '#666', sw: 0.3 });
      line(G, 0, -r * 0.6, 0, -r * 0.98, { stroke: '#fff', sw: r * 0.12, cap: 'round' });
      break;
    case 'scope': // SM203G large knob with red cap
      circ(G, 0, 0.6, r * 1.03, { fill: 'rgba(0,0,0,0.2)' });
      circ(G, 0, 0, r, { fill: 'url(#gGrayKnob)', stroke: '#9b988f', sw: 0.5 });
      knurl(r, '#bbb8b0', 26, 0.45);
      circ(G, 0, 0, r * 0.48, { fill: 'url(#gRedCap)', stroke: '#7c1414', sw: 0.3 });
      line(G, 0, -r * 0.5, 0, -r * 0.98, { stroke: '#1d3b8f', sw: r * 0.1, cap: 'round' });
      circ(G, 0, -r * 0.3, r * 0.07, { fill: '#fff' });
      break;
    case 'gray': // small gray knob with blue dot (SM203G position)
      circ(G, 0, 0.5, r * 1.03, { fill: 'rgba(0,0,0,0.2)' });
      circ(G, 0, 0, r, { fill: 'url(#gGrayKnob)', stroke: '#9b988f', sw: 0.4 });
      knurl(r, '#c4c1b9', 22, 0.35);
      circ(G, 0, -r * 0.55, r * 0.17, { fill: '#1d3b8f' });
      break;
    case 'blue': { // INDOSAW blue fluted knob
      circ(G, 0, 0.8, r * 1.06, { fill: 'rgba(0,0,0,0.22)' });
      const pts = [];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2, rr = i % 2 ? r * 0.9 : r;
        pts.push([Math.sin(a) * rr, -Math.cos(a) * rr]);
      }
      poly(G, pts, { fill: 'url(#gBlueKnob)', stroke: '#13286a', sw: 0.4 });
      circ(G, 0, 0, r * 0.68, { fill: '#eceef4', stroke: '#9aa', sw: 0.3 });
      line(G, 0, -r * 0.2, 0, -r * 0.66, { stroke: '#333', sw: r * 0.08, cap: 'round' });
      break;
    }
    case 'chrome':
      circ(G, 0, 0.5, r * 1.03, { fill: 'rgba(0,0,0,0.25)' });
      circ(G, 0, 0, r, { fill: 'url(#gChromeR)', stroke: '#777', sw: 0.4 });
      knurl(r, '#8a9096', 30, 0.45);
      circ(G, 0, 0, r * 0.35, { fill: '#cfd4d8', stroke: '#888', sw: 0.3 });
      line(G, 0, -r * 0.4, 0, -r * 0.85, { stroke: '#333', sw: r * 0.08 });
      break;
    case 'whiteround': // FG / function generator plain knob
      circ(G, 0, 0.6, r * 1.03, { fill: 'rgba(0,0,0,0.2)' });
      circ(G, 0, 0, r, { fill: 'url(#gGrayKnob)', stroke: '#8f8c84', sw: 0.5 });
      circ(G, 0, 0, r * 0.75, { fill: '#f4f2ec', stroke: '#bdbab2', sw: 0.3 });
      line(G, 0, -r * 0.3, 0, -r * 0.95, { stroke: '#222', sw: r * 0.1, cap: 'round' });
      break;
    case 'drum': // micrometer / screw head seen face on
      circ(G, 0, 0.6, r * 1.03, { fill: 'rgba(0,0,0,0.25)' });
      circ(G, 0, 0, r, { fill: 'url(#gChromeR)', stroke: '#666', sw: 0.5 });
      knurl(r, '#6d757c', 40, 0.4);
      circ(G, 0, 0, r * 0.3, { fill: '#888' });
      line(G, 0, -r * 0.35, 0, -r * 0.86, { stroke: '#222', sw: r * 0.06 });
      break;
    case 'ball': // three-spoke handwheel with black balls (electromagnet)
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        line(G, 0, 0, Math.sin(a) * r * 0.8, -Math.cos(a) * r * 0.8, { stroke: 'url(#gChrome)', sw: r * 0.12, cap: 'round' });
        circ(G, Math.sin(a) * r * 0.86, -Math.cos(a) * r * 0.86, r * 0.22, { fill: 'url(#gBlackKnob)' });
      }
      circ(G, 0, 0, r * 0.28, { fill: 'url(#gChromeR)', stroke: '#555', sw: 0.4 });
      break;
    case 'tiny':
      circ(G, 0, 0, r, { fill: '#3a3a3a', stroke: '#111', sw: 0.3 });
      line(G, 0, 0, 0, -r * 0.9, { stroke: '#ddd', sw: r * 0.2 });
      break;
    default:
      circ(G, 0, 0, r, { fill: '#777' });
      line(G, 0, 0, 0, -r, { stroke: '#fff', sw: 1 });
  }
}

// ---------------------------------------------------------------- Toggle (bat lever)
export class Toggle {
  constructor(bench, parent, o) {
    this.bench = bench; this.name = o.name || 'Switch';
    this.value = !!o.value; this.onChange = o.onChange;
    this.labels = o.labels || ['OFF', 'ON'];
    this.orient = o.orient || 'v';
    this.s = o.size ?? 1;
    this.el = g(parent, { transform: `translate(${o.x},${o.y}) scale(${this.s})` });
    circ(this.el, 0, 0, 4.6, { fill: 'url(#gChromeR)', stroke: '#555', sw: 0.4 });
    circ(this.el, 0, 0, 2.6, { fill: '#9aa1a7', stroke: '#555', sw: 0.3 });
    this.lever = g(this.el);
    line(this.lever, 0, 0, 0, -9, { stroke: 'url(#gChromeH)', sw: 2.4, cap: 'round' });
    circ(this.lever, 0, -9.3, 1.8, { fill: 'url(#gChromeR)', stroke: '#666', sw: 0.3 });
    hook(bench, this.el, () => `<b>${this.name}</b>: ${this.labels[this.value ? 1 : 0]}<br><span class="tip-hint">click to flip</span>`);
    this.el.addEventListener('pointerdown', e => e.stopPropagation());
    this.el.addEventListener('click', (e) => { e.stopPropagation(); this.set(!this.value); this.bench.tip(e, `<b>${this.name}</b>: ${this.labels[this.value ? 1 : 0]}`); });
    this._apply();
  }
  set(v, silent) { v = !!v; if (v === this.value) return; this.value = v; this._apply(); if (!silent && this.onChange) this.onChange(v, this); }
  _apply() {
    const up = this.orient === 'v' ? (this.value ? 0 : 180) : (this.value ? 90 : -90);
    // perspective: lever looks shorter when pointing down/up in front view
    const sc = this.orient === 'v' ? 0.75 : 0.85;
    this.lever.setAttribute('transform', `rotate(${up}) scale(1,${sc})`);
  }
}

// ---------------------------------------------------------------- 3-position slide/lever selector
export class Selector3 {
  constructor(bench, parent, o) {
    this.bench = bench; this.name = o.name; this.labels = o.labels; this.idx = o.index ?? 0; this.onChange = o.onChange;
    this.w = o.w ?? 30;
    this.el = g(parent, { transform: `translate(${o.x},${o.y})` });
    rect(this.el, -this.w / 2, -1.6, this.w, 3.2, { fill: '#222', r: 1.6 });
    this.knob = rect(this.el, -3, -4, 6, 8, { fill: '#111', stroke: '#555', sw: 0.4, r: 1 });
    hook(bench, this.el, () => `<b>${this.name}</b>: ${this.labels[this.idx]}<br><span class="tip-hint">click to move</span>`);
    this.el.addEventListener('pointerdown', e => e.stopPropagation());
    this.el.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = this.bench.toWorld(e.clientX, e.clientY);
      const c = this.bench.worldOf(this.el, 0, 0);
      const s = this.bench.worldOf(this.el, 10, 0);
      const local = (p.x - c.x) / ((s.x - c.x) / 10);
      const n = this.labels.length;
      const i = clamp(Math.round((local / this.w + 0.5) * (n - 1)), 0, n - 1);
      this.set(i === this.idx ? (this.idx + 1) % n : i);
      this.bench.tip(e, `<b>${this.name}</b>: ${this.labels[this.idx]}`);
    });
    this._apply();
  }
  set(i) { if (i === this.idx) return; this.idx = i; this._apply(); this.onChange && this.onChange(i); }
  _apply() { const n = this.labels.length; this.knob.setAttribute('x', -3 + (this.idx / (n - 1) - 0.5) * this.w); }
}

// ---------------------------------------------------------------- Push button
export class Button {
  constructor(bench, parent, o) {
    this.bench = bench; this.name = o.name || 'Button';
    this.latch = !!o.latch; this.value = !!o.value; this.onPress = o.onPress;
    const w = o.w ?? 8, hh = o.h ?? 8;
    this.el = g(parent, { transform: `translate(${o.x},${o.y})` });
    rect(this.el, -w / 2 - 0.8, -hh / 2 - 0.8, w + 1.6, hh + 1.6, { fill: o.bezel ?? '#9c9a94', r: o.round ? (w + 1.6) / 2 : 1 });
    this.cap = rect(this.el, -w / 2, -hh / 2, w, hh, { fill: o.color ?? '#e7e4dc', stroke: '#777', sw: 0.4, r: o.round ? w / 2 : 0.8 });
    this.color = o.color ?? '#e7e4dc';
    this.capShade = rect(this.el, -w / 2, -hh / 2, w, hh, { fill: '#000', opacity: 0, r: o.round ? w / 2 : 0.8 });
    if (o.label) txt(this.el, 0, 0, o.label, { size: o.labelSize ?? 2.4, fill: o.labelColor ?? '#333' });
    hook(bench, this.el, () => `<b>${this.name}</b>${this.latch ? ': ' + (this.value ? (o.onText || 'pressed in') : (o.offText || 'released')) : ''}<br><span class="tip-hint">click to press</span>`);
    this.el.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.capShade.setAttribute('opacity', 0.25); });
    this.el.addEventListener('pointerup', () => this._apply());
    this.el.addEventListener('pointerleave', () => this._apply());
    this.el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.latch) this.value = !this.value;
      this._apply();
      this.onPress && this.onPress(this.value, this);
      this.bench.tip(e, `<b>${this.name}</b>${this.latch ? ': ' + (this.value ? (o.onText || 'pressed in') : (o.offText || 'released')) : ''}`);
    });
    this._apply();
  }
  set(v, silent) { this.value = !!v; this._apply(); if (!silent && this.onPress) this.onPress(this.value, this); }
  _apply() {
    this.capShade.setAttribute('opacity', this.latch && this.value ? 0.22 : 0);
    this.cap.setAttribute('transform', this.latch && this.value ? 'scale(0.9)' : '');
  }
}

// ---------------------------------------------------------------- Rocker (mains) switch
export class Rocker {
  constructor(bench, parent, o) {
    this.bench = bench; this.name = o.name || 'Mains switch'; this.value = !!o.value; this.onChange = o.onChange;
    this.w = o.w ?? 12; this.h = o.h ?? 14; this.color = o.color ?? '#d32f2f'; this.litColor = o.lit;
    this.el = g(parent, { transform: `translate(${o.x},${o.y})` });
    rect(this.el, -this.w / 2 - 1.2, -this.h / 2 - 1.2, this.w + 2.4, this.h + 2.4, { fill: '#111', r: 1.2 });
    this.top = rect(this.el, -this.w / 2, -this.h / 2, this.w, this.h / 2, { fill: this.color, r: 0.6 });
    this.bot = rect(this.el, -this.w / 2, 0, this.w, this.h / 2, { fill: this.color, r: 0.6 });
    this.glow = rect(this.el, -this.w / 2, -this.h / 2, this.w, this.h, { fill: '#fff', opacity: 0, r: 0.6 });
    if (o.mark !== false) { line(this.el, 0, -this.h * 0.35, 0, -this.h * 0.12, { stroke: '#fff', sw: 0.8 }); circ(this.el, 0, this.h * 0.25, this.h * 0.1, { stroke: '#fff', sw: 0.6 }); }
    hook(bench, this.el, () => `<b>${this.name}</b>: ${this.value ? 'ON' : 'OFF'}<br><span class="tip-hint">click to switch</span>`);
    this.el.addEventListener('pointerdown', e => e.stopPropagation());
    this.el.addEventListener('click', (e) => { e.stopPropagation(); this.set(!this.value); this.bench.tip(e, `<b>${this.name}</b>: ${this.value ? 'ON' : 'OFF'}`); });
    this._apply();
  }
  set(v, silent) { v = !!v; if (v === this.value) return; this.value = v; this._apply(); if (!silent && this.onChange) this.onChange(v, this); }
  _apply() {
    this.top.setAttribute('opacity', this.value ? 1 : 0.7);
    this.bot.setAttribute('opacity', this.value ? 0.7 : 1);
    if (this.litColor) {
      this.top.setAttribute('fill', this.value ? this.litColor : this.color);
      this.bot.setAttribute('fill', this.value ? this.litColor : this.color);
      this.glow.setAttribute('opacity', this.value ? 0.25 : 0);
    }
  }
}

// ---------------------------------------------------------------- LED
export class LED {
  constructor(parent, { x, y, r = 1.4, color = '#ff2a1a', off = '#5a1a14' }) {
    this.color = color; this.off = off;
    this.el = circ(parent, x, y, r, { fill: off, stroke: '#222', sw: 0.3 });
    this.on = false;
  }
  set(on) {
    if (on === this.on) return; this.on = on;
    this.el.setAttribute('fill', on ? this.color : this.off);
    this.el.setAttribute('filter', on ? 'url(#fGlow)' : '');
  }
}

// ---------------------------------------------------------------- Seven-segment display
const SEG = {
  '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg', '6': 'acdefg', '7': 'abc',
  '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '', 'E': 'adefg', 'r': 'eg', 'o': 'cdeg', 'L': 'def', 'H': 'bcefg',
  'P': 'abefg', 'F': 'aefg', 'n': 'ceg', 'A': 'abcefg', 'C': 'adef', 'U': 'bcdef', 'b': 'cdefg', 'd': 'bcdeg',
  'u': 'cde', 't': 'defg', 'c': 'deg', 'h': 'cefg', 'O': 'abcdef', 'S': 'acdfg', 'y': 'bcdfg', '_': 'd',
};
export class Display7 {
  constructor(parent, o) {
    this.n = o.digits ?? 4;
    const style = o.style ?? 'led';
    const pal = {
      led: { bg: '#1b0605', on: '#ff3b26', off: '#3b0f0b', frame: '#111' },
      green: { bg: '#071a0b', on: '#47ff6a', off: '#0e3317', frame: '#111' },
      lcd: { bg: '#c3ccb3', on: '#161616', off: '#b7c1a6', frame: '#333' },
      lcdblue: { bg: '#a9c9a0', on: '#101010', off: '#9fbe96', frame: '#222' },
    }[style];
    this.pal = pal;
    this.el = g(parent, { transform: `translate(${o.x},${o.y})` });
    const W = o.w, H = o.h;
    rect(this.el, -W / 2 - 1.5, -H / 2 - 1.5, W + 3, H + 3, { fill: pal.frame, r: 1 });
    rect(this.el, -W / 2, -H / 2, W, H, { fill: pal.bg });
    if (style.startsWith('led')) rect(this.el, -W / 2, -H / 2, W, H * 0.45, { fill: '#fff', opacity: 0.04 });
    const pad = o.pad ?? W * 0.06;
    const cw = (W - 2 * pad) / this.n;
    const ch = H * (o.digitH ?? 0.66);
    const t = Math.min(cw, ch) * 0.13;
    this.cells = [];
    for (let i = 0; i < this.n; i++) {
      const x0 = -W / 2 + pad + i * cw + cw * 0.14;
      const w = cw * 0.66;
      const y0 = -ch / 2 + (o.dy ?? 0), y1 = y0 + ch / 2, y2 = y0 + ch;
      const sk = (x, y) => [x - (y - y1) * 0.09, y];
      const hs = (xa, xb, y) => [[xa, y], [xa + t / 2, y - t / 2], [xb - t / 2, y - t / 2], [xb, y], [xb - t / 2, y + t / 2], [xa + t / 2, y + t / 2]].map(p => sk(...p));
      const vs = (x, ya, yb) => [[x, ya], [x + t / 2, ya + t / 2], [x + t / 2, yb - t / 2], [x, yb], [x - t / 2, yb - t / 2], [x - t / 2, ya + t / 2]].map(p => sk(...p));
      const gp = t * 0.35;
      const segs = {
        a: hs(x0 + gp, x0 + w - gp, y0), g: hs(x0 + gp, x0 + w - gp, y1), d: hs(x0 + gp, x0 + w - gp, y2),
        f: vs(x0, y0 + gp, y1 - gp), b: vs(x0 + w, y0 + gp, y1 - gp),
        e: vs(x0, y1 + gp, y2 - gp), c: vs(x0 + w, y1 + gp, y2 - gp),
      };
      const cell = {};
      for (const k in segs) cell[k] = poly(this.el, segs[k], { fill: pal.off });
      const dpp = sk(x0 + w + t * 1.3, y2);
      cell.dp = circ(this.el, dpp[0], dpp[1], t * 0.6, { fill: pal.off });
      this.cells.push(cell);
    }
    this.ann = {};
    (o.ann || []).forEach(a => {
      this.ann[a.key] = txt(this.el, a.x, a.y, a.text, { size: a.size ?? 2.4, fill: pal.on, weight: 700 });
      this.ann[a.key].setAttribute('opacity', 0);
    });
    this.text = null;
  }
  set(str, anns) {
    if (anns) for (const k in this.ann) this.ann[k].setAttribute('opacity', anns.includes(k) ? 1 : 0);
    if (str === this.text) return;
    this.text = str;
    const chars = [];
    for (const c of String(str ?? '')) {
      if (c === '.' && chars.length) chars[chars.length - 1].dp = true;
      else if (c === '.') chars.push({ c: ' ', dp: true });
      else chars.push({ c, dp: false });
    }
    while (chars.length < this.n) chars.unshift({ c: ' ', dp: false });
    const view = chars.slice(chars.length - this.n);
    view.forEach((ch, i) => {
      const cell = this.cells[i], on = SEG[ch.c] ?? '';
      for (const s of 'abcdefg') cell[s].setAttribute('fill', on.includes(s) ? this.pal.on : this.pal.off);
      cell.dp.setAttribute('fill', ch.dp ? this.pal.on : this.pal.off);
    });
  }
  blank() { this.set(''); for (const k in this.ann) this.ann[k].setAttribute('opacity', 0); }
}

// Format a number for a 3½-digit meter: maxCount 1999, fixed decimals. Returns overrange "1" style.
export function meterText(v, decimals, { max = 1999, leadingOne = true } = {}) {
  const count = Math.abs(v) * Math.pow(10, decimals);
  if (Math.round(count) > max) return (v < 0 ? '-' : '') + (leadingOne ? '1   ' : 'OL');
  const s = Math.abs(v).toFixed(decimals);
  return (v < 0 && Math.round(count) !== 0 ? '-' : '') + s;
}

// ---------------------------------------------------------------- Socket (banana / BNC / DIN)
export const SOCKET_COLORS = { red: '#d32f2f', black: '#1d1d1d', yellow: '#f0c419', blue: '#1f5ad6', green: '#2e9d3a', white: '#eeeeee', grey: '#8b8f93' };
export class Socket {
  constructor(bench, parent, o) {
    this.bench = bench; this.id = o.id; this.kind = o.kind ?? 'banana'; this.color = o.color ?? 'red';
    this.name = o.name ?? o.id; this.allowMixed = !!o.allowMixed; this.max = o.max ?? (this.kind === 'banana' ? 3 : 1);
    this.s = o.scale ?? 1;
    this.el = g(parent, { transform: `translate(${o.x},${o.y}) scale(${this.s})` });
    const c = SOCKET_COLORS[this.color] ?? this.color;
    if (this.kind === 'banana') {
      circ(this.el, 0, 0.6, 4.6, { fill: 'rgba(0,0,0,0.25)' });
      circ(this.el, 0, 0, 4.4, { fill: c, stroke: '#000', sw: 0.35 });
      circ(this.el, 0, 0, 3.1, { fill: c, stroke: 'rgba(0,0,0,0.45)', sw: 0.5 });
      circ(this.el, -1.2, -1.4, 1.2, { fill: '#fff', opacity: 0.25 });
      circ(this.el, 0, 0, 1.7, { fill: '#b9b9b9', stroke: '#555', sw: 0.3 });
      circ(this.el, 0, 0, 1.05, { fill: '#111' });
    } else if (this.kind === 'bnc') {
      circ(this.el, 0, 0.6, 6.4, { fill: 'rgba(0,0,0,0.25)' });
      circ(this.el, 0, 0, 6.2, { fill: 'url(#gChromeR)', stroke: '#555', sw: 0.4 });
      circ(this.el, 0, 0, 4.4, { fill: '#cfd3d6', stroke: '#666', sw: 0.3 });
      circ(this.el, 0, 0, 2.8, { fill: '#f2f2ee', stroke: '#aaa', sw: 0.2 });
      circ(this.el, 0, 0, 0.8, { fill: '#c9a227' });
      rect(this.el, -6.9, -0.7, 1.6, 1.4, { fill: '#999' }); rect(this.el, 5.3, -0.7, 1.6, 1.4, { fill: '#999' });
    } else { // din
      circ(this.el, 0, 0.6, 8.4, { fill: 'rgba(0,0,0,0.25)' });
      circ(this.el, 0, 0, 8.2, { fill: '#3a3a3a', stroke: '#111', sw: 0.4 });
      circ(this.el, 0, 0, 6.2, { fill: '#151515' });
      for (let i = 0; i < 5; i++) { const a = (-90 + i * 45) * Math.PI / 180; circ(this.el, Math.cos(a) * 3.5 + 0, Math.sin(a) * 3.5 + 1.2, 0.7, { fill: '#c9a227' }); }
      rect(this.el, -1, 5.2, 2, 1.6, { fill: '#555' });
    }
    this.ring = circ(this.el, 0, 0, this.kind === 'banana' ? 6 : 9, { stroke: '#ffd400', sw: 1.2, opacity: 0, pe: 'none' });
    hook(bench, this.el, () => {
      const w = bench.wires;
      const n = w ? w.countAt(this) : 0;
      return `<b>${this.name}</b>${n ? ` <span class="tip-hint">(${n} plug${n > 1 ? 's' : ''})</span>` : ''}<br><span class="tip-hint">${w && w.pending ? 'click to connect here' : 'click to start a connection'}</span>`;
    });
    this.el.addEventListener('pointerdown', e => e.stopPropagation());
    this.el.addEventListener('click', (e) => { e.stopPropagation(); bench.wires.clickSocket(this, e); });
    bench.wires.addSocket(this);
  }
  highlight(on) { this.ring.setAttribute('opacity', on ? 1 : 0); }
  world() { return this.bench.worldOf(this.el, 0, 0); }
}
