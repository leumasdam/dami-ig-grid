require("./rhythm.js"); const R = globalThis.Rhythm; const fs = require("fs");
const P = JSON.parse(fs.readFileSync("posts.json", "utf8")); const by = Object.fromEntries(P.map((p, i) => [p.id, i]));
global.window = {}; eval(fs.readFileSync("proposal.js", "utf8").replace(/window\./g, "global.window."));
let order = window.PROPOSAL.map((id) => by[id]); const parked = window.PROPOSAL_PARKED.slice();
const n = order.length, web = ["W-01", "W-04", "W-02", "W-06", "W-05", "W-03"].map((id) => by[id]);
const LOGO = (p) => p.cat !== "vizual" && p.cat !== "web" && (p.cat === "znacka" || p.cat === "merch" || p.tone === "red");
const out = [];
web.forEach((w, k) => {
  const target = Math.round((n / 6) * k + (n / 6) * 0.5);
  let best = null;
  for (let at = Math.max(0, target - 12); at <= Math.min(n - 1, target + 12); at++) {
    const cur = P[order[at]]; if (!LOGO(cur)) continue;
    const o = order.slice(); o[at] = w;
    const e = R.evaluate(o, P, R.DEFAULTS, true);
    const k2 = e.issues.length * 1000 + e.total + Math.abs(at - target) * 1.5 + (cur.q === 1 ? -3 : cur.q === 3 ? 6 : 0);
    if (!best || k2 < best.k) best = { k: k2, o, at, cur };
  }
  order = best.o; out.push(best.cur.id); console.log(`#${best.at + 1}: ${P[w].title}  ←  nahradil „${best.cur.title}“ (${best.cur.cat})`);
});
const e = R.evaluate(order, P, R.DEFAULTS, true);
console.log("porušení:", e.issues.length, e.issues.map((x) => x.type));
fs.writeFileSync("proposal.js", "window.PROPOSAL=" + JSON.stringify(order.map((i) => P[i].id)) + ";\nwindow.PROPOSAL_PARKED=" + JSON.stringify([...out, ...parked]) + ";");
