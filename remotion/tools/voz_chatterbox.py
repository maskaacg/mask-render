"""Voz expresiva para ENIGMA 60 con Chatterbox Multilingual (Resemble AI, licencia MIT).

- Cada línea de la ficha se genera con su papel (narrador, custodio…) a partir de una voz de
  referencia SINTÉTICA guardada en remotion/voces/ (creada con Kokoro-82M): no se clona a nadie real.
- Control de calidad de voz: cada línea se transcribe con faster-whisper (MIT) y se compara con el
  guion; si faltan o sobran palabras (WER > umbral) se regenera con otra semilla, hasta N intentos,
  y se conserva la mejor toma. El informe queda en out/voz_<id>.json.
- Escribe public/audio/<id>/<línea>.wav, los efectos compartidos y out/props_<id>.json, igual que
  ficha_audio.py, para que el resto de la cadena no cambie.

Uso:
  python tools/voz_chatterbox.py --ficha fichas/E60-S01-C01.json [--solo n01,n02]
"""
import argparse
import gc
import json
import os
import re
import sys
import time
import unicodedata

os.environ.setdefault("TQDM_DISABLE", "1")
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
import ficha_audio as FA  # noqa: E402

PAPELES = {
    # exaggeration / cfg_weight: «expresiva» elegida por el Propietario el 14/11/2026
    "narrador": {"ref": "voces/ref_narrador.wav", "exaggeration": 0.8, "cfg_weight": 0.3},
    "custodio": {"ref": "voces/ref_custodio.wav", "exaggeration": 0.45, "cfg_weight": 0.5, "efecto": "metal"},
    # Escape rooms independientes: la archivera de «La torre del archivero» (ref. Kokoro ef_dora)
    "archivera": {"ref": "voces/ref_archivera.wav", "exaggeration": 0.6, "cfg_weight": 0.4, "efecto": "sala"},
    # Escape room 2 «El museo que miente»: el conservador (ref. Kokoro em_santa, sin efecto metálico)
    "conservador": {"ref": "voces/ref_conservador.wav", "exaggeration": 0.55, "cfg_weight": 0.45, "efecto": "sala"},
    # Profundidad 600 desde el cap. 2: voces propias (la biblia pedía no reutilizar las de los escape rooms)
    "alma": {"ref": "voces/ref_alma.wav", "exaggeration": 0.6, "cfg_weight": 0.4},
    "damian": {"ref": "voces/ref_damian.wav", "exaggeration": 0.45, "cfg_weight": 0.5},
    "cero": {"ref": "voces/ref_custodio.wav", "exaggeration": 0.35, "cfg_weight": 0.5, "efecto": "metal"},
}


def normaliza(txt):
    from num2words import num2words

    txt = txt.lower()
    txt = re.sub(r"(\d+):(\d+)", lambda m: f"{m.group(1)} y {m.group(2)}", txt)
    txt = re.sub(r"\d+", lambda m: " " + num2words(int(m.group()), lang="es") + " ", txt)
    txt = "".join(c for c in unicodedata.normalize("NFD", txt) if unicodedata.category(c) != "Mn")
    return re.findall(r"[a-zñ]+", txt)


def wer(ref, hyp):
    r, h = normaliza(ref), normaliza(hyp)
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1]))
            prev, d[j] = d[j], cur
    return d[len(h)] / max(1, len(r))


def parte(txt, maximo=140):
    """Divide líneas largas por frases: Chatterbox en CPU dispara la memoria con textos largos."""
    if len(txt) <= maximo:
        return [txt]
    frases = re.findall(r"[^.?!:]+[.?!:]+|[^.?!:]+$", txt)
    out, cur = [], ""
    for f in (x.strip() for x in frases):
        if cur and len(cur) + 1 + len(f) > maximo:
            out.append(cur)
            cur = f
        else:
            cur = (cur + " " + f).strip()
    if cur:
        out.append(cur)
    return out


def recorta(x, sr):
    idx = np.where(np.abs(x) > 0.01)[0]
    if len(idx) == 0:
        return x
    return x[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.15 * sr)]


