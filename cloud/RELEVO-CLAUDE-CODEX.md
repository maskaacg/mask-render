# Relevo Claude ⇄ Codex (ENIGMA 60)

> **Cambio del 16/11/2026 (reloj único).** `WF-RELEVO` y los relojes propios de `WF-VIGILANTE` y
> `WF-RENDER-REVISION` están apagados. `WF-BUZON-TELEGRAM` (n8n `xxrVu2wKsLBufYMu`, cada hora de 8 a
> 23 h, minuto 7) llama a `mg.evaluar_relevo()` y a `mg.reloj_que_toca()`, y solo si hay una
> corrección sin atender lanza `WF-VIGILANTE`. Lo que sigue describe la lógica, que no cambia; las
> horas de reloj que aparecen más abajo son las anteriores.

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

## 3 bis. Prueba completa del 15/11 (con render real)
- Copia aislada y no publicable del avance: `E60ES-RELEVO-T` (ficha `fichas/E60-RELEVO-T.json`).
  `mg.solicitud_para_publicar` devuelve `PRUEBA_NO_PUBLICABLE` para cualquier vídeo con PRUEBA o
  RELEVO en el id, así que WF-PUB-02 nunca lo programa aunque se pulse APROBAR.
- Intento 1 (ejecución 855): Codex entregó bien, pero el merge falló («Pull Request is not
  mergeable»: GitHub aún no había calculado la mergeabilidad). **Corregido**: el merge reintenta
  5 veces cada 5 s y, si aun así falla, la corrección pasa a ERROR y avisa por Telegram.
- En medio de la prueba, el vigilante tomó una corrección real del Propietario (acertijo del
  martes, «estética del submarino o de la torre»). Codex no cambió nada y pidió aclaración: es el
  comportamiento correcto ante una petición ambigua. La corrección quedó para Claude.
- Intento 2 (ejecución 859): Codex → archivos subidos por n8n → PR #13 incorporado
  automáticamente → render lanzado solo (`render-capitulo E60ES-RELEVO-T-v2-…`). El resultado
  final y la entrega con botones se anotan abajo.
- **Corregido también**: las correcciones de cortos (`E60CortoPlano`, `E60CortoTorre`) se
  renderizan con `render-remotion`; antes el vigilante solo sabía lanzar `render-capitulo`.

## 4. Límites y pendientes (no implementado todavía)
- **Producción nueva por Codex** (fichas y vídeos del calendario mientras Claude no está):
  PENDIENTE. Hoy Codex cubre correcciones; la producción espera a Claude.
- Tamaño: un comentario de GitHub admite ~65 000 caracteres; cambios en archivos muy grandes
  pueden no caber. En ese caso la corrección queda en ERROR y vuelve a Claude.
- Si cae n8n, no hay relevo (n8n es el vigilante).

## 5. Reglas
La sustitución no concede permisos nuevos: no publicar, no gastar, no tocar credenciales, no
modificar `main`, no borrar nada. Cada versión nueva pasa por la aprobación del Propietario.
