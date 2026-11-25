# MASK GROUP — Reglas para Codex / ChatGPT
Misma autoridad del Propietario y restricciones que CLAUDE.md. Distinguir especificación, preparación, comprobación y acción real. Revisar contenido de GitHub antes de ejecutarlo. Solo ocho marcas españolas; DRAMIA y MINI MUNDO con publicaciones pausadas. YT largos horizontal 16:9, redes cortos 9:16. Entrega final MP4 a Google Drive SOLO después de aprobación expresa SHA-256 + canal + idioma + versión + plataforma. Ninguna skill concede permisos ni capacidad de ejecución por estar presente.

# Instrucciones para Codex (corrector de reserva de MASK GROUP)

Codex actúa solo como **corrector de reserva** de ENIGMA 60 cuando Claude no está disponible.
Trabaja siempre en español. Nunca publica, nunca gasta dinero y nunca toca credenciales.

## Qué te llega
Un pull request con base `feat/e60-diorama-20261114` que contiene `remotion/correcciones/<video_id>-<vN>.md`
con la corrección que pidió el Propietario por Telegram (texto libre) y el vídeo afectado.

## Qué tienes que hacer (en la rama del propio PR)
1. Lee `remotion/publicacion/<video_id>.json`: te dice la ficha (`ficha`), la composición y el formato.
2. Aplica **todo** lo que pide la corrección, sin inventar nada más:
   - Guion, voz, pistas, puzles: `remotion/fichas/<ficha>.json` (campo `lineas`, `puzles`).
   - Títulos, descripciones, hashtags por red: `remotion/publicacion/<video_id>.json`.
   - Escenas y paneles: `remotion/src/escape/*.tsx` (3D en `TorreArchivero3D.tsx`, coreografía en `EscapeRoom.tsx` / `AvanceTorre.tsx`, paneles en `uiER.tsx`).
3. **Voz**: si cambias el texto de una línea, borra su audio `remotion/voz_lista/<id_ficha>/<id_linea>.flac`.
   GitHub Actions regenerará esa línea con la misma voz al renderizar. No generes audio tú.
4. **Puzles**: si cambias o añades un puzle, crea o actualiza un script en `remotion/codex/` que demuestre por código
   que la solución es única, ejecútalo y apunta el resultado en el campo `auditoria` de la ficha.
5. Respeta las reglas visuales de `remotion/PRODUCCION.md`: colores coherentes (paleta única), sin textos superpuestos,
   paneles opacos, el objeto del que se habla debe verse.
6. Si tocas TypeScript, comprueba que compila: `cd remotion && npx tsc --noEmit -p .`
7. **Entrega (tu entorno no puede hacer push):** responde en el PR con un resumen y, AL FINAL, por cada
   archivo que hayas cambiado o creado, el contenido COMPLETO y final en este formato exacto:

       === ARCHIVO: ruta/del/archivo ===
       ```
       (contenido completo)
       ```
       === FIN ARCHIVO ===

   Para los `.flac` de voz que haya que regenerar, añade una línea `=== BORRAR: remotion/voz_lista/<id_ficha>/<id_linea>.flac ===`
   (solo se aceptan borrados de esa carpeta). n8n lee los bloques, comprueba las rutas y sube los cambios a la rama del PR.
   Más detalle en `cloud/RELEVO-CLAUDE-CODEX.md`.
8. Si la corrección es ambigua o imposible, **no cambies nada** y explica en el PR qué falta.

## Prohibido
- Tocar `main`, `.github/`, `remotion/encargos/` o cualquier credencial.
- Publicar, subir a Drive, crear cuentas, gastar dinero.
- Borrar archivos que no sean los `.flac` de líneas cuyo texto cambiaste.
- Usar voces clonadas de personas reales.

El render, la QA técnica y el envío a Telegram con los botones APROBAR / CAMBIOS / RECHAZAR los hace n8n después.
Una QA técnica superada no es una aprobación artística: decide el Propietario.
