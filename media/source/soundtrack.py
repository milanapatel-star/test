"""Original soundtrack for the Toran explainer, synthesised from scratch.

Every sound is generated here (no samples, no licensed music). Timing comes
from cues.js, the same file scene.html animates from, so each sound effect
lands on the frame its animation starts. Output: soundtrack.wav, 44.1 kHz
stereo, 75 s.
"""
import json
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
CUES = json.loads(Path(__file__).with_name("cues.js").read_text().split("=", 1)[1].strip().rstrip(";"))
BEAT = 60 / CUES["bpm"]  # 100 BPM: 0.6 s a beat, 2.4 s a bar
DUR = CUES["beats"] * BEAT
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(7)

SA = 146.83  # D3


def T(b):
    """Seconds at beat b."""
    return b * BEAT


def cue(name):
    """Times (seconds) of a cue from cues.js."""
    return [T(b) for b in CUES[name]["at"]]


BHUPALI = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3]  # Sa Re Ga Pa Dha


def note(deg, octave=0):
    """Frequency of a Bhupali scale degree (0-4), wrapping into octaves."""
    o, d = divmod(deg, 5)
    return SA * BHUPALI[d] * 2 ** (o + octave)


def add(sig, t, gain=1.0, pan=0.0):
    """Mix a mono signal in at time t (seconds), pan -1 (left) .. 1 (right)."""
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i : i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
    R[i : i + len(sig)] += sig * np.sqrt((1 + pan) / 2)


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


# ---- sound effects, one per cue in cues.js ----------------------------------
def sfx(kind, t, i, n):
    pan = [-0.35, 0.35][i % 2]
    if kind == "type":
        add(click(2200 + 150 * (i % 3)), t, 0.8, pan * 0.5)
    elif kind == "msg":
        add(pop([880, 988, 1046, 1174, 932, 1108, 1318, 1046, 1174][i % 9]), t, 0.75, pan)
    elif kind == "reply":  # each reply a little quieter: nobody is really answering
        add(pop(1046 - 40 * i), t, 0.8 - 0.12 * i, pan)
    elif kind == "fallPop":
        add(pop([622, 587, 554, 523][i], 0.25), t, 0.7, -0.3 + 0.2 * i)
    elif kind == "warn":
        add(pop(740, 0.14), t, 0.6)
        add(pop(622, 0.18), t + BEAT / 4, 0.6)
    elif kind == "pop":
        add(pop(1046), t, 0.7, pan)
    elif kind == "paper":
        add(paper(), t - 0.03, 1.0, pan)
        add(tabla("na"), t, 0.35, pan)
    elif kind == "blip":
        add(pop(1568 + 60 * (i % 4), 0.08), t, 0.4, pan * 0.6)
    elif kind == "tap":
        add(pop(1760, 0.06), t, 0.8)
        add(tabla("ti"), t, 0.5)
    elif kind == "low":
        add(low_tone(73.4, 1.2), t, 0.7)
    elif kind == "thud":
        add(thump(), t, 1.0)
        add(low_tone(61.7, 1.4), t, 0.6)
    elif kind == "chime":
        add(santoor(note(10), 1.6, 1.2), t, 0.45, pan)
        add(santoor(note(12), 1.6, 1.2), t + BEAT / 4, 0.4, pan)
        add(bell(note(15), 2.0), t, 0.18)
    elif kind == "santoorRun":
        add(santoor(note(5 + i), detune=0), t, 0.5, -0.6 + 1.2 * i / max(n - 1, 1))
    elif kind == "rise":  # one note higher for every row that fills
        add(santoor(note(10 + 2 * i), 1.4, 1.3), t, 0.6, -0.3 + 0.3 * i)
    elif kind == "chord":
        for d in (0, 2, 3, 5):  # Sa Ga Pa Sa'
            add(santoor(note(d + 5), 2.8), t, 0.4)
        add(bell(note(10), 2.5), t, 0.3)
    elif kind == "ding":
        add(ding(), t, 1.0, 0.2)
    elif kind == "whoosh":
        add(noise_sweep(0.6, 3000, 300, 0.10), t - 0.1)
    elif kind == "whooshUp":
        add(noise_sweep(0.6, 300, 3500, 0.10), t - 0.1)
    elif kind == "swish":
        add(noise_sweep(0.35, 1500, 5000, 0.06), t - 0.05, 1.0, pan)
    elif kind == "swoosh":
        add(noise_sweep(0.5, 400, 4000, 0.12), t - 0.05, 1.0, -0.5)
    elif kind == "snap":
        add(click(3000, 0.04, 1.6), t)
        add(tabla("na"), t, 0.6)
        add(thump(140, 70, 0.4), t, 0.5)
    elif kind == "bell":
        add(bell(note(5)), t, 1.0)
        add(bell(note(10)), t + 2 * BEAT, 0.4)
    elif kind == "drop":
        add(bell(note(5)), t, 1.0)
        add(thump(110, 42, 1.4), t, 0.9)
        add(noise_sweep(0.9, 6000, 500, 0.07), t)
    elif kind == "flame":
        add(breath(), t - 0.25, 1.0)
        add(santoor(note(15), 2.4, 0.8), t + 0.15, 0.22, 0.2)
        add(bell(note(10), 3.5), t + 0.15, 0.12)
    elif kind == "pluck":  # one santoor note for each word of the opening
        add(santoor(note([5, 7, 8, 9][i % 4]), 2.0, 0.9), t, 0.36, -0.3 + 0.2 * i)
    elif kind == "santoorRun3":  # one note for each letter of TORAN as it lands
        for j in range(5):
            add(santoor(note(10 + j), 1.4, 1.1, detune=0), t + j * 0.06, 0.32, -0.5 + 0.25 * j)
    elif kind == "hit":  # each value line lands on the downbeat
        add(kick(1.0), t)
        add(thump(120, 50, 0.6), t, 0.25)
        for d in (0, 2, 3):
            add(santoor(note(d + 5 + (i % 2) * 0), 1.8, 1.0), t, 0.22)
        add(bell(note(10 + [0, 2, 3, 4, 5][i % 5]), 1.6), t, 0.12, [-0.4, 0.4][i % 2])
    else:
        raise ValueError(kind)


