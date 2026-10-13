"""Synthesise the soundtrack: tanpura drone, temple bells, chimes, arrow whoosh + impact.

Cue times match src/timeline.ts (30 fps).
"""
import wave
import numpy as np

SR = 44100
DUR = 12.0
FPS = 30
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
out = np.zeros((N, 2))


def add(sig, at, pan=0.0, gain=1.0):
    i = int(at * SR)
    sig = sig[: max(0, N - i)] * gain
    out[i : i + len(sig), 0] += sig * (1 - pan) ** 0.5
    out[i : i + len(sig), 1] += sig * (1 + pan) ** 0.5


def env(n, attack, decay):
    x = np.arange(n) / SR
    return np.minimum(x / max(attack, 1e-4), 1) * np.exp(-x / decay)


def bandpass_noise(n, lo, hi):
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    x = np.fft.irfft(spec, n)
    return x / (np.abs(x).max() + 1e-9)


def tanpura_pluck(f0, length=4.0):
    n = int(SR * length)
    x = np.arange(n) / SR
    sig = np.zeros(n)
    for k in range(1, 16):
        # Jawari buzz: upper harmonics bloom slightly after the pluck.
        bloom = 1 - np.exp(-x * (2 + k * 0.6))
        sig += np.sin(2 * np.pi * f0 * k * x * (1 + 0.0004 * k)) / k * (0.4 + 0.6 * bloom) * np.exp(-x / (2.6 - k * 0.1))
    return sig * env(n, 0.01, 3.0)


def bell(f0, length=6.0):
    n = int(SR * length)
    x = np.arange(n) / SR
    sig = np.zeros(n)
    for ratio, amp, dec in [(0.5, 0.6, 4.0), (1, 1.0, 3.0), (1.19, 0.5, 2.2), (1.56, 0.45, 1.8),
                            (2.0, 0.4, 1.5), (2.51, 0.25, 1.0), (3.01, 0.2, 0.7), (4.1, 0.12, 0.4)]:
        sig += amp * np.sin(2 * np.pi * f0 * ratio * x + rng.uniform(0, 6)) * np.exp(-x / dec)
    sig *= 1 + 0.15 * np.sin(2 * np.pi * 3.2 * x)  # beating shimmer
    return sig * env(n, 0.002, 10) / 3


def chime(f0, length=1.6):
    n = int(SR * length)
    x = np.arange(n) / SR
    sig = sum(np.sin(2 * np.pi * f0 * r * x) * a for r, a in [(1, 1), (2.76, 0.4), (5.4, 0.2)])
    return sig * env(n, 0.001, 0.45) / 1.6


def whoosh(length, lo, hi):
    n = int(SR * length)
    sig = bandpass_noise(n, lo, hi)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    return sig * shape


def boom(length=2.5):
    n = int(SR * length)
    x = np.arange(n) / SR
    f = 38 + 50 * np.exp(-x * 9)
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.9)
    sig += 0.5 * bandpass_noise(n, 40, 900) * np.exp(-x / 0.25)
    return sig


sec = lambda frame: frame / FPS

# Drone: Pa - Sa - Sa - low Sa cycle in D, entering under the intro.
D = 146.83
pattern = [D * 0.75, D, D, D / 2]
step = 0.75
for i, tt in enumerate(np.arange(0.2, DUR, step)):
    add(tanpura_pluck(pattern[i % 4]), tt, pan=0.25 * (-1) ** i, gain=0.09)
# Pad swell underneath.
pad = sum(np.sin(2 * np.pi * f * t) for f in (D / 2, D * 0.75, D, D * 1.5)) / 4
out += (pad * 0.05 * np.clip(t / 3, 0, 1))[:, None]

add(whoosh(1.9, 200, 3000) * np.linspace(0.2, 1, int(SR * 1.9)), 0.0, gain=0.22)  # intro riser
add(bell(D * 2), sec(55), gain=0.55)                                             # reveal bell
add(boom(1.6), sec(55), gain=0.35)
for f, fr, pan in [(D * 8, 72, 0.4), (D * 12, 78, 0.5), (D * 10, 104, 0.3), (D * 16, 110, 0.4), (D * 12, 140, 0.2)]:
    add(chime(f), sec(fr), pan=pan, gain=0.12)                                   # logo/title/quote glints
add(whoosh(0.35, 1500, 9000), sec(193), pan=0.3, gain=0.35)                      # arrow release
add(boom(), sec(205), pan=0.4, gain=0.7)                                         # impact on Ravana
add(bell(D * 3), sec(207), pan=0.2, gain=0.35)
add(whoosh(1.2, 300, 6000), sec(288), gain=0.18)                                 # finale sweep
add(bell(D * 2), sec(300), gain=0.5)
for i, f in enumerate([D * 8, D * 10, D * 12, D * 16]):
    add(chime(f), sec(306 + i * 5), pan=-0.4 + i * 0.25, gain=0.1)

fade = np.clip((DUR - t) / 1.2, 0, 1) * np.clip(t / 0.3, 0, 1)
out *= fade[:, None]
out /= np.abs(out).max() / 0.89
pcm = (out * 32767).astype(np.int16)
with wave.open("public/soundtrack.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote public/soundtrack.wav")
