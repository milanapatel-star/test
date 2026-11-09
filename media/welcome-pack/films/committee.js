// Film 2: the committee guide. Priya (made up), on the committee of Shree
// Sample Mandir, Anytown (the made-up mandir from Toran's /demo page), logs
// in and adds events every way there is, plans seva and shares the week.
const MANAGE = "/manage/shree-sample-mandir-anytown";
const SHARE_SHEET = `<div style="position:absolute;left:0;top:0;width:515px;height:876px;background:rgba(10,14,25,.5)">
  <div style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:30px 30px 0 0;padding:20px 28px 64px;font-family:Mulish">
    <div style="width:46px;height:5px;border-radius:3px;background:#d0d0d0;margin:0 auto 20px"></div>
    <div style="font-weight:800;font-size:22px;color:#222">Share</div>
    <div style="font-size:17px;color:#666;margin:6px 0 26px;line-height:1.35">Jai Shree Krishna 🙏 Gita Jayanti path this Sunday 20 December, 10am…</div>
    <div style="display:flex;gap:26px">
      <div style="text-align:center;width:76px"><div style="width:70px;height:70px;margin:0 auto;border-radius:18px;box-shadow:0 0 0 4px #d9a441,0 0 0 10px rgba(217,164,65,.3)"><svg viewBox="0 0 48 48" width="70" height="70"><rect width="48" height="48" rx="11" fill="#14213d"/><path d="M9 13H39M24 13V37" stroke="#d9a441" stroke-width="3.6" stroke-linecap="round" fill="none"/><circle cx="13.2" cy="19.2" r="2.25" fill="#d9a441"/><circle cx="18.2" cy="21.4" r="2.25" fill="#d9a441"/><circle cx="29.8" cy="21.4" r="2.25" fill="#d9a441"/><circle cx="34.8" cy="19.2" r="2.25" fill="#d9a441"/></svg></div><div style="font-size:16px;font-weight:800;margin-top:10px;color:#14213d">Toran</div></div>
      <div style="text-align:center;width:76px"><div style="width:70px;height:70px;margin:0 auto;border-radius:50%;background:#5b8def"></div><div style="font-size:16px;margin-top:10px;color:#444">Messages</div></div>
      <div style="text-align:center;width:76px"><div style="width:70px;height:70px;margin:0 auto;border-radius:50%;background:#e8655a"></div><div style="font-size:16px;margin-top:10px;color:#444">Email</div></div>
      <div style="text-align:center;width:76px"><div style="width:70px;height:70px;margin:0 auto;border-radius:50%;background:#9aa0a6"></div><div style="font-size:16px;margin-top:10px;color:#444">Copy</div></div>
    </div>
  </div></div>`;

