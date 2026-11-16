// Toran pitch film: 52 s, portrait 1080x1920, for WhatsApp messages to mandir
// committees. render(t) draws the frame at time t, deterministically, so
// every frame can be screenshotted. CUES lists the sound effects (and where
// the music changes); music.py reads them from cues.json.
const W = 1080, H = 1920;
const stage = document.getElementById("stage");
const CUES = [];
const cue = (t, type, extra = {}) => CUES.push({ t: +t.toFixed(3), type, ...extra });
const DURATION = 52.5;

// ---- maths -------------------------------------------------------------------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, d) => clamp((t - a) / d);
const lerp = (a, b, k) => a + (b - a) * k;
const E = {
  expo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  out: (x) => 1 - Math.pow(1 - x, 4),
  inout: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  in: (x) => x * x * x,
  back: (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---- DOM helpers -------------------------------------------------------------
function el(tag, cls, parent = stage, html = "") {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  parent.appendChild(e);
  return e;
}
function at(e, x, y) { e.style.left = x + "px"; e.style.top = y + "px"; return e; }
function tf(e, { x = 0, y = 0, z = 0, s = 1, r = 0, rx = 0, ry = 0, o = 1, blur = 0 } = {}) {
  e.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${r}deg) scale(${s})`;
  e.style.opacity = clamp(o);
  e.style.filter = blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : "none";
}
// In at a, out at b: opacity, rise and blur.
function rv(t, a, b, { dy = 60, blur = 16, din = 0.9, dout = 0.45, sIn = 1, sOut = 1, outDy = -50 } = {}) {
  const i = E.expo(prog(t, a, din)), u = E.inout(prog(t, b, dout));
  return { o: i * (1 - u), y: (1 - i) * dy + u * outDy, blur: (1 - i) * blur + u * blur, s: lerp(sIn, 1, i) * lerp(1, sOut, u) };
}

const ICON = {
  chat: '<path d="M4 5.5h16v10.5H9l-5 4z"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5.5-5 4 3.5 3-2.5 4 4"/>',
  question: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.6"/><circle cx="12" cy="16.9" r=".4" fill="currentColor"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5s-1.1 5.9-3.5 8.5c-2.4-2.6-3.5-5.4-3.5-8.5s1.1-5.9 3.5-8.5z"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M15.5 14.3c2.4.1 4.2 1.7 4.8 4.4"/>',
  board: '<rect x="4" y="5" width="16" height="12" rx="2"/><path d="M8 21l4-4 4 4M8 9.5h8M8 12.5h5"/>',
  shield: '<path d="M12 3.5l7.5 3v5.5c0 4.4-3.2 7.6-7.5 8.8-4.3-1.2-7.5-4.4-7.5-8.8V6.5z"/><path d="M8.8 12.2l2.3 2.3 4.3-4.6"/>',
  eye: '<path d="M2.8 12s3.3-6.2 9.2-6.2 9.2 6.2 9.2 6.2-3.3 6.2-9.2 6.2S2.8 12 2.8 12z"/><circle cx="12" cy="12" r="2.8"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  heart: '<path d="M12 19.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/>',
  phone: '<rect x="6.5" y="2.8" width="11" height="18.4" rx="2.6"/><path d="M10.5 18h3"/>',
  share: '<circle cx="17.5" cy="6" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17.5" cy="18" r="2.5"/><path d="M8.7 10.8l6.6-3.6M8.7 13.2l6.6 3.6"/>',
  lang: '<path d="M4 6h9M8.5 4v2M6 6c.5 3 2.6 5.6 5.5 6.8M11 6c-.7 3.6-3 6.3-6.5 7.6"/><path d="M12.5 20l3.8-9 3.8 9M13.8 17h5"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l8.5-11h-6z"/>',
};
const icon = (n, w = 2.2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
const MARK = (id) => `<svg viewBox="0 0 48 48"><defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="9" y1="10" x2="39" y2="38"><stop offset="0" stop-color="#ffe2a0"/><stop offset=".6" stop-color="#f2b84b"/><stop offset="1" stop-color="#e08a2c"/></linearGradient></defs>
  <path class="bar" d="M9 13H39" stroke="url(#${id})" stroke-width="3.6" stroke-linecap="round" fill="none" pathLength="1"/>
  <path class="stem" d="M24 13V37" stroke="url(#${id})" stroke-width="3.6" stroke-linecap="round" fill="none" pathLength="1"/>
  <circle class="dot" cx="13.2" cy="19.2" r="2.25" fill="url(#${id})"/><circle class="dot" cx="18.2" cy="21.4" r="2.25" fill="url(#${id})"/>
  <circle class="dot" cx="29.8" cy="21.4" r="2.25" fill="url(#${id})"/><circle class="dot" cx="34.8" cy="19.2" r="2.25" fill="url(#${id})"/></svg>`;

// A headline: lines split by "|", *words* in gold.
function headline(parent, text, { cls = "", size } = {}) {
  const h = el("div", "h abs chk " + cls, parent);
  if (size) h.style.fontSize = size + "px";
  const words = [];
  let inAcc = false;
  text.split("|").forEach((line) => {
    const l = el("span", "line", h);
    line.trim().split(" ").forEach((w) => {
      let word = w;
      if (word.startsWith("*")) { inAcc = true; word = word.slice(1); }
      const on = inAcc;
      if (word.endsWith("*")) { inAcc = false; word = word.slice(0, -1); }
      const s = el("span", "w" + (on ? " accent" : ""), l);
      s.textContent = word;
      words.push(s);
    });
  });
  return { h, words };
}
function showWords(hl, t, a, b, gap = 0.075) {
  hl.words.forEach((w, k) => tf(w, rv(t, a + k * gap, b + k * 0.025, { dy: 80, blur: 20, din: 1.0 })));
}
function scene(a, b, build) {
  const root = el("div", "abs", stage);
  root.style.inset = "0";
  root.style.transformStyle = "preserve-3d";
  const s = { a, b, root, update: () => {} };
  build(s, root);
  SCENES.push(s);
  return s;
}
const SCENES = [];

// ---- background --------------------------------------------------------------
el("div", "bg");
const blobs = { lapis: el("div", "blob lapis"), gold: el("div", "blob gold"), violet: el("div", "blob violet") };
el("div", "grid");
const dustLayer = el("div", "abs");
dustLayer.style.inset = "0";
const dust = [];
{ const r = rng(7); for (let i = 0; i < 34; i++) dust.push({ e: el("div", "dust", dustLayer), x: r() * W, y: r() * H, sp: 30 + r() * 70, ph: r() * 6.28, sz: 0.4 + r() * 0.9 }); }
// [time, lapis xy + strength, gold, violet]
const BGK = [
  [0, [180, 520, 0.8], [900, 1500, 0.7], [540, 960, 0.3]],
  [4, [880, 420, 0.7], [160, 1620, 0.35], [540, 1050, 0.9]],
  [10, [540, 1500, 0.6], [540, 820, 1.2], [540, 900, 0.2]],
  [14, [120, 720, 0.9], [980, 1320, 0.7], [540, 900, 0.2]],
  [22, [900, 640, 0.9], [120, 1500, 0.7], [540, 900, 0.3]],
  [29, [180, 1600, 0.7], [820, 860, 0.9], [540, 900, 0.25]],
  [36, [540, 640, 0.6], [540, 1300, 0.7], [540, 960, 0.9]],
  [40, [540, 1060, 0.9], [540, 380, 0.6], [540, 900, 0.3]],
  [44, [200, 360, 0.7], [540, 980, 1.15], [540, 900, 0.3]],
];
function bgAt(t) {
  let k = 0;
  while (k < BGK.length - 1 && t >= BGK[k + 1][0]) k++;
  const cur = BGK[k], prev = BGK[Math.max(0, k - 1)];
  const m = k === 0 ? 1 : E.inout(prog(t, cur[0] - 0.2, 1.6));
  ["lapis", "gold", "violet"].forEach((n, i) => {
    const p = prev[i + 1], c = cur[i + 1];
    const x = lerp(p[0], c[0], m) + Math.sin(t * 0.35 + i * 2) * 60;
    const y = lerp(p[1], c[1], m) + Math.cos(t * 0.28 + i) * 70;
    const s = lerp(p[2], c[2], m);
    blobs[n].style.transform = `translate(${x - 540}px,${y - 540}px) scale(${0.85 + s * 0.25})`;
    blobs[n].style.opacity = clamp(s);
  });
}
const grain = el("div", "grain");
el("div", "vignette");
function dustAt(t) {
  const amt = Math.max(1 - prog(t, 3.5, 1), prog(t, 9.8, 0.6) * (1 - prog(t, 13.5, 1)), prog(t, 46.8, 1)) * 0.9 + 0.12;
  dust.forEach((d) => {
    const y = ((d.y - t * d.sp) % (H + 100) + H + 100) % (H + 100) - 50;
    const x = d.x + Math.sin(t * 0.6 + d.ph) * 26;
    const tw = 0.55 + 0.45 * Math.sin(t * 2.2 + d.ph * 3);
    d.e.style.transform = `translate(${x}px,${y}px) scale(${d.sz})`;
    d.e.style.opacity = amt * tw * 0.8;
  });
}

// A small brand line at the top once Toran has appeared.
const brand = el("div", "mini-brand abs chk", stage, MARK("mb") + "<span>TORAN</span>");
at(brand, 0, 104);
brand.style.width = W + "px";
brand.style.justifyContent = "center";

// ---- 1. Hook (0-4 s) ---------------------------------------------------------
scene(0, 4, (s, root) => {
  const eb = at(el("div", "eyebrow center abs chk", root, "For mandir committees"), 0, 760);
  eb.style.width = W + "px";
  const hl = headline(root, "Your mandir | does *so much.*", { cls: "center" });
  at(hl.h, 0, 850); hl.h.style.width = W + "px";
  cue(0.0, "start");
  cue(0.55, "type"); cue(1.25, "type");
  s.update = (t) => {
    tf(eb, rv(t, 0.25, 3.45, { dy: 30, blur: 10 }));
    showWords(hl, t, 0.55, 3.4, 0.18);
    hl.h.style.transform = `scale(${1 + t * 0.012})`;
  };
});

// ---- 2. Problem (4-10 s) -----------------------------------------------------
scene(4, 10, (s, root) => {
  const hl = headline(root, "But it gets | *lost.*", { cls: "center" });
  at(hl.h, 0, 300); hl.h.style.width = W + "px";
  const items = [
    { ico: "chat", c: "wa", t: "Mandir updates", m: "Fwd: Diwali programme", badge: true, x: 76, y: 640, r: -3 },
    { ico: "image", c: "amber", t: "Fwd: Fwd: poster.jpg", m: "Forwarded many times", x: 300, y: 830, r: 3.5 },
    { ico: "question", c: "grey", t: "Is the havan at 6 or 7?", m: "3 replies, no answer", x: 80, y: 1020, r: 2 },
    { ico: "globe", c: "blue", t: "Mandir website", m: "Last updated 2019", x: 330, y: 1210, r: -3.5 },
    { ico: "users", c: "wa", t: "Who's on seva Saturday?", m: "Seen by 89", x: 72, y: 1400, r: -2 },
    { ico: "board", c: "grey", t: "Notice board", m: "Only if you were there", x: 360, y: 1590, r: 3 },
  ];
  const chips = items.map((it, i) => {
    const c = at(el("div", "glass chip abs chk", root, `<div class="ico ${it.c}">${icon(it.ico)}</div><div>${it.t}<small>${it.m}</small></div>${it.badge ? '<div class="badge">47</div>' : ""}`), it.x, it.y);
    it.e = c; it.a = 4.55 + i * 0.5; it.from = it.x < 200 ? -1 : 1;
    cue(it.a + 0.05, "ping", { n: i });
    return it;
  });
  const badge = chips[0].e.querySelector(".badge");
  cue(7.6, "riser", { len: 2.4 });
  cue(8.95, "suck");
  s.update = (t) => {
    showWords(hl, t, 4.15, 8.75, 0.12);
    chips.forEach((it, i) => {
      const i_ = E.expo(prog(t, it.a, 0.9));
      const fl = Math.sin(t * 1.3 + i * 1.7) * 10;
      const k = E.in(prog(t, 8.95 + i * 0.05, 0.75));
      const box = it.e.getBoundingClientRect ? null : null;
      const cx = 540 - (it.x + 300), cy = 1120 - (it.y + 60);
      tf(it.e, {
        x: (1 - i_) * it.from * 260 + k * cx,
        y: fl + k * cy,
        r: it.r * (1 - k) + (1 - i_) * it.from * 8,
        ry: (1 - i_) * it.from * -30,
        s: lerp(0.9, 1, i_) * (1 - 0.85 * k),
        o: i_ * (1 - prog(t, 9.45, 0.3)),
        blur: (1 - i_) * 14 + k * 10,
      });
    });
    badge.textContent = Math.round(lerp(47, 412, E.inout(prog(t, 4.8, 3.8))));
  };
});

// ---- 3. Toran (10-14 s) ------------------------------------------------------
scene(10, 14, (s, root) => {
  const flash = el("div", "flash", root);
  const rings = [0, 1, 2].map(() => el("div", "ring", root));
  const halo = at(el("div", "halo", root), 140, 390);
  halo.style.width = halo.style.height = "800px";
  const mark = at(el("div", "mark abs", root, MARK("m1")), 380, 630);
  mark.style.width = mark.style.height = "320px";
  const bar = mark.querySelector(".bar"), stem = mark.querySelector(".stem"), dots = [...mark.querySelectorAll(".dot")];
  const word = at(el("div", "wordmark abs chk", root, "TORAN"), 0, 990);
  word.style.width = W + "px"; word.style.textAlign = "center";
  const tag = headline(root, "Every mandir's events. | *One place.*", { cls: "center", size: 84 });
  at(tag.h, 0, 1250); tag.h.style.width = W + "px";
  cue(10.0, "impact");
  cue(10.62, "sparkle");
  cue(11.2, "type"); cue(11.7, "type");
  s.update = (t) => {
    flash.style.opacity = (1 - E.out(prog(t, 10, 0.9))) * (t >= 10 ? 1 : 0) * (1 - prog(t, 13.4, 0.5));
    rings.forEach((r, i) => {
      const k = E.out(prog(t, 10 + i * 0.18, 1.6));
      const d = 120 + k * 1300;
      r.style.width = r.style.height = d + "px";
      r.style.left = 540 - d / 2 + "px"; r.style.top = 790 - d / 2 + "px";
      r.style.opacity = (1 - k) * 0.8 * (t >= 10 ? 1 : 0);
    });
    const outK = E.inout(prog(t, 13.45, 0.5));
    tf(halo, { s: 0.6 + 0.4 * E.expo(prog(t, 10.05, 1.2)) + Math.sin(t * 2) * 0.03, o: E.expo(prog(t, 10.05, 1)) * (1 - outK) });
    bar.style.strokeDasharray = "1 1"; stem.style.strokeDasharray = "1 1";
    bar.style.strokeDashoffset = 1 - E.inout(prog(t, 10.08, 0.55));
    stem.style.strokeDashoffset = 1 - E.inout(prog(t, 10.35, 0.5));
    dots.forEach((d, i) => {
      const k = E.back(prog(t, 10.62 + i * 0.09, 0.45));
      d.setAttribute("r", (2.25 * clamp(k, 0, 1.4)).toFixed(3));
    });
    tf(mark, { s: lerp(1.25, 1, E.expo(prog(t, 10, 1.6))) * (1 - 0.15 * outK), y: -outK * 60, o: 1 - outK, blur: outK * 14 });
    const wk = E.expo(prog(t, 10.7, 1.2));
    word.style.letterSpacing = lerp(0.7, 0.32, wk) + "em";
    tf(word, { o: wk * (1 - outK), blur: (1 - wk) * 18 + outK * 14, y: (1 - wk) * 30 - outK * 50 });
    showWords(tag, t, 11.2, 13.4, 0.1);
  };
});

// ---- 4. Send a poster (14-22 s) ----------------------------------------------
scene(14, 22, (s, root) => {
  const eb = at(el("div", "eyebrow abs chk", root, "01 · Add events"), 90, 200);
  const hl = headline(root, "Send a poster. | We do *the rest.*", { size: 104 });
  at(hl.h, 90, 262);
  const wrap = at(el("div", "abs", root), 90, 640);
  wrap.style.transformStyle = "preserve-3d";
  const poster = el("div", "poster", wrap, '<img src="assets/patrika.jpg">');
  poster.style.position = "relative";
  const beam = el("div", "beam", poster);
  const corners = [[-22, -22, "top left"], [470 - 38, -22, "top right"], [-22, 588 - 38, "bottom left"], [470 - 38, 588 - 38, "bottom right"]].map(([x, y, pos]) => {
    const c = at(el("div", "corner", wrap), x, y);
    const [v, h] = pos.split(" ");
    c.style["border-" + v + "-width"] = "6px"; c.style["border-" + h + "-width"] = "6px";
    c.style["border-" + v + "-" + h + "-radius"] = "22px";
    return c;
  });
  const reading = at(el("div", "glass pill abs chk", root, '<div class="spinner"></div><span>Reading the poster…</span>'), 90, 1290);
  const found = at(el("div", "glass pill abs chk", root, `<span style="color:var(--green);width:34px;height:34px;display:grid">${icon("check", 3)}</span><span>3 events found</span>`), 90, 1290);
  const spin = reading.querySelector(".spinner");
  const evs = [
    ["Mar", "6", "Maha Shivaratri", "Sat · 8pm"],
    ["Apr", "15", "Ram Navami", "Thu · 12pm"],
    ["Apr", "20", "Hanuman Jayanti", "Tue · 7pm"],
  ].map(([mo, d, tt, m], i) => {
    const e = at(el("div", "glass event abs chk", root, `<div class="date"><b>${mo.toUpperCase()}</b><i>${d}</i></div><div><div class="t">${tt}</div><div class="m">${m}</div></div>`), 480, 660 + i * 172);
    e.style.width = "560px";
    const live = el("div", "live", e, `<span style="width:22px;height:22px;display:grid">${icon("check", 3.4)}</span>LIVE`);
    live.style.position = "absolute"; live.style.right = "24px"; live.style.bottom = "24px";
    cue(17.3 + i * 0.26, "pop", { n: i });
    return { e, live, a: 17.3 + i * 0.26, l: 19.55 + i * 0.16 };
  });
  const btn = at(el("div", "btn abs chk", root, "Publish"), 680, 1190);
  const cursor = at(el("div", "cursor abs", root), 0, 0);
  const ripple = at(el("div", "ripple abs", root), 0, 0);
  const notes = [["shield", "Phone numbers left out"], ["eye", "You check, then it goes live"]].map(([ic, tx], i) =>
    at(el("div", "glass pill abs chk", root, `<span style="width:40px;height:40px;display:grid;color:var(--gold-2)">${icon(ic)}</span><span>${tx}</span>`), 90, 1470 + i * 120));
  cue(15.75, "scan", { len: 1.3 });
  cue(17.1, "chime");
  cue(19.3, "click");
  cue(19.55, "ding");
  cue(20.1, "pop", { n: 3 }); cue(20.35, "pop", { n: 4 });
  s.update = (t) => {
    const out = (o) => ({ ...o, o: o.o * (1 - prog(t, 21.45, 0.45)), blur: (o.blur || 0) + prog(t, 21.45, 0.45) * 14 });
    tf(eb, out(rv(t, 14.05, 99, { dy: 30, blur: 10 })));
    showWords(hl, t, 14.2, 21.4, 0.09);
    const pi = E.expo(prog(t, 14.8, 1.1));
    tf(wrap, out({ y: (1 - pi) * 260, ry: 16 - pi * 4 + Math.sin(t * 0.8) * 1.5, rx: 4, r: -2, s: lerp(0.85, 1, pi), o: pi, blur: (1 - pi) * 16 }));
    const sc = prog(t, 15.75, 1.3);
    beam.style.top = lerp(-150, 588, E.inout(sc)) + "px";
    beam.style.opacity = sc > 0 && sc < 1 ? 1 : 0;
    corners.forEach((c, i) => {
      const k = E.back(prog(t, 15.55 + i * 0.04, 0.5));
      c.style.opacity = clamp(k) * (1 - prog(t, 17.2, 0.4));
      c.style.transform = `scale(${lerp(1.6, 1, clamp(k))})`;
    });
    tf(reading, out({ ...rv(t, 15.7, 17.05, { dy: 20, blur: 8, dout: 0.25, outDy: -20 }) }));
    spin.style.transform = `rotate(${t * 520}deg)`;
    tf(found, out(rv(t, 17.1, 99, { dy: 20, blur: 8, sIn: 0.9 })));
    evs.forEach((ev, i) => {
      const k = E.expo(prog(t, ev.a, 0.85));
      tf(ev.e, out({ x: (1 - k) * -230, y: (1 - k) * (130 - i * 120), s: lerp(0.55, 1, k), o: clamp(k * 1.6), blur: (1 - k) * 12, ry: (1 - k) * 25 }));
      const lk = E.back(prog(t, ev.l, 0.45));
      ev.live.style.opacity = clamp(lk);
      ev.live.style.transform = `scale(${clamp(lk, 0, 1.3)})`;
    });
    const bi = rv(t, 18.35, 99, { dy: 30, blur: 10, sIn: 0.9 });
    const press = 1 - 0.06 * Math.sin(Math.PI * prog(t, 19.25, 0.22));
    tf(btn, out({ ...bi, s: bi.s * press }));
    const done = t >= 19.45;
    btn.textContent = done ? "Published" : "Publish";
    btn.style.background = done ? "linear-gradient(180deg,#3ddc84,#21b464)" : "";
    // The cursor glides in, taps Publish and leaves.
    const ck = E.inout(prog(t, 18.6, 0.65)), cl = E.inout(prog(t, 19.75, 0.6));
    const bx = 800, by = 1225;
    cursor.style.left = lerp(1000, bx, ck) + lerp(0, 160, cl) + "px";
    cursor.style.top = lerp(1640, by, ck) + lerp(0, 260, cl) + "px";
    cursor.style.opacity = clamp(prog(t, 18.6, 0.25)) * (1 - cl);
    cursor.style.transform = `scale(${1 - 0.18 * Math.sin(Math.PI * prog(t, 19.22, 0.22))})`;
    const rk = prog(t, 19.3, 0.55);
    ripple.style.left = bx - 35 + "px"; ripple.style.top = by - 35 + "px";
    ripple.style.transform = `scale(${1 + rk * 2.6})`;
    ripple.style.opacity = rk > 0 && rk < 1 ? 1 - rk : 0;
    notes.forEach((n, i) => tf(n, out(rv(t, 20.1 + i * 0.25, 99, { dy: 30, blur: 10 }))));
  };
});

// ---- 5. Families find you (22-29 s) ------------------------------------------
scene(22, 29, (s, root) => {
  const eb = at(el("div", "eyebrow abs chk", root, "02 · Get found"), 90, 200);
  const hl = headline(root, "Families | *find you.*", { size: 104 });
  at(hl.h, 90, 262);
  const phone = at(el("div", "phone abs", root), 90, 560);
  phone.style.transformStyle = "preserve-3d";
  const scr = el("div", "screen", phone);
  el("div", "island", scr);
  const head = el("div", "ui-head", scr, `<div class="ui-title">What's on</div><div class="ui-chip"><span style="width:28px;height:28px;display:grid">${icon("pin", 2.6)}</span>Near me · 5 miles</div>`);
  const map = el("div", "map", scr, `<svg width="100%" height="100%" viewBox="0 0 500 400" preserveAspectRatio="none" fill="none">
    <path d="M-10 300 C 120 260 180 320 300 250 S 460 120 520 140" stroke="rgba(122,144,255,.35)" stroke-width="10"/>
    <path d="M60 -10 C 90 120 60 220 140 410" stroke="rgba(255,255,255,.10)" stroke-width="8"/>
    <path d="M-10 120 L 520 60" stroke="rgba(255,255,255,.08)" stroke-width="6"/>
    <path d="M330 -10 C 300 120 380 240 360 410" stroke="rgba(255,255,255,.09)" stroke-width="7"/>
    <path d="M-10 200 L 520 230" stroke="rgba(255,255,255,.06)" stroke-width="4"/>
    <path d="M200 -10 L 240 410" stroke="rgba(255,255,255,.06)" stroke-width="4"/></svg>`);
  const me = el("div", "abs", map); me.style.cssText += "left:236px;top:206px;width:26px;height:26px;margin:-13px;border-radius:50%;background:#7a90ff;border:5px solid #fff;box-shadow:0 0 0 14px rgba(122,144,255,.25)";
  const pinSvg = `<svg viewBox="0 0 40 40"><path d="M20 38s-13-11-13-22a13 13 0 0 1 26 0c0 11-13 22-13 22z" fill="#f2b84b" stroke="#fff" stroke-width="2.5"/><circle cx="20" cy="16" r="5" fill="#1b1200"/></svg>`;
  const pins = [[150, 150], [330, 120], [390, 300]].map(([x, y], i) => {
    const p = el("div", "pin abs", map, pinSvg); p.style.left = x + "px"; p.style.top = y + "px";
    const pu = el("div", "pulse abs", map); pu.style.left = x + "px"; pu.style.top = y - 8 + "px";
    cue(23.35 + i * 0.2, "drop", { n: i });
    return { p, pu, a: 23.35 + i * 0.2 };
  });
  const rows = [
    ["Nov", "24", "Kartik Purnima", "Your mandir · 0.4 mi", true],
    ["Nov", "28", "Bhajan sandhya", "Your mandir · 0.4 mi", true],
    ["Dec", "6", "Youth satsang", "Nearby mandir · 2 mi", false],
  ].map(([mo, d, tt, m, mine], i) => {
    const r = el("div", "row", scr, `<div class="date"><b>${mo.toUpperCase()}</b><i>${d}</i></div><div><div class="t">${tt}</div><div class="m">${m}</div></div>`);
    r.style.top = 700 + i * 146 + "px";
    if (mine) { r.style.borderColor = "rgba(242,184,75,.55)"; r.style.background = "rgba(242,184,75,.08)"; }
    return { r, a: 23.9 + i * 0.16 };
  });
  const stat = at(el("div", "glass stat abs chk", root, `<div class="k">Views of your page</div><div class="v">0</div><div class="d">▲ this month</div>
    <svg width="350" height="70" viewBox="0 0 350 70" style="margin-top:14px;overflow:visible"><path class="sp" d="M0 60 C 40 58 60 50 90 52 S 140 36 170 40 S 220 22 250 26 S 310 8 350 4" stroke="#f2b84b" stroke-width="5" fill="none" stroke-linecap="round" pathLength="1"/></svg>`), 610, 1080);
  const sv = stat.querySelector(".v"), sp = stat.querySelector(".sp");
  const stat2 = at(el("div", "glass stat abs chk", root, `<div class="k">Added to calendars</div><div class="v">0</div>`), 610, 1440);
  const sv2 = stat2.querySelector(".v");
  const bub = at(el("div", "bubble abs chk", root, `<div class="who">Mum</div>Shall we go on Saturday? toran.org.uk/…`), 590, 640);
  const note = at(el("div", "note abs chk", root, "Example figures"), 0, 1800);
  note.style.width = W + "px"; note.style.textAlign = "center";
  cue(24.5, "count", { len: 1.9 });
  cue(26.7, "msg");
  s.update = (t) => {
    const outK = prog(t, 28.45, 0.45);
    const out = (o) => ({ ...o, o: o.o * (1 - outK), blur: (o.blur || 0) + outK * 14 });
    tf(eb, out(rv(t, 22.05, 99, { dy: 30, blur: 10 })));
    showWords(hl, t, 22.2, 28.4, 0.1);
    const pk = E.expo(prog(t, 22.5, 1.2));
    tf(phone, out({ y: (1 - pk) * 400 + Math.sin(t * 0.9) * 8, ry: lerp(-28, -9, pk) + Math.sin(t * 0.5) * 2, rx: lerp(14, 4, pk), s: lerp(0.86, 0.96, pk), o: pk, blur: (1 - pk) * 18 }));
    tf(head, { o: E.expo(prog(t, 22.9, 0.7)), y: (1 - E.expo(prog(t, 22.9, 0.7))) * 20 });
    tf(map, { o: E.expo(prog(t, 23.0, 0.7)), s: lerp(0.94, 1, E.expo(prog(t, 23.0, 0.9))) });
    const mk = E.back(prog(t, 23.1, 0.5));
    me.style.transform = `scale(${clamp(mk, 0, 1.3)})`;
    pins.forEach((p) => {
      const k = E.out(prog(t, p.a, 0.35)), b = E.back(prog(t, p.a + 0.25, 0.3));
      p.p.style.transform = `translateY(${(1 - k) * -120}px) scale(${t < p.a + 0.25 ? 1 : lerp(1.15, 1, clamp(b))})`;
      p.p.style.opacity = k;
      const pp = ((t - p.a - 0.3) % 1.4 + 1.4) % 1.4 / 1.4;
      p.pu.style.transform = `scale(${0.4 + pp * 2.2})`;
      p.pu.style.opacity = t > p.a + 0.3 ? (1 - pp) * 0.8 : 0;
    });
    rows.forEach((r) => tf(r.r, rv(t, r.a, 99, { dy: 40, blur: 8 })));
    tf(stat, out({ ...rv(t, 24.3, 99, { dy: 60, blur: 14, sIn: 0.9 }), x: Math.sin(t * 0.9) * 6, y: rv(t, 24.3, 99, { dy: 60 }).y + Math.cos(t * 0.8) * 8 }));
    sv.textContent = Math.round(1090 * E.out(prog(t, 24.5, 1.9))).toLocaleString("en-GB");
    sp.style.strokeDasharray = "1 1"; sp.style.strokeDashoffset = 1 - E.inout(prog(t, 24.6, 1.6));
    tf(stat2, out({ ...rv(t, 25.1, 99, { dy: 60, blur: 14, sIn: 0.9 }) }));
    sv2.textContent = Math.round(70 * E.out(prog(t, 25.2, 1.4)));
    const bk = E.back(prog(t, 26.7, 0.55));
    tf(bub, out({ o: clamp(bk * 2), s: lerp(0.6, 1, clamp(bk, 0, 1.1)), y: (1 - clamp(bk)) * 30 }));
    bub.style.transformOrigin = "0% 100%";
    tf(note, out(rv(t, 24.6, 99, { dy: 10, blur: 4 })));
  };
});

