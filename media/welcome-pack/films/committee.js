// Film 2: the committee guide, in portrait for phones. Priya (made up), on
// the committee of Shree Sample Mandir, Anytown (the made-up mandir from
// Toran's /demo page), logs in on her phone and adds events every way there
// is, plans seva and shares the week.
const SHARE_SHEET = `<div style="width:515px;height:876px;transform:scale(1.3631);transform-origin:0 0"><div style="position:absolute;left:0;top:0;width:515px;height:876px;background:rgba(10,14,25,.5)">
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
  </div></div></div>`;

window.FILM = {
  name: "committee",
  title: "Committee guide",
  scenes: [
    {
      kind: "intro", dur: 6.5,
      chip: "Committee guide",
      title: "Add your mandir's events in minutes",
      sub: "Logging in, four ways to add events, seva and sharing. About two minutes.",
      devices: [
        { type: "phone", shot: "pc-poster-read", x: 50, y: 1000, w: 340, rot: 10, z: 1 },
        { type: "phone", shot: "pc-share", x: 690, y: 1000, w: 340, rot: -10, z: 1 },
        { type: "phone", shot: "pc-manage", x: 316, y: 900, w: 420, rot: 0, z: 2 },
      ],
    },
    {
      kind: "phone", dur: 11, enter: true,
      shots: [{ at: 0, shot: "pc-login" }, { at: 4.6, shot: "pc-login-sent" }, { at: 7.2, shot: "pc-account" }],
      types: [{ at: 1.6, dur: 1.4, shot: "pc-login-typed", on: ["pc-login", "email"], textW: 170, until: 4.8 }],
      taps: [
        { at: 1.1, on: ["pc-login", "email"] },
        { at: 3.8, on: ["pc-login", "send"] },
        { at: 9.4, on: ["pc-account", "open"] },
      ],
      captions: [
        { at: 0, chip: "Step 1", n: 1, title: "Log in with your email", body: "No password to remember. Toran emails you a link: tap it and you're in." },
        { at: 7.0, chip: "Step 1", n: 1, title: "Then open your mandir", body: "Every mandir you look after is listed under <b>Your account</b>." },
      ],
      chimes: [4.9],
    },
    {
      kind: "phone", dur: 10,
      shots: [{ at: 0, shot: "pc-manage" }, { at: 4.6, shot: "pc-nextup" }],
      rings: [
        { at: 1.4, dur: 2.8, on: [12, 318, 366, 192], radius: 26 },
        { at: 5.2, dur: 3.2, on: ["pc-nextup", "nextup"], radius: 26 },
      ],
      captions: [
        { at: 0, chip: "Step 2", n: 2, title: "Your committee page", body: "Everything starts here. At the top: four ways to add events." },
        { at: 4.5, chip: "Step 2", n: 2, title: "What's next", body: "Your next events, with <b>Edit</b> beside each one, and anything waiting for you to check." },
      ],
    },
    {
      kind: "phone", dur: 15.5,
      shots: [
        { at: 0, shot: "pc-manage-empty" },
        { at: 1.5, shot: "pc-poster-open" },
        { at: 3.6, shot: "pc-poster-chosen", fade: 0.2 },
        { at: 5.9, shot: "pc-poster-reading", fade: 0.15 },
        { at: 8.2, shot: "pc-poster-read" },
        { at: 11.6, shot: "pc-poster-published" },
      ],
      taps: [
        { at: 1.1, on: ["pc-manage-empty", "photo"] },
        { at: 3.2, on: ["pc-poster-open", "file"] },
        { at: 5.5, on: ["pc-poster-chosen", "readIt"] },
        { at: 11.2, on: ["pc-poster-read", "publish"] },
      ],
      callouts: [{ at: 9.0, dur: 2.0, text: "Check it, then Publish", on: ["pc-poster-read", "publish"], fx: 0.15 }],
      captions: [
        { at: 0, chip: "Way 1", n: 1, title: "Send a photo of the poster", body: "Tap <b>Photo of a poster</b>, choose the picture, then <b>Read it</b>." },
        { at: 5.8, chip: "Way 1", n: 1, title: "Toran reads it for you", body: "Dates, times and details, even from a Gujarati patrika. About half a minute." },
        { at: 8.2, chip: "Way 1", n: 1, title: "You check it, then publish", body: "Nothing goes live until someone on the committee has checked it." },
      ],
      chimes: [11.8],
    },
    {
      kind: "phone", dur: 13,
      shots: [
        { at: 0, shot: "pc-manage-empty" },
        { at: 1.5, shot: "pc-msg-open" },
        { at: 5.4, shot: "pc-msg-typed", quiet: true, fade: 0.1 },
        { at: 6.8, shot: "pc-msg-read" },
        { at: 10.0, shot: "pc-poster-published" },
      ],
      types: [{ at: 3.0, dur: 2.2, shot: "pc-msg-typed", on: ["pc-msg-open", "box"], mode: "lines", lineH: 24, until: 5.5 }],
      taps: [
        { at: 1.1, on: ["pc-manage-empty", "message"] },
        { at: 2.4, on: ["pc-msg-open", "box"] },
        { at: 6.3, on: ["pc-msg-typed", "readMsg"] },
        { at: 9.6, on: ["pc-msg-read", "publish"] },
      ],
      captions: [
        { at: 0, chip: "Way 2", n: 2, title: "Paste a WhatsApp message", body: "Copy the message in WhatsApp, then paste it under <b>Paste a WhatsApp message</b>." },
        { at: 6.6, chip: "Way 2", n: 2, title: "Toran fills in the event", body: "Check the date and time, then <b>Publish</b>." },
      ],
      chimes: [10.2],
    },
    {
      kind: "phone", dur: 9.5,
      shots: [{ at: 0, shot: "c-share-phone" }],
      overlays: [{ at: 0, dur: 2.6, x: 0, y: 0, w: 702, html: SHARE_SHEET }],
      rings: [{ at: 3.2, dur: 2.6, on: ["c-share-phone", "box"], radius: 22 }],
      taps: [{ at: 1.7, on: [28, 541, 40, 40] }, { at: 7.0, on: ["c-share-phone", "read"] }],
      captions: [
        { at: 0, chip: "On an Android phone", title: "Or share it straight to Toran", body: "Press and hold the message in WhatsApp, tap <b>Share</b>, then <b>Toran</b>." },
        { at: 3.0, chip: "On an Android phone", title: "It arrives already pasted", body: "Tap <b>Read the message</b>. On an iPhone, copy and paste instead." },
      ],
    },
    {
      kind: "phone", dur: 12,
      shots: [
        { at: 0, shot: "pc-type-open" },
        { at: 6.2, shot: "pc-type-filled", quiet: true, fade: 0.2 },
        { at: 9.0, shot: "pc-type-added" },
      ],
      scroll: [{ at: 0, y: 1800, dur: 0 }, { at: 6.4, y: 2453, dur: 1.4 }],
      types: [
        { at: 1.9, dur: 1.4, shot: "pc-type-filled", on: ["pc-type-open", "what"], textW: 230, until: 6.3 },
        { at: 3.8, dur: 0.3, shot: "pc-type-filled", on: ["pc-type-open", "kind"], until: 6.3 },
        { at: 4.5, dur: 0.5, shot: "pc-type-filled", on: ["pc-type-open", "date"], textW: 110, until: 6.3 },
        { at: 5.4, dur: 0.5, shot: "pc-type-filled", on: ["pc-type-open", "starts"], textW: 90, until: 6.3 },
      ],
      taps: [
        { at: 1.5, on: ["pc-type-open", "what"] },
        { at: 3.6, on: ["pc-type-open", "kind"] },
        { at: 4.3, on: ["pc-type-open", "date"] },
        { at: 5.2, on: ["pc-type-open", "starts"] },
        { at: 8.4, on: ["pc-type-filled", "add"] },
      ],
      captions: [
        { at: 0, chip: "Way 3", n: 3, title: "Type it in", body: "Tap <b>Type it in</b>: what's happening, the kind of event, the date and the time." },
        { at: 6.3, chip: "Way 3", n: 3, title: "Every week? Say so once", body: "Weekly classes and satsangs repeat on their own, for up to six months." },
      ],
      chimes: [9.2],
    },
    {
      kind: "phone", dur: 10,
      shots: [{ at: 0, shot: "pc-fest-open" }, { at: 2.0, shot: "pc-fest-ticked", quiet: true, fade: 0.15 }],
      scroll: [{ at: 0, y: 5465, dur: 0 }, { at: 4.6, y: 6530, dur: 1.6 }],
      taps: [{ at: 1.7, on: ["pc-fest-open", "first"] }, { at: 7.0, on: ["pc-fest-ticked", "add"] }],
      rings: [{ at: 2.2, dur: 2.0, on: [42, 5742, 307, 156], radius: 18 }],
      captions: [
        { at: 0, chip: "Way 4", n: 4, title: "Tick your festivals", body: "Tap <b>Tick festivals</b>. Toran knows the dates: tick the ones your mandir is celebrating." },
        { at: 4.6, chip: "Way 4", n: 4, title: "Add them together", body: "Add a time if you like, then add them all in one go." },
      ],
      chimes: [7.3],
    },
    {
      kind: "phone", dur: 8,
      shots: [{ at: 0, shot: "pc-nextup" }, { at: 2.2, shot: "pc-edit" }],
      taps: [{ at: 1.8, on: ["pc-nextup", "edit"] }],
      captions: [
        { at: 0, chip: "Changes", title: "Plans change? Edit it", body: "Change the time, or cancel. Families see it straight away, and a cancelled event is clearly marked." },
      ],
    },
    {
      kind: "phone", dur: 14,
      shots: [
        { at: 0, shot: "pc-seva" },
        { at: 1.6, shot: "pc-seva-event" },
        { at: 4.2, shot: "pc-seva-shift" },
        { at: 7.4, shot: "pc-seva-message" },
      ],
      taps: [
        { at: 1.2, on: ["pc-seva", "plan"] },
        { at: 2.6, on: ["pc-seva-event", "role"] },
        { at: 6.4, on: ["pc-seva-shift", "add"] },
        { at: 11.0, on: ["pc-seva-message", "whatsapp"] },
      ],
      rings: [
        { at: 4.6, dur: 1.6, on: ["pc-seva-shift", "form"], radius: 20 },
        { at: 8.2, dur: 2.4, on: ["pc-seva-message", "whatsapp"], radius: 30 },
      ],
      captions: [
        { at: 0, chip: "Seva", title: "Plan the seva rota", body: "Add the roles you need (Kitchen, Parking, Lighting diyas) and their shifts." },
        { at: 7.2, chip: "Seva", title: "Send it to your volunteers", body: "A ready-made message for your volunteers' group. They take a slot on Toran in one tap." },
      ],
    },
    {
      kind: "phone", dur: 9,
      shots: [{ at: 0, shot: "pc-share" }],
      rings: [{ at: 1.4, dur: 3.0, on: ["pc-share", "send"], radius: 30 }],
      taps: [{ at: 5.2, on: ["pc-share", "send"] }],
      captions: [
        { at: 0, chip: "Every week", title: "Send this week's events", body: "One message for your WhatsApp groups, written for you. Tap <b>Send on WhatsApp</b>." },
      ],
      chimes: [5.6],
    },
    {
      kind: "night", type: "steps", dur: 9,
      title: "Your weekly routine",
      items: ["Add new posters and messages", "Check anything waiting for you", "Send this week's events"],
      first: 1.3, every: 1.0,
      foot: "About ten minutes a week. Your committee can share the work: invite them from your page.",
      footAt: 4.6,
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
