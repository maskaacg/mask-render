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


def sonar():
    # ping lejano con eco (kit submarino)
    tt = A.t(3.2)
    x = np.zeros(len(tt))
    for k, (dly, g) in enumerate([(0, 1), (0.9, 0.35), (1.8, 0.12)]):
        n0 = int(dly * SR)
        tk = tt[: len(tt) - n0]
        x[n0:] += np.sin(2 * np.pi * 1180 * tk) * A.env(len(tk), 0.004, 0.55) * g
    return A.norm(x, 0.35)


def gota():
    tt = A.t(0.35)
    f = 900 + 1400 * np.exp(-tt * 40)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * A.env(len(tt), 0.001, 0.06)
    return A.norm(x, 0.4)


def casco():
    # gemido grave del casco bajo presión
    tt = A.t(3.0)
    f = 62 + 14 * np.sin(2 * np.pi * 0.7 * tt)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR)
    x += A.lowpass(A.rng.standard_normal(len(tt)), 0.01) * 3
    x *= np.sin(np.pi * tt / 3.0) ** 2
    return A.norm(x, 0.55)


def logo():
    # logo sonoro E60: tres notas plateadas (mi, si, mi agudo)
    tt = A.t(2.4)
    x = np.zeros(len(tt))
    for k, f in enumerate([329.63, 493.88, 659.25]):
        n0 = int(k * 0.22 * SR)
        tk = tt[: len(tt) - n0]
        x[n0:] += (np.sin(2 * np.pi * f * tk) + 0.3 * np.sin(2 * np.pi * 2 * f * tk)) * A.env(len(tk), 0.004, 0.9)
    return A.norm(x, 0.5)


def burbujas():
    tt = A.t(2.6)
    x = np.zeros(len(tt))
    for k in range(26):
        n0 = int(A.rng.random() * (len(tt) - 6000))
        d = 0.04 + 0.05 * A.rng.random()
        tk = A.t(d)
        f = (500 + 900 * A.rng.random()) * (1 + 2.5 * tk / d)
        x[n0:n0 + len(tk)] += np.sin(2 * np.pi * np.cumsum(f) / SR) * A.env(len(tk), 0.002, d / 2)
    return A.norm(x * (1 - tt / 2.6 * 0.6), 0.4)


def metal(s, sr):
    """Voz de El Custodio: resonancia metálica (filtro peine) + eco de sala de acero."""
    x = np.asarray(s, dtype=np.float64)
    pad = np.zeros(int(0.9 * sr))
    x = np.concatenate([x, pad])
    d = int(0.011 * sr)
    y = x.copy()
    for i in range(d, len(y)):
        y[i] += 0.55 * y[i - d]
    for dly, g in [(0.083, 0.32), (0.157, 0.22), (0.271, 0.14), (0.433, 0.08)]:
        n = int(dly * sr)
        y[n:] += g * x[:-n]
    y = y - A.lowpass(y, 0.04) * 0.7  # recorta graves: suena a altavoz
    return (y / (np.max(np.abs(y)) or 1) * 0.9).astype(np.float32)



# ---- kit castillo (escape room «La torre del archivero»)
def trueno():
    tt = A.t(5.0)
    n = A.rng.standard_normal(len(tt))
    x = A.lowpass(n, 0.012) * 6 * np.exp(-tt * 0.7)
    x += A.lowpass(n, 0.08) * np.exp(-tt * 7) * 0.8  # restallido inicial
    x *= np.minimum(1, tt / 0.03)
    return A.norm(x, 0.8)


def lluvia():
    tt = A.t(60.0)
    x = A.lowpass(A.rng.standard_normal(len(tt)), 0.35) * 0.25
    x += A.lowpass(A.rng.standard_normal(len(tt)), 0.02) * (1 + 0.4 * np.sin(2 * np.pi * tt / 13))
    gotas = np.zeros(len(tt))
    idx = A.rng.integers(0, len(tt) - 400, 1800)
    gotas[idx] = A.rng.random(1800) * 0.6
    x += np.convolve(gotas, np.exp(-np.arange(300) / 40), mode="same")
    fade = int(0.5 * SR)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    return A.norm(x, 0.5)


