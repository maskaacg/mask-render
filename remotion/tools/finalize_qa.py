"""Masteriza y verifica un render de Remotion.

1. Normaliza el audio a -14 LUFS (loudnorm en dos pasadas, pico -1.5 dBTP).
2. Mide: formato, duración, sonoridad, movimiento por segundo.
3. Escribe <id>.mp4 y <id>.qa.json (con SHA-256) en la carpeta de salida.

El veredicto es técnico: nunca equivale a la aprobación del Propietario.
"""
import argparse
import collections
import hashlib
import json
import os
import re
import subprocess


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=True)


def loudness(path):
    err = run(["ffmpeg", "-hide_banner", "-i", path, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"]).stderr
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1])
    peak = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)[-1])
    return i, peak


def motion_per_second(path, fps):
    err = run(["ffmpeg", "-hide_banner", "-i", path, "-vf",
               "scale=180:320,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG",
               "-f", "null", "-"]).stderr
    vals = [float(x) for x in re.findall(r"YAVG=([\d.]+)", err)]
    sec = collections.defaultdict(list)
    for i, v in enumerate(vals):
        sec[(i + 1) // fps].append(v)
    return [round(sum(a) / len(a), 3) for _, a in sorted(sec.items())]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--entrada", required=True)
    ap.add_argument("--id", required=True)
    ap.add_argument("--salida", default="final")
    ap.add_argument("--fps", type=int, default=30)
    a = ap.parse_args()
    os.makedirs(a.salida, exist_ok=True)
    out = os.path.join(a.salida, a.id + ".mp4")

    first = run(["ffmpeg", "-hide_banner", "-i", a.entrada, "-af",
                 "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"]).stderr
    m = json.loads(first[first.rindex("{"): first.rindex("}") + 1])
    af = ("loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:"
          f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
    run(["ffmpeg", "-y", "-hide_banner", "-i", a.entrada, "-c:v", "copy", "-af", af,
         "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out])

    probe = json.loads(run(["ffprobe", "-v", "error", "-show_entries",
                            "format=duration:stream=codec_type,codec_name,width,height",
                            "-of", "json", out]).stdout)
    v = next(s for s in probe["streams"] if s["codec_type"] == "video")
    has_audio = any(s["codec_type"] == "audio" for s in probe["streams"])
    lufs, peak = loudness(out)
    motion = motion_per_second(out, a.fps)
    frozen = [i for i, x in enumerate(motion) if x < 0.05]
    sha = hashlib.sha256(open(out, "rb").read()).hexdigest()

    fallos = []
    if v["codec_name"] != "h264":
        fallos.append("CODEC_VIDEO")
    if not has_audio:
        fallos.append("SIN_AUDIO")
    if abs(lufs + 14) > 1.0:
        fallos.append(f"SONORIDAD_{lufs}")
    if frozen:
        fallos.append(f"SEGUNDOS_CONGELADOS_{frozen}")
    # Regla del Propietario (14/11 y 16/11/2026): todo vídeo vertical 9:16 (acertijos, avances,
    # cortos-historia) dura de 70 a 120 s. Por debajo de 70 s no llega a Telegram.
    duracion = float(probe["format"]["duration"])
    if int(v["height"]) > int(v["width"]):
        dmin = float(os.getenv("CORTO_MIN_S", "70"))
        dmax = float(os.getenv("CORTO_MAX_S", "120"))
        if duracion < dmin:
            fallos.append(f"CORTO_DEMASIADO_CORTO_{duracion:.1f}s_MIN_{dmin:.0f}s")
        elif duracion > dmax:
            fallos.append(f"CORTO_DEMASIADO_LARGO_{duracion:.1f}s_MAX_{dmax:.0f}s")

    qa = {
        "encargo_id": a.id,
        "motor": "MASK_REMOTION_PROTO_V1",
        "estado": "TEST_TECNICO_NO_PUBLICABLE",
        "veredicto": "PASS" if not fallos else "FAIL",
        "fallos": fallos,
        "ancho": v["width"],
        "alto": v["height"],
        "duracion_s": round(float(probe["format"]["duration"]), 2),
        "sonoridad_lufs": lufs,
        "pico_dbfs": peak,
        "movimiento_por_segundo": motion,
        "tamano_bytes": os.path.getsize(out),
        "sha256": sha,
        "voz": "Kokoro-82M em_alex (Apache-2.0)",
        "efectos": "sintetizados (numpy), propios",
        "aprobacion": "PENDIENTE_PROPIETARIO",
    }
    with open(os.path.join(a.salida, a.id + ".qa.json"), "w", encoding="utf-8") as f:
        json.dump(qa, f, ensure_ascii=False, indent=1)
    print(json.dumps(qa, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
