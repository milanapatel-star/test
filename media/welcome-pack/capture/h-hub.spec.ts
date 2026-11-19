import { devices, expect, test, type Page } from "@playwright/test";
import { followLoginLink, latestLoginLink, sql } from "./helpers";
import { day, nextWeekday, snap } from "./zz-capture-lib";

// Stage h: the committee's hub as it is since the phone redesign (sheets
// that come up from the bottom, the To do list, the ⋯ menu), for the hub
// guide film (films/hub.js), which follows the committee guide on the
// site (/for-mandirs/guide). Priya (made up), on the committee of Shree
// Sample Mandir, Anytown (made up), logs in on her phone and runs the
// hub: every way to add events, repeats and end times, keeping events
// right, aarti times and YouTube, seva, a colleague, sharing and numbers.
// Run on its own from a fresh database: `run-capture.sh h --reset`.

const SLUG = "shree-sample-mandir-anytown";
const EMAIL = "priya@example.org";
const PATRIKA = "/home/user/toran-main-code/public/demo-posters/patrika.jpg";
const MESSAGE = `Jai Shree Krishna 🙏
Gita Jayanti path this Sunday 20 December, 10am in the main hall. We'll read the whole Bhagavad Gita together. All welcome, prasad after.`;
const phone = {
  ...devices["iPhone 13"],
  deviceScaleFactor: 3,
  locale: "en-GB",
  timezoneId: "Europe/London",
};

const sheet = (page: Page) => page.locator("dialog[open]");

async function openAdd(page: Page, way?: string) {
  await page.getByRole("button", { name: "Add events", exact: true }).click();
  const add = page.getByRole("dialog", { name: "Add events" });
  await expect(add).toBeVisible();
  if (way) {
    await add.getByRole("button", { name: new RegExp(`^${way}`) }).click();
    await expect(page.getByRole("dialog", { name: way })).toBeVisible();
  }
  return add;
}

async function setting(page: Page, name: string) {
  await page
    .getByRole("region", { name: "Your mandir" })
    .getByRole("button", { name: new RegExp(`^${name}`) })
    .click();
  await expect(sheet(page)).toBeVisible();
  return sheet(page);
}

async function typeEvent(
  page: Page,
  e: { title: string; date: string; starts: string; ends?: string; weekly?: boolean },
) {
  await page.goto(`/manage/${SLUG}`);
  await openAdd(page, "Type it in");
  const s = sheet(page);
  await s.getByLabel("What's happening?").fill(e.title);
  await s.getByLabel("Date").fill(e.date);
  await s.getByLabel("Starts").fill(e.starts);
  if (e.ends) await s.getByLabel("Ends (optional)").fill(e.ends);
  if (e.weekly) {
    await s.getByLabel(/^It repeats/).check();
    await s.getByLabel("How often?").selectOption({ label: "Every week" });
  }
  await s.getByRole("button", { name: "Add event", exact: true }).click();
  await expect(page.getByText("Added.").first()).toBeVisible();
}

