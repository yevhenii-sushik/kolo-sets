"""
Kolo sound set — procedural synthesis.

Usage:  python3 synth.py            -> out/wav/*.wav (24-bit masters) + public/sounds/*.mp3 (128 kbps)
        python3 synth.py answer-correct level-up   -> rebuild only these

Everything is in C major pentatonic (C D E G A). One palette:
  marimba / kalimba  -> frequent sounds
  glass bell/celesta -> rewards
  air whistle        -> everything "orbital"
Each sound is a function below; tweak numbers and rerun.
"""
import os, sys, subprocess, json
import numpy as np
import scipy.signal as ss
import soundfile as sf

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_WAV = os.path.join(HERE, "out", "wav")
OUT_MP3 = os.path.join(HERE, "..", "..", "public", "sounds")  # straight into the app

# ---------------------------------------------------------------- helpers
_NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}

def hz(n):
    m = _NOTE[n[0]] + 12 * (int(n[1:]) + 1)
    return 440.0 * 2 ** ((m - 69) / 12)

PENTA_MIDI = [m for m in range(36, 110) if m % 12 in (0, 2, 4, 7, 9)]
def mhz(m): return 440.0 * 2 ** ((m - 69) / 12)

def rng(seed): return np.random.default_rng(seed)

def buf(d): return np.zeros(int(round(d * SR)))

def add(b, sig, at=0.0, gain=1.0):
    i = int(round(at * SR))
    n = min(len(sig), len(b) - i)
    if n > 0:
        b[i:i + n] += gain * sig[:n]
    return b

def tt(d): return np.arange(int(round(d * SR))) / SR

def env(d, att, tau):
    """raised-cosine attack, exponential decay"""
    t = tt(d)
    att = max(att, 1.0 / SR)
    e = np.exp(-np.maximum(t - att, 0) / tau)
    a = t < att
    e[a] = 0.5 - 0.5 * np.cos(np.pi * t[a] / att)
    return e

def bp(x, lo, hi, order=2):
    sos = ss.butter(order, [lo, min(hi, SR / 2 * 0.95)], "bandpass", fs=SR, output="sos")
    return ss.sosfilt(sos, x)

def lp(x, fc, order=2):
    return ss.sosfilt(ss.butter(order, fc, "lowpass", fs=SR, output="sos"), x)

def hp(x, fc, order=2):
    return ss.sosfilt(ss.butter(order, fc, "highpass", fs=SR, output="sos"), x)

def noise(d, seed=0): return rng(seed).standard_normal(int(round(d * SR)))

def partials(f, d, specs, att=0.0015, detune_cents=0.0):
    """specs: list of (ratio, amp, tau)"""
    t = tt(d)
    out = np.zeros_like(t)
    for r, a, tau in specs:
        fr = f * r
        if fr > SR * 0.45:
            continue
        e = env(d, att, tau)
        s = np.sin(2 * np.pi * fr * t)
        if detune_cents:
            s = 0.5 * s + 0.5 * np.sin(2 * np.pi * fr * 2 ** (detune_cents / 1200) * t)
        out += a * e * s
    return out

# ---------------------------------------------------------------- instruments
def marimba(f, d=0.4, tau=0.15, bright=1.0, mallet=0.12, seed=1):
    s = partials(f, d, [(1, 1.0, tau), (3.99, 0.30 * bright, tau * 0.28), (9.85, 0.08 * bright, tau * 0.10)],
                 att=0.0012)
    n = lp(noise(0.012, seed), 1800 + 2200 * bright) * env(0.012, 0.0005, 0.0025)
    return add(s, n, 0, mallet)

def kalimba(f, d=0.5, tau=0.25, seed=2):
    s = partials(f, d, [(1, 1.0, tau), (5.9, 0.16, tau * 0.22), (13.2, 0.04, tau * 0.08)], att=0.0008)
    n = bp(noise(0.008, seed), 1500, 6000) * env(0.008, 0.0003, 0.0015)
    return add(s, n, 0, 0.06)

