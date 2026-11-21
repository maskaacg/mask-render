"""Voz pregenerada: guarda o restaura las locuciones de una ficha en remotion/voz_lista/<id>/.

La voz expresiva (Chatterbox, CPU) tarda ~1 h por capítulo. Generarla fuera de GitHub Actions y
guardarla en la rama (FLAC sin pérdida) ahorra minutos de Actions y hace el render reproducible.

  python tools/voz_lista.py guardar   --ficha fichas/E60-ER-001.json
  python tools/voz_lista.py restaurar --ficha fichas/E60-ER-001.json
"""
import argparse
import glob
import json
import os
import shutil
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
import ficha_audio as FA  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("accion", choices=["guardar", "restaurar"])
    ap.add_argument("--ficha", required=True)
    a = ap.parse_args()
    fid = json.load(open(a.ficha, encoding="utf-8"))["id"]
    vdir, ldir = os.path.join("public", "audio", fid), os.path.join("voz_lista", fid)
    if a.accion == "guardar":
        os.makedirs(ldir, exist_ok=True)
        for w in sorted(glob.glob(os.path.join(vdir, "*.wav"))):
            x, sr = sf.read(w, dtype="float32")
            sf.write(os.path.join(ldir, os.path.basename(w)[:-4] + ".flac"), x, sr, subtype="PCM_16")
        shutil.copy(os.path.join("out", f"props_{fid}.json"), os.path.join(ldir, "props.json"))
        if os.path.exists(os.path.join("out", f"voz_{fid}.json")):
            shutil.copy(os.path.join("out", f"voz_{fid}.json"), os.path.join(ldir, "voz_qa.json"))
    else:
        os.makedirs(vdir, exist_ok=True)
        os.makedirs("out", exist_ok=True)
        for f in sorted(glob.glob(os.path.join(ldir, "*.flac"))):
            x, sr = sf.read(f, dtype="float32")
            sf.write(os.path.join(vdir, os.path.basename(f)[:-5] + ".wav"), x, sr)
        sdir = os.path.join("public", "audio", "sfx")
        os.makedirs(sdir, exist_ok=True)
        for name, fn in FA.SFX.items():
            sf.write(os.path.join(sdir, name + ".wav"), np.asarray(fn(), dtype=np.float32), FA.SR)
        shutil.copy(os.path.join(ldir, "props.json"), os.path.join("out", f"props_{fid}.json"))
    print(a.accion, fid, len(glob.glob(os.path.join(ldir, "*.flac"))), "líneas")


if __name__ == "__main__":
    main()
