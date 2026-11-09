"""Original music and sound for the welcome-pack films, synthesised here.

Nothing is sampled or licensed. A bright, modern track (112 BPM, D major:
pads, a plucked synth, a light kit, bass and glockenspiel) that stays under
the captions. Each film's cues.json (written by engine/render.mjs from the
film's timeline) places every click, tap, chime and whoosh on the frame its
animation happens. Some instrument code is shared with the Toran explainer
(media/source/soundtrack.py).

Usage: python3 music.py <film>   ->  out/<film>/soundtrack.wav
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

FILM = sys.argv[1]
OUT = Path(__file__).resolve().parent.parent / "out" / FILM
INFO = json.loads((OUT / "cues.json").read_text())
SR = 44100
DUR = INFO["duration"]
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng({"mandirs": 11, "committee": 23, "families": 37}.get(FILM, 5))

BPM = 84
BEAT = 60 / BPM
SA = 146.83  # D3
BHUPALI = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3]  # Sa Re Ga Pa Dha


def note(deg, octave=0):
    o, d = divmod(deg, 5)
    return SA * BHUPALI[d] * 2 ** (o + octave)


def add(sig, t, gain=1.0, pan=0.0, bus=None):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i] * gain
    (bus or (L, R))[0][i : i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
    (bus or (L, R))[1][i : i + len(sig)] += sig * np.sqrt((1 + pan) / 2)


def env(n, a=0.005, d=1.0):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)


def tvec(sec):
    return np.arange(int(sec * SR)) / SR


def santoor(f, sec=1.6, bright=1.0, detune=0.0012):
    """Hammered-string pluck: harmonics with faster decay up high, two
    strings detuned slightly for shimmer."""
    t = tvec(sec)
    out = np.zeros_like(t)
    for det in ((-detune, detune) if detune else (0.0,)):
        for h in range(1, 9):
            amp = (1 / h**1.15) * (bright if h > 2 else 1) * (1 if detune else 2)
            dec = 0.9 / (1 + 0.45 * h)
            out += amp * np.sin(2 * np.pi * f * h * (1 + det) * t) * np.exp(-t / dec)
    attack = rng.standard_normal(len(t)) * np.exp(-t / 0.004) * 0.15
    return (out * np.minimum(t / 0.002, 1) + attack) * 0.18


def tanpura_pluck(f, sec=3.2, shimmer=0.25):
    """Bright drone string: many harmonics with slow beating (jawari)."""
    t = tvec(sec)
    out = np.zeros_like(t)
    for h in range(1, 14):
        beat = 1 + shimmer * np.sin(2 * np.pi * (0.7 + 0.13 * h) * t)
        out += (1 / h**0.9) * beat * np.sin(2 * np.pi * f * h * t) * np.exp(-t / (1.6 / (1 + 0.08 * h)))
    return out * np.minimum(t / 0.01, 1) * 0.05


def bell(f, sec=4.0, wobble=True):
    """Temple bell (ghanti): inharmonic partials, long ring."""
    t = tvec(sec)
    out = np.zeros_like(t)
    for ratio, amp, dec in [(1, 1, 2.6), (2.0, 0.6, 1.8), (2.76, 0.5, 1.3), (5.4, 0.3, 0.7), (8.9, 0.15, 0.4)]:
        wob = 1  # steady pitch (vibrato removed: it made the bells warble)
        out += amp * np.sin(2 * np.pi * f * ratio * wob * t) * np.exp(-t / dec)
    return out * np.minimum(t / 0.002, 1) * 0.16


def pop(f=880, sec=0.18):
    """Notification blip with a quick pitch drop."""
    t = tvec(sec)
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-t / 0.02))) / SR
    return np.sin(ph) * env(len(t), 0.002, 0.05) * 0.32


def low_tone(f=110, sec=0.7):
    t = tvec(sec)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * env(len(t), 0.01, 0.25) * 0.38


def noise_sweep(sec, f0, f1, gain=0.12):
    """Whoosh: band-passed noise whose centre glides from f0 to f1."""
    n = int(sec * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    blocks = 40
    for b in range(blocks):
        a, z = b * n // blocks, (b + 1) * n // blocks
        fc = f0 * (f1 / f0) ** (b / blocks)
        sos = butter(2, [fc * 0.7, min(fc * 1.4, SR / 2 - 100)], btype="band", fs=SR, output="sos")
        out[a:z] = sosfilt(sos, x[max(0, a - 2000) : z])[-(z - a) :]
    shape = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    return out * shape * gain


def tabla(stroke):
    """Synth tabla: bayan (low, pitch-bent) and dayan (ringing)."""
    t = tvec(0.6)
    bayan = np.sin(2 * np.pi * np.cumsum(70 + 45 * np.exp(-t / 0.05)) / SR) * np.exp(-t / 0.28)
    dayan = sum(a * np.sin(2 * np.pi * 2 * SA * r * t) for r, a in [(1, 1), (2, 0.5), (3, 0.3)]) * np.exp(-t / 0.18)
    click = rng.standard_normal(len(t)) * np.exp(-t / 0.006)
    ti = rng.standard_normal(len(t)) * np.exp(-t / 0.025)
    ti = sosfilt(butter(2, 3000, btype="high", fs=SR, output="sos"), ti)
    mix = {
        "dha": 0.9 * bayan + 0.5 * dayan + 0.1 * click,
        "ge": 1.0 * bayan + 0.05 * click,
        "na": 0.6 * dayan + 0.12 * click,
        "ti": 0.35 * ti,
        "dhi": 0.7 * bayan + 0.45 * dayan + 0.1 * click,
    }[stroke]
    return mix * 0.32




def click(f=2400, sec=0.03, gain=1.0):
    """Tiny key or counter tick."""
    t = tvec(sec)
    n = sosfilt(butter(2, 2500, btype="high", fs=SR, output="sos"), rng.standard_normal(len(t)))
    return (0.5 * np.sin(2 * np.pi * f * t) + 0.3 * n) * np.exp(-t / 0.006) * 0.25 * gain


def thump(f0=90, f1=45, sec=0.9):
    """Deep hit with a falling pitch, for bad news and the drop."""
    t = tvec(sec)
    ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t / 0.08)) / SR
    return np.sin(ph) * env(len(t), 0.004, 0.32) * 0.6


def paper(sec=0.2):
    """Paper flick: a quick bright rustle."""
    n = int(sec * SR)
    x = sosfilt(butter(2, [1800, 7000], btype="band", fs=SR, output="sos"), rng.standard_normal(n))
    t = np.arange(n) / SR
    return x * np.minimum(t / 0.01, 1) * np.exp(-t / 0.05) * 0.35


def ding():
    """Two-note notification."""
    out = np.zeros(int(0.9 * SR))
    for k, f in enumerate((note(12), note(14))):
        t = tvec(0.75)
        s = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2.76 * f * t)) * env(len(t), 0.002, 0.22)
        i = int(k * BEAT / 4 * SR)
        out[i : i + len(s)] += s * 0.3
    return out


# ---- the modern layer: a soft launch-film kit, a sub and pads ----------------
def kick(gain=1.0):
    t = tvec(0.45)
    ph = 2 * np.pi * np.cumsum(46 + 90 * np.exp(-t / 0.035)) / SR
    body = np.sin(ph) * env(len(t), 0.002, 0.16)
    tick = np.zeros_like(t); c = click(3200, 0.012, 0.8); tick[: len(c)] = c
    return (body + tick) * 0.55 * gain


def clap():
    """Three quick bursts of band-passed noise, then a short tail."""
    n = int(0.3 * SR)
    x = sosfilt(butter(2, [900, 4200], btype="band", fs=SR, output="sos"), rng.standard_normal(n))
    t = np.arange(n) / SR
    e = np.exp(-t / 0.09)
    for k in range(3):
        e += 0.8 * np.exp(-np.clip(t - k * 0.011, 0, None) / 0.004) * (t >= k * 0.011)
    return x * e * 0.16


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    x = sosfilt(butter(2, 7500, btype="high", fs=SR, output="sos"), rng.standard_normal(n))
    t = np.arange(n) / SR
    return x * np.exp(-t / (0.06 if open_ else 0.012)) * 0.09


def sub(f, sec):
    t = tvec(sec)
    e = np.minimum(t / 0.03, 1) * np.minimum((sec - t) / 0.15, 1)
    return (np.sin(2 * np.pi * f * t) + 0.18 * np.sin(4 * np.pi * f * t)) * e * 0.22


PAD_LP = butter(2, 1400, btype="low", fs=SR, output="sos")


def pad(freqs, sec, attack=0.8, release=1.2):
    """Warm synth pad: detuned saws (built from harmonics), low-passed."""
    t = tvec(sec + release)
    out = np.zeros_like(t)
    for f in freqs:
        for det in (-0.0035, 0.0, 0.0035):
            for h in range(1, int(3000 / f) + 1):
                out += np.sin(2 * np.pi * f * h * (1 + det) * t + h * det * 400) / h
    out = sosfilt(PAD_LP, out)
    e = np.minimum(t / attack, 1) * np.clip((sec + release - t) / release, 0, 1)
    return out * e * 0.012 / max(1, len(freqs) ** 0.5)


def breath(sec=0.9):
    """The diya catching: a soft swell of low-passed air."""
    n = int(sec * SR)
    x = sosfilt(butter(2, [300, 2400], btype="band", fs=SR, output="sos"), rng.standard_normal(n))
    return x * np.sin(np.pi * np.linspace(0, 1, n)) ** 2 * 0.12




# ---- music ----------------------------------------------------------------
# Bright and modern, but kept under the captions: 112 BPM in D major, a
# I–V–vi–IV loop (D, A, Bm, G) a bar each. Warm pads and a plucked synth
# arpeggio carry it, with a light four-on-the-floor kit, a rounded bass, a
# glockenspiel phrase now and then, and a little room reverb. The opening
# is just pads and plucks; the kit and bass come in with the first screen;
# the dark list and end cards drop back to pads and glockenspiel so they
# breathe. The pads duck gently on every kick, as in modern pop.
from scipy.signal import fftconvolve
PAD_LP = butter(2, 2600, btype="low", fs=SR, output="sos")

BPM = 112
BEAT = 60 / BPM
BAR = 4 * BEAT
CHORDS = [
    [293.66, 369.99, 440.00, 587.33],   # D
    [277.18, 329.63, 440.00, 554.37],   # A
    [293.66, 369.99, 493.88, 587.33],   # Bm
    [293.66, 392.00, 493.88, 587.33],   # G
]
ROOTS = [146.83, 110.00, 123.47, 98.00]  # an octave up: light and rounded
GLOCK_NOTES = [1174.66, 1318.51, 1479.98, 1760.00, 1975.53, 2349.32]  # D6 E6 F#6 A6 B6 D7

PADS = (np.zeros(N), np.zeros(N))
DRUMS = (np.zeros(N), np.zeros(N))
BASSB = (np.zeros(N), np.zeros(N))
SPARK = (np.zeros(N), np.zeros(N))


def pluck_note(f, sec=0.5):
    t = tvec(sec)
    out = np.zeros_like(t)
    for h in range(1, 17):
        out += (1 / h) * np.sin(2 * np.pi * f * h * t) * np.exp(-t * (4 + 1.1 * h))
    return out * np.minimum(t / 0.003, 1) * 0.15


def bass_note(f, sec):
    t = tvec(sec + 0.08)
    e = np.minimum(t / 0.006, 1) * np.exp(-t / (sec * 0.9))
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return np.tanh(1.4 * x * e) * 0.1


def glock(f, sec=1.4):
    t = tvec(sec)
    out = np.zeros_like(t)
    for r, amp, dec in [(1, 1, 0.9), (2.76, 0.32, 0.25), (5.4, 0.12, 0.09)]:
        out += amp * np.sin(2 * np.pi * f * r * t) * np.exp(-t / dec)
    return out * np.minimum(t / 0.001, 1) * 0.09


def soft_kick(gain=1.0):
    """A short, tight kick: felt more than heard, so it never booms."""
    t = tvec(0.25)
    ph = 2 * np.pi * np.cumsum(58 + 85 * np.exp(-t / 0.025)) / SR
    body = np.sin(ph) * np.minimum(t / 0.002, 1) * np.exp(-t / 0.075)
    c = np.zeros_like(t); k = click(3400, 0.01, 1.0); c[: len(k)] = k
    return (body + c) * 0.5 * gain


def shaker():
    n = int(0.07 * SR)
    x = sosfilt(butter(2, [5000, 11000], btype="band", fs=SR, output="sos"), rng.standard_normal(n))
    t = np.arange(n) / SR
    return x * np.minimum(t / 0.012, 1) * np.exp(-t / 0.02) * 0.05


scenes = INFO["scenes"]
def section(t):
    for s in scenes:
        if s["start"] <= t < s["start"] + s["dur"]:
            return "intro" if s["kind"] == "intro" else ("night" if s["kind"] == "night" else "full")
    return "end"

duck = np.ones(N)
kick_t = []
bar = 0
while bar * BAR < DUR + BAR:
    t0 = bar * BAR
    c = bar % 4
    sec = section(t0 + 0.05)
    # pads, every bar, a touch quieter in the full groove
    add(pad(CHORDS[c], BAR, attack=0.25, release=0.6), t0, 1.0 if sec != "full" else 0.75, bus=PADS)
    # plucked arpeggio in eighths across two octaves
    order = [0, 1, 2, 3, 2, 1, 2, 3] if bar % 2 == 0 else [0, 2, 1, 3, 2, 3, 1, 2]
    for i, k in enumerate(order):
        f = CHORDS[c][k] * (2 if i in (3, 7) else 1)
        vel = 0.9 if i % 2 == 0 else 0.6
        gain = {"intro": 0.7, "full": 0.85, "night": 0.6, "end": 0.6}[sec]
        add(pluck_note(f), t0 + i * BEAT / 2, vel * gain, pan=-0.35 + 0.1 * (i % 8), bus=PADS)
    if sec == "full":
        for beat in range(4):
            tb = t0 + beat * BEAT
            add(soft_kick(0.42), tb, bus=DRUMS)
            kick_t.append(tb)
            if beat in (1, 3):
                add(clap(), tb, 0.45, pan=0.05, bus=DRUMS)
            add(hat(), tb + BEAT / 2, 0.8, pan=0.25, bus=DRUMS)
            for q in (0, 1, 2, 3):
                add(shaker(), tb + q * BEAT / 4, 1.1 if q == 2 else 0.6, pan=-0.3, bus=DRUMS)
        for at, ln in [(0, 0.45), (0.75, 0.2), (1.5, 0.45), (2.5, 0.3), (3.0, 0.45)]:
            add(bass_note(ROOTS[c], ln * BEAT * 2), t0 + at * BEAT, 1.0, bus=BASSB)
    elif sec == "intro" and bar >= 1:
        for beat in range(4):
            add(hat(), t0 + beat * BEAT + BEAT / 2, 0.35, pan=0.25, bus=DRUMS)
    # glockenspiel phrase every other two bars, softer in the groove
    if bar % 4 == 2 or sec in ("night", "end"):
        phrase = [[3, 4, 5, 3], [2, 3, 1, 0], [5, 4, 3, 2], [0, 2, 3, 4]][(bar // 2) % 4]
        for i, (at, k) in enumerate(zip([0, 1.5, 2, 3], phrase)):
            add(glock(GLOCK_NOTES[k]), t0 + at * BEAT, 0.8 if sec != "full" else 0.55, pan=0.3 - 0.2 * i, bus=SPARK)
    bar += 1

# a bright chord and a glockenspiel run to close
end_t = DUR - 5.5
add(pad(CHORDS[0], 4.0, attack=0.05, release=1.5), end_t, 1.4, bus=PADS)
for i, k in enumerate([0, 1, 2, 3, 5]):
    add(glock(GLOCK_NOTES[k], 2.2), end_t + i * 0.12, 0.8, pan=-0.3 + 0.15 * i, bus=SPARK)

# side-chain: pads and plucks dip on every kick and swell back
for tk in kick_t:
    i = int(tk * SR)
    n = int(0.32 * SR)
    if i >= N:
        continue
    seg = 1 - 0.38 * np.exp(-np.arange(min(n, N - i)) / SR / 0.09)
    duck[i : i + len(seg)] = np.minimum(duck[i : i + len(seg)], seg)

def reverb(bus, wet, seed):
    r = np.random.default_rng(seed)
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-t / 0.42)
    ir = sosfilt(butter(2, 5000, btype="low", fs=SR, output="sos"), ir)
    ir /= np.sqrt((ir ** 2).sum())
    return bus + wet * fftconvolve(bus, ir)[: len(bus)]

# keep the low end light: nothing below 45 Hz, and the bass trimmed
_hp = butter(2, 45, btype="high", fs=SR, output="sos")
DRUMS = (sosfilt(_hp, DRUMS[0]), sosfilt(_hp, DRUMS[1]))
BASSB = (sosfilt(_hp, BASSB[0]), sosfilt(_hp, BASSB[1]))
ML = PADS[0] * duck + SPARK[0] + DRUMS[0] + BASSB[0]
MR = PADS[1] * duck + SPARK[1] + DRUMS[1] + BASSB[1]
ML = reverb(PADS[0] * duck + SPARK[0], 0.35, 1) - (PADS[0] * duck + SPARK[0]) + ML
MR = reverb(PADS[1] * duck + SPARK[1], 0.35, 2) - (PADS[1] * duck + SPARK[1]) + MR

import os
if os.environ.get("STEM"):  # for checking the mix: one layer on its own
    pick = {"drums": DRUMS, "bass": BASSB, "pads": (PADS[0] * duck, PADS[1] * duck), "spark": SPARK}[os.environ["STEM"]]
    ML, MR = pick[0].copy(), pick[1].copy()
    INFO["cues"] = []

# a gentle lift above 3 kHz, for air and sparkle
_air = butter(2, 3000, btype="high", fs=SR, output="sos")
ML = ML + 0.8 * sosfilt(_air, ML)
MR = MR + 0.8 * sosfilt(_air, MR)

# ---- sound effects -----------------------------------------------------------
def soft_click():
    t = tvec(0.06)
    body = np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.008)
    n = sosfilt(butter(2, [1500, 6000], btype="band", fs=SR, output="sos"), rng.standard_normal(len(t))) * np.exp(-t / 0.004)
    return (0.5 * body + 0.4 * n) * 0.32

def tap_pop():
    t = tvec(0.12)
    ph = 2 * np.pi * np.cumsum(520 * (1 + 0.5 * np.exp(-t / 0.015))) / SR
    return np.sin(ph) * env(len(t), 0.002, 0.035) * 0.3

def chime():
    out = np.zeros(int(1.2 * SR))
    for k, f in enumerate((note(10), note(12), note(14))):
        t = tvec(0.9)
        s = (np.sin(2 * np.pi * f * t) + 0.22 * np.sin(2 * np.pi * 2.76 * f * t)) * env(len(t), 0.002, 0.3)
        i = int(k * 0.09 * SR)
        out[i : i + len(s)] += s * 0.22
    return out

for c in INFO["cues"]:
    t, k = c["t"], c["kind"]
    if k == "click":
        add(soft_click(), t, 1.0, pan=0.15)
    elif k == "tap":
        add(tap_pop(), t, 1.0, pan=0.1)
    elif k == "swap":
        add(noise_sweep(0.35, 2500, 5000, 0.035), t - 0.1, 1.0)
    elif k == "whoosh":
        add(noise_sweep(0.9, 400, 2400, 0.07), t - 0.45, 1.0)
    elif k == "chime":
        add(chime(), t, 0.9, pan=0.2)
    elif k == "tick":
        add(glock(GLOCK_NOTES[3], 1.2), t, 1.0, pan=-0.1)
    elif k == "type":
        n = max(2, int(c.get("dur", 1) * 11))
        for i in range(n):
            add(click(2600 + 400 * rng.random(), 0.025, 0.7), t + i * c.get("dur", 1) / n + rng.random() * 0.02, 0.8, pan=0.1)

# ---- master --------------------------------------------------------------------
fade_in = np.minimum(np.arange(N) / (0.6 * SR), 1)
fade_out = np.clip((DUR - np.arange(N) / SR) / 1.2, 0, 1)
music_gain = 0.62
Lm = (ML * music_gain + L) * fade_in * fade_out
Rm = (MR * music_gain + R) * fade_in * fade_out
hp = butter(1, 30, btype="high", fs=SR, output="sos")
Lm, Rm = sosfilt(hp, Lm), sosfilt(hp, Rm)
peak = max(np.abs(Lm).max(), np.abs(Rm).max())
Lm, Rm = np.tanh(Lm / peak * 1.3) / np.tanh(1.3), np.tanh(Rm / peak * 1.3) / np.tanh(1.3)
mix = np.stack([Lm, Rm], 1) * 0.89
wavfile.write(OUT / "soundtrack.wav", SR, (mix * 32767).astype(np.int16))
print("wrote", OUT / "soundtrack.wav", round(DUR, 1), "s")