window.FILM = {
  name: "committee",
  title: "Committee guide",
  scenes: [
    {
      kind: "night", type: "title", dur: 6.5,
      chip: "Committee guide",
      title: "Add your mandir's events in minutes",
      sub: "Logging in, four ways to add events, seva and sharing.<br>About two minutes.",
    },
    {
      kind: "laptop", dur: 10, enter: true, url: "/login",
      chip: "Step 1", title: "Log in with your email",
      body: "No password to remember. Toran emails you a link: tap it and you're in.",
      shots: [{ at: 0, shot: "c-login" }, { at: 5.0, shot: "c-login-sent" }, { at: 7.4, shot: "c-account" }],
      types: [{ at: 1.7, dur: 1.5, shot: "c-login-typed", on: ["c-login", "email"], textW: 170, until: 5.4 }],
      cursor: [
        { at: 0.5, to: ["c-login", "email"], click: true },
        { at: 3.7, to: ["c-login", "send"], click: true },
        { at: 7.6, to: ["c-account", "open"], fx: 0.25 },
      ],
      cam: [
        { at: 0.4, s: 1.75, on: ["c-login", "email"], dy: 30 },
        { at: 4.8, s: 1, dur: 0.8 },
        { at: 7.5, s: 1.5, on: ["c-account", "open"] },
      ],
      captions: [
        { at: 0, chip: "Step 1", title: "Log in with your email", body: "No password to remember. Toran emails you a link: tap it and you're in." },
        { at: 7.2, chip: "Step 1", title: "Then open your mandir", body: "Every mandir you look after is listed under <b>Your account</b>." },
      ],
      chimes: [5.3],
    },
    {
      kind: "laptop", dur: 11, url: MANAGE,
      shots: [{ at: 0, shot: "c-manage-empty" }],
      rings: [
        { at: 1.6, dur: 2.7, on: [99, 330, 682, 402], radius: 22 },
        { at: 4.8, dur: 2.9, on: ["c-manage-empty", "nextup"], radius: 22 },
      ],
      cam: [
        { at: 1.4, s: 1.35, on: [99, 330, 682, 402] },
        { at: 4.6, s: 1.55, on: ["c-manage-empty", "nextup"], dy: 60 },
        { at: 8.2, s: 1 },
      ],
      captions: [
        { at: 0, chip: "Step 2", title: "Your committee page", body: "Everything starts here, on one screen. It works on a phone too." },
        { at: 1.5, chip: "Step 2", title: "Four ways to add events", body: "A photo of a poster, a WhatsApp message, typing it in, or ticking festivals." },
        { at: 4.7, chip: "Step 2", title: "What's next, and what needs doing", body: "Your next events with <b>Edit</b> beside each one, and anything waiting for you to check." },
      ],
    },
    {
      kind: "laptop", dur: 16, url: MANAGE + "#read-poster",
      shots: [
        { at: 0, shot: "c-manage-empty" },
        { at: 1.6, shot: "c-poster-open" },
        { at: 4.3, shot: "c-poster-chosen", fade: 0.2 },
        { at: 6.3, shot: "c-poster-reading", fade: 0.15 },
        { at: 8.6, shot: "c-poster-read" },
        { at: 12.6, shot: "c-poster-published" },
      ],
      cursor: [
        { at: 0.3, to: ["c-manage-empty", "photo"], click: true },
        { at: 2.7, to: ["c-poster-open", "file"], fx: 0.2, click: true },
        { at: 5.2, to: ["c-poster-chosen", "readIt"], click: true },
        { at: 10.5, to: ["c-poster-read", "publish"], click: true },
      ],
      cam: [
        { at: 1.8, s: 1.6, on: ["c-poster-open", "file"], dy: 40 },
        { at: 8.4, s: 1.45, on: ["c-poster-read", "first"] },
        { at: 12.3, s: 1 },
      ],
      callouts: [{ at: 9.4, dur: 1.9, text: "Check it, then Publish", on: ["c-poster-read", "publish"], fx: 0.1 }],
      captions: [
        { at: 0, chip: "Way 1", n: 1, title: "Send a photo of the poster", body: "Tap <b>Photo of a poster</b>, choose the picture, and press <b>Read it</b>." },
        { at: 6.2, chip: "Way 1", n: 1, title: "Toran reads it for you", body: "Dates, times and details, even from a Gujarati patrika. It takes about half a minute." },
        { at: 8.8, chip: "Way 1", n: 1, title: "You check it, then publish", body: "Nothing goes live until someone on the committee has checked it." },
      ],
      chimes: [12.8],
    },
    {
      kind: "laptop", dur: 13, url: MANAGE + "#read-message",
      shots: [
        { at: 0, shot: "c-manage-empty" },
        { at: 1.5, shot: "c-msg-open" },
        { at: 5.3, shot: "c-msg-typed", quiet: true, fade: 0.1 },
        { at: 7.2, shot: "c-msg-read" },
        { at: 10.4, shot: "c-poster-published" },
      ],
      types: [{ at: 3.0, dur: 2.2, shot: "c-msg-typed", on: ["c-msg-open", "box"], mode: "lines", lineH: 24, until: 5.4 }],
      cursor: [
        { at: 0.3, to: ["c-manage-empty", "message"], click: true },
        { at: 1.9, to: ["c-msg-open", "box"], click: true },
        { at: 5.5, to: ["c-msg-open", "readMsg"], click: true },
        { at: 8.8, to: ["c-msg-read", "publish"], click: true },
      ],
      cam: [
        { at: 1.9, s: 1.6, on: ["c-msg-open", "box"], dy: 40 },
        { at: 7.0, s: 1.45, on: ["c-msg-read", "first"] },
        { at: 10.2, s: 1 },
      ],
      captions: [
        { at: 0, chip: "Way 2", n: 2, title: "Paste a WhatsApp message", body: "Copy the message in WhatsApp, then paste it under <b>Paste a WhatsApp message</b>." },
        { at: 6.9, chip: "Way 2", n: 2, title: "Toran fills in the event", body: "Check the date and time, then <b>Publish</b>." },
      ],
      chimes: [10.6],
    },
    {
      kind: "phone", dur: 9.5,
      shots: [{ at: 0, shot: "c-share-phone" }],
      overlays: [{ at: 0, dur: 2.6, x: 0, y: 0, w: 515, html: SHARE_SHEET }],
      rings: [{ at: 3.2, dur: 2.6, on: ["c-share-phone", "box"], radius: 18 }],
      taps: [{ at: 1.7, on: [18, 531, 60, 60] }, { at: 7.0, on: ["c-share-phone", "read"] }],
      cam: [{ at: 3.0, s: 1.25, on: ["c-share-phone", "box"], dy: 40 }, { at: 6.4, s: 1 }],
      captions: [
        { at: 0, chip: "On an Android phone", title: "Share it straight to Toran", body: "Press and hold the message in WhatsApp, tap <b>Share</b>, then choose <b>Toran</b>." },
        { at: 3.0, chip: "On an Android phone", title: "It arrives already pasted", body: "Tap <b>Read the message</b>. On an iPhone, copy and paste instead." },
      ],
    },
    {
      kind: "laptop", dur: 12, url: MANAGE + "#add-event",
      shots: [
        { at: 0, shot: "c-manage-empty" },
        { at: 1.5, shot: "c-type-open" },
        { at: 6.7, shot: "c-type-filled", quiet: true, fade: 0.25 },
        { at: 8.8, shot: "c-type-added" },
      ],
      types: [
        { at: 2.5, dur: 1.5, shot: "c-type-filled", on: ["c-type-open", "what"], textW: 220, until: 6.8 },
        { at: 4.3, dur: 0.3, shot: "c-type-filled", on: ["c-type-open", "kind"], until: 6.8 },
        { at: 4.9, dur: 0.6, shot: "c-type-filled", on: ["c-type-open", "date"], textW: 120, until: 6.8 },
        { at: 5.8, dur: 0.5, shot: "c-type-filled", on: ["c-type-open", "starts"], textW: 110, until: 6.8 },
      ],
      cursor: [
        { at: 0.3, to: ["c-manage-empty", "type"], click: true },
        { at: 1.8, to: ["c-type-open", "what"], click: true },
        { at: 3.6, to: ["c-type-open", "kind"], click: true },
        { at: 4.5, to: ["c-type-open", "date"], click: true },
        { at: 5.4, to: ["c-type-open", "starts"], click: true },
      ],
      cam: [
        { at: 1.8, s: 1.5, on: ["c-type-open", "kind"], dy: 60 },
        { at: 8.6, s: 1 },
      ],
      captions: [
        { at: 0, chip: "Way 3", n: 3, title: "Type it in", body: "What's happening, what kind of event, the date and the time." },
        { at: 6.5, chip: "Way 3", n: 3, title: "Every week? Say so once", body: "Weekly classes and satsangs repeat on their own, for up to six months." },
      ],
      chimes: [9.0],
    },
    {
      kind: "laptop", dur: 9, url: MANAGE + "#festivals",
      shots: [{ at: 0, shot: "c-fest-open" }, { at: 2.6, shot: "c-fest-ticked", fade: 0.15 }],
      cursor: [{ at: 1.6, to: ["c-fest-open", "first"], click: true }],
      cam: [{ at: 0.4, s: 1.65, on: ["c-fest-open", "first"], dx: 230, dy: 60 }, { at: 6.6, s: 1 }],
      rings: [{ at: 3.0, dur: 2.6, on: [783, 470, 540, 120], radius: 18 }],
      captions: [
        { at: 0, chip: "Way 4", n: 4, title: "Tick your festivals", body: "Toran knows the festival dates. Tick the ones your mandir is celebrating, add a time, and they're added together." },
      ],
    },
    {
      kind: "laptop", dur: 8, url: MANAGE,
      shots: [{ at: 0, shot: "c-manage" }, { at: 3.0, shot: "c-edit" }],
      cursor: [{ at: 1.0, to: ["c-manage", "edit"], click: true }],
      cam: [{ at: 0.3, s: 1.6, on: ["c-manage", "nextup"], dy: 40 }, { at: 2.8, s: 1 }],
      captions: [
        { at: 0, chip: "Changes", title: "Plans change? Edit it", body: "Change the time, or cancel. Families see it straight away, and a cancelled event is clearly marked." },
      ],
    },
    {
      kind: "laptop", dur: 14, url: MANAGE + "/seva",
      shots: [
        { at: 0, shot: "c-seva" },
        { at: 2.0, shot: "c-seva-event" },
        { at: 4.3, shot: "c-seva-shift" },
        { at: 7.0, shot: "c-seva-message" },
      ],
      cursor: [
        { at: 0.6, to: ["c-seva", "plan"], click: true },
        { at: 2.6, to: ["c-seva-event", "role"], click: true },
        { at: 4.9, to: ["c-seva-shift", "add"], click: true },
        { at: 9.4, to: ["c-seva-message", "copy"], click: true },
      ],
      cam: [
        { at: 2.2, s: 1.45, on: ["c-seva-event", "role"], dy: 100 },
        { at: 4.4, s: 1.6, on: ["c-seva-shift", "add"], dx: -260 },
        { at: 6.8, s: 1.35, on: ["c-seva-message", "copy"], dx: 140, dy: -170 },
        { at: 11.8, s: 1 },
      ],
      captions: [
        { at: 0, chip: "Seva", title: "Plan the seva rota", body: "Add the roles you need (Kitchen, Parking, Lighting diyas) and their shifts." },
        { at: 6.8, chip: "Seva", title: "Send it to your volunteers", body: "A ready-made message for your volunteers' group. They can take a slot on Toran in one tap." },
      ],
    },
    {
      kind: "laptop", dur: 9, url: MANAGE + "#share",
      shots: [{ at: 0, shot: "c-share" }],
      cursor: [{ at: 4.6, to: ["c-share", "send"], click: true }],
      cam: [{ at: 0.4, s: 1.4, on: ["c-share", "heading"], dy: 230 }, { at: 7.4, s: 1 }],
      rings: [{ at: 1.4, dur: 2.8, on: [775, 545, 530, 300], radius: 18 }],
      captions: [
        { at: 0, chip: "Every week", title: "Send this week's events", body: "One message for your WhatsApp groups, written for you. Copy it, or send it on WhatsApp." },
      ],
      chimes: [5.6],
    },
    {
      kind: "night", type: "steps", dur: 9,
      title: "Your weekly routine",
      items: ["Add new posters and messages", "Check anything waiting for you", "Send this week's events"],
      first: 1.3, every: 1.0,
      foot: "About ten minutes a week. Your committee can share the work: invite them from your page.",
      footAt: 4.6, listY: 360, footY: 800,
    },
    {
      kind: "night", type: "end", dur: 6,
      title: "You're ready",
      sub: "Questions? Use the Contact page on Toran.",
      url: "toran.org.uk", small: "Free for every mandir",
      urlAt: 1.6,
    },
  ],
};
