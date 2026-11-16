# ENIGMA 60 · Reglas de producción (decididas por el Propietario)


## Decisiones del 16/11 (Propietario) — obligatorias para el productor y el corrector
1. **Títulos de los vídeos largos**: escape rooms «<Nombre de la sala> || Escape Room #<N>» (ej. «El museo que miente || Escape Room #2»); capítulos de la serie «<Título del capítulo> || <Nombre de la serie> #<N>». Sin preguntas ni coletillas.
2. **Descripciones concretas, nunca genéricas**: gancho real del guion, lista de los puzles con su pregunta (sin soluciones), 20 s para pensar, llamada a comentar, capítulos **medidos en el render final**, enlace a la sala anterior/siguiente y aviso de IA. Cada frase tiene que poder comprobarse en el guion.
3. **Portada dentro del vídeo**: el canal no puede subir miniaturas propias (verificación por teléfono bloqueada). Todo vídeo largo abre con 1,2 s de portada opaca y legible (`PortadaEnVideo`; en escape rooms, su `Miniatura*`). Revisa ese fotograma (frame 6) con `npx remotion still` antes de renderizar. Para cortos: `tiktok.cover_timestamp_ms` en el fotograma con la pregunta en pantalla, y la portada JPG del repo sacada de ese mismo fotograma del máster (`portada-desde-master.yml`).
4. **Cortos con su propia habitación 3D** y el puzle en 3D dentro de la sala (`E60CortoSala` + `sala` nueva, o componente 3D específico como `Engranajes3D`/`Cerillas3D`). Nada de cuadros con dibujos 2D. Las fichas antiguas en formato 2D (p. ej. `E60-2026-11-20/21/22-corto.json`, estado BORRADOR) no se renderizan tal cual: se rehacen en este formato.
5. **Capítulo 1 de la serie (E60ES-S001-E01)**: el Propietario quería ver antes la biblia y el guion. Antes de renderizar, déjale con `ops.dejar_mensaje('CLAUDE','INFO','Serie ENIGMA 60 · capítulo 1','…')` un resumen (premisa, personajes, puzles y megapuzle **sin soluciones**) y sigue con el render para no perder el plazo del jueves 19/11 a las 17:00.
6. **Metadatos de publicación** (`remotion/publicacion/<video_id>.json`): `version`, `encargo_master`, `run_id` y `sha256` deben ser los del máster que se manda a Telegram; si no coinciden, WF-PUB-02 no programa el vídeo al pulsar APROBAR (fallo del 16/11).

## Plazo: 48 horas antes de publicar
Todo vídeo debe estar **renderizado y enviado a Telegram para aprobación al menos 48 h antes de su hora de publicación**,
para dejar margen a correcciones (el corrector automático pasa a las 8:41, 14:41 y 20:41).
- Vídeo del martes → listo el domingo. Miércoles → lunes. Jueves → martes, etc.
- Si un vídeo no llega al plazo, avisar al Propietario en cuanto se sepa; no se acorta el plazo en silencio.

## Duración de los vídeos verticales 9:16: de 70 a 120 s (Propietario, 14/11 y 16/11)
Acertijos, avances y cortos-historia duran **como mínimo 70 s** y como máximo 120 s. Los cortos de unos
40–50 s no monetizan y el Propietario los rechaza.
- La duración sale de la voz: hacen falta **unas 150–190 palabras** en `lineas` (≈ 2,7 palabras/s con
  Chatterbox) más los segundos de pensar. Con menos de 140 palabras no se renderiza.
- No se rellena con pausas ni repeticiones: se cuenta una **historia en primera persona** (dónde estás,
  qué ves, qué está en juego, la pista, la pregunta, la solución explicada y qué pasa después).
- `tools/finalize_qa.py` marca FAIL cualquier vertical fuera de 70–120 s (`CORTO_DEMASIADO_CORTO_…`);
  ese vídeo no se envía a Telegram: se alarga la ficha y se renderiza otra versión.

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
