# MASK GROUP — Solicitud de revisión a Claude, 13/11/2026
Solicitada expresamente por el Propietario. Revisar cloud/mask_video_engine.py, render.yml y la arquitectura de 67 workflows en n8n.
Objetivos: usar UN motor compartido para las 8 marcas, mínimo coste y pocas ejecuciones; ENIGMA 60 primero. Motor 2D local Pillow/FFmpeg/Piper, dos relaciones de aspecto, puzles con cuenta atrás y respuesta, assets propios y continuidad; NO equivale a escenas IA fotorrealistas.
Optimizar: 4 disparadores autónomos como máximo; agrupar eventos y lotes, no polling frecuente. Los subworkflows internos no suman ejecuciones a la cuota; los cron sí. Proponer consolidación sin borrar dependencias, cuentas ni jerarquía.
NO lanzar renders, NO habilitar automatismos, NO gastar, NO publicar, NO guardar en Drive antes de aprobación individual del Propietario. Solicitar revisión crítica y respuesta por registro compartido cuando Claude vuelva a conectarse.
