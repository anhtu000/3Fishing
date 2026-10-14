"""Makes every sound effect and the music loop from scratch (no samples, nothing downloaded).

python3 tools/make_audio.py  ->  public/audio/*.mp3
Original synthesis code, so the audio is ours to ship (see ASSETS.md).
"""
import os
import subprocess
import tempfile
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
rng = np.random.default_rng(7)


def t_(dur):
    return np.arange(int(SR * dur)) / SR


def env(n, a=0.005, d=0.1, s=0.0, r=0.05, total=None):
    """Simple attack / exponential decay envelope."""
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    e *= np.exp(-np.maximum(0, t - a) / max(d, 1e-4)) * (1 - s) + s
    tail = int(r * SR)
    if tail and tail < n:
        e[-tail:] *= np.linspace(1, 0, tail)
    return e


def sine(f, dur, phase=0):
    t = t_(dur)
    if callable(f):
        ph = 2 * np.pi * np.cumsum(f(t)) / SR
    else:
        ph = 2 * np.pi * f * t
    return np.sin(ph + phase)


def bell(f, dur, decay=0.25, bright=1.0):
    """Soft bell / glockenspiel: sine plus inharmonic partials."""
    n = int(SR * dur)
    out = np.zeros(n)
    for k, (ratio, amp) in enumerate([(1, 1), (2.0, 0.35 * bright), (3.01, 0.18 * bright), (4.2, 0.08 * bright)]):
        out += amp * sine(f * ratio, dur) * env(n, 0.002, decay / (1 + k * 0.6))
    return out


def pluck(f, dur, decay=0.3):
    n = int(SR * dur)
    out = np.zeros(n)
    for k in range(1, 6):
        out += (0.6 ** k) * sine(f * k, dur) * env(n, 0.002, decay / k)
    return out


def noise(dur):
    return rng.uniform(-1, 1, int(SR * dur))


def lowpass(x, cutoff):
    """One-pole low-pass; cutoff may be an array (sweeps)."""
    y = np.zeros_like(x)
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def mixdown(*parts):
    n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[: len(p)] += p
    return out


def at(x, start):
    return np.concatenate([np.zeros(int(start * SR)), x])


def norm(x, peak=0.85):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def note(name):
    names = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    n = names[name[0]]
    i = 1
    if name[i] == '#':
        n += 1
        i += 1
    elif name[i] == 'b':
        n -= 1
        i += 1
    octave = int(name[i:])
    return 440 * 2 ** ((n - 9) / 12 + octave - 4)


