"""Acertijo del viernes 20/11 «Las jarras del boticario».

Tres jarras de 8, 5 y 3 litros. La de 8 está llena; las otras, vacías. No hay grifo ni desagüe:
solo se puede verter de una jarra a otra hasta que la de origen se vacíe o la de destino se llene.
Objetivo: 4 litros en la jarra de 8 y 4 litros en la de 5.
Pregunta: ¿cuántos trasvases hacen falta COMO MÍNIMO?

Comprueba por búsqueda en anchura (todos los estados posibles):
- que el mínimo es 7,
- que la secuencia de 7 trasvases es ÚNICA (no hay otra forma de hacerlo en 7),
- que coincide paso a paso con la que narra y anima la ficha.
"""
import json, os, sys
from collections import deque

CAP = (8, 5, 3)
INICIO = (8, 0, 0)
META = (4, 4, 0)


def vertidos(s):
    for i in range(3):
        for j in range(3):
            if i != j and s[i] > 0 and s[j] < CAP[j]:
                q = min(s[i], CAP[j] - s[j])
                n = list(s); n[i] -= q; n[j] += q
                yield (i, j), tuple(n)


def bfs():
    dist = {INICIO: 0}; caminos = {INICIO: 1}; padre = {INICIO: []}
    cola = deque([INICIO])
    while cola:
        s = cola.popleft()
        for mov, n in vertidos(s):
            if n not in dist:
                dist[n] = dist[s] + 1; caminos[n] = caminos[s]; padre[n] = [(s, mov)]; cola.append(n)
            elif dist[n] == dist[s] + 1:
                caminos[n] += caminos[s]; padre[n].append((s, mov))
    return dist, caminos, padre


def main():
    dist, caminos, padre = bfs()
    assert META in dist, "la meta no es alcanzable"
    print("mínimo de trasvases:", dist[META], "· secuencias mínimas distintas:", caminos[META])
    assert dist[META] == 7, "el mínimo no es 7"
    assert caminos[META] == 1, "hay más de una secuencia de 7"
    # reconstruir la única secuencia
    seq = []; s = META
    while s != INICIO:
        (p, mov), = padre[s]; seq.append((mov, s)); s = p
    seq.reverse()
    estados = [list(INICIO)] + [list(e) for _, e in seq]
    movs = [list(m) for m, _ in seq]
    print("estados:", estados)
    print("trasvases (origen→destino, 0=8 L, 1=5 L, 2=3 L):", movs)
    ficha = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fichas", "E60-2026-11-20-corto.json")
    if os.path.exists(ficha):
        pz = json.load(open(ficha, encoding="utf-8"))["puzle"]
        assert pz["capacidades"] == list(CAP) and pz["inicial"] == list(INICIO) and pz["meta"] == list(META)
        assert pz["trasvases"] == movs, "la ficha anima otra secuencia"
        assert pz["respuesta"].startswith("7"), "la respuesta de la ficha no es 7"
        print("la ficha coincide con la solución única")
    print("ÚNICA: 7 trasvases")


if __name__ == "__main__":
    main()
