# Calendario de ENIGMA 60 (lo usa el productor automático)

Regla de las 48 h (excepción única: lun 16 y mar 17 se producen el dom 15; se restablece desde el mié 18): cada vídeo debe estar entregado en Telegram para aprobar **48 h antes** de su
publicación (el del martes, el domingo), para dar margen a correcciones.

Horas de publicación (Madrid): vídeo largo 17:00 · cortos y avances 18:00.


## Patrón semanal fijo (Propietario, 08/11 y semana del 16/11)
- **Lunes y miércoles**: escape room 16:9 (YouTube 17:00) + su avance 9:16 (18:00).
- **Sábado**: capítulo de la serie 16:9 (YouTube 17:00) + su avance 9:16 (18:00).
- **Martes, jueves, viernes y domingo**: acertijo independiente 9:16 (18:00).
- Usa EXACTAMENTE los `video_id` de la tabla (son los que vigila el bucle en `mg.calendario`).
- Cada lunes, el productor añade aquí y en `mg.calendario` la semana que empieza 7 días después con este mismo patrón (escape rooms y capítulos con el número siguiente) y avisa al Propietario con `ops.dejar_mensaje` (INFO). Si el Propietario cambia el patrón, manda su decisión.

## Semana del 16/11/2026

| Publicación | Tipo | video_id | Estado |
|---|---|---|---|
| Lun 16 | **Escape room 1 «La torre del archivero» v6** (16:9, solo YouTube 17:00) + **avance v3** 9:16 (TikTok, Shorts, Facebook Reels 18:00) | E60ES-ER-001-TORRE / -AVANCE | Avance v3 APROBADO (en cola hasta que se apruebe la Torre). Torre: v3 con cambios pedidos → v4 entregada el dom 15 a las 08:18, pendiente de APROBAR. Excepción única a las 48 h |
| Mar 17 | Acertijo 9:16 «Los engranajes del faro» (sala propia, E60CortoSala) | E60ES-AC-20261117 | Entregado v3 (lun 16 16:43, Telegram, 95 s, pendiente de APROBAR; sustituye a «Las tres cajas fuertes»). Fuera del plazo de 48 h |
| Mié 18 | Escape room 2 «El museo que miente» (16:9, E60EscapeMuseo) + avance 9:16 (E60AvanceMuseo) | E60ES-ER-002-MUSEO / -AVANCE | v1 RECHAZADAS el lun 16 (gusta la idea). Entregados: museo v2 con «Las dos velas» (10:52) y avance v3 (87 s), lun 16, pendientes de APROBAR (avance v2 anulado: voz antigua) |
| Jue 19 | Acertijo 9:16 «Las cerillas del relojero» (sala propia, E60CortoSala) | E60ES-AC-20261119 | v1 RECHAZADA el lun 16. Entregado v2 (lun 16 15:23, Telegram, 88,6 s, pendiente de APROBAR) |
| Vie 20 | Acertijo 9:16 «Las jarras del boticario» (sala propia, E60CortoSala + Jarras3D) | E60ES-AC-20261120 | Entregado v1 (mar 17, Telegram, 97,3 s, pendiente de APROBAR; sustituye a la ficha 2D «Las cuatro velas») |
| Sáb 21 | Serie «Profundidad 600», cap. 1 «La sala de lastre» (16:9, voz «Chatterbox expresiva», 4 puzles) + avance 9:16 | E60ES-S001-E01 / -AVANCE | Capítulo: Entregado v1 (vie 20, Telegram, 10:20, pendiente de APROBAR; fuera del plazo de 48 h). Avance: Pendiente (falta composición vertical de la serie) |
| Dom 22 | Acertijo 9:16 **«La balanza del molinero»** v2 (sala propia almacen-molino-01, E60CortoSala + Balanza3D) | E60ES-AC-20261122 | v1 «La caja del cartógrafo» APROBACIÓN REVOCADA (21/11, cancelada en Upload-Post, se conserva). v2 NUEVA renderizada (run 44977470129, QA PASS 89,3 s), pendiente de entregar y APROBAR. Fuera del plazo de 48 h por el hueco |


## Semana del 23/11/2026

| Publicación | Tipo | video_id | Estado |
|---|---|---|---|
| Lun 23 | Escape Room #3 «El observatorio apagado» + avance 9:16 | E60ES-ER-003 / E60ES-ER-003-AVANCE | APROBADO y programado (17:00 / 18:00). El avance v1 no resuelve su puzle: v2 pendiente de decisión del Propietario |
| Mar 24 | Acertijo «La habitación de las tres sombras» | E60ES-AC-20261124 | Entregado v1 (dom 22, n.º 31), pendiente de APROBAR |
| Mié 25 | Escape Room #4 «El castillo sin amanecer» (E60LargoSalas, 8:45) + avance «¿Qué campana falta?» | E60ES-ER-004 / E60ES-ER-004-AVANCE | Entregados v1 (dom 22, n.º 35 y 32), pendientes de APROBAR |
| Jue 26 | Acertijo «La vitrina de los tres reflejos» | E60ES-AC-20261126 | Entregado v1 (n.º 28), pendiente de APROBAR |
| Vie 27 | Acertijo «La torre de dados» | E60ES-AC-20261127 | Entregado v1 (n.º 29), pendiente de APROBAR |
| Sáb 28 | Profundidad 600 #2 «El mamparo» (E60LargoSalas, 16:09) + avance «La esclusa que nadie debía abrir» | E60ES-S001-E02 / E60ES-S001-E02-AVANCE | Entregados v1 (n.º 34 y 33), pendientes de APROBAR |
| Dom 29 | Acertijo «El ascensor de las tres plantas» | E60ES-AC-20261129 | Entregado v1 (n.º 30), pendiente de APROBAR |

Cada vídeo del calendario debe estar también en Neon (`mg.calendario`: video_id, publica_en, tipo,
notas): el bucle autónomo lo usa para detectar retrasos. Al añadir una semana, insertar sus filas.

Al entregar un vídeo, cambia su estado aquí a «Entregado vN» (y a «APROBADO y programado» cuando
llegue la confirmación de Telegram). Cuando termine la semana, añade la siguiente siguiendo el mismo
patrón y avisa al Propietario del plan.


Nota 15/11 (Propietario): ENTRE NOS, ELIGE y PIXEL LIFE se lanzan el lunes 23/11 (no el 16). Si la Torre no está aprobada el lun 16 a las 12:00, la Torre y su avance pasan al martes y el acertijo al miércoles.
