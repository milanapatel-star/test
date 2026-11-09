// Film 3: for families. Someone in Anytown (made up) finds what's on near
// them, saves an event, shares it, follows the mandir, finds it on the map
// and takes a seva slot, on a phone.
const WA_PREVIEW = `<div style="position:absolute;left:0;top:0;width:515px;height:876px;background:#efeae2;font-family:Mulish">
  <div style="background:#1f5e54;color:#fff;padding:52px 22px 16px;font-weight:800;font-size:21px;display:flex;gap:14px;align-items:center"><span style="width:44px;height:44px;border-radius:50%;background:#d9fdd3;display:inline-block"></span>Family 🙏</div>
  <div style="margin:26px 18px 0 auto;width:360px;background:#d9fdd3;border-radius:18px 6px 18px 18px;padding:8px;box-shadow:0 1px 1px rgba(0,0,0,.1)">
    <div style="border-radius:12px;overflow:hidden;background:#fff">
      <div style="height:150px;background:radial-gradient(120% 100% at 50% 20%,#1b2b52,#14213d 60%,#0b1222);display:flex;align-items:flex-end;padding:16px;color:#f6f4ef;font-family:Marcellus;font-size:30px;line-height:1.05">Kartik Purnima deepotsav</div>
      <div style="padding:10px 12px"><div style="font-weight:800;font-size:16px;color:#111">Sat 14 Nov, 6:30pm · Shree Sample Mandir</div><div style="font-size:14px;color:#667">toran.org.uk</div></div>
    </div>
    <div style="font-size:17px;padding:8px 6px 2px;color:#111">Shall we go? 🪔</div>
  </div>
  <div style="margin:16px 18px 0;width:fit-content;background:#fff;border-radius:6px 18px 18px 18px;padding:10px 16px;font-size:18px;color:#111"><div style="font-size:14px;color:#c2185b;font-weight:800">Ba</div>Yes! I'll be there 🙏</div>
</div>`;

