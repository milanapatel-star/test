import { devices, expect, test } from "@playwright/test";
import { snap } from "./zz-capture-lib";

// Stage 2, after stage 1 has added the example events: a family finding
// what's on, on a phone, as someone in Anytown (made up). Then the same
// committee member on her phone, sharing a WhatsApp message into Toran.

const SLUG = "shree-sample-mandir-anytown";
const ANYTOWN = { latitude: 52.6369, longitude: -1.1398 };
const phone = {
  ...devices["iPhone 13"],
  deviceScaleFactor: 3,
  locale: "en-GB",
  timezoneId: "Europe/London",
  geolocation: ANYTOWN,
  permissions: ["geolocation"],
};
const MESSAGE = `Jai Shree Krishna 🙏
Gita Jayanti path this Sunday 20 December, 10am in the main hall. All welcome, prasad after.`;

test("a family on a phone", async ({ browser }) => {
  test.setTimeout(420_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();

  // The welcome.
  await page.goto("/");
  await page.waitForTimeout(2500);
  await snap(page, "f-home", {}, { full: false });
  await snap(page, "f-home-full", {});

  // What's on, near Anytown.
  await page.goto("/whats-on");
  await page.waitForTimeout(1200);
  const choose = page.getByText(/Find near me|Change/).first();
  const kartik = page.getByRole("link", { name: /Kartik Purnima/ }).first();
  await snap(page, "f-whatson", { choose, kartik });
  await snap(page, "f-whatson-top", { choose }, { full: false });
  await choose.click();
  await page.waitForTimeout(800);
  const useLocation = page.getByRole("button", { name: /location/i }).first();
  await snap(page, "f-picker", { useLocation }, { full: false });
  await useLocation.click();
  await page.waitForTimeout(3500);
  await snap(page, "f-picker-found", {}, { full: false });
  const show = page.getByRole("button", { name: /^Show/ }).first();
  if (await show.isVisible().catch(() => false)) await show.click();
  await page.waitForTimeout(2000);
  await snap(page, "f-whatson-near", { kartik }, { full: false, center: kartik });
  await snap(page, "f-whatson-near-full", { kartik });

  // One event.
  await kartik.click();
  await page.waitForTimeout(1500);
  const calendar = page.getByText(/Add to calendar/i).first();
  const whatsapp = page.getByRole("link", { name: /WhatsApp/ }).first();
  const seva = page.getByRole("link", { name: /seva/i }).first();
  await snap(page, "f-event", { calendar, whatsapp, seva });
  await snap(page, "f-event-top", {}, { full: false });
  // Sharing first, while the calendar choices are closed.
  await snap(page, "f-event-share", { whatsapp }, { full: false, center: whatsapp });
  await calendar.click();
  await page.waitForTimeout(700);
  await snap(page, "f-event-calendar", { calendar }, { full: false, center: calendar });
  const eventUrl = page.url();

  // Seva: take a slot.
  if (await seva.isVisible().catch(() => false)) {
    await seva.click();
    await page.waitForTimeout(1200);
    const take = page.getByRole("button", { name: /Take this slot/ }).first();
    await snap(page, "f-seva", { take });
    await snap(page, "f-seva-top", { take }, { full: false, center: take });
    await take.click();
    await page.waitForTimeout(1200);
    await snap(page, "f-seva-taken", {}, { full: false });
  }

  // The mandir: follow it.
  await page.goto(`/mandirs/${SLUG}`);
  await page.waitForTimeout(1500);
  const follow = page.getByRole("button", { name: "Follow" }).first();
  await snap(page, "f-mandir", { follow });
  await snap(page, "f-mandir-top", { follow }, { full: false });
  await follow.click();
  await page.waitForTimeout(800);
  await snap(page, "f-mandir-followed", { follow: page.getByRole("button", { name: "Following" }).first() }, { full: false });

  // My Toran.
  await page.goto("/my");
  await page.waitForTimeout(1500);
  await snap(page, "f-my", {});
  await snap(page, "f-my-top", {}, { full: false });

  // The map: near me.
  await page.goto("/mandirs");
  await page.waitForTimeout(2500);
  const nearMe = page.getByRole("button", { name: /Near me/ }).first();
  await snap(page, "f-map", { nearMe }, { full: false, center: page.locator(".toran-map").first() });
  await nearMe.click();
  await page.waitForTimeout(4000);
  const lamp = page.locator(".toran-lamp").first();
  await snap(page, "f-map-near", { lamp }, { full: false, center: page.locator(".toran-map").first() });
  if (await lamp.isVisible().catch(() => false)) {
    const where = await lamp.boundingBox();
    await lamp.click();
    await page.waitForTimeout(1200);
    await snap(page, "f-map-card", {}, { full: false });
    console.log("lamp", JSON.stringify(where));
  }

  // Festivals.
  await page.goto("/festivals");
  await page.waitForTimeout(1500);
  await snap(page, "f-festivals", {}, { full: false });
  await snap(page, "f-festivals-full", {});

  // In Gujarati.
  await page.goto(`/gu/mandirs/${SLUG}`);
  await page.waitForTimeout(1500);
  await snap(page, "f-mandir-gu", {}, { full: false });

  void eventUrl;
  await ctx.close();
});

test("a committee member shares a message from WhatsApp", async ({ browser }) => {
  test.setTimeout(180_000);
  const ctx = await browser.newContext({
    ...phone,
    storageState: "/home/user/test/media/welcome-pack/shots/priya.json",
  });
  const page = await ctx.newPage();
  await page.goto(`/manage/${SLUG}`);
  await page.waitForTimeout(1500);
  await snap(page, "c-manage-phone", {}, { full: false });
  await snap(page, "c-manage-phone-full", {});
  await page.goto(`/share?text=${encodeURIComponent(MESSAGE)}`);
  await expect(page).toHaveURL(/paste=/);
  await page.waitForTimeout(1200);
  const box = page.locator('textarea[name="message"]');
  const read = page.getByRole("button", { name: "Read the message" });
  await snap(page, "c-share-phone", { box, read }, { full: false, center: box });
  await ctx.close();
});
