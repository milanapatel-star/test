"""Original soundtrack for the Toran pitch film, synthesised here.

Nothing is sampled or licensed. A clean, modern 120 BPM launch-film track in
D major (Bm G D A): a tanpura drone and soft plucks for the opening, a
tense pulse while the messages pile up, then an impact as Toran appears and
a punchy groove (kick with sidechain pump, clap, hats, sub bass, warm pads,
a plucked arpeggio and a bell motif). A short breakdown with a flute-like
lead under "In your language", then the last lift for the call to action.
Every pop, ping, scan and chime comes from out/cues.json, so it lands on
the frame its animation starts.

Usage: python3 music.py  ->  out/soundtrack.wav
"""
import json
import os
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

OUT = Path(__file__).resolve().parent / "out"
INFO = json.loads((OUT / "cues.json").read_text())
SR = 48000
DUR = INFO["duration"]
N = int(SR * DUR)
rng = np.random.default_rng(2026)
B = 0.5  # a beat at 120 BPM
BAR = 4 * B
STEM = os.environ.get("STEM")
buses = {k: np.zeros((2, N)) for k in ("drums", "bass", "pads", "lead", "fx", "verb")}


def add(sig, t, bus, gain=1.0, pan=0.0, verb=0.0):
    i = int(round(t * SR))
    if i >= N or len(sig) == 0:
        return
    if i < 0:
        sig, i = sig[-i:], 0
    sig = sig[: N - i] * gain
    l, r = np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
    buses[bus][0, i : i + len(sig)] += sig * l
    buses[bus][1, i : i + len(sig)] += sig * r
    if verb:
        buses["verb"][0, i : i + len(sig)] += sig * l * verb
        buses["verb"][1, i : i + len(sig)] += sig * r * verb


def tv(sec):
    return np.arange(int(sec * SR)) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hz(name):
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    n, o = name[:-1], int(name[-1])
    return 440 * 2 ** ((names[n] + 12 * (o - 4)) / 12)


# ---- instruments ------------------------------------------------------------
def kick(big=1.0):
    t = tv(0.5)
    f = 44 + 120 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.3 * big))
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.0025) * 0.3
    return np.tanh(1.7 * (body + click)) * 0.95


def clap():
    t = tv(0.35)
    n = rng.standard_normal(len(t))
    e = np.zeros_like(t)
    for d in (0, 0.009, 0.018):
        e += np.where(t >= d, np.exp(-(t - d) / 0.005), 0)
    e += np.where(t >= 0.025, np.exp(-(t - 0.025) / 0.07), 0) * 0.7
    return bp(n, 1100, 4200) * e * 0.5


def hat(open_=False):
    t = tv(0.3 if open_ else 0.05)
    return hp(rng.standard_normal(len(t)), 8000) * np.exp(-t / (0.07 if open_ else 0.01)) * 0.26


def tick():
    t = tv(0.03)
    return hp(rng.standard_normal(len(t)), 6000) * np.exp(-t / 0.004) * 0.3


def sub(f, sec):
    t = tv(sec)
    e = np.minimum(t / 0.005, 1) * np.clip((sec - t) / 0.04, 0, 1)
    s = np.sin(2 * np.pi * f * t) + 0.2 * np.sin(4 * np.pi * f * t)
    return np.tanh(1.3 * s) * e * 0.55


def pad(freqs, sec, cutoff=2200, attack=0.35):
    t = tv(sec)
    out = np.zeros_like(t)
    for f in freqs:
        for d in (-0.008, -0.003, 0.003, 0.008):
            out += 2 * (((f * (1 + d) * t + rng.random()) % 1) - 0.5)
    out = lp(out / (len(freqs) * 4), cutoff, 2)
    e = np.minimum(t / attack, 1) * np.clip((sec - t) / 0.35, 0, 1)
    return out * e * 0.5


