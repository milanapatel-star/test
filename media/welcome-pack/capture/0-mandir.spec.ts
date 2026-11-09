import { devices, expect, test } from "@playwright/test";
import { logIn } from "./helpers";
import { snap } from "./zz-capture-lib";

// Stage 0, before any events exist: a mandir's page as Toran first lists
// it, and a trustee (Anil, made up) asking to look after it, on a phone.

const SLUG = "shree-sample-mandir-anytown";
const phone = { ...devices["iPhone 13"], deviceScaleFactor: 3, locale: "en-GB", timezoneId: "Europe/London" };

test("a trustee claims the page", async ({ browser }) => {
  test.setTimeout(300_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  await page.goto(`/mandirs/${SLUG}`);
  await page.waitForTimeout(1200);
  const lookAfter = page.getByRole("link", { name: "Look after this page" });
  await snap(page, "m-mandir-new", { lookAfter });
  await snap(page, "tabbar", {}, { full: false });

  await logIn(page, "anil@example.org");
  await expect(page).toHaveURL(/\/account$/);
  await snap(page, "m-account-new", {}, { full: false });
  await page.goto(`/mandirs/${SLUG}/claim`);
  await page.waitForTimeout(800);
  const role = page.getByLabel(/Your role/);
  const send = page.getByRole("button", { name: "Send request" });
  const boxes = page.getByRole("checkbox");
  await snap(page, "m-claim", { role, send, tick1: boxes.nth(0), tick2: boxes.nth(1) });
  await role.fill("Trustee");
  await page.getByRole("textbox").nth(1).fill("Please ring the mandir office on a weekday morning.").catch(() => undefined);
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await snap(page, "m-claim-filled", { role, send, tick1: boxes.nth(0), tick2: boxes.nth(1) });
  await send.click();
  await page.waitForTimeout(1500);
  await snap(page, "m-claim-sent", {}, { full: false });
});
