# ENIGMA 60 · Reglas de producción (decididas por el Propietario)

## Plazo: 48 horas antes de publicar
Todo vídeo debe estar **renderizado y enviado a Telegram para aprobación al menos 48 h antes de su hora de publicación**,
para dejar margen a correcciones (el corrector automático pasa a las 8:41, 14:41 y 20:41).
- Vídeo del martes → listo el domingo. Miércoles → lunes. Jueves → martes, etc.
- Si un vídeo no llega al plazo, avisar al Propietario en cuanto se sepa; no se acorta el plazo en silencio.

## QA visual obligatoria antes de enviar (además de la QA técnica)
La QA técnica (sonoridad, duración, fotogramas) no basta. Antes de enviar cualquier vídeo o versión corregida:
1. Revisar la **hoja de contactos** (`<ID>-hoja-NN.jpg`, un fotograma cada 4 s, se genera sola en GitHub Actions).
2. Revisar fotogramas de prueba de cada puzle (enunciado, cuenta atrás, explicación) y del final.
3. Comprobar en cada fotograma:
   - **Colores coherentes**: el color que se nombra en la voz/pistas es el que se ve en la escena y en los paneles.
     La paleta de objetos se define una sola vez (p. ej. `ESCUDO_COLOR`) y la usan escena 3D y paneles.
     La luz que resalta pistas es neutra (blanca cálida): nunca tiñe los objetos.
   - **Sin textos superpuestos**: una sola tarjeta/panel a la vez en la columna izquierda; paneles opacos (≥ 0,94)
     para que no se transparente texto 3D; sin alturas fijas en filas de texto (si una línea se parte, el panel crece);
     los subtítulos tienen su franja inferior reservada.
   - **El objeto del que se habla se ve** y no queda tapado por paneles ni subtítulos.
4. Anotar en la ficha (`auditoria`) que la QA visual se ha hecho.

## Acertijos cortos 9:16 (Propietario, 16/11 — tras rechazar el del 19/11 v1)
- **Duración 70–120 s.** Nunca menos de 70 s: se cuenta como una historia (entras, ves la sala, lo que está en juego, el puzle, cuenta atrás, solución con la sala reaccionando, cierre).
- **Cada corto tiene su PROPIA habitación 3D** (no reutilizar la torre, el museo ni otra sala de otro vídeo).
- **El puzle está en 3D dentro de la sala** (objetos físicos que se mueven: balanza, piezas, pizarra, caja fuerte…), nunca un cuadro/pergamino con un dibujo encima.
- Cada puzle es único: no repetir puzles entre vídeos.
- Referencia: `src/escape/CortoTaller.tsx` + `TallerOrfebre3D.tsx` (composición `E60CortoTaller`). La composición `E60CortoTorre` queda obsoleta para cortos nuevos.

## Versiones
Cada corrección es una versión nueva (v2, v3…), con su hash; la anterior queda en el historial.
