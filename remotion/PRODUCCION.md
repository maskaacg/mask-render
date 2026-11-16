# ENIGMA 60 · Reglas de producción (decididas por el Propietario)

## Plazo: 48 horas antes de publicar
Todo vídeo debe estar **renderizado y enviado a Telegram para aprobación al menos 48 h antes de su hora de publicación**,
para dejar margen a correcciones (el corrector automático pasa a las 8:41, 14:41 y 20:41).
- Vídeo del martes → listo el domingo. Miércoles → lunes. Jueves → martes, etc.
- Si un vídeo no llega al plazo, avisar al Propietario en cuanto se sepa; no se acorta el plazo en silencio.

## Duración de los vídeos verticales 9:16: de 70 a 120 s (Propietario, 14/11 y 16/11)
Acertijos, avances y cortos-historia duran **como mínimo 70 s** y como máximo 120 s. Los cortos de unos
40–50 s no monetizan y el Propietario los rechaza.
- La duración sale de la voz: hacen falta **unas 150–190 palabras** en `lineas` (≈ 2,7 palabras/s con
  Chatterbox) más los segundos de pensar. Con menos de 140 palabras no se encarga el render
  (`tools/preflight.py` lo marca como FALLO).
- No se rellena con pausas ni repeticiones: se cuenta una **historia en primera persona** (dónde estás,
  qué ves, qué está en juego, la pista, la pregunta, la solución explicada y qué pasa después).
- `tools/finalize_qa.py` marca FAIL cualquier vertical fuera de 70–120 s (`CORTO_DEMASIADO_CORTO_…`);
  ese vídeo no se envía a Telegram: se alarga la ficha y se renderiza otra versión.

## Comprobación previa de cada encargo
Antes de subir un encargo de render, desde `remotion/`: `python tools/preflight.py <ruta del encargo>`.
Repite en local lo que validará GitHub Actions (identificador, composición aceptada por ese workflow,
ficha, puzles sin repetir) y además exige las 140 palabras mínimas de los verticales. Si dice NO APTO,
no se sube: se corrige la ficha o el encargo primero.

## Cada puzle es único (Propietario, 16/11)
Ningún puzle repite **familia** (la mecánica de fondo) con otro vídeo ni dentro del mismo vídeo, aunque
cambien los objetos, los números o la sala. Ejemplos: «uno dice la verdad y otro miente», «etiquetas
todas falsas», «balanza/ecuación», «sistema de ecuaciones», «serie numérica», «cifrado César».
- Cada puzle de una ficha declara `familia` (en `puzle` o en cada elemento de `puzles`).
- `tools/verificar_puzles_unicos.py` la compara con `PUZLES_USADOS.json`; GitHub Actions no renderiza
  si se repite. Al entregar un vídeo, añade sus puzles al registro.
- Cada solución sigue siendo única y se comprueba por código (`tools/verificar_*.py`).

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

## Versiones
Cada corrección es una versión nueva (v2, v3…), con su hash; la anterior queda en el historial.
