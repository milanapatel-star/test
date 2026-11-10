"""Original music for the Toran Instagram Reel, synthesised here.

Nothing is sampled or licensed. A catchy 120 BPM desi-pop / house groove in
A minor (Am F C G): a four-on-the-floor kick with sidechain pump, claps, hats
and a shaker, dhol (dagga and tilli) on a bhangra-ish pattern, a rounded
sub bass, a wide supersaw pad, a plucked sitar-like hook and glockenspiel
sparkle. The structure follows the Reel: a filtered hook (0-4 s), the drop
when Toran appears (4 s), the features groove, a breakdown for committees
(40-48 s), a build, and the last drop for the call to action (50 s). The
Reel's cues.json places every pop, whoosh, tick and chime on its frame.

Usage: python3 music.py  ->  ../out/reel/soundtrack.wav
"""
import json
import os
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

OUT = Path(__file__).resolve().parent.parent / "out" / "reel"
INFO = json.loads((OUT / "cues.json").read_text())
SR = 48000
DUR = INFO["duration"]
N = int(SR * DUR)
rng = np.random.default_rng(108)
BPM = 120
B = 60 / BPM  # a beat, 0.5 s
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
    f = 46 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / (0.32 * big))
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.003) * 0.35
    return np.tanh(1.6 * (body + click)) * 0.95


def clap():
    t = tv(0.4)
    n = rng.standard_normal(len(t))
    e = np.zeros_like(t)
    for d in (0, 0.011, 0.022):
        e += np.where(t >= d, np.exp(-(t - d) / 0.006), 0)
    e += np.where(t >= 0.03, np.exp(-(t - 0.03) / 0.09), 0) * 0.8
    return bp(n, 900, 3200) * e * 0.55


def snap():
    t = tv(0.15)
    return bp(rng.standard_normal(len(t)), 1800, 6000) * np.exp(-t / 0.012) * 0.5


def hat(open_=False):
    t = tv(0.35 if open_ else 0.06)
    return hp(rng.standard_normal(len(t)), 7500) * np.exp(-t / (0.09 if open_ else 0.012)) * 0.28


def shaker():
    t = tv(0.09)
    e = np.minimum(t / 0.012, 1) * np.exp(-t / 0.03)
    return bp(rng.standard_normal(len(t)), 5000, 11000) * e * 0.18


def dagga():
    """Dhol bass side: a slack, booming skin."""
    t = tv(0.45)
    f = 62 + 70 * np.exp(-t / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    slap = bp(rng.standard_normal(len(t)), 150, 900) * np.exp(-t / 0.02) * 0.6
    return np.tanh(1.3 * (body + slap)) * 0.6


def tilli(acc=1.0):
    """Dhol treble side: a cane on a tight skin."""
    t = tv(0.16)
    tone = np.sin(2 * np.pi * 420 * t) * np.exp(-t / 0.03) * 0.5
    crack = bp(rng.standard_normal(len(t)), 1500, 5500) * np.exp(-t / 0.018)
    return (tone + crack) * 0.32 * acc


def sub(f, sec):
    t = tv(sec)
    e = np.minimum(t / 0.006, 1) * np.minimum(1, (sec - t) / 0.04).clip(0, 1)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
    return np.tanh(1.4 * s) * e * 0.55


def supersaw(freqs, sec, cutoff=2600, attack=0.25):
    t = tv(sec)
    out = np.zeros_like(t)
    for f in freqs:
        for d in (-0.012, -0.006, 0, 0.006, 0.012):
            ph = rng.random()
            out += 2 * (((f * (1 + d) * t + ph) % 1) - 0.5)
    out = lp(out / (len(freqs) * 5), cutoff, 2)
    e = np.minimum(t / attack, 1) * np.minimum(1, (sec - t) / 0.3).clip(0, 1)
    return out * e * 0.5


def pluck(f, sec=0.9, bright=0.6):
    """Karplus-Strong string with a little sitar buzz."""
    n = int(sec * SR)
    p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p)
    buf = lp(buf, 9000 * bright + 1500, 1) if p > 12 else buf
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    buzz = np.tanh(out * 3.0) * 0.25
    t = np.arange(n) / SR
    return (out + buzz) * np.exp(-t / (sec * 0.6)) * 0.42


