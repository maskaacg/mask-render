# Instalación cloud de 25 skills externas (MASK GROUP)
Archivo .github/workflows/skills-install.yml. Ejecución manual y límite 8 min; no render, no modelos, no publicaciones.
Se recuperan commits anclados de tres repos: Jakeschincariol/youtube-agent-skill (11), remotion-dev/skills (13), vercel-labs/skills/find-skills (1); se guardan exclusivamente SKILL.md en carpetas del proyecto para Claude Code y Codex. No se ejecutan scripts de terceros ni se instalan dependencias npm/pip.
Se preservan las políticas corporativas y las pausas DRAMIA/MINI MUNDO. Las instrucciones que remiten a REFERENCE.md o a ejecutables externos podrían requerir archivos adicionales y auditoría. Remotion mantiene una revisión de licencia y condiciones comerciales antes de render.
Si falla con GitHub API 403 en push, no se cambia configuración de repositorio a mano ni se usa otra credencial automáticamente.
Confirmar instalación con árboles Git de main y hashes; no confundir presencia de archivos con activación de un agente o servidor FreeLLMAPI.
