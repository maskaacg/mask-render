# Bucle autónomo de tareas (fase 5 de la ORDEN MAESTRA) — desde el 15/11/2026

## Qué hace
`ops.bucle_autonomo()` (Neon) se ejecuta **cada hora de 8 a 23 h** dentro de `WF-BUZON-TELEGRAM`
(n8n `xxrVu2wKsLBufYMu`), justo antes de entregar el buzón. No añade ejecuciones de n8n nuevas.
Su agente es `SYS-BUCLE` (registrado en `ops.agentes`).

| Detecta | Crea tarea para Claude (`SYS-ARQUITECTO`) | Aviso por Telegram |
|---|---|---|
| Vídeo de `mg.calendario` a menos de 48 h sin entrega | `PRODUCIR_VIDEO` | CRÍTICO si faltan menos de 24 h (máx. 2 al día) |
| Vídeo entregado y sin decidir a menos de 24 h de salir | — | Recordatorio al Propietario (máx. 2 al día) |
| Corrección en ERROR (Codex no pudo) | `CORREGIR_VIDEO` | En el resumen |
| Publicación con fallo en Upload-Post | `REVISAR_PUBLICACION` | CRÍTICO |
| APROBADA hace más de 30 min y sin programar | `PROGRAMAR_APROBADO` | AVISO |
| Comentarios sin leer más de 48 h | `LEER_COMENTARIOS` | En el resumen |

- **Idempotente**: cada tarea tiene clave única (`BUCLE:...`); repetir la hora no duplica nada.
- **Cierre automático**: cuando la causa desaparece (hay entrega, deja de haber error…) la tarea
  pasa a `HECHA` sola.
- **Un responsable por tarea**: siempre `SYS-ARQUITECTO` (Claude). Las correcciones tienen además el
  relevo a Codex de `WF-VIGILANTE`. La producción nueva no tiene relevo todavía: si Claude no está,
  el aviso crítico deja la decisión al Propietario.
- **Los agentes AGT-xx no las ejecutan**: `ops.agentes_con_tareas()` solo devuelve `AGT-*`, así que
  `WF-AGT-D` (con IA) no gasta créditos en ellas.

## Cómo las atiende Claude
Las tareas programadas de Claude (corrector y productor) leen primero
`ops.tareas WHERE asignado='SYS-ARQUITECTO' AND estado='PENDIENTE'` (ver `remotion/CORRECTOR.md` §0).

## Calendario en Neon
`mg.calendario` (video_id, publica_en, tipo, notas) refleja `remotion/CALENDARIO.md`. Al añadir
una semana hay que insertar sus filas; si no, el bucle no puede detectar retrasos.

## Pruebas (15/11)
Simulación con transacción revertida: vídeo ficticio a 20 h sin entrega → crea `PRODUCIR_VIDEO`
y 2 avisos; segunda pasada → nada nuevo; al registrar la entrega → la tarea se cierra sola.
Ejecución real en n8n (880): sin trabajo pendiente, 0 tareas y 0 avisos (correcto a esa hora).
