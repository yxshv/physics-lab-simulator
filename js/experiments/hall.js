// Experiment: Hall effect in n-type Ge (SES DHE-21A, DGM-202, DPS-50, EMU-50 electromagnet)
import { g, txt, rect, circ, line, path, poly, dial, arcArrow, clamp, gauss } from '../core/svg.js';
import { Knob, Toggle, Button, LED, Display7, Socket } from '../core/controls.js';
import { cabinet, sesLogo, sesName, solveAC } from '../core/instruments.js';

const ICON = `<svg viewBox="0 0 200 100"><rect x="20" y="40" width="160" height="30" fill="#c8ccd0" stroke="#888"/><rect x="40" y="25" width="45" height="50" rx="4" fill="#dfe2e5" stroke="#888"/><rect x="115" y="25" width="45" height="50" rx="4" fill="#dfe2e5" stroke="#888"/><rect x="85" y="42" width="11" height="16" fill="#cfd4d8"/><rect x="104" y="42" width="11" height="16" fill="#cfd4d8"/><rect x="98" y="20" width="4" height="70" fill="#222"/></svg>`;

export default {
  id: 'hall', title: 'Hall Effect', subtitle: 'Hall coefficient, carrier concentration and mobility of Ge',
  blurb: 'SES DHE-21A Hall set-up, DGM-202 gaussmeter, DPS-50 constant current supply and EMU-50 electromagnet.',
  icon: ICON,
  manual: {
    aim: 'To observe the Hall effect and calculate (a) the Hall coefficient, (b) the carrier concentration and (c) the mobility for the given Ge semiconductor.',
    apparatus: ['Hall probe (Ge crystal) on a PCB with four leads', 'Hall Effect Set-up (Digital) DHE-21A', 'Electromagnet EMU-50 with pole-gap handwheel', 'Constant Current Power Supply DPS-50', 'Digital Gaussmeter DGM-202 with its probe', 'Probe stand'],
    formula: `<p>R<sub>H</sub> = V<sub>H</sub>·t / (I·B) &nbsp; (V in volt, t in m, I in A, B in tesla; 1 T = 10<sup>4</sup> G)</p><p>n = 1 / (R<sub>H</sub>·e) &nbsp;&nbsp; μ = R<sub>H</sub> / ρ</p><p>From graphs: R<sub>H</sub> = (slope of V<sub>H</sub>–B)·t / I &nbsp; or &nbsp; (slope of V<sub>H</sub>–I)·t / B</p>`,
    procedure: [
      'With every knob at its minimum, connect the two electromagnet coils in series to the DPS-50 output.',
      'Mount the gaussmeter probe on the stand, keep it out of the field, switch the gaussmeter on and set the reading to zero with ZERO ADJ.',
      'Slide the probe to the centre of the pole gap, switch on the DPS-50 and record B for different magnet currents (Table 1).',
      'Bring the current back to zero. Mount the Hall probe: widthwise contacts (yellow, green) to VOLTAGE, lengthwise contacts (red, black) to CURRENT.',
      'Switch the DHE-21A on, set a few mA of probe current, switch the display to voltage and note the zero-field potential. Reduce it with OFFSET ADJ.',
      'Put the probe in the gap, switch on the field and rotate the probe until the Hall voltage is maximum (probe perpendicular to B).',
      'Take V<sub>H</sub> for both directions of current and field (reverse the leads) — Table 2.',
      'V<sub>H</sub> vs B at constant current (Table 3) and V<sub>H</sub> vs I at constant B > 1500 G (Table 4).',
    ],
    precautions: ['All current knobs at minimum before switching on.', 'Probe at the centre of the pole pieces, plane perpendicular to B.', 'Zero the gaussmeter before measuring the field.', 'Subtract the zero-field potential from every Hall voltage.', 'Do not exceed the rated currents of the probe and coils.', 'Let the readings settle before recording.'],
    controls: ['Drag the bench to pan, scroll to zoom. Use the <b>View</b> buttons at the bottom to jump to an instrument.', 'Knobs: drag or scroll. Hold Shift for fine control.', 'Patch cord: click a socket, then another socket. Click a cord to remove it.', 'Probe leads: click a plug to pick it up, then click a socket.', 'Click the probe stand to mount a probe or move it in/out of the gap.'],
    link: 'https://drive.google.com/file/d/16ZPqP6J3FNvVV4NibizPtL8XaiW0TJ9m/view',
  },
  tables: [
    { id: 't0', title: 'Probe data', fields: [{ id: 't', label: 'Thickness of the probe, t' }, { id: 'rho', label: 'Resistivity of the sample, ρ' }], cols: [{ id: 'x', label: 'Remarks' }], rows: 1 },
    { id: 't1', title: 'Table 1: Magnetic field vs current through the electromagnet', note: 'Pole gap: write it in the remarks below the table.', cols: [{ id: 'n', label: 'Sl. No.', fixed: [] }, { id: 'I', label: 'Current (A)' }, { id: 'B', label: 'Magnetic field (G)' }], rows: 10, plot: { x: 'I', y: 'B', fit: false, label: 'B vs I' } },
    { id: 't2', title: 'Table 2: To show the Hall effect', fields: [{ id: 'zfp', label: 'Zero field potential (mV)' }, { id: 'ip', label: 'Constant current through probe (mA)' }], groups: [{ label: '', span: 2 }, { label: 'Hall voltage (mV)', span: 4 }], cols: [{ id: 'n', label: 'Sl.', fixed: [] }, { id: 'B', label: 'B (G)' }, { id: 'pp', label: 'B+ I+' }, { id: 'pm', label: 'B+ I−' }, { id: 'mm', label: 'B− I−' }, { id: 'mp', label: 'B− I+' }], rows: 5 },
    { id: 't3', title: 'Table 3: V<sub>H</sub> as a function of magnetic field', fields: [{ id: 'ip', label: 'Constant current through probe (mA)' }, { id: 'zfp', label: 'Zero field potential (mV)' }], cols: [{ id: 'n', label: 'Sl.', fixed: [] }, { id: 'B', label: 'B (G)' }, { id: 'V', label: 'Observed V<sub>H</sub> (mV)' }, { id: 'Vc', label: 'Corrected V<sub>H</sub>−ZFP (mV)' }], rows: 8, plot: { x: 'B', y: 'Vc', fit: true, label: 'V<sub>H</sub> vs B' } },
    { id: 't4', title: 'Table 4: V<sub>H</sub> as a function of current', fields: [{ id: 'B', label: 'Constant magnetic field (G)' }, { id: 'zfp', label: 'Zero field potential (mV)' }], cols: [{ id: 'n', label: 'Sl.', fixed: [] }, { id: 'I', label: 'Probe current I (mA)' }, { id: 'V', label: 'Observed V<sub>H</sub> (mV)' }, { id: 'Vc', label: 'Corrected V<sub>H</sub>−ZFP (mV)' }], rows: 8, plot: { x: 'I', y: 'Vc', fit: true, label: 'V<sub>H</sub> vs I' } },
  ],

  build(ctx) {
    const { bench, wires, ui, rand } = ctx;
    const L = bench.layers;
    // ---------------- hidden sample/setup parameters
    const P = {
      RH: 0.0172 * (1 + (rand() - 0.5) * 0.12), // m^3/C
      t: 0.5e-3, rho: 10 * (1 + (rand() - 0.5) * 0.1), // ohm cm
      rmis: (0.5 + rand() * 0.6) * (rand() < 0.5 ? -1 : 1), // ohm (contact misalignment)
      theta0: (rand() - 0.5) * 60, thetaG: (rand() - 0.5) * 16,
      gzero: (25 + rand() * 40) * (rand() < 0.5 ? -1 : 1),
      dpsZero: 0.01 + rand() * 0.02,
    };
    const S = { gap: 12 + Math.round(rand() * 6), mounted: null, inGap: false, theta: 0, brem: 0, bmax: 0, lastSign: 1, hot: 0,
      dpsOnOk: null, dheOnOk: null, dpsZeroCal: 0 };

    // ================= DPS-50 constant current power supply
    const dps = cabinet(L.inst, 100, 488, 430, 152, { depth: 18 });
    sesLogo(dps, 22, 20, 1.6);
    txt(dps, 215, 22, 'CONSTANT CURRENT POWER SUPPLY', { size: 8.4, weight: 800, fill: '#2a2a2a' });
    txt(dps, 392, 22, 'DPS-50', { size: 7, fill: '#b71c1c', weight: 800 });
    circ(dps, 392, 44, 7, { fill: '#1a1a1a', stroke: '#000', sw: 0.6 }); circ(dps, 392, 44, 4.5, { fill: '#2b2b2b' });
    txt(dps, 392, 56, 'FUSE', { size: 3 });
    arcArrow(dps, 70, 64, 21);
    const dpsKnob = new Knob(bench, dps, { x: 70, y: 70, r: 11, style: 'ses', name: 'Current Adj. (DPS-50)', wheel: 0.005, drag: 0.002 });
    txt(dps, 70, 95, 'Current', { size: 4.2, weight: 600 }); txt(dps, 70, 100, 'Adj.', { size: 4.2, weight: 600 });
    const dpsDisp = new Display7(dps, { x: 225, y: 66, w: 82, h: 32, digits: 3, style: 'led' });
    txt(dps, 225, 90, 'Amp', { size: 4.4 });
    txt(dps, 330, 100, 'Current', { size: 3.6 }); txt(dps, 330, 105, 'Zero', { size: 3.6 });
    new Button(bench, dps, { x: 330, y: 117, w: 7, h: 7, round: true, color: '#d63a2f', name: 'Current Zero (sets the meter zero; press with the knob at minimum)', onPress: () => {
      if (!dpsOn.value) return;
      if (dpsKnob.value < 0.01) { S.dpsZeroCal = P.dpsZero; ui.toast('DPS-50 meter zero set.'); } else ui.toast('Bring Current Adj. to minimum before setting zero.', 'warn');
    } });
    const dpsOn = new Toggle(bench, dps, { x: 392, y: 114, name: 'DPS-50 mains', onChange: (v) => {
      if (v && dpsKnob.value > 0.03) ui.remark('DPS-50 was switched on with Current Adj. not at minimum. Always start with the knob fully anticlockwise.', 'warn');
      if (v && S.dpsOnOk === null) S.dpsOnOk = dpsKnob.value <= 0.03;
    } });
    txt(dps, 392, 130, 'ON', { size: 3.6 });
    sesName(dps, 190, 132, 1.4);
    const dpsB = new Socket(bench, dps, { x: 40, y: 124, id: 'dps.neg', color: 'black', name: 'DPS-50 output (−)', scale: 1.4 });
    const dpsR = new Socket(bench, dps, { x: 70, y: 124, id: 'dps.pos', color: 'red', name: 'DPS-50 output (+)', scale: 1.4 });

    // ================= DHE-21A Hall effect set-up
    const dhe = cabinet(L.inst, 125, 355, 380, 117, { depth: 16 });
    txt(dhe, 14, 14, 'HALL EFFECT SET-UP', { size: 7, weight: 800, anchor: 'start' });
    txt(dhe, 318, 14, 'DHE-21A', { size: 6, weight: 800, fill: '#b71c1c' });
    sesLogo(dhe, 360, 14, 1.4);
    arcArrow(dhe, 42, 44, 15);
    const offKnob = new Knob(bench, dhe, { x: 42, y: 50, r: 8.5, style: 'ses', min: -1, max: 1, value: 0, name: 'OFFSET ADJ. (zero-field potential)', wheel: 0.004, drag: 0.0015 });
    txt(dhe, 42, 69, 'OFFSET', { size: 3.4 }); txt(dhe, 42, 73.5, 'ADJ.', { size: 3.4 });
    const dheDisp = new Display7(dhe, { x: 190, y: 42, w: 80, h: 30, digits: 4, style: 'led' });
    txt(dhe, 190, 65, 'mV / mA', { size: 4.6 });
    arcArrow(dhe, 335, 44, 15);
    const dheKnob = new Knob(bench, dhe, { x: 335, y: 50, r: 8.5, style: 'ses', name: 'CURRENT ADJ. (probe current)', wheel: 0.005, drag: 0.002 });
    txt(dhe, 335, 69, 'CURRENT', { size: 3.4 }); txt(dhe, 335, 73.5, 'ADJ.', { size: 3.4 });
    sesName(dhe, 14, 86, 1.1);
    const vB = new Socket(bench, dhe, { x: 112, y: 92, id: 'dhe.vb', color: 'black', name: 'DHE-21A VOLTAGE (−)', scale: 1.25 });
    const vR = new Socket(bench, dhe, { x: 136, y: 92, id: 'dhe.vr', color: 'red', name: 'DHE-21A VOLTAGE (+)', scale: 1.25 });
    txt(dhe, 124, 106, 'VOLTAGE', { size: 3.4 });
    const vLed = new LED(dhe, { x: 124, y: 80, r: 1.3 });
    const dsel = new Toggle(bench, dhe, { x: 190, y: 92, orient: 'h', value: false, labels: ['Voltage (mV)', 'Current (mA)'], name: 'Display select ← voltage / current →' });
    txt(dhe, 190, 82, '← →', { size: 4 });
    const iB = new Socket(bench, dhe, { x: 244, y: 92, id: 'dhe.ib', color: 'black', name: 'DHE-21A CURRENT (−)', scale: 1.25 });
    const iR = new Socket(bench, dhe, { x: 268, y: 92, id: 'dhe.ir', color: 'red', name: 'DHE-21A CURRENT (+)', scale: 1.25 });
    txt(dhe, 256, 106, 'CURRENT', { size: 3.4 });
    const iLed = new LED(dhe, { x: 256, y: 80, r: 1.3 });
    const dheOn = new Toggle(bench, dhe, { x: 355, y: 94, name: 'DHE-21A mains', onChange: (v) => {
      if (v && dheKnob.value > 0.03) ui.remark('Hall set-up switched on with CURRENT ADJ. not at minimum.', 'warn');
    } });
    txt(dhe, 355, 108, 'ON', { size: 3.4 });

    // ================= DGM-202 digital gaussmeter
    const dgm = cabinet(L.inst, 140, 224, 350, 113, { depth: 14 });
    txt(dgm, 14, 14, 'DIGITAL GAUSSMETER', { size: 7, weight: 800, anchor: 'start' });
    txt(dgm, 290, 14, 'DGM-202', { size: 6, weight: 800, fill: '#b71c1c' });
    sesLogo(dgm, 330, 14, 1.4);
    arcArrow(dgm, 38, 46, 14);
    const zeroKnob = new Knob(bench, dgm, { x: 38, y: 52, r: 8, style: 'ses', min: -1, max: 1, value: 0, name: 'ZERO ADJ.', wheel: 0.003, drag: 0.0012 });
    txt(dgm, 38, 70, 'ZERO ADJ.', { size: 3.4 });
    const dgmDisp = new Display7(dgm, { x: 168, y: 42, w: 80, h: 30, digits: 4, style: 'led' });
    txt(dgm, 168, 64, 'Gauss', { size: 4.6 });
    txt(dgm, 238, 40, 'X1', { size: 3.6 }); txt(dgm, 278, 40, 'X10', { size: 3.6 });
    const range = new Toggle(bench, dgm, { x: 258, y: 40, orient: 'h', value: true, labels: ['X10', 'X1'], name: 'RANGE' });
    txt(dgm, 258, 54, 'RANGE', { size: 3.4 });
    const ledM = new LED(dgm, { x: 128, y: 80, r: 1.3 });
    const ledP = new LED(dgm, { x: 200, y: 74, r: 1.3 });
    txt(dgm, 120, 88, 'Measurement', { size: 3, anchor: 'end' });
    txt(dgm, 200, 66, 'Probe Constant', { size: 3 }); txt(dgm, 200, 70, '', { size: 3 });
    const mode = new Toggle(bench, dgm, { x: 162, y: 90, orient: 'h', value: false, labels: ['Measurement', 'Probe constant adj.'], name: 'MODE' });
    txt(dgm, 162, 103, 'MODE', { size: 3.2 });
    circ(dgm, 200, 90, 2, { fill: '#33f', opacity: 0.6 }); txt(dgm, 200, 96, 'Adj.', { size: 2.6 });
    const dgmOn = new Toggle(bench, dgm, { x: 318, y: 90, name: 'Gaussmeter mains' });
    txt(dgm, 318, 104, 'ON', { size: 3.4 });
    sesName(dgm, 14, 100, 1);

    // ================= EMU-50 electromagnet
    const MAG = g(L.inst);
    const cx = 1130, cy = 497; // gap centre
    const shadow = rect(MAG, 830, 625, 660, 18, { fill: '#000', opacity: 0.2, r: 8 }); shadow.setAttribute('filter', 'url(#fBlur2)');
    rect(MAG, 840, 560, 640, 72, { fill: '#9da3a9', stroke: '#6f757b', sw: 1, r: 3 });
    rect(MAG, 840, 560, 640, 8, { fill: '#b8bdc2' });
    rect(MAG, 1060, 590, 170, 24, { fill: '#eaeaea', stroke: '#777', sw: 0.6, r: 2 });
    txt(MAG, 1145, 596, 'Model : EMU-50   Sr. No. 3356   CE', { size: 4.6 });
    txt(MAG, 1145, 606, 'SES INSTRUMENTS PVT. LTD.', { size: 4.2, fill: '#b71c1c' });
    // supports
    [[925, 520], [1005, 520], [1255, 520], [1335, 520]].forEach(([x, y]) => rect(MAG, x - 18, y + 22, 36, 20, { fill: '#202225', r: 2 }));
    // end blocks
    rect(MAG, 860, 470, 40, 90, { fill: 'url(#gGrayCoil)', stroke: '#777', sw: 0.8, r: 4 });
    rect(MAG, 1380, 470, 40, 90, { fill: 'url(#gGrayCoil)', stroke: '#777', sw: 0.8, r: 4 });
    // coils with flanges
    const coil = (x0, x1) => {
      rect(MAG, x0, 432, x1 - x0, 130, { fill: 'url(#gGrayCoil)', stroke: '#7a8086', sw: 0.8, r: 6 });
      rect(MAG, x0 - 4, 424, 10, 146, { fill: '#f2f2f0', stroke: '#aaa', sw: 0.8, r: 4 });
      rect(MAG, x1 - 6, 424, 10, 146, { fill: '#f2f2f0', stroke: '#aaa', sw: 0.8, r: 4 });
    };
    coil(905, 1060); coil(1200, 1375);
    // screw + handwheel
    rect(MAG, 820, 492, 45, 12, { fill: 'url(#gChrome)', stroke: '#777', sw: 0.5 });
    const poles = g(MAG);
    const drawPoles = () => {
      poles.innerHTML = '';
      const half = S.gap / 2;
      rect(poles, 1060, 470, cx - half - 1060, 54, { fill: 'url(#gChrome)', stroke: '#6d747a', sw: 0.6 });
      rect(poles, cx + half, 470, 1200 - (cx + half), 54, { fill: 'url(#gChrome)', stroke: '#6d747a', sw: 0.6 });
    };
    drawPoles();
    const wheel = new Knob(bench, MAG, { x: 812, y: 498, r: 32, style: 'ball', unitPerTurn: 8, min: 6, max: 40, value: S.gap, wheelUnits: 0.5, dragUnits: 0.05,
      name: 'Pole-gap handwheel', hint: 'turn to change the pole gap', onChange: (v) => { S.gap = v; drawPoles(); } });
    // coil terminal blocks
    const tblock = (x, n) => {
      rect(MAG, x - 22, 405, 44, 22, { fill: '#18191b', stroke: '#000', sw: 0.6, r: 2 });
      const a = new Socket(bench, MAG, { x: x - 10, y: 416, id: `mag.c${n}a`, color: 'red', name: `Coil ${n} terminal A (red)` });
      const b = new Socket(bench, MAG, { x: x + 10, y: 416, id: `mag.c${n}b`, color: 'black', name: `Coil ${n} terminal B (black)` });
      txt(MAG, x, 400, `COIL ${n}`, { size: 4.4, fill: '#333' });
      return [a, b];
    };
    tblock(980, 1); tblock(1290, 2);

    // ================= probe stand + probes (front layer)
    const ST = g(L.front);
    const standX = cx;
    const stand = g(ST);
    const ellipse = (G, x, y, rx, ry, fill) => { const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse'); e.setAttribute('cx', x); e.setAttribute('cy', y); e.setAttribute('rx', rx); e.setAttribute('ry', ry); e.setAttribute('fill', fill); G.appendChild(e); return e; };
    ellipse(stand, standX, 742, 58, 14, 'rgba(0,0,0,0.25)');
    ellipse(stand, standX, 736, 52, 13, '#111');
    ellipse(stand, standX, 731, 26, 7, '#1c1c1c');
    rect(stand, standX - 4, 340, 8, 392, { fill: 'url(#gBlackMetalH)' });
    const clampG = g(ST);
    const probeG = g(ST);
    const rotKnob = new Knob(bench, ST, { x: standX, y: 336, r: 7, style: 'black', unitPerTurn: 360, min: -720, max: 720, value: 0, wheelUnits: 1, dragUnits: 0.4,
      name: 'Probe rotation knob', hint: 'drag / scroll to rotate the probe about the stand axis (Shift = fine)', onChange: (v) => { S.theta = v; drawProbe(); } });
    const probeY = () => (S.inGap ? cy : 385);
    function drawProbe() {
      clampG.innerHTML = ''; probeG.innerHTML = '';
      const y = probeY();
      rect(clampG, standX - 9, y - 9, 18, 18, { fill: '#1d1d1d', stroke: '#000', sw: 0.6, r: 2 });
      circ(clampG, standX + 13, y, 4, { fill: 'url(#gBlackKnob)' });
      if (!S.mounted) return;
      // foreshortened strip coming toward the viewer; its apparent width changes with rotation
      const w = 5 + 7 * Math.abs(Math.cos((S.theta) * Math.PI / 180));
      const tipX = standX, tipY = y;
      const endX = standX + 78, endY = y + 86;
      if (S.mounted === 'hall') {
        poly(probeG, [[tipX - w / 2, tipY], [tipX + w / 2, tipY], [endX + w, endY], [endX - w, endY]], { fill: '#e8dcae', stroke: '#9b8f62', sw: 0.6 });
        rect(probeG, tipX - 3, tipY - 2, 6, 4, { fill: '#555' });
        txt(probeG, endX - 6, endY - 10, 'SES', { size: 4, fill: '#333', transform: `rotate(48 ${endX - 6} ${endY - 10})` });
      } else {
        poly(probeG, [[tipX - w / 2, tipY], [tipX + w / 2, tipY], [endX + w, endY], [endX - w, endY]], { fill: '#8c9196', stroke: '#555', sw: 0.6 });
        rect(probeG, endX - 7, endY - 2, 14, 18, { fill: '#6c7176', r: 3 });
      }
      bench.interactive(probeG, { tip: () => S.mounted === 'hall' ? '<b>Hall probe</b> (Ge crystal on PCB) on the stand' : '<b>Gaussmeter probe</b> on the stand', title: 'Probe stand', menu: standMenu });
    }
    // probes resting on the table
    const hallRest = g(L.table);
    rect(hallRest, 840, 800, 170, 24, { fill: '#e8dcae', stroke: '#9b8f62', sw: 0.6, r: 2 });
    rect(hallRest, 990, 808, 14, 8, { fill: '#555' });
    txt(hallRest, 900, 808, 'SES  Hall Probe (Ge)  n-type', { size: 4.2, fill: '#333' });
    txt(hallRest, 900, 817, 't = 0.50 mm     ρ = ' + P.rho.toFixed(1) + ' Ω·cm', { size: 3.8, fill: '#333' });
    bench.interactive(hallRest, { tip: '<b>Hall probe</b> (Ge crystal on a PCB). Click to mount it on the stand.', title: 'Hall probe', menu: () => [{ label: 'Mount on the probe stand', fn: () => mount('hall') }] });
    const gaussRest = g(L.table);
    rect(gaussRest, 600, 790, 120, 12, { fill: '#8c9196', stroke: '#555', sw: 0.6, r: 3 });
    rect(gaussRest, 708, 786, 30, 20, { fill: '#6c7176', r: 4 });
    txt(gaussRest, 650, 796, 'Gauss probe', { size: 4, fill: '#eee' });
    bench.interactive(gaussRest, { tip: '<b>Gaussmeter probe</b>. Click to mount it on the stand.', title: 'Gaussmeter probe', menu: () => [{ label: 'Mount on the probe stand', fn: () => mount('gauss') }] });
    const gaussCable = path(L.wires, '', { stroke: '#8d9297', sw: 3.6, cap: 'round' });
    function mount(which) {
      if (S.mounted) { ui.toast('Remove the probe already on the stand first.', 'warn'); return; }
      S.mounted = which; S.inGap = false;
      drawProbe(); updateRests(); wires.refresh();
    }
    function standMenu() {
      return [
        !S.mounted && { label: 'Mount the Hall probe', fn: () => mount('hall') },
        !S.mounted && { label: 'Mount the gaussmeter probe', fn: () => mount('gauss') },
        S.mounted && !S.inGap && { label: 'Slide probe into the centre of the pole gap', fn: () => { S.inGap = true; drawProbe(); wires.refresh(); updateRests(); } },
        S.mounted && S.inGap && { label: 'Raise probe out of the field', fn: () => { S.inGap = false; drawProbe(); wires.refresh(); updateRests(); } },
        S.mounted && { label: 'Take the probe off the stand', fn: () => { S.mounted = null; S.inGap = false; drawProbe(); updateRests(); wires.refresh(); } },
      ];
    }
    bench.interactive(stand, { tip: '<b>Probe stand</b><br><span class="tip-hint">click for options</span>', title: 'Probe stand', menu: standMenu });
    bench.interactive(clampG, { tip: '<b>Probe clamp</b><br><span class="tip-hint">click for options</span>', title: 'Probe stand', menu: standMenu });
    function hallTail() { // where the 4 leads leave the PCB
      if (S.mounted === 'hall') { const y = probeY(); return { x: standX + 80, y: y + 92 }; }
      return { x: 838, y: 812 };
    }
    function gaussTail() {
      if (S.mounted === 'gauss') { const y = probeY(); return { x: standX + 78, y: y + 104 }; }
      return { x: 600, y: 796 };
    }
    function updateRests() {
      hallRest.setAttribute('display', S.mounted === 'hall' ? 'none' : '');
      gaussRest.setAttribute('display', S.mounted === 'gauss' ? 'none' : '');
      const a = { x: 490, y: 300 }, b = gaussTail();
      gaussCable.setAttribute('d', `M${a.x},${a.y} C${a.x + 120},${a.y + 40} ${b.x - 60},${b.y + 120} ${b.x},${b.y}`);
    }
    drawProbe(); updateRests();
    // probe leads
    const leadDefs = [['hall.ip', 'Hall probe red lead (lengthwise, I+)', 'red', 0], ['hall.im', 'Hall probe black lead (lengthwise, I−)', 'black', 1], ['hall.vp', 'Hall probe yellow lead (widthwise, V+)', 'yellow', 2], ['hall.vm', 'Hall probe green lead (widthwise, V−)', 'green', 3]];
    leadDefs.forEach(([id, name, color, i]) => wires.addLead({ id, name, color, anchor: () => { const t = hallTail(); return { x: t.x - (S.mounted === 'hall' ? 0 : 0), y: t.y + i * 1.5 }; }, rest: { x: 770 + i * 16, y: 862 + (i % 2) * 6 }, restAngle: -10 + i * 6, sag: 30 }));

    // ================= physics
    function field(x) { // x = ampere-turn equivalent (A per coil, signed)
      const Bs = 9800 * Math.pow(10 / S.gap, 0.85);
      const I0 = 2.6 * Math.sqrt(S.gap / 10);
      return Bs * Math.tanh(x / I0) + 40 * x / S.gap * 10;
    }
    function magnetCurrents() {
      // nodal solution with the DPS as a current source of 1 A (topology) or the set current
      const nets = new Set();
      const ids = ['dps.pos', 'dps.neg', 'mag.c1a', 'mag.c1b', 'mag.c2a', 'mag.c2b'];
      ids.forEach(i => nets.add(wires.net(i)));
      const gnd = wires.net('dps.neg');
      const els = [
        { a: wires.net('mag.c1a'), b: wires.net('mag.c1b'), z: [2.3, 0], tag: 'c1' },
        { a: wires.net('mag.c2a'), b: wires.net('mag.c2b'), z: [2.3, 0], tag: 'c2' },
        { a: wires.net('dps.pos'), b: wires.net('dps.neg'), z: [2e4, 0], isrc: [1, 0], tag: 'src' },
      ];
      const sol = solveAC([...nets], gnd, els);
      const vout = sol.v(wires.net('dps.pos'))[0] - sol.v(wires.net('dps.neg'))[0];
      const i1 = sol.cur(els[0])[0], i2 = sol.cur(els[1])[0];
      return { vout, i1, i2 }; // per 1 A of source current
    }
    let topo = magnetCurrents();
    let lastTopoMsg = '';
    wires.onChange(() => {
      topo = magnetCurrents();
      const a = topo.i1, b = topo.i2;
      let msg = '';
      if (Math.abs(a) > 0.05 && Math.abs(b) > 0.05) {
        if (Math.sign(a) !== Math.sign(b)) msg = 'The two coils are connected so that their fields oppose — the field in the gap will be almost zero. Swap the leads on one coil.';
        else if (Math.abs(Math.abs(a) - 1) > 0.05 || Math.abs(Math.abs(b) - 1) > 0.05) msg = 'The two coils are in parallel (each one is across the supply), so each carries only part of the current. Connect them in series: DPS (+) → coil 1 A, coil 1 B → coil 2 A, coil 2 B → DPS (−).';
      }
      if (msg && msg !== lastTopoMsg) ui.remark(msg, 'warn');
      lastTopoMsg = msg;
    });

    function probeConn() {
      // which probe contacts are tied to which DHE sockets
      const map = {};
      for (const lid of ['hall.ip', 'hall.im', 'hall.vp', 'hall.vm']) {
        for (const s of ['dhe.ir', 'dhe.ib', 'dhe.vr', 'dhe.vb']) if (wires.connected(lid, s)) map[s] = lid;
      }
      return map;
    }
    let conn = probeConn();
    wires.onChange(() => { conn = probeConn(); });

    const state = { Imag: 0, B: 0, Iprobe: 0, VH: 0, Bprobe: 0, zfpNow: 0 };
    let acc = 0, heatT = 0;
    bench.addUpdater((dt, sdt) => {
      acc += dt;
      // --- magnet
      const Iset = dpsOn.value ? dpsKnob.value * 4.0 : 0;
      let Iout = 0, x = 0;
      const load = Math.abs(topo.vout); // volts per amp
      if (Iset > 0 && load < 1e3) {
        Iout = Iset;
        const comp = 32; // compliance volts
        if (load * Iout > comp) Iout = comp / load;
        x = (topo.i1 + topo.i2) / 2 * Iout;
      }
      state.Imag = Iout;
      if (Math.abs(x) > 0.15) { S.lastSign = Math.sign(x); }
      const Bf = field(x);
      S.bmax = Math.max(S.bmax, Math.abs(Bf));
      S.brem = 0.0045 * S.bmax * S.lastSign;
      state.B = Bf + S.brem * Math.exp(-Math.abs(x) / 0.4);
      if (Iout > 3.6) { heatT += sdt; if (heatT > 90) { heatT = -1e9; ui.remark('The electromagnet coils are getting hot — do not keep the current near maximum for long.', 'warn'); } }
      // --- field at probe position
      const pos = S.inGap ? 1 : (S.mounted ? 0.012 : 0.0002);
      const Bpos = state.B * pos + 0.4;
      // --- gaussmeter
      if (acc < 0.3) return;
      acc = 0;
      if (dgmOn.value) {
        ledM.set(!mode.value); ledP.set(mode.value);
        if (mode.value) dgmDisp.set('1.00');
        else {
          const Bm = (S.mounted === 'gauss' ? Bpos * Math.cos((S.theta - P.thetaG) * Math.PI / 180) : 0.4) + P.gzero + zeroKnob.value * 90 + gauss() * 0.6;
          const shown = range.value ? Bm : Bm / 10;
          dgmDisp.set(Math.abs(shown) > 1999.4 ? (shown < 0 ? '-1   ' : '1   ') : (Math.round(shown) === 0 ? '0' : Math.round(shown).toString()));
        }
      } else { dgmDisp.blank(); ledM.set(false); ledP.set(false); }
      // --- DPS display
      if (dpsOn.value) dpsDisp.set(((Iout + (P.dpsZero - S.dpsZeroCal)) * (1 + gauss() * 0.001)).toFixed(2)); else dpsDisp.blank();
      // --- Hall set-up
      if (dheOn.value) {
        const Iset2 = dheKnob.value * 8e-3; // A
        const cur = [conn['dhe.ir'], conn['dhe.ib']];
        const vol = [conn['dhe.vr'], conn['dhe.vb']];
        const isLen = (a, b) => (a === 'hall.ip' && b === 'hall.im') || (a === 'hall.im' && b === 'hall.ip');
        const isWid = (a, b) => (a === 'hall.vp' && b === 'hall.vm') || (a === 'hall.vm' && b === 'hall.vp');
        let I = 0, V = 0;
        const Bperp = (S.mounted === 'hall' ? Bpos * Math.cos((S.theta - P.theta0) * Math.PI / 180) : 0.4) * 1e-4; // tesla
        if (cur[0] && cur[1] && cur[0] !== cur[1]) {
          I = Iset2;
          if (isLen(...cur) && isWid(...vol)) {
            const sI = cur[0] === 'hall.ip' ? 1 : -1, sV = vol[0] === 'hall.vp' ? 1 : -1;
            const VH = P.RH * I * Bperp / P.t; // volts
            V = sV * sI * (VH + I * P.rmis);
          } else if (isWid(...cur) && isLen(...vol)) { // reciprocity: same magnitude, field reversed
            const sI = cur[0] === 'hall.vp' ? 1 : -1, sV = vol[0] === 'hall.ip' ? 1 : -1;
            V = sV * sI * (-P.RH * I * Bperp / P.t + I * P.rmis);
          } else if (vol[0] && vol[1]) { V = I * 160 * (Math.random() < 2 ? 1 : 1); }
          else V = 0;
          if (!(vol[0] && vol[1])) V = 0;
        }
        state.Iprobe = I;
        const vOpen = !(vol[0] && vol[1]);
        const mV = V * 1000 + offKnob.value * 12 + gauss() * 0.04 + (vOpen ? gauss() * 3 : 0);
        state.VH = mV;
        vLed.set(!dsel.value); iLed.set(dsel.value);
        if (dsel.value) dheDisp.set((I * 1000 * (1 + gauss() * 0.0008)).toFixed(2));
        else {
          const a = Math.abs(mV);
          dheDisp.set(a > 199.95 ? (mV < 0 ? '-1   ' : '1   ') : (a < 19.995 ? mV.toFixed(2) : mV.toFixed(1)));
        }
      } else { dheDisp.blank(); vLed.set(false); iLed.set(false); state.Iprobe = 0; }
    });

    const cosOk = (t0) => Math.abs(((S.theta - t0) % 180 + 270) % 180 - 90) > 87; // within 3 deg of 0 or 180
    const steps = [
      { t: 'Connect the two electromagnet coils <b>in series</b> to the DPS-50 output so that their fields add.', done: () => Math.abs(topo.i1 - 1) < 0.02 && Math.abs(topo.i2 - 1) < 0.02 || (Math.abs(topo.i1 + 1) < 0.02 && Math.abs(topo.i2 + 1) < 0.02) },
      { t: 'Switch on the DPS-50 with <i>Current Adj.</i> at minimum.', done: () => dpsOn.value && S.dpsOnOk === true },
      { t: 'Mount the gaussmeter probe on the stand and switch the gaussmeter on.', done: () => S.mounted === 'gauss' && dgmOn.value },
      { t: 'With the probe out of the field (magnet current zero) set the gaussmeter to zero with ZERO ADJ.', done: () => dgmOn.value && Math.abs(P.gzero + zeroKnob.value * 90) < 1.5 },
      { t: 'Put the probe at the centre of the pole gap and rotate it for maximum reading; record B against magnet current (Table 1).', done: () => S.mounted === 'gauss' && S.inGap && cosOk(P.thetaG) },
      { t: 'Mount the Hall probe: yellow/green (widthwise) leads to VOLTAGE, red/black (lengthwise) leads to CURRENT.', done: () => { const c = conn; return S.mounted === 'hall' && c['dhe.ir'] === 'hall.ip' && c['dhe.ib'] === 'hall.im' && c['dhe.vr'] === 'hall.vp' && c['dhe.vb'] === 'hall.vm'; } },
      { t: 'Switch on the DHE-21A and set a probe current of a few mA.', done: () => dheOn.value && state.Iprobe > 0.0015 },
      { t: 'With no field on the probe, note the zero-field potential and reduce it with OFFSET ADJ.', done: () => dheOn.value && state.Iprobe > 0.0015 && Math.abs(state.Imag) < 0.01 && Math.abs(state.VH) < 0.25 },
      { t: 'Place the Hall probe in the gap, switch on the field and rotate the probe for maximum Hall voltage.', done: () => S.mounted === 'hall' && S.inGap && cosOk(P.theta0) && Math.abs(state.Imag) > 0.2 },
      { t: 'Record V<sub>H</sub> for B±, I± (reverse the leads to reverse I or B) — Table 2.' },
      { t: 'Record V<sub>H</sub> vs B at constant probe current (Table 3) and V<sub>H</sub> vs I at constant B > 1500 G (Table 4).' },
      { t: 'Finish: bring all currents to zero and switch everything off.', done: () => !dpsOn.value && !dheOn.value && !dgmOn.value && S.bmax > 500 },
    ];
    const views = [
      { name: 'Whole bench', x: 60, y: 180, w: 1480, h: 720 },
      { name: 'Meters', x: 90, y: 200, w: 470, h: 470 },
      { name: 'Gaussmeter', x: 130, y: 200, w: 370, h: 150 },
      { name: 'Hall set-up', x: 115, y: 335, w: 400, h: 150 },
      { name: 'DPS-50', x: 90, y: 465, w: 450, h: 190 },
      { name: 'Electromagnet', x: 780, y: 330, w: 720, h: 460 },
      { name: 'Probe in gap', x: 1060, y: 440, w: 160, h: 120 },
    ];
    return { steps, views, debug: { dpsKnob, dpsOn, dheOn, dheKnob, dgmOn, zeroKnob, offKnob, dsel, range, S, state, P, mount, standMenu, rotKnob, dgmDisp, dheDisp, dpsDisp, conn: () => conn, topo: () => topo } };
  },
};