// ---- 6. Seva (29-36 s) -------------------------------------------------------
scene(29, 36, (s, root) => {
  const eb = at(el("div", "eyebrow abs chk", root, "03 · Seva rota"), 90, 200);
  const hl = headline(root, "Seva, | *sorted.*", { size: 104 });
  at(hl.h, 90, 262);
  const card = at(el("div", "glass rota abs chk", root, `<div class="t">Diwali · Lighting diyas</div><div class="m">Sat 7 Nov · 5pm–7pm · 6 volunteers</div>
    <div class="slots"></div><div class="bar"><i></i></div><div class="foot"><div class="count">0 of 6 taken</div><div class="status"></div></div>`), 90, 600);
  const slotsBox = card.querySelector(".slots"), barI = card.querySelector(".bar i"), count = card.querySelector(".count"), status = card.querySelector(".status");
  const people = ["AP", "RS", "NK", "MP", "JD", "SV"];
  const times = [30.35, 30.8, 31.2, 31.55, 31.85, 32.1];
  const slots = people.map((p, i) => {
    const sl = el("div", "slot", slotsBox);
    const f = el("div", "fill", sl, p);
    f.style.background = i % 2 ? "linear-gradient(140deg,#9fb0ff,#4a68ff)" : "linear-gradient(140deg,#ffe2a0,#f0a93a)";
    f.style.color = i % 2 ? "#fff" : "#1b1200";
    cue(times[i], "slot", { n: i });
    return f;
  });
  const sparks = [];
  { const r = rng(42); for (let i = 0; i < 22; i++) { const e = el("div", "spark abs", root); sparks.push({ e, a: r() * 6.28, d: 160 + r() * 260, s: 0.5 + r() }); } }
  const wa = at(el("div", "glass wa-card abs chk", root, `<div class="ico wa" style="width:84px;height:84px;border-radius:24px">${icon("share")}</div><div><div class="t">Send it to your volunteers' group</div><div class="m">One link. No sign-up needed.</div></div>`), 90, 1240);
  const bub = at(el("div", "bubble abs chk", root, `<div class="who">Seva team</div>Diwali diyas: 6 slots, take one at the link 🙏`.replace(" 🙏", "")), 90, 1480);
  cue(32.3, "chime");
  cue(32.85, "whoosh");
  s.update = (t) => {
    const outK = prog(t, 35.45, 0.45);
    const out = (o) => ({ ...o, o: o.o * (1 - outK), blur: (o.blur || 0) + outK * 14 });
    tf(eb, out(rv(t, 29.05, 99, { dy: 30, blur: 10 })));
    showWords(hl, t, 29.2, 35.4, 0.12);
    const ck = E.expo(prog(t, 29.55, 1.1));
    tf(card, out({ y: (1 - ck) * 220, s: lerp(0.9, 1, ck), o: ck, blur: (1 - ck) * 16, rx: (1 - ck) * 20 }));
    let n = 0;
    slots.forEach((f, i) => {
      const k = E.back(prog(t, times[i], 0.42));
      if (t >= times[i]) n++;
      f.style.transform = `scale(${clamp(k, 0, 1.25)})`;
      f.style.opacity = clamp(k * 3);
    });
    barI.style.width = (100 * lerp(0, 1, n / 6)) + "%";
    count.textContent = `${n} of 6 taken`;
    const full = t >= 32.3;
    status.textContent = full ? "Rota full" : `${6 - n} more needed`;
    status.style.background = full ? "rgba(61,220,132,.18)" : "rgba(242,184,75,.16)";
    status.style.color = full ? "var(--green)" : "var(--gold-2)";
    status.style.transform = `scale(${full ? lerp(1.25, 1, E.out(prog(t, 32.3, 0.4))) : 1})`;
    sparks.forEach((sp) => {
      const k = prog(t, 32.3, 1.1);
      const e = E.out(k);
      sp.e.style.left = 540 + Math.cos(sp.a) * sp.d * e + "px";
      sp.e.style.top = 960 + Math.sin(sp.a) * sp.d * e + k * k * 120 + "px";
      sp.e.style.opacity = k > 0 && k < 1 ? (1 - k) : 0;
      sp.e.style.transform = `scale(${sp.s})`;
    });
    tf(wa, out(rv(t, 32.85, 99, { dy: 60, blur: 12 })));
    const bk = E.back(prog(t, 33.3, 0.5));
    bub.style.transformOrigin = "0% 100%";
    tf(bub, out({ o: clamp(bk * 2), s: lerp(0.6, 1, clamp(bk, 0, 1.1)), y: (1 - clamp(bk)) * 30 }));
  };
});

