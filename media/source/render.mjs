import { chromium } from "/home/user/toran-main-code/node_modules/@playwright/test/index.mjs";
const [exe, dir, mode, fps="30"] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: exe });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
const errs=[]; p.on("pageerror", e=>errs.push(e.message)); p.on("console", m=>{ if(m.type()==="error") errs.push(m.text()); });
await p.goto("file://" + dir + "/scene.html");
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
if (mode === "keys") {
  for (const t of (process.env.KEYS || "5,12,18,24,30,36,42,48,54,58").split(",").map(Number)) {
    await p.evaluate((t) => window.render(t), t);
    await p.screenshot({ path: `${dir}/keys/key-${t}.png` });
  }
} else {
  const D = await p.evaluate(() => window.DURATION), F = Math.round(D * +fps);
  const from = +(process.env.FROM || 0), to = +(process.env.TO || F);
  for (let f = from; f < to; f++) {
    await p.evaluate((t) => window.render(t), f / +fps);
    await p.screenshot({ path: `${dir}/frames/${String(f).padStart(4, "0")}.png` });
  }
  console.log("frames", F);
}
console.log("errors", JSON.stringify(errs));
await b.close();
