---
name: mask-pipeline-production
description: Planificar producción, assets, storyboard, voces, QA, revisión y entrega para MASK GROUP.
---
# mask-pipeline-production

Pipeline de elaboración: (1) consultar último registro editorial; (2) validar marca e idioma ES, formato 16:9/9:16 y rights; (3) guion + bible + shotlist + metadatos versionados; (4) render PRIVADO en GitHub Actions con tamaño/duración limitados; (5) FFprobe QA + SHA-256 + preview temporal; (6) solicitud de revisión con hash por archivo/versión/destino; (7) solo después de APROBADA y hash coincidente, upload MP4 a Google Drive; (8) publicación por aprobación ADICIONAL, nunca por defecto. Nada en PC. No habilitar puentes ni gasto sin controles. DRAMIA y MINI MUNDO publicación pausada.

## Control obligatorio
Español y documentación oficial de MASK GROUP primero. No gasto fuera de aprobación, no publicación automática, no activación de workflows de producción, no envío de secretos. Toda propuesta debe informar qué está verificado y qué queda pendiente.