def pluck(f, sec=0.45, cut=3200):
    t = tv(sec)
    saw = 2 * ((f * t) % 1) - 1 + 0.5 * (2 * ((f * 2.003 * t) % 1) - 1)
    env = np.exp(-t / 0.16) * np.minimum(t / 0.002, 1)
    sig = lp(saw * env, cut, 2) + lp(saw, 900, 1) * env * 0.3
    return sig * 0.22


def bell(f, sec=1.6):
    t = tv(sec)
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / 0.2) + 0.2 * np.sin(2 * np.pi * f * 4.2 * t) * np.exp(-t / 0.08)
    return s * np.exp(-t / 0.6) * np.minimum(t / 0.002, 1) * 0.15


def drone(sec):
    """A tanpura-like drone: D3 and A2 with a buzzing, slowly breathing top."""
    t = tv(sec)
    out = np.zeros_like(t)
    for f, g in ((hz("A2"), 0.8), (hz("D3"), 1.0), (hz("D3") * 2, 0.5)):
        for h in range(1, 9):
            out += g * np.sin(2 * np.pi * f * h * t + rng.random() * 6) / h ** 1.1 * (1 + 0.5 * np.sin(2 * np.pi * (0.12 + 0.05 * h) * t))
    out = lp(out, 2400)
    e = np.minimum(t / 1.2, 1) * np.clip((sec - t) / 0.8, 0, 1)
    return out * e * 0.07


def flute(f, sec):
    t = tv(sec)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(t / 0.3, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    tone = np.sin(ph) + 0.12 * np.sin(2 * ph)
    breath = bp(rng.standard_normal(len(t)), f * 0.8, f * 3) * 0.12
    e = np.minimum(t / 0.08, 1) * np.clip((sec - t) / 0.12, 0, 1)
    return (tone + breath) * e * 0.16


def riser(sec):
    t = tv(sec)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    steps = 24
    for k in range(steps):
        a, b = int(k * len(t) / steps), int((k + 1) * len(t) / steps)
        c = 400 * (13000 / 400) ** (k / steps)
        out[a:b] = bp(n[a:b], c * 0.7, min(c * 1.4, 20000))
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * t / sec)) / SR) * 0.12
    return (out * 0.3 + tone) * (t / sec) ** 2


def impact(soft=False):
    t = tv(2.4)
    boom = np.sin(2 * np.pi * np.cumsum(32 + 60 * np.exp(-t / 0.1)) / SR) * np.exp(-t / (0.5 if soft else 0.8))
    crash = hp(rng.standard_normal(len(t)), 3500) * np.exp(-t / 0.7) * 0.22
    return (np.tanh(1.6 * boom) * 0.8 + crash) * (0.6 if soft else 1)


def whoosh(sec=0.5, up=True):
    t = tv(sec)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    steps = 12
    for k in range(steps):
        a, b = int(k * len(t) / steps), int((k + 1) * len(t) / steps)
        q = k / steps if up else 1 - k / steps
        c = 500 * (7000 / 500) ** q
        out[a:b] = bp(n[a:b], c * 0.6, c * 1.6)
    return out * np.sin(np.pi * t / sec) ** 2 * 0.35


def pop(f=900):
    t = tv(0.12)
    fr = f * (1 + 0.7 * np.exp(-t / 0.01))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.035) * 0.33


def rev_cym(sec=1.0):
    t = tv(sec)
    return hp(rng.standard_normal(len(t)), 4000) * (t / sec) ** 3 * 0.32


# ---- the song ------------------------------------------------------------------
CH = [  # Bm G D A
    (["B3", "D4", "F#4"], "B1", ["B4", "D5", "F#5", "B5"]),
    (["G3", "B3", "D4"], "G1", ["G4", "B4", "D5", "G5"]),
    (["A3", "D4", "F#4"], "D2", ["A4", "D5", "F#5", "A5"]),
    (["A3", "C#4", "E4"], "A1", ["A4", "C#5", "E5", "A5"]),
]
MOTIF = [("F#5", 0), ("A5", 1), ("B5", 1.5), ("A5", 2.5), ("F#5", 3), ("E5", 3.5)]
SECTIONS = {"intro": (0, 4), "tension": (4, 10), "groove": (10, 35), "break": (36, 40), "groove2": (40, 46), "build": (46, 48), "final": (48, 51.5)}