def bell(f, d=1.0, tau=0.4, glass=0.3, strike=0.05, seed=3):
    """celesta/glass bell: mostly harmonic + a bit of inharmonic glass, slow shimmer from detuned twins"""
    specs = [(1, 1.0, tau), (2.0, 0.32, tau * 0.55), (3.0, 0.10, tau * 0.35),
             (2.76, 0.28 * glass, tau * 0.45), (5.40, 0.14 * glass, tau * 0.22), (8.93, 0.06 * glass, tau * 0.12)]
    s = partials(f, d, specs, att=0.0010, detune_cents=1.8)
    n = hp(noise(0.006, seed), 4000) * env(0.006, 0.0002, 0.0012)
    return add(s, n, 0, strike)

def pad(freqs, d, att=0.3, rel=0.6, bright=0.4, shimmer=0.0, shimmer_hz=6.0, seed=4):
    t = tt(d)
    r = rng(seed)
    out = np.zeros_like(t)
    for f in freqs:
        for dc in (-6, 0, 6):
            ff = f * 2 ** (dc / 1200)
            for h in range(1, 9):
                if ff * h > 9000:
                    break
                out += (1.0 / h) ** (2.2 - bright) * np.sin(2 * np.pi * ff * h * t + r.uniform(0, 2 * np.pi))
    e = np.ones_like(t)
    na, nr = int(att * SR), int(rel * SR)
    e[:na] = 0.5 - 0.5 * np.cos(np.pi * np.arange(na) / na)
    e[-nr:] *= 0.5 + 0.5 * np.cos(np.pi * np.arange(nr) / nr)
    if shimmer:
        e *= 1 - shimmer * (0.5 + 0.5 * np.sin(2 * np.pi * shimmer_hz * t))
    return out * e / (3 * len(freqs))

def choir(freqs, d, att=0.25, rel=0.7, seed=5):
    """'ah' pad: harmonics weighted by two formants, gentle vibrato"""
    t = tt(d)
    r = rng(seed)
    out = np.zeros_like(t)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t + r.uniform(0, 6))
    for f in freqs:
        for dc in (-8, 8):
            ph = 2 * np.pi * np.cumsum(f * 2 ** (dc / 1200) * vib) / SR
            for h in range(1, 30):
                fh = f * h
                if fh > 5000:
                    break
                w = np.exp(-((fh - 700) / 220) ** 2) + 0.6 * np.exp(-((fh - 1150) / 260) ** 2) + 0.15 / h
                out += w * np.sin(h * ph + r.uniform(0, 6))
    e = np.ones_like(t)
    na, nr = int(att * SR), int(rel * SR)
    e[:na] = 0.5 - 0.5 * np.cos(np.pi * np.arange(na) / na)
    e[-nr:] *= 0.5 + 0.5 * np.cos(np.pi * np.arange(nr) / nr)
    return out * e / (2 * len(freqs))

def whistle(fc_path, q=6.0, seed=6, tone=0.25):
    """airy resonant whistle; fc_path = per-sample centre frequency"""
    n = len(fc_path)
    x = rng(seed).standard_normal(n)
    low = band = 0.0
    damp = 1.0 / q
    y = np.empty(n)
    fcoef = 2 * np.sin(np.pi * np.clip(fc_path, 20, SR / 7) / SR)
    for i in range(n):  # Chamberlin state-variable filter
        f = fcoef[i]
        low += f * band
        high = x[i] - low - damp * band
        band += f * high
        y[i] = band
    y /= np.max(np.abs(y)) + 1e-9
    ph = 2 * np.pi * np.cumsum(fc_path) / SR
    return y + tone * np.sin(ph)

def sparkles(d, count, lo=84, hi=105, amp=0.25, seed=7, t0=0.0, t1=None):
    r = rng(seed)
    b = buf(d)
    t1 = d * 0.8 if t1 is None else t1
    notes = [m for m in PENTA_MIDI if lo <= m <= hi]
    for k in range(count):
        at = r.uniform(t0, t1)
        f = mhz(r.choice(notes))
        tau = r.uniform(0.04, 0.12)
        a = amp * r.uniform(0.35, 1.0) * (1 - 0.6 * (at - t0) / max(t1 - t0, 1e-3))
        add(b, partials(f, tau * 5, [(1, 1, tau), (2.76, 0.2, tau * 0.4)], att=0.0006), at, a)
    return b

