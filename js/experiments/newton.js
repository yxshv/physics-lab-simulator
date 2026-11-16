// Experiment: Newton's rings (INDOSAW SK008 travelling microscope, sodium lamp) + spherometer for R
import { g, txt, rect, circ, line, path, poly, clamp, gauss } from '../core/svg.js';
import { Knob, Toggle, Rocker, LED } from '../core/controls.js';
import { cabinet } from '../core/instruments.js';

const ICON = `<svg viewBox="0 0 200 100"><rect x="30" y="80" width="140" height="10" fill="#f2efe6" stroke="#aaa"/><path d="M60 80 V40 H140 V80 H125 V55 H75 V80Z" fill="#3b3e43"/><rect x="95" y="8" width="10" height="34" fill="#c9ced3"/><rect x="92" y="4" width="16" height="10" fill="#222"/><rect x="5" y="58" width="70" height="12" rx="6" fill="#111"/></svg>`;
const LAMBDA = 5.893e-4; // mm

export default {
  id: 'newton', title: "Newton's Rings", subtitle: 'Wavelength of sodium light; radius of curvature by spherometer',
  blurb: 'INDOSAW travelling microscope with 45° plate, sodium lamp, plano-convex lens, and a spherometer for R.',
  icon: ICON,
  manual: {
    aim: 'To determine the wavelength of sodium light using Newton’s rings by (a) the two-ring formula and (b) the graphical slope method, and to find the radius of curvature of the lens with a spherometer.',
    apparatus: ['Sodium vapour lamp with power supply', 'Newton’s rings set-up (INDOSAW SK008): collimator, 45° glass plate, plane glass plate, plano-convex lens', 'Travelling microscope with main scale, vernier and magnifier', 'Spherometer, plane glass plate, sheet of paper and steel scale', 'Lens tissue'],
    formula: `<p>Dark rings: D<sub>n</sub><sup>2</sup> = 4nλR</p><p>Two-ring formula: λ = (D<sub>n</sub><sup>2</sup> − D<sub>m</sub><sup>2</sup>) / [4(n−m)R]</p><p>Slope method: slope of D<sub>n</sub><sup>2</sup> vs n = 4λR</p><p>Spherometer: L.C. = pitch / no. of head divisions; h = n × L.C.; R = L<sup>2</sup>/(6h) + h/2</p><p>Travelling microscope: total = MSR + VC × L.C.</p>`,
    procedure: [
      'Switch on the sodium lamp and wait until it glows a steady bright yellow.',
      'Clean the lens and plane plate with lens tissue; place the lens convex side down on the plate.',
      'Set the inclined glass plate at 45° so the field of view is brightest.',
      'Focus the microscope (rack and pinion) until sharp dark and bright rings with a dark centre are seen.',
      'Rotate the eyepiece so one cross-wire is parallel to the direction of travel; bring the cross-wire to the centre of the rings (use the centring screw for the other direction).',
      'Turning the micrometer screw in one direction only, set the vertical cross-wire tangential to the 16th, 12th, 8th and 4th dark ring on one side, then 4th, 8th, 12th, 16th on the other side. Read main scale + vernier each time.',
      'Repeat the traverse 2–3 times.',
      'Spherometer: find its least count, press its legs on paper and measure the sides L, take reading b on the plane plate and a on the convex surface (3–4 times).',
    ],
    precautions: ['Lens and plate must be clean.', 'Move the microscope in one direction only during a traverse (backlash).', 'The cross-wire should pass through the centre of the rings.', 'Do not disturb the set-up once focused.', 'In the spherometer, stop turning the moment the tip just touches the surface.'],
    controls: ['Click the <b>eyepiece</b> to look through the microscope, the <b>magnifier</b> on the carriage to read the vernier.', 'Turn the <b>micrometer screw</b> (right end of the slide) to move the microscope. Scroll = 0.01 mm per notch, Shift = finer.', 'Click the lens box, lamp, plate holder and spherometer for their actions.'],
    link: 'https://drive.google.com/file/d/1PNefoLwSSjYalY9hTPKxAE92SEArMOxO/view',
  },
  tables: [
    { id: 'lc', title: 'Table 1: Least counts', cols: [{ id: 'i', label: 'Instrument', fixed: ['Spherometer', 'Travelling microscope'] }, { id: 'lc', label: 'Least count' }, { id: 'how', label: 'How found' }], rows: 2 },
    { id: 'L', title: 'Distance between spherometer legs', cols: [{ id: 's', label: 'Side', fixed: ['AB', 'BC', 'CA'] }, { id: 'r1', label: 'Scale reading at 1st mark (cm)' }, { id: 'r2', label: 'Scale reading at 2nd mark (cm)' }, { id: 'L', label: 'Length (cm)' }], rows: 3, fields: [{ id: 'mean', label: 'Mean L (cm)' }] },
    { id: 'sph', title: 'Table 2: Spherometer readings for R', fields: [{ id: 'h', label: 'Mean h (cm)' }, { id: 'R', label: 'R (cm)' }], cols: [{ id: 'n', label: 'Trial', fixed: [] }, { id: 'a', label: 'Reading on convex surface, a' }, { id: 'b', label: 'Reading on plane surface, b' }, { id: 'nn', label: 'n = a−b (div)' }, { id: 'h', label: 'h = n×L.C. (cm)' }], rows: 4 },
    { id: 'rings', title: 'Table 3: Microscope readings for ring diameter', groups: [{ label: '', span: 1 }, { label: 'Right end (a)', span: 3 }, { label: 'Left end (b)', span: 3 }, { label: '', span: 2 }], cols: [{ id: 'n', label: 'Ring order n' }, { id: 'ra', label: 'MSR (cm)' }, { id: 'rv', label: 'VSR' }, { id: 'rt', label: 'Total (cm)' }, { id: 'la', label: 'MSR (cm)' }, { id: 'lv', label: 'VSR' }, { id: 'lt', label: 'Total (cm)' }, { id: 'D', label: 'D = |a−b| (cm)' }, { id: 'D2', label: 'D² (cm²)' }], rows: 8, plot: { x: 'n', y: 'D2', fit: true, label: 'D² vs n' } },
    { id: 'res', title: 'Results', fields: [{ id: 'R', label: 'Radius of curvature R (cm)' }, { id: 'l1', label: 'λ (two-ring formula) (Å)' }, { id: 'l2', label: 'λ (slope method) (Å)' }, { id: 'err', label: 'Percentage error (%)' }], cols: [{ id: 'x', label: 'Remarks' }], rows: 1 },
  ],

  build(ctx) {
    const { bench, wires, ui, rand } = ctx;
    const L = bench.layers;
    const P = {
      R: 600 + rand() * 300, // mm
      x0: 72 + rand() * 25, // ring centre on scale (mm)
      z0: 17 + rand() * 6, // focus height
      t0clean: rand() * 0.06e-3, t0dirty: 0.12e-3 + rand() * 0.08e-3,
      legs: [35 + (rand() - 0.5) * 0.6, 35 + (rand() - 0.5) * 0.6, 35 + (rand() - 0.5) * 0.6],
      c0: 2 + rand() * 4, // spherometer zero offset (mm)
      tilt0: (rand() < 0.5 ? -1 : 1) * (4 + rand() * 8),
      ruler0: 3 + rand() * 9,
    };
    const S = {
      lampOn: false, warm: 0, plate: 45 + (rand() < 0.5 ? -1 : 1) * (6 + rand() * 6), z: 8, xc: 30, screw: 30, yoff: (rand() - 0.5) * 1.6,
      lens: 'box', clean: false, tilt: P.tilt0, spher: 'table', spherS: 3, paper: false,
    };
    S.z = P.z0 + (rand() < 0.5 ? -1 : 1) * (3 + rand() * 3); // start a few mm out of focus
    S.screw = S.xc = P.x0 + (rand() < 0.5 ? -1 : 1) * (2 + rand() * 3); // microscope roughly over the lens

    // ------------------------------------------------ sodium lamp power supply
    const ps = cabinet(L.inst, 120, 470, 230, 130, { depth: 16, fill: '#24314f', face: '#e9ecf2', stroke: '#18223a' });
    txt(ps, 115, 20, 'SODIUM VAPOUR LAMP', { size: 7, weight: 800, fill: '#1c2b55' });
    txt(ps, 115, 30, 'Power supply  220 V AC  /  35 W', { size: 4, fill: '#333' });
    for (let i = 0; i < 9; i++) line(ps, 40 + i * 7, 52, 40 + i * 7, 90, { stroke: '#9aa2b4', sw: 2.4, cap: 'round' });
    const psLed = new LED(ps, { x: 180, y: 55, r: 2.2, color: '#ffb300', off: '#5a4210' });
    txt(ps, 180, 63, 'LAMP', { size: 3.4 });
    const psSw = new Rocker(bench, ps, { x: 180, y: 90, name: 'Sodium lamp mains', lit: '#ff5a3c', onChange: v => { S.lampOn = v; psLed.set(v); if (!v) S.warm = Math.min(S.warm, 0.3); } });
    txt(ps, 180, 106, 'ON / OFF', { size: 3.4 });
    // ------------------------------------------------ base board
    rect(L.back, 470, 600, 640, 42, { fill: '#f3f0e6', stroke: '#b7b09f', sw: 1 });
    rect(L.back, 470, 636, 640, 6, { fill: '#c7b892' });
    // sodium lamp + collimator tube (black, lying horizontally into the arch)
    const tube = g(L.inst);
    rect(tube, 330, 525, 330, 48, { fill: 'url(#gBlackMetal)', stroke: '#000', sw: 0.8, r: 22 });
    rect(tube, 322, 522, 16, 54, { fill: '#151515', r: 6 });
    circ(tube, 500, 549, 3, { fill: '#888' });
    txt(tube, 420, 549, 'Na', { size: 6, fill: '#666' });
    this_glowSetup();
    function this_glowSetup() {}
    const glow = rect(tube, 640, 530, 20, 38, { fill: '#ffcc33', opacity: 0, r: 8 });
    glow.setAttribute('filter', 'url(#fGlow)');
    bench.interactive(tube, { tip: '<b>Sodium lamp housing + collimator</b> (convex lens inside makes the light parallel)', click: () => {} });
    // ------------------------------------------------ arch stand (INDOSAW)
    const A = g(L.inst);
    const ax = 640, aw = 260;
    rect(A, ax, 405, aw, 36, { fill: '#3a3d42', stroke: '#1e2023', sw: 1, r: 2 });
    path(A, `M${ax},441 V600 H${ax + 48} V520 Q${ax + aw / 2},455 ${ax + aw - 48},520 V600 H${ax + aw} V441 Z`, { fill: '#3a3d42', stroke: '#1e2023', sw: 1 });
    txt(A, ax + aw - 40, 470, 'INDOSAW', { size: 7, fill: '#d0d3d8', weight: 800, ls: 0.5 });
    // levelling spikes
    [[ax + 4, 590], [ax + aw - 4, 590]].forEach(([x, y]) => poly(A, [[x - 6, y], [x + 6, y], [x, y + 14]], { fill: 'url(#gChrome)' }));
    // slide rods & main scale
    rect(A, ax + 10, 412, aw - 20, 6, { fill: 'url(#gChrome)' });
    const scaleX0 = ax + 35; // 0 mm of the main scale (1 unit = 1 mm)
    rect(A, scaleX0 - 12, 426, 200, 12, { fill: 'url(#gChrome)', stroke: '#777', sw: 0.5, r: 1 });
    for (let mm = 0; mm <= 170; mm += 1) {
      const x = scaleX0 + mm;
      line(A, x, 426, x, 426 + (mm % 10 === 0 ? 6 : mm % 5 === 0 ? 4 : 2.5), { stroke: '#222', sw: 0.25 });
      if (mm % 10 === 0) txt(A, x, 435, String(mm / 10), { size: 3.2, fill: '#222' });
    }
    circ(A, scaleX0 - 8, 432, 2, { fill: '#999' }); circ(A, scaleX0 + 184, 432, 2, { fill: '#999' });
    // lens / plate assembly under the arch
    const LP = g(L.inst);
    const lpx = ax + aw / 2, lpy = 590;
    rect(LP, lpx - 46, lpy, 92, 10, { fill: '#2b2d31', r: 2 });
    rect(LP, lpx - 40, lpy - 4, 80, 4, { fill: 'url(#gGlass)', stroke: '#7aa', sw: 0.4 });
    const lensG = g(LP);
    // 45 degree plate on a holder
    const plateG = g(LP);
    rect(LP, lpx + 46, lpy - 70, 6, 70, { fill: '#2b2d31' });
    const plateKnob = new Knob(bench, LP, { x: lpx + 49, y: lpy - 62, r: 5, style: 'black', min: 25, max: 65, value: S.plate, wheel: 0.005, drag: 0.004, name: 'Glass-plate inclination screw', onChange: v => { S.plate = v; drawPlate(); } });
    function drawPlate() {
      plateG.innerHTML = '';
      const a = S.plate * Math.PI / 180;
      const len = 36;
      const c = { x: lpx, y: lpy - 52 };
      line(plateG, c.x - Math.cos(a) * len, c.y + Math.sin(a) * len, c.x + Math.cos(a) * len, c.y - Math.sin(a) * len, { stroke: 'rgba(180,220,255,0.9)', sw: 2.2 });
    }
    drawPlate();
    const centreKnob = new Knob(bench, LP, { x: lpx - 52, y: lpy + 5, r: 4.5, style: 'chrome', unitPerTurn: 0.5, min: -2, max: 2, value: S.yoff, wheelUnits: 0.01, dragUnits: 0.002, name: 'Centring screw (moves the lens–plate assembly front/back)', onChange: v => { S.yoff = v; } });
    function drawLens() {
      lensG.innerHTML = '';
      if (S.lens === 'down') path(lensG, `M${lpx - 26},${lpy - 4} Q${lpx},${lpy + 3} ${lpx + 26},${lpy - 4} L${lpx + 26},${lpy - 12} L${lpx - 26},${lpy - 12} Z`, { fill: 'rgba(200,230,250,0.6)', stroke: '#6a9', sw: 0.6 });
      if (S.lens === 'up') path(lensG, `M${lpx - 26},${lpy - 4} L${lpx + 26},${lpy - 4} L${lpx + 26},${lpy - 8} Q${lpx},${lpy - 18} ${lpx - 26},${lpy - 8} Z`, { fill: 'rgba(200,230,250,0.6)', stroke: '#6a9', sw: 0.6 });
    }
    bench.interactive(LP, { tip: '<b>Glass plate + lens assembly</b> under the microscope', title: 'Lens & plate', menu: lensMenu });
    // ------------------------------------------------ carriage + microscope (moves with S.xc)
    const CAR = g(L.inst);
    const micro = g(CAR);
    // body
    rect(micro, -22, 400, 44, 22, { fill: '#26282c', stroke: '#000', sw: 0.8, r: 2 });
    rect(micro, -4, 418, 8, 10, { fill: '#26282c' });
    // vernier plate
    rect(micro, -2, 438, 30, 10, { fill: 'url(#gChrome)', stroke: '#666', sw: 0.4 });
    for (let i = 0; i <= 10; i++) line(micro, i * 2.45, 438, i * 2.45, 441, { stroke: '#222', sw: 0.2 });
    // magnifier
    const mag = g(micro);
    line(mag, 12, 448, 14, 458, { stroke: '#222', sw: 2 });
    circ(mag, 15, 462, 7, { fill: 'rgba(200,220,240,0.5)', stroke: '#111', sw: 2 });
    bench.interactive(mag, { tip: '<b>Magnifier</b> over the vernier<br><span class="tip-hint">click to read the scale</span>', click: () => openVernier() });
    // pillar and microscope tube
    const tubeG = g(micro);
    function drawTube() {
      tubeG.innerHTML = '';
      const up = (S.z - 20) * 1.2;
      rect(tubeG, -6, 300 - up, 12, 100 + up, { fill: 'url(#gChromeH)', stroke: '#777', sw: 0.5 });
      rect(tubeG, -9, 250 - up, 18, 70, { fill: 'url(#gBlackMetalH)', stroke: '#000', sw: 0.5, r: 1 });
      rect(tubeG, -7.5, 228 - up, 15, 24, { fill: 'url(#gChromeH)', stroke: '#666', sw: 0.5 });
      rect(tubeG, -9, 222 - up, 18, 8, { fill: '#111', r: 2 });
      tubeG._eyeY = 222 - up;
    }
    drawTube();
    const eye = g(micro);
    function placeEye() { eye.innerHTML = ''; const r = rect(eye, -12, tubeG._eyeY - 4, 24, 34, { fill: 'transparent' }); }
    placeEye();
    bench.interactive(eye, { tip: '<b>Eyepiece</b><br><span class="tip-hint">click to look through the microscope</span>', click: () => openScope() });
    rect(micro, 12, 335, 14, 10, { fill: '#26282c' });
    const focusKnob = new Knob(bench, micro, { x: 34, y: 340, r: 11, style: 'chrome', unitPerTurn: 8, min: 0, max: 40, value: S.z, wheelUnits: 0.25, dragUnits: 0.05, name: 'Rack & pinion focusing knob', hint: 'scroll / drag to raise or lower the microscope (0.25 mm per notch, Shift = 0.025 mm)', onChange: v => { S.z = v; drawTube(); placeEye(); } });
    function placeCarriage() { CAR.setAttribute('transform', `translate(${scaleX0 + S.xc},0)`); }
    placeCarriage();
    // micrometer screw at the right end of the slide
    rect(L.inst, ax + aw - 6, 414, 30, 5, { fill: 'url(#gChrome)' });
    const screw = new Knob(bench, L.inst, { x: ax + aw + 32, y: 418, r: 11, style: 'drum', unitPerTurn: 1, min: 6, max: 165, value: S.screw, wheelUnits: 0.01, dragUnits: 0.02,
      name: 'Horizontal micrometer screw (moves the microscope)', hint: 'scroll: 0.01 mm per notch, Shift = finer · drag for coarse',
      onChange: v => {
        const b = 0.03; // backlash (mm)
        S.screw = v;
        if (v - S.xc > b) S.xc = v - b; else if (S.xc - v > b) S.xc = v + b;
        placeCarriage();
      } });
    S.xc = S.screw;

    // ------------------------------------------------ lens box, tissue, spherometer, plane plate, paper
    const box = g(L.table);
    rect(box, 1150, 690, 190, 100, { fill: 'rgba(235,240,245,0.55)', stroke: '#aab4bd', sw: 1.2, r: 6 });
    rect(box, 1160, 700, 120, 34, { fill: '#fff', stroke: '#999', sw: 0.6 });
    txt(box, 1220, 709, "Newton's Rings (15-C)", { size: 4.4, fill: '#333' });
    txt(box, 1220, 718, 'Torch, spherometer, plano-convex lens', { size: 3.2, fill: '#555' });
    const boxLens = g(box);
    circ(boxLens, 1310, 755, 18, { fill: 'rgba(200,230,250,0.6)', stroke: '#6a9', sw: 0.8 });
    circ(boxLens, 1304, 749, 6, { fill: '#fff', opacity: 0.6 });
    bench.interactive(box, { tip: '<b>Accessory box</b> with the plano-convex lens and lens tissue', title: 'Plano-convex lens', menu: lensMenu });
    const tissue = g(L.table);
    rect(tissue, 1000, 700, 70, 48, { fill: '#fafafa', stroke: '#ccc', sw: 0.6, r: 2 });
    txt(tissue, 1035, 724, 'lens tissue', { size: 4.2, fill: '#888' });
    bench.interactive(tissue, { tip: '<b>Lens tissue</b>', title: 'Lens tissue', menu: () => [{ label: 'Clean the plano-convex lens and the plane glass plate', fn: () => { S.clean = true; ui.toast('Lens and plate wiped clean.', 'ok'); } }] });
    const pplate = g(L.table);
    rect(pplate, 1360, 820, 150, 50, { fill: 'rgba(200,225,240,0.5)', stroke: '#8aa', sw: 1, r: 2 });
    txt(pplate, 1435, 845, 'plane glass plate', { size: 4, fill: '#567' });
    const paper = g(L.table);
    rect(paper, 1180, 820, 150, 60, { fill: '#fffef8', stroke: '#ddd', sw: 0.8 });
    const paperMarks = g(paper);
    txt(paper, 1255, 873, 'paper', { size: 3.6, fill: '#aaa' });
    bench.interactive(paper, { tip: '<b>Sheet of paper</b>', title: 'Paper', menu: () => [S.paper && { label: 'Measure the leg marks with the steel scale', fn: openRuler }, { label: 'Press the spherometer legs on the paper', fn: () => setSpher('paper') }] });
    const steel = g(L.table);
    rect(steel, 1180, 885, 300, 10, { fill: 'url(#gChrome)', stroke: '#777', sw: 0.5 });
    for (let i = 0; i <= 290; i += 2) line(steel, 1185 + i, 885, 1185 + i, 885 + (i % 10 === 0 ? 5 : 2.5), { stroke: '#333', sw: 0.2 });
    bench.interactive(steel, { tip: '<b>Steel scale</b>', title: 'Steel scale', menu: () => [S.paper ? { label: 'Measure the leg marks on the paper', fn: openRuler } : { label: 'Nothing to measure yet (press the spherometer on paper first)', fn: () => {}, disabled: true }] });
    // spherometer
    const SPH = g(L.front);
    function drawSpher() {
      SPH.innerHTML = '';
      const pos = { table: [1550, 830], plane: [1435, 815], lens: [1310, 730], paper: [1255, 815] }[S.spher];
      const [x, y] = pos;
      line(SPH, x - 28, y, x - 18, y - 22, { stroke: '#555', sw: 2 }); line(SPH, x + 28, y, x + 18, y - 22, { stroke: '#555', sw: 2 }); line(SPH, x, y + 3, x, y - 22, { stroke: '#444', sw: 2 });
      path(SPH, `M${x - 20},${y - 22} L${x + 20},${y - 22} L${x},${y - 30} Z`, { fill: '#6b7177', stroke: '#333', sw: 0.6 });
      rect(SPH, x - 2, y - 52, 4, 34, { fill: 'url(#gChromeH)' });
      rect(SPH, x - 22, y - 50, 3, 26, { fill: '#ddd', stroke: '#777', sw: 0.3 });
      rect(SPH, x - 20, y - 55, 40, 4, { fill: 'url(#gChrome)', stroke: '#666', sw: 0.4 });
      rect(SPH, x - 5, y - 64, 10, 9, { fill: '#2a2a2a', r: 1.5 });
    }
    drawSpher();
    bench.interactive(SPH, { tip: '<b>Spherometer</b> (pitch 1 mm, 100 head divisions)<br><span class="tip-hint">click for options</span>', title: 'Spherometer', menu: () => [
      { label: 'Look closely / turn the head', fn: openSpher },
      S.spher !== 'plane' && { label: 'Place it on the plane glass plate', fn: () => setSpher('plane') },
      S.spher !== 'lens' && { label: 'Place it on the convex surface of the lens', fn: () => (S.lens === 'table' ? setSpher('lens') : ui.toast('Put the lens on the bench, convex side up, first (click the lens box).', 'warn')) },
      S.spher !== 'paper' && { label: 'Press its legs on the sheet of paper', fn: () => setSpher('paper') },
      S.spher !== 'table' && { label: 'Put it down on the bench', fn: () => setSpher('table') },
    ] });
    function setSpher(where) {
      S.spher = where;
      if (where === 'paper') {
        S.paper = true;
        paperMarks.innerHTML = '';
        [[1225, 840], [1285, 840], [1255, 812]].forEach(([x, y]) => circ(paperMarks, x, y, 1.4, { fill: '#444' }));
        ui.toast('The three legs left small marks on the paper.');
      }
      drawSpher();
    }

    function lensMenu() {
      return [
        S.lens !== 'down' && { label: 'Place lens on the glass plate under the microscope, convex side DOWN', fn: () => { S.lens = 'down'; drawLens(); refreshBox(); } },
        S.lens !== 'up' && { label: 'Place lens on the glass plate, convex side UP', fn: () => { S.lens = 'up'; drawLens(); refreshBox(); } },
        S.lens !== 'table' && { label: 'Put lens on the bench, convex side up (for the spherometer)', fn: () => { S.lens = 'table'; drawLens(); refreshBox(); } },
        S.lens !== 'box' && { label: 'Return the lens to its box', fn: () => { S.lens = 'box'; if (S.spher === 'lens') setSpher('table'); drawLens(); refreshBox(); } },
        { label: 'Clean the lens and plate with lens tissue', fn: () => { S.clean = true; ui.toast('Lens and plate wiped clean.', 'ok'); } },
      ];
    }
    const tableLens = g(L.table);
    function refreshBox() {
      boxLens.setAttribute('display', S.lens === 'box' ? '' : 'none');
      tableLens.innerHTML = '';
      if (S.lens === 'table') { path(tableLens, `M1284,762 Q1310,725 1336,762 Z`, { fill: 'rgba(200,230,250,0.7)', stroke: '#6a9', sw: 0.8 }); bench.interactive(tableLens, { tip: '<b>Plano-convex lens</b> (convex side up)', title: 'Lens', menu: lensMenu }); }
    }
    refreshBox(); drawLens();

    // ------------------------------------------------ lamp warm-up
    bench.addUpdater((dt, sdt) => {
      if (S.lampOn) S.warm = Math.min(1, S.warm + sdt / 150); else S.warm = Math.max(0, S.warm - sdt / 30);
      glow.setAttribute('opacity', S.lampOn ? 0.3 + 0.7 * S.warm : 0);
      glow.setAttribute('fill', lampColor());
    });
    function lampColor() {
      const w = S.warm;
      const r = 255, gg = Math.round(60 + 150 * w), b = Math.round(70 - 40 * w);
      return `rgb(${r},${gg},${b})`;
    }

    // ------------------------------------------------ microscope view
    const VIEW = 360, FOV = 2.9; // mm across the field
    const img = document.createElement('canvas'); img.width = VIEW; img.height = VIEW;
    const ictx = img.getContext('2d');
    let lastKey = '';
    function renderField() {
      const bright = S.lampOn ? (0.15 + 0.85 * S.warm) * Math.exp(-Math.pow((S.plate - 45) / 5.5, 2)) : 0;
      const key = [S.xc.toFixed(4), S.yoff.toFixed(4), S.z.toFixed(3), bright.toFixed(3), S.lens, S.clean, S.warm.toFixed(2)].join('|');
      if (key === lastKey) return;
      lastKey = key;
      const id = ictx.createImageData(VIEW, VIEW);
      const d = id.data;
      const sc = VIEW / FOV;
      const Xc = S.xc - P.x0; // crosswire position relative to ring centre (mm)
      const sigma = Math.abs(S.z - P.z0) * 0.035; // blur (mm): rings fade in as you approach focus
      const t0 = S.clean ? P.t0clean : P.t0dirty;
      const col = S.warm;
      const cr = 255, cg = 120 + 95 * col, cb = 40 * (1 - col) + 10;
      for (let j = 0; j < VIEW; j++) {
        const Y = S.yoff + (j - VIEW / 2) / sc;
        for (let i = 0; i < VIEW; i++) {
          const X = Xc + (i - VIEW / 2) / sc;
          const dx = (i - VIEW / 2), dy = (j - VIEW / 2);
          const k = (j * VIEW + i) * 4;
          if (dx * dx + dy * dy > (VIEW / 2) * (VIEW / 2)) { d[k + 3] = 255; continue; }
          let I = 0.55;
          if (S.lens === 'down') {
            const r2 = X * X + Y * Y, r = Math.sqrt(r2);
            const t = r2 / (2 * P.R) + t0;
            const f = 2 * r / (LAMBDA * P.R);
            const V = 0.95 * Math.exp(-r / 10) * Math.exp(-2 * 9.87 * sigma * sigma * f * f);
            I = 0.5 * (1 + V * Math.cos(4 * Math.PI * t / LAMBDA + Math.PI));
          } else if (S.lens === 'up') I = 0.5;
          let vig = 1 - 0.35 * (dx * dx + dy * dy) / (VIEW * VIEW / 4);
          const v = I * bright * vig;
          d[k] = cr * v; d[k + 1] = cg * v; d[k + 2] = cb * v; d[k + 3] = 255;
        }
      }
      ictx.putImageData(id, 0, 0);
      // dust specks (blurred by defocus)
      if (!S.clean && S.lens !== 'box' && bright > 0) {
        ictx.fillStyle = 'rgba(0,0,0,0.55)';
        [[0.3, 0.2, 2.2], [-0.55, 0.4, 1.6], [0.9, -0.6, 2.6], [-0.2, -0.85, 1.8], [1.4, 0.9, 2]].forEach(([x, y, r]) => {
          const px = VIEW / 2 + (x - Xc) * sc, py = VIEW / 2 + (y - S.yoff) * sc;
          ictx.beginPath(); ictx.arc(px, py, r + sigma * 30, 0, Math.PI * 2); ictx.fill();
        });
      }
    }
    function openScope() {
      const footer = () => {
        const d = document.createElement('div'); d.className = 'ctrls';
        const s = document.createElement('span'); s.className = 'muted'; s.textContent = 'Raise or lower the microscope until the rings look sharpest. Buttons repeat while held; on a computer you can also scroll in the view to turn the screw (Shift = finer).'; d.appendChild(s);
        return d;
      };
      const mv = (d) => () => screw.set(screw.value + d);
      const fz = (d) => () => focusKnob.set(focusKnob.value + d);
      const buttons = [
        { label: 'Micrometer screw:', items: [['◀ 0.1', mv(-0.1)], ['◀ 0.01', mv(-0.01)], ['◀ .001', mv(-0.001)], ['.001 ▶', mv(0.001)], ['0.01 ▶', mv(0.01)], ['0.1 ▶', mv(0.1)]] },
        { label: 'Focus (mm):', items: [['▲ 1', fz(1)], ['▲ 0.1', fz(0.1)], ['▲ 0.02', fz(0.02)], ['▼ 0.02', fz(-0.02)], ['▼ 0.1', fz(-0.1)], ['▼ 1', fz(-1)]] },
        { label: 'Eyepiece rotation:', items: [['⟲ 1°', () => { S.tilt -= 1; }], ['⟲ 0.2°', () => { S.tilt -= 0.2; }], ['0.2° ⟳', () => { S.tilt += 0.2; }], ['1° ⟳', () => { S.tilt += 1; }]] },
        { label: 'Centring screw:', items: [['front 0.1', () => centreKnob.set(centreKnob.value - 0.1)], ['front 0.01', () => centreKnob.set(centreKnob.value - 0.01)], ['back 0.01', () => centreKnob.set(centreKnob.value + 0.01)], ['back 0.1', () => centreKnob.set(centreKnob.value + 0.1)]] },
      ];
      ui.canvasWindow('ns-scope', 'Travelling microscope — eyepiece view', { w: 360, h: 360, footer, buttons,
        onWheel: (dir, e) => screw.set(screw.value + dir * (e.shiftKey ? 0.001 : 0.01)),
        draw: (c, W, H) => {
          renderField();
          c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
          c.save(); c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2); c.clip();
          c.imageSmoothingEnabled = true; c.drawImage(img, 0, 0, W, H);
          // cross-wires (sharpness follows the eyepiece; always sharp here)
          c.translate(W / 2, H / 2); c.rotate(S.tilt * Math.PI / 180);
          c.strokeStyle = 'rgba(20,10,0,0.9)'; c.lineWidth = 0.9;
          c.beginPath(); c.moveTo(-W, 0); c.lineTo(W, 0); c.moveTo(0, -H); c.lineTo(0, H); c.stroke();
          c.restore();
          c.strokeStyle = '#111'; c.lineWidth = 4; c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2); c.stroke();
        } });
    }
    // ------------------------------------------------ vernier through magnifier
    function openVernier() {
      const mv = (d) => () => screw.set(screw.value + d);
      ui.canvasWindow('ns-vernier', 'Main scale and vernier (through the magnifier)', { w: 560, h: 200,
        buttons: [{ label: 'Micrometer screw:', items: [['◀ 1', mv(-1)], ['◀ 0.1', mv(-0.1)], ['◀ 0.01', mv(-0.01)], ['0.01 ▶', mv(0.01)], ['0.1 ▶', mv(0.1)], ['1 ▶', mv(1)]] }],
        onWheel: (dir, e) => screw.set(screw.value + dir * (e.shiftKey ? 0.001 : 0.01)),
        draw: (c, W, H) => {
          const k = 18; // px per mm
          const x = S.xc; // reading in mm
          const left = x - 3;
          const X = (mm) => (mm - left) * k;
          c.fillStyle = '#5a5e63'; c.fillRect(0, 0, W, H);
          // main scale (steel)
          const g1 = c.createLinearGradient(0, 30, 0, 100); g1.addColorStop(0, '#f1f3f4'); g1.addColorStop(1, '#b8bec3');
          c.fillStyle = g1; c.fillRect(0, 30, W, 70);
          c.strokeStyle = '#111'; c.fillStyle = '#111'; c.font = 'bold 15px Arial'; c.textAlign = 'center';
          for (let m = Math.floor(left * 2) / 2; m < left + W / k; m += 0.5) {
            const mm = Math.round(m * 2) / 2;
            const len = mm % 10 === 0 ? 34 : mm % 5 === 0 ? 26 : Number.isInteger(mm) ? 20 : 12;
            c.lineWidth = 1.2; c.beginPath(); c.moveTo(X(mm), 100); c.lineTo(X(mm), 100 - len); c.stroke();
            if (mm % 10 === 0) c.fillText(String(mm / 10), X(mm), 52);
          }
          c.font = '11px Arial'; c.textAlign = 'left'; c.fillText('cm', 6, 44);
          // vernier plate
          const g2 = c.createLinearGradient(0, 100, 0, 170); g2.addColorStop(0, '#dfe3e6'); g2.addColorStop(1, '#a7aeb4');
          c.fillStyle = g2; c.fillRect(X(x) - 20, 100, 25 * k + 40, 66);
          c.fillStyle = '#111'; c.font = 'bold 13px Arial'; c.textAlign = 'center';
          for (let i = 0; i <= 50; i++) {
            const vx = X(x + i * 0.49);
            const len = i % 10 === 0 ? 26 : i % 5 === 0 ? 20 : 12;
            c.lineWidth = 1.1; c.beginPath(); c.moveTo(vx, 100); c.lineTo(vx, 100 + len); c.stroke();
            if (i % 10 === 0) c.fillText(String(i), vx, 142);
            else if (i % 5 === 0) { c.font = '10px Arial'; c.fillText(String(i), vx, 138); c.font = 'bold 13px Arial'; }
          }
          c.font = '11px Arial'; c.fillText('VERNIER  (50 div)', X(x) + 12.25 * k, 160);
          // magnifier rim
          const rg = c.createRadialGradient(W / 2, H / 2, H * 0.6, W / 2, H / 2, W * 0.62);
          rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.65)');
          c.fillStyle = rg; c.fillRect(0, 0, W, H);
        } });
    }
    // ------------------------------------------------ spherometer close-up
    function spherSurface() { // depth of surface below leg plane at the centre (mm)
      if (S.spher === 'plane' || S.spher === 'paper' || S.spher === 'table') return 0;
      const Lm = (P.legs[0] + P.legs[1] + P.legs[2]) / 3;
      const rc = Lm / Math.sqrt(3);
      return -(P.R - Math.sqrt(P.R * P.R - rc * rc));
    }
    function openSpher() {
      const footer = () => {
        const d = document.createElement('div'); d.className = 'ctrls';
        d.innerHTML = '<span class="muted">Scroll or drag in the picture to turn the milled head (1 notch = 1 head division; Shift = 0.1 division).</span>';
        return d;
      };
      const hd = (d) => () => { S.spherS = clamp(S.spherS + d, 0, 9); };
      ui.canvasWindow('ns-spher', 'Spherometer — close-up', { w: 600, h: 300, footer,
        buttons: [{ label: 'Milled head:', items: [['▼ 1 turn', hd(-1)], ['▼ 10 div', hd(-0.1)], ['▼ 1 div', hd(-0.01)], ['▼ 0.1', hd(-0.001)], ['▲ 0.1', hd(0.001)], ['▲ 1 div', hd(0.01)], ['▲ 10 div', hd(0.1)], ['▲ 1 turn', hd(1)]] }],
        onWheel: (dir, e) => { S.spherS += dir * (e.shiftKey ? 0.001 : 0.01); },
        onDrag: (dx, dy) => { S.spherS += (dx - dy) * 0.002; },
        draw: (c, W, H) => {
          c.fillStyle = '#f4f2ec'; c.fillRect(0, 0, W, H);
          const q = spherSurface();
          const s = S.spherS - 2.5; // tip protrusion below leg plane (mm)
          const gap = q - s; // >0: tip above surface
          const rocking = gap < -0.002 && S.spher !== 'table';
          // ----- side view (left half)
          c.save(); c.translate(150, 190);
          const tiltA = rocking ? Math.min(0.04, -gap * 0.08) * (Math.sin(performance.now() / 120) > 0 ? 1 : -1) : 0;
          // surface
          c.fillStyle = S.spher === 'lens' ? 'rgba(170,210,235,0.8)' : S.spher === 'table' ? '#d6a46a' : 'rgba(170,210,235,0.6)';
          if (S.spher === 'lens') { c.beginPath(); c.moveTo(-130, 40); c.lineTo(-130, 8); c.quadraticCurveTo(0, -12, 130, 8); c.lineTo(130, 40); c.fill(); }
          else c.fillRect(-130, 0, 260, 40);
          c.rotate(tiltA);
          c.strokeStyle = '#444'; c.lineWidth = 4;
          const legY = S.spher === 'lens' ? 6 : 0;
          c.beginPath(); c.moveTo(-100, legY); c.lineTo(-60, -60); c.moveTo(100, legY); c.lineTo(60, -60); c.stroke();
          c.fillStyle = '#6b7177'; c.fillRect(-70, -70, 140, 12);
          // central screw
          const tipY = (S.spher === 'lens' ? 6 : 0) - gap * 120;
          c.fillStyle = '#c9ced3'; c.fillRect(-4, -130, 8, 130 + tipY);
          c.beginPath(); c.moveTo(-4, tipY); c.lineTo(4, tipY); c.lineTo(0, tipY + 6); c.fill();
          c.fillStyle = '#9aa1a7'; c.fillRect(-60, -140 + Math.min(20, (S.spherS % 1) * 0), 120, 10);
          c.restore();
          c.fillStyle = '#333'; c.font = '13px Arial'; c.textAlign = 'center';
          const where = { table: 'standing on the bench', plane: 'on the plane glass plate', lens: 'on the convex lens surface', paper: 'on the paper' }[S.spher];
          c.fillText('Side view (' + where + ')', 150, 20);
          if (S.spher !== 'table') {
            if (rocking) { c.fillStyle = '#b3261e'; c.fillText('It rocks when tapped — the tip is pushing the frame up.', 150, 40); }
            else if (gap < 0.004) { c.fillStyle = '#1e7a33'; c.fillText('Tip just touches the surface (no light below the tip, no rocking).', 150, 40); }
            else { c.fillStyle = '#555'; c.fillText('A thin gap of light is seen under the tip.', 150, 40); }
          }
          // ----- reading (right half): pitch scale + head disc
          c.save(); c.translate(430, 150);
          const reading = S.spherS + P.c0; // mm
          const k = 22; // px per mm on the pitch scale
          // pitch scale (vertical) — disc edge at y = 0 corresponds to `reading`
          c.fillStyle = '#e7e9eb'; c.fillRect(-12, -120, 18, 240);
          c.strokeStyle = '#111'; c.fillStyle = '#111'; c.font = 'bold 12px Arial'; c.textAlign = 'right';
          for (let m = Math.floor(reading) - 6; m <= Math.floor(reading) + 6; m++) {
            const y = -(m - reading) * k;
            if (y > 4 || y < -120) continue;
            c.lineWidth = 1.2; c.beginPath(); c.moveTo(6, y); c.lineTo(-6, y); c.stroke();
            c.fillText(String(m), -16, y + 4);
            c.lineWidth = 0.8; c.beginPath(); c.moveTo(6, y - k / 2); c.lineTo(0, y - k / 2); c.stroke();
          }
          c.textAlign = 'left'; c.font = '11px Arial'; c.fillText('pitch scale (mm)', -60, -128);
          // disc
          const dg = c.createLinearGradient(0, 0, 0, 30); dg.addColorStop(0, '#d9dde0'); dg.addColorStop(1, '#8e969c');
          c.fillStyle = dg; c.fillRect(-150, 0, 300, 30);
          const frac = ((reading % 1) + 1) % 1;
          const head = frac * 100;
          c.font = 'bold 12px Arial'; c.textAlign = 'center'; c.fillStyle = '#111';
          for (let dv = Math.floor(head) - 12; dv <= Math.floor(head) + 12; dv++) {
            const x = 6 + (dv - head) * 11;
            const n = ((dv % 100) + 100) % 100;
            c.lineWidth = 1; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, n % 10 === 0 ? 14 : n % 5 === 0 ? 10 : 6); c.stroke();
            if (n % 10 === 0) c.fillText(String(n), x, 26);
          }
          c.font = '11px Arial'; c.fillText('head scale (100 div)', 0, 46);
          c.restore();
          c.strokeStyle = '#ccc'; c.beginPath(); c.moveTo(300, 10); c.lineTo(300, H - 10); c.stroke();
        } });
    }
    // ------------------------------------------------ ruler on paper
    function openRuler() {
      const R = { x: 6, y: 34, a: 0 }; // ruler pose in mm (paper coords), angle in deg
      const pts = (() => { const [a, b, cc] = P.legs; const A = [12, 30], B = [12 + a, 30]; const ang = Math.acos((a * a + cc * cc - b * b) / (2 * a * cc)); const C = [12 + cc * Math.cos(ang), 30 - cc * Math.sin(ang)]; return [A, B, C]; })();
      const k = 9; // px per mm
      ui.canvasWindow('ns-ruler', 'Leg marks on paper with a steel scale', { w: 600, h: 330, css: 'light',
        buttons: [
          { label: 'Rotate scale:', items: [['⟲ 5°', () => { R.a -= 5; }], ['⟲ 1°', () => { R.a -= 1; }], ['⟲ 0.1°', () => { R.a -= 0.1; }], ['0.1° ⟳', () => { R.a += 0.1; }], ['1° ⟳', () => { R.a += 1; }], ['5° ⟳', () => { R.a += 5; }]] },
          { label: 'Slide scale (mm):', items: [['◀ 1', () => { R.x -= 1; }], ['◀ 0.1', () => { R.x -= 0.1; }], ['0.1 ▶', () => { R.x += 0.1; }], ['1 ▶', () => { R.x += 1; }], ['▲ 1', () => { R.y -= 1; }], ['▼ 1', () => { R.y += 1; }]] },
        ],
        footer: () => { const d = document.createElement('div'); d.className = 'ctrls'; d.innerHTML = '<span class="muted">Drag the scale to move it; scroll to rotate it (Shift = fine). Read the scale at each mark.</span>'; return d; },
        onDrag: (dx, dy) => { R.x += dx / k; R.y += dy / k; },
        onWheel: (dir, e) => { R.a += dir * (e.shiftKey ? 0.1 : 1); },
        draw: (c, W, H) => {
          c.fillStyle = '#fffef8'; c.fillRect(0, 0, W, H);
          c.fillStyle = '#333';
          pts.forEach(([x, y], i) => { c.beginPath(); c.arc(x * k + 60, y * k, 2.6, 0, Math.PI * 2); c.fill(); c.font = 'bold 13px Arial'; c.fillText('ABC'[i], x * k + 66, y * k - 6); });
          c.save(); c.translate(R.x * k + 60, R.y * k); c.rotate(R.a * Math.PI / 180);
          const len = 60;
          const gg = c.createLinearGradient(0, 0, 0, 34); gg.addColorStop(0, 'rgba(235,238,240,0.92)'); gg.addColorStop(1, 'rgba(175,182,188,0.92)');
          c.fillStyle = gg; c.fillRect(-P.ruler0 * k - 4, 0, (len + 2) * k, 34);
          c.strokeStyle = '#111'; c.fillStyle = '#111'; c.font = 'bold 11px Arial'; c.textAlign = 'center';
          for (let mm = 0; mm <= len; mm += 0.5) {
            const x = (mm - P.ruler0) * k;
            const l = mm % 10 === 0 ? 14 : mm % 5 === 0 ? 10 : Number.isInteger(mm) ? 7 : 4;
            c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, l); c.stroke();
            if (mm % 10 === 0) c.fillText(String(mm / 10), x, 26);
          }
          c.font = '10px Arial'; c.fillText('cm', (len - P.ruler0 - 2) * k, 28);
          c.restore();
        } });
    }

    const steps = [
      { t: 'Switch on the sodium lamp and wait until it is bright yellow (a few minutes).', done: () => S.lampOn && S.warm > 0.95 },
      { t: 'Clean the lens and plate with lens tissue and place the lens <b>convex side down</b> on the plate.', done: () => S.clean && S.lens === 'down' },
      { t: 'Adjust the inclined glass plate to 45° (brightest field of view).', done: () => Math.abs(S.plate - 45) < 1.2 },
      { t: 'Focus the microscope until the rings are sharp.', done: () => Math.abs(S.z - P.z0) < 0.12 },
      { t: 'Make one cross-wire parallel to the travel and bring the cross-wire to the centre of the rings.', done: () => Math.abs(S.tilt) < 0.3 && Math.abs(S.yoff) < 0.05 && Math.abs(S.xc - P.x0) < 0.2 },
      { t: 'Traverse in one direction: readings at the 16th, 12th, 8th, 4th rings on one side and 4th–16th on the other (Table 3). Repeat 2–3 times.' },
      { t: 'Find the spherometer least count; press it on paper and measure L between the leg marks.', done: () => S.paper },
      { t: 'Take spherometer readings b (plane plate) and a (convex lens surface), 3–4 times (Table 2).' },
      { t: 'Switch the lamp off and return the lens to its box.', done: () => !S.lampOn && S.lens === 'box' && S.paper },
    ];
    const views = [
      { name: 'Whole bench', x: 80, y: 180, w: 1500, h: 720 },
      { name: 'Microscope', x: 560, y: 200, w: 440, h: 450 },
      { name: 'Scale & screw', x: 640, y: 380, w: 300, h: 110 },
      { name: 'Lens & plate', x: 680, y: 500, w: 180, h: 130 },
      { name: 'Accessories', x: 980, y: 660, w: 600, h: 240 },
    ];
    return { steps, views, debug: { S, P, screw, focusKnob, plateKnob, centreKnob, psSw, openScope, openVernier, openSpher, openRuler, setSpher } };
  },
};