// ---- 7. Languages (36-40 s) --------------------------------------------------
scene(36, 40, (s, root) => {
  const eb = at(el("div", "eyebrow center abs chk", root, "04 · In your language"), 0, 600);
  eb.style.width = W + "px";
  const words = [["What's on", ""], ["કાર્યક્રમો", "gu"], ["कार्यक्रम", "hi"]].map(([w, c]) => at(el("div", "bigword abs chk " + c, root, w), 0, 790));
  const langs = el("div", "langs abs", root);
  at(langs, 0, 1130);
  const pills = [["English", ""], ["ગુજરાતી", "gu"], ["हिन्दी", "hi"]].map(([w, c]) => el("div", "lang chk " + c, langs, w));
  const T = [36.25, 37.45, 38.6];
  cue(37.45, "whoosh", { soft: 1 }); cue(38.6, "whoosh", { soft: 1 });
  s.update = (t) => {
    const outK = prog(t, 39.55, 0.45);
    tf(eb, { ...rv(t, 36.05, 39.55, { dy: 30, blur: 10 }) });
    words.forEach((w, i) => {
      const a = T[i], b = i < 2 ? T[i + 1] - 0.1 : 39.55;
      const st = rv(t, a, b, { dy: 70, blur: 26, din: 0.8, dout: 0.35, sIn: 0.92, sOut: 1.06, outDy: -60 });
      tf(w, st);
    });
    const cur = t >= T[2] ? 2 : t >= T[1] ? 1 : 0;
    pills.forEach((p, i) => {
      const k = rv(t, 36.5 + i * 0.12, 39.55, { dy: 30, blur: 8 });
      tf(p, { ...k, s: i === cur ? 1.06 : 1 });
      p.style.background = i === cur ? "rgba(242,184,75,.18)" : "";
      p.style.borderColor = i === cur ? "rgba(242,184,75,.7)" : "";
      p.style.color = i === cur ? "var(--gold-2)" : "";
    });
    void outK;
  };
});

