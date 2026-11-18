// Film 4: the committee's hub, in portrait for phones, following the
// committee guide on the site (/for-mandirs/guide). Priya (made up), on
// the committee of Shree Sample Mandir, Anytown (the made-up mandir from
// Toran's /demo page), runs the hub on her phone: what it does for the
// mandir, logging in, every way to add events, repeats and end times,
// keeping events right, aarti times and YouTube, seva, a colleague,
// sharing and numbers. Screens from capture/h-hub.spec.ts.
window.FILM = {
  name: "hub",
  title: "Your mandir's hub",
  // Screens of a sheet, which covers the phone's tab bar.
  sheets: [
    "h-add", "h-poster-open", "h-poster-chosen", "h-poster-reading",
    "h-msg-open", "h-msg-typed", "h-type-open", "h-type-filled",
    "h-type-repeat-off", "h-type-repeat", "h-type-add", "h-fest-open",
    "h-fest-ticked", "h-fest-add", "h-menu", "h-aarti", "h-youtube-open",
    "h-youtube", "h-details-save", "h-seva-role", "h-seva-shift",
    "h-committee", "h-committee-typed", "h-invited",
  ],
  scenes: [
    {
      kind: "intro", dur: 6.5,
      chip: "Committee guide",
      title: "Your mandir's hub on Toran",
      sub: "Everything your committee needs, on one page on your phone. About two minutes.",
      devices: [
        { type: "phone", shot: "h-add", x: 50, y: 1000, w: 340, rot: 10, z: 1 },
        { type: "phone", shot: "h-menu", x: 690, y: 1000, w: 340, rot: -10, z: 1 },
        { type: "phone", shot: "h-hub", x: 316, y: 900, w: 420, rot: 0, z: 2 },
      ],
    },
    {
      kind: "night", type: "list", dur: 8.5,
      title: "What it does for your mandir",
      titleY: 520, listY: 760,
      items: ["Families find your events", "Hardly any typing", "Always up to date", "Seva, sorted", "Share in one tap"],
      first: 1.3, every: 0.8,
    },
    {
      kind: "phone", dur: 10, enter: true,
      shots: [{ at: 0, shot: "h-login" }, { at: 4.4, shot: "h-login-sent" }, { at: 6.6, shot: "h-account" }],
      types: [{ at: 1.5, dur: 1.4, shot: "h-login-typed", on: ["h-login", "email"], textW: 170, until: 4.6 }],
      taps: [
        { at: 1.1, on: ["h-login", "email"] },
        { at: 3.7, on: ["h-login", "send"] },
        { at: 8.8, on: ["h-account", "open"] },
      ],
      captions: [
        { at: 0, chip: "Step 1", n: 1, title: "Log in with your email", body: "No password. Toran emails you a link: tap it and you're in." },
        { at: 6.4, chip: "Step 1", n: 1, title: "Then open your mandir", body: "Every mandir you look after is under <b>Your account</b>." },
      ],
      chimes: [4.6],
    },
    {
      kind: "phone", dur: 9,
      shots: [{ at: 0, shot: "h-hub-empty" }],
      rings: [
        { at: 1.2, dur: 2.6, on: ["h-hub-empty", "tabs"], radius: 30 },
        { at: 4.6, dur: 3.6, on: [12, 345, 366, 230], radius: 26 },
      ],
      captions: [
        { at: 0, chip: "Step 2", n: 2, title: "Your hub", body: "One page for your committee. Three tabs: <b>Events</b>, <b>Seva</b> and <b>Numbers</b>." },
        { at: 4.4, chip: "Step 2", n: 2, title: "Start with To do", body: "What needs doing now, and your setup steps. Tap a row and it takes you there." },
      ],
    },
    {
      kind: "phone", dur: 7,
      shots: [{ at: 0, shot: "h-hub-empty" }, { at: 1.6, shot: "h-add" }],
      taps: [{ at: 1.2, on: ["h-hub-empty", "addBtn"] }],
      rings: [{ at: 2.6, dur: 3.8, on: [12, 180, 366, 482], radius: 26 }],
      captions: [
        { at: 0, chip: "Step 3", n: 3, title: "Press Add events", body: "Then choose whichever way is easiest. There are four." },
      ],
    },
    {
      kind: "phone", dur: 15,
      shots: [
        { at: 0, shot: "h-add" },
        { at: 1.5, shot: "h-poster-open" },
        { at: 3.6, shot: "h-poster-chosen", fade: 0.2 },
        { at: 5.8, shot: "h-poster-reading", fade: 0.15 },
        { at: 8.0, shot: "h-poster-read" },
        { at: 11.4, shot: "h-poster-published" },
      ],
      taps: [
        { at: 1.1, on: ["h-add", "photo"] },
        { at: 3.2, on: ["h-poster-open", "file"] },
        { at: 5.4, on: ["h-poster-chosen", "readIt"] },
        { at: 11.0, on: ["h-poster-read", "publish"] },
      ],
      callouts: [{ at: 8.8, dur: 2.0, text: "Check it, then Publish", on: ["h-poster-read", "publish"], fx: 0.15 }],
      captions: [
        { at: 0, chip: "Way 1", n: 1, title: "A photo of the poster", body: "Tap <b>Photo of a poster</b>, choose the picture, then <b>Read it</b>." },
        { at: 5.6, chip: "Way 1", n: 1, title: "Toran reads it for you", body: "Dates, times and details, even from a Gujarati patrika. The photo isn't kept." },
        { at: 8.0, chip: "Way 1", n: 1, title: "You check it, then publish", body: "It waits under <b>Posters waiting for you</b>. Nothing goes live until you say so." },
      ],
      chimes: [11.6],
    },
    {
      kind: "phone", dur: 12,
      shots: [
        { at: 0, shot: "h-add" },
        { at: 1.5, shot: "h-msg-open" },
        { at: 5.3, shot: "h-msg-typed", quiet: true, fade: 0.1 },
        { at: 6.7, shot: "h-msg-read" },
        { at: 9.8, shot: "h-poster-published" },
      ],
      types: [{ at: 2.9, dur: 2.2, shot: "h-msg-typed", on: ["h-msg-open", "box"], mode: "lines", lineH: 24, until: 5.4 }],
      taps: [
        { at: 1.1, on: ["h-add", "message"] },
        { at: 2.4, on: ["h-msg-open", "box"] },
        { at: 6.2, on: ["h-msg-typed", "readMsg"] },
        { at: 9.4, on: ["h-msg-read", "publish"] },
      ],
      captions: [
        { at: 0, chip: "Way 2", n: 2, title: "Paste a WhatsApp message", body: "Press and hold the message in WhatsApp, Copy, then paste it here." },
        { at: 6.5, chip: "Way 2", n: 2, title: "Toran fills in the event", body: "Check the date and time, then <b>Publish</b>." },
      ],
      chimes: [10.0],
    },
    {
      kind: "phone", dur: 16,
      shots: [
        { at: 0, shot: "h-add" },
        { at: 1.5, shot: "h-type-open" },
        { at: 6.4, shot: "h-type-filled", quiet: true, fade: 0.2 },
        { at: 7.4, shot: "h-type-repeat-off" },
        { at: 9.2, shot: "h-type-repeat", quiet: true, fade: 0.25 },
        { at: 12.0, shot: "h-type-add" },
        { at: 13.6, shot: "h-type-added" },
      ],
      types: [
        { at: 2.4, dur: 1.4, shot: "h-type-filled", on: ["h-type-open", "what"], textW: 240, until: 6.5 },
        { at: 4.1, dur: 0.5, shot: "h-type-filled", on: ["h-type-open", "date"], textW: 120, until: 6.5 },
        { at: 4.9, dur: 0.4, shot: "h-type-filled", on: ["h-type-open", "starts"], textW: 60, until: 6.5 },
        { at: 5.6, dur: 0.4, shot: "h-type-filled", on: ["h-type-open", "ends"], textW: 60, until: 6.5 },
      ],
      taps: [
        { at: 1.1, on: ["h-add", "type"] },
        { at: 2.0, on: ["h-type-open", "what"] },
        { at: 3.9, on: ["h-type-open", "date"] },
        { at: 4.7, on: ["h-type-open", "starts"] },
        { at: 5.4, on: ["h-type-open", "ends"] },
        { at: 8.8, on: ["h-type-repeat-off", "repeats"] },
        { at: 13.2, on: ["h-type-add", "add"] },
      ],
      rings: [{ at: 9.8, dur: 2.0, on: ["h-type-repeat", "often"], radius: 20 }],
      captions: [
        { at: 0, chip: "Way 3", n: 3, title: "Type it in", body: "Tap <b>Type it in</b>: the name, the date, when it starts and, if you know, when it ends." },
        { at: 7.4, chip: "Way 3", n: 3, title: "Every week? Tick It repeats", body: "Choose how often. It's listed for a year, and stops sooner if you give a last day." },
      ],
      chimes: [13.8],
    },
    {
      kind: "phone", dur: 9,
      shots: [
        { at: 0, shot: "h-fest-open" },
        { at: 2.0, shot: "h-fest-ticked", quiet: true, fade: 0.15 },
        { at: 4.4, shot: "h-fest-add" },
      ],
      taps: [{ at: 1.7, on: ["h-fest-open", "first"] }, { at: 6.2, on: ["h-fest-add", "add"] }],
      captions: [
        { at: 0, chip: "Way 4", n: 4, title: "Tick your festivals", body: "Toran knows this year's dates. Tick the ones your mandir is celebrating." },
        { at: 4.3, chip: "Way 4", n: 4, title: "Add them all at once", body: "From your second year, <b>Again this year?</b> brings back last year's events too." },
      ],
      chimes: [6.5],
    },
    {
      kind: "phone", dur: 11,
      shots: [{ at: 0, shot: "h-upcoming" }, { at: 2.0, shot: "h-menu" }, { at: 7.6, shot: "h-confirmed" }],
      taps: [{ at: 1.6, on: ["h-upcoming", "more"] }, { at: 7.2, on: ["h-menu", "stillOn"] }],
      rings: [{ at: 2.8, dur: 3.6, on: ["h-menu", "stillOn"], radius: 20 }],
      captions: [
        { at: 0, chip: "Step 4", n: 4, title: "Keep it right", body: "Tap <b>⋯</b> next to any event in <b>Coming up</b>." },
        { at: 2.6, chip: "Step 4", n: 4, title: "Still on, Cancel or Edit", body: "<b>Still on</b> shows families “Confirmed by the mandir”. A cancelled event stays, clearly marked." },
      ],
      chimes: [7.8],
    },
    {
      kind: "phone", dur: 15,
      shots: [
        { at: 0, shot: "h-aarti" },
        { at: 3.6, shot: "h-youtube-open" },
        { at: 5.6, shot: "h-youtube", quiet: true, fade: 0.1 },
        { at: 6.8, shot: "h-details-save" },
        { at: 8.6, shot: "h-aarti-note" },
        { at: 12.0, shot: "h-public-watch" },
      ],
      types: [{ at: 4.6, dur: 0.9, shot: "h-youtube", on: ["h-youtube-open", "live"], textW: 260, until: 5.7 }],
      taps: [{ at: 4.2, on: ["h-youtube-open", "live"] }, { at: 8.2, on: ["h-details-save", "save"] }],
      rings: [
        { at: 0.8, dur: 2.6, on: ["h-aarti", "aarti"], radius: 18 },
        { at: 9.2, dur: 2.6, on: ["h-aarti-note", "note"], radius: 18 },
        { at: 12.6, dur: 2.0, on: ["h-public-watch", "watch"], radius: 30 },
      ],
      captions: [
        { at: 0, chip: "Your details", title: "Add your aarti times", body: "Under <b>Your mandir</b>, then <b>Details</b>." },
        { at: 3.6, chip: "Your details", title: "And your YouTube link", body: "For anyone who can't come in person." },
        { at: 8.6, chip: "Your details", title: "Aarti, in What's on every day", body: "Families looking for an aarti near them find yours. Your page shows <b>Watch on YouTube</b>." },
      ],
      chimes: [8.8],
    },
    {
      kind: "phone", dur: 13,
      shots: [
        { at: 0, shot: "h-seva-event" },
        { at: 1.6, shot: "h-seva-role" },
        { at: 4.4, shot: "h-seva-shift" },
        { at: 7.6, shot: "h-seva-send" },
      ],
      taps: [
        { at: 1.2, on: ["h-seva-event", "addRole"] },
        { at: 4.0, on: ["h-seva-role", "add"] },
        { at: 7.2, on: ["h-seva-shift", "add"] },
        { at: 11.4, on: ["h-seva-send", "whatsapp"] },
      ],
      rings: [
        { at: 4.8, dur: 2.0, on: ["h-seva-shift", "form"], radius: 20 },
        { at: 8.4, dur: 2.6, on: ["h-seva-send", "whatsapp"], radius: 30 },
      ],
      captions: [
        { at: 0, chip: "Seva", title: "Plan the seva rota", body: "Tap <b>⋯</b>, then <b>Seva rota</b>. Add the roles you need and their shifts." },
        { at: 7.4, chip: "Seva", title: "Send it to your volunteers", body: "The message for your volunteers' group, written for you. They take a place in one tap." },
      ],
    },
    {
      kind: "phone", dur: 9,
      shots: [
        { at: 0, shot: "h-committee" },
        { at: 3.0, shot: "h-committee-typed", quiet: true, fade: 0.1 },
        { at: 4.6, shot: "h-invited" },
      ],
      types: [{ at: 1.6, dur: 1.2, shot: "h-committee-typed", on: ["h-committee", "email"], textW: 190, until: 3.1 }],
      taps: [{ at: 1.2, on: ["h-committee", "email"] }, { at: 4.2, on: ["h-committee-typed", "invite"] }],
      captions: [
        { at: 0, chip: "Your committee", title: "Invite a colleague", body: "Under <b>Your mandir</b>, then <b>Committee</b>. Then you're never the only one." },
      ],
      chimes: [4.8],
    },
    {
      kind: "phone", dur: 8,
      shots: [{ at: 0, shot: "h-share" }],
      rings: [{ at: 1.2, dur: 3.0, on: ["h-share", "send"], radius: 30 }],
      taps: [{ at: 5.0, on: ["h-share", "send"] }],
      captions: [
        { at: 0, chip: "Every week", title: "Send this week's events", body: "One message for your WhatsApp groups, written for you. Tap <b>Send on WhatsApp</b>." },
      ],
      chimes: [5.4],
    },
    {
      kind: "phone", dur: 7,
      shots: [{ at: 0, shot: "h-numbers" }],
      rings: [{ at: 1.4, dur: 4.4, on: [20, 358, 352, 214], radius: 24 }],
      captions: [
        { at: 0, chip: "Numbers", title: "See what's working", body: "How many people looked at your events, shared them and put them in their calendars." },
      ],
    },
    {
      kind: "night", type: "steps", dur: 9,
      title: "Your weekly routine",
      items: ["Add new posters and messages", "Check your To do list", "Send this week's events"],
      first: 1.3, every: 1.0,
      foot: "About ten minutes a week, and your committee can share it.",
      footAt: 4.6,
    },
    {
      kind: "night", type: "end", dur: 6.5,
      title: "You're ready",
      sub: "The step-by-step guide is on Toran, under For mandir committees.",
      url: "toran.org.uk", small: "Free for every mandir",
      urlAt: 1.8,
    },
  ],
};
