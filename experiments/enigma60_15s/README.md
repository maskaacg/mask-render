# ENIGMA 60 • Piloto animación vertical de 15 segundos

**Estado:** borrador experimental, NO aprobado y NO publicable. 14 noviembre 2026.

## Vídeo ejecutado

- `ENIGMA60_PILOTO_15S_REVISION.mp4`: 720×1280, 24 fps, 15,00 s, H.264/AAC.
- `contact_sheet.jpg`: fotogramas de control del nuevo piloto (0, 2, 4, 6, 8, 10, 12, 14 s).
- `generate_pilot.py`: crea una escena original con Pillow y FFmpeg. Parallax / zoom, reloj con agujas, péndulo, nota con símbolos, puerta y música original.
- `pilot_qa.json`: medidas ffmpeg y veredicto técnico reproducibles.
- La voz del vídeo es **eSpeak temporal**, solo para validar sincronización, y **NO** equivale a una voz humana natural. No debe usarse para publicación.

## Cómo regenerar localmente (sin nuevos costes de API)

Se necesita `python3`, `ffmpeg`, `espeak`, `Pillow`, `numpy` y `scipy` instalados en un entorno aislado.

```bash
python3 generate_pilot.py
```

No requiere descargar imágenes, modelos de vídeo o llamar a servicios externos.

## Pruebas pendientes de voces naturales

Comparación A/B con el mismo texto y sin suplantar personas reales:

```bash
# SOLO valida el plan; cero descargas
python3 voice_ab.py kokoro_dora --solo-plan
python3 voice_ab.py pocket_lola --solo-plan
# Ejecuciones reales cuando haya conexión y licencias comprobadas:
# pip install 'kokoro>=0.9.2' soundfile    # apt install espeak-ng en Linux
# python3 voice_ab.py kokoro_dora
# pip install pocket-tts
# python3 voice_ab.py pocket_lola
```

Kokoro (Apache 2.0): https://huggingface.co/hexgrad/Kokoro-82M
PocketTTS (CC BY 4.0, model card y términos): https://huggingface.co/kyutai/pocket-tts

**No se instalaron ni se ejecutaron** Kokoro ni PocketTTS en este entorno: faltaban modelos y el acceso externo para obtenerlos. Su instalación posterior podría usar tiempo de cómputo o almacenamiento adicional; verificar cuota antes de correr Actions privadas.

## Flujo de control de calidad

1. Medición de audio (`volumedetect` / `silencedetect`) sobre MP4 final.
2. Comprobar movimiento en fotogramas reales, además de continuidad/legibilidad visual humana.
3. Revisión de naturalidad de voz a ciegas, pronunciación y derechos de uso.
4. Revisión del propietario; **no enviar a publicación ni a Drive final antes de aprobación**.

## Alcance de la escena

Es una **prueba del motor visual**, no un puzle completo. El reto del siguiente episodio debe validarse antes de animarlo, con deducciones interconectadas, pistas visibles y solución única. Ninguna skill se ha instalado de manera remota ni se ha prometido coste cero absoluto de GitHub Actions.

## Licencias

La escena es arte original programático. No usa Remotion: su licencia debe verificarse con los datos legales reales de MASK GROUP antes de integrarlo. Se usan bibliotecas de código abierto ya disponibles para esta prueba.
