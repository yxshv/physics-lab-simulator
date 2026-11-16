// DOM user interface: side panel (procedure, observation tables, manual), floating windows, toasts, plot.
const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
  }
  kids.flat().forEach(c => c != null && e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return e;
};
export { el };

export class UI {
  constructor() {
    this.windows = new Map();
    this.z = 100;
    this.toastsEl = $('#toasts');
    this.hintEl = $('#hint');
    this.remarks = [];
  }

  // ---------------------------------------------------------- app shell for one experiment
  mount(exp, ctx) {
    this.exp = exp; this.ctx = ctx;
    $('#title').textContent = exp.title;
    $('#subtitle').textContent = exp.subtitle || '';
    this.remarks = [];
    this._tabs();
    this._procedure(ctx.steps || []);
    this._observations(exp);
    this._manual(exp);
    this._views(ctx.views || []);
    this._palette();
    clearInterval(this._stepTimer);
    this._stepTimer = setInterval(() => this._refreshSteps(), 600);
  }
  unmount() {
    clearInterval(this._stepTimer);
    for (const w of [...this.windows.values()]) w.close();
    this.windows.clear();
    this.hint('');
  }

  _tabs() {
    const tabs = document.querySelectorAll('#side nav button');
    tabs.forEach(b => b.onclick = () => {
      tabs.forEach(x => x.classList.toggle('active', x === b));
      document.querySelectorAll('#side section').forEach(s => s.hidden = s.id !== b.dataset.tab);
    });
  }

  // ---------------------------------------------------------- procedure + remarks
  _procedure(steps) {
    const box = $('#proc');
    box.innerHTML = '';
    box.appendChild(el('p', { class: 'muted' }, 'Do each step on the apparatus yourself. A tick appears only when the apparatus is actually in that state.'));
    const ol = el('ol', { class: 'steps' });
    this.stepEls = steps.map(s => {
      const li = el('li', {}, el('span', { class: 'tick' }, ''), el('span', { html: s.t }));
      ol.appendChild(li);
      return { s, li };
    });
    box.appendChild(ol);
    if (this.ctx.checkCircuit) {
      box.appendChild(el('button', { class: 'btn', onclick: () => {
        const r = this.ctx.checkCircuit();
        this.remark('Instructor: ' + r.msg, r.ok ? 'ok' : 'warn');
      } }, 'Ask instructor to check the circuit'));
    }
    box.appendChild(el('h3', {}, 'Instructor remarks'));
    this.remarkEl = el('ul', { class: 'remarks' }, el('li', { class: 'muted' }, 'None yet.'));
    box.appendChild(this.remarkEl);
  }
  _refreshSteps() {
    if (!this.stepEls) return;
    for (const { s, li } of this.stepEls) {
      let ok = false;
      try { ok = s.done ? !!s.done() : false; } catch (e) { ok = false; }
      li.classList.toggle('done', ok);
      li.firstChild.textContent = ok ? '✓' : '';
    }
  }
  remark(text, level = 'warn') {
    if (this.remarks.length === 0) this.remarkEl.innerHTML = '';
    if (this.remarks.includes(text) && level !== 'ok') { this.toast(text, level); return; }
    this.remarks.push(text);
    const t = new Date();
    this.remarkEl.prepend(el('li', { class: level }, el('span', { class: 'time' }, t.toTimeString().slice(0, 5)), ' ' + text));
    this.toast(text, level);
  }

