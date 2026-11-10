// Renders the Reel's frames with Playwright (a copy of ../engine/render.mjs).
//   node render.mjs reel keys 3,10,20       stills at those seconds
//   node render.mjs reel frames [fps=30]     every frame (FROM/TO for a range)
//   node render.mjs reel cues                the sound cues, as JSON
import { chromium } from "/home/user/toran-main-code/node_modules/@playwright/test/index.mjs";
import { mkdirSync, writeFileSync } from "node:fs";

const [film, mode, arg] = process.argv.slice(2);
const dir = new URL(".", import.meta.url).pathname;
const out = process.env.OUT || `${dir}../out/reel`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--allow-file-access-from-files"] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.goto(`file://${dir}reel.html`);
await p.evaluate(() => document.fonts.ready);
await p.evaluate(async () => {
  await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
});
await p.waitForTimeout(400);
const problems = await p.evaluate(() => { window.render(0.01); return window.runChecks(); });
if (problems.length) {
  console.log("FRAMING PROBLEMS:\n  " + problems.join("\n  "));
  if (mode === "cues" || mode === "check") process.exitCode = 1;
} else console.log("framing checks passed");
if (mode === "check") {
  // the framing checks above are all
} else if (mode === "keys") {
  mkdirSync(`${out}/keys`, { recursive: true });
  for (const t of (arg || "2,6,10").split(",").map(Number)) {
    await p.evaluate((t) => window.render(t), t);
    await p.screenshot({ path: `${out}/keys/k-${String(t).padStart(6, "0")}.jpg`, type: "jpeg", quality: 85 });
  }
} else if (mode === "cues") {
  const info = await p.evaluate(() => ({ duration: window.DURATION, cues: window.CUES, scenes: window.SCENES }));
  mkdirSync(out, { recursive: true });
  writeFileSync(`${out}/cues.json`, JSON.stringify(info, null, 1));
  console.log("duration", info.duration, "cues", info.cues.length);
} else {
  const fps = +(arg || 30);
  const D = await p.evaluate(() => window.DURATION), F = Math.round(D * fps);
  const from = +(process.env.FROM || 0), to = Math.min(F, +(process.env.TO || F));
  mkdirSync(`${out}/frames`, { recursive: true });
  for (let f = from; f < to; f++) {
    await p.evaluate((t) => window.render(t), f / fps);
    await p.screenshot({ path: `${out}/frames/${String(f).padStart(5, "0")}.jpg`, type: "jpeg", quality: 92 });
  }
  console.log("frames", from, to, "of", F);
}
console.log("errors", JSON.stringify(errs));
await b.close();
