---
name: mask-enigma-60
description: Reglas vigentes de ENIGMA 60 (MASK GROUP) para escribir, producir, corregir o revisar un vídeo del canal. Úsala antes de tocar una ficha, un encargo de render, los metadatos de publicación o el calendario de ENIGMA 60.
---
# mask-enigma-60

ENIGMA 60 es el canal de acertijos de MASK GROUP. Esta skill resume las decisiones del Propietario
vigentes a 16/11/2026 y dice dónde está cada cosa. Si algo de aquí contradice una decisión posterior
del Propietario, manda la decisión posterior: actualiza esta skill en el mismo cambio.

## Fuentes que mandan (léelas antes de producir)
- `remotion/PRODUCCION.md`: reglas de producción y QA visual.
- `remotion/CALENDARIO.md`: qué vídeo sale cada día y en qué estado está.
- `remotion/CORRECTOR.md`: cómo se atiende una corrección pedida por Telegram.
- `AGENTS.md`: qué puede hacer Codex como corrector de reserva.
- `cloud/RELEVO-CLAUDE-CODEX.md` y `cloud/BUCLE-AUTONOMO.md`: relevo y tareas automáticas.

## Formatos
- **Corto vertical 9:16** (TikTok, Shorts, Facebook; Instagram cuando se conecte): de **70 a 120 s**.
  Un puzle contado como historia en primera persona, con el espectador de protagonista: dónde estás,
  qué ves, qué está en juego, la pista, la pregunta, unos 15 s para pensar, la solución explicada y
  qué pasa después. El puzle está **en 3D dentro de la sala**, no en un cuadro con un dibujo, y
  **cada corto tiene su propia sala** (`sala` en la ficha, composición `E60CortoSala`).
- **Largo horizontal 16:9** (YouTube): escape room en primera persona con varios puzles integrados en
  la historia. Los capítulos de serie duran de 12 a 20 minutos; una serie tiene 10 capítulos y un
  megapuzle con una pista por capítulo.
- **Avance 9:16** los días de largo: contexto y primer puzle sin resolver, y remite a YouTube.
- Sin laberintos ni retos de encontrar la salida de un laberinto.

## Reglas que no se saltan
1. **Cada puzle es único.** Ninguna `familia` (mecánica de fondo) se repite entre vídeos ni dentro del
   mismo vídeo. Se declara en la ficha y se registra en `remotion/PUZLES_USADOS.json` al entregar.
2. **Solución única y comprobada por código** (`remotion/tools/verificar_*.py`); el resultado se anota
   en `auditoria` de la ficha.
3. **48 horas.** El vídeo llega a Telegram para aprobar 48 h antes de su hora de publicación. Si no
   llega, se avisa al Propietario; no se acorta el plazo en silencio.
4. **QA visual además de la técnica**: hoja de contactos y fotogramas de cada puzle revisados (colores
   coherentes con la voz, sin textos superpuestos, el objeto del que se habla se ve).
5. **La voz no se cambia por iniciativa propia.** La fija `motor_voz` de la ficha; cambiar de voz es
   decisión del Propietario.
6. **Nada se publica sin APROBAR en Telegram.** Cada corrección es una versión nueva (v2, v3…) con su
   hash; aprobar una versión no aprueba otra. QA técnica superada no es aprobación artística.
7. Los textos de publicación avisan de que el contenido se ha creado con ayuda de IA.

## Antes de encargar un render
Desde `remotion/`:

    python tools/preflight.py encargos/<ID>.json            # cortos (render-remotion)
    python tools/preflight.py encargos/capitulos/<ID>.json  # largos y avances (render-capitulo)

Comprueba el identificador, que la composición la acepta ese workflow, que la ficha existe, que un
vertical tiene palabras suficientes para llegar a 70 s y que los puzles no repiten familia. Si dice
NO APTO, no subas el encargo: cada render fallido gasta tiempo del plazo de 48 h.

## Dónde está cada cosa
- Guion, puzles y voz: `remotion/fichas/<ficha>.json`.
- Títulos, descripciones, hashtags, portada y versión publicable: `remotion/publicacion/<video_id>.json`.
- Escenas: `remotion/src/` (salas en `salas/`, escape rooms en `escape/`, cortos en `shorts/`).
- Rama de trabajo: `feat/e60-diorama-20261114`. Los renders se lanzan al subir un encargo a esa rama.

## Control obligatorio
Español primero. Sin gasto, sin publicar, sin crear cuentas y sin tocar credenciales salvo permiso
expreso del Propietario. Di siempre qué está comprobado y qué queda pendiente.