def fuego():
    tt = A.t(20.0)
    x = A.lowpass(A.rng.standard_normal(len(tt)), 0.05) * 0.4
    for _ in range(140):
        n0 = int(A.rng.random() * (len(tt) - 2000))
        x[n0:n0 + 2000] += A.rng.standard_normal(2000) * np.exp(-np.arange(2000) / (60 + 200 * A.rng.random())) * A.rng.random()
    fade = int(0.3 * SR)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    return A.norm(x, 0.4)


def piedra():
    tt = A.t(2.2)
    x = A.lowpass(A.rng.standard_normal(len(tt)), 0.03) * 3 + A.lowpass(A.rng.standard_normal(len(tt)), 0.25) * 0.3
    x *= np.sin(np.pi * tt / 2.2) ** 0.7
    x[-int(0.25 * SR):] += A.thud()[: int(0.25 * SR)] if len(A.thud()) >= int(0.25 * SR) else 0
    return A.norm(x, 0.7)


def gramofono():
    tt = A.t(12.0)
    x = A.lowpass(A.rng.standard_normal(len(tt)), 0.5) * 0.05
    pops = np.zeros(len(tt))
    idx = A.rng.integers(0, len(tt), 260)
    pops[idx] = A.rng.random(260)
    x += pops
    # vals lejano de dos notas, filtrado como bocina antigua
    mel = [392.0, 329.63, 349.23, 293.66]
    for k in range(24):
        f = mel[k % 4]
        n0 = int(k * 0.5 * SR)
        tk = A.t(0.48)
        if n0 + len(tk) > len(tt):
            break
        x[n0:n0 + len(tk)] += np.sin(2 * np.pi * f * tk) * A.env(len(tk), 0.01, 0.3) * 0.25
    x = x - A.lowpass(x, 0.02)
    return A.norm(x, 0.35)


def apagar():
    tt = A.t(0.9)
    x = A.lowpass(A.rng.standard_normal(len(tt)), 0.2) * np.exp(-tt * 6)
    return A.norm(x, 0.4)


SFX = {
    "sonar": sonar,
    "gota": gota,
    "casco": casco,
    "logo": logo,
    "burbujas": burbujas,
    "alarma": lambda: A.norm(np.sin(2 * np.pi * (520 + 140 * np.sign(np.sin(2 * np.pi * 1.5 * A.t(2.0)))) * A.t(2.0)) * A.env(len(A.t(2.0)), 0.02, 1.4), 0.35),
    "ambiente": lambda: A.ambience(120),
    "tic": tick,
    "campana": chime,
    "viento": wind,
    "cerrojo": latch,
    "aire": A.whoosh,
    "golpe": A.thud,
    "bisagra": A.creak,
    "trueno": trueno,
    "lluvia": lluvia,
    "fuego": fuego,
    "piedra": piedra,
    "gramofono": gramofono,
    "apagar": apagar,
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
    voces = ficha.get("voces", {})
    dur = {}
    for ln in ficha["lineas"]:
        cfg = voces.get(ln.get("voz", "narrador"), {})
        s, sr = k.create(ln["texto"], voice=cfg.get("voz", a.voice), speed=cfg.get("velocidad", a.speed), lang="es")
        s = np.asarray(s, dtype=np.float32)
        idx = np.where(np.abs(s) > 0.01)[0]
        s = s[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.12 * sr)]
        if cfg.get("efecto") == "metal":
            s = metal(s, sr)
        sf.write(os.path.join(vdir, ln["id"] + ".wav"), s, sr)
        dur[ln["id"]] = round(len(s) / sr, 3)

    os.makedirs("out", exist_ok=True)
    props = {"ficha": ficha, "duraciones": dur, "voz": {"modelo": "Kokoro-82M", "voz": a.voice, "licencia": "Apache-2.0"}}
    with open(os.path.join("out", f"props_{fid}.json"), "w", encoding="utf-8") as f:
        json.dump(props, f, ensure_ascii=False)
    print(json.dumps(dur, ensure_ascii=False))


if __name__ == "__main__":
    main()
