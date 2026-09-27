require("./rhythm.js"); const R = globalThis.Rhythm; const fs = require("fs");
const ALL = JSON.parse(fs.readFileSync("posts.json", "utf8"));
const NEW = new Set(["H-02","H-03","H-04","H-06","H-08","H-09","H-10","V-15"]);
const P = ALL.filter((p) => !NEW.has(p.id));
console.log("postov v stave 110:", P.length);
const psd = P.map((_, i) => i); let best = null;
for (const seed of [3, 7, 11, 19, 23, 42]) {
  const r = R.optimize(psd, P, R.DEFAULTS, { seed, iters: 120000 });
  const e = R.evaluate(r.order, P, R.DEFAULTS, true);
  const k = e.issues.length * 1000 + r.cost; console.log("seed", seed, r.cost.toFixed(1), "kolizii", e.issues.length);
  if (!best || k < best.k) best = { ...r, seed, k };
}
const ids = best.order.map((i) => P[i].id);
console.log("seed", best.seed, "vizuály na:", ids.map((id, i) => id.startsWith("V-") ? i + 1 : 0).filter(Boolean).join(","));
fs.writeFileSync("proposal.js", "window.PROPOSAL=" + JSON.stringify(ids) + ";\nwindow.PROPOSAL_PARKED=" + JSON.stringify([...NEW]) + ";");
