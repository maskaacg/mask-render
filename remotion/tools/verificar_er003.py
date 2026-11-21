"""Verificación por código del escape room 3 «El observatorio apagado» (ficha E60-ER-003).

P1 conteo de cajas ocultas · P2 farolas con palancas vecinas · P3 anillos (torres de Hanói) ·
P4 trayectoria del rayo entre espejos. Cada solución debe ser ÚNICA y coincidir con la ficha.
Uso: python tools/verificar_er003.py [--ficha fichas/E60-ER-003.json]
"""
import argparse, itertools, json, sys
from collections import deque

ap = argparse.ArgumentParser()
ap.add_argument("--ficha", default="fichas/E60-ER-003.json")
f = json.load(open(ap.parse_args().ficha, encoding="utf-8"))
P = {p["id"]: p for p in f["puzles"]}
ok = True

# P1 · sin cajas flotando, la columna (i,j) tiene exactamente h cajas. Escalera monótona → todas las tapas visibles
H = P["P1"]["datos"]["alturas"]
total = sum(map(sum, H))
pisos = [sum(1 for fila in H for h in fila if h >= k) for k in (1, 2, 3)]
mono = all(H[i][j] >= H[i][j + 1] for i in range(3) for j in range(2)) and all(H[i][j] >= H[i + 1][j] for i in range(2) for j in range(3))
tapas = sum(1 for fila in H for h in fila if h > 0)
print("P1 total", total, "pisos", pisos, "escalera", mono, "tapas visibles", tapas)
ok &= str(total) == P["P1"]["respuesta"] and pisos == [8, 4, 1] and mono and tapas == 8 and H[2][2] == 0

# P2 · palanca i cambia i-1, i, i+1
ini = P["P2"]["datos"]["inicial"]
n = len(ini)
def aplica(s, x):
    s = list(s)
    for i in range(n):
        if x[i]:
            for j in (i - 1, i, i + 1):
                if 0 <= j < n:
                    s[j] ^= 1
    return s
sols = [x for x in itertools.product([0, 1], repeat=n) if aplica(ini, x) == [1] * n]
print("P2 soluciones", sols)
ok &= sols == [tuple(P["P2"]["datos"]["solucion"])] and P["P2"]["respuesta"] == "palancas " + " y ".join(str(i + 1) for i, v in enumerate(sols[0]) if v)
# el paso intermedio que cuenta la voz: tras la palanca 1 solo brilla la 1
ok &= aplica(ini, [1, 0, 0, 0]) == [1, 0, 0, 0] and aplica(ini, [0, 1, 0, 0]) == [1, 0, 1, 0]

# P3 · Hanói con BFS: estado = varilla de cada anillo (0 = más pequeño)
k = P["P3"]["datos"]["anillos"]
ini3, fin3 = (0,) * k, (2,) * k
dist = {ini3: 0}
q = deque([ini3])
while q:
    s = q.popleft()
    for a in range(3):
        top_a = next((r for r in range(k) if s[r] == a), None)
        if top_a is None:
            continue
        for b in range(3):
            if b == a:
                continue
            top_b = next((r for r in range(k) if s[r] == b), None)
            if top_b is not None and top_b < top_a:
                continue
            t = list(s); t[top_a] = b; t = tuple(t)
            if t not in dist:
                dist[t] = dist[s] + 1
                q.append(t)
d3 = dist[fin3]
print("P3 estados", len(dist), "mínimo", d3)
ok &= len(dist) == 3 ** k and str(d3) == P["P3"]["respuesta"] and d3 == 2 ** k - 1

# P4 · rayo: '/' (vista cenital, fila 0 = fondo/norte): E→N, N→E, O→S, S→O ; '\': E→S, S→E, O→N, N→O
D = P["P4"]["datos"]
esp = {tuple(map(int, k.split(","))): v for k, v in D["espejos"].items()}
mov = {"E": (1, 0), "O": (-1, 0), "N": (0, -1), "S": (0, 1)}
gira = {"/": {"E": "N", "N": "E", "O": "S", "S": "O"}, "\\": {"E": "S", "S": "E", "O": "N", "N": "O"}}
x, y, d = -1, D["entrada"]["fila"], D["entrada"]["dir"]
camino, usados = [], []
for _ in range(50):
    x, y = x + mov[d][0], y + mov[d][1]
    if not (0 <= x < 3 and 0 <= y < 3):
        break
    camino.append((x, y))
    if (x, y) in esp:
        usados.append((x, y)); d = gira[esp[(x, y)]][d]
sale = (x, y, d)
llega = next((c for c, col in D["cerraduras"].items() if y < 0 and col == x), None)
print("P4 camino", camino, "espejos usados", usados, "sale", sale, "cerradura", llega)
ok &= llega == P["P4"]["respuesta"] and usados == [(1, 2), (1, 1), (0, 1)] and set(esp) - set(usados) == {(2, 2), (2, 0)}

print("OK: las cuatro soluciones son únicas y coinciden con la ficha" if ok else "FALLO")
sys.exit(0 if ok else 1)