PLUCK_CACHE = {}


def pl(name, sec=0.9):
    k = (name, sec)
    if k not in PLUCK_CACHE:
        PLUCK_CACHE[k] = pluck(hz(name), sec)
    return PLUCK_CACHE[k]


def glock(f, sec=1.4):
    t = tv(sec)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.15)
    return s * np.exp(-t / 0.55) * np.minimum(t / 0.002, 1) * 0.16


def riser(sec):
    t = tv(sec)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    steps = 24
    for k in range(steps):
        a, b = int(k * len(t) / steps), int((k + 1) * len(t) / steps)
        c = 400 * (14000 / 400) ** (k / steps)
        out[a:b] = bp(n[a:b], c * 0.7, min(c * 1.4, 20000))
    tone = np.sin(2 * np.pi * np.cumsum(200 * 2 ** (3 * t / sec)) / SR) * 0.15
    return (out * 0.35 + tone) * (t / sec) ** 2


def impact():
    t = tv(2.2)
    boom = np.sin(2 * np.pi * np.cumsum(30 + 50 * np.exp(-t / 0.12)) / SR) * np.exp(-t / 0.7)
    crash = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.6) * 0.25
    return np.tanh(1.5 * boom) * 0.8 + crash


def whoosh(sec=0.45, up=True):
    t = tv(sec)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    steps = 12
    for k in range(steps):
        a, b = int(k * len(t) / steps), int((k + 1) * len(t) / steps)
        q = k / steps if up else 1 - k / steps
        c = 600 * (8000 / 600) ** q
        out[a:b] = bp(n[a:b], c * 0.6, c * 1.6)
    e = np.sin(np.pi * t / sec) ** 2
    return out * e * 0.35


def pop(f=900):
    t = tv(0.12)
    fr = f * (1 + 0.8 * np.exp(-t / 0.01))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.035) * 0.35


def ding():
    return glock(hz("E6"), 1.2) * 1.6 + glock(hz("A6"), 1.2) * 0.9


def reverse_cymbal(sec=1.0):
    t = tv(sec)
    return (hp(rng.standard_normal(len(t)), 4000) * (t / sec) ** 3 * 0.35)


# ---- the song ------------------------------------------------------------------
CHORDS = [("A", ["A3", "C4", "E4"], "A1"), ("F", ["F3", "A3", "C4"], "F1"), ("C", ["C4", "E4", "G4"], "C2"), ("G", ["G3", "B3", "D4"], "G1")]
HOOK = [
    [("A4", 0), ("C5", 0.5), ("E5", 1), ("A5", 1.5), ("G5", 2.5), ("E5", 3), ("D5", 3.5)],
    [("C5", 0), ("A4", 0.75), ("C5", 1.5), ("D5", 2), ("E5", 2.5), ("C5", 3.5)],
    [("E5", 0), ("G5", 0.5), ("E5", 1), ("D5", 1.5), ("C5", 2.5), ("D5", 3)],
    [("B4", 0), ("D5", 0.75), ("G5", 1.5), ("E5", 2.5), ("D5", 3), ("B4", 3.5)],
]
DROP1, BREAK, BUILD, DROP2, END = 4.0, 40.0, 48.0, 50.0, 58.0


