import type { Locator, Page } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

// Screenshots of Toran's real screens for the welcome-pack films, each
// with the positions of the things the film points at, clicks or types
// into. Positions are in CSS pixels from the top of the page; the films
// scale them with the picture.

export const SHOTS = "/home/user/test/media/welcome-pack/shots";
const MANIFEST = `${SHOTS}/manifest.json`;

type Box = { x: number; y: number; w: number; h: number };
export type Shot = {
  file: string;
  width: number; // page width, CSS px
  height: number; // page height, CSS px (whole page)
  viewport: { w: number; h: number };
  scale: number; // device pixels per CSS px in the file
  scrollY: number; // where the window was when it was taken
  targets: Record<string, Box>;
};

let manifest: Record<string, Shot> = existsSync(MANIFEST)
  ? JSON.parse(readFileSync(MANIFEST, "utf8"))
  : {};

export async function box(target: Locator): Promise<Box> {
  await target.waitFor({ state: "visible", timeout: 10_000 });
  return target.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x + window.scrollX),
      y: Math.round(r.y + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  });
}

// The phone's tab bar is fixed to the bottom of the screen, so a
// whole-page picture would show it in the middle of the page. It's hidden
// for whole-page pictures and drawn back on by the films, from its own
// picture ("tabbar").
const HIDE_TABS = ".tab-bar{display:none!important}";

export async function snap(
  page: Page,
  name: string,
  targets: Record<string, Locator> = {},
  { full = true, center }: { full?: boolean; center?: Locator } = {},
) {
  mkdirSync(SHOTS, { recursive: true });
  if (center) {
    await center.waitFor({ state: "visible", timeout: 10_000 });
    await center.evaluate((el) =>
      el.scrollIntoView({ block: "center", behavior: "instant" }),
    );
  }
  await page.waitForTimeout(700);
  const boxes: Record<string, Box> = {};
  for (const [key, loc] of Object.entries(targets)) boxes[key] = await box(loc);
  const scrollY = await page.evaluate(() => window.scrollY);
  const style = full
    ? await page.addStyleTag({ content: HIDE_TABS })
    : null;
  const file = `${name}.jpg`;
  await page.screenshot({
    path: `${SHOTS}/${file}`,
    fullPage: full,
    type: "jpeg",
    quality: 90,
    animations: "disabled",
    caret: "initial",
  });
  if (style) await style.evaluate((el) => (el as Element).remove());
  const size = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    vw: window.innerWidth,
    vh: window.innerHeight,
    dpr: window.devicePixelRatio,
  }));
  manifest[name] = {
    file,
    width: size.width,
    height: full ? size.height : size.vh,
    viewport: { w: size.vw, h: size.vh },
    scale: size.dpr,
    scrollY: full ? scrollY : 0,
    targets: full
      ? boxes
      : Object.fromEntries(
          Object.entries(boxes).map(([k, b]) => [k, { ...b, y: b.y - scrollY }]),
        ),
  };
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
}

// A London calendar date, `days` from today.
export function day(days: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(
    new Date(Date.now() + days * 86_400_000),
  );
}

// The next given weekday (0 Sunday … 6 Saturday), at least `min` days on.
export function nextWeekday(weekday: number, min = 1): string {
  for (let d = min; d < min + 8; d++) {
    const date = new Date(Date.now() + d * 86_400_000);
    const wd = new Date(
      new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(
        date,
      ) + "T12:00:00Z",
    ).getUTCDay();
    if (wd === weekday) return day(d);
  }
  return day(min);
}