for name, c in CUES.items():
    if not isinstance(c, dict) or "sfx" not in c or not c["sfx"]:
        continue
    times = cue(name)
    if c["sfx"] == "ticks":  # the unread counter ticks on every sixteenth
        a, b = times
        for j in range(round((b - a) / (BEAT / 4)) + 1):
            add(click(2800, 0.02), a + j * BEAT / 4, 0.55, 0.3)
        continue
    if c["sfx"] == "scan":  # a light sweep while the poster is read
        a, b = times
        add(noise_sweep(b - a, 600, 6000, 0.035), a)
        tt_ = tvec(b - a)
        glide = np.sin(2 * np.pi * np.cumsum(note(15) * (1 + 0.5 * tt_ / (b - a))) / SR) * np.sin(np.pi * tt_ / (b - a)) * 0.04
        add(glide, a, 1.0, 0.3)
        continue
    if c["sfx"] == "riser":
        a, b = times
        add(noise_sweep(b - a, 250, 7000, 0.05) * np.linspace(0.3, 1.6, int((b - a) * SR)), a)
        for j in range(8):  # climbing santoor, eighths over the last bar and a half
            add(santoor(note(j), 1.0, detune=0), b - 8 * BEAT / 2 + j * BEAT / 2 - 2 * BEAT, 0.12 + 0.03 * j, 0.4)
        for j in range(8):  # tabla roll in sixteenths into the drop
            add(tabla("na" if j % 2 else "ge"), b - 2 * BEAT + j * BEAT / 4, 0.3 + 0.06 * j)
        continue
    kinds = c["sfx"] if isinstance(c["sfx"], list) else [c["sfx"]] * len(times)
    for i, (k, t) in enumerate(zip(kinds, times)):
        sfx(k, t, i, len(times))

# ---- music ------------------------------------------------------------------
# Traditional instruments carry it (tanpura, santoor in Raag Bhupali, tabla,
# temple bells); a soft launch-film layer (kick, clap, hats, sub, pads) sits
# under them once Toran arrives, as in modern product films.
SB = CUES["scenes"]  # scene starts in beats
S = {k: T(v) for k, v in SB.items()}

# drone on every beat (Pa Sa' Sa' Sa), quieter under the problem half
cycle = [3 / 2, 2, 2, 1]
k = 0
while T(k) < DUR - 0.5:
    t = T(k)
    vol = 0.9 if t < S["turn"] else (0.9 if t < S["end"] else 0.8)
    add(tanpura_pluck(SA * cycle[k % 4], shimmer=0.04), t, vol, pan=-0.3 + 0.2 * (k % 4))
    k += 1

# the opening: one soft pad under the diya
add(pad([note(0), note(2), note(3)], T(SB["mess"] - 1)), T(0.5), 0.8)

