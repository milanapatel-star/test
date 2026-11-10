// The Toran Instagram Reel: about a minute, 1080 x 1920, made for sound on
// or off. render(t) draws the frame at t seconds, so frames can be
// rendered in any order and in parallel (render.mjs). Everything happens on
// the beat of the soundtrack (music.py, 120 BPM: a beat is 0.5 s, a bar
// 2 s), and every pop, whoosh, tap and chime is written to window.CUES so
// the music can place its sounds on the same frames.
//
// The screens are Toran's real pages (shots/, captured from a local copy
// of the site with the made-up Shree Sample Mandir, Anytown).

(function () {
  const M = window.MANIFEST;
  const SHOTS = "shots/";
  const stage = document.getElementById("stage");
  const DURATION = 60.5;

  // ---- maths ---------------------------------------------------------------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const r = (t, a, d) => clamp((t - a) / d);
  const eOut = (p) => 1 - Math.pow(1 - p, 3);
  const eExpo = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  const eIn = (p) => p * p * p;
  const eInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const eBack = (p) => {
    const c1 = 1.9, c3 = c1 + 1;
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  };
  // A seeded random, so every frame draws the same thing.
  const rand = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  const el = (tag, cls, parent, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  const css = (e, o) => Object.assign(e.style, o);
  // Position and motion in one call. x, y: the element's left/top in px.
  function put(e, { x, y, s = 1, sx, sy, rot = 0, rx = 0, ry = 0, o = 1, blur = 0, tx = 0, ty = 0 }) {
    if (x !== undefined) e.style.left = x + "px";
    if (y !== undefined) e.style.top = y + "px";
    const scale = sx !== undefined || sy !== undefined ? `scale(${sx ?? s},${sy ?? s})` : `scale(${s})`;
    e.style.transform = `translate(${tx}px,${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${rot}deg) ${scale}`;
    e.style.opacity = o;
    e.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : "none";
  }

  const CUES = [];
  const cue = (t, kind, extra) => CUES.push({ t: +t.toFixed(3), kind, ...(extra || {}) });

  // ---- shared pieces ------------------------------------------------------------
  const MARK = `<svg viewBox="0 0 48 48"><path class="bar" d="M9 13H39" stroke="#e9b552" stroke-width="3.6" stroke-linecap="round" fill="none"/><path class="stem" d="M24 13V37" stroke="#e9b552" stroke-width="3.6" stroke-linecap="round" fill="none"/><circle class="d" cx="13.2" cy="19.2" r="2.25" fill="#e9b552"/><circle class="d" cx="18.2" cy="21.4" r="2.25" fill="#e9b552"/><circle class="d" cx="29.8" cy="21.4" r="2.25" fill="#e9b552"/><circle class="d" cx="34.8" cy="19.2" r="2.25" fill="#e9b552"/></svg>`;
  const DIYA = `<svg viewBox="0 0 200 170" width="100%" height="100%">
    <defs><radialGradient id="fl" cx="50%" cy="70%" r="60%"><stop offset="0" stop-color="#fff8e1"/><stop offset=".45" stop-color="#f6c75a"/><stop offset="1" stop-color="#e08a1e"/></radialGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="rgba(246,199,90,.55)"/><stop offset="1" stop-color="rgba(246,199,90,0)"/></radialGradient></defs>
    <circle class="halo" cx="100" cy="66" r="80" fill="url(#halo)"/>
    <g class="flame" style="transform-origin:100px 96px"><path d="M100 26 C117 54 123 74 112 90 C107 98 93 98 88 90 C77 74 83 54 100 26Z" fill="url(#fl)"/><path d="M100 56 C107 69 108 80 103 87 C101 90 99 90 97 87 C92 80 93 69 100 56Z" fill="#fffdf2"/></g>
    <path d="M28 100 Q100 112 172 100 Q162 156 100 158 Q38 156 28 100Z" fill="#e9b552"/><path d="M28 100 Q100 112 172 100" stroke="#9a6f1c" stroke-width="3" fill="none"/>
    <ellipse cx="100" cy="101" rx="72" ry="8" fill="#b9862c" opacity=".55"/></svg>`;

  // Words that punch in one at a time. Returns the word spans.
  function kin(parent, html, { y, size = 110, cls = "", gap = 0.22, lh } = {}) {
    const box = el("div", `kin ${cls}`, parent);
    css(box, { top: y + "px", fontSize: size + "px", lineHeight: lh ?? 1.04 });
    // Words, emoji spans and line breaks, each word in its own span.
    const tokens = html.match(/<br>|<span[^>]*>[^<]*<\/span>|[^\s<]+/g) || [];
    box.innerHTML = tokens
      .map((w, i) => (w === "<br>" ? "<br>" : `${i && tokens[i - 1] !== "<br>" ? " " : ""}<span class="w">${w}</span>`))
      .join("");
    box.dataset.safe = "1";
    return { box, words: [...box.querySelectorAll(".w")] };
  }
  // Punch: in from big and blurred, with a little overshoot.
  function punch(e, t, at, { from = 1.45, dur = 0.34, blur = 16, y = 0 } = {}) {
    const p = r(t, at, dur);
    put(e, { s: lerp(from, 1, eBack(p)), o: r(t, at, 0.07), blur: (1 - eOut(p)) * blur, ty: (1 - eOut(p)) * y });
  }
  // Rise: up out of nothing.
  function rise(e, t, at, { dist = 90, dur = 0.42 } = {}) {
    const p = eExpo(r(t, at, dur));
    put(e, { ty: (1 - p) * dist, o: r(t, at, 0.12), blur: (1 - p) * 10 });
  }
  // Leave: up and blurred, faster at the end.
  function leave(e, t, at, { dur = 0.32, y = -260, s = 1.08 } = {}) {
    if (t < at) return false;
    const p = eIn(r(t, at, dur));
    const base = e.style.transform || "";
    e.style.transform = base + ` translate(0px,${y * p}px) scale(${lerp(1, s, p)})`;
    e.style.opacity = String((+e.style.opacity || 1) * (1 - p));
    e.style.filter = `blur(${(p * 22).toFixed(1)}px)`;
    return true;
  }
  // Cue a pop for each word as it lands.
  function popCues(words, at, gap, f = 900) {
    words.forEach((_, i) => cue(at + i * gap, "pop", { f: f + i * 60, g: 0.45 }));
  }

  // A phone with Toran's screens, in 3D.
  function makePhone(parent, w, shots) {
    const wrap = el("div", "phone3d", parent);
    const k = w / 390;
    const SB = 47; // the phone's status bar, in CSS px
    const sh = (664 + SB) * k;
    const ph = el("div", "phone", wrap);
    const screen = el("div", "screen", ph);
    css(screen, { width: w + "px", height: sh + "px" });
    el("div", "island", screen);
    const bar = el("div", "statusbar", screen, `<b>9:41</b><span>●●●● ▲ ▮</span>`);
    css(bar, { height: SB * k + "px", fontSize: 15 * k + "px", padding: `0 ${30 * k}px` });
    const page = el("div", "page", screen);
    css(page, { position: "absolute", left: 0, top: SB * k + "px", width: w + "px", height: 664 * k + "px", overflow: "hidden" });
    const imgs = {};
    for (const s of shots) {
      const m = M[s];
      if (!m) throw new Error(`No shot ${s}`);
      const img = el("img", "", page);
      img.src = SHOTS + m.file;
      css(img, { width: w + "px", height: m.height * k + "px", opacity: 0 });
      imgs[s] = img;
    }
    const tab = el("div", "tabover", page);
    const glare = el("div", "glare", screen);
    const ripple = el("div", "ripple", screen);
    const api = {
      wrap, ph, screen, k, w, h: sh + 34, W: w + 34,
      // Show shots by weight: [[name, opacity, scrollY(css px)], ...]
      show(list, tabFrom) {
        for (const s of shots) imgs[s].style.opacity = 0;
        for (const [s, o, sy = 0] of list) {
          imgs[s].style.opacity = o;
          imgs[s].style.transform = `translateY(${-sy * k}px)`;
        }
        if (tabFrom) {
          const m = M[tabFrom];
          css(tab, { display: "block", height: 84 * k + "px", backgroundImage: `url(${SHOTS + m.file})`, backgroundSize: `${w}px ${m.height * k}px`, backgroundPosition: "bottom" });
        } else tab.style.display = "none";
      },
      glare(p) {
        glare.style.transform = `translateX(${lerp(-110, 110, p)}%)`;
        glare.style.opacity = p > 0 && p < 1 ? 1 : 0;
      },
      tap(t, at, x, y) {
        const p = r(t, at, 0.5);
        css(ripple, { left: x * k + "px", top: (y + SB) * k + "px", opacity: p > 0 && p < 1 ? String(1 - p) : "0", transform: `scale(${lerp(0.3, 1.5, eOut(p))})` });
      },
    };
    return api;
  }
  const target = (shot, name) => {
    const b = M[shot]?.targets?.[name];
    if (!b) throw new Error(`No target ${name} in ${shot}`);
    return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  };

  function card(parent, { day, num, t1, t2, t3 }) {
    const c = el("div", "card", parent);
    c.innerHTML = `<div class="date"><span>${day}</span><b>${num}</b></div><div><div class="t1">${t1}</div><div class="t2">${t2}</div>${t3 ? `<div class="t3">${t3}</div>` : ""}</div>`;
    c.dataset.safe = "1";
    return c;
  }

  // ---- layers ------------------------------------------------------------------------
  const bg = el("div", "layer bg", stage);
  const glowA = el("div", "glow gold", bg);
  const glowB = el("div", "glow blue", bg);
  const creamBg = el("div", "layer cream", stage);
  const cam = el("div", "layer", stage);
  const vignette = el("div", "layer vignette", stage);
  const grain = el("canvas", "", stage);
  grain.id = "grain";
  grain.width = 360;
  grain.height = 640;
  const gctx = grain.getContext("2d");
  const gimg = gctx.createImageData(360, 640);
  const flash = el("div", "layer flash", stage);

  const scenes = [];
  function scene(from, to, build) {
    const root = el("div", "scene", cam);
    const draw = build(root, from, to);
    scenes.push({ from, to, root, draw });
  }

  // =====================================================================================
  // 1. The hook (0-4 s): the forwards, then the punchline.
  scene(0, 4.05, (root) => {
    const msgs = [
      { html: "<small>↪ Forwarded many times</small>🪔🪔 GARBA NIGHT!! 🪔🪔", x: 60, y: 300, rot: -5, at: 0.0 },
      { html: "Is aarti at 7 or 7.30??", x: 520, y: 470, rot: 4, at: 0.25, me: true },
      { html: "<small>↪ Forwarded</small>poster_final_v3.jpg", x: 90, y: 1430, rot: 3, at: 0.5 },
      { html: "Which hall is it in?", x: 540, y: 1560, rot: -4, at: 0.75, me: true },
      { html: "<small>↪ Forwarded many times</small>Is this this year's? 🤔", x: 520, y: 1290, rot: 6, at: 1.0 },
      { html: "Anyone going tonight??", x: 70, y: 600, rot: -3, at: 1.25, me: true },
    ];
    const bubbles = msgs.map((m) => {
      const b = el("div", "bubble" + (m.me ? " me" : ""), root, m.html);
      cue(m.at, "pop", { f: 700 + m.at * 300, g: 0.35, pan: m.x > 400 ? 0.5 : -0.5 });
      return { b, ...m };
    });
    const pov = el("div", "abs", root, `<span class="pill goldfill">POV</span>`);
    css(pov, { left: 0, right: 0, top: "720px", textAlign: "center" });
    cue(0.5, "snap");
    const l1 = kin(root, "you find out about<br>the garba night", { y: 840, size: 92 });
    const l1At = [0.75, 0.9, 1.05, 1.2, 1.5, 1.65, 1.8];
    l1At.forEach((a, i) => cue(a, "pop", { f: 900 + i * 50, g: 0.4 }));
    const l2 = kin(root, "the day", { y: 1090, size: 120, cls: "muted" });
    const l3 = kin(root, `AFTER <span class="em">😭</span>`, { y: 1215, size: 180, cls: "gold" });
    cue(2.5, "snap");
    cue(3.0, "hit");
    return (t) => {
      bubbles.forEach(({ b, x, y, rot, at }, i) => {
        const p = r(t, at, 0.35);
        const drift = Math.sin(t * 1.3 + i) * 8;
        const suck = eIn(r(t, 3.55, 0.45));
        put(b, {
          x: lerp(x, 540 - 200, suck), y: lerp(y + drift, 1000, suck),
          s: lerp(0.4, 1, eBack(p)) * lerp(1, 0.2, suck), rot: rot * (1 - suck),
          o: Math.min(r(t, at, 0.08), lerp(0.42, 0, suck)) * (t > 2.4 ? 0.7 : 1), blur: 2 + suck * 20,
        });
      });
      punch(pov.firstChild, t, 0.5);
      l1.words.forEach((w, i) => punch(w, t, l1At[i], { from: 1.3, blur: 10 }));
      punch(l2.words[0], t, 2.5, { from: 1.4 });
      punch(l2.words[1], t, 2.5, { from: 1.4 });
      // AFTER slams in, then shakes.
      const shake = t > 3.0 && t < 3.5 ? Math.sin(t * 90) * 14 * (1 - r(t, 3.0, 0.5)) : 0;
      l3.words.forEach((w, i) => {
        punch(w, t, 3.0 + i * 0.25, { from: 2.2, dur: 0.3, blur: 24 });
        w.style.transform += ` translateX(${shake}px)`;
      });
      // Everything rushes into the middle for the drop.
      const suck = eIn(r(t, 3.6, 0.42));
      for (const e of [pov, l1.box, l2.box, l3.box]) {
        e.style.transform = `scale(${lerp(1, 0.25, suck)})`;
        e.style.transformOrigin = "540px 0";
        e.style.opacity = 1 - suck;
        e.style.filter = suck > 0.01 ? `blur(${suck * 18}px)` : "none";
      }
    };
  });
  cue(3.75, "whoosh", { d: 0.5, g: 0.6 });

  // =====================================================================================
  // 2. Toran (4-8 s): the mark builds, the name, the promise.
  scene(4, 8.05, (root) => {
    const mark = el("div", "abs mark", root, MARK);
    css(mark, { left: "340px", top: "500px", width: "400px", height: "400px" });
    const bar = mark.querySelector(".bar"), stem = mark.querySelector(".stem"), dots = [...mark.querySelectorAll(".d")];
    for (const p of [bar, stem]) {
      const L = p.getTotalLength();
      p.style.strokeDasharray = L;
      p.dataset.len = L;
    }
    const word = el("div", "abs word", root, "Toran");
    css(word, { left: 0, right: 0, top: "920px", textAlign: "center", fontSize: "150px", color: "#f6f4ef" });
    const a = kin(root, "Every mandir event<br>in the UK.", { y: 1170, size: 84 });
    const aAt = [5.5, 5.75, 6.0, 6.25, 6.4, 6.55];
    aAt.forEach((x, i) => cue(x, "pop", { f: 950 + i * 40, g: 0.4 }));
    const b = kin(root, "One place.", { y: 1390, size: 128, cls: "gold" });
    cue(7.0, "snap");
    dots.forEach((_, i) => cue(4.3 + i * 0.09, "pop", { f: 1200 + i * 180, g: 0.4 }));
    cue(7.75, "whoosh", { d: 0.45 });
    return (t) => {
      const pb = eOut(r(t, 4.0, 0.3)), ps = eOut(r(t, 4.18, 0.28));
      bar.style.strokeDashoffset = +bar.dataset.len * (1 - pb);
      stem.style.strokeDashoffset = +stem.dataset.len * (1 - ps);
      dots.forEach((d, i) => {
        const p = r(t, 4.3 + i * 0.09, 0.4);
        d.style.transform = `translateY(${(1 - eBack(p)) * -14}px)`;
        d.style.opacity = r(t, 4.3 + i * 0.09, 0.05);
        // The bells swing a little, as on a real toran.
        d.style.transformBox = "fill-box";
      });
      const breathe = 1 + 0.015 * Math.sin(t * 3);
      put(mark, { s: lerp(1.5, 1, eExpo(r(t, 4.0, 0.6))) * breathe * lerp(1, 0.92, eOut(r(t, 5.3, 0.6))), ty: lerp(0, -90, eOut(r(t, 5.3, 0.6))) });
      const pw = eExpo(r(t, 4.55, 0.7));
      put(word, { o: r(t, 4.55, 0.25), blur: (1 - pw) * 12, ty: lerp(0, -90, eOut(r(t, 5.3, 0.6))) });
      word.style.letterSpacing = lerp(0.6, 0.16, pw) + "em";
      a.words.forEach((w, i) => punch(w, t, aAt[i], { from: 1.3, blur: 10 }));
      b.words.forEach((w, i) => punch(w, t, 7.0 + i * 0.12, { from: 1.8, dur: 0.36 }));
      const out = eIn(r(t, 7.62, 0.38));
      root.style.transform = `translateY(${-320 * out}px)`;
      root.style.opacity = 1 - out;
      root.style.filter = out > 0.01 ? `blur(${out * 20}px)` : "none";
    };
  });

  // A heading pair used by the feature scenes: small line, big line.
  function heading(root, small, big, at, { y = 290, bigCls = "gold", size = 118 } = {}) {
    const a = kin(root, small, { y, size: 76 });
    const b = kin(root, big, { y: y + 84, size, cls: bigCls });
    popCues(a.words, at, 0.12, 900);
    cue(at + 0.5, "snap");
    return (t) => {
      a.words.forEach((w, i) => punch(w, t, at + i * 0.12, { from: 1.3, blur: 10 }));
      b.words.forEach((w, i) => punch(w, t, at + 0.5 + i * 0.14, { from: 1.6, dur: 0.36 }));
    };
  }
  // A phone flying in from below and swaying gently in 3D.
  function phoneIn(ph, t, at, { x, y, ry = -12, rx = 6, from = "below" }) {
    const p = eExpo(r(t, at, 0.75));
    const sway = Math.sin((t - at) * 0.9) * 3;
    const dx = from === "right" ? (1 - p) * 900 : from === "left" ? (1 - p) * -900 : 0;
    const dy = from === "below" ? (1 - p) * 1300 : 0;
    put(ph.wrap, { x, y, tx: dx, ty: dy, rx: rx * p + 10 * (1 - p), ry: (ry + sway) * p + (from === "right" ? 30 : from === "left" ? -30 : 0) * (1 - p), rot: (1 - p) * (from === "below" ? 8 : 0) });
    ph.glare(r(t, at + 0.3, 0.9));
  }
  function phoneOut(ph, t, at, { to = "left", dur = 0.42 } = {}) {
    if (t < at) return;
    const p = eIn(r(t, at, dur));
    const base = ph.wrap.style.transform;
    const dx = to === "left" ? -1100 : to === "right" ? 1100 : 0;
    const dy = to === "up" ? -1500 : to === "down" ? 1500 : 0;
    ph.wrap.style.transform = base + ` translate(${dx * p}px,${dy * p}px) rotate(${(to === "left" ? -10 : 10) * p}deg)`;
    ph.wrap.style.filter = `blur(${p * 16}px)`;
  }
  function exitScene(root, t, at, dur = 0.4) {
    const p = eIn(r(t, at, dur));
    root.style.opacity = 1 - p * 0.999;
    root.style.filter = p > 0.01 ? `blur(${p * 16}px)` : "none";
  }
  function exampleTag(root, dark) {
    const tag = el("div", "tag" + (dark ? " dark" : ""), root, "Example mandir and events");
    return tag;
  }

  // =====================================================================================
  // 3. What's on near you (8-15 s)
  scene(8, 15.05, (root) => {
    exampleTag(root);
    const head = heading(root, "What's on", `near you <span class="em">📍</span>`, 8.0);
    const ph = makePhone(root, 570, ["f-whatson-near-full", "f-whatson-near"]);
    const full = M["f-whatson-near-full"];
    const maxScroll = Math.max(0, full.height - 664);
    const c1 = card(root, { day: "SUN", num: "15", t1: "Kartik Purnima deepotsav", t2: "Shree Sample Mandir · 6:30pm", t3: "0.4 MILES AWAY" });
    const c2 = card(root, { day: "FRI", num: "13", t1: `Friday satsang <span class="em">🎶</span>`, t2: "Every Friday · 7:30pm", t3: "KATHA · KIRTAN · PRASAD" });
    cue(10.0, "whoosh", { d: 0.35, pan: -0.6, g: 0.6 });
    cue(10.5, "whoosh", { d: 0.35, pan: 0.6, g: 0.6 });
    const chips = ["Today", "This weekend", "Near me"].map((s, i) => {
      const c = el("div", "abs", root, `<span class="pill glass">${s}</span>`);
      cue(12.0 + i * 0.25, "pop", { f: 1100 + i * 120, g: 0.45 });
      return c;
    });
    cue(14.6, "whoosh", { d: 0.45 });
    return (t) => {
      head(t);
      phoneIn(ph, t, 8.2, { x: 238, y: 545 });
      const sy = maxScroll ? lerp(0, Math.min(maxScroll, 900), eInOut(r(t, 9.2, 4.2))) : 0;
      ph.show([["f-whatson-near-full", 1, sy]], "f-whatson-near");
      [c1, c2].forEach((c, i) => {
        const at = 10.0 + i * 0.5;
        const p = eBack(r(t, at, 0.45));
        const left = i === 0;
        put(c, { x: left ? 85 : 420, y: left ? 880 : 1070, tx: (1 - p) * (left ? 260 : -260), s: lerp(0.5, 1, p), o: r(t, at, 0.1), rot: (left ? -4 : 3) + Math.sin(t * 1.4 + i) * 0.8, blur: (1 - eOut(r(t, at, 0.3))) * 8 });
      });
      chips.forEach((c, i) => {
        const xs = [70, 330, 680];
        css(c, { top: [1430, 1500, 1440][i] + "px", left: xs[i] + "px", zIndex: 10 });
        punch(c.firstChild, t, 12.0 + i * 0.25, { from: 0.4, blur: 0 });
      });
      phoneOut(ph, t, 14.55, { to: "left" });
      exitScene(root, t, 14.6);
    };
  });

  // =====================================================================================
  // 4. Find your mandir (15-21 s)
  scene(15, 21.05, (root) => {
    exampleTag(root);
    const head = heading(root, "Find your", `mandir <span class="em">🛕</span>`, 15.0);
    const shots = ["f-map", "f-map-near", "f-map-card"].filter((s) => M[s]);
    const ph = makePhone(root, 570, shots);
    const pinShot = M["f-map-near"]?.targets?.lamp ? "f-map-near" : null;
    const pin = pinShot ? target("f-map-near", "lamp") : { x: 195, y: 360 };
    cue(17.6, "tap");
    const near = el("div", "abs", root, `<span class="pill glass"><span class="em">✨</span> Nearest first</span>`);
    const dist = el("div", "abs", root, `<span class="pill goldfill"><span class="em">📍</span> 3 miles away</span>`);
    cue(18.3, "pop", { f: 1200, g: 0.5 });
    cue(18.6, "pop", { f: 1400, g: 0.5 });
    cue(20.6, "whoosh", { d: 0.45 });
    return (t) => {
      head(t);
      phoneIn(ph, t, 15.2, { x: 238, y: 545, from: "right", ry: 12 });
      const list = [];
      if (shots.includes("f-map")) list.push(["f-map", 1 - r(t, 16.6, 0.3)]);
      if (shots.includes("f-map-near")) list.push(["f-map-near", r(t, 16.6, 0.3) * (1 - r(t, 17.8, 0.25))]);
      if (shots.includes("f-map-card")) list.push(["f-map-card", r(t, 17.8, 0.25)]);
      ph.show(list);
      ph.tap(t, 17.6, pin.x, pin.y);
      punch(near.firstChild, t, 18.3, { from: 0.3, blur: 0 });
      punch(dist.firstChild, t, 18.6, { from: 0.3, blur: 0 });
      css(near, { left: "50px", top: (1180 + Math.sin(t * 2) * 6) + "px", zIndex: 10 });
      css(dist, { left: "600px", top: (1330 + Math.sin(t * 2 + 1) * 6) + "px", zIndex: 10 });
      // A push in towards the map, on the beat.
      const zoom = 1 + 0.06 * eInOut(r(t, 16.0, 4.0));
      ph.ph.style.transform = `scale(${zoom})`;
      phoneOut(ph, t, 20.55, { to: "up" });
      exitScene(root, t, 20.6);
    };
  });

  // =====================================================================================
  // 5. Every festival (21-26 s): a slot machine of festivals, on the beat.
  scene(21, 26.05, (root) => {
    const top = kin(root, "Every festival.", { y: 330, size: 112 });
    popCues(top.words, 21.0, 0.2, 950);
    const fests = [
      ["Navratri", "💃"], ["Diwali", "🪔"], ["Holi", "🎨"], ["Janmashtami", "🦚"], ["Ram Navami", "🏹"], ["Maha Shivaratri", "🔱"],
    ];
    const slot = el("div", "slot", root);
    css(slot, { top: "640px" });
    const rows = fests.map(([n, e], i) => {
      const fs = Math.min(150, Math.floor(930 / (n.length * 0.6 + 1.4)));
      const row = el("div", "row" + (i % 2 ? " gold" : ""), slot, `<span style="font-size:${fs}px">${n}</span><span class="em" style="font-size:${Math.round(fs * 0.85)}px">${e}</span>`);
      return row;
    });
    const at0 = 21.5;
    fests.forEach((_, i) => cue(at0 + i * 0.5, "tap"));
    const bottom = kin(root, "Every date.<br>Every mandir.", { y: 1000, size: 96, cls: "" });
    const bAt = [24.6, 24.85, 25.1, 25.35];
    bAt.forEach((a, i) => cue(a, "pop", { f: 1000 + i * 70, g: 0.45 }));
    const ph = M["f-festivals"] ? makePhone(root, 470, ["f-festivals"]) : null;
    cue(25.65, "whoosh", { d: 0.4 });
    return (t) => {
      top.words.forEach((w, i) => punch(w, t, 21.0 + i * 0.2, { from: 1.4 }));
      // Each beat the next festival drops into place.
      const idx = clamp((t - at0) / 0.5, 0, fests.length - 1);
      rows.forEach((row, i) => {
        const d = i - idx;
        const p = clamp(d, -1.2, 1.2);
        const settle = i === Math.round(idx) ? eBack(r(t, at0 + i * 0.5, 0.3)) : 1;
        put(row, { ty: p * 260 * (i === Math.floor(idx + 0.5) ? (2 - settle) : 1), o: 1 - Math.min(1, Math.abs(d) * 1.1), blur: Math.min(14, Math.abs(d) * 18), s: 1 - Math.min(0.25, Math.abs(d) * 0.2) });
      });
      bottom.words.forEach((w, i) => punch(w, t, bAt[i], { from: 1.4 }));
      if (ph) {
        const p = eExpo(r(t, 23.8, 0.8));
        put(ph.wrap, { x: 287, y: lerp(1950, 1330, p), rx: 14, o: 1 });
        ph.show([["f-festivals", 1]]);
        ph.glare(r(t, 24.2, 0.9));
      }
      exitScene(root, t, 25.6);
    };
  });

  // =====================================================================================
  // 6. Seva in one tap (26-31 s)
  scene(26, 31.05, (root) => {
    exampleTag(root);
    const head = heading(root, "Volunteer", `in one tap <span class="em">🙏</span>`, 26.0);
    const shots = ["f-seva-top", "f-seva-taken"].filter((s) => M[s]);
    const ph = makePhone(root, 570, shots);
    const take = M["f-seva-top"]?.targets?.take ? target("f-seva-top", "take") : { x: 195, y: 400 };
    cue(28.0, "tap");
    cue(28.3, "ding");
    const badge = el("div", "abs", root, `<span class="pill goldfill" style="font-size:52px;padding:20px 40px">✓ Slot taken</span>`);
    const note = el("div", "abs", root, `<span class="pill inkfill" style="font-size:40px">No sign-up needed</span>`);
    css(note, { left: 0, right: 0, top: "1470px", textAlign: "center" });
    cue(29.0, "pop", { f: 1000, g: 0.4 });
    const parts = Array.from({ length: 22 }, (_, i) => {
      const p = el("div", "particle", root);
      if (i % 3 === 0) p.style.background = "#f6f4ef";
      return p;
    });
    cue(30.6, "whoosh", { d: 0.45 });
    return (t) => {
      head(t);
      phoneIn(ph, t, 26.2, { x: 238, y: 545, ry: -10 });
      if (shots.length === 2) ph.show([["f-seva-top", 1 - r(t, 28.2, 0.15)], ["f-seva-taken", r(t, 28.2, 0.15)]]);
      else ph.show([[shots[0], 1]]);
      ph.tap(t, 28.0, take.x, take.y);
      const bp = eBack(r(t, 28.35, 0.4));
      put(badge, { x: 290, y: 1290, s: lerp(0.2, 1, bp), o: r(t, 28.35, 0.08), rot: -3 });
      // A burst of gold from the badge.
      parts.forEach((p, i) => {
        const a = (i / parts.length) * Math.PI * 2 + rand(i) * 0.4;
        const q = eOut(r(t, 28.35, 0.9));
        const d = 120 + rand(i + 9) * 260;
        put(p, { x: 530 + Math.cos(a) * d * q, y: 1330 + Math.sin(a) * d * q + q * q * 120, o: q > 0 && q < 1 ? 1 - q : 0, s: 0.6 + rand(i + 3) });
      });
      punch(note.firstChild, t, 29.0, { from: 0.4, blur: 0 });
      phoneOut(ph, t, 30.55, { to: "right" });
      exitScene(root, t, 30.6);
    };
  });

  // =====================================================================================
  // 7. In your language (31-36 s): the page turns from English to Gujarati.
  scene(31, 36.05, (root) => {
    exampleTag(root);
    const title = kin(root, "In your language.", { y: 250, size: 96 });
    popCues(title.words, 31.0, 0.15, 950);
    const swap = el("div", "slot", root);
    css(swap, { top: "350px", height: "200px" });
    const lines = [
      `<span class="gold" style="font-size:118px">What's on</span>`,
      `<span class="gold gu" style="font-size:118px">કાર્યક્રમો</span>`,
      `<span class="gold hi" style="font-size:118px">कार्यक्रम</span>`,
    ].map((h) => {
      const row = el("div", "row", swap, h);
      css(row, { height: "200px" });
      return row;
    });
    [31.5, 32.5, 33.5].forEach((a) => cue(a, "whoosh", { d: 0.3, g: 0.5 }));
    const labels = el("div", "abs", root, `<span class="pill glass" style="font-size:40px">English · <span class="gu">ગુજરાતી</span> · <span class="hi">हिन्दी</span></span>`);
    css(labels, { left: 0, right: 0, top: "1560px", textAlign: "center" });
    cue(34.0, "pop", { f: 1300, g: 0.5 });
    const shotsEn = M["f-mandir-top"] ? "f-mandir-top" : null;
    const shotsGu = M["f-mandir-gu"] ? "f-mandir-gu" : null;
    const ph = makePhone(root, 500, [shotsEn, shotsGu].filter(Boolean));
    cue(32.5, "swish");
    cue(35.6, "whoosh", { d: 0.45 });
    return (t) => {
      title.words.forEach((w, i) => punch(w, t, 31.0 + i * 0.15, { from: 1.3, blur: 10 }));
      const idx = clamp((t - 31.5) / 1.0, 0, 2);
      lines.forEach((row, i) => {
        const at = 31.5 + i;
        const pin = eExpo(r(t, at, 0.4));
        const pout = i < 2 ? eIn(r(t, at + 1, 0.3)) : 0;
        put(row, { ty: (1 - pin) * 160 - pout * 160, o: Math.min(pin, 1 - pout), blur: (1 - pin) * 10 + pout * 10 });
      });
      void idx;
      phoneIn(ph, t, 31.2, { x: 273, y: 585, ry: 0, rx: 4 });
      // The phone turns over to show the same page in Gujarati.
      const flip = eInOut(r(t, 32.35, 0.5));
      const base = ph.wrap.style.transform;
      ph.wrap.style.transform = base + ` rotateY(${Math.sin(flip * Math.PI) * 70}deg)`;
      ph.show([[shotsEn, flip < 0.5 ? 1 : 0], [shotsGu, flip >= 0.5 ? 1 : 0]].filter((x) => x[0]));
      punch(labels.firstChild, t, 34.0, { from: 0.4, blur: 0 });
      exitScene(root, t, 35.6);
    };
  });

  // =====================================================================================
  // 8. Save it, share it (36-40 s)
  scene(36, 40.05, (root) => {
    exampleTag(root);
    const a = kin(root, `Save it <span class="em">📅</span>`, { y: 285, size: 108 });
    const b = kin(root, `Share it <span class="em">💬</span>`, { y: 410, size: 108, cls: "gold" });
    cue(36.0, "snap");
    cue(36.75, "snap");
    const shots = ["f-event-calendar", "f-event-share"].filter((s) => M[s]);
    const ph = makePhone(root, 500, shots);
    const share = el("div", "bubble me", root, `<small>Shared from Toran</small>Kartik Purnima deepotsav at Shree Sample Mandir, Sun 15 Nov, 6.30pm <span class="em">🪔</span><br><span style="color:#53bdeb">toran.org.uk/…</span>`);
    css(share, { fontSize: "34px", maxWidth: "620px" });
    share.dataset.safe = "1";
    cue(38.2, "pop", { f: 1500, g: 0.55 });
    cue(39.6, "whoosh", { d: 0.5, g: 0.7 });
    return (t) => {
      a.words.forEach((w, i) => punch(w, t, 36.0 + i * 0.1, { from: 1.6 }));
      b.words.forEach((w, i) => punch(w, t, 36.75 + i * 0.1, { from: 1.6 }));
      phoneIn(ph, t, 36.1, { x: 273, y: 590, ry: 10 });
      if (shots.length === 2) ph.show([["f-event-calendar", 1 - r(t, 37.4, 0.2)], ["f-event-share", r(t, 37.4, 0.2)]]);
      const p = eBack(r(t, 38.2, 0.45));
      put(share, { x: 300, y: 1250, s: lerp(0.3, 1, p), o: r(t, 38.2, 0.08), rot: -2 + Math.sin(t * 2) * 0.6, tx: (1 - p) * 120 });
    };
  });

  // =====================================================================================
  // 9. For mandirs (40-50 s): the cream breakdown. A poster becomes events.
  scene(39.6, 50.05, (root) => {
    const tag = exampleTag(root, true);
    const a = kin(root, "Run a mandir?", { y: 250, size: 110, cls: "ink" });
    popCues(a.words, 40.0, 0.25, 800);
    const b = kin(root, `Send the poster <span class="em">📸</span>`, { y: 380, size: 84, cls: "ink" });
    popCues(b.words, 41.6, 0.15, 900);
    const poster = el("div", "poster", root, `<img src="../engine/assets/patrika.jpg" width="520">`);
    const scan = el("div", "scan", poster);
    const sparks = [0, 1, 2].map(() => el("div", "spark", root, "✨"));
    const ai = el("div", "abs", root, `<span class="pill inkfill" style="font-size:46px"><span class="em">✨</span> AI reads every date</span>`);
    cue(42.0, "whoosh", { d: 0.4, g: 0.6 });
    cue(43.4, "swish");
    cue(44.0, "pop", { f: 1300, g: 0.5 });
    const events = [
      { day: "SAT", num: "6", t1: "Maha Shivaratri", t2: "6 March · 8pm" },
      { day: "THU", num: "15", t1: "Ram Navami", t2: "15 April · 12 noon" },
      { day: "TUE", num: "20", t1: "Hanuman Jayanti", t2: "20 April · 7pm" },
    ].map((e) => card(root, e));
    [45.5, 46.0, 46.5].forEach((x, i) => cue(x, "pop", { f: 1100 + i * 150, g: 0.55 }));
    const priv = el("div", "abs", root, `<span class="pill green" style="font-size:34px"><span class="em">🔒</span> Phone number left out</span>`);
    cue(47.0, "pop", { f: 1600, g: 0.45 });
    const c = kin(root, "You check. You publish.", { y: 1440, size: 68, cls: "ink" });
    popCues(c.words, 47.5, 0.2, 1000);
    cue(48.4, "ding");
    // The midnight comes back as a circle that grows from the middle.
    const iris = el("div", "abs", root);
    css(iris, { left: "540px", top: "960px", width: "10px", height: "10px", borderRadius: "50%", background: "#0b1426", marginLeft: "-5px", marginTop: "-5px" });
    cue(49.75, "whoosh", { d: 0.5, g: 0.8 });
    return (t) => {
      // The cream comes up from the bottom as the scene starts.
      creamBg.style.clipPath = `inset(${(1 - eInOut(r(t, 39.6, 0.45))) * 100}% 0 0 0)`;
      tag.style.opacity = r(t, 40.0, 0.3);
      a.words.forEach((w, i) => punch(w, t, 40.0 + i * 0.25, { from: 1.4 }));
      b.words.forEach((w, i) => punch(w, t, 41.6 + i * 0.15, { from: 1.3, blur: 8 }));
      const pp = eExpo(r(t, 41.9, 0.6));
      const shrink = eInOut(r(t, 45.0, 0.6));
      put(poster, { x: lerp(260, 60, shrink), y: lerp(540, 640, shrink), tx: (1 - pp) * -700, rot: lerp(-14, -4, pp), s: lerp(1, 0.78, shrink), o: r(t, 41.9, 0.1) });
      poster.style.transformOrigin = "0 0";
      const sp = r(t, 43.3, 1.5);
      css(scan, { top: 18 + eInOut(sp) * 640 + "px", opacity: sp > 0 && sp < 1 ? 1 : 0 });
      sparks.forEach((s, i) => {
        const q = r(t, 43.6 + i * 0.35, 0.6);
        css(s, { left: [340, 700, 480][i] + "px", top: [700, 900, 1120][i] + "px", fontSize: "70px", opacity: q > 0 && q < 1 ? String(Math.sin(q * Math.PI)) : "0", transform: `scale(${0.5 + q}) rotate(${q * 40}deg)` });
      });
      punch(ai.firstChild, t, 44.0, { from: 0.4, blur: 0 });
      css(ai, { left: 0, right: 0, top: "1330px", textAlign: "center", opacity: 1 - r(t, 45.0, 0.3), zIndex: 10 });
      events.forEach((e, i) => {
        const at = 45.5 + i * 0.5;
        const p = eBack(r(t, at, 0.5));
        put(e, { x: lerp(200, 470, eOut(r(t, at, 0.5))), y: 690 + i * 200, s: lerp(0.3, 1, p), o: r(t, at, 0.1), rot: (1 - p) * -10 });
        e.style.transformOrigin = "0 50%";
        css(e, { width: "530px" });
      });
      punch(priv.firstChild, t, 47.0, { from: 0.3, blur: 0 });
      css(priv, { left: "470px", top: "1300px" });
      c.words.forEach((w, i) => punch(w, t, 47.5 + i * 0.2, { from: 1.3, blur: 8 }));
      // The build: everything trembles a little, then the iris opens.
      const tremble = r(t, 48.0, 2.0);
      root.style.transform = `translate(${Math.sin(t * 70) * 3 * tremble}px, ${Math.cos(t * 60) * 3 * tremble}px) scale(${1 + 0.03 * eIn(tremble)})`;
      const ip = eIn(r(t, 49.55, 0.45));
      iris.style.transform = `scale(${ip * 460})`;
      if (t >= 50) creamBg.style.clipPath = "inset(100% 0 0 0)";
    };
  });

  // =====================================================================================
  // 10. The call to action (50-60.5 s)
  scene(50, DURATION, (root) => {
    const montage = ["f-home", "f-whatson-near", "f-map-card", "f-festivals", "f-seva-taken", "f-mandir-gu", "f-event-top", "f-my-top"].filter((s) => M[s]);
    const ph = makePhone(root, 470, montage);
    montage.forEach((_, i) => i && cue(50 + i * 0.5, "tap"));
    const l1 = kin(root, "No app to download.", { y: 260, size: 84 });
    const l2 = kin(root, "Free for families.", { y: 370, size: 84, cls: "gold" });
    popCues(l1.words, 50.5, 0.2, 950);
    popCues(l2.words, 51.5, 0.2, 1050);
    const logo = el("div", "abs", root, `<div class="mark" style="width:150px;height:150px;margin:0 auto">${MARK}</div><div class="word" style="font-size:96px;text-align:center;margin-top:10px">Toran</div>`);
    css(logo, { left: 0, right: 0, top: "430px" });
    const url = el("div", "abs", root);
    css(url, { left: 0, right: 0, top: "800px", textAlign: "center", fontSize: "118px", fontWeight: 800, letterSpacing: "-.02em" });
    const URL = "toran.org.uk";
    url.innerHTML = [...URL].map((ch, i) => `<span class="w${i >= 5 ? " gold" : ""}" style="display:inline-block">${ch}</span>`).join("");
    const letters = [...url.querySelectorAll(".w")];
    letters.forEach((_, i) => cue(54.0 + i * 0.06, "pop", { f: 1200 + i * 30, g: 0.3 }));
    const line = el("div", "abs", root);
    css(line, { left: "190px", top: "950px", width: "700px", height: "10px", borderRadius: "10px", background: "#e9b552", transformOrigin: "0 50%" });
    const soon = el("div", "abs", root, `<span class="pill goldfill" style="font-size:48px"><span class="em">🪔</span> Coming soon</span>`);
    css(soon, { left: 0, right: 0, top: "1040px", textAlign: "center" });
    cue(55.6, "snap");
    const send = kin(root, `Send this to your<br>family group <span class="em">💬</span>`, { y: 1210, size: 64 });
    popCues(send.words, 56.4, 0.12, 900);
    const diya = el("div", "abs", root, DIYA);
    css(diya, { left: "430px", top: "1410px", width: "220px", height: "187px" });
    cue(58.0, "ding");
    return (t) => {
      // The montage: a new screen on every beat.
      const i = clamp(Math.floor((t - 50) / 0.5), 0, montage.length - 1);
      ph.show(montage.map((s, k) => [s, k === i ? 1 : 0]));
      const pIn = eExpo(r(t, 50.0, 0.5));
      const pOut = eInOut(r(t, 53.6, 0.5));
      const bump = 1 + 0.035 * Math.exp(-((t - 50) % 0.5) / 0.08) * (t < 53.6 ? 1 : 0);
      put(ph.wrap, { x: 305, y: lerp(560, 2100, pOut), s: lerp(1.3, 1, pIn) * bump, rx: 6, ry: Math.sin(t * 2) * 8, o: 1, blur: pOut * 10 });
      ph.glare(r(t, 50.1, 0.8));
      [l1, l2].forEach((l, k) => {
        l.words.forEach((w, j) => punch(w, t, 50.5 + k + j * 0.2, { from: 1.4 }));
        l.box.style.opacity = String(1 - r(t, 53.6, 0.3));
      });
      // The address types itself, then the line draws under it.
      letters.forEach((w, k) => punch(w, t, 54.0 + k * 0.06, { from: 1.8, dur: 0.25, blur: 8 }));
      line.style.transform = `scaleX(${eOut(r(t, 54.8, 0.5))})`;
      const lp = eExpo(r(t, 54.4, 0.7));
      put(logo, { o: r(t, 54.4, 0.3), ty: (1 - lp) * 60, s: lerp(0.9, 1, lp) });
      punch(soon.firstChild, t, 55.6, { from: 0.4, blur: 0 });
      const glowPulse = 1 + 0.04 * Math.sin(t * 6);
      if (t > 56) soon.firstChild.style.transform += ` scale(${glowPulse})`;
      send.words.forEach((w, k) => rise(w, t, 56.4 + k * 0.12));
      const dp = eBack(r(t, 58.0, 0.6));
      put(diya, { s: lerp(0.2, 1, dp), o: r(t, 58.0, 0.1) });
      const flame = diya.querySelector(".flame");
      flame.style.transform = `scale(${1 + 0.06 * Math.sin(t * 13) + 0.03 * Math.sin(t * 29)}) rotate(${Math.sin(t * 7) * 3}deg)`;
    };
  });

  // =====================================================================================
  // Drops and transitions: flashes and the beat bump.
  const FLASHES = [[4.0, 0.9], [50.0, 0.7], [58.0, 0.35]];
  const GROOVE = [[4.0, 40.0], [50.0, 58.0]];

  function render(t) {
    // Background glows drift.
    put(glowA, { x: 200 + Math.sin(t * 0.4) * 160 - 550 + 540, y: 300 + Math.cos(t * 0.33) * 200 - 550 + 400, o: 1 });
    put(glowB, { x: -300 + Math.cos(t * 0.27) * 200, y: 1100 + Math.sin(t * 0.31) * 180, o: 1 });
    // Cream for the committee part.
    creamBg.style.display = t >= 39.5 && t < 50.05 ? "block" : "none";
    for (const s of scenes) {
      const on = t >= s.from && t < s.to;
      s.root.style.visibility = on ? "visible" : "hidden";
      if (on) {
        s.root.style.transform = "";
        s.root.style.opacity = 1;
        s.root.style.filter = "none";
        s.draw(t);
      }
    }
    // A small bump of the whole picture on every beat of the groove.
    let bump = 1;
    for (const [a, b] of GROOVE)
      if (t >= a && t < b) bump = 1 + 0.012 * Math.exp(-((t - a) % 0.5) / 0.1);
    cam.style.transform = `scale(${bump})`;
    let f = 0;
    for (const [a, g] of FLASHES) f = Math.max(f, t >= a ? g * Math.exp(-(t - a) / 0.09) : 0);
    flash.style.opacity = f;
    vignette.style.opacity = t >= 39.6 && t < 49.6 ? 0.25 : 1;
    // Film grain, a new pattern every frame.
    const seed = Math.floor(t * 60);
    const d = gimg.data;
    let x = seed * 9301 + 49297;
    for (let i = 0; i < d.length; i += 4) {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      const v = x & 255;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    gctx.putImageData(gimg, 0, 0);
  }

  // Framing checks: text must sit inside Instagram's safe area (clear of
  // the top bar, the caption at the bottom and the buttons on the right)
  // whenever it is showing.
  function runChecks() {
    const problems = [];
    for (let t = 0.2; t < DURATION; t += 0.25) {
      render(t);
      for (const s of scenes) {
        if (!(t >= s.from && t < s.to)) continue;
        for (const e of s.root.querySelectorAll("[data-safe]")) {
          const op = +getComputedStyle(e).opacity;
          if (op < 0.5) continue;
          const kids = e.classList.contains("kin") ? [...e.querySelectorAll(".w")] : [e];
          for (const k of kids) {
            if (+getComputedStyle(k).opacity < 0.9) continue;
            const b = k.getBoundingClientRect();
            if (b.width === 0) continue;
            const right = b.top > 1100 ? 960 : 1030;
            if (b.left < 30 || b.right > right || b.top < 215 || b.bottom > 1640)
              problems.push(`${t.toFixed(2)}s "${(k.textContent || "").slice(0, 30)}" at ${Math.round(b.left)},${Math.round(b.top)}-${Math.round(b.right)},${Math.round(b.bottom)}`);
          }
        }
      }
    }
    return [...new Set(problems)].slice(0, 60);
  }

  CUES.sort((a, b) => a.t - b.t);
  window.render = render;
  window.runChecks = runChecks;
  window.DURATION = DURATION;
  window.CUES = CUES;
  window.SCENES = scenes.map((s) => ({ from: s.from, to: s.to }));
})();