def click(d=0.01, lo=2000, hi=9000, tau=0.0015, seed=8):
    return bp(noise(d, seed), lo, hi) * env(d, 0.0002, tau)

def thump(f0, f1, d=0.2, tau=0.06, sweep=0.05):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / sweep)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.002, tau)

# ---------------------------------------------------------------- 1. answers & cards
def answer_correct():
    # fifth up: G5 -> D6, marimba, dry
    b = buf(0.22)
    add(b, marimba(hz("G5"), 0.22, tau=0.055, bright=0.8, mallet=0.10, seed=11), 0.0, 0.85)
    add(b, marimba(hz("D6"), 0.16, tau=0.060, bright=0.8, mallet=0.10, seed=12), 0.065, 1.0)
    return b

def answer_wrong():
    # muted wooden "tuk" down a fourth: A3 -> E3 (consonant, no buzzer)
    b = buf(0.21)
    add(b, marimba(hz("A3"), 0.21, tau=0.045, bright=0.45, mallet=0.25, seed=21), 0.0, 1.0)
    add(b, marimba(hz("E3"), 0.14, tau=0.050, bright=0.40, mallet=0.25, seed=22), 0.075, 0.9)
    add(b, bp(noise(0.03, 23), 300, 1100) * env(0.03, 0.0005, 0.006), 0.0, 0.25)
    return lp(b, 2200)

def card_flip():
    d = 0.10
    t = tt(d)
    n = bp(noise(d, 31), 1400, 7500)
    flutter = 0.6 + 0.4 * np.abs(lp(noise(d, 32), 180)) / 0.1
    e = (t / 0.016) * np.exp(1 - t / 0.016) + 0.5 * np.clip((t - 0.040) / 0.012, 0, None) * np.exp(1 - np.clip((t - 0.040) / 0.012, 0, None)) * (t > 0.040)
    return n * np.clip(flutter, 0, 2) * e

def card_next():
    # neutral tick + short swipe; pitch shifted in code via playbackRate
    d = 0.13
    t = tt(d)
    b = buf(d)
    add(b, partials(1400, 0.05, [(1, 1, 0.010), (2.6, 0.3, 0.004)], att=0.0006), 0, 0.5)
    add(b, click(0.01, 2500, 7000, 0.0012, 41), 0, 0.5)
    sw_d = 0.11
    st = tt(sw_d)
    sw = bp(noise(sw_d, 42), 1500, 6500)
    sw *= np.sin(np.pi * np.clip(st / sw_d, 0, 1)) ** 2
    add(b, sw, 0.015, 0.35)
    return b

# ---------------------------------------------------------------- 2. games
def ui_tap():
    d = 0.05
    t = tt(d)
    f = 480 + 700 * np.exp(-t / 0.008)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.0004, 0.010) + 0.3 * click(d, 3000, 9000, 0.0008, 51)

def streak_up():
    # G5-D6-G6 (root-fifth-octave). Transpositions +2/+5/+7 st stay in C pentatonic.
    b = buf(0.36)
    for i, (n, tau) in enumerate([("G5", 0.09), ("D6", 0.09), ("G6", 0.16)]):
        at = i * 0.058
        add(b, bell(hz(n), 0.36 - at, tau=tau, glass=0.2, strike=0.03, seed=60 + i), at, 0.55)
        add(b, marimba(hz(n), 0.2, tau=tau * 0.7, bright=0.9, mallet=0.06, seed=63 + i), at, 0.45)
    return b

def timer_tick():
    d = 0.045
    s = partials(hz("G5"), d, [(1, 1.0, 0.007), (2.71, 0.35, 0.003), (5.2, 0.1, 0.0015)], att=0.0004)
    return s + 0.25 * click(d, 1500, 6000, 0.001, 71)

def time_up():
    b = buf(0.85)
    add(b, bell(hz("G5"), 0.85, tau=0.28, glass=0.15, strike=0.02, seed=81), 0.0, 0.9)
    add(b, bell(hz("C5"), 0.57, tau=0.32, glass=0.15, strike=0.02, seed=82), 0.28, 1.0)
    return lp(b, 5000)

