---
name: mask-pipeline-production
description: Cadena de producción real de MASK GROUP, de la ficha al vídeo publicado (GitHub Actions, n8n, Neon, Telegram, Upload-Post). Úsala para planificar o revisar una entrega, o para saber qué sistema hace cada paso y qué exige permiso del Propietario.
---
# mask-pipeline-production

Cadena vigente a 16/11/2026. Solo ENIGMA 60 produce y publica; DRAMIA y MINI MUNDO tienen la
publicación pausada. Todo es en español.

## Pasos y quién hace cada uno
1. **Calendario**: `remotion/CALENDARIO.md` y `mg.calendario` en Neon. El bucle autónomo (cada hora, en
   n8n) crea la tarea de producir cuando un vídeo entra en la ventana de 48 h sin entrega.
2. **Ficha y escenas** en el repositorio (`remotion/fichas`, `remotion/src`). Puzles verificados por
   código y sin repetir familia.
3. **Comprobación previa**: `python tools/preflight.py <encargo>` desde `remotion/`.
4. **Render en GitHub Actions**: se sube el encargo a la rama de trabajo (`render-remotion` para
   cortos, `render-capitulo` para largos y avances). El repositorio es público: los minutos son
   gratuitos, y por eso no se guarda en él ningún secreto.
5. **QA**: técnica automática (`tools/finalize_qa.py`, con hash SHA-256) y visual a mano con la hoja
   de contactos.
6. **Entrega a Telegram**: fila en `mg.entregas_v2` y workflow WF-ENTREGA-REVISION. El Propietario
   recibe un solo mensaje con el vídeo y los botones APROBAR / SOLICITAR CAMBIOS / RECHAZAR.
7. **Correcciones**: cada una genera una versión nueva. Las atiende Claude; si no las atiende en
   75 min, pasan a Codex (WF-VIGILANTE). Ver `remotion/CORRECTOR.md`.
8. **Tras APROBAR**: WF-PUB-02 comprueba el hash del máster, lo guarda en Drive y lo programa en
   Upload-Post con los textos de `remotion/publicacion/<video_id>.json`.
9. **Después de publicar**: WF-AGENTES-DIARIO confirma lo publicado y recoge comentarios y analítica.

## Lo que siempre exige permiso expreso del Propietario
Gastar o contratar, publicar, crear cuentas, borrar datos, cambiar permisos o credenciales y cambiar
la estructura de agentes. Aprobar un vídeo aprueba esa versión y ese hash, nada más.

## Al informar
Separa lo implementado, lo probado, lo pendiente y lo bloqueado. No presentes una simulación como
una ejecución real.
