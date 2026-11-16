// Experiment: B-H loop with the Universal B-H Curve Tracer (Mittal) and SM203G oscilloscope
import { g, txt, rect, circ, line, path, poly, clamp, gauss } from '../core/svg.js';
import { Knob, Rocker, Socket } from '../core/controls.js';
import { cabinet, CRO } from '../core/instruments.js';

const ICON = `<svg viewBox="0 0 200 100"><rect x="10" y="22" width="90" height="62" rx="4" fill="#ecebe6" stroke="#999"/><rect x="16" y="28" width="46" height="40" fill="#1d3a50"/><path d="M22 60 C35 30 50 30 56 34 M56 34 C45 58 30 58 22 60" stroke="#9effc6" fill="none" stroke-width="2"/><rect x="110" y="40" width="70" height="44" rx="3" fill="#ecebe6" stroke="#999"/><rect x="110" y="40" width="70" height="8" fill="#3b2b22"/></svg>`;
const SAMPLES = {
  nail: { name: '5" iron nail', Bs: 340, Hc: 520, a: 600 },
  stamp: { name: 'Transformer stamping', Bs: 400, Hc: 160, a: 300 },
  ferrite: { name: 'Ferrite rod', Bs: 210, Hc: 85, a: 260 },
};

export default {
  id: 'bhcurve', title: 'B-H Curve (Hysteresis)', subtitle: 'Energy loss in ferromagnetic materials',
  blurb: 'Universal B-H Curve Tracer with magnetising coil + IC (Hall) probe, traced on the Scientific SM203G CRO in X-Y mode.',
  icon: ICON,
  manual: {
    aim: 'To find the energy loss in ferromagnetic materials by tracing their hysteresis (B-H) loops with a Universal B-H Curve Tracer and an oscilloscope.',
    apparatus: ['Universal B-H Curve Tracer main unit: a.c. supply V1 (6 V), V2 (9 V), V3 (12 V), C, resistor R with potentiometer P, I.C. socket, X and Y outputs', 'Coil unit: magnetising coil (N = 300, L = 0.0323 m) with IC probe', 'Specimens: 5" nail, transformer stamping, ferrite rod', 'Scientific SM203G 30 MHz oscilloscope, BNC cables, tracing (butter) paper and graph paper'],
    formula: `<p>H = N·V<sub>X</sub> / (R·L)</p><p>Energy loss = 0.5 × (N / (R·L)) × S<sub>V</sub> × S<sub>H</sub> × (area of loop)</p><p>N = 300, L = 0.033 m, R = 55 Ω; S<sub>V</sub>, S<sub>H</sub> in V/cm; area in cm²</p>`,
    procedure: [
      'Connect one lead of the magnetising coil to C and the other to V1 (6 V). Connect X to the horizontal (CH II, X) and Y to the vertical (CH I, Y) input of the CRO.',
      'Connect the IC probe to the I.C. socket.',
      'Switch the kit on and turn P to its maximum.',
      'With no specimen in the coil, put the CRO in X-Y mode and adjust the horizontal gain for a convenient X deflection.',
      'Insert a specimen through the coil so that it touches the IC at the centre. Adjust the Y gain until the loop fills the screen. If the loop is back to front, reverse the coil connection.',
      'Change the supply to V2 (9 V) and V3 (12 V) and watch the saturation part change.',
      'Trace each loop on butter paper and count the mm squares to get its area; repeat for each specimen.',
    ],
    precautions: ['The specimen must touch the IC at the centre without shorting PCB tracks.', 'Keep units consistent: area in cm² with S<sub>V</sub>, S<sub>H</sub> in V/cm.', 'Make sure the correct signals go to the X and Y inputs.'],
    controls: ['Coil leads: click the red plug, then a socket. BNC cords: click a BNC on the tracer then one on the CRO.', 'Click a specimen to insert it. Click <i>look closely</i> on the CRO for a magnified screen with tracing paper.'],
    link: 'https://drive.google.com/file/d/1AQ_8pMoqdKtadVcRoU0JFFNcdayUIP9h/view',
  },
  tables: [
    { id: 'fix', title: 'Fixed apparatus parameters', fields: [{ id: 'N', label: 'Number of coil turns N' }, { id: 'L', label: 'Coil length L (m)' }, { id: 'R', label: 'Resistance R (Ω)' }], cols: [{ id: 'x', label: 'Remarks' }], rows: 1 },
    { id: 'obs', title: 'Observation table', cols: [{ id: 's', label: 'Specimen' }, { id: 'V', label: 'Input potential (V)' }, { id: 'Sv', label: 'Vertical sensitivity S<sub>V</sub> (V/cm)' }, { id: 'Sh', label: 'Horizontal sensitivity S<sub>H</sub> (V/cm)' }, { id: 'A', label: 'Area of curve (cm²)' }, { id: 'E', label: 'Energy loss (J/cycle/unit vol)' }], rows: 9 },
  ],

  build(ctx) {
    const { bench, wires, ui, rand } = ctx;
    const L = bench.layers;
    const S = { on: false, sample: null, probeTilt: 0.92 + rand() * 0.08 };
    const Rser = 55, Ncoil = 300, Lcoil = 0.0323, sens = 5e-3; // V per gauss

    // ---------------- CRO
    const cro = new CRO(ctx, L.inst, 150, 420, { id: 'cro' });
    // ---------------- B-H tracer main unit
    const T = cabinet(L.inst, 560, 470, 300, 140, { depth: 24, fill: '#e6e1d6', face: '#ece8de' });
    rect(T, 3, 3, 294, 16, { fill: '#3b2b22' });
    txt(T, 150, 11.5, 'UNIVERSAL B-H CURVE TRACER', { size: 8.4, fill: '#f2efe6', weight: 800, ls: 0.6 });
    rect(T, 14, 26, 96, 56, { fill: '#e4e7ee', stroke: '#888', sw: 0.8, r: 4 });
    txt(T, 30, 33, 'V1(6V)', { size: 4.2, weight: 700 }); txt(T, 82, 33, 'V2(9V)', { size: 4.2, weight: 700 });
    new Socket(bench, T, { x: 30, y: 44, id: 'bh.v1', color: 'red', name: 'V1 (6 V a.c.)', scale: 1.3 });
    new Socket(bench, T, { x: 82, y: 44, id: 'bh.v2', color: 'red', name: 'V2 (9 V a.c.)', scale: 1.3 });
    new Socket(bench, T, { x: 82, y: 66, id: 'bh.v3', color: 'red', name: 'V3 (12 V a.c.)', scale: 1.3 });
    txt(T, 56, 55, 'V A.C.', { size: 3.2 }); txt(T, 82, 76, 'V3(12V)', { size: 3.8, weight: 700 });
    new Socket(bench, T, { x: 30, y: 66, id: 'bh.c', color: 'black', name: 'C (common)', scale: 1.3 });
    txt(T, 18, 66, 'C', { size: 4.4, weight: 800 });
    const sw = new Rocker(bench, T, { x: 30, y: 98, w: 10, h: 13, name: 'B-H tracer mains', color: '#d32f2f', lit: '#ff5040', onChange: v => { S.on = v; } });
    txt(T, 30, 110, 'ON', { size: 3.4 });
    rect(T, 58, 86, 40, 40, { fill: '#e4e7ee', stroke: '#888', sw: 0.8, r: 4 });
    txt(T, 78, 92, 'I.C.', { size: 4.6, weight: 800 });
    new Socket(bench, T, { x: 78, y: 110, id: 'bh.ic', kind: 'din', name: 'I.C. probe socket' });
    txt(T, 150, 34, 'P', { size: 7, weight: 800 });
    path(T, 'M128,46 A26,26 0 0 1 172,46', { stroke: '#222', sw: 0.8 });
    const pKnob = new Knob(bench, T, { x: 150, y: 62, r: 12, style: 'blackcap', value: 0.35, name: 'P (series resistance) — set to maximum', wheel: 0.01 });
    txt(T, 150, 96, 'R = 55 Ω (P at max.)', { size: 3.8, fill: '#444' });
    rect(T, 222, 26, 62, 66, { fill: '#e4e7ee', stroke: '#888', sw: 0.8, r: 4 });
    txt(T, 270, 38, 'Y', { size: 5, weight: 800 }); txt(T, 270, 70, 'X', { size: 5, weight: 800 }); txt(T, 240, 54, 'C.R.O.', { size: 4.4, weight: 700 });
    new Socket(bench, T, { x: 252, y: 38, id: 'bh.y', kind: 'bnc', name: 'Y output (B signal)', scale: 1.1 });
    new Socket(bench, T, { x: 252, y: 70, id: 'bh.x', kind: 'bnc', name: 'X output (H signal)', scale: 1.1 });
    circ(T, 216, 112, 4, { fill: '#c0392b' }); txt(T, 222, 108, 'MITTAL ENTERPRISES', { size: 3.4, anchor: 'start', weight: 800 }); txt(T, 222, 113, '2151/T-7C, New Patel Nagar, New Delhi', { size: 2.6, anchor: 'start' });
    // PeakTech pouch on top (decor)
    rect(L.inst, 610, 432, 150, 30, { fill: '#1c1c1c', r: 8 }); txt(L.inst, 685, 447, 'PeakTech®', { size: 10, fill: '#fff', weight: 800, italic: true });

    // ---------------- coil unit (acrylic)
    const CU = g(L.inst);
    const ux = 1010, uy = 440;
    poly(CU, [[ux - 50, uy + 210], [ux + 130, uy + 210], [ux + 110, uy + 186], [ux - 30, uy + 186]], { fill: 'rgba(220,235,245,0.45)', stroke: '#9fb4c3', sw: 1 });
    rect(CU, ux, uy, 80, 190, { fill: 'rgba(220,235,245,0.35)', stroke: '#9fb4c3', sw: 1.4, r: 2 });
    rect(CU, ux, uy + 60, 80, 3, { fill: 'rgba(200,220,235,0.8)' }); rect(CU, ux, uy + 130, 80, 3, { fill: 'rgba(200,220,235,0.8)' });
    rect(CU, ux + 18, uy + 66, 44, 62, { fill: '#3e342c', stroke: '#1e1813', sw: 1, r: 2 });
    circ(CU, ux + 40, uy + 78, 7, { fill: 'rgba(230,240,250,0.8)', stroke: '#999', sw: 0.8 });
    circ(CU, ux + 40, uy + 116, 7, { fill: 'rgba(230,240,250,0.8)', stroke: '#999', sw: 0.8 });
    rect(CU, ux + 8, uy + 86, 64, 9, { fill: '#2f53c4', r: 1 }); txt(CU, ux + 40, uy + 90.5, 'SAMPLE', { size: 5, fill: '#fff', weight: 700 });
    rect(CU, ux + 8, uy + 97, 64, 9, { fill: '#2f53c4', r: 1 }); txt(CU, ux + 40, uy + 101.5, 'MAG. COIL', { size: 5, fill: '#fff', weight: 700 });
    rect(CU, ux + 14, uy + 140, 52, 36, { fill: '#2f8f4a', stroke: '#1d5a2e', sw: 0.8 });
    rect(CU, ux + 26, uy + 160, 28, 9, { fill: '#2f53c4', r: 1 }); txt(CU, ux + 40, uy + 164.5, 'I.C.', { size: 5, fill: '#fff', weight: 700 });
    rect(CU, ux + 36, uy + 142, 8, 6, { fill: '#111' });
    txt(CU, ux + 40, uy + 30, 'N = 300 turns', { size: 4.2, fill: '#234' }); txt(CU, ux + 40, uy + 38, 'L = 0.0323 m', { size: 4.2, fill: '#234' });
    const sampleG = g(CU);
    bench.interactive(CU, { tip: '<b>Coil unit</b> (magnetising coil + IC probe)', title: 'Coil unit', menu: () => sampleMenu() });
    // leads
    wires.addLead({ id: 'coil.A', name: 'Coil lead A (red)', color: 'red', anchor: () => ({ x: ux + 30, y: uy + 64 }), rest: { x: 960, y: 700 }, restAngle: -20 });
    wires.addLead({ id: 'coil.B', name: 'Coil lead B (red)', color: 'red', anchor: () => ({ x: ux + 50, y: uy + 64 }), rest: { x: 985, y: 712 }, restAngle: -10 });
    wires.addLead({ id: 'ic', name: 'IC probe cable', kind: 'din', color: '#222', cable: '#2b2b2b', anchor: () => ({ x: ux + 40, y: uy + 190 }), rest: { x: 920, y: 760 }, restAngle: 30, width: 3 });
    // ---------------- specimens on the bench
    const SP = g(L.table);
    const specs = {
      nail: (G, x, y) => { rect(G, x, y, 127, 5, { fill: 'url(#gChrome)', stroke: '#666', sw: 0.5 }); rect(G, x - 3, y - 3, 4, 11, { fill: '#999' }); poly(G, [[x + 127, y], [x + 136, y + 2.5], [x + 127, y + 5]], { fill: '#aaa' }); },
      stamp: (G, x, y) => { rect(G, x, y - 4, 110, 12, { fill: '#6e737a', stroke: '#444', sw: 0.6 }); for (let i = 0; i < 5; i++) line(G, x, y - 3 + i * 2.4, x + 110, y - 3 + i * 2.4, { stroke: '#8b9097', sw: 0.4 }); },
      ferrite: (G, x, y) => { rect(G, x, y - 2, 100, 9, { fill: '#2a2a2a', stroke: '#000', sw: 0.6, r: 4 }); },
    };
    const restPos = { nail: [1150, 720], stamp: [1150, 760], ferrite: [1150, 800] };
    const specG = {};
    Object.keys(specs).forEach(k => {
      const G = g(SP); specG[k] = G;
      specs[k](G, ...restPos[k]);
      txt(G, restPos[k][0] + 160, restPos[k][1] + 2, SAMPLES[k].name, { size: 4.4, fill: '#333', anchor: 'start' });
      bench.interactive(G, { tip: `<b>${SAMPLES[k].name}</b><br><span class="tip-hint">click to insert / remove</span>`, title: SAMPLES[k].name, menu: () => [S.sample === k ? { label: 'Take it out of the coil', fn: () => setSample(null) } : { label: 'Insert through the coil so it touches the IC', fn: () => setSample(k) }] });
    });
    function sampleMenu() {
      return Object.keys(SAMPLES).map(k => S.sample === k ? { label: `Take the ${SAMPLES[k].name} out`, fn: () => setSample(null) } : { label: `Insert the ${SAMPLES[k].name}`, fn: () => setSample(k) });
    }
    function setSample(k) {
      S.sample = k;
      Object.keys(specG).forEach(n => specG[n].setAttribute('opacity', n === k ? 0.15 : 1));
      sampleG.innerHTML = '';
      if (k) {
        // vertical specimen through the coil down to the IC
        const x = ux + 40;
        if (k === 'nail') { rect(sampleG, x - 2.5, uy - 20, 5, 162, { fill: 'url(#gChromeH)', stroke: '#666', sw: 0.4 }); rect(sampleG, x - 6, uy - 24, 12, 4, { fill: '#999' }); }
        if (k === 'stamp') rect(sampleG, x - 6, uy - 10, 12, 152, { fill: '#6e737a', stroke: '#444', sw: 0.6 });
        if (k === 'ferrite') rect(sampleG, x - 4.5, uy + 0, 9, 142, { fill: '#2a2a2a', stroke: '#000', sw: 0.6, r: 4 });
      }
      cro.dirty = true;
    }

    // ---------------- signals
    const pot = { 'bh.c': 0, 'bh.v1': 6, 'bh.v2': 9, 'bh.v3': 12 };
    let cfg = null;
    function config() {
      const a = wires.leadSocket('coil.A'), b = wires.leadSocket('coil.B');
      const ic = wires.leadSocket('ic') === 'bh.ic';
      const Vab = (a in pot && b in pot) ? pot[a] - pot[b] : 0;
      const viaC = a === 'bh.c' ? -1 : b === 'bh.c' ? 1 : 0; // sign of current into C relative to I_AB
      const route = (sock) => { for (const out of ['bh.x', 'bh.y']) if (wires.connected(sock, out)) return out; return null; };
      cfg = { Vab, viaC, ic, ch1: route('cro.ch1'), ch2: route('cro.ch2') };
      cro.dirty = true;
    }
    wires.onChange(config); config();
    const Bof = (H, dir) => {
      const smp = S.sample ? SAMPLES[S.sample] : null;
      const air = 1.2566e-6 * H * 1e4 * 0.9;
      if (!smp) return air;
      const Hm = cfg._Hm || 1;
      const { Bs, Hc, a } = smp;
      const up = Math.tanh((H - Hc) / a), dn = Math.tanh((H + Hc) / a);
      const cor = (Math.tanh((Hm + Hc) / a) - Math.tanh((Hm - Hc) / a)) / 2;
      const B = dir > 0 ? Bs * (up + cor) : Bs * (dn - cor);
      return B * S.probeTilt + air;
    };
    cro.period = 0.02;
    cro.input = (t) => {
      if (!S.on || !cfg) return { ch1: null, ch2: null };
      const w = 2 * Math.PI * 50;
      const Ipk = Math.SQRT2 * cfg.Vab / (Rser + 3);
      const I = Ipk * Math.sin(w * t);
      const H = Ncoil * I / Lcoil;
      cfg._Hm = Math.abs(Ncoil * Ipk / Lcoil);
      const dir = Math.cos(w * t) * Math.sign(Ipk || 1);
      const X = cfg.viaC * I * Rser * (0.2 + 0.8 * pKnob.value);
      const Y = cfg.ic ? sens * Bof(H, dir >= 0 ? 1 : -1) + gauss() * 0.002 : gauss() * 0.0005;
      const sig = { 'bh.x': X + gauss() * 0.004, 'bh.y': Y };
      return { ch1: cfg.ch1 ? sig[cfg.ch1] : null, ch2: cfg.ch2 ? sig[cfg.ch2] : null };
    };
    bench.addUpdater(() => { cro.dirty = true; });

    const xDiv = () => { const Ipk = Math.SQRT2 * Math.abs(cfg.Vab) / (Rser + 3); return Ipk * Rser * (0.2 + 0.8 * pKnob.value) / cro.vdiv2.value; };
    const steps = [
      { t: 'Connect the coil leads to C and V1 (6 V).', done: () => { const a = wires.leadSocket('coil.A'), b = wires.leadSocket('coil.B'); return (a === 'bh.c' && b === 'bh.v1') || (a === 'bh.v1' && b === 'bh.c'); } },
      { t: 'Connect the IC probe to the I.C. socket.', done: () => cfg.ic },
      { t: 'Connect X to CRO CH II (X) and Y to CRO CH I (Y) with BNC cables.', done: () => cfg.ch1 === 'bh.y' && cfg.ch2 === 'bh.x' },
      { t: 'Switch on the tracer and turn P to maximum.', done: () => S.on && pKnob.value > 0.98 },
      { t: 'CRO on, X-Y mode; with no specimen adjust the horizontal gain for a convenient X deflection.', done: () => cro.on && cro.xy.value && xDiv() > 2 && xDiv() < 5 },
      { t: 'Insert a specimen touching the IC and set the Y gain so the loop fills the screen.', done: () => S.sample && cro.on && cro.xy.value && (() => { const b = SAMPLES[S.sample].Bs * sens * S.probeTilt / cro.vdiv1.value; return b > 1.5 && b < 4.2; })() },
      { t: 'Loop the right way round (B rises with H). If not, reverse the coil leads.', done: () => S.sample && cfg.viaC * Math.sign(cfg.Vab) > 0 && cfg.ch1 === 'bh.y' },
      { t: 'Record S<sub>V</sub>, S<sub>H</sub> and trace the loop for 6, 9 and 12 V for each specimen; count the mm squares for the area.' },
    ];
    const views = [
      { name: 'Whole bench', x: 100, y: 330, w: 1400, h: 560 },
      { name: 'Oscilloscope', x: 140, y: 390, w: 330, h: 210 },
      { name: 'Tracer', x: 550, y: 430, w: 330, h: 200 },
      { name: 'Coil unit', x: 900, y: 400, w: 420, h: 420 },
    ];
    return { steps, views, debug: { cro, S, pKnob, sw, setSample, cfg: () => cfg } };
  },
};