def life_lost():
    # heartbeat "lub-dub", low and soft; C3 body so phone speakers still hear it
    b = buf(0.28)
    for at, g in ((0.0, 1.0), (0.135, 0.65)):
        add(b, thump(150, hz("C2"), 0.14, tau=0.045, sweep=0.02), at, g)
        add(b, partials(hz("C3"), 0.12, [(1, 1, 0.03), (2, 0.4, 0.02)], att=0.002), at, 0.35 * g)
        add(b, lp(noise(0.05, 90 + int(at * 100)), 400) * env(0.05, 0.001, 0.01), at, 0.6 * g)
    return lp(b, 1200)

def game_over():
    # G5 -> E5 -> C5: lands on the tonic, resolved, friendly
    b = buf(1.1)
    for i, (n, tau) in enumerate([("G5", 0.16), ("E5", 0.18), ("C5", 0.42)]):
        at = i * 0.16
        add(b, marimba(hz(n), 1.1 - at, tau=tau, bright=0.6, mallet=0.08, seed=100 + i), at, 0.8)
        add(b, bell(hz(n), 1.1 - at, tau=tau * 1.3, glass=0.1, strike=0.0, seed=110 + i), at, 0.3)
    add(b, pad([hz("C4"), hz("G4"), hz("E5")], 0.78, att=0.08, rel=0.55, bright=0.3), 0.32, 0.28)
    return b

# ---------------------------------------------------------------- 3. session & progress
def session_complete():
    # signature motif: C5 E5 G5 up, bell C6 resolves
    b = buf(1.3)
    for i, n in enumerate(["C5", "E5", "G5"]):
        at = i * 0.085
        add(b, marimba(hz(n), 0.6, tau=0.17, bright=0.8, mallet=0.08, seed=120 + i), at, 0.6)
        add(b, kalimba(hz(n), 0.6, tau=0.22, seed=125 + i), at, 0.35)
    add(b, bell(hz("C6"), 1.05, tau=0.42, glass=0.3, strike=0.05, seed=130), 0.255, 0.85)
    add(b, bell(hz("G6"), 1.0, tau=0.30, glass=0.3, strike=0.0, seed=131), 0.27, 0.25)
    add(b, pad([hz("C4"), hz("E4"), hz("G4")], 1.05, att=0.06, rel=0.7, bright=0.3), 0.25, 0.22)
    add(b, sparkles(1.0, 4, 91, 103, amp=0.12, seed=132, t0=0.3, t1=0.75), 0.0)
    return b

def achievement():
    b = buf(1.0)
    add(b, bell(hz("C6"), 1.0, tau=0.38, glass=0.6, strike=0.10, seed=140), 0.0, 0.9)
    add(b, bell(hz("G6"), 0.98, tau=0.30, glass=0.6, strike=0.05, seed=141), 0.014, 0.55)
    add(b, bell(hz("E7"), 0.95, tau=0.20, glass=0.5, strike=0.0, seed=142), 0.028, 0.30)
    add(b, sparkles(1.0, 14, 96, 108, amp=0.22, seed=143, t0=0.04, t1=0.65))
    return b

def level_up():
    b = buf(1.9)
    for i, n in enumerate(["C5", "D5", "E5", "G5", "A5"]):
        at = i * 0.07
        add(b, marimba(hz(n), 0.5, tau=0.14, bright=0.8, mallet=0.07, seed=150 + i), at, 0.55)
        add(b, bell(hz(n), 0.6, tau=0.18, glass=0.2, strike=0.0, seed=160 + i), at, 0.30)
    add(b, bell(hz("C6"), 1.5, tau=0.55, glass=0.35, strike=0.06, seed=170), 0.38, 0.9)
    add(b, bell(hz("E6"), 1.4, tau=0.42, glass=0.35, strike=0.0, seed=171), 0.40, 0.35)
    add(b, bell(hz("G6"), 1.4, tau=0.38, glass=0.35, strike=0.0, seed=172), 0.42, 0.28)
    add(b, pad([hz("C4"), hz("G4"), hz("C5"), hz("E5"), hz("D6")], 1.6, att=0.25, rel=0.9,
               bright=0.6, shimmer=0.35, shimmer_hz=7.0, seed=173), 0.3, 0.42)
    add(b, sparkles(1.9, 16, 91, 105, amp=0.16, seed=174, t0=0.4, t1=1.35))
    return b

