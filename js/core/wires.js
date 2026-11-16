// Patch cords (socket ↔ socket) and fixed leads (device cable with a free plug), plus connectivity.
import { h, g, circ, rect, path, txt } from './svg.js';
import { SOCKET_COLORS } from './controls.js';

const CORD_COLORS = { red: '#c62828', black: '#1e1e1e', blue: '#1f4fc4', yellow: '#e0b40f', green: '#2f8f3a' };

export class Wires {
  constructor(bench, ui) {
    this.bench = bench; this.ui = ui;
    this.layer = bench.layers.wires;
    this.socks = new Map(); this.wires = []; this.leads = []; this.links = [];
    this.pending = null; this.color = 'red';
    this.listeners = [];
    bench.wires = this;
    bench.onBgClick(() => { if (this.pending) this.cancel(); });
    window.addEventListener('keydown', this._esc = (e) => { if (e.key === 'Escape') this.cancel(); });
  }
  destroy() { window.removeEventListener('keydown', this._esc); }
  onChange(f) { this.listeners.push(f); }
  _changed() { this._uf = null; this.listeners.forEach(f => { try { f(); } catch (e) { console.error(e); } }); }
  addSocket(s) { this.socks.set(s.id, s); }
  link(a, b) { this.links.push([a, b]); this._uf = null; }

  countAt(sock) {
    return this.wires.filter(w => w.a === sock || w.b === sock).length + this.leads.filter(l => l.plugged === sock).length;
  }
  _free(sock) { return this.countAt(sock) < sock.max; }
  _compatible(a, kindB, mixedB) {
    if (a.kind === kindB) return true;
    if ((a.kind === 'banana' && kindB === 'bnc') || (a.kind === 'bnc' && kindB === 'banana')) return a.allowMixed || mixedB;
    return false;
  }