def sec_of(t):
    for k, (a, b) in SECTIONS.items():
        if a <= t < b:
            return k
    return "end"


kicks = []
add(drone(10.4), 0, "pads", 1.0, verb=0.3)
add(drone(4.6), 35.8, "pads", 1.1, verb=0.3)
t0 = 0.0
b = 0
while t0 < 51.5:
    s = sec_of(t0 + 0.01)
    ch = CH[b % 4]
    if s == "intro":
        add(pad([hz(n) for n in ch[0]], BAR + 0.2, cutoff=900, attack=0.8), t0, "pads", 0.7, verb=0.3)
        for k, nm in enumerate((ch[2] * 2)[:8]):
            add(pluck(hz(nm), 0.5, 1400 + 500 * b), t0 + k * B / 2, "lead", 0.45, pan=-0.3 + 0.08 * k, verb=0.35)
    elif s == "tension":
        add(pad([hz(n) for n in ch[0]] + [hz("C#5")], BAR + 0.2, cutoff=1100, attack=0.5), t0, "pads", 0.6, verb=0.25)
        for k in range(16):
            if t0 + k * B / 4 < 9.75:
                add(tick(), t0 + k * B / 4, "drums", 0.9 if k % 4 == 0 else 0.5, pan=0.25)
        for k in range(8):
            if t0 + k * B / 2 < 9.75:
                add(lp(sub(hz(ch[1]) * 2, 0.22), 500), t0 + k * B / 2, "bass", 0.7)
        if t0 >= 6:
            for k in range(4):
                if t0 + k * B < 9.75:
                    add(lp(kick(0.5), 260), t0 + k * B, "drums", 0.5)
    elif s in ("groove", "groove2", "final"):
        light = s == "groove" and t0 < 14  # the reveal: half-time, lots of space
        for k in range(4):
            if light and k % 2:
                continue
            kicks.append(t0 + k * B)
            add(kick(), t0 + k * B, "drums", 0.9)
        if not light:
            for k in (1, 3):
                add(clap(), t0 + k * B, "drums", 0.7, verb=0.18)
            for k in range(8):
                add(hat(open_=(k % 2 == 1)), t0 + k * B / 2, "drums", 0.55 if k % 2 else 0.3, pan=0.2)
        else:
            add(clap(), t0 + 2 * B, "drums", 0.6, verb=0.35)
        root = hz(ch[1]) * 2
        for st, d in ((0, 0.45), (0.75, 0.25), (1.5, 0.4), (2, 0.45), (2.75, 0.25), (3.5, 0.4)):
            if not light or st in (0, 2):
                add(sub(root, d * B * 2), t0 + st * B, "bass", 0.85)
        add(pad([hz(n) for n in ch[0]], BAR + 0.15, cutoff=2400 if not light else 1600), t0, "pads", 0.75, verb=0.25)
        if not light:
            for k, nm in enumerate((ch[2] + ch[2][::-1])[:8]):
                add(pluck(hz(nm), 0.4, 3000), t0 + k * B / 2, "lead", 0.42, pan=-0.35 + 0.1 * k, verb=0.25)
        if (s == "groove" and t0 >= 14 and b % 2 == 0) or s == "final":
            for nm, at in MOTIF:
                add(bell(hz(nm)), t0 + at * B, "lead", 0.9, pan=0.3, verb=0.4)
        if b % 4 == 3 and not light:
            for k in range(4):
                add(clap() * 0.5, t0 + 3 * B + k * B / 4, "drums", 0.5 + 0.1 * k)
    elif s == "break":
        add(pad([hz(n) for n in ch[0]], BAR + 0.2, cutoff=1300, attack=0.6), t0, "pads", 0.8, verb=0.35)
        for k in range(16):
            add(tick(), t0 + k * B / 4, "drums", 0.35, pan=-0.2)
    elif s == "build":
        add(pad([hz(n) for n in ch[0]], BAR + 0.2, cutoff=1500 + 600 * (t0 - 46)), t0, "pads", 0.8, verb=0.3)
        for k in range(8 if t0 < 47 else 16):
            step = B / 2 if t0 < 47 else B / 4
            tt = t0 + k * step
            if tt < 48:
                add(clap() * (0.3 + 0.7 * (tt - 46) / 2), tt, "drums", 0.6, verb=0.2)
                add(kick(0.5), tt, "drums", 0.25 + 0.3 * (tt - 46) / 2)
    t0 += BAR
    b += 1

