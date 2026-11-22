"""Comprueba que los puzles de una ficha no repiten familia (mecánica) con ningún otro vídeo.

Uso: python tools/verificar_puzles_unicos.py --ficha fichas/X.json --video-id E60ES-...
     python tools/verificar_puzles_unicos.py --registro   (revisa el registro completo)
Sale con código 1 si hay repeticiones. Al aprobar un vídeo, añade sus puzles a PUZLES_USADOS.json.
"""
import argparse, collections, json, os, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def registro():
    return json.load(open(os.path.join(RAIZ, "PUZLES_USADOS.json"), encoding="utf-8"))["puzles"]

def familias_ficha(ficha):
    pz = ficha.get("puzles") or ([ficha["puzle"]] if ficha.get("puzle") else [])
    out = []
    for p in pz:
        fam = (p.get("familia") or "").strip()
        if not fam:
            raise SystemExit(f"FALTA_FAMILIA en el puzle {p.get('id') or p.get('tipo')}: declárala antes de renderizar")
        out.append((p.get("id") or p.get("tipo"), fam))
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ficha"); ap.add_argument("--video-id"); ap.add_argument("--registro", action="store_true")
    a = ap.parse_args()
    reg = registro(); fallos = []
    # un avance comparte puzle y sala con su vídeo largo (E60ES-ER-004-AVANCE ≡ E60ES-ER-004)
    base = lambda v: (v or "").removesuffix("-AVANCE")
    if a.registro:
        c = collections.defaultdict(list)
        for r in reg: c[r["familia"]].append(f'{r["video_id"]} {r["puzle"]}')
        fallos = [f"{f}: " + " | ".join(v) for f, v in c.items() if len(v) > 1]
    else:
        ficha = json.load(open(a.ficha, encoding="utf-8"))
        propias = familias_ficha(ficha)
        vistas = collections.Counter(f for _, f in propias)
        fallos += [f"{f} se repite dentro del mismo vídeo" for f, n in vistas.items() if n > 1]
        sala = ficha.get("sala")
        if ficha.get("formato") == "corto" and not isinstance(sala, dict):
            fallos.append("SIN_SALA_PROPIA: el corto debe declarar `sala` (composición E60CortoSala)")
        if isinstance(sala, dict):
            firma = "|".join([sala["pared"]["patron"], sala["suelo"]["patron"], sala["luz"]["tipo"]])
            for r in json.load(open(os.path.join(RAIZ, "PUZLES_USADOS.json"), encoding="utf-8")).get("salas", []):
                if base(r["video_id"]) != base(a.video_id) and (r["sala"] == sala["id"] or r["firma"] == firma):
                    fallos.append(f'sala «{sala["id"]}» ({firma}) repite la de {r["video_id"]} ({r["sala"]})')
        for pid, fam in propias:
            for r in reg:
                if r["familia"] == fam and base(r["video_id"]) != base(a.video_id):
                    fallos.append(f'{pid}: familia «{fam}» ya usada en {r["video_id"]} ({r["puzle"]})')
    if fallos:
        print("PUZLE_REPETIDO\n- " + "\n- ".join(fallos)); sys.exit(1)
    print("OK: todos los puzles son únicos")

if __name__ == "__main__":
    main()
