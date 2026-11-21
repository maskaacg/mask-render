"""Acertijo del martes 17/11: tres ruedas en línea (10, 20, 40 dientes). La pequeña da 12 vueltas."""
from fractions import Fraction
dientes = [10, 20, 40]; vueltas = Fraction(12)
v = [vueltas]; sentido = [1]
for a, b in zip(dientes, dientes[1:]):
    v.append(v[-1] * a / b); sentido.append(-sentido[-1])
print("vueltas:", [str(x) for x in v], "sentidos:", sentido)
assert v[-1] == 3 and sentido[-1] == sentido[0]
print("ÚNICA: 3 vueltas, mismo sentido que la pequeña")
