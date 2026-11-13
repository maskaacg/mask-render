# Protocolo obligatorio: envío directo a Drive tras aprobar
(1) Generar render y guardar temporalmente como artefacto PRIVADO de GitHub Actions, con id del encargo, commit SHA, SHA-256 del MP4, resolución, duración, idioma y canal.
(2) QA técnico/editorial/derechos. Preparar vista previa protegida y enviarla al propietario por canal aprobado (por ejemplo Telegram); no usar carpeta de Drive como sala de revisión.
(3) Propietario aprueba exactamente contenido, SHA-256, versión y destino Drive; la aprobación NO equivale a autorizar publicación en YouTube/TikTok/Reels.
(4) Solo tras confirmar un token de aprobación no caducado en Neon, descargar el mismo artefacto privado con credencial GitHub de n8n, comprobar SHA-256 contra registro aprobado, subir MP4 a Google Drive con Google Drive OAuth, guardar file_id en Neon y confirmar recepción.
(5) Rechazo/cambio: no subir a Drive. Render cambiado exige nueva aprobación. Idempotencia: evitar duplicados de mismo SHA-256/destino. Caducidad y límites de tamaño del artefacto requieren política explícita.
(6) DRAMIA y MINI MUNDO: publicación PAUSADA incluso si se aprueba almacenamiento, sin programar estrenos. Todos los workflows de producción permanecen INACTIVOS hasta autorización técnica y presupuesto.
