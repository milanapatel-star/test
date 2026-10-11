"""Original soundtrack for the Toran explainer, synthesised from scratch.

Every sound is generated here (no samples, no licensed music) and timed to
the animation in scene.html. Output: soundtrack.wav, 44.1 kHz stereo, 28 s.
"""
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
DUR = 28.0
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(7)

SA = 146.83  # D3
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


def santoor(f, sec=1.6, bright=1.0):
    """Hammered-string pluck: harmonics with faster decay up high, two
    strings detuned slightly for shimmer."""
    t = tvec(sec)
    out = np.zeros_like(t)
    for det in (-0.0012, 0.0012):
        for h in range(1, 9):
            amp = (1 / h**1.15) * (bright if h > 2 else 1)
            dec = 0.9 / (1 + 0.45 * h)
            out += amp * np.sin(2 * np.pi * f * h * (1 + det) * t) * np.exp(-t / dec)
    attack = rng.standard_normal(len(t)) * np.exp(-t / 0.004) * 0.15
    return (out * np.minimum(t / 0.002, 1) + attack) * 0.18


def tanpura_pluck(f, sec=3.2):
    """Bright drone string: many harmonics with slow beating (jawari)."""
    t = tvec(sec)
    out = np.zeros_like(t)
    for h in range(1, 14):
        beat = 1 + 0.25 * np.sin(2 * np.pi * (0.7 + 0.13 * h) * t)
        out += (1 / h**0.9) * beat * np.sin(2 * np.pi * f * h * t) * np.exp(-t / (1.6 / (1 + 0.08 * h)))
    return out * np.minimum(t / 0.01, 1) * 0.05


def bell(f, sec=4.0):
    """Temple bell (ghanti): inharmonic partials, long ring."""
    t = tvec(sec)
    out = np.zeros_like(t)
    for ratio, amp, dec in [(1, 1, 2.6), (2.0, 0.6, 1.8), (2.76, 0.5, 1.3), (5.4, 0.3, 0.7), (8.9, 0.15, 0.4)]:
        wob = 1 + 0.002 * np.sin(2 * np.pi * 4.5 * t)
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


# ---- drone across the whole piece (Pa Sa' Sa' Sa cycle) -------------------
cycle = [3 / 2, 2, 2, 1]
t = 0.0
k = 0
while t < DUR - 0.5:
    vol = 1.0
    if 3.4 < t < 13.0:
        vol = 0.9  # darker, quieter under the problem scenes
    add(tanpura_pluck(SA * cycle[k % 4]), t, vol, pan=-0.3 + 0.2 * (k % 4))
    t += 0.65
    k += 1

# ---- 1. opening: bell + one santoor note per garland drop -----------------
add(bell(note(10)), 0.05, 0.8)
for i in range(11):
    add(santoor(note(5 + i)), 0.5 + 0.06 * i, 0.55, pan=-0.6 + 0.12 * i)
add(santoor(note(5), 2.2), 0.95, 0.5)  # under the wordmark
add(santoor(note(7), 2.2), 0.95, 0.35)
add(santoor(note(8), 2.2), 1.55, 0.4)  # under the tagline

# ---- 2. scattered sources ----------------------------------------------------
add(noise_sweep(0.6, 3000, 300, 0.10), 3.0)  # into the dark
add(low_tone(73.4), 3.45, 0.8)
for i, f in enumerate([1046, 880, 1174, 932, 988]):  # slightly clashing pops
    add(pop(f), 4.3 + 0.38 * i, 1.0, pan=[-0.5, 0.5, -0.4, 0.4, -0.2][i])
add(pop(1318, 0.12), 5.85, 0.6, 0.6)
add(pop(1108, 0.12), 6.05, 0.6, -0.6)
add(low_tone(65.4, 1.2), 6.6, 1.0)
add(noise_sweep(0.7, 400, 2500, 0.08), 7.9)

# ---- 3. consequences: falling tones as the rota goes red ---------------------
add(low_tone(98.0), 8.7, 0.7)
add(low_tone(92.5), 9.6, 0.7)
for i, f in enumerate([622, 587, 554, 523]):
    add(pop(f, 0.25), 10.6 + 0.12 * i, 0.7, pan=-0.3 + 0.2 * i)
for k in range(3):  # "11 short" two-note alert
    add(pop(740, 0.14), 11.25 + 0.42 * k, 0.55)
    add(pop(698, 0.14), 11.42 + 0.42 * k, 0.55)

# ---- transition: whoosh up, phone rises, sources fly in ----------------------
add(noise_sweep(1.1, 250, 6000, 0.16), 12.8)
for i in range(6):
    add(santoor(note(10 + i * 2 % 5)), 13.75 + 0.07 * i, 0.3, pan=-0.5 + 0.2 * i)

# ---- 4 + 5. the groove: keherwa-style tabla + Bhupali santoor --------------
BEAT = 0.6
start = 13.9
pattern = ["dha", "ge", "na", "ti", "na", "ti", "dhi", "na"]
melody = [5, None, 6, None, 7, 8, 9, None, 8, None, 7, None, 6, 7, 5, None]
b = 0
while start + b * BEAT / 2 < 23.5:
    tb = start + b * BEAT / 2
    stroke = pattern[b % 8]
    add(tabla(stroke), tb, 0.9 if stroke in ("dha", "ge", "dhi") else 0.7, pan=0.1)
    m = melody[b % 16]
    if m is not None and tb > 14.3:
        add(santoor(note(m)), tb, 0.38, pan=-0.2)
    b += 1
for i in range(4):  # event cards slide in
    add(pop(1568, 0.08), 14.55 + 0.22 * i, 0.35, 0.4)
add(noise_sweep(0.5, 800, 3000, 0.06), 19.0)  # screen swap

# tap, then success chimes as each slot row fills
add(pop(1760, 0.06), 20.52, 0.8)
add(tabla("ti"), 20.52, 0.5)
for i in range(4):
    add(santoor(note(10 + i), 1.2, 1.3), 21.8 + 0.18 * i, 0.55, pan=-0.3 + 0.2 * i)
add(santoor(note(15), 2.0, 1.3), 22.6, 0.5)

# ---- 6. end card: whoosh, bell, final chord, fade -----------------------------
add(noise_sweep(0.8, 5000, 400, 0.10), 23.2)
for i in range(11):
    add(santoor(note(5 + i)), 24.2 + 0.06 * i, 0.4, pan=-0.6 + 0.12 * i)
add(bell(note(5)), 24.4, 1.0)
for d in (0, 2, 3, 5):  # Sa Ga Pa Sa' chord
    add(santoor(note(d), 3.5), 25.1, 0.45)
add(bell(note(10)), 25.6, 0.5)

# ---- master: gentle fade-out, soft limit, normalise ---------------------------
tt = np.arange(N) / SR
fade = np.clip((DUR - tt) / 1.8, 0, 1)
fade_in = np.clip(tt / 0.05, 0, 1)
stereo = np.stack([L, R], axis=1) * (fade * fade_in)[:, None]
stereo = np.tanh(stereo * 1.4) / np.tanh(1.4)
stereo *= 0.89 / np.max(np.abs(stereo))
wavfile.write("soundtrack.wav", SR, (stereo * 32767).astype(np.int16))
print("peak", np.max(np.abs(stereo)), "rms", np.sqrt(np.mean(stereo**2)))