def write(name, x, peak=0.85, bitrate='96k'):
    x = norm(x, peak)
    fade = int(0.004 * SR)
    x[-fade:] *= np.linspace(1, 0, fade)
    os.makedirs(OUT, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        tmp = f.name
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-ac', '1', '-b:a', bitrate, os.path.join(OUT, name + '.mp3')], check=True)
    os.remove(tmp)


def splash(dur=0.3, bright=3000):
    n = int(SR * dur)
    x = noise(dur) * env(n, 0.004, dur / 4)
    return lowpass(highpass(x, 300), np.linspace(bright, 600, n))


def bloop(f0, f1, dur):
    n = int(SR * dur)
    f = lambda t: f0 + (f1 - f0) * (t / dur) ** 0.5
    return sine(f, dur) * env(n, 0.003, dur / 3)


def sfx():
    write('ui-tap', mixdown(bloop(700, 1100, 0.07) * 0.8, sine(1800, 0.03) * env(int(SR * 0.03), 0.001, 0.008) * 0.3), 0.7)
    write('pop', bloop(500, 1400, 0.09), 0.7)
    write('open', mixdown(bell(note('C6'), 0.25, 0.08, 0.5), at(bell(note('G6'), 0.25, 0.1, 0.5), 0.07)), 0.6)
    write('nope', mixdown(pluck(note('E4'), 0.2, 0.08), at(pluck(note('C4'), 0.25, 0.1), 0.09)), 0.6)
    write('coin', mixdown(bell(note('B6'), 0.2, 0.06), at(bell(note('E7'), 0.25, 0.09), 0.05)), 0.6)
    write('gem', mixdown(bell(note('A6'), 0.35, 0.12, 1.4), bell(note('A6') * 1.006, 0.35, 0.12, 1.4), at(bell(note('E7'), 0.3, 0.1), 0.06)), 0.6)
    write('buy', mixdown(bell(note('E6'), 0.4, 0.12), at(bell(note('B6'), 0.45, 0.16), 0.08), at(highpass(noise(0.25), 5000) * env(int(SR * 0.25), 0.002, 0.06) * 0.25, 0.08)))
    write('reward', mixdown(*[at(bell(note(n), 0.5, 0.18), i * 0.08) for i, n in enumerate(['C6', 'E6', 'G6', 'C7'])]))
    write('catch', mixdown(splash(0.35, 4000) * 0.7, at(bloop(400, 900, 0.18), 0.02), at(bell(note('G6'), 0.3, 0.1) * 0.5, 0.12)))
    junk_f = lambda t: 300 * (1 + 0.25 * np.sin(2 * np.pi * 12 * t)) * np.exp(-t * 2)
    write('junk', mixdown(splash(0.25) * 0.5, at(sine(junk_f, 0.45) * env(int(SR * 0.45), 0.005, 0.2), 0.03)), 0.7)
    write('new', mixdown(*[at(bell(note(n), 0.7, 0.25), i * 0.09) for i, n in enumerate(['G5', 'C6', 'E6', 'G6'])], at(bell(note('C7'), 0.9, 0.4) + bell(note('E6'), 0.9, 0.4) * 0.6, 0.4)))
    gl = mixdown(*[at(bell(note('C6') * 2 ** (i / 7), 0.35, 0.1, 1.3) * 0.7, i * 0.05) for i in range(14)])
    write('rare', mixdown(gl, at(bell(note('C7'), 1.0, 0.45, 1.4) + bell(note('G6'), 1.0, 0.45), 0.7)))
    creak = sine(lambda t: 180 + 60 * np.sin(2 * np.pi * 7 * t), 0.25) * env(int(SR * 0.25), 0.02, 0.15) * 0.5
    write('chest', mixdown(lowpass(creak, 1500), at(mixdown(*[at(bell(note(n), 0.4, 0.12), i * 0.05) for i, n in enumerate(['E6', 'G6', 'B6', 'E7', 'G7'])]), 0.2)))
    knock = lowpass(noise(0.06) * env(int(SR * 0.06), 0.001, 0.012), 1800) + sine(320, 0.06) * env(int(SR * 0.06), 0.001, 0.02)
    write('wobble', knock, 0.6)
    crack = highpass(noise(0.05) * env(int(SR * 0.05), 0.0005, 0.01), 2000)
    write('hatch', mixdown(crack, at(crack, 0.06), at(bloop(300, 1200, 0.15), 0.1), at(mixdown(*[at(bell(note(n), 0.6, 0.2), i * 0.07) for i, n in enumerate(['C6', 'E6', 'G6', 'C7', 'E7'])]), 0.18)))
    n = int(SR * 0.4)
    whoosh = noise(0.4) * np.sin(np.linspace(0, np.pi, n)) ** 2
    write('cast', lowpass(highpass(whoosh, 400), np.linspace(800, 4000, n)), 0.6)
    write('plop', mixdown(bloop(250, 700, 0.18), splash(0.15, 2000) * 0.3), 0.7)
    write('nibble', bloop(500, 900, 0.08), 0.5)
    write('bite', mixdown(splash(0.3, 5000) * 0.8, at(bell(note('A6'), 0.35, 0.12) * 0.6, 0.02), at(bell(note('E7'), 0.3, 0.1) * 0.5, 0.1)))
    zip_ = sine(lambda t: 800 + 3000 * t / 0.12, 0.12) * env(int(SR * 0.12), 0.002, 0.05)
    write('hook', mixdown(zip_ * 0.6, highpass(noise(0.03), 3000) * 0.3), 0.6)
    write('perfect', mixdown(bell(note('E6'), 0.4, 0.15), at(bell(note('B6'), 0.4, 0.15), 0.07)))
    write('splash', splash(0.25, 3000), 0.6)
    twang = sine(lambda t: 520 * np.exp(-t * 3), 0.35) * env(int(SR * 0.35), 0.001, 0.12)
    write('snap', mixdown(highpass(noise(0.03), 2500) * env(int(SR * 0.03), 0.001, 0.01), twang * 0.8), 0.7)
    womp = sine(lambda t: 330 * np.exp(-t * 1.6), 0.4) * env(int(SR * 0.4), 0.01, 0.18)
    write('miss', mixdown(womp, at(sine(lambda t: 260 * np.exp(-t * 1.6), 0.4) * env(int(SR * 0.4), 0.01, 0.2), 0.12)), 0.6)
    rumble = lowpass(noise(1.0), 140) * env(int(SR * 1.0), 0.05, 0.5) * 3
    drum = sine(lambda t: 110 * np.exp(-t * 6) + 40, 0.6) * env(int(SR * 0.6), 0.002, 0.25)
    write('boss', mixdown(rumble, drum, at(drum * 0.8, 0.28)))
    fan = [('C5', 0), ('E5', 0.12), ('G5', 0.24), ('C6', 0.36), ('G5', 0.6), ('C6', 0.72)]
    write('win', mixdown(*[at(pluck(note(n), 0.5, 0.25) + bell(note(n) * 2, 0.5, 0.2) * 0.4, s) for n, s in fan], at(mixdown(bell(note('C6'), 1.2, 0.6), bell(note('E6'), 1.2, 0.6), bell(note('G6'), 1.2, 0.6)), 0.9)))
    write('unlock', mixdown(*[at(bell(note('C6') * 2 ** (i / 5), 0.5, 0.15, 1.2) * 0.6, i * 0.06) for i in range(10)]))
    n = int(SR * 0.35)
    write('charge', sine(lambda t: 300 + 500 * t / 0.35, 0.35) * np.sin(np.linspace(0, np.pi, n)) * 0.5, 0.45)


def music():
    """Cozy lo-fi loop: electric piano chords, soft bass, brushed hats, a pentatonic melody. 84 bpm, 16 bars."""
    bpm = 84
    beat = 60 / bpm
    bars = 16
    dur = bars * 4 * beat
    n = int(SR * dur)
    out = np.zeros(n + SR)

    def add(x, start, gain=1.0):
        i = int(start * SR)
        j = min(len(out), i + len(x))
        out[i:j] += x[: j - i] * gain

    def epiano(f, d):
        m = int(SR * d)
        t = np.arange(m) / SR
        x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3)
        x *= env(m, 0.01, 1.2, 0.0, 0.2) * (1 + 0.15 * np.sin(2 * np.pi * 4.5 * t))
        return x

    chords = [
        ['C4', 'E4', 'G4', 'B4'],
        ['A3', 'C4', 'E4', 'G4'],
        ['F3', 'A3', 'C4', 'E4'],
        ['G3', 'B3', 'D4', 'E4'],
    ]
    basses = ['C2', 'A1', 'F1', 'G1']
    for bar in range(bars):
        ci = bar % 4
        start = bar * 4 * beat
        for k, nm in enumerate(chords[ci]):
            add(epiano(note(nm), 4 * beat), start + k * 0.012, 0.16)
            add(epiano(note(nm), 2 * beat), start + 2.5 * beat + k * 0.01, 0.08)
        b = note(basses[ci])
        add(pluck(b, 1.6 * beat, 0.6) * 1.0, start, 0.35)
        add(pluck(b * 1.5, 0.9 * beat, 0.3), start + 2.5 * beat, 0.22)
        for h in range(8):
            hat = highpass(noise(0.05), 6000) * env(int(SR * 0.05), 0.001, 0.015 if h % 2 else 0.03)
            add(hat, start + h * beat / 2 + (0.03 if h % 2 else 0), 0.07 if h % 2 else 0.1)
        kick = sine(lambda t: 90 * np.exp(-t * 18) + 45, 0.3) * env(int(SR * 0.3), 0.002, 0.1)
        add(kick, start, 0.35)
        add(kick, start + 2.5 * beat, 0.22)
        snare = lowpass(noise(0.18), 3500) * env(int(SR * 0.18), 0.002, 0.05)
        add(snare, start + beat, 0.12)
        add(snare, start + 3 * beat, 0.12)
    # Melody: C major pentatonic, two 8-bar phrases (the second answers the first).
    mel = [
        ('E5', 0, 1), ('G5', 1, 1), ('A5', 2, 1.5), ('G5', 3.5, 0.5),
        ('E5', 4, 1), ('D5', 5, 1), ('C5', 6, 2),
        ('E5', 8, 1), ('G5', 9, 0.5), ('A5', 9.5, 0.5), ('C6', 10, 1.5), ('A5', 11.5, 0.5),
        ('G5', 12, 1.5), ('E5', 13.5, 0.5), ('D5', 14, 2),
        ('C5', 16, 1), ('D5', 17, 1), ('E5', 18, 1.5), ('G5', 19.5, 0.5),
        ('A5', 20, 1), ('G5', 21, 1), ('E5', 22, 2),
        ('D5', 24, 1), ('E5', 25, 0.5), ('G5', 25.5, 0.5), ('A5', 26, 1), ('G5', 27, 1),
        ('E5', 28, 1), ('D5', 29, 1), ('C5', 30, 2),
    ]
    for half in (0, 32):
        for nm, b, length in mel:
            if half == 32 and b % 8 == 0 and b < 16:
                continue  # leave air in the repeat
            x = bell(note(nm), length * beat + 0.6, 0.35, 0.7)
            add(x, (half + b) * beat, 0.16 if half == 0 else 0.13)
    out = out[:n] + np.concatenate([out[n:], np.zeros(n - len(out[n:]))])  # wrap the tail into the start
    out = lowpass(out, 7000)
    write('music', out, 0.7, bitrate='64k')


if __name__ == '__main__':
    sfx()
    music()
    print('ok', sorted(os.listdir(OUT)))
