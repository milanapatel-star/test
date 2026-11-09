// Film 1: for mandir committees deciding whether to join. What Toran is,
// how a mandir's page is claimed, and what it does for the mandir. The
// mandir is Shree Sample Mandir, Anytown, made up (Toran's /demo page).
window.FILM = {
  name: "mandirs",
  title: "Toran for mandirs",
  scenes: [
    {
      kind: "intro", dur: 7,
      chip: "For mandir committees",
      title: "Your mandir's events, where families look",
      sub: "What Toran is, and how your mandir joins. About ninety seconds.",
      devices: [
        { type: "laptop", shot: "c-manage", x: 880, y: 200, w: 860, rot: -10, url: "/manage/shree-sample-mandir-anytown", z: 1 },
        { type: "phone", shot: "f-mandir-top", x: 1520, y: 330, w: 290, rot: -6, z: 2 },
      ],
    },
    {
      kind: "night", type: "lines", dur: 11,
      lines: [
        { at: 0.4, text: "Your programme goes on a poster…", y: 250, size: 64, x: 130, w: 860 },
        { at: 3.6, text: "…the poster goes into busy WhatsApp groups…", y: 450, size: 64, x: 130, w: 860 },
        { at: 7.0, text: "…and families still miss it.", y: 650, size: 64, x: 130, w: 860, cls: "gold" },
      ],
      cards: [
        { at: 0.9, type: "poster", x: 1080, y: 130, w: 330, rot: 4 },
        { at: 4.1, type: "chat", x: 1250, y: 400, rot: -3, unread: 412 },
      ],
    },
    {
      kind: "night", type: "title", dur: 6.5,
      title: "Toran puts every mandir's events in one place",
      size: 84,
      sub: "Free for mandirs. Free for families.",
      subAt: 2.2,
    },
    {
      kind: "phone", dur: 13, enter: true,
      shots: [{ at: 0, shot: "m-mandir-new" }],
      scroll: [{ at: 0, y: 0, dur: 0 }, { at: 3.2, y: 1480, dur: 3.2 }, { at: 8.6, y: 2370, dur: 2 }],
      rings: [{ at: 10.6, dur: 2.2, on: ["m-mandir-new", "lookAfter"], radius: 30 }],
      captions: [
        { at: 0, chip: "Step 1", n: 1, title: "Your mandir is already listed", body: "Toran lists UK mandirs from public details: where it is, when it's open, how to get there." },
        { at: 5.0, chip: "Step 1", n: 1, title: "Families can find it", body: "By town, on the map, and by festival, in English, Gujarati and Hindi." },
        { at: 9.6, chip: "Step 1", n: 1, title: "On the committee?", body: "Tap <b>Look after this page</b>." },
      ],
    },
    {
      kind: "phone", dur: 12.5,
      shots: [{ at: 0, shot: "m-claim" }, { at: 9.0, shot: "m-claim-sent" }],
      scroll: [{ at: 0, y: 240, dur: 0 }, { at: 4.4, y: 640, dur: 1.4 }, { at: 6.2, y: 980, dur: 1.4 }],
      types: [
        { at: 1.6, dur: 1.0, shot: "m-claim-filled", on: ["m-claim", "role"], textW: 80, until: 9.1 },
        { at: 5.9, dur: 0.1, shot: "m-claim-filled", on: ["m-claim", "tick1"], pad: 4, until: 9.1 },
        { at: 6.4, dur: 0.1, shot: "m-claim-filled", on: ["m-claim", "tick2"], pad: 4, until: 9.1 },
      ],
      taps: [
        { at: 1.2, on: ["m-claim", "role"] },
        { at: 5.9, on: ["m-claim", "tick1"] },
        { at: 6.4, on: ["m-claim", "tick2"] },
        { at: 8.4, on: ["m-claim", "send"] },
      ],
      captions: [
        { at: 0, chip: "Step 2", n: 2, title: "Ask to look after the page", body: "Say what your role is, and tick two boxes." },
        { at: 9.0, chip: "Step 2", n: 2, title: "We check with the mandir", body: "Usually by phone, before anyone can change your page. Then your committee is in." },
      ],
      chimes: [9.2],
    },
    {
      kind: "laptop", dur: 13.5, enter: true, url: "/manage/shree-sample-mandir-anytown",
      shots: [
        { at: 0, shot: "c-manage-empty" },
        { at: 1.5, shot: "c-poster-chosen" },
        { at: 3.6, shot: "c-poster-reading", fade: 0.15 },
        { at: 5.6, shot: "c-poster-read" },
        { at: 9.6, shot: "c-poster-published" },
      ],
      cursor: [
        { at: 0.3, to: ["c-manage-empty", "photo"], click: true },
        { at: 2.4, to: ["c-poster-chosen", "readIt"], click: true },
        { at: 7.4, to: ["c-poster-read", "publish"], click: true },
      ],
      cam: [
        { at: 1.6, s: 1.55, on: ["c-poster-chosen", "file"], dy: 40 },
        { at: 5.4, s: 1.45, on: ["c-poster-read", "first"] },
        { at: 9.4, s: 1 },
      ],
      captions: [
        { at: 0, chip: "Step 3", n: 3, title: "Add events in minutes", body: "Send a photo of your poster, paste a WhatsApp message, or type it in." },
        { at: 5.6, chip: "Step 3", n: 3, title: "A person always checks", body: "Toran reads the poster; nothing goes live until your committee has checked it." },
      ],
      chimes: [9.8],
    },
    {
      kind: "phone", dur: 12,
      shots: [{ at: 0, shot: "f-mandir" }, { at: 6.6, shot: "f-event-calendar" }],
      scroll: [{ at: 0, y: 0, dur: 0 }, { at: 1.8, y: 620, dur: 3 }],
      cam: [{ at: 6.8, s: 1.3, on: ["f-event-calendar", "calendar"], dy: 120 }, { at: 10.8, s: 1 }],
      captions: [
        { at: 0, chip: "Step 4", n: 4, title: "Families find it, save it, share it", body: "On your page, in What's on and on the map. Families can follow your mandir." },
        { at: 6.4, chip: "Step 4", n: 4, title: "One tap to their calendar", body: "Or straight to the family WhatsApp group." },
      ],
    },
    {
      kind: "laptop", dur: 8.5, url: "/manage/shree-sample-mandir-anytown/seva",
      shots: [{ at: 0, shot: "c-seva-message" }],
      cam: [{ at: 0.4, s: 1.35, on: ["c-seva-message", "copy"], dx: 140, dy: -170 }, { at: 7.2, s: 1 }],
      captions: [
        { at: 0, chip: "Step 5", n: 5, title: "Ask for seva", body: "Plan a rota and send it to your volunteers. They take a slot in one tap." },
      ],
    },
    {
      kind: "laptop", dur: 8.5, url: "/manage/shree-sample-mandir-anytown/numbers",
      shots: [{ at: 0, shot: "c-numbers" }],
      cam: [{ at: 0.6, s: 1.45, on: [459, 545, 521, 293] }, { at: 7.2, s: 1 }],
      captions: [
        { at: 0, chip: "Step 6", n: 6, title: "See it working", body: "How many people saw your events, added them to a calendar and shared them. Counted without cookies." },
      ],
    },
    {
      kind: "night", type: "list", dur: 8,
      title: "Toran is",
      items: ["Free for every mandir", "No adverts, no tracking", "Run by your committee", "English · ગુજરાતી · हिन्दी"],
      first: 1.2, every: 0.9, titleY: 200, listY: 360,
    },
    {
      kind: "night", type: "end", dur: 7,
      title: "Claim your mandir's page",
      url: "toran.org.uk/for-mandirs", small: "Or ask us, and we'll set it up with you",
      urlAt: 1.6,
    },
  ],
};