test("the committee's hub on a phone", async ({ browser }) => {
  test.setTimeout(600_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();

  // Logging in: just an email address.
  await page.goto("/login");
  const email = page.getByLabel("Email address");
  const send = page.getByRole("button", { name: "Email me a login link" });
  await snap(page, "h-login", { email, send }, { full: false, center: email });
  await email.fill(EMAIL);
  await snap(page, "h-login-typed", { email, send }, { full: false, center: email });
  await send.click();
  await expect(page.getByText("Check your email for a login link")).toBeVisible();
  await snap(page, "h-login-sent", {}, { full: false });
  await followLoginLink(page, await latestLoginLink(EMAIL));
  await expect(page).toHaveURL(/\/account$/);
  sql(
    `insert into public.mandir_admins (mandir_id, user_id, consented_at) select m.id, u.id, now() from public.mandirs m, auth.users u where m.slug = '${SLUG}' and u.email = '${EMAIL}' on conflict do nothing`,
  );
  sql(`update public.mandirs set status = 'claimed' where slug = '${SLUG}'`);
  await page.reload();
  const open = page.getByRole("link", { name: /Shree Sample Mandir/ }).first();
  await snap(page, "h-account", { open }, { full: false, center: open });
  await open.click();
  await expect(page.getByRole("button", { name: "Add events", exact: true })).toBeVisible();

  // The hub, before any events: three tabs, Add events, To do.
  const addBtn = page.getByRole("button", { name: "Add events", exact: true });
  const tabs = page.getByRole("navigation", { name: "Your mandir on Toran" });
  const todo = page.getByRole("region", { name: "To do" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await snap(page, "h-hub-empty", { addBtn, tabs, todo }, { full: false });

  // Add events: the four ways.
  const add = await openAdd(page);
  const way = (name: string) => add.getByRole("button", { name: new RegExp(`^${name}`) });
  await snap(page, "h-add", {
    photo: way("Photo of a poster"),
    message: way("Paste a WhatsApp message"),
    type: way("Type it in"),
    festivals: way("Tick festivals"),
  }, { full: false });

  // 1. A photo of the poster.
  await way("Photo of a poster").click();
  const file = sheet(page).locator('input[type="file"]');
  const readIt = sheet(page).getByRole("button", { name: "Read it" });
  await snap(page, "h-poster-open", { file, readIt }, { full: false });
  await file.setInputFiles(PATRIKA);
  await snap(page, "h-poster-chosen", { file, readIt }, { full: false });
  await readIt.click();
  await page.waitForTimeout(400);
  await snap(page, "h-poster-reading", {}, { full: false });
  await page.waitForURL(/read=|done=|#posters/, { timeout: 40_000 }).catch(() => undefined);
  await expect(page.getByRole("heading", { name: "Posters waiting for you" })).toBeVisible({ timeout: 40_000 });
  await page.waitForTimeout(600);
  const shivaratri = page.getByRole("listitem").filter({ hasText: "Maha Shivaratri" }).first();
  const publish = shivaratri.getByRole("button", { name: "Publish", exact: true });
  await snap(page, "h-poster-read", { publish }, { full: false, center: shivaratri });
  await publish.click();
  await expect(page.getByText(/Published/).first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await snap(page, "h-poster-published", {}, { full: false });
  for (const title of ["Ram Navami", "Hanuman Jayanti"]) {
    await page.goto(`/manage/${SLUG}#posters`);
    await page
      .getByRole("listitem")
      .filter({ hasText: title })
      .first()
      .getByRole("button", { name: "Publish", exact: true })
      .click();
    await expect(page.getByText(/Published/).first()).toBeVisible();
  }

  // 2. A WhatsApp message, pasted in.
  await page.goto(`/manage/${SLUG}`);
  await openAdd(page, "Paste a WhatsApp message");
  const box = sheet(page).locator('textarea[name="message"]');
  const readMsg = sheet(page).getByRole("button", { name: "Read the message" });
  await snap(page, "h-msg-open", { box, readMsg }, { full: false });
  await box.fill(MESSAGE);
  await snap(page, "h-msg-typed", { box, readMsg }, { full: false });
  await readMsg.click();
  await expect(page.getByRole("heading", { name: "Posters waiting for you" })).toBeVisible({ timeout: 40_000 });
  await page.waitForTimeout(600);
  const gita = page.getByRole("listitem").filter({ hasText: "Gita Jayanti" }).first();
  const publishGita = gita.getByRole("button", { name: "Publish", exact: true });
  await snap(page, "h-msg-read", { publish: publishGita }, { full: false, center: gita });
  await publishGita.click();
  await expect(page.getByText(/Published/).first()).toBeVisible();

  // 3. Typed in: a weekly children's class, with an end time.
  await page.goto(`/manage/${SLUG}`);
  await openAdd(page, "Type it in");
  const s = sheet(page);
  const what = s.getByLabel("What's happening?");
  const date = s.getByLabel("Date");
  const starts = s.getByLabel("Starts");
  const ends = s.getByLabel("Ends (optional)");
  await snap(page, "h-type-open", { what, date, starts, ends }, { full: false });
  await what.fill("Bal Vikas children's class");
  await date.fill(nextWeekday(0, 1));
  await starts.fill("10:00");
  await ends.fill("11:30");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await snap(page, "h-type-filled", { what, date, starts, ends }, { full: false });
  const repeats = s.getByLabel(/^It repeats/);
  await repeats.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await snap(page, "h-type-repeat-off", { repeats }, { full: false });
  await repeats.check();
  const often = s.getByLabel("How often?");
  await often.selectOption({ label: "Every week" });
  await snap(page, "h-type-repeat", { repeats, often }, { full: false });
  const addEvent = s.getByRole("button", { name: "Add event", exact: true });
  await addEvent.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await snap(page, "h-type-add", { add: addEvent }, { full: false });
  await addEvent.click();
  await expect(page.getByText("Added.").first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await snap(page, "h-type-added", {}, { full: false });

  // More events, so the hub looks lived in.
  await typeEvent(page, { title: "Bhajan sandhya", date: nextWeekday(6, 1), starts: "19:00", ends: "21:00" });
  await typeEvent(page, { title: "Kartik Purnima deepotsav", date: day(4), starts: "18:30", ends: "21:00" });
  await typeEvent(page, { title: "Gita path", date: nextWeekday(3, 1), starts: "19:00", weekly: true });

  // 4. Festivals, ticked.
  await page.goto(`/manage/${SLUG}`);
  await openAdd(page, "Tick festivals");
  await page.waitForTimeout(500);
  const first = sheet(page).getByRole("checkbox").first();
  await snap(page, "h-fest-open", { first }, { full: false });
  await first.check();
  await snap(page, "h-fest-ticked", { first }, { full: false });
  const addFest = sheet(page).getByRole("button", { name: /Add the ticked/ });
  await addFest.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await snap(page, "h-fest-add", { add: addFest }, { full: false });
  await addFest.click();
  await expect(page.getByText(/Added/).first()).toBeVisible();

  // The hub, now full: To do, and Coming up with each event's ⋯.
  await page.goto(`/manage/${SLUG}`);
  await page.waitForTimeout(600);
  await snap(page, "h-hub", { addBtn, tabs, todo }, { full: false });
  const upcoming = page.getByRole("region", { name: /Coming up/ });
  const more = upcoming.getByRole("button", { name: /^More for / }).first();
  await snap(page, "h-upcoming", { upcoming, more }, { full: false, center: upcoming });

  // Keeping it right: the ⋯ menu, then Still on.
  await more.click();
  const menu = sheet(page);
  const stillOn = menu.getByRole("button", { name: "Still on", exact: true });
  await snap(page, "h-menu", {
    edit: menu.getByRole("link", { name: "Edit", exact: true }),
    stillOn,
    cancel: menu.getByRole("button", { name: "Cancel", exact: true }),
    seva: menu.getByRole("link", { name: "Seva rota" }),
  }, { full: false });
  await stillOn.click();
  await expect(page.getByText("Thanks, marked as confirmed today.")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await snap(page, "h-confirmed", {}, { full: false });

  // Details: aarti times (from the seed) and a YouTube link.
  const details = await setting(page, "Details");
  const live = details.getByLabel("YouTube / Livestream");
  await live.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await snap(page, "h-youtube-open", { live }, { full: false });
  await live.fill("youtube.com/@shreesamplemandir");
  await snap(page, "h-youtube", { live }, { full: false });
  const aarti = details.locator('input[name="aarti-name-0"]');
  const aartiTime = details.locator('input[name="aarti-time-0"]');
  await aarti.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await snap(page, "h-aarti", { aarti, time: aartiTime }, { full: false });
  const save = details.getByRole("button", { name: "Save details" });
  await save.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await snap(page, "h-details-save", { save }, { full: false });
  await save.click();
  await expect(page.getByText("Saved. Your public page shows the new details.")).toBeVisible();
  await page.goto(`/manage/${SLUG}`);
  const note = page.getByText(/Also in What's on every day/);
  await snap(page, "h-aarti-note", { note }, { full: false, center: note });
  await page.goto(`/mandirs/${SLUG}`);
  await page.waitForTimeout(800);
  const watch = page.getByRole("link", { name: "Watch on YouTube" }).first();
  await snap(page, "h-public-watch", { watch }, { full: false, center: watch });

  // Seva: a rota for the deepotsav.
  await page.goto(`/manage/${SLUG}`);
  await page
    .getByRole("button", { name: /^More for Kartik Purnima deepotsav/ })
    .first()
    .click();
  await sheet(page).getByRole("link", { name: "Seva rota" }).click();
  await expect(page).toHaveURL(/\/seva\//);
  await page.waitForTimeout(800);
  const addRole = page.getByRole("button", { name: "Add a role" });
  await snap(page, "h-seva-event", { addRole }, { full: false, center: addRole });
  await addRole.click();
  const role = page.getByLabel("Role", { exact: true });
  await role.fill("Lighting diyas");
  await page.getByLabel(/What it involves/).fill("Setting out and lighting the diyas around the mandir.");
  const addRoleBtn = page.getByRole("button", { name: "Add role" });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await snap(page, "h-seva-role", { role, add: addRoleBtn }, { full: false });
  await addRoleBtn.click();
  await expect(page.getByText("Role added.")).toBeVisible();
  await page.getByRole("button", { name: "Add a shift" }).first().click();
  const shift = page.getByRole("form", { name: "Add a shift to Lighting diyas" });
  await shift.getByLabel("From").fill("17:00");
  await shift.getByLabel("To").fill("19:00");
  await shift.getByLabel("People").fill("6");
  const addShift = shift.getByRole("button", { name: "Add shift" });
  await snap(page, "h-seva-shift", { form: shift, add: addShift }, { full: false });
  await addShift.click();
  await expect(page.getByText("Shift added.")).toBeVisible();
  await page.getByRole("button", { name: "Add another role" }).click();
  await page.getByLabel("Role", { exact: true }).fill("Kitchen");
  await page.getByLabel(/What it involves/).fill("Making and serving prasad.");
  await page.getByRole("button", { name: "Add role" }).click();
  await expect(page.getByText("Role added.")).toBeVisible();
  await page.getByRole("button", { name: "Add a shift" }).last().click();
  const shift2 = page.getByRole("form", { name: "Add a shift to Kitchen" });
  await shift2.getByLabel("From").fill("18:00");
  await shift2.getByLabel("To").fill("21:00");
  await shift2.getByLabel("People").fill("4");
  await shift2.getByRole("button", { name: "Add shift" }).click();
  await expect(page.getByText("Shift added.")).toBeVisible();
  await page.getByRole("button", { name: "Let volunteers take slots on Toran" }).click();
  await expect(page.getByText("Volunteers can now take slots")).toBeVisible();
  const rotaWa = page.getByRole("link", { name: "WhatsApp" }).first();
  await snap(page, "h-seva-send", { whatsapp: rotaWa }, { full: false, center: rotaWa });

  // Inviting a colleague.
  await page.goto(`/manage/${SLUG}`);
  const committee = await setting(page, "Committee");
  const colleague = committee.getByLabel("Their email address");
  const invite = committee.getByRole("button", { name: "Invite", exact: true });
  await colleague.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await snap(page, "h-committee", { email: colleague, invite }, { full: false });
  await colleague.fill("meera@example.org");
  await snap(page, "h-committee-typed", { email: colleague, invite }, { full: false });
  await invite.click();
  await expect(page.getByText(/^Invited\./)).toBeVisible();
  await page.waitForTimeout(500);
  await snap(page, "h-invited", {}, { full: false });

  // Sharing this week's events.
  sql(`insert into public.daily_counts (day, metric, path, count)
    select (now() at time zone 'Europe/London')::date - d, m.metric, '/mandirs/${SLUG}',
      case m.metric when 'view' then 25 + (d * 7 % 31) when 'calendar' then 1 + d % 4 when 'share' then 1 + d % 5 else d % 2 end
    from generate_series(0, 27) d, (values ('view'), ('calendar'), ('share'), ('subscribe')) m(metric)
    on conflict do nothing`);
  await page.goto(`/manage/${SLUG}`);
  const weekSend = page.getByRole("link", { name: "Send on WhatsApp" }).first();
  await snap(page, "h-share", { send: weekSend }, { full: false, center: weekSend });

  // Seva and Numbers tabs.
  await page.goto(`/manage/${SLUG}/seva`);
  await page.waitForTimeout(800);
  await snap(page, "h-seva-tab", {}, { full: false });
  await page.goto(`/manage/${SLUG}/numbers`);
  await page.waitForTimeout(800);
  const views = page.getByText(/Views of your page/).first();
  await snap(page, "h-numbers", { views }, { full: false, center: views });
});
