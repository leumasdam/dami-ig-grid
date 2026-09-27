require("./rhythm.js"); const R = globalThis.Rhythm; const fs = require("fs");
const P = JSON.parse(fs.readFileSync("posts.json", "utf8")); const by = Object.fromEntries(P.map((p, i) => [p.id, i]));
global.window = {}; eval(fs.readFileSync("proposal.js", "utf8").replace(/window\./g, "global.window."));
const order = window.PROPOSAL.map((id) => by[id]);
for (const C of [3, 6]) { const e = R.evaluate(order, P, { ...R.DEFAULTS, layouts: [C] }, true); for (const x of e.issues) console.log(C, x.type, `#${x.i + 1} ${P[order[x.i]].title}`, "↔", `#${x.j + 1} ${P[order[x.j]].title}`); }
