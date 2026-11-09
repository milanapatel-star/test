// The welcome-pack film engine. A film (films/*.js) is a list of scenes;
// render(t) draws the frame at t seconds, so frames can be rendered in any
// order and in parallel (render.mjs). Product scenes show Toran's real
// screens (shots/, captured by capture/*.spec.ts) in a laptop or phone,
// with a pointer or finger, zooms, scrolling, typing and highlights placed
// from the positions recorded with each screenshot (shots/manifest.js).
// The soundtrack reads window.CUES, so a click is heard on its frame.

(function () {
  const M = window.MANIFEST;
  const FILM = window.FILM;
  const SHOTS = "../shots/";
  const stage = document.getElementById("stage");

  // ---- maths -------------------------------------------------------------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);
  const ramp = (t, a, d) => clamp((t - a) / d);
  const el = (tag, cls, parent, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  const css = (e, o) => Object.assign(e.style, o);

  const CUES = [];
  const cue = (t, kind, extra) => CUES.push({ t: +t.toFixed(3), kind, ...(extra || {}) });

  // ---- layout ------------------------------------------------------------
  const GEO = {
    laptop: { k: 0.84, vw: 1440, vh: 900, x: 640, y: 129, chrome: 46, panel: 110 },
    phone: { k: 1.8, vw: 390, vh: 664, x: 175, y: 600, pad: 14, panel: 90 },
  };

  // ---- shared pieces ------------------------------------------------------
  const MARK = `<svg viewBox="0 0 48 48" width="100%" height="100%"><path d="M9 13H39M24 13V37" stroke="#d9a441" stroke-width="3.6" stroke-linecap="round" fill="none"/><circle cx="13.2" cy="19.2" r="2.25" fill="#d9a441"/><circle cx="18.2" cy="21.4" r="2.25" fill="#d9a441"/><circle cx="29.8" cy="21.4" r="2.25" fill="#d9a441"/><circle cx="34.8" cy="19.2" r="2.25" fill="#d9a441"/></svg>`;
  const TILE = `<svg viewBox="0 0 48 48" width="100%" height="100%"><rect width="48" height="48" rx="11" fill="#14213d"/><path d="M9 13H39M24 13V37" stroke="#d9a441" stroke-width="3.6" stroke-linecap="round" fill="none"/><circle cx="13.2" cy="19.2" r="2.25" fill="#d9a441"/><circle cx="18.2" cy="21.4" r="2.25" fill="#d9a441"/><circle cx="29.8" cy="21.4" r="2.25" fill="#d9a441"/><circle cx="34.8" cy="19.2" r="2.25" fill="#d9a441"/></svg>`;
  const DIYA = `<svg viewBox="0 0 200 160" width="100%" height="100%">
    <defs><radialGradient id="fl" cx="50%" cy="70%" r="60%"><stop offset="0" stop-color="#fff8e1"/><stop offset=".45" stop-color="#f6c75a"/><stop offset="1" stop-color="#e08a1e"/></radialGradient></defs>
    <g class="flame" style="transform-origin:100px 96px"><path d="M100 30 C116 56 122 74 112 90 C107 98 93 98 88 90 C78 74 84 56 100 30Z" fill="url(#fl)"/><path d="M100 58 C107 70 108 80 103 87 C101 90 99 90 97 87 C92 80 93 70 100 58Z" fill="#fffdf2"/></g>
    <path d="M30 100 Q100 110 170 100 Q160 150 100 152 Q40 150 30 100Z" fill="#d9a441"/><path d="M30 100 Q100 110 170 100" stroke="#8a6418" stroke-width="3" fill="none"/>
    <ellipse cx="100" cy="100" rx="70" ry="8" fill="#b9862c" opacity=".55"/></svg>`;
  const ARROW = `<svg viewBox="0 0 24 24" width="34" height="34"><path d="M4 2.5 L4 19.5 L8.6 15.4 L11.6 22 L14.6 20.7 L11.7 14.2 L18 14.2 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

  // Words that rise out of a mask, one after another.
  function rising(text, cls) {
    return text
      .split(" ")
      .map((w) => `<span class="wm"><span class="wi ${cls || ""}">${w}</span></span>`)
      .join(" ");
  }
  function riseWords(root, t, start, every = 0.07, dur = 0.7) {
    root.querySelectorAll(".wi").forEach((w, i) => {
      const p = easeOut(ramp(t, start + i * every, dur));
      w.style.transform = `translateY(${(1 - p) * 110}%)`;
    });
  }

  // ---- scenes --------------------------------------------------------------
  let at = 0;
  const scenes = FILM.scenes.map((s) => {
    const scene = { ...s, start: at, end: at + s.dur };
    at += s.dur;
    return scene;
  });
  const DURATION = at + 0.6;

  function resolveBox(ref) {
    if (!ref) return null;
    if (Array.isArray(ref) && typeof ref[0] === "number")
      return { x: ref[0], y: ref[1], w: ref[2] || 0, h: ref[3] || 0 };
    const [shot, target] = ref;
    const m = M[shot];
    if (!m) throw new Error(`No shot ${shot}`);
    const b = m.targets[target];
    if (!b) throw new Error(`No target ${target} in ${shot}`);
    return b;
  }

  // A value that moves between keyframes ({at, dur, ...}), easing.
  function track(keys, t, get, initial) {
    let cur = initial;
    for (const k of keys) {
      const v = get(k);
      if (t < k.at) break;
      const d = k.dur ?? 0.9;
      const p = d ? ease(ramp(t, k.at, d)) : 1;
      cur = typeof v === "number" ? lerp(cur, v, p) : v.map((x, i) => lerp(cur[i], x, p));
      if (p < 1) return cur;
    }
    return cur;
  }

  const isFull = (ref, g) => Array.isArray(ref) && typeof ref[0] === "string" && M[ref[0]].height > g.vh + 2;
  // The screenshot a scene shows at time t.
  const shotIn = (s, t) => {
    let cur = (s.shots || [])[0]?.shot;
    for (const kf of s.shots || []) if (t >= kf.at) cur = kf.shot;
    return cur;
  };
  // Whether a target scrolls with the page: a named target on a full-page
  // shot, or a raw position while a full-page shot is showing.
  const onFull = (s, ref, t, g) =>
    isFull(ref, g) || (Array.isArray(ref) && typeof ref[0] === "number" && (M[shotIn(s, t)]?.height ?? 0) > g.vh + 2);

  function buildProduct(s) {
    const g = GEO[s.kind];
    const root = el("div", "scene", stage);
    el("div", "bg-cream", root);
    el("div", "dots", root);
    const k = g.k;
    const sw = g.vw * k, sh = g.vh * k;

    // Device
    let screen, deviceBox;
    if (s.kind === "laptop") {
      const win = el("div", "laptop", root);
      css(win, { left: g.x + "px", top: g.y + "px", width: sw + "px", height: sh + g.chrome + "px" });
      el("div", "chrome", win, `<i></i><i></i><i></i><div class="url">🔒 <b>toran.org.uk</b>${s.url || ""}</div>`);
      screen = el("div", "screen", win);
      css(screen, { width: sw + "px", height: sh + "px" });
      deviceBox = win;
      s.ox = g.x; s.oy = g.y + g.chrome;
    } else {
      const ph = el("div", "phone", root);
      css(ph, { left: g.x + "px", top: g.y + "px", width: sw + 2 * g.pad + "px", height: sh + 2 * g.pad + "px" });
      el("div", "island", ph);
      screen = el("div", "screen", ph);
      css(screen, { width: sw + "px", height: sh + "px" });
      deviceBox = ph;
      s.ox = g.x + g.pad; s.oy = g.y + g.pad;
    }
    const zoom = el("div", "zoom", screen);
    const scroll = el("div", "scroll", zoom);
    s.dom = { root, screen, zoom, scroll, deviceBox, shots: {}, rings: [], typers: [], callouts: [] };

    const names = new Set((s.shots || []).map((x) => x.shot));
    (s.types || []).forEach((x) => names.add(x.shot));
    for (const n of names) {
      const m = M[n];
      if (!m) throw new Error(`No shot ${n}`);
      const img = el("img", "shot", scroll);
      img.src = SHOTS + m.file;
      css(img, { width: m.width * k + "px", height: m.height * k + "px" });
      if (m.height <= g.vh + 2) s.dom.fixed = [...(s.dom.fixed || []), img];
      s.dom.shots[n] = img;
    }
    for (const r of s.rings || []) {
      const d = el("div", "ring", scroll);
      const b = resolveBox(r.on), pad = r.pad ?? 8;
      css(d, { left: (b.x - pad) * k + "px", top: (b.y - pad) * k + "px", width: (b.w + 2 * pad) * k + "px", height: (b.h + 2 * pad) * k + "px", borderRadius: (r.radius ?? 14) + "px" });
      s.dom.rings.push({ d, r });
      if (!onFull(s, r.on, r.at, g)) s.dom.fixed = [...(s.dom.fixed || []), d];
    }
    for (const ty of s.types || []) {
      const b = resolveBox(ty.on), m = M[ty.shot], pad = ty.pad ?? 2;
      // A text box clears its placeholder at the first key, so for typing
      // that appears line by line, blank the box (inside its border) first.
      let blank = null;
      if (ty.mode === "lines") {
        blank = el("div", "abs", scroll);
        const i = ty.inset ?? 3;
        css(blank, { left: (b.x + i) * k + "px", top: (b.y + i) * k + "px", width: (b.w - 2 * i) * k + "px", height: (b.h - 2 * i) * k + "px", background: ty.blank ?? "#fff", borderRadius: "8px", opacity: 0 });
      }
      const d = el("div", "typer", scroll);
      css(d, {
        left: (b.x - pad) * k + "px", top: (b.y - pad) * k + "px", width: (b.w + 2 * pad) * k + "px", height: (b.h + 2 * pad) * k + "px",
        backgroundImage: `url(${SHOTS + m.file})`, backgroundSize: `${m.width * k}px ${m.height * k}px`,
        backgroundPosition: `${-(b.x - pad) * k}px ${-(b.y - pad) * k}px`, clipPath: "inset(0 100% 0 0)",
      });
      const caret = el("div", "caret", scroll);
      s.dom.typers.push({ d, ty, b, caret, blank });
      if (!isFull(ty.on, g)) s.dom.fixed = [...(s.dom.fixed || []), d, caret, ...(blank ? [blank] : [])];
      cue(s.start + ty.at, "type", { dur: ty.dur });
    }
    if (s.kind === "phone") {
      const tb = el("div", "tabbar", screen);
      const m = M.tabbar;
      css(tb, { height: 80 * k + "px", backgroundImage: `url(${SHOTS + m.file})`, backgroundSize: `${m.width * k}px ${m.height * k}px` });
      s.dom.tabbar = tb;
    }
    for (const o of s.overlays || []) {
      const d = el("div", "abs", screen, o.html);
      css(d, { left: o.x + "px", top: o.y + "px", width: (o.w || 300) + "px", opacity: 0 });
      o.d = d;
    }
    for (const c of s.callouts || []) {
      const d = el("div", "callout", root, c.text);
      s.dom.callouts.push({ d, c });
    }

    // Captions
    const panel = el("div", "panel", root);
    s.dom.panel = panel;
    s.caps = (s.captions || [{ at: 0, chip: s.chip, title: s.title, body: s.body }]).map((c, i) => {
      const d = el("div", "cap", panel);
      const chip = c.chip ? `<span class="chip">${c.n ? `<span class="n">${c.n}</span>` : ""}${c.chip}</span>` : "";
      d.innerHTML = `${chip}<div class="t">${c.title}</div>${c.body ? `<div class="b">${c.body}</div>` : ""}`;
      return { d, c, next: null, i };
    });
    s.caps.forEach((c, i) => (c.next = s.caps[i + 1]?.c.at ?? 1e9));

    el("div", "brand", root, `<span style="width:30px;height:30px;display:inline-block">${TILE}</span>TORAN`);
    el("div", "example", root, "Example mandir and events");

    // Pointer / finger
    if (s.kind === "laptop") {
      s.dom.cursor = el("div", "cursor", root, ARROW);
    }
    s.dom.touch = el("div", "touch", root);
    s.dom.ripple = el("div", "ripple", root);

    // Cues
    (s.cursor || []).forEach((c) => c.click && cue(s.start + c.at + (c.dur ?? 0.8), "click"));
    (s.taps || []).forEach((c) => cue(s.start + c.at, "tap"));
    (s.chimes || []).forEach((c) => cue(s.start + c, "chime"));
    (s.shots || []).forEach((c, i) => i > 0 && !c.quiet && cue(s.start + c.at, "swap"));
    return s;
  }

  function scrollAt(s, t) {
    return track(s.scroll || [], t, (k) => (typeof k.y === "number" ? k.y : centerY(k.y, s)), s.scroll?.[0]?.y ?? 0);
  }
  function centerY(ref, s) {
    const b = resolveBox(ref);
    const g = GEO[s.kind];
    return Math.max(0, b.y + b.h / 2 - g.vh / 2);
  }
  function camAt(s, t) {
    const g = GEO[s.kind];
    const def = [1, g.vw / 2, g.vh / 2];
    return track(s.cam || [], t, (k) => {
      if (!k.on) return [k.s ?? 1, g.vw / 2, g.vh / 2];
      const b = resolveBox(k.on);
      const full = typeof k.on[0] === "string" && M[k.on[0]].height > g.vh + 2;
      const y = full ? b.y - scrollAt(s, k.at + (k.dur ?? 0.9)) : b.y;
      return [k.s ?? 1.6, b.x + b.w / 2 + (k.dx || 0), y + b.h / 2 + (k.dy || 0)];
    }, def);
  }
  // Where a point on the page (CSS px, page coordinates) is on the stage.
  function toStage(s, x, y, t, cam, sc) {
    const g = GEO[s.kind], k = g.k;
    const [z, fx, fy] = cam;
    const W = g.vw * k, H = g.vh * k;
    let tx = W / 2 - fx * k * z, ty = H / 2 - fy * k * z;
    tx = clamp(tx, W - W * z, 0); ty = clamp(ty, H - H * z, 0);
    return [s.ox + tx + x * k * z, s.oy + ty + (y - sc) * k * z, tx, ty];
  }

  function drawProduct(s, t) {
    const g = GEO[s.kind], k = g.k, D = s.dom;
    // device entrance
    const enter = s.enter ? easeOut(ramp(t, 0, 0.9)) : 1;
    css(D.deviceBox, { transform: `translateY(${(1 - enter) * 60}px) scale(${0.96 + 0.04 * enter})`, opacity: 0.2 + 0.8 * enter });

    // shots: cross-fade in order
    const keys = s.shots || [];
    let cur = keys[0]?.shot, prev = null, mix = 1;
    for (const kf of keys) {
      if (t >= kf.at) {
        if (kf.shot !== cur) { prev = cur; cur = kf.shot; }
        mix = kf.at === 0 ? 1 : ease(ramp(t, kf.at, kf.fade ?? 0.35));
      }
    }
    for (const [n, img] of Object.entries(D.shots)) {
      img.style.opacity = n === cur ? mix : n === prev ? 1 : 0;
      img.style.zIndex = n === cur ? 2 : 1;
    }
    const curM = M[cur];
    if (D.tabbar) D.tabbar.style.opacity = curM && curM.height > g.vh + 2 ? 1 : 0;

    const sc = scrollAt(s, t);
    D.scroll.style.transform = `translateY(${-sc * k}px)`;
    for (const f of D.fixed || []) f.style.translate = `0 ${sc * k}px`;
    const cam = camAt(s, t);
    const [, , tx, ty] = toStage(s, 0, 0, t, cam, sc);
    D.zoom.style.transform = `translate(${tx}px,${ty}px) scale(${cam[0]})`;

    // rings
    for (const { d, r } of D.rings) {
      const a = ramp(t, r.at, 0.3) * (1 - ramp(t, r.at + (r.dur ?? 2), 0.3));
      const pulse = 1 + 0.04 * Math.sin((t - r.at) * 6);
      css(d, { opacity: a, transform: `scale(${a ? pulse : 1})`, zIndex: 3 });
    }
    // typing
    for (const { d, ty, b, caret, blank } of D.typers) {
      const p = clamp((t - ty.at) / ty.dur);
      const vis = t >= ty.at - 0.01 && t < (ty.until ?? 1e9);
      d.style.opacity = vis ? 1 : 0;
      d.style.zIndex = 3;
      if (blank) css(blank, { opacity: vis ? 1 : 0, zIndex: 3 });
      const pad = ty.pad ?? 2;
      if (ty.mode === "lines") {
        const lh = ty.lineH ?? 24;
        const lines = Math.ceil((b.h + 2 * pad) / lh);
        const shown = Math.floor(p * lines + (p > 0 ? 1 : 0)) * lh;
        const frac = (p * lines) % 1;
        d.style.clipPath = `polygon(0 0,100% 0,100% ${Math.max(0, shown - lh) * k}px,${frac * 100}% ${Math.max(0, shown - lh) * k}px,${frac * 100}% ${shown * k}px,0 ${shown * k}px)`;
        css(caret, { opacity: 0 });
      } else {
        const x0 = ty.textX ?? 14;
        const wpx = (b.w + 2 * pad) * k;
        const reveal = Math.min(wpx, (x0 + p * ((ty.textW ?? b.w - x0))) * k);
        d.style.clipPath = `inset(0 ${wpx - (p >= 1 ? wpx : reveal)}px 0 0)`;
        const blink = Math.floor(t * 2.2) % 2 === 0 && p < 1 + 0.6;
        css(caret, { left: (b.x - pad) * k + reveal + "px", top: (b.y + b.h * 0.25) * k + "px", height: b.h * 0.5 * k + "px", opacity: vis && t < ty.at + ty.dur + 0.8 && blink ? 1 : 0, zIndex: 4 });
      }
    }
    // overlays
    for (const o of s.overlays || []) {
      const a = ramp(t, o.at, 0.35) * (1 - ramp(t, o.at + (o.dur ?? 2), 0.3));
      css(o.d, { opacity: a, transform: `translateY(${(1 - easeOut(ramp(t, o.at, 0.45))) * 40}px)`, zIndex: 6 });
    }

    // pointer (laptop)
    if (D.cursor) {
      const cs = s.cursor || [];
      const pt = (c) => {
        const b = resolveBox(c.to);
        return [b.x + (c.fx ?? 0.5) * b.w, b.y + (c.fy ?? 0.5) * b.h];
      };
      const start = cs.length ? [g.vw * 0.92, g.vh * 0.95] : [0, 0];
      const p = track(cs, t, (c) => pt(c), start);
      const [X, Y] = toStage(s, p[0], p[1], t, cam, (typeof cs[0]?.to?.[0] === "string" && M[cs[0].to[0]].height > g.vh + 2) ? sc : 0);
      let press = 1, rip = -1;
      for (const c of cs) if (c.click) {
        const tc = c.at + (c.dur ?? 0.8);
        if (t >= tc - 0.05 && t < tc + 0.25) press = 0.82;
        if (t >= tc && t < tc + 0.6) rip = (t - tc) / 0.6;
      }
      const vis = cs.length ? ramp(t, cs[0].at - 0.4, 0.3) * (1 - ramp(t, s.dur - 0.3, 0.3)) : 0;
      // keep the pointer inside the window
      const W = g.vw * k, H = g.vh * k;
      const cx = clamp(X, s.ox + 12, s.ox + W - 30), cy = clamp(Y, s.oy + 12, s.oy + H - 30);
      css(D.cursor, { opacity: vis, transform: `translate(${cx - 6}px,${cy - 3}px) scale(${press})` });
      css(D.ripple, { opacity: rip >= 0 ? 1 - rip : 0, left: X + "px", top: Y + "px", transform: `scale(${0.4 + rip * 1.1})` });
    } else {
      // finger (phone): appears on the button, presses, ripples
      let shown = false;
      for (const c of s.taps || []) {
        const b = resolveBox(c.on);
        const full = onFull(s, c.on, c.at, g);
        const [X, Y] = toStage(s, b.x + b.w / 2, b.y + b.h / 2, t, cam, full ? sc : 0);
        if (t >= c.at - 0.45 && t < c.at + 0.6) {
          shown = true;
          const a = ramp(t, c.at - 0.45, 0.25) * (1 - ramp(t, c.at + 0.3, 0.3));
          const press = t >= c.at - 0.05 && t < c.at + 0.18 ? 0.8 : 1;
          css(D.touch, { opacity: a, left: X + "px", top: Y + "px", transform: `scale(${press})` });
          const rip = t >= c.at ? (t - c.at) / 0.6 : -1;
          css(D.ripple, { opacity: rip >= 0 ? 1 - rip : 0, left: X + "px", top: Y + "px", transform: `scale(${0.4 + Math.max(0, rip) * 1.2})` });
        }
      }
      if (!shown) { D.touch.style.opacity = 0; D.ripple.style.opacity = 0; }
    }
    // callouts
    for (const { d, c } of D.callouts) {
      const b = resolveBox(c.on);
      const full = onFull(s, c.on, c.at, g);
      const [X, Y] = toStage(s, b.x + b.w * (c.fx ?? 0.5), b.y, t, cam, full ? sc : 0);
      const a = ramp(t, c.at, 0.3) * (1 - ramp(t, c.at + (c.dur ?? 2), 0.3));
      css(d, { opacity: a, left: X - 30 + "px", top: Y - 76 + (1 - easeOut(ramp(t, c.at, 0.4))) * 14 + "px" });
    }
    // captions
    for (const c of s.caps) {
      const a = easeOut(ramp(t, c.c.at + (c.i === 0 ? 0.15 : 0), 0.6)) * (1 - ramp(t, c.next - 0.35, 0.35));
      const rise = (1 - easeOut(ramp(t, c.c.at + (c.i === 0 ? 0.15 : 0), 0.7))) * 30;
      css(c.d, { opacity: a, transform: `translateY(${rise}px)` });
    }
  }

  // ---- night scenes ----------------------------------------------------------
  function nightBase(root, opts = {}) {
    el("div", "bg-night", root);
    if (opts.rangoli !== false) {
      const r = el("img", "abs", root);
      r.src = "assets/rangoli-night.svg";
      css(r, { width: "980px", height: "980px", left: "50px", top: "470px", opacity: 0.16 });
    }
    const glow = el("div", "glow", root);
    css(glow, { width: "1400px", height: "1400px", left: "-160px", top: "120px", opacity: 0.55 });
    el("div", "garland", root);
    return glow;
  }

  function buildNight(s) {
    const root = el("div", "scene", stage);
    s.dom = { root };
    s.glow = nightBase(root, s);
    s.dom.brand = el("div", "brand light", root, `<span style="width:30px;height:30px;display:inline-block">${MARK}</span>TORAN`);
    if (s.type === "title" || s.type === "end") {
      const col = el("div", "ncol", root);
      const diya = el("div", "", col, DIYA);
      css(diya, { width: "210px", height: "168px" });
      s.dom.diya = diya;
      if (s.chip) s.dom.chip = el("div", "", col, `<span class="nchip">${s.chip}</span>`);
      const ti = el("div", "d on", col, rising(s.title));
      css(ti, { fontSize: (s.size || 92) + "px", width: "900px" });
      s.dom.title = ti;
      if (s.sub) {
        s.dom.sub = el("div", "nm", col, s.sub);
        css(s.dom.sub, { fontSize: "38px", lineHeight: 1.4, maxWidth: "860px" });
      }
      if (s.url) s.dom.url = el("div", "", col, `<span class="url-pill">${s.url}</span>`);
      if (s.small) {
        s.dom.small = el("div", "nm", col, s.small);
        css(s.dom.small, { fontSize: "30px" });
      }
    }
    if (s.type === "lines") {
      s.dom.lines = (s.lines || []).map((ln) => {
        const d = el("div", "abs d " + (ln.cls || "on"), root, rising(ln.text));
        css(d, { left: (ln.x ?? 90) + "px", top: ln.y + "px", width: (ln.w ?? 900) + "px", fontSize: (ln.size ?? 64) + "px", textAlign: ln.align || "left" });
        return { d, ln };
      });
      s.dom.cards = (s.cards || []).map((c) => {
        let d;
        if (c.type === "poster") {
          d = el("div", "card", root, `<img src="assets/patrika.jpg" style="width:100%;display:block">`);
          css(d, { width: (c.w || 380) + "px" });
        } else if (c.type === "chat") {
          d = el("div", "card chat", root, `<div class="hd"><div class="av">🙏</div><div><div class="n1">Mandir Seva Group</div><div class="s1">412 members</div></div><div class="badge">${c.unread || 412}</div></div>
            <div class="bub"><b>Kirit</b>Jai Shree Krishna 🙏 Good morning all</div>
            <div class="bub"><b>Hema</b>📷 Photo</div>
            <div class="bub"><b>Raj</b>Anyone know what time the havan is?</div>
            <div class="bub"><b>Nita</b>🌸🌸🌸</div>`);
        }
        css(d, { left: c.x + "px", top: c.y + "px" });
        return { d, c };
      });
    }
    if (s.type === "list" || s.type === "steps") {
      if (s.title) {
        const ti = el("div", "abs d on", root, rising(s.title));
        css(ti, { left: "90px", width: "900px", textAlign: "center", top: (s.titleY ?? (s.type === "list" ? 600 : 470)) + "px", fontSize: "84px" });
        s.dom.title = ti;
      }
      const list = el("div", "list", root);
      css(list, { top: (s.listY ?? (s.type === "list" ? 810 : 680)) + "px", alignItems: "flex-start", left: s.type === "steps" ? "110px" : "170px", width: s.type === "steps" ? "880px" : "820px", gap: s.type === "steps" ? "44px" : "34px" });
      s.dom.items = s.items.map((it, i) =>
        s.type === "steps"
          ? el("div", "step", list, `<span class="no">${i + 1}</span><span>${it}</span>`)
          : el("div", "li", list, `<span class="tk">✓</span><span>${it}</span>`),
      );
      if (s.foot) {
        const f = el("div", "abs nm", root, s.foot);
        css(f, { left: "90px", width: "900px", textAlign: "center", top: (s.footY ?? 1250) + "px", fontSize: "34px", lineHeight: 1.45 });
        s.dom.foot = f;
      }
    }
    if (s.type === "homescreen") {
      const ph = el("div", "phone", root);
      css(ph, { left: "315px", top: "860px", width: "450px", height: "900px" });
      const scr = el("div", "screen", ph);
      css(scr, { width: "422px", height: "872px", background: "linear-gradient(160deg,#3b4f86,#1b2440 60%,#0b1222)" });
      const icons = ["#e8a87c", "#7cb0e8", "#9ad19a", "#e87c9c", "#c7a6ef", "#f1d27a", "#7ce0d6", "#f29c6b"];
      icons.forEach((c, i) => {
        const ic = el("div", "abs", scr);
        css(ic, { left: 34 + (i % 4) * 94 + "px", top: 100 + Math.floor(i / 4) * 116 + "px", width: "70px", height: "70px", borderRadius: "17px", background: c, opacity: 0.85 });
      });
      const tor = el("div", "abs", scr, `<div style="width:70px;height:70px">${TILE}</div><div style="color:#fff;font-size:15px;font-weight:700;text-align:center;margin-top:6px">Toran</div>`);
      css(tor, { left: "34px", top: 100 + 2 * 116 + "px", width: "70px" });
      s.dom.tor = tor;
      const ti = el("div", "abs d on", root, rising(s.title));
      css(ti, { left: "90px", width: "900px", top: "230px", fontSize: "80px", textAlign: "center" });
      s.dom.title = ti;
      const sb = el("div", "abs nm", root, s.sub);
      css(sb, { left: "90px", width: "900px", top: "500px", fontSize: "36px", lineHeight: 1.5, textAlign: "center" });
      s.dom.sub = sb;
    }
    if (s.whoosh !== false) cue(s.start, "whoosh");
    (s.chimes || []).forEach((c) => cue(s.start + c, "chime"));
    if (s.type === "list" || s.type === "steps") s.items.forEach((_, i) => cue(s.start + (s.first ?? 1.2) + i * (s.every ?? 0.9), "tick"));
    return s;
  }

  function drawNight(s, t) {
    const D = s.dom;
    const breathe = 0.5 + 0.08 * Math.sin(t * 1.3);
    css(s.glow, { opacity: breathe, transform: `scale(${1 + 0.03 * Math.sin(t * 0.9)})` });
    if (D.diya) {
      const p = easeOut(ramp(t, 0.1, 0.8));
      css(D.diya, { opacity: p, transform: `translateY(${(1 - p) * 20}px)` });
      const fl = D.diya.querySelector(".flame");
      fl.style.transform = `scale(${0.96 + 0.05 * Math.sin(t * 9) + 0.03 * Math.sin(t * 13.7)}, ${1 + 0.06 * Math.sin(t * 7.3)}) skewX(${2 * Math.sin(t * 5.1)}deg)`;
    }
    if (D.chip) css(D.chip, { opacity: easeOut(ramp(t, 0.3, 0.6)) });
    if (D.title) riseWords(D.title, t, s.type === "title" || s.type === "end" ? 0.55 : 0.3);
    if (D.sub) css(D.sub, { opacity: easeOut(ramp(t, s.subAt ?? 1.6, 0.8)), transform: `translateY(${(1 - easeOut(ramp(t, s.subAt ?? 1.6, 0.8))) * 20}px)` });
    if (D.url) { const p = easeOut(ramp(t, s.urlAt ?? 1.9, 0.7)); css(D.url, { opacity: p, transform: `scale(${0.9 + 0.1 * p})` }); }
    if (D.small) css(D.small, { opacity: easeOut(ramp(t, (s.urlAt ?? 1.9) + 0.6, 0.7)) });
    if (D.lines) for (const { d, ln } of D.lines) {
      riseWords(d, t, ln.at);
      d.style.opacity = 1 - ramp(t, ln.out ?? 1e9, 0.4);
    }
    if (D.cards) for (const { d, c } of D.cards) {
      const p = easeOut(ramp(t, c.at, 0.7));
      const o = 1 - ramp(t, c.out ?? 1e9, 0.4);
      css(d, { opacity: p * o, transform: `translateY(${(1 - p) * 80}px) rotate(${(c.rot || 0) * p}deg) scale(${0.92 + 0.08 * p})` });
      if (c.type === "chat") {
        const n = Math.round(lerp(47, c.unread || 412, ease(ramp(t, c.at + 0.3, 2.2))));
        d.querySelector(".badge").textContent = n;
      }
    }
    if (D.items) D.items.forEach((it, i) => {
      const p = easeOut(ramp(t, (s.first ?? 1.2) + i * (s.every ?? 0.9), 0.6));
      css(it, { opacity: p, transform: `translateX(${(1 - p) * -30}px)` });
    });
    if (D.foot) css(D.foot, { opacity: easeOut(ramp(t, s.footAt ?? 4, 0.7)) });
    if (D.tor) {
      const p = easeOut(ramp(t, 1.4, 0.7));
      css(D.tor, { opacity: p, transform: `scale(${0.5 + 0.5 * p})` });
    }
  }


  // The opening: the same light page as the walkthrough, the title on the
  // left, and Toran's real screens on a laptop and a phone rising in.
  function buildIntro(s) {
    const root = el("div", "scene", stage);
    el("div", "bg-cream", root);
    el("div", "dots", root);
    const glow = el("div", "glow", root);
    css(glow, { width: "1300px", height: "1300px", left: "-110px", top: "700px", opacity: 0.55 });
    s.dom = { root, glow, devices: [] };
    for (const d of s.devices || []) {
      const m = M[d.shot];
      const box = el("div", d.type === "laptop" ? "laptop" : "phone", root);
      let screen;
      if (d.type === "laptop") {
        const h = (d.w * m.viewport.h) / m.viewport.w;
        css(box, { left: d.x + "px", top: d.y + "px", width: d.w + "px", height: h + 34 + "px" });
        const ch = el("div", "chrome", box, `<i></i><i></i><i></i><div class="url" style="flex-basis:${d.w * 0.55}px;height:22px;font-size:13px">🔒 <b>toran.org.uk</b>${d.url || ""}</div>`);
        css(ch, { height: "34px" });
        screen = el("div", "screen", box);
        css(screen, { width: d.w + "px", height: h + "px" });
      } else {
        const h = (d.w * m.viewport.h) / m.viewport.w;
        css(box, { left: d.x + "px", top: d.y + "px", width: d.w + 24 + "px", height: h + 24 + "px", padding: "12px", borderRadius: "60px" });
        el("div", "island", box);
        css(box.lastChild, { top: "22px", width: "110px", height: "32px", marginLeft: "-55px" });
        screen = el("div", "screen", box);
        css(screen, { width: d.w + "px", height: h + "px", borderRadius: "48px" });
      }
      const img = el("img", "shot", screen);
      img.src = SHOTS + m.file;
      css(img, { width: d.w + "px", height: (d.w * m.height) / m.width + "px", opacity: 1 });
      css(box, { zIndex: d.z ?? 1 });
      s.dom.devices.push({ box, d });
    }
    const panel = el("div", "abs", root);
    css(panel, { left: "90px", top: "190px", width: "900px", display: "flex", flexDirection: "column" });
    const chip = el("div", "", panel, `<span class="chip"><span style="width:34px;height:34px;display:inline-block">${TILE}</span>${s.chip}</span>`);
    const ti = el("div", "d", panel, rising(s.title));
    css(ti, { fontSize: (s.size || 84) + "px", color: "var(--ink)", marginTop: "30px", lineHeight: 1.04 });
    const sb = el("div", "", panel, s.sub || "");
    css(sb, { fontSize: "36px", lineHeight: 1.42, color: "var(--muted)", marginTop: "28px", fontWeight: 500, maxWidth: "860px" });
    const url = el("div", "", panel, `<span style="display:inline-flex;gap:10px;align-items:center;border:2px solid var(--line);background:#fff;border-radius:999px;padding:10px 22px;font-weight:800;font-size:24px;color:var(--lapis)">toran.org.uk</span>`);
    css(url, { marginTop: "34px" });
    Object.assign(s.dom, { chip, ti, sb, url });
    el("div", "brand", root, `<span style="width:30px;height:30px;display:inline-block">${TILE}</span>TORAN`);
    cue(s.start + 0.5, "swap");
    return s;
  }

  function drawIntro(s, t) {
    const D = s.dom;
    css(D.glow, { opacity: 0.45 + 0.1 * Math.sin(t * 1.2) });
    const c = easeOut(ramp(t, 0.15, 0.6));
    css(D.chip, { opacity: c, transform: `translateY(${(1 - c) * 16}px)` });
    riseWords(D.ti, t, 0.35, 0.08, 0.75);
    const b = easeOut(ramp(t, 1.3, 0.8));
    css(D.sb, { opacity: b, transform: `translateY(${(1 - b) * 18}px)` });
    const u = easeOut(ramp(t, 1.8, 0.7));
    css(D.url, { opacity: u, transform: `translateY(${(1 - u) * 14}px)` });
    D.devices.forEach(({ box, d }, i) => {
      const p = easeOut(ramp(t, 0.45 + i * 0.35, 1.1));
      const float = Math.sin(t * 0.9 + i * 1.7) * 6;
      const drift = (t / s.dur) * 14;
      css(box, {
        opacity: p,
        transform: `perspective(2200px) translateY(${(1 - p) * 90 + float - drift}px) rotateY(${d.rot ?? -8}deg) rotateX(3deg) scale(${0.94 + 0.06 * p})`,
      });
    });
  }
  const built = scenes.map((s) => (s.kind === "night" ? buildNight(s) : s.kind === "intro" ? buildIntro(s) : buildProduct(s)));
  const progress = el("div", "progress", stage);
  const fade = el("div", "abs", stage);
  css(fade, { inset: 0, background: "#000", opacity: 0, zIndex: 60 });


  // ---- checks: everything the film points at must be in frame ---------------
  // Run once the fonts are loaded (render.mjs calls it). Each tap, highlight,
  // callout and typing box must be on the phone's screen at its moment, clear
  // of the tab bar, on the screen that's showing then; captions must stay
  // clear of the phone; title cards must fit the frame.
  window.runChecks = function () {
    const problems = [];
    const shotAt = (s, t) => {
      let cur = (s.shots || [])[0]?.shot;
      for (const kf of s.shots || []) if (t >= kf.at) cur = kf.shot;
      return cur;
    };
    for (const s of built) {
      const was = s.dom.root.style.display;
      s.dom.root.style.display = "block";
      const name = `scene at ${s.start.toFixed(1)}s (${(s.captions?.[0]?.title || s.title || s.type || "").replace(/<[^>]+>/g, "")})`;
      if (s.kind === "phone" || s.kind === "laptop") {
        const g = GEO[s.kind], k = g.k, W = g.vw * k, H = g.vh * k;
        const left = s.ox, top = s.oy, right = s.ox + W, bottom = s.oy + H - (s.kind === "phone" ? 80 * k : 0);
        const inFrame = (ref, t, what) => {
          if (!Array.isArray(ref) || typeof ref[0] !== "string") {
            // raw position: check against the screen too
          } else if (shotAt(s, t) !== ref[0]) {
            problems.push(`${name}: ${what} at ${t}s points at ${ref[0]} but ${shotAt(s, t)} is showing`);
          }
          const b = resolveBox(ref);
          const sc = scrollAt(s, t), cam = camAt(s, t);
          const full = isFull(ref, g) || (Array.isArray(ref) && typeof ref[0] === "number" && M[shotAt(s, t)] && M[shotAt(s, t)].height > g.vh + 2);
          const [x1, y1] = toStage(s, b.x, b.y, t, cam, full ? sc : 0);
          const [x2, y2] = toStage(s, b.x + b.w, b.y + b.h, t, cam, full ? sc : 0);
          if (x1 < left - 2 || x2 > right + 2 || y1 < top - 2 || y2 > bottom + 2) {
            problems.push(`${name}: ${what} at ${t}s is out of frame (${Math.round(x1)},${Math.round(y1)})–(${Math.round(x2)},${Math.round(y2)}) vs screen (${Math.round(left)},${Math.round(top)})–(${Math.round(right)},${Math.round(bottom)})`);
          }
        };
        for (const c of s.taps || []) inFrame(c.on, c.at, "tap");
        for (const c of s.cursor || []) if (c.click) inFrame(c.to, c.at + (c.dur ?? 0.8), "click");
        for (const r of s.rings || []) { inFrame(r.on, r.at + 0.35, "highlight"); inFrame(r.on, r.at + (r.dur ?? 2) - 0.1, "highlight end"); }
        for (const c of s.callouts || []) inFrame(c.on, c.at + 0.3, "callout");
        for (const ty of s.types || []) { inFrame(ty.on, ty.at, "typing"); inFrame(ty.on, ty.at + ty.dur, "typing end"); }
        // captions above the phone
        for (const c of s.caps) {
          const h = c.d.offsetHeight;
          if (150 + h > s.oy - 24) problems.push(`${name}: caption "${c.c.title}" is ${h}px tall and runs into the phone`);
        }
      }
      if (s.kind === "intro") {
        for (const { box, d } of s.dom.devices) {
          const w = box.offsetWidth, h = box.offsetHeight;
          if (d.x < -10 || d.x + w > 1090 || d.y + h > 1840) problems.push(`${name}: a device runs off the frame (${d.x},${d.y} ${w}×${h})`);
        }
      }
      // any text wider than its box
      s.dom.root.querySelectorAll(".d, .nm, .t, .b").forEach((e) => {
        if (e.scrollWidth > e.clientWidth + 2) problems.push(`${name}: text "${e.textContent.slice(0, 40)}" is wider than its box`);
      });
      s.dom.root.style.display = was;
    }
    return problems;
  };
  window.DURATION = DURATION;
  window.CUES = CUES.sort((a, b) => a.t - b.t);
  window.SCENES = scenes.map((s) => ({ start: s.start, dur: s.dur, kind: s.kind, title: s.title || s.captions?.[0]?.title }));

  window.render = function (t) {
    const X = 0.5; // cross-fade between scenes
    built.forEach((s, i) => {
      const lt = t - s.start;
      const inA = i === 0 ? 1 : ease(ramp(t, s.start, X));
      const outA = i === built.length - 1 ? 1 : 1 - ease(ramp(t, s.end, X));
      const a = inA * outA;
      const live = t >= s.start - 0.01 && t <= s.end + X;
      s.dom.root.style.opacity = live ? a : 0;
      s.dom.root.style.display = live ? "block" : "none";
      s.dom.root.style.zIndex = i;
      if (live) (s.kind === "night" ? drawNight : s.kind === "intro" ? drawIntro : drawProduct)(s, lt);
    });
    progress.style.width = (clamp(t / (DURATION - 0.6)) * 1080).toFixed(1) + "px";
    const opening = 1 - ramp(t, 0, 0.5);
    fade.style.background = opening > 0 ? "#f6f4ef" : "#000";
    fade.style.opacity = Math.max(opening, ramp(t, DURATION - 0.6, 0.6));
  };
  window.render(0);
})();