// ---- 8. It's real (40-44 s) --------------------------------------------------
scene(40, 44, (s, root) => {
  const eb = at(el("div", "eyebrow center abs chk", root, "Live now · toran.org.uk"), 0, 200);
  eb.style.width = W + "px";
  const hl = headline(root, "It's real. | *And it's free.*", { cls: "center", size: 108 });
  at(hl.h, 0, 262); hl.h.style.width = W + "px";
  const shots = [["f-map-card.jpg", -30, 700, 26, 0.84], ["pc-poster-read.jpg", 640, 700, -26, 0.84], ["f-whatson-near.jpg", 300, 600, 0, 1.04]];
  const devs = shots.map(([img, x, y, ry, sc], i) => {
    const d = at(el("div", "device abs", root), x, y);
    const scr = el("div", "screen", d, `<img src="assets/${img}" style="height:100%;object-fit:cover;object-position:top">`);
    el("div", "glare", scr);
    return { d, ry, sc, a: 40.5 + [0.15, 0.3, 0][i] };
  });
  const note = at(el("div", "note abs chk", root, "Example mandir and events"), 0, 1600);
  note.style.width = W + "px"; note.style.textAlign = "center";
  cue(40.5, "whoosh");
  s.update = (t) => {
    const outK = prog(t, 43.55, 0.45);
    const out = (o) => ({ ...o, o: o.o * (1 - outK), blur: (o.blur || 0) + outK * 14 });
    tf(eb, out(rv(t, 40.05, 99, { dy: 30, blur: 10 })));
    showWords(hl, t, 40.2, 43.5, 0.11);
    devs.forEach((d) => {
      const k = E.expo(prog(t, d.a, 1.2));
      tf(d.d, out({ y: (1 - k) * 500 + Math.sin(t * 0.8 + d.ry) * 8, ry: d.ry * lerp(1.6, 1, k) + Math.sin(t * 0.4) * 3, s: d.sc * lerp(0.9, 1, k) * (1 + (t - 40) * 0.006), o: k, blur: (1 - k) * 16 }));
    });
    tf(note, out(rv(t, 41.6, 99, { dy: 10, blur: 4 })));
  };
});