  // ---------------------------------------------------------- observation tables
  _key() { return 'pls:obs:' + this.exp.id; }
  _load() { try { return JSON.parse(localStorage.getItem(this._key())) || {}; } catch { return {}; } }
  _save() { try { localStorage.setItem(this._key(), JSON.stringify(this.data)); } catch { } }
  _observations(exp) {
    const box = $('#obs');
    box.innerHTML = '';
    this.data = this._load();
    this.data.tables = this.data.tables || {};
    box.appendChild(el('p', { class: 'muted' }, 'Type your own readings exactly as you read them from the instruments. Nothing here is filled in for you. Entries are saved in this browser.'));
    for (const t of exp.tables || []) box.appendChild(this._table(t));
    const notes = el('textarea', { class: 'notes', rows: 8, placeholder: 'Calculations, result, sources of error, conclusion…' });
    notes.value = this.data.notes || '';
    notes.oninput = () => { this.data.notes = notes.value; this._save(); };
    box.appendChild(el('h3', {}, 'Calculations & Result'));
    box.appendChild(notes);
    box.appendChild(el('div', { class: 'row' },
      el('button', { class: 'btn', onclick: () => this.plotWindow() }, 'Plot a graph'),
      el('button', { class: 'btn', onclick: () => this.exportCSV() }, 'Copy as CSV'),
      el('button', { class: 'btn danger', onclick: async () => {
        if (await this.confirm('Clear ALL observations for this experiment?')) { this.data = { tables: {} }; this._save(); this._observations(exp); }
      } }, 'Clear all'),
    ));
  }
  _table(t) {
    const st = this.data.tables[t.id] = this.data.tables[t.id] || { fields: {}, rows: [] };
    const nRows = Math.max(t.rows ?? 6, st.rows.length);
    while (st.rows.length < nRows) st.rows.push(t.cols.map(() => ''));
    const wrap = el('div', { class: 'otable' });
    wrap.appendChild(el('h3', {}, t.title));
    if (t.note) wrap.appendChild(el('p', { class: 'muted small', html: t.note }));
    if (t.fields && t.fields.length) {
      const f = el('div', { class: 'fields' });
      t.fields.forEach(fd => {
        const inp = el('input', { type: 'text', value: st.fields[fd.id] ?? '', placeholder: fd.ph ?? '' });
        inp.oninput = () => { st.fields[fd.id] = inp.value; this._save(); };
        f.appendChild(el('label', {}, el('span', { html: fd.label }), inp));
      });
      wrap.appendChild(f);
    }
    const scroller = el('div', { class: 'tscroll' });
    const table = el('table');
    const thead = el('thead');
    if (t.groups) {
      const tr = el('tr');
      t.groups.forEach(gp => tr.appendChild(el('th', { colspan: gp.span, html: gp.label })));
      thead.appendChild(tr);
    }
    const trh = el('tr');
    t.cols.forEach(c => trh.appendChild(el('th', { html: c.label })));
    thead.appendChild(trh);
    table.appendChild(thead);
    const tbody = el('tbody');
    const renderRows = () => {
      tbody.innerHTML = '';
      st.rows.forEach((row, ri) => {
        const tr = el('tr');
        t.cols.forEach((c, ci) => {
          if (c.fixed) { tr.appendChild(el('td', { class: 'fixed' }, c.fixed[ri] ?? String(ri + 1))); return; }
          const inp = el('input', { type: 'text', value: row[ci] ?? '', 'aria-label': `${c.label} row ${ri + 1}` });
          inp.oninput = () => { row[ci] = inp.value; this._save(); };
          inp.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === 'ArrowDown') { const nx = tbody.rows[ri + 1]?.cells[ci]?.querySelector('input'); if (nx) { nx.focus(); e.preventDefault(); } }
            if (e.key === 'ArrowUp') { const nx = tbody.rows[ri - 1]?.cells[ci]?.querySelector('input'); if (nx) { nx.focus(); e.preventDefault(); } }
          };
          tr.appendChild(el('td', {}, inp));
        });
        tbody.appendChild(tr);
      });
    };
    renderRows();
    table.appendChild(tbody);
    scroller.appendChild(table);
    wrap.appendChild(scroller);
    wrap.appendChild(el('div', { class: 'row small' },
      el('button', { class: 'btn sm', onclick: () => { st.rows.push(t.cols.map(() => '')); this._save(); renderRows(); } }, '+ row'),
      el('button', { class: 'btn sm', onclick: () => { if (st.rows.length > 1 && st.rows[st.rows.length - 1].every(v => !v)) { st.rows.pop(); this._save(); renderRows(); } } }, '− empty row'),
      t.plot ? el('button', { class: 'btn sm', onclick: () => this.plotWindow(t.id, t.plot.x, t.plot.y, t.plot.fit) }, 'Plot ' + (t.plot.label || '')) : null,
    ));
    this._save();
    return wrap;
  }
  exportCSV() {
    const lines = [];
    for (const t of this.exp.tables || []) {
      const st = this.data.tables[t.id]; if (!st) continue;
      lines.push(JSON.stringify(t.title.replace(/<[^>]+>/g, '')));
      (t.fields || []).forEach(f => lines.push(`${JSON.stringify(f.label.replace(/<[^>]+>/g, ''))},${JSON.stringify(st.fields[f.id] ?? '')}`));
      lines.push(t.cols.map(c => JSON.stringify(c.label.replace(/<[^>]+>/g, ''))).join(','));
      st.rows.forEach((r, ri) => lines.push(t.cols.map((c, ci) => JSON.stringify(c.fixed ? (c.fixed[ri] ?? '') : (r[ci] ?? ''))).join(',')));
      lines.push('');
    }
    lines.push('"Notes"', JSON.stringify(this.data.notes || ''));
    const csv = lines.join('\n');
    const fallback = () => {
      const w = this.window('csv', 'Observations as CSV', { w: 560 });
      w.body.innerHTML = '';
      const ta = el('textarea', { class: 'notes', rows: 16, readonly: 'readonly' }); ta.value = csv;
      w.body.append(el('p', { class: 'small muted' }, 'Select all and copy, then paste into a spreadsheet.'), ta);
      ta.focus(); ta.select();
    };
    try {
      navigator.clipboard.writeText(csv).then(() => this.toast('Observations copied as CSV — paste into a spreadsheet.', 'ok'), fallback);
    } catch { fallback(); }
  }
  // in-page confirm dialog (browser confirm() is blocked when hosted)
  confirm(msg) {
    return new Promise((resolve) => {
      const back = el('div', { class: 'modal-back' });
      const done = (v) => { back.remove(); resolve(v); };
      back.appendChild(el('div', { class: 'modal' }, el('p', {}, msg), el('div', { class: 'row', style: 'justify-content:flex-end' },
        el('button', { class: 'btn', onclick: () => done(false) }, 'Cancel'),
        el('button', { class: 'btn primary', onclick: () => done(true) }, 'OK'))));
      document.body.appendChild(back);
    });
  }

  // ---------------------------------------------------------- plot (uses only the numbers YOU typed)
  plotWindow(tid, xc, yc, fit) {
    const tables = (this.exp.tables || []).filter(t => t.cols.length >= 2);
    const w = this.window('plot', 'Graph of your observations', { w: 560 });
    w.body.innerHTML = '';
    const selT = el('select'), selX = el('select'), selY = el('select');
    const chk = el('input', { type: 'checkbox' }); chk.checked = fit ?? true;
    const logY = el('input', { type: 'checkbox' });
    tables.forEach(t => selT.appendChild(el('option', { value: t.id }, t.title.replace(/<[^>]+>/g, ''))));
    const fillCols = () => {
      const t = tables.find(x => x.id === selT.value);
      selX.innerHTML = ''; selY.innerHTML = '';
      t.cols.forEach(c => { selX.appendChild(el('option', { value: c.id }, c.label.replace(/<[^>]+>/g, ''))); selY.appendChild(el('option', { value: c.id }, c.label.replace(/<[^>]+>/g, ''))); });
      if (t.plot) { selX.value = t.plot.x; selY.value = t.plot.y; } else { selX.selectedIndex = 1; selY.selectedIndex = Math.min(2, t.cols.length - 1); }
    };
    if (tid) selT.value = tid;
    fillCols();
    if (xc) selX.value = xc; if (yc) selY.value = yc;
    const cv = el('canvas', { width: 1040, height: 680, class: 'plotcanvas' });
    const info = el('div', { class: 'small muted' });
    const draw = () => {
      const t = tables.find(x => x.id === selT.value);
      const st = this.data.tables[t.id] || { rows: [] };
      const xi = t.cols.findIndex(c => c.id === selX.value), yi = t.cols.findIndex(c => c.id === selY.value);
      const num = (s) => { const v = parseFloat(String(s ?? '').replace(/[^0-9eE+\-.]/g, '')); return isFinite(v) ? v : NaN; };
      const pts = st.rows.map((r, ri) => [t.cols[xi].fixed ? num(t.cols[xi].fixed[ri]) : num(r[xi]), t.cols[yi].fixed ? num(t.cols[yi].fixed[ri]) : num(r[yi])])
        .filter(p => isFinite(p[0]) && isFinite(p[1]) && (!logY.checked || p[1] > 0))
        .map(p => logY.checked ? [p[0], Math.log10(p[1])] : p);
      plot(cv, pts, { xl: selX.selectedOptions[0].text, yl: (logY.checked ? 'log₁₀ ' : '') + selY.selectedOptions[0].text, fit: chk.checked }, info);
    };
    [selT].forEach(s => s.onchange = () => { fillCols(); draw(); });
    [selX, selY, chk, logY].forEach(s => s.onchange = draw);
    w.body.append(
      el('div', { class: 'row small' }, 'Table ', selT),
      el('div', { class: 'row small' }, 'X ', selX, ' Y ', selY, el('label', {}, chk, ' least-squares line'), el('label', {}, logY, ' log Y')),
      cv, info,
      el('p', { class: 'small muted' }, 'Points come only from what you typed in the tables. Re-open after editing to refresh.'),
    );
    draw();
  }

  // ---------------------------------------------------------- manual tab
  _manual(exp) {
    const m = exp.manual || {};
    const box = $('#man');
    box.innerHTML = '';
    if (m.aim) box.append(el('h3', {}, 'Objective'), el('p', { html: m.aim }));
    if (m.apparatus) box.append(el('h3', {}, 'Apparatus on your bench'), el('ul', {}, ...m.apparatus.map(a => el('li', { html: a }))));
    if (m.formula) box.append(el('h3', {}, 'Working formulae'), el('div', { class: 'formula', html: m.formula }));
    if (m.procedure) box.append(el('h3', {}, 'Procedure (summary)'), el('ol', {}, ...m.procedure.map(a => el('li', { html: a }))));
    if (m.precautions) box.append(el('h3', {}, 'Precautions'), el('ul', {}, ...m.precautions.map(a => el('li', { html: a }))));
    if (m.controls) box.append(el('h3', {}, 'Using the simulator'), el('ul', { class: 'small' }, ...m.controls.map(a => el('li', { html: a }))));
    if (m.link) box.append(el('p', {}, el('a', { href: m.link, target: '_blank', rel: 'noopener' }, 'Open the full lab manual (PDF) ↗')));
  }

  // ---------------------------------------------------------- toolbar
  _views(views) {
    const box = $('#views');
    box.innerHTML = '';
    box.appendChild(el('span', { class: 'lbl' }, 'View:'));
    box.appendChild(el('button', { class: 'btn sm', title: 'Zoom out', onclick: () => this.ctx.bench.zoomBy(1.4) }, '−'));
    box.appendChild(el('button', { class: 'btn sm', title: 'Zoom in', onclick: () => this.ctx.bench.zoomBy(1 / 1.4) }, '+'));
    views.forEach(v => box.appendChild(el('button', { class: 'btn sm', onclick: () => this.ctx.bench.zoomTo(v.x, v.y, v.w, v.h) }, v.name)));
  }
  _palette() {
    const box = $('#palette');
    box.innerHTML = '';
    box.appendChild(el('span', { class: 'lbl' }, 'Patch cord:'));
    ['red', 'black', 'blue', 'yellow', 'green'].forEach(c => {
      const b = el('button', { class: 'swatch' + (this.ctx.wires.color === c ? ' on' : ''), title: c, style: `background:${{ red: '#c62828', black: '#1e1e1e', blue: '#1f4fc4', yellow: '#e0b40f', green: '#2f8f3a' }[c]}` });
      b.onclick = () => { this.ctx.wires.color = c; box.querySelectorAll('.swatch').forEach(x => x.classList.toggle('on', x === b)); };
      box.appendChild(b);
    });
  }
  hint(html) { this.hintEl.innerHTML = html || ''; }

  // ---------------------------------------------------------- toasts
  toast(msg, level = 'info') {
    const t = el('div', { class: 'toast ' + level, html: msg });
    this.toastsEl.appendChild(t);
    setTimeout(() => t.classList.add('out'), 4200);
    setTimeout(() => t.remove(), 4800);
  }

  // ---------------------------------------------------------- floating windows
  window(id, title, { w = 420, x, y, onClose } = {}) {
    if (this.windows.has(id)) { const ex = this.windows.get(id); ex.front(); return ex; }
    const root = el('div', { class: 'win' });
    const head = el('div', { class: 'win-head' }, el('span', {}, title));
    const close = el('button', { class: 'win-x', title: 'Close' }, '×');
    head.appendChild(close);
    const body = el('div', { class: 'win-body' });
    root.append(head, body);
    root.style.width = w + 'px';
    const n = this.windows.size;
    root.style.left = (x ?? (80 + n * 34)) + 'px';
    root.style.top = (y ?? (90 + n * 28)) + 'px';
    $('#windows').appendChild(root);
    const clampPos = () => {
      root.style.left = Math.max(4, Math.min(root.offsetLeft, window.innerWidth - root.offsetWidth - 4)) + 'px';
      root.style.top = Math.max(4, Math.min(root.offsetTop, window.innerHeight - 80)) + 'px';
    };
    setTimeout(clampPos, 0); setTimeout(clampPos, 120);
    const api = {
      el: root, body,
      front: () => { root.style.zIndex = ++this.z; },
      close: () => { root.remove(); this.windows.delete(id); onClose && onClose(); },
      setTitle: (t) => { head.firstChild.textContent = t; },
    };
    close.onclick = api.close;
    root.addEventListener('pointerdown', api.front);
    let drag = null;
    head.addEventListener('pointerdown', (e) => { if (e.target === close) return; drag = { x: e.clientX - root.offsetLeft, y: e.clientY - root.offsetTop }; head.setPointerCapture(e.pointerId); });
    head.addEventListener('pointermove', (e) => { if (!drag) return; root.style.left = Math.max(0, e.clientX - drag.x) + 'px'; root.style.top = Math.max(0, e.clientY - drag.y) + 'px'; });
    head.addEventListener('pointerup', () => drag = null);
    api.front();
    this.windows.set(id, api);
    return api;
  }
  // a window that hosts a canvas, redrawn by draw(ctx, W, H) every frame while open
  canvasWindow(id, title, { w = 420, h = 420, draw, onWheel, onDrag, onClick, footer, css, buttons } = {}) {
    const existing = this.windows.get(id);
    if (existing) { existing.front(); return existing; }
    const win = this.window(id, title, { w: w + 16, onClose: () => { clearInterval(win._raf); } });
    const cv = el('canvas', { width: w * 2, height: h * 2, class: 'wincanvas' + (css ? ' ' + css : '') });
    cv.style.width = '100%'; cv.style.maxWidth = w + 'px'; cv.style.aspectRatio = `${w} / ${h}`;
    win.body.appendChild(cv);
    // on-screen step buttons (for touch screens, where there is no scroll wheel); hold to repeat
    (buttons || []).forEach(row => {
      const d = el('div', { class: 'ctrls stepbtns' }, el('span', {}, row.label));
      row.items.forEach(([text, fn]) => {
        const b = el('button', { class: 'btn sm' }, text);
        let t1, t2;
        const stop = () => { clearTimeout(t1); clearInterval(t2); };
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(); t1 = setTimeout(() => { t2 = setInterval(fn, 70); }, 380); });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
        d.appendChild(b);
      });
      win.body.appendChild(d);
    });
    if (footer) win.body.appendChild(typeof footer === 'function' ? footer(win) : footer);
    const ctx = cv.getContext('2d');
    win.canvas = cv;
    const loop = () => {
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      try { draw(ctx, w, h); } catch (e) { console.error(e); }
    };
    loop();
    win._raf = setInterval(loop, 50);
    win.redraw = loop;
    if (onWheel) cv.addEventListener('wheel', (e) => { e.preventDefault(); onWheel(e.deltaY < 0 ? 1 : -1, e); }, { passive: false });
    if (onDrag) {
      let d = null;
      cv.addEventListener('pointerdown', (e) => { d = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', (e) => { if (!d) return; onDrag(e.clientX - d.x, e.clientY - d.y, e); d = { x: e.clientX, y: e.clientY }; });
      cv.addEventListener('pointerup', () => d = null);
    }
    if (onClick) cv.addEventListener('click', (e) => { const r = cv.getBoundingClientRect(); onClick(e.clientX - r.left, e.clientY - r.top, e); });
    return win;
  }
}

