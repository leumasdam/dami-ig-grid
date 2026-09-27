require("./rhythm.js"); const R = globalThis.Rhythm; const fs = require("fs");
const P = JSON.parse(fs.readFileSync("posts.json", "utf8")); const by = Object.fromEntries(P.map((p, i) => [p.id, i]));
global.window = {}; eval(fs.readFileSync("proposal.js", "utf8").replace(/window\./g, "global.window."));
let order = window.PROPOSAL.map((id) => by[id]);
const NEW = ["H-02", "H-04", "V-15", "H-06", "H-03", "H-09", "H-08", "H-10"];
let parked = window.PROPOSAL_PARKED.filter((id) => !NEW.includes(id));
const n = order.length;
// koľko postov zdieľa rovnaký nadpis / skupinu – opakovania sú prvé na výmenu
const cnt = {}; order.forEach((i) => { const p = P[i]; for (const k of [p.grp, p.head]) if (k) cnt[k] = (cnt[k] || 0) + 1; });
const value = (p) => (p.q === 1 ? -6 : p.q === 3 ? 8 : 0) + ((p.cat === "znacka" || p.cat === "merch" || p.tone === "red") ? -3 : 0) - Math.max(cnt[p.grp] || 0, cnt[p.head] || 0);
let left = NEW.map((id) => by[id]); const placed = [];
while (left.length) {
  let best = null;
  for (const w of left) for (let at = 0; at < n; at++) {
    const cur = P[order[at]];
    if (cur.cat === "web" || NEW.includes(cur.id) || (cur.cat === "vizual") !== (P[w].cat === "vizual")) continue;
    const near = placed.length ? Math.min(...placed.map((x) => Math.abs(x - at))) : 99;
    if (near < 4 && P[w].cat !== "vizual") continue;
    const o = order.slice(); o[at] = w;
    const e = R.evaluate(o, P, R.DEFAULTS, true);
    if (e.issues.length) continue; // len miesta bez porušení na mobile aj PC
    const k2 = e.issues.length * 1000 + e.total + value(cur) * 3 - Math.min(near, 14) * 0.8;
    if (!best || k2 < best.k) best = { k: k2, o, at, cur, w };
  }
  order = best.o; parked.unshift(best.cur.id); placed.push(best.at); left = left.filter((x) => x !== best.w);
  for (const kk of [best.cur.grp, best.cur.head]) if (kk) cnt[kk]--;
  console.log(`#${best.at + 1}: ${P[best.w].title}  ←  „${best.cur.title}“ (${best.cur.cat}, q${best.cur.q})`);
}
const e = R.evaluate(order, P, R.DEFAULTS, true);
console.log("porušení:", e.issues.length, e.issues.map((x) => x.type), "| odložených:", parked.length);
fs.writeFileSync("proposal.js", "window.PROPOSAL=" + JSON.stringify(order.map((i) => P[i].id)) + ";\nwindow.PROPOSAL_PARKED=" + JSON.stringify(parked) + ";");