// ---- 9. Why + call to action (44-52.5 s) -------------------------------------
scene(44, DURATION, (s, root) => {
  const eb = at(el("div", "eyebrow center abs chk", root, "Why mandirs use Toran"), 0, 400);
  eb.style.width = W + "px";
  const tiles = [
    ["heart", "amber", "Free for every mandir"],
    ["phone", "blue", "No app to install"],
    ["share", "wa", "Made to share on WhatsApp"],
    ["lang", "grey", "English, ગુજરાતી, हिन्दी"],
  ].map(([ic, c, tx], i) => {
    const e = at(el("div", "glass tile abs chk", root, `<div class="ico ${c}">${icon(ic)}</div><div class="t gu">${tx}</div>`), i % 2 ? 552 : 90, i < 2 ? 520 : 844);
    cue(44.3 + i * 0.25, "pop", { n: i });
    return { e, a: 44.3 + i * 0.25 };
  });
  const halo = at(el("div", "halo", root), 290, 320);
  halo.style.width = halo.style.height = "500px";
  const mark = at(el("div", "mark abs", root, MARK("m2")), 460, 470);
  mark.style.width = mark.style.height = "160px";
  const hl = headline(root, "Put your mandir | *on Toran.*", { cls: "center", size: 112 });
  at(hl.h, 0, 720); hl.h.style.width = W + "px";
  const btn = at(el("div", "btn gold abs chk", root, '<span>Join free at toran.org.uk</span><div class="shine"></div>'), 0, 1040);
  btn.style.left = "50%"; btn.style.marginLeft = "-370px"; btn.style.width = "740px"; btn.style.textAlign = "center"; btn.style.fontSize = "44px"; btn.style.padding = "36px 0";
  const shine = btn.querySelector(".shine");
  const foot = at(el("div", "note abs chk", root, "Free for every mandir in the UK"), 0, 1250);
  foot.style.width = W + "px"; foot.style.textAlign = "center"; foot.style.fontSize = "30px";
  cue(47.2, "riser", { len: 0.8 });
  cue(48.0, "impact", { soft: 1 });
  cue(48.9, "shimmer"); cue(50.7, "shimmer");
  s.update = (t) => {
    tf(eb, rv(t, 44.05, 46.9, { dy: 30, blur: 10 }));
    tiles.forEach((ti, i) => {
      const k = rv(t, ti.a, 46.9 + i * 0.05, { dy: 80, blur: 16, sIn: 0.85, sOut: 0.9 });
      tf(ti.e, { ...k, ry: (1 - E.expo(prog(t, ti.a, 0.9))) * (i % 2 ? -20 : 20) });
    });
    const mk = E.expo(prog(t, 47.9, 1.2));
    tf(halo, { o: mk * (0.8 + Math.sin(t * 2) * 0.15), s: lerp(0.5, 1, mk) });
    tf(mark, { o: mk, s: lerp(1.4, 1, mk), blur: (1 - mk) * 12, y: (1 - mk) * -30 });
    showWords(hl, t, 48.1, 99, 0.1);
    const bk = E.expo(prog(t, 48.7, 1.0));
    tf(btn, { o: bk, y: (1 - bk) * 50, s: lerp(0.9, 1, bk) * (1 + Math.sin(Math.max(0, t - 49.7) * 3.2) * 0.012), blur: (1 - bk) * 10 });
    const sh = [48.9, 50.7].map((a) => prog(t, a, 0.9)).find((k) => k > 0 && k < 1);
    shine.style.left = (sh === undefined ? -200 : lerp(-160, 820, E.inout(sh))) + "px";
    tf(foot, rv(t, 49.3, 99, { dy: 20, blur: 6 }));
  };
});