# Breakdown lead: a flute line over the drone.
for nm, at, d in (("B4", 36.25, 0.45), ("D5", 36.75, 0.45), ("E5", 37.25, 0.9), ("F#5", 38.25, 0.45), ("E5", 38.75, 0.45), ("D5", 39.25, 0.7)):
    add(flute(hz(nm), d), at, "lead", 1.0, pan=0.1, verb=0.45)
# The ending: one chord and a bell ringing out.
add(impact(soft=True), 51.5, "fx", 0.6, verb=0.3)
add(pad([hz("D3"), hz("F#3"), hz("A3"), hz("D4")], DUR - 51.5, cutoff=1800, attack=0.02), 51.5, "pads", 0.9, verb=0.5)
add(bell(hz("D6"), 1.0), 51.5, "lead", 1.2, verb=0.6)
add(sub(hz("D2"), 0.9), 51.5, "bass", 0.8)

# ---- sound effects from the picture ------------------------------------------
PENTA = ["D6", "E6", "F#6", "A6", "B6", "D7"]
for c in INFO["cues"]:
    t, k, n = c["t"], c["type"], c.get("n", 0)
    if k == "type":
        add(pop(2400) * 0.35, t, "fx", 0.6)
        add(tick() * 0.5, t, "fx", 0.6)
    elif k == "ping":
        add(bell(hz(["E6", "F#6", "A6", "B6", "D7", "E7"][n % 6]), 0.6) * 1.4, t, "fx", 0.7, pan=-0.4 + 0.16 * n, verb=0.2)
        add(bell(hz(["B6", "C#7", "E7", "F#7", "A7", "B7"][n % 6]), 0.5), t + 0.09, "fx", 0.6, pan=-0.4 + 0.16 * n)
    elif k == "riser":
        add(riser(c["len"]), t, "fx", 0.75)
    elif k == "suck":
        add(whoosh(0.8, up=False)[::-1], t, "fx", 0.9)
        add(rev_cym(0.95), t, "fx", 1.0)
    elif k == "impact":
        add(impact(c.get("soft", 0) == 1), t, "fx", 0.85, verb=0.3)
        add(kick(1.6), t, "drums", 0.8)
    elif k == "sparkle":
        for i, nm in enumerate(["F#6", "A6", "B6", "D7"]):
            add(bell(hz(nm), 1.0), t + i * 0.09, "fx", 0.8, pan=-0.3 + 0.2 * i, verb=0.4)
    elif k == "pop":
        add(pop(700 + 140 * n), t, "fx", 0.65, pan=0.25)
    elif k == "scan":
        L = c["len"]
        tt = tv(L)
        sweep = np.sin(2 * np.pi * np.cumsum(500 + 1800 * tt / L) / SR) * 0.05 * np.sin(np.pi * tt / L)
        add(bp(rng.standard_normal(len(tt)), 2500, 7000) * 0.06 * np.sin(np.pi * tt / L) + sweep, t, "fx", 1.0, verb=0.2)
    elif k == "chime":
        add(bell(hz("A6"), 1.2) * 1.5, t, "fx", 0.7, verb=0.4)
        add(bell(hz("D7"), 1.2) * 1.2, t + 0.1, "fx", 0.6, verb=0.4)
    elif k == "click":
        add(pop(1800) * 0.9, t, "fx", 0.8)
        add(tick(), t, "fx", 0.8)
    elif k == "ding":
        for i, nm in enumerate(["D6", "F#6", "A6"]):
            add(bell(hz(nm), 1.0) * 1.3, t + i * 0.16, "fx", 0.7, pan=-0.2 + 0.2 * i, verb=0.35)
    elif k == "drop":
        tt = tv(0.18)
        add(np.sin(2 * np.pi * np.cumsum(1300 * np.exp(-tt / 0.06) + 380) / SR) * np.exp(-tt / 0.06) * 0.3, t, "fx", 0.7, pan=-0.3 + 0.3 * n)
    elif k == "count":
        L = c["len"]
        x = 0.0
        while x < L:
            add(tick() * 0.7, t + x, "fx", 0.5, pan=0.3)
            add(pop(3000) * 0.12, t + x, "fx", 0.5, pan=0.3)
            x += 0.045 + 0.2 * (x / L) ** 2
    elif k == "msg":
        add(pop(1200), t, "fx", 0.7, pan=0.3)
        add(pop(1600), t + 0.1, "fx", 0.6, pan=0.3)
    elif k == "slot":
        add(pop(600 + 80 * n) * 0.8, t, "fx", 0.6)
        add(bell(hz(PENTA[n % 6]), 0.7), t, "fx", 0.7, pan=-0.3 + 0.12 * n, verb=0.3)
    elif k == "whoosh":
        g = 0.45 if c.get("soft") else 0.8
        add(whoosh(0.5), t - 0.3, "fx", g)
    elif k == "shimmer":
        for i in range(6):
            add(bell(hz(["A6", "B6", "D7", "E7", "F#7", "A7"][i]), 0.6) * 0.6, t + i * 0.05, "fx", 0.5, pan=-0.4 + 0.16 * i, verb=0.5)