window.FILM = {
  name: "families",
  title: "Find what's on",
  scenes: [
    {
      kind: "night", type: "title", dur: 6.5,
      chip: "For families",
      title: "Find what's on at mandirs near you",
      sub: "Festivals, satsangs, classes and seva, all in one place.<br>No app to download, no account.",
    },
    {
      kind: "phone", dur: 8.5, enter: true,
      shots: [{ at: 0, shot: "f-home-full" }],
      scroll: [{ at: 0, y: 0, dur: 0 }, { at: 3.4, y: 640, dur: 3.2 }],
      captions: [{ at: 0, chip: "Start here", title: "Open toran.org.uk", body: "On any phone or computer. Nothing to install, no account, no password." }],
    },
    {
      kind: "phone", dur: 14,
      shots: [
        { at: 0, shot: "f-whatson-top" },
        { at: 2.0, shot: "f-picker" },
        { at: 4.4, shot: "f-whatson-near-full" },
      ],
      scroll: [{ at: 0, y: 0, dur: 0 }, { at: 6.4, y: 1200, dur: 3.2 }],
      taps: [{ at: 1.6, on: ["f-whatson-top", "choose"] }, { at: 3.8, on: ["f-picker", "useLocation"] }],
      cam: [{ at: 0.6, s: 1.5, on: ["f-whatson-top", "choose"], dx: -60 }, { at: 3.0, s: 1 }],
      rings: [{ at: 10.0, dur: 2.6, on: [12, 1500, 366, 210], radius: 18 }],
      captions: [
        { at: 0, chip: "Step 1", n: 1, title: "See what's on near you", body: "Tap <b>Find near me</b>, then <b>Use my location</b>. Or type your postcode." },
        { at: 4.6, chip: "Step 1", n: 1, title: "Nearest first", body: "Everything on in the next eight weeks, with how far away it is." },
      ],
    },
    {
      kind: "phone", dur: 12,
      shots: [{ at: 0, shot: "f-event" }, { at: 7.2, shot: "f-event-calendar" }],
      scroll: [{ at: 0, y: 0, dur: 0 }, { at: 2.4, y: 1080, dur: 2.6 }],
      rings: [{ at: 5.2, dur: 1.8, on: ["f-event", "calendar"], radius: 30 }],
      taps: [{ at: 6.8, on: ["f-event", "calendar"] }],
      cam: [{ at: 7.4, s: 1.35, on: ["f-event-calendar", "calendar"], dy: 120 }, { at: 11.0, s: 1, dur: 0.8 }],
      captions: [
        { at: 0, chip: "Step 2", n: 2, title: "Open an event", body: "When, where, and what to expect, with directions." },
        { at: 5.0, chip: "Step 2", n: 2, title: "Save it to your calendar", body: "Google, Apple or Outlook, with a reminder before it starts." },
      ],
      chimes: [7.6],
    },
    {
      kind: "phone", dur: 9,
      shots: [{ at: 0, shot: "f-event-share" }],
      rings: [{ at: 0.8, dur: 2.0, on: ["f-event-share", "whatsapp"], radius: 30 }],
      taps: [{ at: 2.8, on: ["f-event-share", "whatsapp"] }],
      overlays: [{ at: 3.3, dur: 5.4, x: 0, y: 0, w: 515, html: WA_PREVIEW }],
      captions: [
        { at: 0, chip: "Step 3", n: 3, title: "Send it to the family", body: "Tap <b>WhatsApp</b> and it's ready to send, with a picture of the event." },
      ],
      chimes: [5.2],
    },
    {
      kind: "phone", dur: 11,
      shots: [{ at: 0, shot: "f-mandir-top" }, { at: 2.4, shot: "f-mandir-followed", fade: 0.2 }, { at: 6.2, shot: "f-my-top" }],
      taps: [{ at: 2.0, on: ["f-mandir-top", "follow"] }],
      cam: [{ at: 0.6, s: 1.3, on: ["f-mandir-top", "follow"], dx: -150, dy: 60 }, { at: 5.6, s: 1 }],
      captions: [
        { at: 0, chip: "Step 4", n: 4, title: "Follow your mandirs", body: "Tap <b>Follow</b> on the mandirs you go to." },
        { at: 6.0, chip: "Step 4", n: 4, title: "They gather in My Toran", body: "Their events, your plan and your seva, saved on your phone. No account, and nothing about you is kept." },
      ],
      chimes: [2.5],
    },
    {
      kind: "phone", dur: 11.5,
      shots: [{ at: 0, shot: "f-map" }, { at: 2.4, shot: "f-map-near" }, { at: 6.4, shot: "f-map-card" }],
      taps: [{ at: 1.9, on: ["f-map", "nearMe"] }, { at: 6.0, on: [117, 240, 28, 30] }],
      cam: [{ at: 6.6, s: 1.3, on: [140, 300, 240, 160] }, { at: 10.4, s: 1 }],
      captions: [
        { at: 0, chip: "Step 5", n: 5, title: "Find a mandir on the map", body: "Tap <b>Near me</b>. Every lamp is a mandir." },
        { at: 6.2, chip: "Step 5", n: 5, title: "Tap a lamp", body: "See what's on there, or get directions." },
      ],
    },
    {
      kind: "phone", dur: 10,
      shots: [{ at: 0, shot: "f-seva-top" }, { at: 3.4, shot: "f-seva-taken", fade: 0.2 }],
      rings: [{ at: 0.9, dur: 2.0, on: ["f-seva-top", "take"], radius: 30 }],
      taps: [{ at: 3.0, on: ["f-seva-top", "take"] }],
      cam: [{ at: 0.4, s: 1.25, on: ["f-seva-top", "take"], dx: 40, dy: -40 }, { at: 8.6, s: 1 }],
      captions: [
        { at: 0, chip: "Step 6", n: 6, title: "Give seva", body: "When a mandir needs helpers, take a slot in one tap." },
        { at: 3.6, chip: "Step 6", n: 6, title: "You're on the rota", body: "No sign-up, and Toran doesn't ask your name. The committee just sees one more person coming." },
      ],
      chimes: [3.5],
    },
    {
      kind: "phone", dur: 10,
      shots: [{ at: 0, shot: "f-festivals-full" }, { at: 5.2, shot: "f-mandir-gu" }],
      scroll: [{ at: 0, y: 0, dur: 0 }, { at: 1.6, y: 520, dur: 3 }],
      captions: [
        { at: 0, chip: "Festivals", title: "Every festival, in one place", body: "Navratri, Diwali, Holi and more: what's on at every mandir, and when." },
        { at: 5.0, chip: "Languages", title: "In English, ગુજરાતી or हिन्दी", body: "Choose your language from the menu." },
      ],
    },
    {
      kind: "night", type: "homescreen", dur: 8,
      title: "Keep Toran on your home screen",
      sub: "<b class='on'>iPhone:</b> tap Share, then <b class='on'>Add to Home Screen</b>.<br><b class='on'>Android:</b> tap ⋮, then <b class='on'>Add to Home screen</b>.",
      chimes: [1.6],
    },
    {
      kind: "night", type: "list", dur: 7.5,
      title: "Toran is",
      items: ["Free for every family", "No account and no adverts", "Nothing about you is tracked", "English · ગુજરાતી · हिन्दी"],
      first: 1.2, every: 0.85, titleY: 200, listY: 360,
    },
    {
      kind: "night", type: "end", dur: 6.5,
      title: "See what's on this week",
      url: "toran.org.uk", small: "Share it with your family group",
      urlAt: 1.6,
    },
  ],
};
