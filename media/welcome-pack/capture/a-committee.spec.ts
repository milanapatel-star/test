import { devices, expect, test } from "@playwright/test";
import { latestLoginLink, sql } from "./helpers";
import { day, nextWeekday, snap } from "./zz-capture-lib";

// Stage 1: a committee member (Priya, made up) at Shree Sample Mandir,
// Anytown (made up) logs in on her phone and adds the mandir's events
// every way there is, plans seva and shares the week. This also fills the
// local database with the example events the other films show. Every
// picture of the screen is taken with the thing she taps in view.

const SLUG = "shree-sample-mandir-anytown";
const EMAIL = "priya@example.org";
const PATRIKA = "/home/user/toran-main-code/public/demo-posters/patrika.jpg";
const MESSAGE = `Jai Shree Krishna 🙏
Gita Jayanti path this Sunday 20 December, 10am in the main hall. We'll read the whole Bhagavad Gita together. All welcome, prasad after.`;
const phone = { ...devices["iPhone 13"], deviceScaleFactor: 3, locale: "en-GB", timezoneId: "Europe/London" };

test("committee on a phone", async ({ browser }) => {
  test.setTimeout(420_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();

  // Logging in: just an email address.
  await page.goto("/login");
  const email = page.getByLabel(/email/i).first();
  const send = page.getByRole("button", { name: /send|log in|email me/i }).first();
  await snap(page, "pc-login", { email, send }, { full: false, center: email });
  await email.fill(EMAIL);
  await snap(page, "pc-login-typed", { email, send }, { full: false, center: email });
  await send.click();
  await expect(page.getByText("Check your email for a login link")).toBeVisible();
  await snap(page, "pc-login-sent", {}, { full: false });
  await page.goto(await latestLoginLink(EMAIL));
  await expect(page).toHaveURL(/\/account$/);
  sql(
    `insert into public.mandir_admins (mandir_id, user_id, consented_at) select m.id, u.id, now() from public.mandirs m, auth.users u where m.slug = '${SLUG}' and u.email = '${EMAIL}' on conflict do nothing`,
  );
  sql(`update public.mandirs set status = 'claimed' where slug = '${SLUG}'`);
  await page.reload();
  const open = page.getByRole("link", { name: /Shree Sample Mandir/ }).first();
  await snap(page, "pc-account", { open }, { full: false, center: open });
  await open.click();
  await expect(page.getByRole("heading", { name: "Add events" })).toBeVisible();

  const tile = (name: RegExp) => page.getByRole("link", { name });
  const tiles = {
    photo: tile(/^Photo of a poster/),
    message: tile(/^Paste a WhatsApp message/),
    type: tile(/^Type it in/),
    festivals: tile(/^Tick festivals/),
  };
  await page.evaluate(() => window.scrollTo(0, 0));
  await snap(page, "pc-manage-empty", tiles, { full: false });

  // 1. A photo of the poster.
  await tiles.photo.click();
  const file = page.locator('input[type="file"][name="poster"]');
  const readIt = page.locator("#read-poster button[type=submit]");
  await snap(page, "pc-poster-open", { file, readIt }, { full: false, center: file });
  await file.setInputFiles(PATRIKA);
  await snap(page, "pc-poster-chosen", { file, readIt }, { full: false, center: file });
  await readIt.click();
  await page.waitForTimeout(300);
  await snap(page, "pc-poster-reading", { readIt }, { full: false, center: file });
  await page.waitForURL(/read=/, { timeout: 30_000 });
  await page.waitForTimeout(600);
  const waiting = page.getByRole("listitem").filter({ hasText: "Maha Shivaratri" }).first();
  const publish = waiting.getByRole("button", { name: "Publish" });
  await snap(page, "pc-poster-read", { publish }, { full: false, center: publish });
  await publish.click();
  await expect(page.getByText(/Published/)).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await snap(page, "pc-poster-published", {}, { full: false });
  for (const title of ["Ram Navami", "Hanuman Jayanti"]) {
    await page.goto(`/manage/${SLUG}#posters`);
    await page
      .getByRole("listitem")
      .filter({ hasText: title })
      .first()
      .getByRole("button", { name: "Publish" })
      .click();
    await page.waitForURL(/done=|published/, { timeout: 15_000 }).catch(() => undefined);
    await expect(page.getByText(/Published/)).toBeVisible();
  }

  // 2. A WhatsApp message, pasted in.
  await page.goto(`/manage/${SLUG}`);
  await tiles.message.click();
  const box = page.locator('textarea[name="message"]');
  const readMsg = page.getByRole("button", { name: "Read the message" });
  await snap(page, "pc-msg-open", { box, readMsg }, { full: false, center: box });
  await box.fill(MESSAGE);
  await snap(page, "pc-msg-typed", { box, readMsg }, { full: false, center: box });
  await readMsg.click();
  await page.waitForURL(/read=/, { timeout: 30_000 });
  await page.waitForTimeout(600);
  const gita = page.getByRole("listitem").filter({ hasText: "Gita Jayanti" }).first();
  const publishGita = gita.getByRole("button", { name: "Publish" });
  await snap(page, "pc-msg-read", { publish: publishGita }, { full: false, center: publishGita });
  await publishGita.click();
  await expect(page.getByText(/Published/)).toBeVisible();

  // 3. Typed in: a weekly children's class. Whole-page pictures, so the
  // film can scroll from the name down to "Add event".
  await page.goto(`/manage/${SLUG}`);
  await tiles.type.click();
  const what = page.getByLabel("What's happening?");
  const kind = page.getByLabel("What kind of event?");
  const date = page.getByLabel("Date");
  const starts = page.getByLabel("Starts");
  const add = page.getByRole("button", { name: "Add event" });
  await snap(page, "pc-type-open", { what, kind, date, starts, add });
  await what.fill("Bal Vihar children's class");
  await kind.selectOption("class").catch(() => undefined);
  await date.fill(nextWeekday(0, 1));
  await starts.fill("10:00");
  await snap(page, "pc-type-filled", { what, kind, date, starts, add });
  await add.click();
  await expect(page.getByText("Added.")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await snap(page, "pc-type-added", {}, { full: false });
  // It repeats every Sunday.
  sql(`update public.events set recurrence = 'RRULE:FREQ=WEEKLY' where title = 'Bal Vihar children''s class'`);

  // More events, so the pages look lived in.
  const more: [string, string, string, string, string, string][] = [
    ["Friday satsang", "katha", nextWeekday(5, 1), "19:30", "weekly", "Katha and kirtan in the main hall, with prasad after. Everyone welcome."],
    ["Bhajan evening", "bhajan", nextWeekday(2, 1), "19:30", "weekly", "Bring a friend; words are on the screen in Gujarati and English."],
    ["Kartik Purnima deepotsav", "festival", day(5), "18:30", "", "Hundreds of diyas lit around the mandir, with aarti and prasad."],
    ["Youth seva day", "seva", nextWeekday(6, 8), "10:00", "", "Helping in the kitchen and garden. Ages 14 and up."],
  ];
  for (const [title, k, d, t, repeat, summary] of more) {
    await page.goto(`/manage/${SLUG}#add-event`);
    await what.fill(title);
    await kind.selectOption(k).catch(() => undefined);
    await date.fill(d);
    await starts.fill(t);
    if (repeat) {
      await page.getByText("Happens every day, week or month?").click();
      await page.getByRole("combobox", { name: /^Repeats/ }).selectOption(repeat);
    }
    await page.getByText("Add a short description (optional)").click();
    await page.locator('textarea[name="summary"]').fill(summary).catch(() => undefined);
    await add.click();
    await expect(page.getByText("Added.")).toBeVisible();
  }

  // 4. Festivals, ticked. Whole-page pictures again, from the first
  // festival down to the button.
  await page.goto(`/manage/${SLUG}`);
  await tiles.festivals.click();
  await page.waitForTimeout(600);
  const firstFest = page.getByRole("checkbox").first();
  const addFest = page.getByRole("button", { name: /Add the ticked/ }).first();
  await snap(page, "pc-fest-open", { first: firstFest, add: addFest });
  await firstFest.check();
  await snap(page, "pc-fest-ticked", { first: firstFest, add: addFest });
  await addFest.click();
  await expect(page.getByText(/Added/).first()).toBeVisible();

  // The first screen, now full; Next up and its Edit buttons.
  await page.goto(`/manage/${SLUG}`);
  await page.waitForTimeout(600);
  await snap(page, "pc-manage", tiles, { full: false });
  const nextup = page.getByRole("region", { name: "Next up" });
  const edit = nextup.getByRole("link", { name: /^Edit / }).first();
  await snap(page, "pc-nextup", { nextup, edit }, { full: false, center: nextup });
  await edit.click();
  await page.waitForTimeout(800);
  await snap(page, "pc-edit", {}, { full: false });

  // Seva: a rota for the Kartik Purnima deepotsav.
  await page.goto(`/manage/${SLUG}/seva`);
  const plan = page.getByText("Kartik Purnima deepotsav").first().locator("xpath=ancestor::*[.//a[contains(., 'Plan seva')]][1]").getByRole("link", { name: /Plan seva/ });
  await snap(page, "pc-seva", { plan }, { full: false, center: plan });
  await plan.click();
  await page.waitForTimeout(800);
  const role = page.getByLabel("Role", { exact: true });
  await snap(page, "pc-seva-event", { role }, { full: false, center: role });
  await role.fill("Lighting diyas");
  await page.getByLabel(/What it involves/).fill("Setting out and lighting the diyas around the mandir.");
  await page.getByRole("button", { name: "Add role" }).click();
  await expect(page.getByText("Role added.")).toBeVisible();
  const shift = page.getByRole("form", { name: /Add a shift to Lighting diyas/ });
  await shift.getByLabel("From").fill("17:00");
  await shift.getByLabel("To").fill("19:00");
  await shift.getByLabel("People").fill("6");
  const addShift = shift.getByRole("button", { name: "Add shift" });
  await snap(page, "pc-seva-shift", { add: addShift, form: shift }, { full: false, center: shift });
  await addShift.click();
  await expect(page.getByText("Shift added.")).toBeVisible();
  await page.getByLabel("Role", { exact: true }).fill("Kitchen");
  await page.getByLabel(/What it involves/).fill("Making and serving prasad.");
  await page.getByRole("button", { name: "Add role" }).click();
  await expect(page.getByText("Role added.")).toBeVisible();
  const shift2 = page.getByRole("form", { name: /Add a shift to Kitchen/ });
  await shift2.getByLabel("From").fill("18:00");
  await shift2.getByLabel("To").fill("21:00");
  await shift2.getByLabel("People").fill("4");
  await shift2.getByRole("button", { name: "Add shift" }).click();
  await expect(page.getByText("Shift added.")).toBeVisible();
  await page.getByRole("button", { name: "Let volunteers take slots on Toran" }).click();
  await page.waitForTimeout(800);
  const rotaWa = page.getByRole("link", { name: /WhatsApp/ }).first();
  await snap(page, "pc-seva-message", { whatsapp: rotaWa }, { full: false, center: rotaWa });

  // Sharing this week's events: the message and the button.
  sql(`insert into public.daily_counts (day, metric, path, count)
    select (now() at time zone 'Europe/London')::date - d, m.metric, '/mandirs/${SLUG}',
      case m.metric when 'view' then 25 + (d * 7 % 31) when 'calendar' then 1 + d % 4 when 'share' then 1 + d % 5 else d % 2 end
    from generate_series(0, 27) d, (values ('view'), ('calendar'), ('share'), ('subscribe')) m(metric)
    on conflict do nothing`);
  await page.goto(`/manage/${SLUG}`);
  const weekSend = page.getByRole("link", { name: "Send on WhatsApp" }).first();
  await snap(page, "pc-share", { send: weekSend }, { full: false, center: weekSend });

  // Numbers.
  await page.goto(`/manage/${SLUG}/numbers`);
  await page.waitForTimeout(800);
  const views = page.getByText(/Views of your page/).first();
  await snap(page, "pc-numbers", { views }, { full: false, center: views });

  await ctx.storageState({ path: "/home/user/test/media/welcome-pack/shots/priya.json" });
});