def orbit_closed():
    """STEREO. Whistle flies around (L->R) and resolves into a warm chord + bell."""
    D = 2.4
    L = np.zeros(int(D * SR)); R = np.zeros_like(L)
    T = 1.15
    t = tt(T)
    th = np.pi * t / T
    fc = 700 + 800 * np.sin(th) ** 1.5 + 300 * (1 - t / T)  # rises as it approaches, drops as it passes
    w = whistle(fc, q=7.0, seed=180, tone=0.22)
    w = hp(w, 250)
    amp = (0.35 + 0.65 * np.sin(th)) * np.clip(t / 0.08, 0, 1)
    amp *= np.where(t > T - 0.25, 0.5 + 0.5 * np.cos(np.pi * (t - (T - 0.25)) / 0.25), 1.0)
    w *= amp
    pan = -np.cos(th)  # -1 (left) -> +1 (right)
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[:len(w)] += 0.55 * w * gl; R[:len(w)] += 0.55 * w * gr
    # resolution
    at = 0.95
    c = pad([hz("C3"), hz("G3"), hz("C4"), hz("E4"), hz("G4")], D - at, att=0.10, rel=1.1, bright=0.45, seed=181)
    bl = bell(hz("C5"), D - at, tau=0.6, glass=0.3, strike=0.06, seed=182)
    bh = bell(hz("G5"), D - at, tau=0.5, glass=0.3, strike=0.03, seed=183)
    bt = bell(hz("C6"), D - at, tau=0.4, glass=0.3, strike=0.0, seed=184)
    sp_l = sparkles(D - at, 8, 91, 105, amp=0.12, seed=185, t0=0.05, t1=0.9)
    sp_r = sparkles(D - at, 8, 91, 105, amp=0.12, seed=186, t0=0.05, t1=0.9)
    for ch, g_bh, g_bt, sp in ((L, 0.40, 0.18, sp_l), (R, 0.28, 0.26, sp_r)):
        add(ch, c, at, 0.55); add(ch, bl, at, 0.75); add(ch, bh * 1.0, at + 0.02, g_bh)
        add(ch, bt, at + 0.04, g_bt); add(ch, sp, at)
    return np.stack([L, R], axis=1)

def shield():
    d = 0.7
    t = tt(d)
    n = noise(d, 190)
    # sweep the band upward (whoosh) in short blocks
    out = np.zeros_like(n)
    blk = 960
    for i in range(0, len(n), blk):
        f = 350 * (2500 / 350) ** min(i / (0.42 * SR), 1)
        seg = bp(n[max(0, i - 2000):i + blk], f * 0.7, f * 1.4)
        out[i:i + blk] = seg[-len(n[i:i + blk]):]
    D_ = int(round(SR / hz("C4")))
    comb = ss.lfilter([1.0], np.r_[1.0, np.zeros(D_ - 1), -0.82], out)  # metallic, tuned to C
    e = np.clip(t / 0.12, 0, 1) ** 1.5 * np.exp(-np.maximum(t - 0.12, 0) / 0.18)
    field = comb * e
    field /= np.max(np.abs(field)) + 1e-9
    trem = 1 - 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t))
    tone = (np.sin(2 * np.pi * hz("C5") * t) + 0.6 * np.sin(2 * np.pi * hz("G5") * t)) * e * trem
    return 0.75 * field + 0.25 * tone

def orbit_repaired():
    b = buf(0.9)
    T = 0.42
    t = tt(T)
    fc = 600 * (1500 / 600) ** (t / T)
    w = hp(whistle(fc, q=6.0, seed=200, tone=0.18), 250)
    w *= (np.exp(t / 0.11) - 1) / (np.exp(T / 0.11) - 1)  # reverse-decay swell
    add(b, w, 0, 0.55)
    # "click into place"
    add(b, click(0.02, 2000, 9000, 0.0015, 201), T, 0.7)
    add(b, partials(hz("G7"), 0.04, [(1, 1, 0.010), (1.5, 0.4, 0.006)], att=0.0003), T, 0.25)
    add(b, thump(260, 120, 0.05, tau=0.012, sweep=0.006), T, 0.4)
    # short major note
    add(b, bell(hz("C5"), 0.9 - T, tau=0.22, glass=0.2, strike=0.03, seed=202), T + 0.03, 0.6)
    add(b, bell(hz("E5"), 0.9 - T, tau=0.20, glass=0.2, strike=0.0, seed=203), T + 0.03, 0.45)
    add(b, kalimba(hz("G5"), 0.4, tau=0.15, seed=204), T + 0.03, 0.35)
    return b

