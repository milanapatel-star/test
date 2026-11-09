// Prints each film's narration script (what each caption says, and when)
// as JSON, for the welcome pack's voiceover scripts.
import { readFileSync } from "node:fs";
const out = {};
for (const name of ["mandirs", "committee", "families"]) {
  const window = {};
  new Function("window", readFileSync(new URL(`../films/${name}.js`, import.meta.url), "utf8"))(window);
  let at = 0;
  const lines = [];
  for (const s of window.FILM.scenes) {
    if (s.kind === "intro") {
      lines.push({ t: at, title: s.title, text: [s.title, s.sub].filter(Boolean).join(" · ").replace(/<[^>]+>/g, "") });
    } else if (s.kind === "night") {
      const text = [s.title, s.sub, ...(s.lines || []).map((l) => l.text), ...(s.items || []), s.foot, s.url].filter(Boolean).join(" · ");
      lines.push({ t: at, title: s.title || "", text: text.replace(/<br>/g, " ").replace(/<[^>]+>/g, "") });
    } else {
      for (const c of s.captions || [{ at: 0, title: s.title, body: s.body }]) {
        lines.push({ t: +(at + c.at).toFixed(1), title: c.title, text: (c.body || "").replace(/<[^>]+>/g, "") });
      }
    }
    at += s.dur;
  }
  out[name] = { duration: +at.toFixed(1), lines };
}
console.log(JSON.stringify(out, null, 1));
