// Experiment: Series LCR resonance (PHYWE plug-in board, function generator, two DMMs)
import { g, txt, rect, circ, line, path, poly, clamp } from '../core/svg.js';
import { Socket } from '../core/controls.js';
import { FuncGen, Multimeter, solveAC, C } from '../core/instruments.js';

const ICON = `<svg viewBox="0 0 200 100"><rect x="60" y="40" width="70" height="45" rx="4" fill="#2449b8"/><rect x="72" y="50" width="18" height="10" fill="#e8eef8" opacity=".8"/><rect x="140" y="45" width="35" height="35" rx="4" fill="#9aa"/><rect x="146" y="52" width="23" height="22" fill="#e08a1e"/><rect x="10" y="20" width="50" height="40" rx="3" fill="#eee" stroke="#999"/></svg>`;
const COMPS = [
  { id: 'C1', kind: 'C', val: 1e-6, label: '1 µF', sub: 'capacitor' },
  { id: 'R10', kind: 'R', val: 10, label: '10 Ω' }, { id: 'R47', kind: 'R', val: 47, label: '47 Ω' },
  { id: 'R75', kind: 'R', val: 75, label: '75 Ω' }, { id: 'R100', kind: 'R', val: 100, label: '100 Ω' },
  { id: 'R120', kind: 'R', val: 120, label: '120 Ω' },
  { id: 'B1', kind: 'B', val: 0.01, label: 'bridge', sub: 'connector' }, { id: 'B2', kind: 'B', val: 0.01, label: 'bridge', sub: 'connector' },
];

