# Motor de escenas Remotion · prototipo ENIGMA 60

Rama experimental. **TEST TÉCNICO, no publicable.** No sustituye a `cloud/render_video.py` ni toca `main`.

- Ficha del episodio: `src/episodes/e60_cinco_sellos_proto.json` (acciones con tiempo, voz, efectos, zona de subtítulos, QA).
- Componentes: sala en perspectiva de un punto de fuga, puerta con bisagra 3D y cuña de luz, cerradura de tres ranuras, mesa con cinco sellos, polvo, subtítulo con caja.
- Audio: `tools/audio_assets.py` genera la voz (Kokoro-82M, voz `em_alex`, Apache 2.0) y efectos sintetizados con numpy (sin muestras de terceros).

Render local (14/11/2026, 2 núcleos de CPU, 1080x1920 a 30 fps): 12 s de vídeo en 192 s.

```
npm ci
npx remotion render src/index.ts E60CincoSellosProto out/e60_cinco_sellos_proto.mp4 --codec=h264 --crf=18
```

Licencia de Remotion: gratuita para personas y empresas de hasta 3 personas (ver `npx remotion license`).