def bar_of(t):
    return int(t // BAR)


kicks = []
nbars = int(np.ceil(DUR / BAR))
for b in range(nbars):
    t0 = b * BAR
    ch = CHORDS[b % 4]
    groove = DROP1 <= t0 < BREAK or DROP2 <= t0 < END
    intro = t0 < DROP1
    breakdown = BREAK <= t0 < BUILD
    build = BUILD <= t0 < DROP2
    ending = t0 >= END

    # Drums
    if groove:
        for k in range(4):
            kicks.append(t0 + k * B)
            add(kick(), t0 + k * B, "drums", 0.9)
        for k in (1, 3):
            add(clap(), t0 + k * B, "drums", 0.75, verb=0.15)
        for k in range(4):
            add(hat(open_=(k % 2 == 1)), t0 + k * B + B / 2, "drums", 0.5, pan=0.2)
        for k in range(16):
            add(shaker(), t0 + k * B / 4, "drums", 0.7 if k % 4 == 2 else 0.45, pan=-0.3)
        for e in (0, 3, 6):
            add(dagga(), t0 + e * B / 2, "drums", 0.8)
        for e, a in ((2, 1.0), (5, 0.8), (7, 1.0), (7.5, 0.6)):
            add(tilli(a), t0 + e * B / 2, "drums", 0.9, pan=0.15)
        if b % 4 == 3:  # fill
            for k in range(6):
                add(tilli(0.6 + 0.08 * k), t0 + 3 * B + k * B / 6, "drums", 0.8, pan=-0.2 + 0.08 * k)
    if breakdown:
        for e, a in ((2, 0.6), (5, 0.5), (7, 0.6)):
            add(tilli(a), t0 + e * B / 2, "drums", 0.55, pan=0.2, verb=0.3)
        add(dagga(), t0, "drums", 0.45, verb=0.2)
    if build:
        n = 16
        for k in range(n):
            tt = t0 + k * BAR / n
            add(snap() * (0.4 + 0.6 * k / n), tt, "drums", 1.0, verb=0.2)
        for k in range(8):
            add(kick(0.5), t0 + k * B / 2, "drums", 0.25 + 0.5 * k / 8)
        add(riser(BAR), t0, "fx", 0.8)
        add(reverse_cymbal(1.0), DROP2 - 1.0, "fx", 1.0)

    # Bass
    if groove:
        root = hz(ch[2]) * 2
        for s, d in ((0, 0.45), (0.75, 0.3), (1.5, 0.45), (2, 0.4), (2.75, 0.3), (3.5, 0.45)):
            add(sub(root, d * B * 2), t0 + s * B, "bass", 0.85)

    # Pads
    if groove or breakdown or build or ending:
        cut = 2600 if groove else (900 + 1700 * ((t0 - BREAK) / (DROP2 - BREAK)) if (breakdown or build) else 1500)
        add(supersaw([hz(n) for n in ch[1]], BAR + 0.15, cutoff=cut), t0, "pads", 0.75 if groove else 0.9, verb=0.25)
    if intro:
        # A muffled pulse under the opening, so the hook moves from frame one.
        for k in range(4):
            add(lp(kick(0.6), 300), t0 + k * B, "drums", 0.55)
        if b == 1:
            for k in (1, 3):
                add(clap(), t0 + k * B, "drums", 0.45, verb=0.25)
        add(supersaw([hz(n) for n in ch[1]], BAR + 0.1, cutoff=700, attack=0.6), t0, "pads", 0.6, verb=0.3)

    # Hook
    if not ending and (groove or intro or breakdown):
        if groove and 24.0 <= t0 < 32.0:
            pass  # a breather for the hook in the middle
        else:
            for nm, at in HOOK[b % 4]:
                g = 0.7 if intro else (0.45 if breakdown else 0.75)
                add(pl(nm), t0 + at * B, "lead", g, pan=0.1 if at % 1 else -0.1, verb=0.35)
    if groove and 24.0 <= t0 < 32.0:
        for k, nm in enumerate(ch[1] * 2 + ch[1][:2]):
            add(pl(nm.replace("3", "5").replace("4", "5"), 0.5), t0 + k * B / 2, "lead", 0.38, pan=-0.4 + 0.1 * k, verb=0.3)
    if DROP2 <= t0 < END or BREAK <= t0 < BUILD:
        for k, nm in enumerate(ch[1]):
            add(glock(hz(nm.replace("3", "6").replace("4", "6"))), t0 + (k * 1.5) * B, "lead", 0.9, pan=0.4, verb=0.4)

# The hook's opening: a riser into the first drop, and the impacts.
add(riser(1.8), DROP1 - 1.8, "fx", 0.7)
add(reverse_cymbal(0.8), DROP1 - 0.8, "fx", 0.9)
for t in (DROP1, DROP2):
    add(impact(), t, "fx", 0.8, verb=0.2)
    add(kick(1.6), t, "drums", 0.8)
add(impact(), END, "fx", 0.9, verb=0.3)
add(supersaw([hz("A3"), hz("C4"), hz("E4"), hz("A4")], DUR - END, cutoff=1800, attack=0.02), END, "pads", 0.8, verb=0.4)
add(glock(hz("A5"), 2.5), END, "lead", 1.4, verb=0.5)
add(glock(hz("E6"), 2.5), END + 0.25, "lead", 1.0, verb=0.5)

# Cues from the Reel: every pop, whoosh, tick and chime on its frame.
for c in INFO["cues"]:
    t, k = c["t"], c["kind"]
    if k == "pop":
        add(pop(c.get("f", 900)), t, "fx", c.get("g", 0.6), pan=c.get("pan", 0))
    elif k == "snap":
        add(snap(), t, "fx", 0.9, verb=0.2)
    elif k == "whoosh":
        add(whoosh(c.get("d", 0.45), c.get("up", True)), t - c.get("d", 0.45) * 0.55, "fx", c.get("g", 0.8), pan=c.get("pan", 0))
    elif k == "tap":
        add(pop(1500) * 0.8, t, "fx", 0.7)
        add(snap() * 0.3, t, "fx", 0.7)
    elif k == "swish":
        add(whoosh(0.3, False), t - 0.12, "fx", 0.5, pan=c.get("pan", 0.3))
    elif k == "ding":
        add(ding(), t, "fx", 0.7, verb=0.4)
    elif k == "hit":
        add(kick(1.3), t, "fx", 0.6)
        add(clap(), t, "fx", 0.5, verb=0.3)

# ---- mix ----------------------------------------------------------------------
pump = np.ones(N)
tt = np.arange(N) / SR
for k in kicks:
    i = int(k * SR)
    seg = tt[i : i + int(0.4 * SR)] - k
    pump[i : i + len(seg)] = np.minimum(pump[i : i + len(seg)], 1 - 0.62 * np.exp(-seg / 0.11))
for name in ("bass", "pads", "lead"):
    buses[name] *= pump

ir_t = tv(1.9)
ir = rng.standard_normal((2, len(ir_t))) * np.exp(-ir_t / 0.5)
ir = np.stack([lp(ir[0], 6000), lp(ir[1], 6000)])
verb = np.stack([fftconvolve(buses["verb"][c], ir[c])[:N] for c in range(2)]) * 0.12
verb = np.stack([hp(verb[c], 250) for c in range(2)])

levels = {"drums": 1.0, "bass": 1.0, "pads": 0.55, "lead": 0.9, "fx": 0.9}
if STEM:
    mix = buses[STEM] * levels[STEM]
else:
    mix = sum(buses[k] * v for k, v in levels.items()) + verb
mix = np.stack([hp(mix[c], 28) for c in range(2)])
# Master: aim near Instagram's loudness, then a soft limiter.
rms = np.sqrt(np.mean(mix**2))
mix *= 10 ** (-15.5 / 20) / rms
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
peak = np.max(np.abs(mix))
mix *= min(1.0, 10 ** (-1 / 20) / peak)
fade = np.minimum(1, (DUR - tt) / 0.5).clip(0, 1)
mix *= fade
wavfile.write(OUT / ("soundtrack.wav" if not STEM else f"stem-{STEM}.wav"), SR, (mix.T * 32767).astype(np.int16))
print("soundtrack", round(DUR, 2), "s, rms", round(20 * np.log10(np.sqrt(np.mean(mix**2))), 1), "dBFS, peak", round(20 * np.log10(np.max(np.abs(mix))), 2))
