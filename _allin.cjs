require("./rhythm.js"); const R = globalThis.Rhythm; const fs = require("fs");
const P = JSON.parse(fs.readFileSync("posts.json", "utf8")); const by = Object.fromEntries(P.map((p, i) => [p.id, i]));
global.window = {}; eval(fs.readFileSync("proposal.js", "utf8").replace(/window\./g, "global.window."));
const base = window.PROPOSAL.map((id) => by[id]), extra = window.PROPOSAL_PARKED.map((id) => by[id]);
console.log("grid", base.length, "odložené", extra.length);
const rows = base.length / 6; let best = null;
for (let a = 3; a < rows - 4; a++) for (let b = a + 4; b < rows - 1; b++) {
  // nový riadok po riadku a a po riadku b, zvyšok (extra.length - 12) na koniec
  const o = [...base.slice(0, a * 6), ...extra.slice(0, 6), ...base.slice(a * 6, b * 6), ...extra.slice(6, 12), ...base.slice(b * 6), ...extra.slice(12)];
  // odomknuté: pridané posty + riadok nad a pod každým vloženým riadkom
  const unlockPos = new Set();
  for (const ins of [a * 6, (b + 1) * 6]) for (let i = ins - 12; i < ins + 18; i++) if (i >= 0 && i < o.length) unlockPos.add(i);
  for (let i = o.length - (extra.length - 12) - 6; i < o.length; i++) unlockPos.add(i);
  const locked = new Set(o.filter((pi, i) => !unlockPos.has(i) && base.includes(pi)));
  const r = R.optimize(o, P, R.DEFAULTS, { seed: a * 31 + b, locked, iters: 20000 });
  const e = R.evaluate(r.order, P, R.DEFAULTS, true); const k = e.issues.length * 1000 + r.cost;
  if (!best || k < best.k) best = { k, order: r.order, a, b, n: e.issues.length };
}
console.log("nové riadky po riadku", best.a, "a", best.b, "| porušení", best.n);
// dolaď: znova optimalizuj len pridané posty (všetky pozície okrem pôvodných)
const e = R.evaluate(best.order, P, R.DEFAULTS, true); console.log(e.issues.map((x) => x.type));
fs.writeFileSync("proposal.js", "window.PROPOSAL=" + JSON.stringify(best.order.map((i) => P[i].id)) + ";\nwindow.PROPOSAL_PARKED=[];");