# ---- mix ----------------------------------------------------------------------
tt = np.arange(N) / SR
pump = np.ones(N)
for k in kicks:
    i = int(k * SR)
    seg = tt[i : i + int(0.4 * SR)] - k
    pump[i : i + len(seg)] = np.minimum(pump[i : i + len(seg)], 1 - 0.55 * np.exp(-seg / 0.12))
for name in ("bass", "pads", "lead"):
    buses[name] *= pump

ir_t = tv(2.2)
ir = rng.standard_normal((2, len(ir_t))) * np.exp(-ir_t / 0.6)
ir = np.stack([lp(ir[0], 6000), lp(ir[1], 6000)])
verb = np.stack([hp(fftconvolve(buses["verb"][c], ir[c])[:N], 250) for c in range(2)]) * 0.11

levels = {"drums": 0.95, "bass": 1.0, "pads": 0.6, "lead": 0.85, "fx": 0.95}
mix = buses[STEM] * levels[STEM] if STEM else sum(buses[k] * v for k, v in levels.items()) + verb
mix = np.stack([hp(mix[c], 28) for c in range(2)])
rms = np.sqrt(np.mean(mix**2))
mix *= 10 ** (-16 / 20) / rms
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= min(1.0, 10 ** (-1 / 20) / np.max(np.abs(mix)))
mix *= np.clip((DUR - tt) / 0.6, 0, 1) * np.clip(tt / 0.05, 0, 1)
name = "soundtrack.wav" if not STEM else f"stem-{STEM}.wav"
wavfile.write(OUT / name, SR, (mix.T * 32767).astype(np.int16))
print(name, round(DUR, 2), "s, rms", round(20 * np.log10(np.sqrt(np.mean(mix**2))), 1), "dBFS")
