"""Original soundtrack for the Toran explainer, synthesised from scratch.

Every sound is generated here (no samples, no licensed music). Timing comes
from cues.js, the same file scene.html animates from, so each sound effect
lands on the frame its animation starts. Output: soundtrack.wav, 44.1 kHz
stereo, 60 s.
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
S = {k: T(v) for k, v in CUES["scenes"].items()}

# drone on every beat (Pa Sa' Sa' Sa), darker under the problem half
cycle = [3 / 2, 2, 2, 1]
k = 0
while T(k) < DUR - 0.5:
    t = T(k)
    vol = 0.9 if t < S["turn"] else (1.0 if t < S["end"] else 0.85)
    add(tanpura_pluck(SA * cycle[k % 4], shimmer=0.04), t, vol, pan=-0.3 + 0.2 * (k % 4))
    k += 1

# problem half: a low stroke on each bar, a quiet "na" on beat 3 from the
# second question, sparse low santoor
for bar in range(round(S["turn"] / T(4))):
    t = T(4 * bar)
    add(tabla("ge"), t, 0.75, 0.1)
    if bar >= 4:
        add(tabla("na"), t + T(2), 0.32, 0.1)
    if bar % 2 == 1:
        phrase = [(4, -1), (3, -1), (2, -1), (0, -1), (3, -1), (4, -1), (2, -1)]
        d, o = phrase[(bar // 2) % len(phrase)]
        add(santoor(note(d, o + 1), 2.2, 0.7), t + T(2.5), 0.3, -0.2)

# from the turn: full keherwa groove on eighths, with Bhupali santoor melody
pattern = ["dha", "ge", "na", "ti", "na", "ti", "dhi", "na"]
melody = [5, None, 6, None, 7, 8, 9, None, 8, None, 7, None, 6, 7, 5, None]
b = 0
while T(CUES["scenes"]["turn"] + b / 2) < S["end"] - 0.01:
    beat = CUES["scenes"]["turn"] + b / 2
    tb = T(beat)
    stroke = pattern[b % 8]
    add(tabla(stroke), tb, 0.85 if stroke in ("dha", "ge", "dhi") else 0.65, pan=0.1)
    m = melody[b % 16]
    # melody rests while the garland and the rota play their own notes
    if m is not None and (60 <= beat < 80 or 86 <= beat < 92):
        add(santoor(note(m)), tb, 0.32, pan=-0.2)
    b += 1

# ---- master: fade-out, soft limit, normalise ---------------------------------
tt = np.arange(N) / SR
fade = np.clip((DUR - tt) / (2 * BEAT * 2), 0, 1)
fade_in = np.clip(tt / 0.05, 0, 1)
stereo = np.stack([L, R], axis=1) * (fade * fade_in)[:, None]
stereo = np.tanh(stereo * 1.4) / np.tanh(1.4)
stereo *= 0.89 / np.max(np.abs(stereo))
wavfile.write(Path(__file__).with_name("soundtrack.wav"), SR, (stereo * 32767).astype(np.int16))
print("peak", np.max(np.abs(stereo)), "rms", np.sqrt(np.mean(stereo**2)))
