"""Verificación por código del acertijo del dom 22/11 v2 «La balanza del molinero» (familia palanca_momentos).

Lee la ficha y recorre TODAS las formas de colgar las pesas sueltas en el lado indicado
(una pesa por gancho, solo ganchos libres) y comprueba que:
1) solo una colocación deja la barra recta (momentos iguales) y es la de la ficha;
2) la trampa anunciada (colocación que suma bien pero usa un gancho ocupado) existe de verdad,
   es decir, la regla «solo ganchos libres» es necesaria para que la solución sea única;
3) las cuentas que se muestran en pantalla son aritméticamente correctas.
Uso: python tools/verificar_balanza_20261122.py [--ficha fichas/E60-2026-11-22b-corto.json]
"""
import argparse, itertools, json, re, sys

ap = argparse.ArgumentParser()
ap.add_argument("--ficha", default="fichas/E60-2026-11-22b-corto.json")
f = json.load(open(ap.parse_args().ficha, encoding="utf-8"))
pz = f["puzle"]
N = pz["ganchos_por_lado"]
fijas = pz["fijas"]
sueltas = pz["sueltas"]
lado = sueltas[0]["lado"]
assert all(s["lado"] == lado for s in sueltas), "las pesas sueltas deben ir al mismo lado"

def neto(extra):
    return sum(p["lado"] * p["kg"] * p["gancho"] for p in fijas + extra)

ocupados = {p["gancho"] for p in fijas if p["lado"] == lado}
def soluciones(solo_libres):
    out = []
    for g in itertools.permutations(range(1, N + 1), len(sueltas)):
        if solo_libres and set(g) & ocupados:
            continue
        extra = [{"kg": s["kg"], "lado": lado, "gancho": gi} for s, gi in zip(sueltas, g)]
        if neto(extra) == 0:
            out.append(tuple((s["kg"], gi) for s, gi in zip(sueltas, g)))
    return out

ok = True
sol = soluciones(True)
esperada = tuple((s["kg"], s["gancho"]) for s in sueltas)
print("Momento izquierda:", sum(p["kg"] * p["gancho"] for p in fijas if p["lado"] < 0),
      "· derecha fija:", sum(p["kg"] * p["gancho"] for p in fijas if p["lado"] > 0))
print("Soluciones con ganchos libres:", sol)
ok &= sol == [esperada]
sin_regla = soluciones(False)
print("Soluciones si se permitiera un gancho ocupado:", sin_regla)
trampa = pz["trampa"]["gancho"]
ok &= len(sin_regla) > 1 and any(trampa in [g for _, g in s] for s in sin_regla)
ok &= trampa in ocupados
# cuentas de pantalla: «a×b + c×d = n»
for c in pz["cuentas"]:
    m = re.search(r"([\d×+\s]+)=\s*(\d+)", c["texto"])
    if not m:
        continue
    izq = sum(int(a) * int(b) for a, b in re.findall(r"(\d+)×(\d+)", m.group(1)))
    bien = izq == int(m.group(2))
    print(f'Cuenta «{c["texto"]}»:', "OK" if bien else "MAL")
    ok &= bien
print("OK: solución única, trampa real y cuentas correctas" if ok else "FALLO")
sys.exit(0 if ok else 1)
