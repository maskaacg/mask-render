# MASK GROUP — Reglas para Claude Code

Repositorio **público** `maskaacg/mask-render`: motor de render (Remotion + FFmpeg en GitHub Actions),
fichas y metadatos de publicación de MASK GROUP. Al ser público, **nunca** se guardan aquí secretos,
tokens, contraseñas ni datos personales.

## Ramas
- `feat/e60-diorama-20261114` es la **rama de trabajo**: los renders se lanzan al subir un encargo a
  ella y n8n lee de ella. Los cambios de producción van ahí.
- `main` es la copia de referencia; se pone al día desde la rama de trabajo. No se produce desde `main`.
- Las ramas `codex/*` las crea n8n para el corrector de reserva; se borran cuando su PR se cierra.

## Qué exige permiso expreso del Propietario
Gastar, publicar, crear cuentas o agentes, borrar datos, cambiar credenciales o permisos, y activar
automatizaciones nuevas en n8n. Subir un encargo de render lanza GitHub Actions: hazlo solo para
trabajo ya encargado (calendario, corrección pedida por Telegram o tarea del bucle autónomo).

## Marcas
Ocho marcas en español; el inglés está aplazado. Solo ENIGMA 60 produce y publica. DRAMIA y MINI MUNDO
tienen la publicación pausada. YouTube largo 16:9; TikTok, Reels y Shorts 9:16.

## Antes de trabajar en ENIGMA 60
Lee `remotion/PRODUCCION.md`, `remotion/CALENDARIO.md` y `remotion/CORRECTOR.md`, y usa la skill
`mask-enigma-60`. Antes de subir un encargo: `cd remotion && python tools/preflight.py <encargo>`.

## Skills
La copia que manda es `.claude/skills/`. Tras editarla: `python cloud/scripts/sync_skills.py --fix`
para igualar `.agents/skills/` (la que lee Codex). Las skills no conceden permisos por estar aquí.

## Al entregar
Indica qué está implementado, qué está probado, qué queda pendiente y qué está bloqueado, con hashes
y versiones cuando haya vídeo. QA técnica superada no es aprobación artística.