export default {
  id: 'lcr', title: 'Series LCR Circuit', subtitle: 'Resonance frequency and Q-factor',
  blurb: 'Function generator, PHYWE plug-in board with L, C and R blocks, and an a.c. milliammeter (DMM).',
  icon: ICON,
  manual: {
    aim: 'To measure the resonance frequency and Q-factor of a series LCR circuit.',
    apparatus: ['Capacitor 1 µF, inductor 24 mH, non-inductive resistors 10, 47, 75, 100, 120 Ω (plug-in blocks)', 'Function generator with BNC–4 mm adapter', 'Two digital multimeters (a.c. milliammeter / voltmeter)', 'PHYWE plug-in connection board and patch cords'],
    formula: `<p>f<sub>0</sub> = 1 / (2π√(LC))</p><p>Q = f<sub>0</sub> / (f<sub>1</sub> − f<sub>2</sub>), where f<sub>1</sub>, f<sub>2</sub> are the frequencies at which I = I<sub>max</sub>/√2</p>`,
    procedure: [
      'Plug the capacitor and one resistor on the board and connect L, C, R, the a.c. milliammeter (mA and COM jacks) and the function generator all in series.',
      'Set the multimeter to a.c. current (press AC/DC) on a range larger than the expected current.',
      'Ask the instructor to check the circuit before switching on.',
      'Switch on the function generator, select a sine wave and set the output to about 5 V (check with the second multimeter on a.c. volts).',
      'Change the frequency in steps (smaller steps near resonance) and note the current each time (Table).',
      'Repeat with different values of R. Plot I against f and find f<sub>0</sub>, f<sub>1</sub>, f<sub>2</sub> and Q.',
      'Switch off the function generator, disconnect and put all components back in the box.',
    ],
    precautions: ['Check every connection and the multimeter range before switching on.', 'Start measuring only after the instructor has checked the circuit.', 'An ammeter must be in series — never across the source.', 'Keep the generator amplitude constant during a set of readings.'],
    controls: ['Click a component in the box, then click the left socket where it should plug in (it spans two neighbouring sockets in a row).', 'Each white bar on the board connects the sockets in that column.', 'Patch cords: click one socket then another.', 'FRQ knob: scroll for fine steps, Shift for finer.'],
    link: 'https://drive.google.com/file/d/1LZIZUFVJnEbyoYqQ5cWHN2rMq7Xgu68e/view',
  },
  tables: [
    { id: 'const', title: 'Circuit values', fields: [{ id: 'L', label: 'L' }, { id: 'C', label: 'C' }, { id: 'V', label: 'Source voltage (V)' }, { id: 'f0t', label: 'f<sub>0</sub> (calculated) (Hz)' }], cols: [{ id: 'x', label: 'Remarks' }], rows: 1 },
    { id: 'r1', title: 'Table 1: Current vs frequency, R = R<sub>1</sub>', fields: [{ id: 'R', label: 'R<sub>1</sub> (Ω)' }, { id: 'f0', label: 'f<sub>0</sub> (Hz)' }, { id: 'f12', label: 'f<sub>1</sub>, f<sub>2</sub> (Hz)' }, { id: 'Q', label: 'Q' }], cols: [{ id: 'n', label: 'S.No.', fixed: [] }, { id: 'f', label: 'Frequency (Hz)' }, { id: 'I', label: 'Current (mA)' }], rows: 18, plot: { x: 'f', y: 'I', fit: false, label: 'I vs f' } },
    { id: 'r2', title: 'Table 2: Current vs frequency, R = R<sub>2</sub>', fields: [{ id: 'R', label: 'R<sub>2</sub> (Ω)' }, { id: 'f0', label: 'f<sub>0</sub> (Hz)' }, { id: 'f12', label: 'f<sub>1</sub>, f<sub>2</sub> (Hz)' }, { id: 'Q', label: 'Q' }], cols: [{ id: 'n', label: 'S.No.', fixed: [] }, { id: 'f', label: 'Frequency (Hz)' }, { id: 'I', label: 'Current (mA)' }], rows: 18, plot: { x: 'f', y: 'I', fit: false, label: 'I vs f' } },
    { id: 'r3', title: 'Table 3: Current vs frequency, R = R<sub>3</sub>', fields: [{ id: 'R', label: 'R<sub>3</sub> (Ω)' }, { id: 'f0', label: 'f<sub>0</sub> (Hz)' }, { id: 'f12', label: 'f<sub>1</sub>, f<sub>2</sub> (Hz)' }, { id: 'Q', label: 'Q' }], cols: [{ id: 'n', label: 'S.No.', fixed: [] }, { id: 'f', label: 'Frequency (Hz)' }, { id: 'I', label: 'Current (mA)' }], rows: 18, plot: { x: 'f', y: 'I', fit: false, label: 'I vs f' } },
  ],

  build(ctx) {
    const { bench, wires, ui, rand } = ctx;
    const Lyr = bench.layers;
    const P = { L: 0.024 * (1 + (rand() - 0.5) * 0.04), C: 1e-6 * (1 + (rand() - 0.5) * 0.06), RL: 6.2 + rand() * 1.2 };
    const S = { placed: new Map(), held: null, checked: false, rUsed: new Set() };

    // ---------------- function generator (programmable, with BNC-4 mm adapter)
    const fg = new FuncGen(ctx, Lyr.inst, 300, 420, { id: 'fg', adapter: true, model: '3 MHz Programmable Function Generator  SM5078' });
    // ---------------- multimeters lying on the bench
    const m1 = new Multimeter(ctx, Lyr.table, 330, 650, { id: 'm1', style: 'dt603', name: 'Multimeter 1 (DT603)', rot: -8 });
    const m2 = new Multimeter(ctx, Lyr.table, 450, 630, { id: 'm2', style: 'peaktech', name: 'Multimeter 2 (PeakTech)', rot: -4 });
    // ---------------- PHYWE connection board (top view)
    const B = g(Lyr.table);
    const bx = 700, by = 600;
    rect(B, bx - 6, by + 6, 232, 150, { fill: '#000', opacity: 0.25, r: 8, filter: 'url(#fBlur2)' });
    rect(B, bx, by, 226, 144, { fill: 'url(#gBluePanel)', stroke: '#162d73', sw: 1, r: 6 });
    txt(B, bx + 190, by + 136, 'PHYWE 06030.23  max. 50V~/25V–/10A', { size: 3.6, fill: '#d8e2ff' });
    const cols = 4, rows = 3, sx = 52, sy = 40;
    const sockAt = (r, c) => ({ x: bx + 34 + c * sx, y: by + 26 + r * sy });
    for (let c = 0; c < cols; c++) {
      const a = sockAt(0, c), b = sockAt(rows - 1, c);
      rect(B, a.x - 3, a.y, 6, b.y - a.y, { fill: '#f4f6fb' });
      rect(B, a.x - 9, a.y - 2, 18, 4, { fill: '#f4f6fb' }); rect(B, b.x - 9, b.y - 2, 18, 4, { fill: '#f4f6fb' });
    }
    const boardSock = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const p = sockAt(r, c);
      const s = new Socket(bench, B, { x: p.x, y: p.y, id: `bd.${r}${c}`, color: 'black', name: `Board socket row ${r + 1}, column ${c + 1}` });
      boardSock.push(s);
      if (r > 0) wires.link(`bd.${r}${c}`, `bd.0${c}`);
      // click while holding a component -> plug it in
      s.el.addEventListener('click', (e) => { if (S.held) { e.stopImmediatePropagation(); placeHeld(r, c); } }, true);
    }
    const compLayer = g(Lyr.front);
    // ---------------- coil (PHYWE, 24 mH)
    const coil = g(Lyr.inst);
    rect(coil, 1000, 560, 110, 110, { fill: '#9aa3ab', stroke: '#5f676e', sw: 1, r: 6 });
    rect(coil, 1012, 590, 86, 70, { fill: '#e48a1c', stroke: '#9b5a0d', sw: 1, r: 4 });
    for (let i = 0; i < 12; i++) line(coil, 1014, 594 + i * 5.5, 1096, 594 + i * 5.5, { stroke: '#b86b10', sw: 0.6 });
    rect(coil, 1020, 562, 70, 24, { fill: '#bfc6cc', stroke: '#777', sw: 0.6, r: 2 });
    txt(coil, 1055, 575, 'Coil  24 mH', { size: 4.4, weight: 700 });
    rect(coil, 1028, 640, 54, 14, { fill: '#fff', stroke: '#999', sw: 0.5 }); txt(coil, 1055, 647, 'Setup – A', { size: 4 });
    new Socket(bench, coil, { x: 1030, y: 548, id: 'coil.a', color: 'red', name: 'Coil socket 1' });
    new Socket(bench, coil, { x: 1080, y: 548, id: 'coil.b', color: 'blue', name: 'Coil socket 2' });
    rect(coil, 1018, 540, 74, 16, { fill: '#8a9299', r: 3 });
    coil.lastChild.parentNode.insertBefore(coil.lastChild, coil.children[0]);
    // ---------------- component box
    const BOX = g(Lyr.table);
    rect(BOX, 1160, 640, 300, 170, { fill: 'rgba(235,240,245,0.5)', stroke: '#aab4bd', sw: 1.4, r: 8 });
    txt(BOX, 1310, 652, 'Component box', { size: 4.4, fill: '#567' });
    const slotsInBox = new Map();
    COMPS.forEach((cp, i) => {
      const x = 1180 + (i % 4) * 70, y = 670 + Math.floor(i / 4) * 66;
      const G = g(BOX);
      drawComp(G, x, y, cp);
      slotsInBox.set(cp.id, G);
      bench.interactive(G, { tip: () => `<b>${cp.kind === 'B' ? 'Connector bridge' : cp.label + ' ' + (cp.sub || 'resistor')}</b><br><span class="tip-hint">click to pick up, then click a board socket</span>`, click: () => pickUp(cp) });
    });
    function drawComp(G, x, y, cp) {
      rect(G, x, y, 50, 30, { fill: 'rgba(240,246,252,0.88)', stroke: '#8aa0b4', sw: 1, r: 3 });
      rect(G, x + 4, y + 22, 42, 4, { fill: '#c5ced6' });
      circ(G, x + 6, y + 15, 2, { fill: '#999' }); circ(G, x + 44, y + 15, 2, { fill: '#999' });
      if (cp.kind === 'R') { rect(G, x + 15, y + 11, 20, 8, { fill: 'none', stroke: '#222', sw: 1 }); line(G, x + 6, y + 15, x + 15, y + 15, { stroke: '#222', sw: 1 }); line(G, x + 35, y + 15, x + 44, y + 15, { stroke: '#222', sw: 1 }); }
      else if (cp.kind === 'C') { line(G, x + 6, y + 15, x + 22, y + 15, { stroke: '#222', sw: 1 }); line(G, x + 28, y + 15, x + 44, y + 15, { stroke: '#222', sw: 1 }); line(G, x + 22, y + 8, x + 22, y + 22, { stroke: '#222', sw: 1.6 }); line(G, x + 28, y + 8, x + 28, y + 22, { stroke: '#222', sw: 1.6 }); }
      else { line(G, x + 6, y + 15, x + 44, y + 15, { stroke: '#222', sw: 1.6 }); }
      txt(G, x + 25, y + 5.5, cp.label, { size: 4.4, weight: 800 });
    }
    function pickUp(cp) {
      if ([...S.placed.values()].some(p => p.cp === cp)) return;
      S.held = cp;
      ui.hint(`Holding <b>${cp.label}</b> — click the board socket where its left pin should go (Esc to cancel).`);
    }
    window.addEventListener('keydown', escH);
    function escH(e) { if (e.key === 'Escape' && S.held) { S.held = null; ui.hint(''); } }
    bench.onBgClick(() => { if (S.held) { S.held = null; ui.hint(''); } });
    function occupied(r, c) { for (const p of S.placed.values()) if (p.r === r && (p.c === c || p.c + 1 === c)) return true; return false; }
    function placeHeld(r, c) {
      const cp = S.held;
      if (c >= cols - 1) { ui.toast('A plug-in block spans two neighbouring sockets — choose a socket with a free neighbour to its right.', 'warn'); return; }
      if (occupied(r, c) || occupied(r, c + 1)) { ui.toast('Those sockets already hold a component.', 'warn'); return; }
      S.held = null; ui.hint('');
      const G = g(compLayer);
      const p = sockAt(r, c);
      const W = sx + 10;
      rect(G, p.x - 5, p.y - 14, W, 28, { fill: 'rgba(240,246,252,0.92)', stroke: '#8aa0b4', sw: 1, r: 3, filter: 'url(#fShadowS)' });
      const cx = p.x + sx / 2;
      if (cp.kind === 'R') { rect(G, cx - 10, p.y - 4, 20, 8, { fill: 'none', stroke: '#222', sw: 1 }); line(G, p.x, p.y, cx - 10, p.y, { stroke: '#222', sw: 1 }); line(G, cx + 10, p.y, p.x + sx, p.y, { stroke: '#222', sw: 1 }); }
      else if (cp.kind === 'C') { line(G, p.x, p.y, cx - 3, p.y, { stroke: '#222', sw: 1 }); line(G, cx + 3, p.y, p.x + sx, p.y, { stroke: '#222', sw: 1 }); line(G, cx - 3, p.y - 7, cx - 3, p.y + 7, { stroke: '#222', sw: 1.6 }); line(G, cx + 3, p.y - 7, cx + 3, p.y + 7, { stroke: '#222', sw: 1.6 }); }
      else line(G, p.x, p.y, p.x + sx, p.y, { stroke: '#222', sw: 1.6 });
      circ(G, p.x, p.y, 2.4, { fill: '#888' }); circ(G, p.x + sx, p.y, 2.4, { fill: '#888' });
      txt(G, cx, p.y - 9, cp.label, { size: 4.4, weight: 800 });
      const key = `${r}${c}`;
      S.placed.set(key, { cp, r, c, G });
      slotsInBox.get(cp.id).setAttribute('opacity', 0.15);
      bench.interactive(G, { tip: `<b>${cp.label}</b> on the board`, title: cp.label, menu: () => [{ label: 'Pull it out (back to the box)', fn: () => { G.remove(); S.placed.delete(key); slotsInBox.get(cp.id).setAttribute('opacity', 1); recompute(); } }] });
      recompute();
    }

    // ---------------- circuit solution
    let sol = null;
    function netlist(omega, withSource = true) {
      const els = [];
      const n = (id) => wires.net(id);
      if (withSource) els.push({ a: n('fg.hi'), b: n('fg.lo'), z: [fg.zout, 0], src: [fg.vrmsOpen, 0], tag: 'fg' });
      else els.push({ a: n('fg.hi'), b: n('fg.lo'), z: [fg.zout, 0], tag: 'fg' });
      for (const p of S.placed.values()) {
        const a = n(`bd.${p.r}${p.c}`), b = n(`bd.${p.r}${p.c + 1}`);
        let z;
        if (p.cp.kind === 'C') z = omega > 0 ? [0, -1 / (omega * P.C)] : [1e12, 0];
        else z = [p.cp.val, 0];
        els.push({ a, b, z, tag: p.cp.kind, cp: p.cp });
      }
      els.push({ a: n('coil.a'), b: n('coil.b'), z: [P.RL, omega * P.L], tag: 'L' });
      for (const m of [m1, m2]) {
        els.push({ a: n(m.id + '.ma'), b: n(m.id + '.com'), z: [m.fuse ? 1.0 : 1e12, 0], tag: m.id + '.ma' });
        els.push({ a: n(m.id + '.a20'), b: n(m.id + '.com'), z: [0.01, 0], tag: m.id + '.a20' });
        els.push({ a: n(m.id + '.v'), b: n(m.id + '.com'), z: [1e7, 0], tag: m.id + '.v' });
      }
      const nets = new Set(); els.forEach(e => { nets.add(e.a); nets.add(e.b); });
      return { els, nets: [...nets], gnd: n('fg.lo') };
    }
    function recompute() {
      const w = 2 * Math.PI * fg.freq;
      const { els, nets, gnd } = netlist(w);
      const s = solveAC(nets, gnd, els);
      const cur = {};
      els.forEach(e => { cur[e.tag] = C.abs(s.cur(e)); });
      sol = { s, els, cur, v: (a, b) => C.abs(C.sub(s.v(wires.net(a)), s.v(wires.net(b)))) };
      // track resistors used while current flows through the ammeter
      for (const e of els) if (e.tag === 'R' && cur.R > 1e-4 && (cur['m1.ma'] > 1e-4 || cur['m2.ma'] > 1e-4)) S.rUsed.add(e.cp.val);
    }
    wires.onChange(recompute); fg.onChange(recompute);
    recompute();
    const meterSrc = (m) => () => {
      if (!sol) recompute();
      const fgOn = fg.on && fg.vrmsOpen > 0;
      const iMa = sol.cur[m.id + '.ma'] ?? 0, iA = sol.cur[m.id + '.a20'] ?? 0, v = sol.v(m.id + '.v', m.id + '.com');
      let R = Infinity;
      if (!fgOn) {
        // ohmmeter: inject 1 mA DC between V and COM with everything unpowered
        const { els, nets } = netlist(0, false);
        const gnd = wires.net(m.id + '.com');
        els.push({ a: wires.net(m.id + '.v'), b: gnd, z: [1e12, 0], isrc: [1e-3, 0] });
        const st = solveAC(nets.concat([gnd]), gnd, els.filter(e => e.tag !== m.id + '.v'));
        R = C.abs(st.v(wires.net(m.id + '.v'))) / 1e-3;
        if (R > 1e9) R = Infinity;
      } else R = null;
      return { V: { dc: 0, ac: v }, mA: { dc: 0, ac: iMa }, A20: { dc: 0, ac: iA }, R, Hz: v > 0.05 ? fg.freq : 0 };
    };
    m1.source = meterSrc(m1); m2.source = meterSrc(m2);
    let acc = 0;
    bench.addUpdater((dt) => { acc += dt; if (acc > 0.3) { acc = 0; recompute(); } });

    function seriesOK() {
      const w = 2 * Math.PI * 1000;
      const { els, nets, gnd } = netlist(w);
      // replace generator by 1 V to test topology
      els[0].src = [1, 0];
      const s = solveAC(nets, gnd, els);
      const I = (tag) => { const e = els.find(x => x.tag === tag); return e ? C.abs(s.cur(e)) : 0; };
      const ifg = I('fg');
      if (ifg < 1e-5) return { ok: false, msg: 'There is no complete loop through the function generator yet.' };
      const hasC = els.some(e => e.tag === 'C' && C.abs(s.cur(e)) > ifg * 0.98);
      const hasR = els.some(e => e.tag === 'R' && C.abs(s.cur(e)) > ifg * 0.98);
      const hasL = I('L') > ifg * 0.98;
      const am = ['m1', 'm2'].find(m => I(m + '.ma') > ifg * 0.98);
      const shortAm = ['m1', 'm2'].find(m => { const v = C.abs(C.sub(s.v(wires.net(m + '.ma')), s.v(wires.net(m + '.com')))); return false; });
      const missing = [!hasC && 'the capacitor', !hasR && 'a resistor', !hasL && 'the inductor (coil)', !am && 'the milliammeter (mA and COM jacks)'].filter(Boolean);
      if (missing.length) return { ok: false, msg: `Not a single series loop yet: ${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} not carrying the full circuit current.` };
      const m = am === 'm1' ? m1 : m2;
      const pos = m.pos;
      const extra = pos.k !== 'mA' ? ` Set ${am === 'm1' ? 'multimeter 1' : 'multimeter 2'} to a current (mA) range before switching on.` : (!m.ac ? ' Remember to press AC/DC for a.c. current.' : '');
      return { ok: true, msg: 'Circuit is correct: L, C, R and the milliammeter are in series with the generator.' + extra };
    }
    const checkCircuit = () => { const r = seriesOK(); if (r.ok) S.checked = true; return r; };

    const steps = [
      { t: 'Plug the 1 µF capacitor and a resistor on the board.', done: () => [...S.placed.values()].some(p => p.cp.kind === 'C') && [...S.placed.values()].some(p => p.cp.kind === 'R') },
      { t: 'Connect generator, C, R, coil and the milliammeter (mA, COM) in series with patch cords.', done: () => seriesOK().ok },
      { t: 'Set the milliammeter to a.c. current on a suitable range.', done: () => [m1, m2].some(m => m.on && m.pos.k === 'mA' && m.ac) },
      { t: 'Ask the instructor to check the circuit.', done: () => S.checked },
      { t: 'Switch on the generator, select SINE and set about 5 V output.', done: () => fg.on && fg.wave === 0 && fg.vrmsOpen > 3.5 },
      { t: 'Vary the frequency in steps (closer near resonance) and record the current.' },
      { t: 'Repeat for at least three resistor values.', done: () => S.rUsed.size >= 3 },
      { t: 'Switch off the generator and take the circuit apart.', done: () => !fg.on && S.placed.size === 0 && S.rUsed.size > 0 },
    ];
    const views = [
      { name: 'Whole bench', x: 250, y: 330, w: 1250, h: 560 },
      { name: 'Generator', x: 290, y: 395, w: 260, h: 140 },
      { name: 'Multimeters', x: 300, y: 600, w: 260, h: 260 },
      { name: 'Board & coil', x: 680, y: 520, w: 460, h: 260 },
      { name: 'Components', x: 1150, y: 630, w: 320, h: 190 },
    ];
    return { steps, views, checkCircuit, destroy: () => window.removeEventListener('keydown', escH), debug: { fg, m1, m2, S, P, placeHeld, pickUp, recompute, sol: () => sol, seriesOK, COMPS } };
  },
};
