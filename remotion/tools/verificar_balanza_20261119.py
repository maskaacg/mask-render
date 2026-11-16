"""Verifica por código el acertijo del 19/11 «El taller del orfebre» (solución única).
Pesada 1: a·L = b·M.  Pesada 2: c·L + d·M = P.  Pregunta: M."""
import json, sys
from fractions import Fraction as Fr
f = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "fichas/E60-2026-11-19-corto.json"))
p = f["puzle"]
a, b = p["pesada1"]["llaves"], p["pesada1"]["monedas"]
c, d, P = p["pesada2"]["llaves"], p["pesada2"]["monedas"], p["pesada2"]["pesa"]
det = a * d + b * c  # sistema: a L - b M = 0 ; c L + d M = P
assert det != 0, "sistema indeterminado"
M = Fr(a * P, det); L = Fr(b, a) * M
assert (M, L) == (p["respuesta"], p["llave"]), (M, L)
enteras = [(l, m) for l in range(1, 1001) for m in range(1, 1001) if a * l == b * m and c * l + d * m == P]
assert enteras == [(p["llave"], p["respuesta"])], enteras
print(f"OK: solución única moneda={M} g, llave={L} g")