  // ------------------------------------------------ user clicks
  clickSocket(sock, e) {
    const p = this.pending;
    if (!p) {
      if (!this._free(sock)) { this._socketMenu(sock, e); return; }
      if (sock.kind === 'din') { this.ui.toast('This socket takes the instrument’s own cable — click the cable plug first.'); return; }
      this.pending = { kind: 'sock', sock };
      sock.highlight(true);
      this.ui.hint(`Patch cord from <b>${sock.name}</b> — click the other socket (Esc to cancel). Cord colour: ${this.color}.`);
      this._bar(`Cord from <b>${sock.name}</b>: tap the other socket`);
      return;
    }
    if (p.kind === 'sock') {
      if (p.sock === sock) { this.cancel(); return; }
      if (!this._compatible(p.sock, sock.kind, sock.allowMixed)) { this.ui.toast('Those connectors don’t fit together.', 'warn'); return; }
      if (!this._free(sock)) { this.ui.toast('That socket is already full.', 'warn'); return; }
      const a = p.sock; this.cancel(true);
      this.addWire(a, sock, this.color);
    } else if (p.kind === 'lead') {
      const lead = p.lead;
      if (!this._compatible(sock, lead.kind, lead.allowMixed)) { this.ui.toast(`The ${lead.name} plug doesn’t fit this socket.`, 'warn'); return; }
      if (!this._free(sock)) { this.ui.toast('That socket is already full.', 'warn'); return; }
      this.cancel(true);
      this.plug(lead, sock);
    }
  }
  _socketMenu(sock, e) {
    const items = [];
    this.wires.filter(w => w.a === sock || w.b === sock).forEach(w => {
      const other = w.a === sock ? w.b : w.a;
      items.push({ label: `Remove cord to ${other.name}`, fn: () => this.removeWire(w) });
    });
    this.leads.filter(l => l.plugged === sock).forEach(l => items.push({ label: `Unplug ${l.name}`, fn: () => this.unplug(l) }));
    this.bench.menu(e, sock.name + ' (full)', items);
  }
  clickLead(lead) {
    if (this.pending && this.pending.kind === 'lead' && this.pending.lead === lead) { this.cancel(); return; }
    this.cancel(true);
    if (lead.plugged) { lead.plugged = null; this._drawLead(lead); this._changed(); }
    this.pending = { kind: 'lead', lead };
    lead.halo.setAttribute('opacity', 1);
    this.ui.hint(`Holding the <b>${lead.name}</b> plug — click a socket to plug it in, or click the bench to put it down.`);
    this._bar(`Holding <b>${lead.name}</b>: tap a socket`);
  }
  cancel(quiet) {
    const p = this.pending;
    this._bar(null);
    if (!p) return;
    if (p.kind === 'sock') p.sock.highlight(false);
    if (p.kind === 'lead') p.lead.halo.setAttribute('opacity', 0);
    this.pending = null;
    this.ui.hint('');
  }
  // floating bar while a connection is being made (with a list fallback for small screens)
  _bar(html) {
    let b = this.bench.host.querySelector('#pending');
    if (!html) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'pending'; this.bench.host.appendChild(b); }
    b.innerHTML = `<span>${html}</span>`;
    const list = document.createElement('button'); list.className = 'btn'; list.textContent = 'Pick from list';
    const x = document.createElement('button'); x.className = 'btn ghost'; x.textContent = 'Cancel';
    list.onclick = (e) => { e.stopPropagation(); this._pickList(e); };
    x.onclick = (e) => { e.stopPropagation(); this.cancel(); };
    b.append(list, x);
  }
  _pickList(e) {
    const p = this.pending;
    if (!p) return;
    const ok = [...this.socks.values()].filter(s => {
      if (p.kind === 'sock') return s !== p.sock && this._compatible(p.sock, s.kind, s.allowMixed) && this._free(s);
      return this._compatible(s, p.lead.kind, p.lead.allowMixed) && this._free(s);
    }).filter(s => s.el.isConnected && s.el.getAttribute('display') !== 'none');
    const items = ok.map(s => ({ label: s.name, fn: () => this.clickSocket(s) }));
    const r = this.bench.host.getBoundingClientRect();
    this.bench.menu({ clientX: r.left + r.width / 2 - 110, clientY: r.top + 52 }, 'Connect to…', items);
  }

  // ------------------------------------------------ patch cords
  addWire(a, b, color = 'red') {
    const w = { a, b, color, el: g(this.layer) };
    this.wires.push(w);
    this._drawWire(w);
    this._changed();
    return w;
  }
  removeWire(w) {
    w.el.remove();
    this.wires = this.wires.filter(x => x !== w);
    this._changed();
  }
  _cablePath(p1, p2, sag) {
    const dx = p2.x - p1.x, dy = p2.y - p1.y, dist = Math.hypot(dx, dy);
    const s = sag ?? (25 + dist * 0.32);
    return `M${p1.x},${p1.y} C${p1.x + dx * 0.15},${p1.y + s} ${p2.x - dx * 0.15},${p2.y + s} ${p2.x},${p2.y}`;
  }
  _strokeCable(G, d, color, width = 2.6) {
    path(G, d, { stroke: 'rgba(0,0,0,0.28)', sw: width + 1.6, cap: 'round', transform: 'translate(1.5,3)' });
    path(G, d, { stroke: '#000', sw: width + 0.7, cap: 'round', opacity: 0.6 });
    path(G, d, { stroke: color, sw: width, cap: 'round' });
    path(G, d, { stroke: '#fff', sw: width * 0.28, cap: 'round', opacity: 0.25, transform: 'translate(-0.5,-0.6)' });
  }
  _plugHead(G, p, kind, color) {
    if (kind === 'bnc') {
      circ(G, p.x, p.y, 6.6, { fill: '#1a1a1a', stroke: '#000', sw: 0.4 });
      circ(G, p.x, p.y, 4.8, { fill: 'url(#gChromeR)', stroke: '#444', sw: 0.3 });
      circ(G, p.x, p.y, 2.2, { fill: '#333' });
    } else if (kind === 'din') {
      circ(G, p.x, p.y, 8.6, { fill: '#202020', stroke: '#000', sw: 0.5 });
      circ(G, p.x, p.y, 6, { fill: '#2e2e2e', stroke: '#555', sw: 0.4 });
    } else {
      circ(G, p.x, p.y, 4.4, { fill: color, stroke: '#000', sw: 0.4 });
      circ(G, p.x, p.y, 2.6, { fill: color, stroke: 'rgba(0,0,0,0.5)', sw: 0.5 });
      circ(G, p.x - 1, p.y - 1.1, 1, { fill: '#fff', opacity: 0.35 });
    }
  }
  _drawWire(w) {
    w.el.innerHTML = '';
    const p1 = w.a.world(), p2 = w.b.world();
    const bnc = w.a.kind === 'bnc' || w.b.kind === 'bnc';
    const color = bnc ? '#1b1b1b' : (CORD_COLORS[w.color] || w.color);
    const d = this._cablePath(p1, p2);
    const hit = path(w.el, d, { stroke: 'transparent', sw: 9, cap: 'round' });
    hit.setAttribute('pointer-events', 'stroke');
    this._strokeCable(w.el, d, color, bnc ? 3.4 : 2.4);
    this._plugHead(w.el, p1, w.a.kind, color);
    this._plugHead(w.el, p2, w.b.kind, color);
    this.bench.interactive(w.el, {
      tip: () => `<b>Patch cord</b>: ${w.a.name} ↔ ${w.b.name}<br><span class="tip-hint">click for options</span>`,
      title: 'Patch cord',
      menu: () => [{ label: 'Remove this cord', fn: () => this.removeWire(w) }],
    });
  }

  // ------------------------------------------------ fixed leads (instrument cables)
  // anchor(): world {x,y} where the cable leaves the device; rest: {x,y} where the free plug lies.
  addLead(o) {
    const lead = {
      id: o.id, name: o.name, kind: o.kind ?? 'banana', color: o.color ?? 'red', cable: o.cable,
      anchor: o.anchor, rest: o.rest, restAngle: o.restAngle ?? 0, plugged: null, allowMixed: !!o.allowMixed,
      width: o.width, sag: o.sag, el: g(o.layer ?? this.layer),
    };
    this.leads.push(lead);
    this._drawLead(lead);
    return lead;
  }
  plug(lead, sock, silent) {
    lead.plugged = sock;
    this._drawLead(lead);
    if (!silent) this._changed();
  }
  unplug(lead) { lead.plugged = null; this._drawLead(lead); this._changed(); }
  _drawLead(lead) {
    const G = lead.el;
    G.innerHTML = '';
    const a = lead.anchor();
    const plugColor = SOCKET_COLORS[lead.color] ?? lead.color;
    const cableColor = lead.cable ?? (lead.kind === 'banana' ? plugColor : '#1b1b1b');
    let end;
    if (lead.plugged) end = lead.plugged.world();
    else end = { x: lead.rest.x, y: lead.rest.y };
    const d = this._cablePath(a, end, lead.sag);
    this._strokeCable(G, d, cableColor, lead.width ?? (lead.kind === 'banana' ? 2.2 : 3.4));
    const plugG = g(G);
    circ(plugG, end.x, end.y - (lead.plugged ? 0 : 8), lead.plugged ? 9 : 13, { fill: 'rgba(0,0,0,0)', pe: 'all' });
    if (lead.plugged) this._plugHead(plugG, end, lead.kind, plugColor);
    else {
      // plug lying on the bench
      const pg = g(plugG, { transform: `translate(${end.x},${end.y}) rotate(${lead.restAngle})` });
      if (lead.kind === 'banana') {
        rect(pg, -2.6, -12, 5.2, 12, { fill: plugColor, stroke: '#000', sw: 0.4, r: 1.6 });
        rect(pg, -0.9, -17, 1.8, 5.5, { fill: 'url(#gChromeH)', stroke: '#666', sw: 0.2 });
      } else if (lead.kind === 'bnc') {
        rect(pg, -4, -14, 8, 14, { fill: '#1d1d1d', stroke: '#000', sw: 0.4, r: 2 });
        rect(pg, -5, -21, 10, 7.5, { fill: 'url(#gChromeH)', stroke: '#555', sw: 0.3, r: 1 });
      } else {
        rect(pg, -6.5, -17, 13, 17, { fill: '#252525', stroke: '#000', sw: 0.4, r: 3 });
        rect(pg, -6, -22, 12, 6, { fill: 'url(#gChromeH)', stroke: '#555', sw: 0.3, r: 1 });
      }
    }
    lead.halo = circ(G, end.x, end.y, 11, { stroke: '#ffd400', sw: 1.6, opacity: this.pending && this.pending.lead === lead ? 1 : 0, pe: 'none' });
    this.bench.interactive(plugG, {
      tip: () => `<b>${lead.name}</b>${lead.plugged ? ' → ' + lead.plugged.name : ' (not connected)'}<br><span class="tip-hint">click to pick up the plug</span>`,
      click: () => this.clickLead(lead),
    });
  }
  refresh() {
    this.wires.forEach(w => this._drawWire(w));
    this.leads.forEach(l => this._drawLead(l));
  }
  refreshLead(lead) { this._drawLead(lead); }

  // ------------------------------------------------ connectivity
  _build() {
    const parent = new Map();
    const find = (x) => { if (!parent.has(x)) parent.set(x, x); let r = x; while (parent.get(r) !== r) r = parent.get(r); parent.set(x, r); return r; };
    const uni = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
    for (const w of this.wires) uni(w.a.id, w.b.id);
    for (const l of this.leads) if (l.plugged) uni(l.id, l.plugged.id);
    for (const [a, b] of this.links) uni(a, b);
    this._uf = find;
  }
  net(id) { if (!this._uf) this._build(); return this._uf(id); }
  connected(a, b) { return this.net(a) === this.net(b); }
  leadSocket(leadId) { const l = this.leads.find(x => x.id === leadId); return l && l.plugged ? l.plugged.id : null; }
  hasWire(a, b) { return this.wires.some(w => (w.a.id === a && w.b.id === b) || (w.a.id === b && w.b.id === a)); }
  clearAll() {
    [...this.wires].forEach(w => w.el.remove());
    this.wires = [];
    this.leads.forEach(l => { l.plugged = null; this._drawLead(l); });
    this._changed();
  }
}
