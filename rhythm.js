/* DAMI grid – hodnotenie a optimalizácia vizuálneho rytmu. Funguje v prehliadači (window.Rhythm) aj v Node. */
(function (root) {
  const DEFAULTS = {
    layouts: [3, 6],          // pre ktoré počty stĺpcov rytmus platí (mobil 3, PC 6)
    tonePattern: "diagonal",  // diagonal | spread | none
    cat: true,                // rovnaký druh nesusedí
    dup: true,                // varianty toho istého postu ďaleko od seba
    kind: true,               // striedať typografiu / fotky / objekty
    red: true,                // červené akcenty rozptýliť
    top: true,                // najlepšie posty (q=3) hore, slabšie (q=1) dole
    accent: true,             // ucelené vizuály (cat vizual) rovnomerne prestriedať celým feedom
  };

  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  /** Vráti { total, issues: [{i, j, type}] } pre dané poradie. */
  function evaluate(order, P, opt = DEFAULTS, collect = false) {
    const o = { ...DEFAULTS, ...opt };
    let total = 0; const issues = collect ? [] : null;
    const hit = (w, i, j, type) => { total += w; if (issues) issues.push({ i, j, type }); };
    const n = order.length;
    if (o.top) {
      // horná tretina feedu je výklad – tam patria najsilnejšie posty
      for (let i = 0; i < n; i++) {
        const q = P[order[i]].q ?? 2, x = i / (n - 1);
        if (q === 3) total += x * x * 14;
        else if (q === 1) total += (1 - x) * (1 - x) * 10;
      }
    }
    if (o.accent) {
      // pravidelný pulz: medzi vizuálmi rovnaký odstup, prvý už v prvých riadkoch
      const pos = []; for (let i = 0; i < n; i++) if (P[order[i]].cat === "vizual") pos.push(i);
      if (pos.length > 1) {
        const ideal = n / pos.length;
        total += Math.pow(Math.max(0, pos[0] - ideal * 0.5), 2) * 0.08;
        for (let k = 1; k < pos.length; k++) {
          const gap = pos[k] - pos[k - 1];
          if (gap < ideal * 0.55) hit(3, pos[k - 1], pos[k], "vizuály príliš blízko");
          total += Math.pow(gap - ideal, 2) * 0.12;
          for (const C of o.layouts) if (pos[k] % C === pos[k - 1] % C) total += 1.2; // nie stále v tom istom stĺpci
        }
      }
    }
    for (const C of o.layouts) {
      const k = C <= 3 ? 3 : 4;
      for (let i = 0; i < n; i++) {
        const a = P[order[i]], r = Math.floor(i / C), c = i % C;
        const nb = [];
        if (c < C - 1 && i + 1 < n) nb.push(i + 1);
        if (i + C < n) nb.push(i + C);
        for (const j of nb) {
          const b = P[order[j]];
          if (o.cat && a.cat === b.cat) hit(6, i, j, "druh");
          if (a.tone === "dark" && b.tone === "dark") hit(5, i, j, "tmavé vedľa seba");
          if (o.red && a.tone === "red" && b.tone === "red") hit(3, i, j, "červené vedľa seba");
          if (o.kind && a.kind === "T" && b.kind === "T") hit(3, i, j, "typografia vedľa seba");
        }
        if (o.kind && c <= C - 3 && i + 2 < n) {
          const b = P[order[i + 1]], d = P[order[i + 2]];
          if (a.kind === b.kind && b.kind === d.kind) hit(2, i, i + 2, "3× rovnaký typ v rade");
        }
        if (o.tonePattern === "diagonal") {
          const want = (r + c) % k === 0;
          if (want !== (a.tone === "dark")) total += 1.6;
        }
      }
      if (o.dup) {
        // grp = varianty toho istého postu (ďaleko), head = rovnaký nadpis/motív (aspoň nie tesne vedľa)
        for (const [key, reach, w, label] of [["grp", 3, 22, "duplikát blízko"], ["head", 2, 9, "rovnaký nadpis blízko"]]) {
          const groups = {};
          for (let i = 0; i < n; i++) { const g = P[order[i]][key]; if (g) (groups[g] ||= []).push(i); }
          for (const pos of Object.values(groups)) {
            for (let x = 0; x < pos.length; x++) for (let y = x + 1; y < pos.length; y++) {
              const i = pos[x], j = pos[y];
              if (key === "head" && P[order[i]].grp && P[order[i]].grp === P[order[j]].grp) continue;
              const dist = Math.abs(Math.floor(j / C) - Math.floor(i / C)) + Math.abs((j % C) - (i % C));
              if (dist <= reach) hit(w / dist, i, j, label);
            }
          }
        }
      }
      // jemné pravidlá (nepočítajú sa ako kolízie): pestrý riadok – rôzne druhy, v 6-stĺpci každý typ aspoň raz
      for (let r = 0; r * C < n; r++) {
        const cats = new Set(), kinds = new Set(); let cnt = 0;
        for (let c = 0; c < C && r * C + c < n; c++) { const p = P[order[r * C + c]]; cats.add(p.cat); kinds.add(p.kind); cnt++; }
        total += (cnt - cats.size) * 0.7;
        if (C >= 6 && cnt === C) total += Math.max(0, 3 - kinds.size) * 0.9;
      }
      if (o.tonePattern === "spread") {
        for (let r = 0; r * C < n; r++) {
          let d = 0; for (let c = 0; c < C && r * C + c < n; c++) if (P[order[r * C + c]].tone === "dark") d++;
          const ideal = C <= 3 ? 1 : 2;
          total += Math.abs(d - ideal) * 2.5;
        }
      }
    }
    return { total, issues };
  }

  /** Simulované žíhanie: vymieňa odomknuté pozície a hľadá poradie s najnižšou cenou. */
  function optimize(order, P, opt = DEFAULTS, { seed = 7, locked = new Set(), iters = 60000 } = {}) {
    const rand = rng(seed);
    const free = order.map((_, i) => i).filter((i) => !locked.has(order[i]));
    let cur = order.slice();
    // náhodný štart pre voľné pozície
    const pool = free.map((i) => cur[i]);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    free.forEach((i, k) => (cur[i] = pool[k]));
    let cost = evaluate(cur, P, opt).total, best = cur.slice(), bestCost = cost;
    let T = 8;
    for (let it = 0; it < iters; it++) {
      const a = free[Math.floor(rand() * free.length)], b = free[Math.floor(rand() * free.length)];
      if (a === b) continue;
      [cur[a], cur[b]] = [cur[b], cur[a]];
      const c2 = evaluate(cur, P, opt).total;
      if (c2 <= cost || rand() < Math.exp((cost - c2) / T)) { cost = c2; if (c2 < bestCost) { bestCost = c2; best = cur.slice(); } }
      else [cur[a], cur[b]] = [cur[b], cur[a]];
      T = Math.max(0.05, T * 0.99992);
    }
    return { order: best, cost: bestCost };
  }

  const api = { DEFAULTS, evaluate, optimize };
  if (typeof module !== "undefined") module.exports = api; else root.Rhythm = api;
})(typeof window !== "undefined" ? window : globalThis);
