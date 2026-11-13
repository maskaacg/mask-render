---
name: mask-claude-agent-assembly
description: Coordinar Claude, Codex y agentes por tareas de producción dentro de GitHub y n8n.
---
# mask-claude-agent-assembly

Una sesión Claude Code dentro del checkout debe cargar .claude/skills/*. Codex debe cargar .agents/skills/*. n8n coordina tareas con API GitHub y la base Neon. Un SKILL.md no instala un modelo ni ejecuta herramientas por sí solo. Devolver outputs estructurados: job_id, marca, artefactos, SHA, coste estimado/real, riesgos y bloqueos. Limitar tokens, reintentos, tiempo y fanout. Los tokens gratuitos de terceros no son garantía ni dinero disponible. No enviar secretos en prompts o repositorio.

## Control obligatorio
Español y documentación oficial de MASK GROUP primero. No gasto fuera de aprobación, no publicación automática, no activación de workflows de producción, no envío de secretos. Toda propuesta debe informar qué está verificado y qué queda pendiente.
