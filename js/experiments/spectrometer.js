// Experiment: Grating spectrometer — wavelengths of Hg lines at minimum deviation
import { g, h, txt, rect, circ, line, path, poly, clamp, gauss } from '../core/svg.js';
import { Knob, Rocker, LED, Socket } from '../core/controls.js';
import { cabinet } from '../core/instruments.js';

const ICON = `<svg viewBox="0 0 200 100"><ellipse cx="100" cy="62" rx="44" ry="20" fill="#5d6168"/><ellipse cx="100" cy="58" rx="20" ry="9" fill="#2b2d31"/><rect x="40" y="28" width="58" height="12" rx="5" fill="#141414" transform="rotate(-10 98 34)"/><rect x="100" y="45" width="70" height="12" rx="5" fill="#141414" transform="rotate(25 100 50)"/><rect x="18" y="14" width="18" height="26" fill="#111"/></svg>`;
const LINES = [
  { name: 'violet', l: 404.66e-9, I: 0.45, c: '#8a4dff' },
  { name: 'blue', l: 435.83e-9, I: 1.0, c: '#4060ff' },
  { name: 'blue-green', l: 491.6e-9, I: 0.18, c: '#22d0e0' },
  { name: 'green', l: 546.07e-9, I: 1.0, c: '#52ff5a' },
  { name: 'yellow 1', l: 576.96e-9, I: 0.75, c: '#fff04a' },
  { name: 'yellow 2', l: 579.07e-9, I: 0.75, c: '#ffd83a' },
];
const D2R = Math.PI / 180;
const wrap360 = a => ((a % 360) + 360) % 360;
const wrap180 = a => ((a + 180) % 360 + 360) % 360 - 180;

