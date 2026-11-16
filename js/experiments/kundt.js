// Experiment: Kundt's tube — velocity of sound in air and gamma (speaker, movable microphone rod, FG, DMM)
import { g, txt, rect, circ, line, path, poly, clamp, gauss } from '../core/svg.js';
import { FuncGen, Multimeter } from '../core/instruments.js';

const ICON = `<svg viewBox="0 0 200 100"><rect x="30" y="38" width="140" height="14" rx="6" fill="rgba(200,225,240,.6)" stroke="#89a"/><rect x="18" y="34" width="16" height="22" rx="4" fill="#aab"/><rect x="120" y="43" width="75" height="4" fill="#bbb"/><path d="M60 52 L52 85 M60 52 L68 85 M150 52 L142 85 M150 52 L158 85" stroke="#222" stroke-width="4"/></svg>`;

export default {
  id: 'kundt', title: "Kundt's Tube", subtitle: 'Velocity of sound in air and γ = Cp/Cv',
  blurb: 'Glass tube with speaker and a movable microphone rod, Scientific function generator, PeakTech multimeter and steel scale.',
  icon: ICON, W: 2000,
  manual: {
    aim: 'To measure the velocity of sound in air with a Kundt’s tube and calculate γ (the adiabatic constant) of air at room temperature.',
    apparatus: ['Glass tube (65 cm long, 3.5 cm diameter) on two stands with a loudspeaker at one end', 'Movable rod through the end cap carrying a microphone, with a cut mark on the rod', '3 MHz function generator (BNC output)', 'Digital multimeter (a.c. volts) for the microphone signal', 'Steel scale'],
    formula: `<p>Successive maxima are λ/2 apart: slope of Y′ vs n = λ/2 (least squares: m = ΣX<sub>i</sub>Y′<sub>i</sub> / ΣX<sub>i</sub><sup>2</sup>)</p><p>v = fλ, &nbsp; v = √(γRT/M) → γ = v²M/(RT)</p><p>R = 8.314 J/(mol K), T = 300 K, M = 28.96 g/mol</p>`,
    procedure: [
      'Connect the loudspeaker cable to the BNC output of the function generator.',
      'Put the mic near the loudspeaker. Connect the mic cable to the multimeter V/Ω/Hz and COM jacks; switch on, select AC and the highest a.c. voltage range.',
      'Switch on the generator, select a sine wave and set 2.5 kHz.',
      'Slowly raise the amplitude and lower the multimeter range in steps to get a steady reading.',
      'Move the rod slowly outwards and locate successive maxima of the a.c. voltage. For each maximum, measure the position of the cut mark from the cap with the steel scale.',
      'Repeat for 3 kHz.',
      'Reduce AMPL to minimum, switch off the generator and the multimeter, and remove the connections.',
    ],
    precautions: ['Check the alignment of the speaker and the glass tube.', 'Handle the glass tube and the rod with care.', 'Make sure the BNC connector is tight.', 'Approach each maximum slowly from the same side.'],
    controls: ['Drag the rod to slide it; scroll on the rod for 0.5 mm steps (Shift = 0.1 mm).', 'Click the steel scale to lay it along the rod; click the scale again to read it close up.'],
    link: 'https://drive.google.com/file/d/1D_yst7ltcGDJG0bjqxSCf4uM1M7z44eR/view',
  },
  tables: [
    { id: 'f1', title: 'Frequency f₁', fields: [{ id: 'f', label: 'f₁ (Hz)' }, { id: 'sxy', label: 'ΣXᵢY′ᵢ' }, { id: 'sxx', label: 'ΣXᵢ²' }, { id: 'm', label: 'slope m = λ/2 (cm)' }],
      cols: [{ id: 'n', label: 'Obs. (Xᵢ)' }, { id: 'Y', label: 'Position of antinode Yᵢ (cm)' }, { id: 'Yp', label: 'Y′ = Yᵢ − Y₀ (cm)' }, { id: 'xy', label: 'XᵢY′ᵢ' }, { id: 'xx', label: 'Xᵢ²' }], rows: 9, plot: { x: 'n', y: 'Yp', fit: true, label: "Y' vs n" } },
    { id: 'f2', title: 'Frequency f₂', fields: [{ id: 'f', label: 'f₂ (Hz)' }, { id: 'sxy', label: 'ΣXᵢY′ᵢ' }, { id: 'sxx', label: 'ΣXᵢ²' }, { id: 'm', label: 'slope m = λ/2 (cm)' }],
      cols: [{ id: 'n', label: 'Obs. (Xᵢ)' }, { id: 'Y', label: 'Position of antinode Yᵢ (cm)' }, { id: 'Yp', label: 'Y′ = Yᵢ − Y₀ (cm)' }, { id: 'xy', label: 'XᵢY′ᵢ' }, { id: 'xx', label: 'Xᵢ²' }], rows: 9, plot: { x: 'n', y: 'Yp', fit: true, label: "Y' vs n" } },
    { id: 'res', title: 'Results', fields: [{ id: 'v1', label: 'v₁ = f₁λ₁ (m/s)' }, { id: 'v2', label: 'v₂ = f₂λ₂ (m/s)' }, { id: 'g1', label: 'γ₁' }, { id: 'g2', label: 'γ₂' }, { id: 'v', label: 'Mean v (m/s)' }, { id: 'g', label: 'Mean γ' }, { id: 'err', label: '% error' }], cols: [{ id: 'x', label: 'Remarks' }], rows: 1 },
  ],

  build(ctx) {
    const { bench, wires, ui, rand } = ctx;
    const L = bench.layers;
    const Tc = 25 + rand() * 6;
    const P = { v: 331.3 * Math.sqrt(1 + Tc / 273.15), delta: 4 + rand() * 6, eta: 0.11 + rand() * 0.04, ruler0: (rand() - 0.5) * 1.2 };
    const S = { y: 40, ruler: false };
    const X0 = 420, TUBE = 650, CAP = X0 + TUBE, TY = 470, MARK = 620; // mm

    // ---------------- function generators (one used, one spare as in the lab)
    const fg = new FuncGen(ctx, L.inst, 70, 430, { id: 'fg' });
    // ---------------- tube, speaker, stands
    const TG = g(L.inst);
    const stand = (x) => {
      poly(TG, [[x - 6, 520], [x - 50, 600], [x - 40, 604], [x, 532]], { fill: '#1d1f22' });
      poly(TG, [[x + 6, 520], [x + 50, 600], [x + 40, 604], [x, 532]], { fill: '#1d1f22' });
      rect(TG, x - 4, 486, 8, 60, { fill: 'url(#gChromeH)' });
      rect(TG, x - 10, 525, 20, 16, { fill: '#1d1f22', r: 2 }); rect(TG, x - 4, 532, 18, 6, { fill: '#f2c40f', r: 2 });
      rect(TG, x - 7, TY - 6, 14, 30, { fill: '#2747c9', r: 2 });
    };
    stand(480); stand(1030);
    // speaker housing
    rect(TG, X0 - 46, TY - 24, 46, 48, { fill: 'url(#gGrayCoil)', stroke: '#777', sw: 0.8, r: 6 });
    rect(TG, X0 - 8, TY - 22, 10, 44, { fill: '#2747c9', r: 2 });
    rect(TG, X0 - 60, TY - 6, 16, 12, { fill: '#222', r: 2 });
    // glass tube
    rect(TG, X0, TY - 17, TUBE, 34, { fill: 'url(#gTubeGlass)', stroke: '#9fb7c6', sw: 1, r: 4 });
    // end cap
    rect(TG, CAP - 4, TY - 21, 26, 42, { fill: '#4e5257', stroke: '#2a2d31', sw: 0.8, r: 6 });
    // ---------------- rod (moves)
    const ROD = g(L.front);
    const rodEnd = () => X0 + S.y + 900;
    function drawRod() {
      ROD.innerHTML = '';
      const micX = X0 + S.y;
      rect(ROD, micX, TY - 16, 8, 32, { fill: '#2b2b2b', r: 2 }); // mic disc
      rect(ROD, micX + 8, TY - 3, 900, 6, { fill: 'url(#gChrome)', stroke: '#777', sw: 0.3 });
      const mx = micX + MARK;
      line(ROD, mx, TY - 3.5, mx, TY + 3.5, { stroke: '#111', sw: 0.6 });
      rect(ROD, rodEnd() - 2, TY - 5, 12, 10, { fill: '#333', r: 2 });
      const hit = rect(ROD, micX, TY - 10, 910, 20, { fill: 'transparent' });
    }
    drawRod();
    bench.interactive(ROD, { tip: '<b>Movable rod</b> with the microphone (cut mark on the rod)<br><span class="tip-hint">drag to slide · scroll = 0.5 mm, Shift = 0.1 mm</span>' });
    (() => {
      let st = null;
      ROD.addEventListener('pointerdown', (e) => { e.stopPropagation(); ROD.setPointerCapture(e.pointerId); st = bench.toWorld(e.clientX, e.clientY).x; });
      ROD.addEventListener('pointermove', (e) => { if (st === null) return; const x = bench.toWorld(e.clientX, e.clientY).x; let d = x - st; st = x; if (e.shiftKey) d *= 0.1; setY(S.y + d); });
      const up = () => { st = null; }; ROD.addEventListener('pointerup', up); ROD.addEventListener('pointercancel', up);
      ROD.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); setY(S.y + (e.deltaY < 0 ? 1 : -1) * (e.shiftKey ? 0.1 : 0.5)); }, { passive: false });
    })();
    function setY(y) { S.y = clamp(y, 14, 615); drawRod(); wires.refreshLead(micR); wires.refreshLead(micB); drawRuler(); }
    // speaker BNC cable
    wires.addLead({ id: 'spk', name: 'Loudspeaker cable (BNC)', kind: 'bnc', anchor: () => ({ x: X0 - 60, y: TY }), rest: { x: 330, y: 650 }, restAngle: 20, sag: 60 });
    // mic cable from the rod end -> red/black plugs
    const micR = wires.addLead({ id: 'mic.r', name: 'Microphone lead (red)', color: 'red', cable: '#1b1b1b', anchor: () => ({ x: rodEnd() + 10, y: TY }), rest: { x: 1060, y: 760 }, restAngle: -30, sag: 90 });
    const micB = wires.addLead({ id: 'mic.b', name: 'Microphone lead (blue/black)', color: 'black', cable: '#1b1b1b', anchor: () => ({ x: rodEnd() + 10, y: TY + 2 }), rest: { x: 1080, y: 772 }, restAngle: -20, sag: 92 });
    // ---------------- multimeter
    const dmm = new Multimeter(ctx, L.table, 880, 640, { id: 'dmm', style: 'peaktech', name: 'Multimeter', rot: -6 });
    // ---------------- steel scale (60 cm)
    const RUL = g(L.top);
    const restRuler = g(L.table);
    function drawRuler() {
      RUL.innerHTML = ''; restRuler.innerHTML = '';
      const G = S.ruler ? RUL : restRuler;
      const x0 = S.ruler ? CAP + 22 + P.ruler0 : 80, y0 = S.ruler ? TY + 6 : 820, rot = S.ruler ? 0 : -3;
      const R = g(G, { transform: `rotate(${rot} ${x0} ${y0})` });
      rect(R, x0 - 6, y0, 612, 16, { fill: 'url(#gChrome)', stroke: '#777', sw: 0.5, opacity: 0.96 });
      for (let mm = 0; mm <= 600; mm++) line(R, x0 + mm, y0, x0 + mm, y0 + (mm % 10 === 0 ? 6 : mm % 5 === 0 ? 4 : 2.2), { stroke: '#222', sw: 0.2 });
      for (let cm = 0; cm <= 60; cm += 5) txt(R, x0 + cm * 10, y0 + 11, String(cm), { size: 3.4, fill: '#222' });
      bench.interactive(R, { tip: '<b>Steel scale</b> (60 cm)<br><span class="tip-hint">click for options</span>', title: 'Steel scale', menu: () => [
        !S.ruler ? { label: 'Lay it along the rod with its zero at the cap', fn: () => { S.ruler = true; drawRuler(); } } : { label: 'Read the scale at the cut mark (close-up)', fn: openRuler },
        S.ruler && { label: 'Put the scale back on the bench', fn: () => { S.ruler = false; drawRuler(); } },
      ] });
    }
    drawRuler();
    function openRuler() {
      const rd = (d) => () => setY(S.y + d);
      ui.canvasWindow('kt-rule', 'Steel scale at the cut mark (close-up)', { w: 560, h: 180, css: 'light',
        buttons: [{ label: 'Slide rod (mm):', items: [['◀ 10', rd(-10)], ['◀ 1', rd(-1)], ['◀ 0.1', rd(-0.1)], ['0.1 ▶', rd(0.1)], ['1 ▶', rd(1)], ['10 ▶', rd(10)]] }],
        onWheel: (dir, e) => setY(S.y + dir * (e.shiftKey ? 0.1 : 0.5)),
        footer: () => { const d = document.createElement('div'); d.className = 'ctrls'; d.innerHTML = '<span class="muted">Scroll here to move the rod (0.5 mm, Shift 0.1 mm). Your eye follows the cut mark.</span>'; return d; },
        draw: (c, W, H) => {
          const k = 14; // px per mm
          const mark = (X0 + S.y + MARK) - (CAP + 22 + P.ruler0); // mm on the scale
          const left = mark - W / k / 2;
          const X = (mm) => (mm - left) * k;
          c.fillStyle = '#e9e4d8'; c.fillRect(0, 0, W, H);
          // cap face
          if (X(-P.ruler0) > 0) { c.fillStyle = '#4e5257'; c.fillRect(0, 18, X(-P.ruler0), 58); c.fillStyle = '#ddd'; c.font = '11px Arial'; c.textAlign = 'right'; c.fillText('cap', X(-P.ruler0) - 6, 30); }
          // rod
          const rg = c.createLinearGradient(0, 40, 0, 70); rg.addColorStop(0, '#f2f4f5'); rg.addColorStop(0.5, '#a9b0b6'); rg.addColorStop(1, '#e3e6e8');
          c.fillStyle = rg; c.fillRect(0, 40, W, 30);
          c.strokeStyle = '#111'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(X(mark), 38); c.lineTo(X(mark), 72); c.stroke();
          c.font = '11px Arial'; c.fillStyle = '#333'; c.textAlign = 'center'; c.fillText('cut mark', X(mark), 32);
          // scale
          const sg = c.createLinearGradient(0, 76, 0, 140); sg.addColorStop(0, '#f1f3f4'); sg.addColorStop(1, '#b8bec3');
          c.fillStyle = sg; c.fillRect(0, 76, W, 64);
          c.fillStyle = '#111'; c.font = 'bold 14px Arial';
          for (let mm = Math.floor(left); mm <= left + W / k; mm++) {
            if (mm < 0 || mm > 600) continue;
            const len = mm % 10 === 0 ? 26 : mm % 5 === 0 ? 18 : 11;
            c.lineWidth = 1; c.beginPath(); c.moveTo(X(mm), 76); c.lineTo(X(mm), 76 + len); c.stroke();
            if (mm % 10 === 0) c.fillText(String(mm / 10), X(mm), 120);
          }
          c.font = '11px Arial'; c.fillText('cm', W - 20, 134);
        } });
    }
    // ---------------- acoustics
    function micVolts() {
      if (!fg.on) return gauss() * 0.0006 + 0.0015;
      const spk = wires.leadSocket('spk') === 'fg.out';
      if (!spk) return 0.0015 + Math.abs(gauss()) * 0.0008;
      const f = fg.freq;
      const lam = P.v / f * 1000; // mm
      const k = 2 * Math.PI / lam;
      const resp = Math.exp(-Math.pow(Math.log(f / 2600) / 1.2, 2));
      const amp = 0.032 * fg.vrmsOpen * resp;
      const yy = S.y + P.delta;
      let p = amp / Math.sqrt(Math.pow(Math.sin(k * yy), 2) + P.eta * P.eta);
      if (fg.wave === 1) { const k3 = 3 * k; p = p * 4 / Math.PI + (amp / 3) / Math.sqrt(Math.pow(Math.sin(k3 * yy), 2) + P.eta * P.eta); }
      if (fg.wave === 2) p *= 0.95;
      return p * (1 + gauss() * 0.004) + 0.0015;
    }
    dmm.source = () => {
      const r = wires.leadSocket('mic.r'), b = wires.leadSocket('mic.b');
      const okV = (r === 'dmm.v' && b === 'dmm.com') || (r === 'dmm.com' && b === 'dmm.v');
      const ac = okV ? micVolts() : 0;
      return { V: { dc: okV ? gauss() * 0.0003 : 0, ac }, mA: { dc: 0, ac: 0 }, A20: { dc: 0, ac: 0 }, R: okV ? null : Infinity, Hz: okV && fg.on ? fg.freq : 0 };
    };

    const steps = [
      { t: 'Connect the loudspeaker cable to the BNC output of the function generator.', done: () => wires.leadSocket('spk') === 'fg.out' },
      { t: 'Connect the mic cable to the multimeter VΩHz and COM jacks; switch on, select AC volts.', done: () => { const r = wires.leadSocket('mic.r'), b = wires.leadSocket('mic.b'); return ((r === 'dmm.v' && b === 'dmm.com') || (r === 'dmm.com' && b === 'dmm.v')) && dmm.on && dmm.ac && dmm.pos.k === 'V'; } },
      { t: 'Switch on the generator, select SINE and set 2.5 kHz.', done: () => fg.on && fg.wave === 0 && Math.abs(fg.freq - 2500) < 3 },
      { t: 'Raise the amplitude and bring the meter to the most sensitive range that does not over-range.' , done: () => fg.on && fg.vppOpen > 4 && dmm.on && dmm.pos.k === 'V' && dmm.pos.r <= 2 },
      { t: 'Lay the steel scale along the rod (zero at the cap).', done: () => S.ruler },
      { t: 'Move the rod outwards; at each maximum note the cut-mark position (Table f₁).' },
      { t: 'Repeat with 3 kHz (Table f₂).', done: () => fg.on && Math.abs(fg.freq - 3000) < 3 },
      { t: 'AMPL to minimum, generator and multimeter off, remove connections.', done: () => !fg.on && fg.ampl.value < 0.01 && !dmm.on && !wires.leadSocket('spk') },
    ];
    const views = [
      { name: 'Whole bench', x: 80, y: 300, w: 1900, h: 600 },
      { name: 'Generator', x: 60, y: 395, w: 260, h: 150 },
      { name: 'Multimeter', x: 840, y: 620, w: 200, h: 220 },
      { name: 'Tube', x: 340, y: 400, w: 800, h: 220 },
      { name: 'Cap & scale', x: 1040, y: 430, w: 260, h: 90 },
    ];
    return { steps, views, debug: { S, P, fg, dmm, setY, micVolts, openRuler } };
  },
};
