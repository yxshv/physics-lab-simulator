import { Bench } from './core/bench.js';
import { Wires } from './core/wires.js';
import { UI } from './core/ui.js';
import { rng } from './core/svg.js';

const MODULES = ['hall', 'newton', 'spectrometer', 'lcr', 'bhcurve', 'fourprobe', 'franckhertz', 'kundt'];
const exps = {};
const ui = new UI();
let current = null;

async function loadAll() {
  const mods = await Promise.allSettled(MODULES.map(m => import(`./experiments/${m}.js`)));
  mods.forEach((m, i) => {
    if (m.status === 'fulfilled') exps[MODULES[i]] = m.value.default;
    else console.error('Failed to load experiment', MODULES[i], m.reason);
  });
  for (let i = MODULES.length - 1; i >= 0; i--) if (!exps[MODULES[i]]) MODULES.splice(i, 1);
}

function seedFor(id, fresh) {
  const k = 'pls:seed:' + id;
  let s = 0;
  try { s = +localStorage.getItem(k); } catch { }
  if (!s || fresh) { s = (Math.random() * 2 ** 31) | 0 || 1; try { localStorage.setItem(k, s); } catch { } }
  return s;
}

function lobby() {
  const cards = document.getElementById('cards');
  cards.innerHTML = '';
  MODULES.forEach((id, i) => {
    const e = exps[id];
    const c = document.createElement('div');
    c.className = 'card';
    c.innerHTML = `<div class="thumb">${e.icon || ''}</div><div class="meta"><div class="no">EXPERIMENT ${i + 1}</div><h2>${e.title}</h2><p>${e.blurb}</p></div>`;
    c.onclick = () => { location.hash = id; };
    cards.appendChild(c);
  });
}

function open(id, freshSeed = false) {
  close();
  const exp = exps[id];
  if (!exp) { showLobby(); return; }
  document.getElementById('lobby').hidden = true;
  document.getElementById('app').hidden = false;
  const host = document.getElementById('benchHost');
  const bench = new Bench(host, { W: exp.W ?? 1600, H: exp.H ?? 900 });
  bench.timeScale = +document.getElementById('speed').value;
  const wires = new Wires(bench, ui);
  const seed = seedFor(id, freshSeed);
  const ctx = { bench, wires, ui, seed, rand: rng(seed) };
  const res = exp.build(ctx) || {};
  Object.assign(ctx, res);
  ui.mount(exp, ctx);
  current = { id, ctx };
  window.__lab = ctx;
  if (window.innerWidth < 900) setSide(false);
  requestAnimationFrame(() => { const v = (res.views || [])[0]; if (v) bench.zoomTo(v.x, v.y, v.w, v.h, false); else bench.fit(); });
}

function close() {
  if (!current) return;
  try { current.ctx.destroy && current.ctx.destroy(); } catch (e) { console.error(e); }
  current.ctx.wires.destroy();
  current.ctx.bench.destroy();
  ui.unmount();
  current = null;
}

function showLobby() {
  close();
  document.getElementById('app').hidden = true;
  document.getElementById('lobby').hidden = false;
}

function route() {
  const id = location.hash.slice(1);
  if (id && exps[id]) open(id); else showLobby();
}

document.getElementById('back').onclick = () => { location.hash = ''; };
document.getElementById('speed').onchange = (e) => { if (current) current.ctx.bench.timeScale = +e.target.value; };
document.getElementById('resetBtn').onclick = async () => { if (current && await ui.confirm('Reset all apparatus to its starting state? Your typed observations are kept.')) open(current.id); };
document.getElementById('newSetup').onclick = async () => {
  if (current && await ui.confirm('Move to a different bench? The sample / lens / setup values change, so start a fresh set of readings.')) open(current.id, true);
};
function setSide(show) {
  const s = document.getElementById('side');
  s.classList.toggle('hide', !show);
  document.getElementById('toggleSide').innerHTML = show ? (window.innerWidth < 900 ? 'Back to bench' : 'Notebook &#9656;') : 'Notebook &#9666;';
}
document.getElementById('toggleSide').onclick = () => setSide(document.getElementById('side').classList.contains('hide'));
window.addEventListener('hashchange', route);

loadAll().then(() => { lobby(); route(); }).catch(err => {
  console.error(err);
  document.getElementById('cards').innerHTML = `<pre style="color:#c62828">${err.stack || err}</pre>`;
});
