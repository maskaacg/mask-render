# ENIGMA 60 · Prueba de animación 15s · V3 (experimental)

**Estado:** Borrador, no aprobado, no publicable. Sin cargos por API de vídeo ni minutos de GitHub Actions. El render se ejecutó localmente con recursos existentes.

## Qué se ha corregido

Desde el piloto inicial y tras dos iteraciones:

- Cámara con interpolación suave de 9 puntos, sin saltos instantáneos de zoom, con énfasis progresivo en reloj, nota y puerta.
- Sombras desenfocadas precalculadas bajo el reloj y detrás de la puerta; ambiente con leve parallax.
- Subtítulos móviles de 34 px, etiquetas de 26 px, contraste y contorno incrementados.
- Las agujas del reloj avanzan de manera continua.
- La nota no aparece en el primer fotograma; empieza a revelarse en torno a 2 segundos, asciende desde la mesa entre 4 y 7 segundos y se realza con una línea animada.
- Audio procedural con efectos y música: no hay intervalos de silencio prolongados según análisis.

## Limitaciones esenciales

1. **La voz es una locución eSpeak TEMPORAL.** No es humana/natural. Los modelos Kokoro-82M y PocketTTS no se han generado por imposibilidad de descargar sus pesos aquí. `voice_ab.py` está preparado y sus modos `--solo-plan` se probaron sin descargas; son planes, no muestras de audio.
2. Este clip es **una prueba técnica de animación y ritmo, no un acertijo terminado**. No demuestra la calidad creativa de un episodio de dos minutos.
3. Claude Sonnet examinó ocho fotogramas del piloto V1 y V2 y calificó V2 `APTO_SOLO_PRUEBA`. La V3 aplica sus correcciones de contraste y anticipación de pista, pero no se debe interpretar como aprobación independiente del nuevo render salvo revisión posterior.
4. Un FPS de 24 no implica 24 movimientos significativos por segundo; los controles numéricos de cambios visuales son indicadores internos, no prueba de animación profesional.

## Archivos

- `ENIGMA60_PILOTO_V3_15S_REVISION.mp4`: 720×1280, 24 FPS, H.264/AAC, 15 segundos.
- `generate_pilot_v3.py`: generador reproducible de la V3.
- `contact_sheet_V3_real.jpg`: muestras extraídas del MP4 final cada dos segundos.
- `qa_v3_report.json`: comparación cuantitativa V2↔V3.
- `voice_ab.py`: test A/B preparado para Kokoro/PocketTTS, sin instalar modelos.

## Regeneración sin servicios externos

Requiere `python3`, `numpy`, `scipy`, `Pillow`, `ffmpeg`, `espeak`.

```
python generate_pilot_v3.py
python voice_ab.py kokoro_dora --solo-plan
python voice_ab.py pocket_lola --solo-plan
```

Ninguna de estas órdenes descarga modelos de voz. La descarga real de un modelo exigiría conectividad, revisar licencia comercial y verificar consumo de recursos. La prueba V3 usa herramientas instaladas sin añadir suscripciones o utilizar GitHub Actions; no puede garantizarse que una ejecución futura en nube sea gratis.

## Aprobaciones y alcance

Trabajar en rama de GitHub `feat/enigma60-piloto-15s-20261114`. Mantener `main` intacta. Ningún vídeo se publica ni pasa a Drive final sin aprobación explícita del Propietario.
