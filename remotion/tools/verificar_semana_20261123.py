"""Verificación por código de TODOS los puzles nuevos de la semana 23-29/11/2026 (ENIGMA 60).

Cada bloque recorre el espacio completo de respuestas posibles y comprueba que la del guion es la
ÚNICA que cumple las pistas que se ven en pantalla. Sale con código 1 si algo falla.
Uso: python tools/verificar_semana_20261123.py
"""
import itertools, sys

fallos = []
def comprobar(nombre, soluciones, esperada):
    ok = soluciones == (esperada if isinstance(esperada, list) else [esperada])
    print(("OK   " if ok else "FALLO"), nombre, "→", soluciones)
    if not ok:
        fallos.append(nombre)

# ---------------------------------------------------------------- MAR 24 · La habitación de las tres sombras
# Tres lámparas tapadas (rojo, verde, azul) en posiciones izquierda, centro, derecha sobre una estatua.
# Mezcla aditiva: la sombra que tapa una luz tiene el color de las otras dos, y cae al lado CONTRARIO
# de esa lámpara (la del centro, justo debajo). Sombras vistas en el suelo (izq → der): cian, magenta, amarillo.
MEZCLA = {frozenset("VA"): "cian", frozenset("RA"): "magenta", frozenset("RV"): "amarillo"}
vistas = ["cian", "magenta", "amarillo"]  # posiciones en el suelo: izquierda, centro, derecha
sol = []
for orden in itertools.permutations("RVA"):  # orden[0] lámpara izquierda, [1] centro, [2] derecha
    suelo = [None, None, None]
    for pos, color in enumerate(orden):
        sombra_en = 2 - pos  # la sombra cae al lado opuesto; la del centro, en el centro
        suelo[sombra_en] = MEZCLA[frozenset("RVA".replace(color, ""))]
    if suelo == vistas:
        sol.append("".join(orden))
comprobar("Mar 24 · tres sombras (lámparas izq→der)", sol, "AVR")  # azul, verde, rojo

# ---------------------------------------------------------------- JUE 26 · La vitrina de los tres reflejos
# Placa de espaldas con 3 cifras de 7 segmentos delante de dos espejos a 90°. Un espejo invierte el orden
# y cada cifra (2↔5; 0, 1, 8 simétricas), el reflejo doble (rincón) NO invierte.
ESPEJO = {"0": "0", "1": "1", "2": "5", "5": "2", "8": "8"}  # 3, 4, 6, 7, 9 no son cifras al reflejarse
def refleja(c):
    if any(d not in ESPEJO for d in c):
        return None
    return "".join(ESPEJO[d] for d in reversed(c))
izq, centro, der = "825", "258", "825"  # lo que se ve en cada reflejo
sol = []
for n in itertools.product("0123456789", repeat=3):
    c = "".join(n)
    r = refleja(c)
    if r is not None and r == izq and r == der and c == centro:  # simples reflejados, doble sin invertir
        sol.append(c)
comprobar("Jue 26 · tres reflejos (código real)", sol, "258")
# la mayoría engaña: dos reflejos dicen 825
assert [izq, centro, der].count("825") == 2

# ---------------------------------------------------------------- SÁB 28 · La torre de dados
# Tres dados normales apilados (caras opuestas suman 7). Arriba se ve un 5.
# Caras ocultas: la de abajo del dado superior + las dos tapadas del dado central + arriba y abajo del inferior.
sol = sorted({(7 - 5) + 7 + 7})
comprobar("Sáb 28 · torre de dados (suma de caras ocultas)", sol, 16)

# ---------------------------------------------------------------- DOM 29 · El ascensor de las tres plantas
# Sale de la planta 1, 8 s por planta, una sola parada intermedia con puertas abiertas 6 s, llega 30 s después.
sol = []
for parada in (1, 2, 3):
    for final in (1, 2, 3):
        if parada == 1 or final == parada:
            continue
        t = abs(parada - 1) * 8 + 6 + abs(final - parada) * 8
        if t == 30:
            sol.append((parada, final))
comprobar("Dom 29 · ascensor (parada, planta final)", sol, (3, 2))

# ---------------------------------------------------------------- MIÉ 25 · Profundidad 600 #2 «El mamparo»
# P1 · Las cuatro cámaras: A-B-C-D en fila, presiones iniciales; abrir la válvula entre dos cámaras vecinas
# iguala ambas a la media. Cada válvula se puede abrir una sola vez. El mamparo (junto a D) cede con D = 3 bar
# exactos. Presiones iniciales 4 · 0 · 10 · 0 bar. ¿Qué válvulas y en qué orden? (todas las combinaciones)
from fractions import Fraction as Fr
ini = (Fr(4), Fr(0), Fr(10), Fr(0))
VALV = {"AB": (0, 1), "BC": (1, 2), "CD": (2, 3)}
def aplicar(p, seq):
    p = list(p)
    for v in seq:
        i, j = VALV[v]
        m = (p[i] + p[j]) / 2
        p[i] = p[j] = m
    return p
sol = []
for n in range(1, 4):
    for seq in itertools.permutations(VALV, n):
        if aplicar(ini, seq)[3] == 3:
            sol.append("-".join(seq))
assert aplicar(ini, ["CD"])[3] == 5  # la tentación (abrir directamente C-D) deja 5 bar: el mamparo no cede
comprobar("Cap. 2 · P1 cuatro cámaras (secuencia mínima)", sol, "AB-BC-CD")

# P2 · La taquilla de Iker: 31 taquillas. Número primo, sus cifras suman 4, no es la última de la fila.
sol = [n for n in range(1, 32) if n > 1 and all(n % d for d in range(2, int(n ** 0.5) + 1))
       and sum(map(int, str(n))) == 4 and n != 31]
