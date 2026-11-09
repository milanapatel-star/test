import { expect, test } from "@playwright/test";
import { latestLoginLink, sql } from "./helpers";
import { day, nextWeekday, snap } from "./zz-capture-lib";

// Stage 1: a committee member (Priya, made up) at Shree Sample Mandir,
// Anytown (made up) logs in on a laptop and adds the mandir's events every
// way there is. This also fills the local database with the example
// events the other films show.

const SLUG = "shree-sample-mandir-anytown";
const EMAIL = "priya@example.org";
const PATRIKA = "/home/user/toran-main-code/public/demo-posters/patrika.jpg";
const MESSAGE = `Jai Shree Krishna 🙏
Gita Jayanti path this Sunday 20 December, 10am in the main hall. We'll read the whole Bhagavad Gita together. All welcome, prasad after.
Please share with family.`;

test("committee on a laptop", async ({ browser }) => {
  test.setTimeout(420_000);
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // Logging in: just an email address.
  await page.goto("/login");
  const email = page.getByLabel(/email/i).first();
  const send = page.getByRole("button", { name: /send|log in|email me/i }).first();
  await snap(page, "c-login", { email, send }, { full: false });
  await email.fill(EMAIL);
  await snap(page, "c-login-typed", { email, send }, { full: false });
  await send.click();
  await expect(page.getByText("Check your email for a login link")).toBeVisible();
  await snap(page, "c-login-sent", {}, { full: false });
  await page.goto(await latestLoginLink(EMAIL));
  await expect(page).toHaveURL(/\/account$/);
  sql(
    `insert into public.mandir_admins (mandir_id, user_id, consented_at) select m.id, u.id, now() from public.mandirs m, auth.users u where m.slug = '${SLUG}' and u.email = '${EMAIL}' on conflict do nothing`,
  );
  sql(`update public.mandirs set status = 'claimed' where slug = '${SLUG}'`);
  await page.reload();
  const open = page.getByRole("link", { name: /Shree Sample Mandir/ }).first();
  await snap(page, "c-account", { open }, { full: false });
  await open.click();
  await expect(page.getByRole("heading", { name: "Add events" })).toBeVisible();

  const tile = (name: RegExp) => page.getByRole("link", { name });
  const tiles = {
    photo: tile(/^Photo of a poster/),
    message: tile(/^Paste a WhatsApp message/),
    type: tile(/^Type it in/),
    festivals: tile(/^Tick festivals/),
    nextup: page.getByRole("region", { name: "Next up" }),
    header: page.getByRole("heading", { name: "Shree Sample Mandir", level: 2 }).or(page.getByText("Shree Sample Mandir").first()),
    public: page.getByRole("link", { name: /See your public page/ }),
  };
  await snap(page, "c-manage-empty", tiles, { full: false });
  await snap(page, "c-manage-empty-full", tiles);

  // 1. A photo of the poster.
  await tiles.photo.click();
  const posterForm = page.locator("#read-poster").locator("..");
  const file = page.locator('input[type="file"][name="poster"]');
  const readIt = page.getByRole("button", { name: "Read it" });
  await snap(page, "c-poster-open", { file, readIt }, { full: false });
  await file.setInputFiles(PATRIKA);
  await snap(page, "c-poster-chosen", { file, readIt }, { full: false });
  const sending = page.locator("#read-poster button[type=submit]");
  await readIt.click();
  await page.waitForTimeout(300);
  await snap(page, "c-poster-reading", { readIt: sending }, { full: false });
  await page.waitForURL(/read=/, { timeout: 30_000 });
  await page.waitForTimeout(500);
  const waiting = page.getByRole("listitem").filter({ hasText: "Maha Shivaratri" }).first();
  const publish = waiting.getByRole("button", { name: "Publish" });
  await snap(page, "c-poster-read", { first: waiting, publish }, { full: false, center: waiting });
  await snap(page, "c-poster-read-full", { first: waiting, publish });
  await publish.click();
  await expect(page.getByText(/Published/)).toBeVisible();
  await snap(page, "c-poster-published", {}, { full: false });
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
  void posterForm;

  // 2. A WhatsApp message, pasted in.
  await page.goto(`/manage/${SLUG}`);
  await tiles.message.click();
  const box = page.locator('textarea[name="message"]');
  const readMsg = page.getByRole("button", { name: "Read the message" });
  await snap(page, "c-msg-open", { box, readMsg }, { full: false });
  await box.fill(MESSAGE);
  await snap(page, "c-msg-typed", { box, readMsg }, { full: false });
  await readMsg.click();
  await page.waitForURL(/read=/, { timeout: 30_000 });
  await page.waitForTimeout(500);
  const gita = page.getByRole("listitem").filter({ hasText: "Gita Jayanti" }).first();
  const publishGita = gita.getByRole("button", { name: "Publish" });
  await snap(page, "c-msg-read", { first: gita, publish: publishGita }, { full: false, center: gita });
  await publishGita.click();
  await expect(page.getByText(/Published/)).toBeVisible();

  // 3. Typed in: a weekly children's class.
  await page.goto(`/manage/${SLUG}`);
  await tiles.type.click();
  const what = page.getByLabel("What's happening?");
  const kind = page.getByLabel("What kind of event?");
  const date = page.getByLabel("Date");
  const starts = page.getByLabel("Starts");
  const add = page.getByRole("button", { name: "Add event" });
  await snap(page, "c-type-open", { what, kind, date, starts, add }, { full: false });
  await what.fill("Bal Vihar children's class");
  await kind.selectOption({ label: "Class" }).catch(() => kind.selectOption("class"));
  await date.fill(nextWeekday(0, 1));
  await starts.fill("10:00");
  await page.getByText("Happens every day, week or month?").click();
  await page.getByRole("combobox", { name: /^Repeats/ }).selectOption("weekly");
  await snap(page, "c-type-filled", { what, kind, date, starts, add }, { full: false });
  await add.click();
  await expect(page.getByText("Added.")).toBeVisible();
  await snap(page, "c-type-added", {}, { full: false, center: page.getByText("Added.").first() });

  // More events, typed in the same way, so the pages look lived in.
  const more: [string, string, string, string, string][] = [
    ["Friday satsang", "katha", nextWeekday(5, 1), "19:30", "weekly"],
    ["Bhajan evening", "bhajan", nextWeekday(2, 1), "19:30", "weekly"],
    ["Kartik Purnima deepotsav", "festival", day(5), "18:30", ""],
    ["Youth seva day", "seva", nextWeekday(6, 8), "10:00", ""],
  ];
  for (const [title, k, d, t, repeat] of more) {
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
    await page
      .locator('textarea[name="summary"]')
      .fill(
        {
          "Friday satsang": "Katha and kirtan in the main hall, with prasad after. Everyone welcome.",
          "Bhajan evening": "Bring a friend; words are on the screen in Gujarati and English.",
          "Kartik Purnima deepotsav": "Hundreds of diyas lit around the mandir, with aarti and prasad.",
          "Youth seva day": "Helping in the kitchen and garden. Ages 14 and up.",
        }[title] ?? "",
      )
      .catch(() => undefined);
    await add.click();
    await expect(page.getByText("Added.")).toBeVisible();
  }

  // 4. Festivals, ticked.
  await page.goto(`/manage/${SLUG}`);
  await tiles.festivals.click();
  await page.waitForTimeout(500);
  const fest = page.locator("#festivals").locator("xpath=ancestor::details[1]").or(page.locator("#festivals"));
  const boxes = page.getByRole("checkbox");
  const firstFest = boxes.first();
  const addFest = page.getByRole("button", { name: /Add the ticked/ }).first();
  await snap(page, "c-fest-open", { first: firstFest, add: addFest }, { full: false, center: firstFest });
  await firstFest.check();
  await snap(page, "c-fest-ticked", { first: firstFest, add: addFest }, { full: false, center: firstFest });
  await addFest.click();
  await expect(page.getByText(/Added/).first()).toBeVisible();
  void fest;

  // The first screen, now full.
  await page.goto(`/manage/${SLUG}`);
  await page.waitForTimeout(500);
  await snap(page, "c-manage", { ...tiles, edit: page.getByRole("link", { name: /^Edit / }).first() }, { full: false });
  await snap(page, "c-manage-full", tiles);

  // Editing an event.
  await page.getByRole("link", { name: /^Edit / }).first().click();
  await page.waitForTimeout(600);
  await snap(page, "c-edit", {}, { full: false });

  // Seva: a rota for the Kartik Purnima deepotsav.
  await page.goto(`/manage/${SLUG}/seva`);
  const plan = page.getByText("Kartik Purnima deepotsav").first().locator("xpath=ancestor::*[.//a[contains(., 'Plan seva')]][1]").getByRole("link", { name: /Plan seva/ });
  await snap(page, "c-seva", { plan }, { full: false });
  await plan.click();
  await page.waitForTimeout(600);
  const role = page.getByLabel("Role", { exact: true });
  await snap(page, "c-seva-event", { role }, { full: false, center: role });
  await role.fill("Lighting diyas");
  await page.getByLabel(/What it involves/).fill("Setting out and lighting the diyas around the mandir.");
  await snap(page, "c-seva-role-typed", { role }, { full: false, center: role });
  await page.getByRole("button", { name: "Add role" }).click();
  await expect(page.getByText("Role added.")).toBeVisible();
  const shift = page.getByRole("form", { name: /Add a shift to Lighting diyas/ });
  await shift.getByLabel("From").fill("17:00");
  await shift.getByLabel("To").fill("19:00");
  await shift.getByLabel("People").fill("6");
  await snap(page, "c-seva-shift", { add: shift.getByRole("button", { name: "Add shift" }) }, { full: false, center: shift });
  await shift.getByRole("button", { name: "Add shift" }).click();
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
  const online = page.getByRole("button", { name: "Let volunteers take slots on Toran" });
  await snap(page, "c-seva-rota", { online }, { full: false, center: online });
  await online.click();
  await page.waitForTimeout(800);
  const copyRota = page.getByRole("button", { name: /Copy/ }).first();
  await snap(page, "c-seva-message", { copy: copyRota }, { full: false, center: copyRota });
  await snap(page, "c-seva-rota-full", {});

  // Sharing this week's events.
  await page.goto(`/manage/${SLUG}#share`);
  await page.waitForTimeout(600);
  await snap(page, "c-share", {}, { full: false, center: page.locator("#share") });

  // Numbers: example visits over the last month (made up, for the film).
  sql(`insert into public.daily_counts (day, metric, path, count)
    select (now() at time zone 'Europe/London')::date - d, m.metric, '/mandirs/${SLUG}',
      case m.metric when 'view' then 25 + (d * 7 % 31) when 'calendar' then 1 + d % 4 when 'share' then 1 + d % 5 else d % 2 end
    from generate_series(0, 27) d, (values ('view'), ('calendar'), ('share'), ('subscribe')) m(metric)
    on conflict do nothing`);
  // Numbers.
  await page.goto(`/manage/${SLUG}/numbers`);
  await page.waitForTimeout(600);
  await snap(page, "c-numbers", {}, { full: false });

  await ctx.storageState({ path: "/home/user/test/media/welcome-pack/shots/priya.json" });
});
