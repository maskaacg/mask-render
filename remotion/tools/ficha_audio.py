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


def _periodico(n, ganancia, rng):
    """Ruido coloreado en el dominio de la frecuencia: periódico (bucle sin costura ni fundidos)."""
    f = np.fft.rfftfreq(n, 1 / SR)
    X = (rng.standard_normal(len(f)) + 1j * rng.standard_normal(len(f))) * ganancia(f)
    X[0] = 0
    x = np.fft.irfft(X, n)
    return x / (np.sqrt(np.mean(x ** 2)) or 1)


def _banda(f, lo, hi, orden=2):
    """Respuesta de un pasa-banda suave (Butterworth aproximado) con cortes lo-hi Hz."""
    fs = np.maximum(f, 1e-3)
    return 1 / np.sqrt(1 + (lo / fs) ** (2 * orden)) / np.sqrt(1 + (fs / hi) ** (2 * orden))


def _filtra(x, ganancia):
    X = np.fft.rfft(x)
    return np.fft.irfft(X * ganancia(np.fft.rfftfreq(len(x), 1 / SR)), len(x))


def _granos(n, por_seg, dur_ms, rng, ganancia):
    """Gotas/chasquidos suaves: ráfagas cortas de ruido con envolvente de coseno (sin clics),
    colocadas de forma circular para que el bucle no tenga costura."""
    x = np.zeros(n)
    for _ in range(int(por_seg * n / SR)):
        m = int(SR * dur_ms * (0.6 + 0.8 * rng.random()) / 1000)
        e = np.sin(np.pi * np.arange(m) / m) ** 2 * np.exp(-np.arange(m) / (m / 3))
        g = rng.random() ** 2.2
        i0 = int(rng.random() * n)
        idx = (i0 + np.arange(m)) % n
        x[idx] += rng.standard_normal(m) * e * g
    return _filtra(x, ganancia)


def lluvia():
    """Lluvia tras la ventana de la torre (corrección del Propietario 15/11: «se escucha interferencia,
    no como lluvia»). Antes: zumbido grave modulado + impulsos secos que sonaban a estática, y un
    fundido a cero en cada vuelta del bucle. Ahora: siseo 0,3-5 kHz (como agua cayendo),
    muchas gotas suaves con ataque redondeado y bucle periódico de 60 s sin costura."""
    rng = np.random.default_rng(1160)
    n = int(60.0 * SR)
    tt = np.arange(n) / SR
    # siseo: pasa-banda 300 Hz-5 kHz, apagado por el cristal (sin el brillo plano de la estática)
    sise = _periodico(n, lambda f: _banda(f, 300, 4500) * (1 + 0.7 * np.exp(-((f - 1500) / 1200) ** 2)), rng)
    # cuerpo del aguacero (tejado y piedra), discreto y sin modular
    cuerpo = _periodico(n, lambda f: _banda(f, 120, 600), rng)
    # gotas finas y densas + algunas gotas cercanas en el alféizar
    finas = _granos(n, 320, 6, rng, lambda f: _banda(f, 1000, 4500))
    cerca = _granos(n, 4, 14, rng, lambda f: _banda(f, 700, 3500))
    finas /= np.sqrt(np.mean(finas ** 2)) or 1
    cerca /= np.sqrt(np.mean(cerca ** 2)) or 1
    # la intensidad sube y baja despacio (periodos que dividen 60 s: sin salto al repetir)
    mod = 1 + 0.12 * np.sin(2 * np.pi * tt / 20) + 0.06 * np.sin(2 * np.pi * tt / 12 + 1.3)
    x = (sise * 0.8 + cuerpo * 0.35 + finas * 0.8) * mod + cerca * 0.25
    x = x / np.sqrt(np.mean(x ** 2)) * 0.067  # mismo nivel medio que antes: no altera la mezcla
    return 0.5 * np.tanh(x / 0.5)  # limitador suave: sin recortes (que también sonarían a chasquido)


def fuego():
    """Chimenea: rumor cálido y chasquidos suaves y espaciados (antes: miles de chasquidos secos
    agudos que se oían como interferencia). Bucle periódico de 20 s sin costura."""
    rng = np.random.default_rng(1161)
    n = int(20.0 * SR)
    rumor = _periodico(n, lambda f: _banda(f, 60, 700, 1), rng)
    chas = _granos(n, 3, 9, rng, lambda f: _banda(f, 500, 3500))
    chas /= np.sqrt(np.mean(chas ** 2)) or 1
    x = rumor + chas * 0.22
    x = x / np.sqrt(np.mean(x ** 2)) * 0.02
    return 0.3 * np.tanh(x / 0.3)


