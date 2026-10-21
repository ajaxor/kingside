// A very small stand-in for the DOM, enough for the launcher and the title screen to run under node:test.
class FakeEl {
  constructor(tag) { this.tagName = tag; this.className = ''; this.textContent = ''; this.hidden = false; this.disabled = false; this.children = []; this.listeners = {}; this.parent = null; this.isConnected = false; this.innerHTML = ''; this.style = { setProperty: (k, v) => { this.vars = { ...this.vars, [k]: v }; } }; }
  append(...kids) { for (const k of kids) { k.parent = this; k.isConnected = this.isConnected; this.children.push(k); } }
  appendChild(k) { this.append(k); return k; }
  insertBefore(k, ref) { k.parent = this; k.isConnected = this.isConnected; const i = this.children.indexOf(ref); this.children.splice(i < 0 ? this.children.length : i, 0, k); return k; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this); this.isConnected = false; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  click() { for (const fn of this.listeners.click || []) fn(); }
  find(cls) { for (const k of this.children) { if (k.className.split(' ').includes(cls)) return k; const f = k.find(cls); if (f) return f; } return null; }
}
export function fakeDoc() {
  const doc = new FakeEl('document');
  doc.isConnected = true;
  doc.body = new FakeEl('body'); doc.body.isConnected = true;
  doc.head = new FakeEl('head'); doc.head.isConnected = true;
  const classes = new Set(['loading']);
  doc.body.classList = { add: (c) => classes.add(c), remove: (c) => classes.delete(c), has: (c) => classes.has(c) };
  const boot = new FakeEl('div'); boot.id = 'boot'; doc.body.append(boot);
  doc.getElementById = (id) => (id === 'boot' && boot.isConnected ? boot : null);
  doc.createElement = (tag) => new FakeEl(tag);
  doc.hidden = false;
  return doc;
}