// ---- render -------------------------------------------------------------------
function render(t) {
  bgAt(t);
  dustAt(t);
  const f = Math.floor(t * 30);
  const r = rng(f + 1);
  grain.style.transform = `translate(${Math.floor(r() * 160)}px,${Math.floor(r() * 160)}px)`;
  const bk = E.expo(prog(t, 14.1, 1)) * (1 - prog(t, 43.5, 0.5));
  brand.style.opacity = bk * 0.85;
  brand.style.transform = `translateY(${(1 - E.expo(prog(t, 14.1, 1))) * -20}px)`;
  for (const s of SCENES) {
    const on = t >= s.a - 0.02 && t <= s.b + 0.05;
    s.root.style.display = on ? "block" : "none";
    if (on) s.update(t);
  }
}

// Framing: every visible text block and card sits inside the frame.
function runChecks() {
  const out = [];
  for (let t = 0.1; t < DURATION; t += 0.25) {
    render(t);
    document.querySelectorAll(".chk").forEach((e) => {
      if (e.offsetParent === null && getComputedStyle(e).position !== "absolute") return;
      let op = 1, n = e;
      while (n && n !== document.body) { const cs = getComputedStyle(n); if (cs.display === "none") { op = 0; break; } op *= +cs.opacity; n = n.parentElement; }
      if (op < 0.6) return;
      const r = e.getBoundingClientRect();
      if (r.width === 0) return;
      // Measure the text itself for full-width centred blocks.
      let left = r.left, right = r.right;
      if (r.width > W * 0.8) {
        const parts = e.querySelectorAll(".w").length ? [...e.querySelectorAll(".w")] : [e];
        left = 1e9; right = -1e9;
        for (const pEl of parts) {
          const range = document.createRange(); range.selectNodeContents(pEl);
          for (const rr of range.getClientRects()) { if (rr.width) { left = Math.min(left, rr.left); right = Math.max(right, rr.right); } }
        }
      }
      if (left < 34 || right > W - 34 || r.top < 70 || r.bottom > H - 60) {
        out.push(`${t.toFixed(2)}s ${e.className.split(" ").slice(0, 3).join(".")} "${e.textContent.trim().slice(0, 30)}" at ${Math.round(left)},${Math.round(r.top)}-${Math.round(right)},${Math.round(r.bottom)}`);
      }
    });
  }
  return [...new Set(out)].slice(0, 40);
}

window.render = render;
window.runChecks = runChecks;
window.DURATION = DURATION;
window.CUES = CUES.sort((a, b) => a.t - b.t);
window.SCENES = SCENES.map((s) => [s.a, s.b]);
render(0);
