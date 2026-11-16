"""Verifica por código el acertijo del 19/11 «La balanza del archivero» (solución única)."""
import json, sys
f = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "fichas/E60-2026-11-19-corto.json"))
p = f["puzle"]
izq = p["izquierda"]["n"] * p["izquierda"]["peso"]
sols = [x for x in range(1, 1001) if p["derecha"]["n"] * x == izq]
assert sols == [p["respuesta"]], sols
assert izq / p["derecha"]["n"] == p["respuesta"]
print(f"OK: única solución {sols[0]} g (izquierda {izq} g)")
