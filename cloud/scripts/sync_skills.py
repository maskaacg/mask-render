"""Mantiene iguales las dos copias de las skills: .claude/skills (Claude) y .agents/skills (Codex).

La copia que manda es .claude/skills. Edita siempre ahí y después ejecuta este script.

    python cloud/scripts/sync_skills.py --check   -> sale con 1 si las copias difieren (no cambia nada)
    python cloud/scripts/sync_skills.py --fix     -> copia .claude/skills sobre .agents/skills

No instala skills externas ni ejecuta nada de su contenido: solo compara y copia archivos.
"""
import filecmp, os, shutil, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ORIGEN = os.path.join(RAIZ, ".claude", "skills")
DESTINO = os.path.join(RAIZ, ".agents", "skills")


def archivos(base):
    out = set()
    for d, _, fs in os.walk(base):
        for f in fs:
            out.add(os.path.relpath(os.path.join(d, f), base))
    return out


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ("--check", "--fix"):
        raise SystemExit(__doc__)
    a, b = archivos(ORIGEN), archivos(DESTINO)
    faltan = sorted(a - b)
    sobran = sorted(b - a)
    distintos = sorted(f for f in a & b if not filecmp.cmp(os.path.join(ORIGEN, f), os.path.join(DESTINO, f), shallow=False))
    if not (faltan or sobran or distintos):
        print(f"Skills iguales en las dos copias ({len(a)} archivos).")
        return
    for etiqueta, lista in (("Falta en .agents", faltan), ("Sobra en .agents", sobran), ("Distinto", distintos)):
        for f in lista:
            print(f"{etiqueta}: {f}")
    if sys.argv[1] == "--check":
        sys.exit(1)
    for f in faltan + distintos:
        os.makedirs(os.path.dirname(os.path.join(DESTINO, f)), exist_ok=True)
        shutil.copy2(os.path.join(ORIGEN, f), os.path.join(DESTINO, f))
    for f in sobran:
        os.remove(os.path.join(DESTINO, f))
    print(f"Sincronizado: {len(faltan) + len(distintos)} copiados, {len(sobran)} eliminados de .agents/skills.")


if __name__ == "__main__":
    main()