# the problem: a low stroke each bar, a quiet "na" once the mess builds, a
# muffled heartbeat once the mandir needs help, sparse low santoor
for bar in range(round(SB["turn"] / 4)):
    t = T(4 * bar)
    if bar >= 2:
        add(tabla("ge"), t, 0.7, 0.1)
    if bar >= 4:
        add(tabla("na"), t + T(2), 0.3, 0.1)
    if bar % 2 == 1:
        phrase = [(4, -1), (3, -1), (2, -1), (0, -1), (3, -1), (4, -1), (2, -1)]
        d, o = phrase[(bar // 2) % len(phrase)]
        add(santoor(note(d, o + 1), 2.2, 0.7), t + T(2.5), 0.26, -0.2)
# a low, uneasy pad under the mess (Sa and Pa, no third)
add(pad([note(0, -1), note(3, -1), note(0)], T(SB["turn"] - SB["mess"]), 2.0, 0.6), S["mess"], 1.6)
for bt in range(SB["help"], SB["turn"]):
    add(kick(0.35), T(bt), 1.0)

# the turn: one wide chord under the logo
add(pad([note(0), note(2), note(3), note(5)], T(SB["find"] - SB["turn"])), S["turn"], 1.4)
add(sub(note(0, -1), T(SB["find"] - SB["turn"])), S["turn"], 1.0)

# Toran in use: the groove, beat 36 to the end card
CHORDS = [  # Bhupali only (Sa Re Ga Pa Dha): two bars each
    ([0, 1, 2, 3], 0),     # D add9
    ([-1, 0, 2, 3], -1),   # B minor 7
    ([3, 4, 6], -2),       # A sus2
    ([0, 2, 3, 4], 0),     # D6
]
ROOT = {0: note(0, -1), -1: note(4, -2), -2: note(3, -2)}
g0, g1 = SB["find"], SB["end"]
for j, bt in enumerate(range(g0, g1, 8)):
    degs, root = CHORDS[j % 4]
    sec = T(min(8, g1 - bt))
    full = bt >= SB["values"]
    add(pad([note(d) for d in degs], sec, 0.4, 0.8), T(bt), 1.35 if full else 1.1)
    for half in range(0, min(8, g1 - bt), 2):  # the sub pulses on the half bar
        add(sub(ROOT[root], T(1.8)), T(bt + half), 1.1 if full else 0.85)

pattern = ["dha", "ge", "na", "ti", "na", "ti", "dhi", "na"]
QUIET = [  # where the melody rests so the cue notes are heard
    (CUES["tapTake"]["at"][0] - 1, CUES["full"]["at"][0] + 2),
    (CUES["drafts"]["at"][0] - 1, CUES["live"]["at"][0] + 1.5),
]
melody = [5, None, 6, None, 7, 8, 9, None, 8, None, 7, None, 6, 7, 5, None]
e = 0
while g0 + e / 2 < g1:
    beat = g0 + e / 2
    tb = T(beat)
    full = beat >= SB["values"]
    if e % 2 == 0:
        q = (e // 2) % 4
        if q in (0, 2):
            add(kick(1.0 if full else 0.8), tb)
        else:
            add(clap(), tb, 1.0 if full else 0.75, 0.05)
    if e % 16 == 15:  # a pickup into each new two-bar chord
        add(kick(0.5), tb)
    add(hat(open_=e % 4 == 3), tb, 0.9 if full else 0.6, 0.35)
    stroke = pattern[e % 8]
    add(tabla(stroke), tb, (0.6 if stroke in ("dha", "ge", "dhi") else 0.45) * (1.3 if full else 1.0), pan=-0.1)
    m = melody[e % 16]
    # the melody rests while the seva rota and the drafts play their own notes
    if m is not None and not (QUIET[0][0] <= beat < QUIET[0][1] or QUIET[1][0] <= beat < QUIET[1][1]):
        add(santoor(note(m)), tb, 0.3 if full else 0.2, pan=-0.2)
    e += 1

# the end card: the last chord rings out under the bell
add(pad([note(0), note(2), note(3), note(5)], T(6), 0.3, 2.5), S["end"], 1.3)
add(sub(note(0, -1), T(4)), S["end"], 1.0)

# ---- master: fade-out, soft limit, normalise ---------------------------------
tt = np.arange(N) / SR
fade = np.clip((DUR - tt) / (2 * BEAT * 2), 0, 1)
fade_in = np.clip(tt / 0.05, 0, 1)
stereo = np.stack([L, R], axis=1) * (fade * fade_in)[:, None]
stereo = np.tanh(stereo * 1.4) / np.tanh(1.4)
stereo *= 0.89 / np.max(np.abs(stereo))
wavfile.write(Path(__file__).with_name("soundtrack.wav"), SR, (stereo * 32767).astype(np.int16))
print("peak", np.max(np.abs(stereo)), "rms", np.sqrt(np.mean(stereo**2)))
