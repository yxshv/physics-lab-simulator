// Experiment: Franck-Hertz (argon tetrode, SES FH-3001) — manual readings and CRO auto mode
import { g, txt, rect, circ, line, path, poly, dial, arcArrow, clamp, gauss } from '../core/svg.js';
import { Knob, Toggle, Selector3, Display7, Socket } from '../core/controls.js';
import { cabinet, sesLogo, sesName, CRO } from '../core/instruments.js';

const ICON = `<svg viewBox="0 0 200 100"><rect x="20" y="40" width="160" height="50" rx="4" fill="#ecebe6" stroke="#999"/><rect x="30" y="50" width="34" height="16" fill="#1b0605"/><rect x="136" y="50" width="34" height="16" fill="#1b0605"/><rect x="40" y="10" width="40" height="32" rx="8" fill="#f2f2ee" stroke="#aaa"/><rect x="54" y="16" width="12" height="22" rx="3" fill="#bcd"/></svg>`;
const MULT = [1e-7, 1e-8, 1e-9];
const MULT_L = ['10⁻⁷', '10⁻⁸', '10⁻⁹'];

export default {
  id: 'franckhertz', title: 'Franck-Hertz Experiment', subtitle: 'First excitation potential of argon',
  blurb: 'SES FH-3001 with argon-filled tetrode: manual V<sub>G2K</sub>–current readings and automatic display on the SM203G CRO.',
  icon: ICON,
  manual: {
    aim: 'To verify the existence of discrete atomic energy levels of argon and determine its minimum (first) excitation energy.',
    apparatus: ['Franck-Hertz set-up FH-3001 with argon-filled tetrode', 'Filament supply 2.6–3.4 V; grid supplies V<sub>G1K</sub> 1.3–5 V, V<sub>G2A</sub> 1.3–12 V, V<sub>G2K</sub> 0–85 V', 'Multi-range current meter (×10⁻⁷, ×10⁻⁸, ×10⁻⁹ A)', 'Scientific SM203G 30 MHz oscilloscope (X-Y mode)'],
    formula: '<p>E = e × ΔV, where ΔV is the average spacing between successive current maxima (V<sub>G2K</sub>)</p><p>Auto mode: ΔV = (peak spacing in divisions) × (X sensitivity in V/div)</p>',
    procedure: [
      'Before switching on: all knobs at minimum, multiplier at 10⁻⁷, Manual/Auto at Manual, scanning knob at minimum.',
      'Switch on. Select V<sub>G1K</sub> on the voltage display and set 1.5 V; select V<sub>G2A</sub> and set 7.5 V.',
      'Keep the filament at about 2.6 V and let it stabilise for 2–3 minutes.',
      'Select V<sub>G2K</sub> and increase it slowly: the plate current shows maxima and minima. Adjust the filament / multiplier for a suitable size.',
      'Take readings of V<sub>G2K</sub> and plate current from 0 to 80 V (smaller steps near maxima and minima).',
      'Auto mode: connect Y, GND and X to the CRO, set Manual/Auto to Auto, CRO in X-Y mode, turn the scanning knob to maximum and adjust gains. Measure the peak spacing.',
      'Bring every knob back to minimum, Manual mode, before switching off.',
    ],
    precautions: ['Above 60 V in manual mode watch the current; if it rises suddenly, reduce the voltage at once (ionisation can damage the tube).', 'After changing the filament voltage wait 2–3 minutes.', 'Keep all knobs at minimum and Manual mode when switching on or off.'],
    controls: ['V<sub>G2K</sub> knob: scroll for 0.1 V steps (Shift = finer). The voltage display shows the quantity selected with the slide switch.', 'For auto mode, patch Y → CRO CH I, X → CRO CH II and GND → CRO ground jack.'],
    link: 'https://drive.google.com/file/d/1RkOIJmqQDrhBAYTtFSSWDYvKmcPcHo5z/view',
  },
  tables: [
    { id: 'man', title: 'Manual mode: accelerating voltage vs current', fields: [{ id: 'vg1', label: 'V<sub>G1K</sub> (V)' }, { id: 'vg2a', label: 'V<sub>G2A</sub> (V)' }, { id: 'fil', label: 'Filament setting' }, { id: 'mult', label: 'Current multiplier' }],
      cols: [{ id: 'n', label: 'S. No.', fixed: [] }, { id: 'V', label: 'V<sub>G2K</sub> (V)' }, { id: 'I', label: 'Current reading' }, { id: 'IA', label: 'Current I (A)' }], rows: 40, plot: { x: 'V', y: 'I', fit: false, label: 'I vs V<sub>G2K</sub>' } },
    { id: 'peaks', title: 'V<sub>G2K</sub> at the maxima', cols: [{ id: 'k', label: 'Order', fixed: [] }, { id: 'V', label: 'V<sub>G2K</sub> at max (V)' }, { id: 'd', label: 'Difference from preceding max (V)' }], rows: 7, plot: { x: 'k', y: 'V', fit: true, label: 'V<sub>peak</sub> vs order' } },
    { id: 'auto', title: 'Auto mode (CRO)', fields: [{ id: 'sx', label: 'X sensitivity (V/div)' }, { id: 'div', label: 'Mean peak spacing (div)' }, { id: 'dv', label: 'ΔV (V)' }, { id: 'E', label: 'Excitation energy (eV)' }], cols: [{ id: 'x', label: 'Peak positions (div)' }], rows: 6 },
  ],

  build(ctx) {
    const { bench, wires, ui, rand } = ctx;
    const L = bench.layers;
    const P = { dE: 11.55, c: -1.1 + rand() * 1.5, I0: 3.1e-9 * (1 + (rand() - 0.5) * 0.3) };
    const S = { em: 0, damaged: false, ion: 0, onOk: null };

    // ---------------- FH-3001
    const F = cabinet(L.inst, 160, 440, 460, 160, { depth: 22 });
    sesLogo(F, 22, 18, 1.6);
    txt(F, 230, 20, 'FRANK-HERTZ EXPERIMENT', { size: 8.4, weight: 800 });
    txt(F, 420, 20, 'FH-3001', { size: 7, fill: '#b71c1c', weight: 800 });
    const dI = new Display7(F, { x: 70, y: 50, w: 74, h: 30, digits: 4, style: 'led' });
    txt(F, 70, 72, 'Current (I)', { size: 4.4 });
    const dV = new Display7(F, { x: 385, y: 50, w: 74, h: 30, digits: 4, style: 'led' });
    txt(F, 385, 72, 'Voltage (V)', { size: 4.4 });
    txt(F, 170, 28, 'FILAMENT (V)', { size: 3.8 }); arcArrow(F, 170, 46, 13);
    const fil = new Knob(bench, F, { x: 170, y: 50, r: 8, style: 'ses', value: 0, name: 'FILAMENT (V) 2.6–3.4 V', wheel: 0.01 });
    txt(F, 158, 62, '2.6', { size: 2.8 }); txt(F, 182, 62, '3.4', { size: 2.8 });
    txt(F, 270, 28, 'SCANNING (V)', { size: 3.8 }); arcArrow(F, 270, 46, 13);
    const scan = new Knob(bench, F, { x: 270, y: 50, r: 8, style: 'ses', value: 0, name: 'SCANNING (V) — auto-scan maximum (0–85 V)', wheel: 0.01 });
    txt(F, 205, 72, 'Manual', { size: 3.4, anchor: 'end' }); txt(F, 235, 72, 'Auto', { size: 3.4, anchor: 'start' });
    const auto = new Toggle(bench, F, { x: 220, y: 72, orient: 'h', labels: ['Manual', 'Auto'], name: 'Manual / Auto' });
    // multiplier
    txt(F, 70, 132, 'MULTIPLIER (A)', { size: 3.8 });
    const mult = new Knob(bench, F, { x: 70, y: 112, r: 8, style: 'ses', steps: [0, 1, 2], labels: MULT_L, index: 0, sweep: 90, name: 'Current MULTIPLIER' });
    dial(F, 70, 112, 13, MULT_L, { sweep: 90, size: 3 });
    txt(F, 40, 104, 'Manual', { size: 2.8 }); txt(F, 100, 104, 'Auto', { size: 2.8 });
    // outputs
    txt(F, 170, 96, 'Y', { size: 4.4 }); txt(F, 215, 96, 'GND', { size: 4.4 }); txt(F, 260, 96, 'X', { size: 4.4 });
    new Socket(bench, F, { x: 170, y: 112, id: 'fh.y', color: 'red', name: 'Y output (current signal)', allowMixed: true, scale: 1.3 });
    new Socket(bench, F, { x: 215, y: 112, id: 'fh.g', color: 'black', name: 'GND', scale: 1.3 });
    new Socket(bench, F, { x: 260, y: 112, id: 'fh.x', color: 'red', name: 'X output (V G2K signal)', allowMixed: true, scale: 1.3 });
    sesName(F, 160, 136, 1.2);
    // voltage selector + grid knobs
    txt(F, 345, 82, 'V G1K', { size: 3 }); txt(F, 385, 82, 'V G2A', { size: 3 }); txt(F, 425, 82, 'V G2K', { size: 3 });
    const vsel = new Selector3(bench, F, { x: 385, y: 90, w: 80, labels: ['V G1K', 'V G2A', 'V G2K'], index: 2, name: 'Voltage display select' });
    const kG1 = new Knob(bench, F, { x: 345, y: 122, r: 8, style: 'ses', name: 'V G1K (1.3–5 V)', wheel: 0.004 });
    const kG2A = new Knob(bench, F, { x: 385, y: 122, r: 8, style: 'ses', name: 'V G2A (1.3–12 V)', wheel: 0.002 });
    const kG2K = new Knob(bench, F, { x: 425, y: 122, r: 8, style: 'ses', name: 'V G2K (0–85 V accelerating)', wheel: 1 / 850, drag: 0.0012 });
    txt(F, 345, 138, 'V G1K', { size: 3.4 }); txt(F, 385, 138, 'V G2A', { size: 3.4 }); txt(F, 425, 138, 'V G2K', { size: 3.4 });
    const onT = new Toggle(bench, F, { x: 448, y: 140, size: 0.8, name: 'FH-3001 mains', onChange: (v) => {
      const atMin = fil.value < 0.02 && scan.value < 0.02 && kG1.value < 0.02 && kG2A.value < 0.02 && kG2K.value < 0.02 && !auto.value && mult.idx === 0;
      if (v && !atMin) ui.remark('FH-3001 switched on without every knob at minimum, Manual mode and multiplier at 10⁻⁷.', 'warn');
      if (v && S.onOk === null) S.onOk = atMin;
      if (!v && !atMin) ui.remark('Switch off only after bringing every knob to minimum and Manual mode.', 'warn');
    } });
    txt(F, 448, 152, 'ON', { size: 3 });
    // tube housing on top
    const TH = g(L.inst);
    rect(TH, 200, 340, 120, 82, { fill: '#f1f1ec', stroke: '#aaa69c', sw: 1, r: 16 });
    rect(TH, 214, 352, 92, 64, { fill: 'rgba(200,215,225,0.55)', stroke: '#9aa', sw: 0.8, r: 10 });
    rect(TH, 248, 356, 24, 56, { fill: 'rgba(230,240,248,0.7)', stroke: '#8aa', sw: 0.8, r: 6 });
    rect(TH, 252, 372, 16, 30, { fill: '#5a5f66' });
    const filGlow = circ(TH, 260, 404, 3, { fill: '#ff8a2a', opacity: 0 }); filGlow.setAttribute('filter', 'url(#fGlow)');
    const gasGlow = rect(TH, 250, 362, 20, 42, { fill: '#7da0ff', opacity: 0, r: 4 });
    rect(TH, 246, 410, 28, 8, { fill: '#333', r: 2 });
    bench.interactive(TH, { tip: '<b>Argon-filled Franck-Hertz tetrode</b> in its housing', click: () => {} });

    // ---------------- CRO
    const cro = new CRO(ctx, L.inst, 760, 440, { id: 'cro' });

    // ---------------- physics
    const V = () => ({
      fil: 2.6 + 0.8 * fil.value, g1: 1.3 + 3.7 * kG1.value, g2a: 1.3 + 10.7 * kG2A.value, g2kMan: 85 * kG2K.value, scan: 85 * scan.value,
    });
    function current(Vg2k, v) {
      if (!onT.value || S.damaged) return 0;
      const A = S.em * Math.exp((v.fil - 2.6) * 4.3) * Math.sqrt(v.g1 / 1.5);
      const env = Math.pow(Math.max(0, Vg2k - 0.6), 1.35);
      const vp1 = P.dE + P.c;
      let s = 1;
      if (Vg2k > vp1) {
        const phi = (Vg2k - vp1) / P.dE, n = Math.floor(phi), u = phi - n;
        const m = clamp(0.62 - 0.04 * (v.g2a - 1.3) + 0.025 * n, 0.12, 0.92);
        s = u < 0.3 ? 1 - (1 - m) * Math.pow(Math.sin(Math.PI * u / 0.6), 2) : m + (1 - m) * Math.pow(Math.sin(Math.PI * (u - 0.3) / 1.4), 2);
      } else {
        // retarding field suppresses the very slow electrons
        s = clamp((Vg2k - 0.6) / Math.max(1, v.g2a * 0.5), 0, 1) ** 0.6;
      }
      let I = P.I0 * A * env * s * Math.exp(-(v.g2a - 1.3) / 9);
      // ionisation at high voltage and hot filament
      if (Vg2k > 68 && v.fil > 3.0) I *= 1 + Math.exp((Vg2k - 68) / 3.5) * (v.fil - 3.0) * 3;
      return I;
    }
    let acc = 0;
    const st = { I: 0, V: 0 };
    bench.addUpdater((dt, sdt) => {
      const v = V();
      const target = onT.value ? 1 : 0;
      S.em += (target - S.em) * Math.min(1, sdt / 45);
      filGlow.setAttribute('opacity', onT.value ? clamp(S.em * (0.4 + (v.fil - 2.6)), 0, 1) : 0);
      // manual-mode overload watch
      if (onT.value && !auto.value && !S.damaged) {
        const I = current(v.g2kMan, v), base = current(Math.min(v.g2kMan, 68), v);
        if (I > base * 3 && v.g2kMan > 68) { S.ion += sdt; if (S.ion > 6) { S.damaged = true; ui.remark('The tube current ran away (ionisation) and the tube is damaged. Reduce V G2K immediately when the current rises suddenly. Ask the instructor for a new tube (Reset apparatus).', 'bad'); } else if (S.ion > 0.2 && !S._warned) { S._warned = true; ui.toast('Current rising suddenly — reduce V G2K now!', 'bad'); } }
        else S.ion = Math.max(0, S.ion - sdt);
      }
      gasGlow.setAttribute('opacity', onT.value && !S.damaged ? clamp((Math.max(v.g2kMan, auto.value ? v.scan : 0) - 40) / 200, 0, 0.25) * S.em : 0);
      acc += dt;
      if (acc < 0.3) return;
      acc = 0;
      if (!onT.value) { dI.blank(); dV.blank(); return; }
      const Vacc = auto.value ? v.scan * ((bench.simTime * 2) % 1) : v.g2kMan;
      const I = current(Vacc, v) * (1 + gauss() * 0.004);
      st.I = I; st.V = Vacc;
      const shown = I / MULT[mult.idx];
      dI.set(shown > 199.95 ? '1   ' : shown.toFixed(1));
      const vv = [v.g1, v.g2a, Vacc][vsel.idx];
      dV.set(vv.toFixed(1));
    });
    // CRO signals
    cro.period = 0.5;
    let route = {};
    const cfg = () => {
      const r = (s2) => wires.connected(s2, 'fh.y') ? 'y' : wires.connected(s2, 'fh.x') ? 'x' : null;
      route = { ch1: r('cro.ch1'), ch2: r('cro.ch2'), gnd: wires.connected('cro.gnd', 'fh.g') };
    };
    wires.onChange(cfg); cfg();
    cro.input = (t) => {
      const v = V();
      if (!onT.value) return { ch1: route.ch1 ? 0 : null, ch2: route.ch2 ? 0 : null };
      const Vacc = auto.value ? v.scan * (t / 0.5) : v.g2kMan;
      const sig = { x: Vacc, y: current(Vacc, v) / MULT[mult.idx] * 0.02 };
      const hum = route.gnd ? 0 : 0.6 * Math.sin(2 * Math.PI * 50 * t);
      return { ch1: route.ch1 ? sig[route.ch1] + hum : null, ch2: route.ch2 ? sig[route.ch2] + hum : null };
    };
    bench.addUpdater(() => { cro.dirty = true; });

    const steps = [
      { t: 'Before switching on: all knobs at minimum, multiplier 10⁻⁷, Manual mode. Then switch on.', done: () => onT.value && S.onOk === true },
      { t: 'Set V<sub>G1K</sub> = 1.5 V and V<sub>G2A</sub> = 7.5 V (select each on the voltage display).', done: () => { const v = V(); return onT.value && Math.abs(v.g1 - 1.5) < 0.05 && Math.abs(v.g2a - 7.5) < 0.05; } },
      { t: 'Filament about 2.6 V; wait 2–3 minutes for it to stabilise.', done: () => onT.value && S.em > 0.97 },
      { t: 'Select V<sub>G2K</sub>, increase it slowly and watch the maxima and minima. Choose a suitable multiplier.', done: () => onT.value && vsel.idx === 2 && V().g2kMan > 30 },
      { t: 'Record V<sub>G2K</sub> vs current from 0 to 80 V (manual table).' },
      { t: 'Auto mode: Y → CH I, X → CH II, GND → CRO ground; Auto; CRO X-Y; scan to maximum.', done: () => route.ch1 === 'y' && route.ch2 === 'x' && route.gnd && auto.value && cro.on && cro.xy.value && scan.value > 0.9 },
      { t: 'Measure the spacing of the peaks on the CRO and convert it to volts.' },
      { t: 'Return every knob to minimum and Manual, then switch off.', done: () => !onT.value && S.em > 0.01 && fil.value < 0.02 && kG2K.value < 0.02 && !auto.value },
    ];
    const views = [
      { name: 'Whole bench', x: 120, y: 300, w: 1000, h: 480 },
      { name: 'FH-3001', x: 140, y: 330, w: 500, h: 290 },
      { name: 'Oscilloscope', x: 740, y: 400, w: 340, h: 220 },
    ];
    return { steps, views, debug: { S, P, fil, scan, auto, mult, vsel, kG1, kG2A, kG2K, onT, dI, dV, cro, current, V, st } };
  },
};
