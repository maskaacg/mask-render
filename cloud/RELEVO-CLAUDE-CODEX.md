# Relevo Claude ⇄ Codex (ENIGMA 60)

Orden del Propietario del 15/11/2026: el sistema no se detiene si Claude agota su límite semanal.
Este documento describe lo que está **implementado y probado**, y lo que **falta**.

## 1. Cómo se detecta que Claude no está disponible
El proveedor no expone el límite semanal a n8n. Se usa una señal verificable: **latidos**.

- Cada tarea programada de Claude (corrector 08:41/14:41/20:41 y productor 10:13, hora de Madrid)
  ejecuta como primer paso `SELECT mg.latido('CLAUDE','<tarea>')` en Neon.
  Cuando Claude ha agotado su límite, la tarea falla al arrancar (visto el 14/11: «usage limit
  reached» a los 3 s) y no deja latido.
- `WF-RELEVO` (n8n, id `ZTJBD0cLZhE1qqhM`, cada hora en el minuto 50) llama a `mg.evaluar_relevo()`:
  - **A_CODEX**: las **2 últimas** ejecuciones esperadas de Claude no dejaron latido, ni hay ningún
    latido posterior. Un fallo aislado (caída temporal) no cambia nada.
  - **A_CLAUDE**: estando en NO_DISPONIBLE, llega un latido nuevo de Claude.
  - El estado vive en `mg.relevo` y cada cambio se avisa por Telegram (`RELEVO-AAAAMMDD-HHMM`).
- Simulación sin efectos: `SELECT * FROM mg.evaluar_relevo('<fecha>', true)`.

## 2. Qué hace Codex mientras Claude no está
- **Correcciones** (`WF-VIGILANTE`, id `wEgcBn7hPcZeVr3s`, cada hora en el minuto 20):
  con Claude disponible, Codex solo toma correcciones con más de 75 min sin atender; con Claude
  NO_DISPONIBLE, las toma al momento. Flujo: reserva en `mg.correcciones_v2` (estado `CODEX`,
  responsable único) → rama `codex/<video>-vN-…` + PR → comentario `@codex` → Codex hace el cambio y
  **devuelve el contenido completo de cada archivo** en bloques `=== ARCHIVO: … ===` → n8n
  comprueba rutas permitidas (solo `remotion/`, nunca `remotion/encargos/` ni `.github/`), sube
  los archivos a la rama del PR, lo incorpora a la rama de trabajo, lanza el render, actualiza la
  ficha de publicación y lo entrega a Telegram con los botones.
- **Por qué bloques de archivo**: el entorno de Codex no puede hacer `push` (verificado el 15/11 en
  el PR #8: «no tiene configurado el remoto origin»). n8n hace la subida en su lugar.

## 3. Cuando Claude vuelve
- WF-RELEVO avisa por Telegram y devuelve el umbral de 75 min.
- Las correcciones en estado `CODEX` siguen siendo de Codex hasta terminar (sin duplicados).
- Las que Codex deja en `ERROR` con detalle «Codex:…» las retoma el corrector de Claude.
- El productor de Claude revisa primero lo que hizo Codex (`mg.correcciones_v2` con estado
  CODEX/ENTREGADA desde `mg.relevo.desde`) y no repite trabajo.

## 4. Límites y pendientes (no implementado todavía)
- **Producción nueva por Codex** (fichas y vídeos del calendario mientras Claude no está):
  PENDIENTE. Hoy Codex cubre correcciones; la producción espera a Claude.
- Tamaño: un comentario de GitHub admite ~65 000 caracteres; cambios en archivos muy grandes
  pueden no caber. En ese caso la corrección queda en ERROR y vuelve a Claude.
- Si cae n8n, no hay relevo (n8n es el vigilante).

## 5. Reglas
La sustitución no concede permisos nuevos: no publicar, no gastar, no tocar credenciales, no
modificar `main`, no borrar nada. Cada versión nueva pasa por la aprobación del Propietario.
