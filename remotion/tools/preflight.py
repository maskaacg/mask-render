"""Comprobación previa de un encargo de render de ENIGMA 60, ANTES de subirlo a GitHub.

Repite en local las validaciones que hará GitHub Actions y las reglas de PRODUCCION.md, para no
gastar una ejecución en un encargo que va a fallar (composición no permitida, ficha que falta,
puzle repetido, vertical demasiado corto...).

Uso (desde remotion/):
    python tools/preflight.py encargos/<ID>.json              -> render-remotion (cortos 9:16)
    python tools/preflight.py encargos/capitulos/<ID>.json    -> render-capitulo (16:9 y avances)
    python tools/preflight.py encargos/uniones/<ID>.json      -> unir-capitulo

Sale con código 1 si hay FALLOS. Los AVISOS no bloquean. No renderiza, no sube ni publica nada.
"""
import json, os, re, subprocess, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))          # remotion/
WF = os.path.join(os.path.dirname(RAIZ), ".github", "workflows")
ID_RE = re.compile(r"[A-Za-z0-9._-]{4,80}")
FICHA_RE = re.compile(r"fichas/[A-Za-z0-9._-]+\.json")
MIN_PALABRAS_VERTICAL = 140      # PRODUCCION.md: con menos de 140 palabras no se renderiza
RANGO_RECOMENDADO = (150, 190)   # PRODUCCION.md: unas 150-190 palabras para 70-120 s

# Dónde declara cada workflow las composiciones que acepta (se leen del propio .yml para no duplicar la lista).
FUENTES = {
    "corto": ("render-remotion.yml", r'case "\$COMP" in ([^)]*)\)', "|"),
    "capitulo": ("render-capitulo.yml", r"e\.get\('composicion'\) in \(([^)]*)\)", ","),
    "union": ("unir-capitulo.yml", r"assert c in \(([^)]*)\)", ","),
}


def permitidas(tipo):
    archivo, patron, sep = FUENTES[tipo]
    try:
        m = re.search(patron, open(os.path.join(WF, archivo), encoding="utf-8").read())
    except OSError:
        return None
    if not m:
        return None
    return {x.strip().strip("'\"") for x in m.group(1).split(sep) if x.strip()}


def palabras(ficha):
    return sum(len(str(l.get("texto", "")).split()) for l in ficha.get("lineas", []) if isinstance(l, dict))


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    ruta = sys.argv[1].replace("\\", "/")
    if ruta.startswith("remotion/"):
        ruta = ruta[len("remotion/"):]
    carpeta = os.path.dirname(ruta)
    tipo = {"encargos": "corto", "encargos/capitulos": "capitulo", "encargos/uniones": "union"}.get(carpeta)
    fallos, avisos = [], []
    if tipo is None:
        raise SystemExit(f"FALLO: {ruta} no está en encargos/, encargos/capitulos/ ni encargos/uniones/")
    try:
        enc = json.load(open(os.path.join(RAIZ, ruta), encoding="utf-8"))
    except (OSError, ValueError) as e:
        raise SystemExit(f"FALLO: no se puede leer el encargo: {e}")

    eid = str(enc.get("encargo_id", ""))
    if not ID_RE.fullmatch(eid):
        fallos.append(f"encargo_id no válido: {eid!r} (4-80 caracteres: letras, números, . _ -)")
    elif os.path.splitext(os.path.basename(ruta))[0] != eid:
        avisos.append("el nombre del archivo no coincide con encargo_id")

    comp = enc.get("composicion", "E60Capitulo" if tipo == "union" else None)
    lista = permitidas(tipo)
    if lista is None:
        avisos.append(f"no se pudo leer la lista de composiciones de {FUENTES[tipo][0]}; compruébala a mano")
    elif tipo == "corto" and comp is None:
        avisos.append("sin `composicion`: GitHub usará E60CincoSellosProto (prototipo)")
    elif comp not in lista:
        otros = [t for t in FUENTES if t != tipo and comp in (permitidas(t) or ())]
        pista = f" Esa composición va por {FUENTES[otros[0]][0]}: mueve el encargo a su carpeta." if otros else ""
        fallos.append(f"composición {comp!r} no permitida en {FUENTES[tipo][0]}.{pista}")

    if tipo == "union":
        for k in ("origen_id", "ficha_id"):
            if not ID_RE.fullmatch(str(enc.get(k, ""))):
                fallos.append(f"{k} no válido")
        if not re.fullmatch(r"[0-9]{6,20}", str(enc.get("origen_run_id", ""))):
            fallos.append("origen_run_id no válido")
    else:
        f = enc.get("ficha", "")
        if not f:
            (fallos if tipo == "capitulo" else avisos).append("el encargo no indica `ficha`")
        elif not FICHA_RE.fullmatch(f) or not os.path.isfile(os.path.join(RAIZ, f)):
            fallos.append(f"ficha no válida o inexistente: {f}")
        else:
            ficha = json.load(open(os.path.join(RAIZ, f), encoding="utf-8"))
            vertical = ficha.get("formato") == "corto" or int(ficha.get("alto", 0)) > int(ficha.get("ancho", 0))
            n = palabras(ficha)
            if vertical:
                if n < MIN_PALABRAS_VERTICAL:
                    fallos.append(f"vertical con {n} palabras: hacen falta al menos {MIN_PALABRAS_VERTICAL} para llegar a 70 s")
                elif not RANGO_RECOMENDADO[0] <= n <= RANGO_RECOMENDADO[1]:
                    avisos.append(f"vertical con {n} palabras (recomendado {RANGO_RECOMENDADO[0]}-{RANGO_RECOMENDADO[1]}); vigila que dure 70-120 s")
            if not str(ficha.get("auditoria", "")).strip():
                avisos.append("la ficha no tiene `auditoria` (verificación de puzles y QA visual)")
            if ficha.get("puzle") or ficha.get("puzles"):
                vid = re.sub(r"-v[0-9]+.*$", "", eid)
                r = subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "verificar_puzles_unicos.py"),
                                    "--ficha", os.path.join(RAIZ, f), "--video-id", vid], capture_output=True, text=True)
                if r.returncode != 0:
                    fallos.append("puzles únicos: " + (r.stdout + r.stderr).strip().replace("\n", " | ")[:400])

    for a in avisos:
        print("AVISO:", a)
    for x in fallos:
        print("FALLO:", x)
    print(f"{eid or ruta}: {'NO APTO' if fallos else 'APTO'} para {FUENTES[tipo][0]} ({len(fallos)} fallos, {len(avisos)} avisos)")
    sys.exit(1 if fallos else 0)


if __name__ == "__main__":
    main()
