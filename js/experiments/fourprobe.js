// Experiment: Band gap of Ge by the four-probe method (INDOSAW four probe set-up with oven)
import { g, txt, rect, circ, line, path, poly, clamp, gauss } from '../core/svg.js';
import { Knob, Toggle, Rocker, LED, Display7, Socket } from '../core/controls.js';
import { cabinet } from '../core/instruments.js';

const ICON = `<svg viewBox="0 0 200 100"><rect x="10" y="30" width="120" height="55" rx="4" fill="#f4f4f4" stroke="#2a4fb5" stroke-width="5"/><rect x="30" y="42" width="30" height="14" fill="#111"/><rect x="80" y="42" width="30" height="14" fill="#111"/><rect x="145" y="40" width="45" height="45" rx="3" fill="#151515"/><rect x="163" y="18" width="8" height="24" fill="#ccc"/></svg>`;
const kB = 8.617e-5;

export default {
  id: 'fourprobe', title: 'Four-Probe Method', subtitle: 'Band gap of germanium from resistivity vs temperature',
  blurb: 'INDOSAW four-probe set-up: constant current source, mV meter, oven up to 150 °C with PT-100 sensor, p-type Ge sample.',
  icon: ICON,
  manual: {
    aim: 'To determine the band gap of a semiconductor (Ge) by measuring its resistivity as a function of temperature using the four-probe method.',
    apparatus: ['Four-probe arrangement with spring-loaded probes on a p-type Ge crystal (factory fitted)', 'Oven (up to 150 °C) with PT-100 sensor', 'INDOSAW four-probe set-up: constant current source 0–20 mA, digital mV meter (×1 / ×10), temperature display, heater control'],
    formula: `<p>ρ<sub>0</sub> = (V/I) × 2πs, &nbsp; ρ = ρ<sub>0</sub> / G<sub>7</sub>(W/s)</p><p>s = 0.24 cm, W = 0.05 cm, G<sub>7</sub>(W/s) = 6.931</p><p>log<sub>10</sub>ρ = C + E<sub>g</sub>/(2.3026 × 2k) × (1/T)</p><p>E<sub>g</sub> = 2.3026 × 10<sup>3</sup> × 2k × slope of (log<sub>10</sub>ρ vs 10<sup>3</sup>/T), &nbsp; k = 8.617 × 10<sup>−5</sup> eV/K</p>`,
    procedure: [
      'Put the four-probe arrangement into the oven and connect the oven lead to the OVEN socket. Insert the PT-100 sensor in the hole on top. Keep the heater switch OFF.',
      'Connect the red and black plugs to VOLTAGE and the yellow plugs to CURRENT.',
      'Put the display switch on Current, switch the set-up ON and raise the current to about 4 mA. The voltage must be positive — if not, interchange the current leads.',
      'Set the current to the desired value (e.g. 8 mA). Start with the ×1 voltage range.',
      'Switch the oven ON (heater switch) and turn the display switch to Temperature.',
      'Note the probe voltage at different temperatures (every 10 °C) up to about 140 °C.',
    ],
    precautions: ['Do not press the probes too hard on the crystal.', 'Keep the current constant throughout.', 'Do not let the oven exceed its rated temperature.', 'Read the voltage and temperature at the same moment.'],
    controls: ['Click the four-probe arrangement / PT-100 sensor for actions.', 'Leads: click a plug, then a socket.', 'Use the lab clock (top bar) to speed up heating if you wish.'],
    link: 'https://drive.google.com/file/d/1kQ_2zD9Ljl_3xcUoHwNbjxWIHVh6AW3j/view',
  },
  tables: [
    { id: 'obs', title: 'Observation table', fields: [{ id: 'I', label: 'Constant current through the sample (mA)' }, { id: 's', label: 'Probe spacing s (cm)' }, { id: 'W', label: 'Sample thickness W (cm)' }, { id: 'G', label: 'G<sub>7</sub>(W/s)' }],
      cols: [{ id: 'n', label: 'Sr.', fixed: [] }, { id: 'Tc', label: 'Temperature (°C)' }, { id: 'T', label: 'Temperature (K)' }, { id: 'V', label: 'Voltage (mV)' }, { id: 'iT', label: '10³/T (K⁻¹)' }, { id: 'rho', label: 'ρ (Ω cm)' }, { id: 'lr', label: 'log₁₀ρ' }], rows: 14, plot: { x: 'iT', y: 'lr', fit: true, label: 'log ρ vs 10³/T' } },
    { id: 'res', title: 'Result', fields: [{ id: 'slope', label: 'Slope of the straight part' }, { id: 'Eg', label: 'Band gap E<sub>g</sub> (eV)' }], cols: [{ id: 'x', label: 'Remarks' }], rows: 1 },
  ],

  build(ctx) {
    const { bench, wires, ui, rand } = ctx;
    const L = bench.layers;
    const Tamb = 25 + rand() * 4;
    const P = { Eg: 0.66 + (rand() - 0.5) * 0.04, sx: 0.035 + rand() * 0.015, s0: 7000 * (1 + (rand() - 0.5) * 0.3) };
    const S = { inOven: false, pt: false, T: Tamb, Ts: Tamb, onOk: null, heatOnAt: null };
    function rho(Tc) { // ohm cm
      const T = Tc + 273.15;
      const sInt = P.s0 * Math.exp(-P.Eg / (2 * kB * T));
      const sExt = P.sx * Math.pow(T / 300, -1.5);
      return 1 / (sInt + sExt);
    }

    // ---------------- INDOSAW four probe set-up
    const U = cabinet(L.inst, 280, 430, 460, 160, { depth: 20, fill: '#f4f4f2', face: '#fbfbfa' });
    rect(U, -14, -6, 22, 172, { fill: '#2a4fb5', stroke: '#16306e', sw: 1, r: 8 }); rect(U, 452, -6, 22, 172, { fill: '#2a4fb5', stroke: '#16306e', sw: 1, r: 8 });
    rect(U, -8, 40, 10, 60, { fill: '#1c357d', r: 4 }); rect(U, 458, 40, 10, 60, { fill: '#1c357d', r: 4 });
    rect(U, 3, 145, 454, 12, { fill: '#2a4fb5' });
    txt(U, 50, 18, 'INDOSAW', { size: 9, weight: 900, italic: true, fill: '#1a2f73' });
    txt(U, 230, 18, 'FOUR PROBE SET-UP', { size: 8.4, weight: 800 });
    const onSw = new Rocker(bench, U, { x: 50, y: 52, w: 20, h: 20, color: '#1f8a3a', lit: '#5dff7a', name: 'Mains ON (green)', mark: false, onChange: v => {
      if (v && iKnob.value > 0.03) ui.remark('The set-up was switched on with the CURRENT knob not at minimum.', 'warn');
      if (v && S.onOk === null) S.onOk = iKnob.value <= 0.03;
    } });
    txt(U, 50, 70, 'ON', { size: 4.2 });
    const iKnob = new Knob(bench, U, { x: 50, y: 110, r: 14, style: 'blue', name: 'CURRENT adjust', wheel: 0.004, drag: 0.0015 });
    txt(U, 50, 133, 'CURRENT', { size: 4.2, weight: 700 });
    const d1 = new Display7(U, { x: 170, y: 55, w: 72, h: 28, digits: 4, style: 'led' });
    txt(U, 215, 42, '°C', { size: 4.4 }); txt(U, 215, 70, 'mA', { size: 4.4 });
    const d2 = new Display7(U, { x: 320, y: 55, w: 72, h: 28, digits: 4, style: 'led' });
    txt(U, 365, 70, 'mV', { size: 4.4 });
    txt(U, 245, 88, 'Current', { size: 3.8 });
    const dsel = new Toggle(bench, U, { x: 245, y: 100, value: true, labels: ['Temperature', 'Current'], name: 'Display switch: Current / Temperature' });
    txt(U, 245, 113, 'Temperature', { size: 3.8 });
    new Socket(bench, U, { x: 150, y: 110, id: 'fp.i1', color: 'yellow', name: 'CURRENT socket 1 (+)', scale: 1.5 });
    new Socket(bench, U, { x: 182, y: 110, id: 'fp.i2', color: 'yellow', name: 'CURRENT socket 2 (−)', scale: 1.5 });
    txt(U, 166, 128, 'CURRENT', { size: 4 }); txt(U, 166, 134, '0-20mA', { size: 3.6 });
    new Socket(bench, U, { x: 300, y: 110, id: 'fp.vr', color: 'red', name: 'VOLTAGE (+, red)', scale: 1.5 });
    new Socket(bench, U, { x: 330, y: 110, id: 'fp.vb', color: 'black', name: 'VOLTAGE (−, black)', scale: 1.5 });
    txt(U, 315, 130, 'VOLTAGE', { size: 4 });
    txt(U, 410, 34, 'HEATER', { size: 3.6 });
    const heat = new Toggle(bench, U, { x: 410, y: 46, name: 'HEATER (oven) switch', onChange: v => { if (v) S.heatOnAt = bench.simTime; } });
    txt(U, 410, 58, 'ON', { size: 3.4 });
    const hLed = new LED(U, { x: 422, y: 40, r: 1.6, color: '#3dff6a', off: '#1d4a2a' });
    txt(U, 410, 66, 'x10', { size: 3.6 });
    const x10 = new Toggle(bench, U, { x: 410, y: 78, labels: ['×1', '×10'], name: 'mV range ×1 / ×10' });
    txt(U, 410, 90, 'mV', { size: 3.4 });
    new Socket(bench, U, { x: 410, y: 116, id: 'fp.oven', kind: 'din', name: 'OVEN socket' });
    txt(U, 410, 130, 'OVEN', { size: 4 });

    // ---------------- oven (black box)
    const O = g(L.inst);
    const ox = 860, oy = 440;
    rect(O, ox - 4, oy + 150, 140, 10, { fill: '#000', opacity: 0.2, r: 5 });
    poly(O, [[ox, oy], [ox + 12, oy - 16], [ox + 140, oy - 16], [ox + 128, oy]], { fill: '#2a2a2a', stroke: '#000', sw: 0.6 });
    rect(O, ox, oy, 128, 150, { fill: '#151515', stroke: '#000', sw: 1, r: 3 });
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) circ(O, ox + 30 + i * 17, oy + 60 + j * 17, 3.6, { fill: '#050505', stroke: '#333', sw: 0.5 });
    [[ox + 8, oy + 8], [ox + 120, oy + 8], [ox + 8, oy + 142], [ox + 120, oy + 142]].forEach(([x, y]) => circ(O, x, y, 2.4, { fill: 'url(#gChromeR)' }));
    rect(O, ox + 52, oy - 22, 32, 8, { fill: 'url(#gChrome)', stroke: '#555', sw: 0.5, r: 1 });
    txt(O, ox + 64, oy + 30, 'OVEN', { size: 6, fill: '#888', weight: 700 });
    const ovenGlow = rect(O, ox + 20, oy + 50, 88, 80, { fill: '#ff5a1a', opacity: 0, r: 6 });
    bench.interactive(O, { tip: () => `<b>Oven</b>${S.inOven ? ' with the four-probe arrangement inside' : ''}`, title: 'Oven', menu: () => armMenu() });
    wires.addLead({ id: 'oven.lead', name: 'Oven lead', kind: 'din', color: '#222', cable: '#2a2a2a', anchor: () => ({ x: ox + 2, y: oy + 120 }), rest: { x: 800, y: 680 }, restAngle: 20, width: 3.4 });
    // ---------------- four-probe arrangement (moves between bench and oven)
    const ARM = g(L.front);
    function armTop() { return S.inOven ? { x: ox + 68, y: oy - 70 } : { x: 1100, y: 470 }; }
    function drawArm() {
      ARM.innerHTML = '';
      const t = armTop();
      if (S.inOven) {
        rect(ARM, t.x - 6, t.y, 12, 52, { fill: 'url(#gChromeH)', stroke: '#666', sw: 0.5 });
        rect(ARM, t.x - 10, t.y - 8, 20, 10, { fill: 'url(#gChromeH)', stroke: '#555', sw: 0.5, r: 2 });
      } else {
        rect(ARM, t.x - 40, t.y + 150, 80, 12, { fill: '#2a2a2a', r: 2 });
        rect(ARM, t.x - 24, t.y + 128, 48, 22, { fill: '#9aa0a6', stroke: '#555', sw: 0.6 });
        rect(ARM, t.x - 6, t.y, 12, 130, { fill: 'url(#gChromeH)', stroke: '#666', sw: 0.5 });
        rect(ARM, t.x - 10, t.y - 8, 20, 10, { fill: 'url(#gChromeH)', stroke: '#555', sw: 0.5, r: 2 });
        txt(ARM, t.x + 60, t.y + 140, 'p-type Ge sample', { size: 4, fill: '#333' });
      }
      if (S.pt) { line(ARM, t.x + 4, t.y - 26, t.x + 4, t.y + 8, { stroke: '#ccc', sw: 2.6 }); circ(ARM, t.x + 4, t.y - 28, 2.4, { fill: '#888' }); }
      circ(ARM, t.x + 4, t.y - 4, 1.6, { fill: '#111' });
      bench.interactive(ARM, { tip: '<b>Four-probe arrangement</b> (spring-loaded probes on Ge)', title: 'Four-probe arrangement', menu: () => armMenu() });
    }
    function armMenu() {
      return [
        !S.inOven && { label: 'Put the four-probe arrangement into the oven', fn: () => { S.inOven = true; drawArm(); drawPT(); wires.refresh(); } },
        S.inOven && { label: 'Take the arrangement out of the oven', fn: () => { if (S.T > 45) { ui.toast('Too hot to handle — let the oven cool first.', 'warn'); return; } S.inOven = false; S.pt = false; drawArm(); drawPT(); wires.refresh(); } },
        !S.pt && { label: 'Insert the PT-100 sensor into the hole on top', fn: () => { S.pt = true; drawArm(); drawPT(); wires.refresh(); } },
        S.pt && { label: 'Pull out the PT-100 sensor', fn: () => { S.pt = false; drawArm(); drawPT(); wires.refresh(); } },
      ];
    }
    drawArm();
    // probe leads (from the top of the arrangement)
    [['p.y1', 'Probe lead yellow (outer probe 1)', 'yellow', 0], ['p.y2', 'Probe lead yellow (outer probe 4)', 'yellow', 1], ['p.r', 'Probe lead red (inner probe 2)', 'red', 2], ['p.b', 'Probe lead black (inner probe 3)', 'black', 3]].forEach(([id, name, color, i]) => {
      wires.addLead({ id, name, color, anchor: () => { const t = armTop(); return { x: t.x - 6 + i * 4, y: t.y - 6 }; }, rest: { x: 980 + i * 22, y: 720 + (i % 2) * 10 }, restAngle: -15 + i * 10, sag: 40 });
    });
    // PT-100 sensor: thin grey cable from the unit
    const PTG = g(L.table);
    const ptCable = path(L.wires, '', { stroke: '#b9bdc1', sw: 1.8, cap: 'round' });
    function drawPT() {
      PTG.innerHTML = '';
      const a = { x: 740, y: 470 };
      let b;
      if (S.pt) { const t = armTop(); b = { x: t.x + 4, y: t.y - 30 }; }
      else { b = { x: 1010, y: 640 }; rect(PTG, b.x, b.y - 2, 40, 4, { fill: '#cfd3d6', stroke: '#777', sw: 0.4 }); rect(PTG, b.x - 8, b.y - 3, 9, 6, { fill: '#555' }); bench.interactive(PTG, { tip: '<b>PT-100 temperature sensor</b>', title: 'PT-100 sensor', menu: () => [{ label: 'Insert it into the hole on top of the four-probe arrangement', fn: () => { S.pt = true; drawArm(); drawPT(); } }] }); }
      ptCable.setAttribute('d', `M${a.x},${a.y} C${a.x + 80},${a.y - 120} ${b.x - 80},${b.y - 100} ${b.x},${b.y}`);
    }
    drawPT();

    // ---------------- physics loop
    const st = { I: 0, V: 0 };
    let acc = 0;
    bench.addUpdater((dt, sdt) => {
      const ovenOK = wires.leadSocket('oven.lead') === 'fp.oven';
      const heating = onSw.value && heat.value && ovenOK;
      hLed.set(onSw.value && heat.value);
      const Pw = heating && S.T < 150 ? 0.16 : 0;
      S.T += (Pw - 9e-4 * (S.T - Tamb)) * sdt;
      const target = S.inOven ? S.T : Tamb;
      S.Ts += (target - S.Ts) * Math.min(1, sdt / 25);
      ovenGlow.setAttribute('opacity', clamp((S.T - 40) / 400, 0, 0.18));
      acc += dt;
      if (acc < 0.35) return;
      acc = 0;
      if (!onSw.value) { d1.blank(); d2.blank(); return; }
      // current path
      const pin = (sock) => ['p.y1', 'p.y2', 'p.r', 'p.b'].find(l => wires.connected(l, sock));
      const a = pin('fp.i1'), b = pin('fp.i2'), vp = pin('fp.vr'), vm = pin('fp.vb');
      const outer = (x, y) => (x === 'p.y1' && y === 'p.y2') || (x === 'p.y2' && y === 'p.y1');
      const inner = (x, y) => (x === 'p.r' && y === 'p.b') || (x === 'p.b' && y === 'p.r');
      let I = 0, V = 0;
      if (a && b && a !== b) {
        I = iKnob.value * 0.020;
        const r = rho(S.Ts) * 6.931 * I / (2 * Math.PI * 0.24); // volts for correct geometry
        if (outer(a, b) && inner(vp, vm)) V = (a === 'p.y1' ? 1 : -1) * (vp === 'p.r' ? 1 : -1) * r;
        else if (inner(a, b) && outer(vp, vm)) V = (a === 'p.r' ? 1 : -1) * (vp === 'p.y1' ? 1 : -1) * r; // reciprocity
        else if (vp && vm) V = r * 1.8;
      }
      if (!(vp && vm)) V = gauss() * 0.0004;
      st.I = I; st.V = V;
      // display 1
      if (dsel.value) d1.set((I * 1000 * (1 + gauss() * 5e-4)).toFixed(2));
      else { const T = S.pt ? S.Ts + gauss() * 0.05 : Tamb + gauss() * 0.05; d1.set(T.toFixed(1)); }
      // display 2: mV
      const mV = V * 1000 * (1 + gauss() * 8e-4) + gauss() * 0.05;
      const shown = x10.value ? mV / 10 : mV;
      const aV = Math.abs(shown);
      d2.set(aV > 199.95 ? (shown < 0 ? '-1   ' : '1   ') : shown.toFixed(1));
    });

    const steps = [
      { t: 'Put the four-probe arrangement into the oven and insert the PT-100 sensor.', done: () => S.inOven && S.pt },
      { t: 'Connect the oven lead to the OVEN socket (heater switch OFF).', done: () => wires.leadSocket('oven.lead') === 'fp.oven' },
      { t: 'Red and black plugs to VOLTAGE, yellow plugs to CURRENT.', done: () => ['fp.i1', 'fp.i2'].every(s2 => ['p.y1', 'p.y2'].some(l => wires.connected(l, s2))) && wires.connected('p.r', 'fp.vr') !== undefined && ['fp.vr', 'fp.vb'].every(s2 => ['p.r', 'p.b'].some(l => wires.connected(l, s2))) },
      { t: 'Display on Current, switch ON (current knob at minimum), raise to ~4 mA and check that the voltage is positive.', done: () => onSw.value && S.onOk && st.I > 0.003 && st.V > 0 },
      { t: 'Set the current to the desired value (e.g. 8 mA) and choose the voltage range.', done: () => onSw.value && Math.abs(st.I - 0.008) < 0.0003 && st.V > 0 },
      { t: 'Switch the heater ON and turn the display to Temperature.', done: () => heat.value && !dsel.value && S.heatOnAt !== null },
      { t: 'Record the probe voltage at every 10 °C up to ~140 °C.' },
      { t: 'Switch off the heater and the set-up.', done: () => !heat.value && !onSw.value && S.T > 60 },
    ];
    const views = [
      { name: 'Whole bench', x: 200, y: 330, w: 1100, h: 520 },
      { name: 'Four-probe set-up', x: 250, y: 400, w: 520, h: 210 },
      { name: 'Oven', x: 780, y: 360, w: 420, h: 330 },
    ];
    return { steps, views, debug: { S, P, onSw, iKnob, dsel, heat, x10, d1, d2, st, rho } };
  },
};
