require("./rhythm.js"); const R = globalThis.Rhythm; const fs = require("fs");
const P = JSON.parse(fs.readFileSync("posts.json", "utf8")); const by = Object.fromEntries(P.map((p, i) => [p.id, i]));
global.window = {}; eval(fs.readFileSync("proposal.js", "utf8").replace(/window\./g, "global.window."));
let order = window.PROPOSAL.filter((id) => by[id] !== undefined && !id.startsWith("W-")).map((id) => by[id]);
const parked = window.PROPOSAL_PARKED;
const before = R.evaluate(order, P, R.DEFAULTS, true);
const web = ["W-01", "W-04", "W-02", "W-06", "W-05", "W-03"].map((id) => by[id]);
const N = order.length + web.length, step = N / web.length;
// rovnomerné sloty (začína sa v prvej šestine feedu), v okolí ±5 sa hľadá miesto bez porušení
web.forEach((w, k) => {
  const target = Math.round(step * k + step * 0.45);
  let best = null;
  for (let at = Math.max(0, target - 5); at <= Math.min(order.length, target + 5); at++) {
    const o = order.slice(); o.splice(at, 0, w);
    const e = R.evaluate(o, P, { ...R.DEFAULTS, accent: false }, true);
    const k2 = e.issues.length * 1000 + e.total + Math.abs(at - target) * 2;
    if (!best || k2 < best.k) best = { k: k2, o };
  }
  order = best.o;
});
const e = R.evaluate(order, P, R.DEFAULTS, true);
console.log("pred:", before.issues.length, "po:", e.issues.length, e.issues.map((x) => x.type));
const ids = order.map((i) => P[i].id);
console.log("web na:", ids.map((id, i) => id.startsWith("W-") ? i + 1 : 0).filter(Boolean).join(","), "| vizuály:", ids.map((id, i) => id.startsWith("V-") ? i + 1 : 0).filter(Boolean).join(","));
fs.writeFileSync("proposal.js", "window.PROPOSAL=" + JSON.stringify(ids) + ";\nwindow.PROPOSAL_PARKED=" + JSON.stringify(parked) + ";");
