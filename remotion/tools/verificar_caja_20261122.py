"""Verificación por código del acertijo del dom 22/11 «La caja del cartógrafo» (familia codigo_por_pistas).

Lee las placas de la ficha, recorre las 720 combinaciones de 3 cifras distintas y comprueba que:
1) solo una cumple las cinco respuestas de la caja y es la de la ficha;
2) cada placa es necesaria (sin cualquiera de ellas hay más de una solución).
Uso: python tools/verificar_caja_20261122.py [--ficha fichas/E60-2026-11-22-corto.json]
"""
import argparse, itertools, json, sys

ap = argparse.ArgumentParser()
ap.add_argument("--ficha", default="fichas/E60-2026-11-22-corto.json")
f = json.load(open(ap.parse_args().ficha, encoding="utf-8"))
pz = f["puzle"]
placas = [tuple(p["cifras"]) for p in pz["placas"]]
pistas = [tuple(x) for x in pz["pistas"]]  # (bien colocadas, correctas mal colocadas)

def respuesta(codigo, intento):
    bien = sum(a == b for a, b in zip(codigo, intento))
    return bien, len(set(codigo) & set(intento)) - bien

def soluciones(idx):
    return ["".join(map(str, c)) for c in itertools.permutations(range(10), 3)
            if all(respuesta(c, placas[i]) == pistas[i] for i in idx)]

todas = soluciones(range(len(placas)))
print("Soluciones:", todas)
ok = todas == [pz["respuesta"]]
for i in range(len(placas)):
    n = len(soluciones([j for j in range(len(placas)) if j != i]))
    print(f"Sin la placa {placas[i]}: {n} soluciones")
    ok &= n > 1
# las respuestas grabadas en las placas coinciden con las pistas numéricas
txt = {(0, 0): "NINGUNA", (1, 0): "1 BIEN COLOCADA", (0, 1): "1 MAL COLOCADA", (0, 2): "2 MAL COLOCADAS"}
ok &= all(txt[p] == pl["texto"] for p, pl in zip(pistas, pz["placas"]))
print("OK: solución única y todas las placas son necesarias" if ok else "FALLO")
sys.exit(0 if ok else 1)