// ------------------------------------------------------------ simple scatter plot with optional LSQ line
export function plot(cv, pts, { xl, yl, fit }, info) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  const L = 110, R = 30, T = 30, B = 90;
  if (pts.length === 0) { ctx.fillStyle = '#888'; ctx.font = '28px sans-serif'; ctx.fillText('No numeric data in these columns yet.', L, H / 2); info.textContent = ''; return; }
  let x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0]));
  let y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
  if (x0 === x1) { x0 -= 1; x1 += 1; } if (y0 === y1) { y0 -= 1; y1 += 1; }
  const nice = (a, b) => { const span = b - a, step = Math.pow(10, Math.floor(Math.log10(span / 5))); const m = [1, 2, 5, 10].find(k => span / (step * k) <= 8) * step; return { lo: Math.floor(a / m) * m, hi: Math.ceil(b / m) * m, st: m }; };
  const nx = nice(x0, x1), ny = nice(y0, y1);
  const X = v => L + (v - nx.lo) / (nx.hi - nx.lo) * (W - L - R);
  const Y = v => H - B - (v - ny.lo) / (ny.hi - ny.lo) * (H - T - B);
  // graph-paper grid
  ctx.strokeStyle = '#f3d6c8'; ctx.lineWidth = 1;
  for (let i = 0; i <= 50; i++) { const x = L + i * (W - L - R) / 50; ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, H - B); ctx.stroke(); }
  for (let i = 0; i <= 30; i++) { const y = T + i * (H - T - B) / 30; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - R, y); ctx.stroke(); }
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.strokeRect(L, T, W - L - R, H - T - B);
  ctx.fillStyle = '#222'; ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
  const fmt = v => Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(1) : +v.toPrecision(4) + '';
  for (let v = nx.lo; v <= nx.hi + nx.st * 0.01; v += nx.st) { ctx.fillText(fmt(v), X(v), H - B + 30); }
  ctx.textAlign = 'right';
  for (let v = ny.lo; v <= ny.hi + ny.st * 0.01; v += ny.st) { ctx.fillText(fmt(v), L - 10, Y(v) + 8); }
  ctx.textAlign = 'center'; ctx.font = 'bold 24px sans-serif';
  ctx.fillText(xl, (L + W - R) / 2, H - 25);
  ctx.save(); ctx.translate(30, (T + H - B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yl, 0, 0); ctx.restore();
  ctx.fillStyle = '#1f4fc4';
  pts.forEach(p => { ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 7, 0, Math.PI * 2); ctx.fill(); });
  if (fit && pts.length >= 2) {
    const n = pts.length, sx = pts.reduce((a, p) => a + p[0], 0), sy = pts.reduce((a, p) => a + p[1], 0);
    const sxx = pts.reduce((a, p) => a + p[0] * p[0], 0), sxy = pts.reduce((a, p) => a + p[0] * p[1], 0);
    const den = n * sxx - sx * sx;
    if (den !== 0) {
      const m = (n * sxy - sx * sy) / den, c = (sy - m * sx) / n;
      ctx.strokeStyle = '#c62828'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X(nx.lo), Y(m * nx.lo + c)); ctx.lineTo(X(nx.hi), Y(m * nx.hi + c)); ctx.stroke();
      const ybar = sy / n, ssr = pts.reduce((a, p) => a + (p[1] - (m * p[0] + c)) ** 2, 0), sst = pts.reduce((a, p) => a + (p[1] - ybar) ** 2, 0);
      info.textContent = `Least-squares line through your points: slope = ${m.toPrecision(5)}, intercept = ${c.toPrecision(5)}, R² = ${(1 - ssr / (sst || 1)).toFixed(4)}`;
      return;
    }
  }
  info.textContent = `${pts.length} points plotted.`;
}
