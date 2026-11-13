# MASK GROUP — Motor compartido de vídeo v2
El código implementa ensamblado de vídeos 2D de bajo coste con escenas de texto/imagen y voz local: 9:16 o 16:9, zoom discreto, tarjeta por escena, puzles con 3–30 s de cuenta atrás, respuesta y explicación, MP4 y SHA-256 técnico.
Admite ocho marcas como presets de identidad visual, assets opcionales en assets/ (imagen_path, audio_path, audio_respuesta_path), voz offline Piper es_ES-davefx-medium con fallback espeak-ng. NO crea por sí mismo escenas fotorrealistas ni personajes animados, por lo que DRAMIA/PIXEL LIFE necesitan assets específicos para dar calidad publicable.
Entrada: ENCARGO_B64 de JSON con id, marca/canal, titulo, idioma, orientacion/formato, aprobado:true, escenas. Bloquea guiones no aprobados y APIs de pago. QA PASS significa solamente integridad técnica; jamás aprobación editorial.
GitHub Actions usa minutos incluidos, que pueden cobrarse si se superan. Mantener freno presupuestario y disparo manual/no activado hasta autorización.
La entrega es GitHub -> Telegram -> revisión del Propietario -> Drive -> Upload-Post con segunda autorización de publicación. El motor nunca publica ni sube a Drive.
Consultar cloud/CLAUDE_OPTIMIZATION_HANDOFF.md para auditoría y propuestas de reducción de ejecuciones.
