"""Verificación por código de los 4 puzles de «Profundidad 600» · capítulo 1 «La sala de lastre» (v1, 20/11/2026).

Cada puzle debe tener UNA sola solución. Sale con código 1 si alguna comprobación falla.
Uso: python tools/verificar_s001_e01.py
"""
import itertools
import sys

fallos = []


def ok(cond, msg):
    print(("OK   " if cond else "FALLO") + " " + msg)
    if not cond:
        fallos.append(msg)


# P1 · El cuaderno boca abajo (familia rotacion_180_digitos)
# Se ve «16» en un cuaderno que flota boca abajo. ¿Qué número de dos cifras escribió su dueño?
# Un número escrito, girado 180°, se lee con las cifras rotadas e invertidas de orden.
ROT = {"0": "0", "1": "1", "6": "9", "8": "8", "9": "6"}  # cifras que siguen siendo cifras al girar


def girar(n):
    s = f"{n:02d}"
    if any(c not in ROT for c in s):
        return None
    return "".join(ROT[c] for c in reversed(s))


p1 = [n for n in range(100) if girar(n) == "16"]
ok(p1 == [91], f"P1: números de dos cifras que girados se leen 16 → {p1} (esperado [91])")

# P2 · Los tres cajones (familia palindromo)
# Arriba SONAR, en medio ROTOR, abajo RADAR. Nota: «se lee igual del derecho y del revés» y «no es el del medio».
cajones = ["SONAR", "ROTOR", "RADAR"]  # 0 arriba, 1 medio, 2 abajo
pal = [i for i, w in enumerate(cajones) if w == w[::-1]]
ok(pal == [1, 2], f"P2: palíndromos {[cajones[i] for i in pal]} (esperado ROTOR y RADAR: la segunda pista hace falta)")
p2 = [i for i in pal if i != 1]
ok(p2 == [2], f"P2: cajón que cumple las dos pistas → {[cajones[i] for i in p2]} (esperado RADAR, abajo)")

# P3 · Los manómetros (familia sistema_ecuaciones)  A = 2B, C = B + 3, A + B + C = 19, lecturas 0..12
p3 = [(a, b, c) for a, b, c in itertools.product(range(13), repeat=3) if a == 2 * b and c == b + 3 and a + b + c == 19]
ok(p3 == [(8, 4, 7)], f"P3: lecturas (A,B,C) → {p3} (esperado [(8, 4, 7)])")

# P4 · El reloj parado (familia aritmetica_horaria)
# El reloj se paró a las 3:10. La inundación empezó 45 min antes; la alarma sonó 20 min después de empezar la inundación.
paro = 3 * 60 + 10
inicio = paro - 45
alarma = inicio + 20
p4 = f"{alarma // 60}:{alarma % 60:02d}"
ok(p4 == "2:45", f"P4: hora de la alarma → {p4} (esperado 2:45); inundación a las {inicio // 60}:{inicio % 60:02d}")
# comprobación por búsqueda: única hora h (en minutos) que cumple las dos relaciones
cands = [h for h in range(12 * 60) if h - 20 == paro - 45]
ok(len(cands) == 1 and cands[0] == alarma, f"P4: horas compatibles en 12 h → {[f'{c // 60}:{c % 60:02d}' for c in cands]}")

# Megapuzle (oculto, 1 pista por capítulo): el cap. 1 deja el dígito violeta 0 en el centro de la esfera del reloj (P4).
# No se explica en el vídeo; solo se comprueba que aparece en la ficha.

if fallos:
    print(f"\n{len(fallos)} comprobaciones fallidas")
    sys.exit(1)
print("\nTodas las soluciones son únicas.")