def sala(x, sr):
    """Reverberación corta de piedra (ecos tempranos atenuados) para voces «fuera de plano»."""
    y = x.copy()
    for ms, g in ((37, 0.32), (61, 0.24), (97, 0.17), (149, 0.11), (211, 0.07)):
        d = int(sr * ms / 1000)
        y[d:] += g * x[:-d]
    return (y / (np.abs(y).max() + 1e-9) * 0.9).astype(np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ficha", required=True)
    ap.add_argument("--umbral", type=float, default=0.12)
    ap.add_argument("--intentos", type=int, default=4)
    ap.add_argument("--solo", default="")
    ap.add_argument("--reanudar", action="store_true", help="no regenera líneas que ya tienen WAV")
    ap.add_argument("--hilos", type=int, default=os.cpu_count() or 2)
    a = ap.parse_args()

    import torch
    from scipy.signal import resample_poly
    from faster_whisper import WhisperModel
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS

    torch.set_num_threads(a.hilos)
    ficha = json.load(open(a.ficha, encoding="utf-8"))
    fid = ficha["id"]
    vdir = os.path.join("public", "audio", fid)
    sdir = os.path.join("public", "audio", "sfx")
    os.makedirs(vdir, exist_ok=True)
    os.makedirs(sdir, exist_ok=True)
    for name, fn in FA.SFX.items():
        p = os.path.join(sdir, name + ".wav")
        if not os.path.exists(p):
            sf.write(p, fn().astype(np.float32), FA.SR)

    tts = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
    asr = WhisperModel("small", device="cpu", compute_type="int8")
    solo = set(filter(None, a.solo.split(",")))
    rinf = os.path.join("out", f"voz_{fid}.json")
    informe = json.load(open(rinf, encoding="utf-8")) if os.path.exists(rinf) else {}
    dur = {}
    t0 = time.time()
    for ln in ficha["lineas"]:
        lid = ln["id"]
        ruta = os.path.join(vdir, lid + ".wav")
        if ((solo and lid not in solo) or a.reanudar) and os.path.exists(ruta):
            dur[lid] = round(sf.info(ruta).duration, 3)
            continue
        papel = PAPELES[ln.get("voz", "narrador")]
        trozos = parte(ln["texto"])
        piezas, errores, hyps, ns = [], [], [], []
        for j, trozo in enumerate(trozos):
            mejor = None
            # líneas deletreadas: Whisper transcribe letras sueltas, el WER no sirve → una sola toma
            for k in range(1 if ln.get("deletreo") else a.intentos):
                torch.manual_seed(60 + k * 101 + sum(map(ord, lid)) + j * 7)
                with torch.inference_mode():
                    w = tts.generate(trozo, language_id="es", audio_prompt_path=papel["ref"],
                                     exaggeration=papel["exaggeration"], cfg_weight=papel["cfg_weight"])
                x = recorta(w.squeeze(0).numpy().astype(np.float32), tts.sr)
                del w
                gc.collect()
                seg, _ = asr.transcribe(resample_poly(x, 16000, tts.sr).astype(np.float32), language="es", beam_size=1)
                hyp = " ".join(s_.text for s_ in seg)
                e = wer(trozo, hyp)
                if mejor is None or e < mejor[0]:
                    mejor = (e, x, hyp, k + 1)
                if e <= a.umbral:
                    break
            piezas.append(mejor[1])
            errores.append(mejor[0] * max(1, len(trozo.split())))
            hyps.append(mejor[2])
            ns.append(mejor[3])
        pausa = np.zeros(int(0.22 * tts.sr), dtype=np.float32)
        x = np.concatenate([q for p_ in piezas for q in (p_, pausa)][:-1])
        e = sum(errores) / max(1, len(ln["texto"].split()))
        hyp, n = " | ".join(hyps), max(ns)
        if papel.get("efecto") == "metal":
            x = FA.metal(x, tts.sr)
        elif papel.get("efecto") == "sala":
            x = sala(x, tts.sr)
        sf.write(ruta, x, tts.sr)
        dur[lid] = round(len(x) / tts.sr, 3)
        informe[lid] = {"wer": round(e, 3), "intentos": n, "ok": e <= a.umbral, "transcripcion": hyp}
        os.makedirs("out", exist_ok=True)
        json.dump(informe, open(rinf, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"{lid} wer={e:.2f} intentos={n} {dur[lid]}s ({round(time.time() - t0)}s)", flush=True)

    os.makedirs("out", exist_ok=True)
    props = {"ficha": ficha, "duraciones": dur,
             "voz": {"modelo": "Chatterbox Multilingual (Resemble AI)", "licencia": "MIT", "referencia": "sintética (Kokoro-82M)", "estilo": "expresiva"}}
    json.dump(props, open(os.path.join("out", f"props_{fid}.json"), "w", encoding="utf-8"), ensure_ascii=False)
    json.dump(informe, open(os.path.join("out", f"voz_{fid}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    malas = [k for k, v in informe.items() if not v["ok"]]
    print(json.dumps({"lineas": len(dur), "por_revisar": malas}, ensure_ascii=False))


if __name__ == "__main__":
    main()
