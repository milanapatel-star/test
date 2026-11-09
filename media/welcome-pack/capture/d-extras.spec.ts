import { test } from "@playwright/test";
import { snap } from "./zz-capture-lib";

// Stage 3: odds and ends, after the others.
const SLUG = "shree-sample-mandir-anytown";

test("extras", async ({ browser }) => {
  test.setTimeout(180_000);
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    storageState: "/home/user/test/media/welcome-pack/shots/priya.json",
  });
  const page = await ctx.newPage();
  await page.goto(`/manage/${SLUG}`);
  const heading = page.getByRole("heading", { name: "Send this week's events" });
  const send = page.getByRole("link", { name: "Send on WhatsApp" }).first();
  await snap(page, "c-share", { heading, send }, { full: false, center: heading });
});
