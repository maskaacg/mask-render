"""Genera el audio de una ficha de corto ENIGMA 60 y el archivo de props para Remotion.

- Voz: Kokoro-82M (Apache 2.0), voz em_alex, una pista por línea de la ficha.
- Efectos compartidos (sintetizados con numpy, propios) en public/audio/sfx/.
- Escribe out/props_<id>.json con la ficha y la duración real de cada línea.

Uso:
  python tools/ficha_audio.py --ficha fichas/E60-2026-11-16-corto.json \
      --kokoro-model models/kokoro-v1.0.onnx --kokoro-voices models/voices-v1.0.bin
"""
import argparse
import json
import os
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
import audio_assets as A  # noqa: E402

SR = A.SR


def tick():
    tt = A.t(0.25)
    x = np.sin(2 * np.pi * 1800 * tt) * A.env(len(tt), 0.0005, 0.012)
    x += np.sin(2 * np.pi * 900 * tt) * A.env(len(tt), 0.0005, 0.03) * 0.4
    return A.norm(x, 0.35)


def chime():
    tt = A.t(2.6)
    x = sum(np.sin(2 * np.pi * f * tt) * A.env(len(tt), 0.003, d) * g
            for f, d, g in [(523.25, 1.4, 1), (659.25, 1.2, 0.7), (783.99, 1.0, 0.6), (1046.5, 0.8, 0.3)])
    return A.norm(x, 0.5)


def wind():
    tt = A.t(2.2)
    x = A.lowpass(A.rng.standard_normal(len(tt)), 0.03 + 0.05 * np.sin(np.pi * tt / 2.2))
    x *= np.sin(np.pi * tt / 2.2) ** 1.5
    return A.norm(x, 0.5)


def latch():
    return A.norm(A.click(900) * 0.6 + A.click(1400) * 0.4, 0.7)


SFX = {
    "ambiente": lambda: A.ambience(120),
    "tic": tick,
    "campana": chime,
    "viento": wind,
    "cerrojo": latch,
    "aire": A.whoosh,
    "golpe": A.thud,
    "bisagra": A.creak,
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ficha", required=True)
    ap.add_argument("--kokoro-model", required=True)
    ap.add_argument("--kokoro-voices", required=True)
    ap.add_argument("--voice", default="em_alex")
    ap.add_argument("--speed", type=float, default=0.95)
    a = ap.parse_args()

    ficha = json.load(open(a.ficha, encoding="utf-8"))
    fid = ficha["id"]
    vdir = os.path.join("public", "audio", fid)
    sdir = os.path.join("public", "audio", "sfx")
    os.makedirs(vdir, exist_ok=True)
    os.makedirs(sdir, exist_ok=True)

    for name, fn in SFX.items():
        p = os.path.join(sdir, name + ".wav")
        if not os.path.exists(p):
            sf.write(p, fn().astype(np.float32), SR)

    from kokoro_onnx import Kokoro

    k = Kokoro(a.kokoro_model, a.kokoro_voices)
    dur = {}
    for ln in ficha["lineas"]:
        s, sr = k.create(ln["texto"], voice=a.voice, speed=a.speed, lang="es")
        s = np.asarray(s, dtype=np.float32)
        idx = np.where(np.abs(s) > 0.01)[0]
        s = s[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.12 * sr)]
        sf.write(os.path.join(vdir, ln["id"] + ".wav"), s, sr)
        dur[ln["id"]] = round(len(s) / sr, 3)

    os.makedirs("out", exist_ok=True)
    props = {"ficha": ficha, "duraciones": dur, "voz": {"modelo": "Kokoro-82M", "voz": a.voice, "licencia": "Apache-2.0"}}
    with open(os.path.join("out", f"props_{fid}.json"), "w", encoding="utf-8") as f:
        json.dump(props, f, ensure_ascii=False)
    print(json.dumps(dur, ensure_ascii=False))


if __name__ == "__main__":
    main()