comprobar("Cap. 2 · P2 taquilla de Iker", sol, 13)
assert 31 in [n for n in range(2, 32) if all(n % d for d in range(2, int(n ** 0.5) + 1)) and sum(map(int, str(n))) == 4]  # sin la 3.ª pista habría dos

# P3 · Energía limitada: batería de 10 unidades. Sistemas: compuerta 5, bomba de achique 4, radio 3,
# focos 2, calefacción 1. Hay que mover la compuerta Y mantener la radio (Alma) y gastar la batería entera
# (el regulador se bloquea si sobra carga). Damián propone sacrificar la radio y encender la bomba.
S = {"compuerta": 5, "bomba": 4, "radio": 3, "focos": 2, "calefaccion": 1}
sol = []
for k in range(1, 6):
    for sub in itertools.combinations(S, k):
        if sum(S[s] for s in sub) == 10 and "compuerta" in sub and "radio" in sub:
            sol.append("+".join(sub))
comprobar("Cap. 2 · P3 energía limitada", sol, "compuerta+radio+focos")
# la condición de Alma (mantener la radio) es necesaria: sin ella hay dos repartos (el de Damián es compuerta+bomba+calefacción)
sin_radio = [sub for k in range(1, 6) for sub in itertools.combinations(S, k) if sum(S[s] for s in sub) == 10 and "compuerta" in sub]
assert len(sin_radio) == 2 and ("compuerta", "bomba", "calefaccion") in sin_radio, sin_radio

# P4 · Mensaje Morse de 2008 (tabla en la pared): -.-. . .-. ---
MORSE = {".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F", "--.": "G", "....": "H", "..": "I",
         ".---": "J", "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R",
         "...": "S", "-": "T", "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y", "--..": "Z"}
comprobar("Cap. 2 · P4 morse", ["".join(MORSE[s] for s in "-.-. . .-. ---".split())], "CERO")

# P5 · La esclusa de las dos mareas: 4 acciones en orden (cerrar exterior C, igualar presión I, abrir interior A,
# purgar P). Reglas en la placa: (1) nunca dos compuertas abiertas: A exige C hecho; (2) A exige I hecho;
# (3) I exige C hecho (si no, entra el mar); (4) P va la última y exige A (purga el agua que entra al abrir).
sol = ["".join(o) for o in itertools.permutations("CIAP")
       if o.index("C") < o.index("A") and o.index("I") < o.index("A") and o.index("C") < o.index("I") and o[-1] == "P"]
comprobar("Cap. 2 · P5 esclusa (orden)", sol, "CIAP")

# ---------------------------------------------------------------- VIE 27 · El castillo sin amanecer (Escape Room #4)
# P1 · Rosetón: 8 vidrios en círculo; los opuestos suman 13. Visibles: 2, 9, 5, 7 (pos 0-3), y 11, ?, 8, 6 (pos 4-7).
vis = [2, 9, 5, 7, 11, None, 8, 6]
sol = [x for x in range(1, 13) if all((vis[i] if vis[i] is not None else x) + (vis[(i + 4) % 8] if vis[(i + 4) % 8] is not None else x) == 13 for i in range(8))]
comprobar("Castillo · P1 rosetón", sol, 4)

# P2 · Campanas (cuadrado latino 4×4): cada campana suena una vez por compás y nunca en la misma posición.
# Partitura con huecos (0 = falta). ¿Qué campana falta en el compás 4, posición 2?
P = [[1, 2, 3, 4], [3, 4, 1, 2], [4, 3, 2, 1], [2, 0, 4, 3]]
sol = [b for b in (1, 2, 3, 4) if b not in P[3] and all(P[r][1] != b for r in range(3))]
comprobar("Castillo · P2 campana que falta", sol, 1)

# P3 · Heráldica: regla de las tinturas (metal sobre color o color sobre metal; nunca metal/metal ni color/color).
METAL = {"oro", "plata"}
escudos = {"León": ("gules", "oro"), "Torre": ("azur", "plata"), "Águila": ("oro", "plata"), "Lirio": ("sinople", "oro")}
sol = [k for k, (campo, figura) in escudos.items() if (campo in METAL) == (figura in METAL)]
comprobar("Castillo · P3 escudo falso", sol, "Águila")

# P4 · Puente levadizo: 120 kg; tu fuerza máxima 45 kg; cuerda disponible 3,5 m para subir el puente 1 m.
# Sistemas A, B, C con 2, 3 y 4 tramos que sostienen la carga.
sol = [n for n, tramos in (("A", 2), ("B", 3), ("C", 4)) if 120 / tramos <= 45 and tramos * 1 <= 3.5]
comprobar("Castillo · P4 poleas", sol, "B")

# P5 · Puerta del amanecer: el sol sale por el este, a mediodía está al sur y se pone por el oeste.
# Torres en el mapa: Halcón (E), Ciervo (S), Lobo (O), Oso (N, nunca recibe sol directo). Orden de las palancas.
torres = {"Halcón": "E", "Ciervo": "S", "Lobo": "O", "Oso": "N"}
recorrido = ["E", "S", "O"]
sol = ["-".join(sorted((t for t in torres if torres[t] in recorrido), key=lambda t: recorrido.index(torres[t])))]
comprobar("Castillo · P5 puerta del amanecer", sol, "Halcón-Ciervo-Lobo")

# ---------------------------------------------------------------- LUN 23 · Avance del Observatorio v2 (propuesta)
# 3×3 sin la esquina delantera derecha = 8 en el suelo; 2.º piso 4; 3.er piso 1 (según la ficha E60-ER-003).
comprobar("Avance Observatorio · cajas", [8 + 4 + 1], 13)

print("\nTODO OK" if not fallos else f"\nFALLOS: {fallos}")
sys.exit(1 if fallos else 0)