# ---------------------------------------------------------------- 4. capsules & items
def capsule_shake():
    """Seamless loop, 0.75 s. Built periodic: wrapped clicks, steady-state filtered noise,
    hum partials with an integer number of cycles per loop."""
    Lsec = 0.75
    N = int(Lsec * SR)
    t = np.arange(N) / SR
    r = rng(210)
    swell = 0.55 + 0.45 * np.sin(np.pi * t / Lsec) ** 2  # periodic, rises then eases
    # rattle: clicks wrapped around the loop
    rat = np.zeros(N + SR // 10)
    for _ in range(95):
        at = r.uniform(0, Lsec)
        i = int(at * SR)
        c = click(0.012, r.uniform(1800, 3500), r.uniform(6000, 11000), r.uniform(0.0008, 0.0025), int(r.integers(1e6)))
        g = r.uniform(0.25, 1.0) * (0.4 + 0.6 * np.sin(np.pi * at / Lsec) ** 2)
        rat[i:i + len(c)] += g * c
    rat[:SR // 10] += rat[N:]
    rat = rat[:N]
    # hum: integer cycles per loop
    def cyc(f): return round(f * Lsec) / Lsec
    hum = (np.sin(2 * np.pi * cyc(hz("C3")) * t) + 0.5 * np.sin(2 * np.pi * cyc(hz("G3")) * t)
           + 0.25 * np.sin(2 * np.pi * cyc(hz("C4")) * t))
    hum *= swell ** 2
    # air bed: steady-state filtered periodic noise
    nz = rng(211).standard_normal(N)
    air = bp(np.tile(nz, 3), 600, 2500)[N:2 * N] * swell
    out = 0.9 * rat / (np.max(np.abs(rat)) + 1e-9) + 0.35 * hum / 1.75 + 0.12 * air / (np.std(air) * 4)
    return out

def capsule_open():
    d = 0.45
    t = tt(d)
    b = buf(d)
    add(b, thump(190, 75, 0.12, tau=0.03, sweep=0.012), 0, 0.8)
    add(b, click(0.015, 1000, 6000, 0.002, 220), 0, 0.6)
    n = noise(d, 221)
    out = np.zeros_like(n)
    blk = 960
    for i in range(0, len(n), blk):  # exhale: cutoff falls
        fc = 7000 * (700 / 7000) ** min(i / (0.4 * SR), 1)
        seg = lp(n[max(0, i - 2000):i + blk], fc)
        out[i:i + blk] = seg[-len(n[i:i + blk]):]
    out *= env(d, 0.006, 0.12)
    add(b, out, 0.004, 0.55)
    return b

# rarity phrase: one motif that grows   G5 -> C6 -> E6 -> G6
def reveal_common():
    b = buf(0.5)
    add(b, bell(hz("C6"), 0.5, tau=0.20, glass=0.3, strike=0.04, seed=230), 0)
    return b

def reveal_rare():
    b = buf(0.8)
    add(b, bell(hz("G5"), 0.8, tau=0.20, glass=0.3, strike=0.04, seed=240), 0, 0.85)
    add(b, bell(hz("C6"), 0.68, tau=0.26, glass=0.3, strike=0.04, seed=241), 0.12, 1.0)
    return b

def reveal_epic():
    b = buf(1.2)
    for i, n in enumerate(["G5", "C6", "E6", "G6"]):
        add(b, bell(hz(n), 1.2 - i * 0.09, tau=0.22 + 0.08 * i, glass=0.35, strike=0.04, seed=250 + i), i * 0.09, 0.8)
    add(b, pad([hz("C5"), hz("G5")], 0.95, att=0.12, rel=0.6, bright=0.7, shimmer=0.45, shimmer_hz=9, seed=255), 0.25, 0.25)
    add(b, sparkles(1.2, 10, 91, 105, amp=0.16, seed=256, t0=0.3, t1=0.95))
    return b

def reveal_legendary():
    b = buf(2.0)
    for i, n in enumerate(["G5", "C6", "E6"]):
        add(b, bell(hz(n), 0.6, tau=0.16, glass=0.35, strike=0.04, seed=260 + i), i * 0.07, 0.6)
    at = 0.24
    for j, (n, g) in enumerate([("C6", 0.8), ("E6", 0.5), ("G6", 0.45), ("C7", 0.3)]):
        add(b, bell(hz(n), 2.0 - at, tau=0.6 - 0.08 * j, glass=0.4, strike=0.05 if j == 0 else 0.0, seed=265 + j), at + 0.008 * j, g)
    add(b, choir([hz("C4"), hz("G4"), hz("C5"), hz("E5")], 2.0 - at + 0.05, att=0.18, rel=0.9, seed=270), at - 0.05, 0.55)
    add(b, pad([hz("C3"), hz("G3")], 2.0 - at, att=0.1, rel=0.9, bright=0.3, seed=271), at, 0.4)
    add(b, sparkles(2.0, 26, 91, 108, amp=0.18, seed=272, t0=0.3, t1=1.6))
    return b

def dust():
    d = 0.55
    t = tt(d)
    r = rng(280)
    b = buf(d)
    for _ in range(170):  # grains, density thins out
        at = d * 0.85 * r.beta(1.2, 2.2)
        c = click(0.006, 3000, 11000, r.uniform(0.0004, 0.0012), int(r.integers(1e6)))
        add(b, c, at, r.uniform(0.15, 0.6) * (1 - at / d))
    hiss = hp(noise(d, 281), 4500) * env(d, 0.03, 0.14)
    add(b, hiss, 0, 0.12)
    add(b, sparkles(d, 5, 96, 105, amp=0.22, seed=282, t0=0.03, t1=0.3))
    return b

def item_equip():
    d = 0.17
    b = buf(d)
    add(b, click(0.01, 3000, 10000, 0.0012, 290), 0, 0.5)
    add(b, partials(hz("G6"), 0.03, [(1, 1, 0.006), (2.4, 0.4, 0.003)], att=0.0003), 0, 0.3)
    at = 0.055  # latch
    add(b, click(0.012, 1500, 8000, 0.0018, 291), at, 0.9)
    add(b, thump(320, 160, 0.04, tau=0.01, sweep=0.005), at, 0.5)
    add(b, partials(hz("G7"), 0.11, [(1, 1, 0.03), (1.47, 0.4, 0.018), (2.21, 0.2, 0.01)], att=0.0003), at, 0.22)
    return b

# ---------------------------------------------------------------- registry
# name -> (fn, relative loudness dB [0 = loudest], is_loop)
# frequent sounds are quieter; rewards loudest
SOUNDS = {
    "answer-correct":   (answer_correct, -9, False),
    "answer-wrong":     (answer_wrong, -12, False),
    "card-flip":        (card_flip, -21, False),
    "card-next":        (card_next, -17, False),
    "ui-tap":           (ui_tap, -18, False),
    "streak-up":        (streak_up, -7, False),
    "timer-tick":       (timer_tick, -16, False),
    "time-up":          (time_up, -7, False),
    "life-lost":        (life_lost, -10, False),
    "game-over":        (game_over, -6, False),
    "session-complete": (session_complete, -4, False),
    "achievement":      (achievement, -3, False),
    "level-up":         (level_up, -2, False),
    "orbit-closed":     (orbit_closed, 0, False),
    "shield":           (shield, -7, False),
    "orbit-repaired":   (orbit_repaired, -5, False),
    "capsule-shake":    (capsule_shake, -12, True),
    "capsule-open":     (capsule_open, -7, False),
    "reveal-common":    (reveal_common, -6, False),
    "reveal-rare":      (reveal_rare, -5, False),
    "reveal-epic":      (reveal_epic, -3, False),
    "reveal-legendary": (reveal_legendary, -1, False),
    "dust":             (dust, -10, False),
    "item-equip":       (item_equip, -12, False),
}
WAVE1 = {"answer-correct", "answer-wrong", "card-flip", "session-complete", "achievement", "level-up",
         "orbit-closed", "capsule-shake", "capsule-open", "reveal-common", "reveal-rare", "reveal-epic",
         "reveal-legendary"}

# ---------------------------------------------------------------- mastering
def finish(x, loop=False):
    x = np.asarray(x, dtype=np.float64)
    if loop:
        return x - x.mean(axis=0)
    x = hp(x if x.ndim == 1 else x.T, 30).T if x.ndim > 1 else hp(x, 30)
    mono = np.max(np.abs(x), axis=1) if x.ndim > 1 else np.abs(x)
    pk = mono.max()
    # trim trailing tail below -66 dB re peak
    idx = np.nonzero(mono > pk * 10 ** (-66 / 20))[0]
    x = x[: idx[-1] + 1]
    # fade-out: 25% of length, 15..150 ms, cosine
    n = len(x)
    nf = int(np.clip(0.25 * n, 0.015 * SR, 0.15 * SR))
    fo = 0.5 + 0.5 * np.cos(np.pi * np.arange(nf) / nf)
    x[-nf:] = (x[-nf:].T * fo).T
    # 0.5 ms anti-click ramp-in (no silence)
    ni = int(0.0005 * SR)
    fi = np.sin(0.5 * np.pi * np.arange(ni) / ni)
    x[:ni] = (x[:ni].T * fi).T
    return x

_K1 = ([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585])
_K2 = ([1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621])

def loudness(x):
    """max momentary loudness (BS.1770 K-weighting, 100 ms window), LUFS-ish"""
    chans = [x] if x.ndim == 1 else [x[:, i] for i in range(x.shape[1])]
    p = 0
    for c in chans:
        y = ss.lfilter(*_K2, ss.lfilter(*_K1, c))
        w = int(0.1 * SR)
        y2 = np.convolve(np.r_[y ** 2, np.zeros(w)], np.ones(w) / w, "valid")
        p = p + y2
    return -0.691 + 10 * np.log10(np.max(p) + 1e-12)

def peak_db(x): return 20 * np.log10(np.max(np.abs(x)) + 1e-12)

def build(names):
    os.makedirs(OUT_WAV, exist_ok=True)
    os.makedirs(OUT_MP3, exist_ok=True)
    raw = {}
    for name in names:
        fn, rel, loop = SOUNDS[name]
        raw[name] = finish(fn(), loop)
    # global offset: loudest-relative mapping, then the hottest peak sits at -3 dBFS
    gains = {n: SOUNDS[n][1] - loudness(x) for n, x in raw.items()}
    if len(names) == len(SOUNDS):
        C = -3.0 - max(peak_db(x) + gains[n] for n, x in raw.items())
        json.dump({"C": C}, open(os.path.join(HERE, "out", "calib.json"), "w"))
    else:
        C = json.load(open(os.path.join(HERE, "out", "calib.json")))["C"]
    report = []
    for name, x in raw.items():
        y = x * 10 ** ((gains[name] + C) / 20)
        if peak_db(y) > -3.0:  # safety ceiling for partial rebuilds
            y *= 10 ** ((-3.0 - peak_db(y)) / 20)
        wav = os.path.join(OUT_WAV, name + ".wav")
        mp3 = os.path.join(OUT_MP3, name + ".mp3")
        sf.write(wav, y.astype(np.float32), SR, subtype="PCM_24")
        ch = 2 if y.ndim > 1 else 1
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-c:a", "libmp3lame", "-b:a", "128k",
                        "-ar", str(SR), "-ac", str(ch), mp3], check=True)
        report.append((name, len(y) / SR, peak_db(y), loudness(y), os.path.getsize(mp3), ch))
    return report

if __name__ == "__main__":
    names = sys.argv[1:] or list(SOUNDS)
    rep = build(names)
    tot = 0
    print(f"{'name':18} {'dur':>6} {'peak':>7} {'loud':>7} {'mp3':>7}")
    for n, d, pk, ld, sz, ch in rep:
        tot += sz
        print(f"{n:18} {d*1000:5.0f}ms {pk:6.1f}dB {ld:6.1f} {sz/1024:6.1f}K{' stereo' if ch == 2 else ''}{' ★' if n in WAVE1 else ''}")
    print(f"total mp3: {tot/1024:.1f} KB")
