import { chromium } from "/home/user/toran-main-code/node_modules/@playwright/test/index.mjs";
const [exe, dir, mode, fps="30"] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: exe });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
const errs=[]; p.on("pageerror", e=>errs.push(e.message)); p.on("console", m=>{ if(m.type()==="error") errs.push(m.text()); });
await p.goto("file://" + dir + "/scene.html");
await p.evaluate(() => document.fonts.ready);
if (mode === "keys") {
  for (const t of [5.6, 12.4, 13.7, 16.2, 20.6, 22.4]) {
    await p.evaluate((t) => window.render(t), t);
    await p.screenshot({ path: `${dir}/key-${t}.png` });
  }
} else {
  const D = await p.evaluate(() => window.DURATION), F = Math.round(D * +fps);
  for (let f = 0; f < F; f++) {
    await p.evaluate((t) => window.render(t), f / +fps);
    await p.screenshot({ path: `${dir}/frames/${String(f).padStart(4, "0")}.png` });
  }
  console.log("frames", F);
}
console.log("errors", JSON.stringify(errs));
await b.close();