export default {
  id: 'spectrometer', title: 'Grating Spectrometer', subtitle: 'Wavelengths of mercury lines and dispersive power of a grating',
  blurb: 'Student spectrometer with two verniers, transmission grating on the prism table, Hg lamp with PHYWE supply.',
  icon: ICON,
  manual: {
    aim: 'To determine the wavelengths of the spectral lines of mercury and the angular dispersive power of a diffraction grating (minimum-deviation method).',
    apparatus: ['Spectrometer with collimator, telescope, prism table with three levelling screws, graduated disc and two verniers', 'Plane transmission grating (N lines per metre, written on its holder)', 'Mercury vapour lamp in housing', 'PHYWE power supply for spectral lamps'],
    formula: `<p>Minimum deviation: 2g sin(D/2) = nλ, &nbsp; g = 1/N</p><p>Δλ = 2g cos(⟨D⟩/2)·Δ(D/2)</p><p>Dispersive power: dθ/dλ = n / (g cos(D/2))</p><p>Least count = value of 1 MSD / no. of vernier divisions</p>`,
    procedure: [
      'Focus the eyepiece on the cross-wires; then aim the telescope at a distant object (through the window) and focus it.',
      'Switch on the Hg lamp in front of the slit. Bring the telescope in line with the collimator, set a narrow slit and focus the slit image with the collimator.',
      'Lock the telescope on the direct image. Turn the graduated disc to make the vernier read zero and lock the disc.',
      'Put the grating on the prism table. Turn the telescope exactly 90°, lock it, rotate the table until the reflected slit image is on the cross-wires, and level with the two screws perpendicular to the grating.',
      'Bring the telescope back in line, set the grating roughly normal and level the spectral lines with the third screw.',
      'Note the direct-image readings φ<sub>1</sub>, φ<sub>2</sub>. For each first-order line: rotate the table until the line stops and turns back (minimum deviation), set the cross-wire on it, lock and read α<sub>1</sub>, α<sub>2</sub>. Repeat on the other side for β<sub>1</sub>, β<sub>2</sub>.',
      'Switch the lamp off and put the grating back in its box.',
    ],
    precautions: ['Never touch the grating surface — hold it by its edges.', 'Do not switch the Hg lamp on again within 10 minutes of switching it off.', 'Do not disturb the focusing once the collimator and telescope are set, or the disc once locked.', 'Lock the telescope before taking a reading.', 'Take care when a vernier crosses 0°/360°.'],
    controls: ['Drag the <b>telescope</b> to swing it round; when locked use the <b>fine-motion screw</b>.', 'Drag the <b>prism table</b> to rotate it (unlock it first).', 'Click the <b>eyepiece</b> to look through the telescope, a <b>vernier</b> magnifier to read it.', 'Click the lock screws to tighten / loosen them.'],
    link: 'https://drive.google.com/file/d/1fd3jPfgIjD__G33x6gSjCX37N80cOBO1/view',
  },
  tables: [
    { id: 'const', title: 'Constants', fields: [{ id: 'N', label: 'No. of rulings on the grating, N (lines/m)' }, { id: 'lc', label: 'Least count of spectrometer' }, { id: 'n', label: 'Order of the spectrum, n' }, { id: 'phi1', label: 'Direct image φ<sub>1</sub> (vernier 1)' }, { id: 'phi2', label: 'Direct image φ<sub>2</sub> (vernier 2)' }], cols: [{ id: 'x', label: 'Remarks' }], rows: 1 },
    { id: 'ang', title: 'Angular positions of the spectral lines', groups: [{ label: '', span: 1 }, { label: 'Left side: Vernier 1 (α<sub>1</sub>)', span: 3 }, { label: 'Vernier 2 (α<sub>2</sub>)', span: 3 }, { label: 'Right side: Vernier 1 (β<sub>1</sub>)', span: 3 }, { label: 'Vernier 2 (β<sub>2</sub>)', span: 3 }],
      cols: [{ id: 'c', label: 'Colour' }, { id: 'a1m', label: 'MSR' }, { id: 'a1v', label: 'VSD' }, { id: 'a1', label: 'Total' }, { id: 'a2m', label: 'MSR' }, { id: 'a2v', label: 'VSD' }, { id: 'a2', label: 'Total' }, { id: 'b1m', label: 'MSR' }, { id: 'b1v', label: 'VSD' }, { id: 'b1', label: 'Total' }, { id: 'b2m', label: 'MSR' }, { id: 'b2v', label: 'VSD' }, { id: 'b2', label: 'Total' }], rows: 6 },
    { id: 'D', title: 'Determination of D', cols: [{ id: 'c', label: 'Colour' }, { id: 'D1', label: 'D1 = α<sub>1</sub>−φ<sub>1</sub>' }, { id: 'D2', label: 'D2 = α<sub>2</sub>−φ<sub>2</sub>' }, { id: 'D3', label: 'D3 = β<sub>1</sub>−φ<sub>1</sub>' }, { id: 'D4', label: 'D4 = β<sub>2</sub>−φ<sub>2</sub>' }, { id: 'Dm', label: '⟨D⟩' }, { id: 'dD', label: 'ΔD' }, { id: 'lam', label: 'λ (nm)' }, { id: 'dl', label: 'Δλ (nm)' }, { id: 'disp', label: 'dθ/dλ' }], rows: 6 },
  ],

  build(ctx) {
    const { bench, ui, rand } = ctx;
    const L = bench.layers;
    const N = 6.0e5; const gC = 1 / N;
    const P = {
      e1: (rand() - 0.5) * 2.4, e2: (rand() - 0.5) * 2.4, mount: (rand() - 0.5) * 3,
      eFocus0: (rand() - 0.5) * 1.4, tFocus0: (rand() - 0.5) * 1.4, cFocus0: (rand() - 0.5) * 1.4,
    };
    const S = { phi: 22 + rand() * 30, disc: rand() * 360, table: rand() * 360, telLocked: false, fine: 0, discLocked: false, tableLocked: true,
      lampOn: false, warm: 0, offAt: -1e9, grating: 'box', distant: false, slitW: 0.9 };
    const C = { x: 800, y: 600 }; // spectrometer axis on the bench (top view)

    // ------------------------------------------------ PHYWE spectral lamp supply (front view, at the back)
    const ps = cabinet(L.inst, 380, 280, 170, 120, { depth: 22, fill: '#1e2a4a', face: '#f5f5f5', stroke: '#141d36', top: '#28355a' });
    txt(ps, 10, 12, 'Power Supply for Spectral Lamps', { size: 5, anchor: 'start', weight: 700 });
    txt(ps, 10, 19, 'Drossel für Spektrallampen', { size: 5, anchor: 'start', weight: 700 });
    txt(ps, 150, 12, 'PHYWE', { size: 6, weight: 800, fill: '#1c2f7a' });
    rect(ps, 50, 30, 40, 12, { fill: '#fff', stroke: '#333', sw: 0.6 }); txt(ps, 70, 36, 'Setup – B', { size: 4.6, weight: 700 });
    const psLed = new LED(ps, { x: 92, y: 36, r: 2, color: '#3dff6a', off: '#1d4a2a' });
    poly(ps, [[16, 100], [26, 100], [21, 91]], { fill: 'none', stroke: '#222', sw: 0.8 }); txt(ps, 21, 97.5, '!', { size: 4 });
    rect(ps, 120, 78, 30, 26, { fill: '#9fd6e6', r: 1 }); txt(ps, 135, 85, 'U=230V~', { size: 3 }); txt(ps, 135, 90, 'Spectral Lamp', { size: 2.6 }); txt(ps, 135, 94, '10…60V~/1A', { size: 2.6 });
    circ(ps, 128, 98, 3.4, { fill: '#111' }); line(ps, 60, 95, 92, 95, { stroke: '#111', sw: 2.4 });
    const psSw = new Rocker(bench, ps, { x: 158, y: 60, w: 9, h: 12, name: 'Lamp supply mains switch', lit: '#ff5a3c', onChange: v => lampSwitch(v) });
    // lamp housing at the slit (top view)
    const lampG = g(L.inst);
    rect(lampG, C.x - 26, 238, 52, 40, { fill: '#121212', stroke: '#000', sw: 0.8, r: 3 });
    for (let i = 0; i < 6; i++) rect(lampG, C.x - 20 + i * 7, 242, 4, 14, { fill: '#2a2a2a' });
    const lampWin = circ(lampG, C.x, 274, 6, { fill: '#222' });
    txt(lampG, C.x, 262, 'Hg', { size: 6, fill: '#666' });
    path(L.wires, `M${C.x + 26},250 C${C.x + 120},240 ${560},400 ${545},350`, { stroke: '#151515', sw: 3, cap: 'round' });
    function lampSwitch(v) {
      if (v) {
        const since = bench.simTime - S.offAt;
        if (since < 600) { ui.remark(`Hg lamp switched on again only ${Math.round(since)} s after switching it off. A hot lamp does not restrike — wait 10 minutes.`, 'bad'); S.lampOn = false; psSw.set(false, true); return; }
        S.lampOn = true; psLed.set(true);
      } else { if (S.lampOn) S.offAt = bench.simTime; S.lampOn = false; psLed.set(false); }
    }
    // ------------------------------------------------ base (tripod) + graduated disc + prism table (top view)
    const base = g(L.table);
    [0, 120, 240].forEach(a => { const r = a * D2R; poly(base, [[C.x + Math.sin(r - 0.25) * 30, C.y + Math.cos(r - 0.25) * 30], [C.x + Math.sin(r) * 200, C.y + Math.cos(r) * 200], [C.x + Math.sin(r + 0.25) * 30, C.y + Math.cos(r + 0.25) * 30]], { fill: '#6e7378', stroke: '#4c5054', sw: 1 }); circ(base, C.x + Math.sin(r) * 196, C.y + Math.cos(r) * 196, 12, { fill: '#7a7f84', stroke: '#4c5054', sw: 1 }); });
    circ(base, C.x, C.y, 140, { fill: '#000', opacity: 0.18 });
    const discG = g(L.table);
    function drawDisc() {
      discG.innerHTML = '';
      const dg = g(discG, { transform: `rotate(${-S.disc} ${C.x} ${C.y})` });
      circ(dg, C.x, C.y, 128, { fill: '#59605a', stroke: '#2f3330', sw: 1 });
      circ(dg, C.x, C.y, 126, { fill: 'none', stroke: '#b9b28a', sw: 7, opacity: 0.85 });
      for (let d = 0; d < 360; d += 5) {
        const r = d * D2R, r1 = 122.5, r2 = d % 10 === 0 ? 129.5 : 127;
        line(dg, C.x + Math.sin(r) * r1, C.y + Math.cos(r) * r1, C.x + Math.sin(r) * r2, C.y + Math.cos(r) * r2, { stroke: '#222', sw: 0.4 });
        if (d % 30 === 0) txt(dg, C.x + Math.sin(r) * 116, C.y + Math.cos(r) * 116, String(d), { size: 5, fill: '#e8e5d0', transform: `rotate(${-d + 180} ${C.x + Math.sin(r) * 116} ${C.y + Math.cos(r) * 116})` });
      }
    }
    drawDisc();
    bench.interactive(discG, { tip: () => `<b>Graduated disc</b> (${S.discLocked ? 'locked' : 'free'})<br><span class="tip-hint">drag to turn it when unlocked</span>` });
    dragRotate(discG, () => !S.discLocked, (d) => { S.disc = wrap360(S.disc - d); drawDisc(); }, 'The graduated disc is locked. Loosen its locking screw first.');
    // prism table
    const tableG = g(L.front);
    function drawTable() {
      tableG.innerHTML = '';
      const tg = g(tableG, { transform: `rotate(${-S.table} ${C.x} ${C.y})` });
      circ(tg, C.x, C.y, 52, { fill: '#1d1f22', stroke: '#000', sw: 1 });
      [18, 30, 42].forEach(r => circ(tg, C.x, C.y, r, { fill: 'none', stroke: '#9aa0a6', sw: 0.6 }));
      [0, 120, 240].forEach((a, i) => { const r = a * D2R; circ(tg, C.x + Math.sin(r) * 46, C.y + Math.cos(r) * 46, 4.5, { fill: 'url(#gChromeR)', stroke: '#333', sw: 0.4 }); txt(tg, C.x + Math.sin(r) * 37, C.y + Math.cos(r) * 37, String(i + 1), { size: 4, fill: '#9aa0a6' }); });
      if (S.grating === 'table') {
        const nu = S.table + 90 + P.mount; // grating normal
        const gg = g(tableG, { transform: `rotate(${-(nu - 90)} ${C.x} ${C.y})` });
        rect(gg, C.x - 28, C.y - 4, 56, 8, { fill: '#2b2b2b', r: 1.5 });
        rect(gg, C.x - 24, C.y - 1.2, 48, 2.4, { fill: 'rgba(190,220,255,0.85)' });
      }
    }
    drawTable();
    bench.interactive(tableG, { tip: () => `<b>Prism table</b> (${S.tableLocked ? 'locked' : 'free'})${S.grating === 'table' ? ' with grating' : ''}<br><span class="tip-hint">drag to rotate when unlocked · click for options</span>`,
      title: 'Prism table', menu: () => [S.grating !== 'table' ? { label: 'Place the grating in its holder on the table', fn: () => { S.grating = 'table'; drawTable(); refreshBox(); } } : { label: 'Remove the grating (back to its box)', fn: () => { S.grating = 'box'; drawTable(); refreshBox(); } }] });
    dragRotate(tableG, () => !S.tableLocked, (d) => { S.table = wrap360(S.table + d); drawTable(); }, 'The prism table is locked. Loosen its locking screw first.');
    const lev = [0, 0, 0].map((_, i) => new Knob(bench, L.front, { x: C.x - 70 + i * 0, y: C.y - 40 + i * 0, r: 0.01, style: 'tiny', min: -3, max: 3, value: 0 }));
    // levelling screws as real knobs beside the table (front view inset)
    const levG = g(L.front);
    rect(levG, C.x + 150, C.y + 120, 150, 46, { fill: 'rgba(255,255,255,0.75)', stroke: '#bbb', sw: 0.6, r: 4 });
    txt(levG, C.x + 225, C.y + 127, 'Prism-table levelling screws', { size: 4.2, fill: '#333' });
    const levK = [1, 2, 3].map((n, i) => {
      txt(levG, C.x + 180 + i * 45, C.y + 158, `screw ${n}`, { size: 3.6, fill: '#333' });
      return new Knob(bench, levG, { x: C.x + 180 + i * 45, y: C.y + 142, r: 7, style: 'chrome', unitPerTurn: 1, min: -4, max: 4, value: 0, wheelUnits: 0.02, dragUnits: 0.004, name: `Levelling screw ${n}` });
    });
    lev.forEach(k => k.el.setAttribute('display', 'none'));
    // lock screws inset
    const lockG = g(L.front);
    rect(lockG, C.x - 300, C.y + 120, 150, 70, { fill: 'rgba(255,255,255,0.75)', stroke: '#bbb', sw: 0.6, r: 4 });
    txt(lockG, C.x - 225, C.y + 127, 'Locking screws', { size: 4.2, fill: '#333' });
    const lockBtn = (x, y, label, get, set) => {
      const G = g(lockG);
      circ(G, x, y, 7, { fill: 'url(#gChromeR)', stroke: '#555', sw: 0.5 });
      const mark = line(G, x - 5, y, x + 5, y, { stroke: '#333', sw: 1.4 });
      const st = txt(G, x, y + 13, '', { size: 3.6, fill: '#333' });
      txt(G, x, y - 11, label, { size: 3.6, fill: '#333' });
      const upd = () => { mark.setAttribute('transform', get() ? `rotate(90 ${x} ${y})` : ''); st.textContent = get() ? 'tight' : 'loose'; };
      bench.interactive(G, { tip: () => `<b>${label} locking screw</b>: ${get() ? 'tight' : 'loose'}<br><span class="tip-hint">click to ${get() ? 'loosen' : 'tighten'}</span>`, click: () => { set(!get()); upd(); } });
      upd(); return upd;
    };
    const updTel = lockBtn(C.x - 275, C.y + 158, 'Telescope', () => S.telLocked, v => { S.telLocked = v; if (v) { fineK.set(0, true); S.fine = 0; } });
    lockBtn(C.x - 225, C.y + 158, 'Disc', () => S.discLocked, v => { S.discLocked = v; });
    lockBtn(C.x - 175, C.y + 158, 'Table', () => S.tableLocked, v => { S.tableLocked = v; });

    // ------------------------------------------------ collimator (fixed, pointing from the lamp to the centre)
    const col = g(L.front);
    rect(col, C.x - 13, 280, 26, 180, { fill: 'url(#gBlackMetalH)', stroke: '#000', sw: 0.8, r: 4 });
    rect(col, C.x - 16, 278, 32, 14, { fill: '#1b1b1b', r: 2 });
    rect(col, C.x - 2, 279, 4, 3, { fill: '#ddd' });
    rect(col, C.x - 8, 460, 16, 30, { fill: '#1d1d1d' });
    txt(col, C.x - 28, 350, 'COLLIMATOR', { size: 4.2, fill: '#555', transform: `rotate(-90 ${C.x - 28} 350)` });
    const slitK = new Knob(bench, col, { x: C.x + 24, y: 286, r: 6, style: 'chrome', unitPerTurn: 0.5, min: 0.02, max: 2, value: S.slitW, wheelUnits: 0.02, dragUnits: 0.004, name: 'Slit-width screw', onChange: v => S.slitW = v });
    const colFocus = new Knob(bench, col, { x: C.x + 24, y: 330, r: 6, style: 'chrome', unitPerTurn: 1.5, min: -2, max: 2, value: 0, wheelUnits: 0.02, dragUnits: 0.003, name: 'Collimator focusing (slit tube) screw' });
    txt(col, C.x + 40, 286, 'slit', { size: 3.6, anchor: 'start', fill: '#444' }); txt(col, C.x + 40, 330, 'focus', { size: 3.6, anchor: 'start', fill: '#444' });

    // ------------------------------------------------ telescope arm (rotates about the axis)
    const telG = g(L.front);
    let eyeFocus, telFocus, fineK;
    function telAngle() { return S.phi + S.fine; }
    function drawTel() {
      telG.innerHTML = '';
      const tg = g(telG, { transform: `rotate(${-telAngle()} ${C.x} ${C.y})` });
      rect(tg, C.x - 9, C.y + 60, 18, 40, { fill: '#2b2d31', r: 3 });
      rect(tg, C.x - 13, C.y + 95, 26, 190, { fill: 'url(#gBlackMetalH)', stroke: '#000', sw: 0.8, r: 5 });
      rect(tg, C.x - 9, C.y + 285, 18, 26, { fill: '#111', r: 3 });
      rect(tg, C.x - 7, C.y + 311, 14, 8, { fill: '#2a2a2a', r: 2 });
      // vernier windows at +/- 90 deg (on the arm ring)
      [-1, 1].forEach(s => { rect(tg, C.x + s * 132 - 7, C.y - 7, 14, 14, { fill: '#8d9298', stroke: '#333', sw: 0.6, r: 2 }); circ(tg, C.x + s * 132, C.y, 5, { fill: 'rgba(200,220,240,0.6)', stroke: '#222', sw: 1.2 }); });
      line(tg, C.x - 128, C.y, C.x + 128, C.y, { stroke: '#555', sw: 3, opacity: 0.45 });
      txt(tg, C.x + 20, C.y + 190, 'TELESCOPE', { size: 4.2, fill: '#666', transform: `rotate(90 ${C.x + 20} ${C.y + 190})` });
    }
    drawTel();
    bench.interactive(telG, { tip: () => `<b>Telescope</b> ${S.telLocked ? '(locked — use the fine-motion screw)' : ''}<br><span class="tip-hint">drag to swing · click for options</span>`, title: 'Telescope', menu: () => [
      { label: 'Look through the eyepiece', fn: openEye },
      { label: 'Read vernier 1', fn: () => openVernier(1) },
      { label: 'Read vernier 2', fn: () => openVernier(2) },
      !S.distant ? { label: 'Aim the telescope at a distant object (through the window)', fn: () => { S.distant = true; openEye(); } } : { label: 'Bring the telescope back to the spectrometer', fn: () => { S.distant = false; } },
    ] });
    dragRotate(telG, () => !S.telLocked, (d) => { S.phi = wrap360(S.phi + d); drawTel(); }, 'The telescope is locked. Loosen its locking screw (or use the fine-motion screw).');
    // telescope knobs (inset panel)
    const tk = g(L.front);
    rect(tk, C.x + 150, C.y + 175, 150, 52, { fill: 'rgba(255,255,255,0.75)', stroke: '#bbb', sw: 0.6, r: 4 });
    txt(tk, C.x + 225, C.y + 182, 'Telescope controls', { size: 4.2, fill: '#333' });
    eyeFocus = new Knob(bench, tk, { x: C.x + 175, y: C.y + 200, r: 7, style: 'black', unitPerTurn: 2, min: -2, max: 2, value: 0, wheelUnits: 0.02, dragUnits: 0.003, name: 'Eyepiece (cross-wire) focus' });
    telFocus = new Knob(bench, tk, { x: C.x + 225, y: C.y + 200, r: 7, style: 'chrome', unitPerTurn: 2, min: -2, max: 2, value: 0, wheelUnits: 0.02, dragUnits: 0.003, name: 'Telescope focusing knob' });
    fineK = new Knob(bench, tk, { x: C.x + 275, y: C.y + 200, r: 7, style: 'chrome', unitPerTurn: 1, min: -3, max: 3, value: 0, wheelUnits: 1 / 60, dragUnits: 0.002,
      name: 'Telescope fine-motion (tangent) screw', hint: 'works only when the telescope is locked · scroll = 1 arc-minute, Shift = finer',
      onChange: v => { if (!S.telLocked) { fineK.set(S.fine, true); ui.toast('Tighten the telescope locking screw before using the fine-motion screw.', 'warn'); return; } S.fine = v; drawTel(); } });
    txt(tk, C.x + 175, C.y + 218, 'eyepiece', { size: 3.4, fill: '#333' }); txt(tk, C.x + 225, C.y + 218, 'focus', { size: 3.4, fill: '#333' }); txt(tk, C.x + 275, C.y + 218, 'fine motion', { size: 3.4, fill: '#333' });
    // grating box
    const gbox = g(L.table);
    rect(gbox, 1180, 700, 150, 90, { fill: 'rgba(235,240,245,0.55)', stroke: '#aab4bd', sw: 1.2, r: 6 });
    rect(gbox, 1190, 708, 100, 26, { fill: '#fff', stroke: '#999', sw: 0.5 });
    txt(gbox, 1240, 716, 'Plane transmission grating', { size: 3.6 }); txt(gbox, 1240, 726, 'N = 6.0 × 10⁵ lines/m', { size: 4, weight: 800 });
    const gInBox = g(gbox); rect(gInBox, 1210, 750, 70, 14, { fill: '#2b2b2b', r: 2 }); rect(gInBox, 1216, 755, 58, 4, { fill: 'rgba(190,220,255,0.85)' });
    function refreshBox() { gInBox.setAttribute('display', S.grating === 'box' ? '' : 'none'); }
    bench.interactive(gbox, { tip: '<b>Grating box</b>', title: 'Grating', menu: () => [S.grating === 'box' ? { label: 'Place the grating on the prism table (hold by the edges)', fn: () => { S.grating = 'table'; drawTable(); refreshBox(); } } : { label: 'Put the grating back in the box', fn: () => { S.grating = 'box'; drawTable(); refreshBox(); } }] });

    function dragRotate(el, allowed, apply, msg) {
      let last = null;
      el.addEventListener('pointerdown', (e) => {
        if (!allowed()) { return; }
        e.stopPropagation(); el.setPointerCapture(e.pointerId);
        const p = bench.toWorld(e.clientX, e.clientY); last = Math.atan2(p.x - C.x, p.y - C.y) / D2R; el._moved = false;
      });
      el.addEventListener('pointermove', (e) => {
        if (last === null) return;
        const p = bench.toWorld(e.clientX, e.clientY); const a = Math.atan2(p.x - C.x, p.y - C.y) / D2R;
        let d = wrap180(a - last); last = a;
        if (e.shiftKey) d *= 0.1;
        if (Math.abs(d) > 0) { el._moved = true; apply(d); }
      });
      const up = () => { last = null; };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      el.addEventListener('click', (e) => { if (el._moved) { e.stopImmediatePropagation(); el._moved = false; } }, true);
      el.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); if (!allowed()) { ui.toast(msg, 'warn'); return; } apply((e.deltaY < 0 ? 1 : -1) * (e.shiftKey ? 0.01 : 0.1)); }, { passive: false });
      el.addEventListener('pointerdown', (e) => { if (!allowed() && e.button === 0) el._denied = true; });
    }

    // ------------------------------------------------ lamp warm-up
    bench.addUpdater((dt, sdt) => {
      if (S.lampOn) S.warm = Math.min(1, S.warm + sdt / 120); else S.warm = Math.max(0, S.warm - sdt / 20);
      lampWin.setAttribute('fill', S.lampOn ? `rgba(${160 + 60 * S.warm},${190 + 50 * S.warm},255,${0.4 + 0.6 * S.warm})` : '#222');
      lampWin.setAttribute('filter', S.lampOn ? 'url(#fGlow)' : '');
    });

    // ------------------------------------------------ optics
    function features() {
      const out = [];
      if (!S.lampOn || S.warm < 0.05) return out;
      const I0 = (0.2 + 0.8 * S.warm) * clamp(S.slitW / 0.1, 0.15, 1.6);
      const tiltN = 0.6 * (levK[0].value - levK[1].value) + P.e1; // deg
      const tau = 0.6 * (levK[2].value - (levK[0].value + levK[1].value) / 2) + P.e2; // deg
      if (S.grating !== 'table') { out.push({ b: 0, I: I0, c: '#eef2ff', v: 0 }); return out; }
      const nu = wrap180(S.table + 90 + P.mount);
      const nup = wrap180(nu) > 90 ? nu - 180 : wrap180(nu) < -90 ? nu + 180 : wrap180(nu);
      out.push({ b: 0, I: I0 * 0.55, c: '#eef2ff', v: 0 });
      // reflection off the grating face
      out.push({ b: wrap180(180 + 2 * nup), I: I0 * 0.12, c: '#e8eeff', v: 2 * tiltN });
      for (const ln of LINES) for (const m of [-2, -1, 1, 2]) {
        const s = -Math.sin(nup * D2R) + m * ln.l / gC;
        if (Math.abs(s) >= 1) continue;
        const b = nup + Math.asin(s) / D2R;
        out.push({ b: wrap180(b), I: I0 * ln.I * (Math.abs(m) === 1 ? 0.6 : 0.18), c: ln.c, v: (m * ln.l / gC) * Math.sin(tau * D2R) / D2R + 0.15 * tiltN });
      }
      return out;
    }
    function openEye() {
      ui.canvasWindow('sp-eye', 'Telescope — eyepiece view', { w: 380, h: 380,
        footer: () => { const d = document.createElement('div'); d.className = 'ctrls'; d.innerHTML = '<span class="muted">Scroll here to work the fine-motion screw (telescope must be locked).</span>'; return d; },
        onWheel: (dir, e) => { if (!S.telLocked) { ui.toast('Lock the telescope to use the fine-motion screw.', 'warn'); return; } fineK.set(fineK.value + dir * (e.shiftKey ? 1 / 600 : 1 / 60)); },
        draw: (c, W, H) => {
          const FOV = 3.0; // degrees across
          c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
          c.save(); c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 3, 0, Math.PI * 2); c.clip();
          const eBlur = Math.abs(eyeFocus.value - P.eFocus0) * 9;
          if (S.distant) {
            const blur = eBlur + Math.abs(telFocus.value - P.tFocus0) * 14;
            c.filter = `blur(${blur.toFixed(1)}px)`;
            c.fillStyle = '#9cc6e8'; c.fillRect(0, 0, W, H);
            c.fillStyle = '#d8d2c4'; c.fillRect(30, 150, 120, 230); c.fillRect(190, 110, 90, 270);
            c.fillStyle = '#6d7f63'; c.beginPath(); c.arc(320, 260, 60, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#4a5a3c'; c.fillRect(312, 260, 16, 140);
            c.fillStyle = '#7c8a99'; for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) c.fillRect(42 + i * 26, 165 + j * 34, 14, 20);
            for (let j = 0; j < 7; j++) c.fillRect(205, 125 + j * 36, 60, 18);
            c.filter = 'none';
          } else {
            const blur = eBlur + Math.abs(colFocus.value - P.cFocus0 + (telFocus.value - P.tFocus0)) * 10;
            const phi = telAngle();
            const slitAng = Math.max(0.006, S.slitW / 170 / D2R);
            for (const f of features()) {
              const dx = wrap180(f.b - phi);
              if (Math.abs(dx) > FOV) continue;
              const x = W / 2 + dx / FOV * W;
              const wpx = Math.max(1.2, slitAng / FOV * W);
              const y = H / 2 - f.v / FOV * H;
              c.filter = `blur(${(blur + 0.4).toFixed(1)}px)`;
              c.globalAlpha = clamp(f.I * 1.5, 0, 1);
              c.globalCompositeOperation = 'lighter';
              c.fillStyle = f.c;
              c.fillRect(x - wpx / 2, y - H * 0.3, wpx, H * 0.6);
              c.globalAlpha = clamp(f.I * 0.5, 0, 0.6);
              c.fillRect(x - wpx / 2 - 2, y - H * 0.3, wpx + 4, H * 0.6);
              c.globalCompositeOperation = 'source-over';
              c.globalAlpha = 1; c.filter = 'none';
            }
          }
          // cross-wires
          c.filter = `blur(${(eBlur * 0.6).toFixed(1)}px)`;
          c.strokeStyle = S.distant ? 'rgba(0,0,0,0.85)' : 'rgba(230,230,230,0.8)'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.stroke();
          c.filter = 'none';
          c.restore();
          c.strokeStyle = '#111'; c.lineWidth = 5; c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 3, 0, Math.PI * 2); c.stroke();
        } });
    }
    function openVernier(n) {
      ui.canvasWindow('sp-vern' + n, `Vernier ${n} (through its magnifier)`, { w: 560, h: 190,
        onWheel: (dir, e) => { if (S.telLocked) fineK.set(fineK.value + dir * (e.shiftKey ? 1 / 600 : 1 / 60)); },
        draw: (c, W, H) => {
          const read = wrap360(telAngle() + S.disc + (n === 2 ? 180 : 0));
          const k = 36; // px per degree
          const left = read - 2.5;
          const X = (d) => (d - left) * k;
          c.fillStyle = '#3a3e42'; c.fillRect(0, 0, W, H);
          // main scale arc (unrolled): 0.5 deg divisions
          const g1 = c.createLinearGradient(0, 20, 0, 92); g1.addColorStop(0, '#d8d2b0'); g1.addColorStop(1, '#a8a07a');
          c.fillStyle = g1; c.fillRect(0, 20, W, 72);
          c.strokeStyle = '#111'; c.fillStyle = '#111'; c.textAlign = 'center';
          for (let m = Math.floor(left * 2) / 2; m < left + W / k; m += 0.5) {
            const d = Math.round(m * 2) / 2;
            const len = d % 10 === 0 ? 30 : d % 5 === 0 ? 24 : Number.isInteger(d) ? 18 : 11;
            c.lineWidth = 1.2; c.beginPath(); c.moveTo(X(d), 92); c.lineTo(X(d), 92 - len); c.stroke();
            if (Number.isInteger(d) && d % 10 === 0) { c.font = 'bold 15px Arial'; c.fillText(String(wrap360(d)), X(d), 40); }
          }
          // vernier: 30 divisions = 29 MSD (14.5 deg), LC = 1'
          const g2 = c.createLinearGradient(0, 92, 0, 160); g2.addColorStop(0, '#cfd3d6'); g2.addColorStop(1, '#8c9399');
          c.fillStyle = g2; c.fillRect(X(read) - 16, 92, 14.5 * k + 32, 62);
          c.fillStyle = '#111';
          for (let i = 0; i <= 30; i++) {
            const vx = X(read + i * (29 / 60));
            const len = i % 10 === 0 ? 24 : i % 5 === 0 ? 18 : 11;
            c.lineWidth = 1.1; c.beginPath(); c.moveTo(vx, 92); c.lineTo(vx, 92 + len); c.stroke();
            if (i % 5 === 0) { c.font = 'bold 12px Arial'; c.fillText(String(i), vx, 132); }
          }
          c.font = '11px Arial'; c.fillText(`VERNIER ${n === 1 ? 'I' : 'II'}  (30 div)`, X(read) + 7.25 * k, 150);
          const rg = c.createRadialGradient(W / 2, H / 2, H * 0.55, W / 2, H / 2, W * 0.6);
          rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.6)');
          c.fillStyle = rg; c.fillRect(0, 0, W, H);
        } });
    }
    // vernier magnifiers on the bench are clickable via the telescope menu; add direct hotspots that follow the arm
    const hot = g(L.top);
    function placeHot() {
      hot.innerHTML = '';
      [-1, 1].forEach((s, i) => {
        const a = telAngle() * D2R;
        // arm offset vector (perpendicular): local (+-132, 0) rotated by -phi
        const x = C.x + s * 132 * Math.cos(a), y = C.y - s * 132 * Math.sin(a);
        const hs = circ(hot, x, y, 9, { fill: 'transparent' });
        bench.interactive(hs, { tip: `<b>Vernier ${i === 0 ? 1 : 2}</b> magnifier<br><span class="tip-hint">click to read</span>`, click: () => openVernier(i === 0 ? 1 : 2) });
      });
      const a = telAngle() * D2R;
      const ex = C.x + Math.sin(a) * 312, ey = C.y + Math.cos(a) * 312;
      const he = circ(hot, ex, ey, 12, { fill: 'transparent' });
      bench.interactive(he, { tip: '<b>Eyepiece</b><br><span class="tip-hint">click to look</span>', click: openEye });
    }
    placeHot();
    const _drawTel = drawTel;
    // keep hotspots in sync
    const hotTimer = setInterval(() => { if (placeHot._a !== telAngle()) { placeHot._a = telAngle(); placeHot(); } }, 150);

    const inLine = () => Math.abs(wrap180(telAngle())) < 0.05;
    const steps = [
      { t: 'Focus the eyepiece on the cross-wires.', done: () => Math.abs(eyeFocus.value - P.eFocus0) < 0.06 },
      { t: 'Aim the telescope at a distant object and focus it (telescope set for parallel rays).', done: () => Math.abs(telFocus.value - P.tFocus0) < 0.06 },
      { t: 'Switch on the Hg lamp and let it warm up.', done: () => S.lampOn && S.warm > 0.95 },
      { t: 'Telescope in line with the collimator: narrow the slit and focus its image with the collimator (do not touch the telescope focus).', done: () => !S.distant && Math.abs(colFocus.value - P.cFocus0) < 0.06 && S.slitW < 0.3 && Math.abs(wrap180(telAngle())) < 0.6 },
      { t: 'Lock the telescope on the direct image; turn the disc so vernier 1 reads 0° and lock the disc.', done: () => S.telLocked && S.discLocked && inLine() && Math.abs(wrap180(S.disc)) < 0.1 },
      { t: 'Place the grating on the prism table.', done: () => S.grating === 'table' },
      { t: 'Telescope at exactly 90°: rotate the table until the reflected slit is on the cross-wire and level it with screws 1 and 2.', done: () => S.grating === 'table' && Math.abs(0.6 * (levK[0].value - levK[1].value) + P.e1) < 0.1 },
      { t: 'Back in line, grating normal: level the spectral lines with screw 3.', done: () => S.grating === 'table' && Math.abs(0.6 * (levK[2].value - (levK[0].value + levK[1].value) / 2) + P.e2) < 0.15 },
      { t: 'For every first-order line on each side: find the minimum-deviation position, lock and read both verniers.' },
      { t: 'Switch the lamp off and return the grating to its box.', done: () => !S.lampOn && S.grating === 'box' && S.offAt > 0 },
    ];
    const views = [
      { name: 'Whole bench', x: 300, y: 200, w: 1100, h: 700 },
      { name: 'Spectrometer', x: 470, y: 230, w: 660, h: 560 },
      { name: 'Controls', x: 480, y: 700, w: 660, h: 140 },
      { name: 'Lamp supply', x: 360, y: 240, w: 220, h: 170 },
    ];
    return { steps, views, destroy: () => clearInterval(hotTimer), debug: { S, P, features, levK, eyeFocus, telFocus, colFocus, fineK, slitK, psSw, openEye, openVernier, drawTel, drawTable, drawDisc, telAngle } };
  },
};