def piedra():
    tt = A.t(2.2)
    x = A.lowpass(A.rng.standard_normal(len(tt)), 0.03) * 3 + A.lowpass(A.rng.standard_normal(len(tt)), 0.25) * 0.3
    x *= np.sin(np.pi * tt / 2.2) ** 0.7
    x[-int(0.25 * SR):] += A.thud()[: int(0.25 * SR)] if len(A.thud()) >= int(0.25 * SR) else 0
    return A.norm(x, 0.7)


def gramofono():
    tt = A.t(12.0)
    x = A.lowpass(A.rng.standard_normal(len(tt)), 0.5) * 0.05
    # crepitar del disco: chasquidos suaves y escasos (antes 260 impulsos secos que sonaban a interferencia)
    rp = np.random.default_rng(1162)
    pops = _granos(len(tt), 6, 3, rp, lambda f: _banda(f, 800, 4000))
    x += pops / (np.sqrt(np.mean(pops ** 2)) or 1) * 0.02
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


def musica_misterio():
    """Música original de MASK GROUP (sintetizada, propia): bucle de 64 s en re menor, pad + arpegio + pulso."""
    dur = 64.0
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.zeros(n)
    acordes = [[146.83, 174.61, 220.0], [116.54, 146.83, 174.61], [98.0, 116.54, 146.83], [110.0, 138.59, 164.81]]
    seg = 8.0
    for k in range(int(dur / seg)):
        ac = acordes[k % 4]
        a, b = int(k * seg * SR), int((k + 1) * seg * SR)
        ts = tt[a:b] - k * seg
        e = np.minimum(1, ts / 1.5) * np.minimum(1, (seg - ts) / 1.5)
        pad = sum(np.sin(2 * np.pi * f * ts) + 0.35 * np.sin(2 * np.pi * f * 2.003 * ts) for f in ac)
        x[a:b] += pad * e * 0.11
        # arpegio pulsado (corcheas a 60 ppm) una octava arriba
        for j in range(int(seg / 0.5)):
            f = ac[j % 3] * 2 * (2 if j % 6 == 5 else 1)
            i0 = a + int(j * 0.5 * SR)
            m = min(int(0.9 * SR), b - i0)
            tk = np.arange(m) / SR
            nota = (np.sin(2 * np.pi * f * tk) + 0.25 * np.sin(2 * np.pi * 3 * f * tk)) * np.exp(-tk * 5.5)
            x[i0:i0 + m] += nota * (0.07 if j % 2 == 0 else 0.045)
        # pulso grave cada 2 s
        for j in range(4):
            i0 = a + int(j * 2.0 * SR)
            m = min(int(0.6 * SR), b - i0)
            tk = np.arange(m) / SR
            x[i0:i0 + m] += np.sin(2 * np.pi * 55 * tk) * np.exp(-tk * 7) * 0.22
    return A.norm(x, 0.5)


# ---- kit museo (escape room «El museo que miente»)
def tictac():
    """Péndulo del reloj de pie: bucle de 2 s (tic agudo en 0 s, tac grave en 1 s), madera, sin costura."""
    n = int(2.0 * SR)
    x = np.zeros(n)
    for t0, f, g in [(0.0, 2100, 1.0), (1.0, 1500, 0.8)]:
        tk = A.t(0.12)
        golpe = (np.sin(2 * np.pi * f * tk) + 0.5 * np.sin(2 * np.pi * f * 1.51 * tk)) * A.env(len(tk), 0.0004, 0.018)
        golpe += A.lowpass(A.rng.standard_normal(len(tk)), 0.3) * A.env(len(tk), 0.0003, 0.006) * 0.6
        i0 = int(t0 * SR)
        x[i0:i0 + len(tk)] += golpe * g
    x = x - A.lowpass(x, 0.01)
    return A.norm(x, 0.35)


def cristal():
    """Vitrina: tintineo de cristal (parciales inarmónicos con caída rápida)."""
    tt = A.t(1.6)
    x = sum(np.sin(2 * np.pi * f * tt) * A.env(len(tt), 0.001, d) * g
            for f, d, g in [(2637, 0.6, 1), (3953, 0.4, 0.6), (5274, 0.25, 0.4), (6900, 0.15, 0.25)])
    return A.norm(x, 0.3)


def campanadas():
    """Reloj de pie dando la hora: campanada grave con armónicos y cola larga."""
    tt = A.t(4.0)
    x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) * g for f, k, g in [(196.0, 0.9, 1), (392.6, 1.4, 0.5), (523.0, 2.2, 0.35), (787.0, 3.0, 0.2)])
    x *= np.minimum(1, tt / 0.004)
    return A.norm(x, 0.55)


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
    "musica": musica_misterio,
    "tictac": tictac,
    "cristal": cristal,
    "campanadas": campanadas,
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
