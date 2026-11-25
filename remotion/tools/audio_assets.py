"""Genera los recursos de audio del prototipo ENIGMA 60 (escenas 1-2).

- Voz: Kokoro-82M (Apache 2.0), voz em_alex, una frase por archivo.
- Efectos: sintetizados aquí mismo con numpy (sin bibliotecas de terceros
  ni muestras con licencia), así que son propios de MASK GROUP.

Uso:
  python tools/audio_assets.py --kokoro-model kokoro-v1.0.onnx \
      --kokoro-voices voices-v1.0.bin --out public/audio
Escribe además public/audio/manifest.json con la duración de cada pista,
que la composición usa para colocar subtítulos y acciones.
"""
import argparse
import json
import os

import numpy as np
import soundfile as sf

SR = 44100
LINES = {
    "v01_llegas_tarde": "Llegas tarde.",
    "v02_archivo_cerrado": "El archivo acaba de cerrarse contigo dentro.",
    "v03_ranuras_sellos": "Tres ranuras. Cinco sellos.",
    "v04_una_combinacion": "Solo una combinación abre.",
}
rng = np.random.default_rng(60)


def t(seconds):
    return np.arange(int(seconds * SR)) / SR


def lowpass(x, alpha):
    y = np.empty_like(x)
    al = np.broadcast_to(np.asarray(alpha, dtype=float), x.shape)
    acc = 0.0
    for i, v in enumerate(x):
        acc += al[i] * (v - acc)
        y[i] = acc
    return y


def env(n, attack, release):
    a = np.minimum(1, np.arange(n) / max(1, int(attack * SR)))
    r = np.exp(-np.arange(n) / max(1, release * SR))
    return a * r


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def creak():
    # bisagra: frecuencia que se arrastra entre 180 y 420 Hz con aspereza
    d = 1.1
    tt = t(d)
    f = 180 + 240 * (0.5 + 0.5 * np.sin(2 * np.pi * 1.7 * tt)) * (1 - tt / d * 0.4)
    phase = 2 * np.pi * np.cumsum(f) / SR
    rough = 1 + 0.6 * np.sign(np.sin(2 * np.pi * 37 * tt))
    x = np.sin(phase) * rough + 0.25 * np.sin(2.01 * phase)
    x *= np.minimum(1, tt / 0.08) * np.minimum(1, (d - tt) / 0.15)
    x += 0.05 * rng.standard_normal(len(tt))
    return norm(lowpass(x, 0.35), 0.45)


def thud():
    d = 1.6
    tt = t(d)
    body = np.sin(2 * np.pi * (52 + 30 * np.exp(-tt * 18)) * tt) * env(len(tt), 0.002, 0.35)
    knock = lowpass(rng.standard_normal(len(tt)), 0.08) * env(len(tt), 0.001, 0.06) * 3
    rattle = lowpass(rng.standard_normal(len(tt)), 0.3) * env(len(tt), 0.01, 0.25) * 0.15
    return norm(body + knock + rattle, 0.95)


def click(pitch=2400):
    d = 0.35
    tt = t(d)
    x = np.sin(2 * np.pi * pitch * tt) * env(len(tt), 0.0005, 0.018)
    x += np.sin(2 * np.pi * pitch * 0.5 * tt) * env(len(tt), 0.0005, 0.05) * 0.5
    x += rng.standard_normal(len(tt)) * env(len(tt), 0.0002, 0.006) * 0.6
    return norm(x, 0.6)


def dust():
    d = 2.4
    tt = t(d)
    grains = (rng.random(len(tt)) > 0.9985).astype(float) * rng.random(len(tt))
    x = lowpass(grains + 0.02 * rng.standard_normal(len(tt)), 0.25)
    x *= np.exp(-tt / 1.2)
    return norm(x, 0.25)


def ambience(seconds=14):
    tt = t(seconds)
    hum = 0.5 * np.sin(2 * np.pi * 55 * tt) + 0.2 * np.sin(2 * np.pi * 82.4 * tt)
    hum *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * tt)
    room = lowpass(rng.standard_normal(len(tt)), 0.02) * 4
    x = hum * 0.4 + room
    fade = np.minimum(1, tt / 1.5) * np.minimum(1, (seconds - tt) / 1.0)
    return norm(x * fade, 0.3)


def whoosh():
    d = 1.4
    tt = t(d)
    x = lowpass(rng.standard_normal(len(tt)), 0.05 + 0.1 * tt / d)
    x *= np.sin(np.pi * tt / d) ** 2
    return norm(x, 0.35)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kokoro-model", required=True)
    ap.add_argument("--kokoro-voices", required=True)
    ap.add_argument("--voice", default="em_alex")
    ap.add_argument("--speed", type=float, default=0.95)
    ap.add_argument("--out", default="public/audio")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    manifest = {"voz": {"modelo": "Kokoro-82M (Apache 2.0)", "voz": a.voice, "velocidad": a.speed}, "pistas": {}}

    from kokoro_onnx import Kokoro

    k = Kokoro(a.kokoro_model, a.kokoro_voices)
    for key, text in LINES.items():
        s, sr = k.create(text, voice=a.voice, speed=a.speed, lang="es")
        s = np.asarray(s, dtype=np.float32)
        # recorta silencios del principio y del final para sincronizar al fotograma
        idx = np.where(np.abs(s) > 0.01)[0]
        s = s[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.12 * sr)]
        path = os.path.join(a.out, key + ".wav")
        sf.write(path, s, sr)
        manifest["pistas"][key] = {"texto": text, "segundos": round(len(s) / sr, 3)}

    for key, fn in {"sfx_bisagra": creak, "sfx_golpe": thud, "sfx_click_a": lambda: click(2400),
                    "sfx_click_b": lambda: click(2150), "sfx_click_c": lambda: click(1900),
                    "sfx_polvo": dust, "sfx_ambiente": ambience, "sfx_aire": whoosh}.items():
        x = fn().astype(np.float32)
        sf.write(os.path.join(a.out, key + ".wav"), x, SR)
        manifest["pistas"][key] = {"segundos": round(len(x) / SR, 3), "origen": "sintetizado (numpy)"}

    with open(os.path.join(a.out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    print(json.dumps(manifest, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
