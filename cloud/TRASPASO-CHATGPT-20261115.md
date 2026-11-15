# Traspaso para ChatGPT (Codex) — estado de ENIGMA 60 a 15/11/2026, 03:00 (Madrid)

Escrito por Claude para que ChatGPT sepa todo lo hecho y pueda continuar si Claude llega a su límite.
Rama de trabajo: `feat/e60-diorama-20261114` (nunca `main`). Reglas en `AGENTS.md` y `CLAUDE.md`.

## Reglas del Propietario (no negociables)
No gastar ni activar servicios de pago · no publicar sin su aprobación · revisión por Telegram ·
conservar versiones e historial · no borrar workflows, recursos ni documentación · trabajar en ramas ·
no ejecutar Actions, n8n ni subir a Drive sin autorización · Drive solo tras aprobar · sin voces
clonadas de personas reales · comprobar licencias · QA técnica ≠ aprobación artística · español.
Regla de 48 h: cada vídeo entregado para aprobar 48 h antes de publicarse.

## Lo que está hecho
1. **Escape room 1 «La torre del archivero»** (16:9, 529,7 s) y su **avance** 9:16 (53,2 s), versión v2
   (corregidos colores de escudos y textos superpuestos). **APROBADOS** por el Propietario y
   **PROGRAMADOS** en Upload-Post (perfil `enigama60`): Torre lun 16/11 17:00 (YouTube, Facebook);
   Avance lun 16/11 18:00 (TikTok, YouTube, Facebook). Másteres guardados en Drive (carpeta ENIGMA_60).
   Metadatos por red en `remotion/publicacion/E60ES-ER-001-*.json`.
2. **Render**: `.github/workflows/render-capitulo.yml` (Remotion, por tramos). Ahora además sube el
   máster y el QA **sin comprimir** (upload-artifact v7, `archive: false`) porque n8n no descomprime
   más de 200 MB. `reempaquetar-master.yml` hace lo mismo con másteres antiguos.
3. **Revisión por Telegram** con botones APROBAR / SOLICITAR CAMBIOS / RECHAZAR
   (n8n WF-006b-1 envía, WF-006b-2 recibe; `WF-ENTREGA-REVISION` id `IlIqjndymg4HosrO` entrega lo que
   haya en `mg.entregas_v2`).
4. **Al APROBAR** → `WF-PUB-02` (id `teCTDLB1LgdF4J3z`): comprueba hash y QA, guarda en Drive y
   programa en Upload-Post en una sola petición con textos por red. Probado y funcionando.
   Lee la solicitud con la función segura `mg.solicitud_para_publicar(uuid)`.
5. **Corrector Claude** (tarea programada, 8:41, 14:41, 20:41): procedimiento en `remotion/CORRECTOR.md`.
6. **Corrector de reserva con Codex**: `WF-VIGILANTE` (id `wEgcBn7hPcZeVr3s`, 10:15, 16:15, 22:15).
   Si una corrección lleva >75 min sin atender, abre un PR y te menciona con `@codex`. Prueba hecha:
   entiendes y haces bien el cambio, pero **no lo subiste al PR** (se quedó en tu panel). Decisión del
   Propietario: si no subes el commit, solo se le avisa y la corrección vuelve a Claude.
   **Si puedes, haz commit y push a la rama del PR cuando te mencionen; así funciona sin intervención.**
7. **Productor automático** (tarea programada, 10:13 diario): produce 48–72 h antes los vídeos de
   `remotion/CALENDARIO.md` y los entrega a Telegram.

## Pendiente
- Semana: acertijos mar 17, jue 19, vie 20, dom 22 (9:16, ~2 min); escape room 2 «El museo que
  miente» mié 18 + avance; capítulo 1 de la serie sáb 21 (voz «Chatterbox expresiva») + avance.
- Aviso de «publicado», informe semanal y agentes de análisis de resultados y de comentarios
  (revisar qué existe de verdad antes de construir).
- Instagram: lo conecta el Propietario.

## Si te toca continuar
Lee `AGENTS.md` (sección «Instrucciones para Codex»), `remotion/PRODUCCION.md`, `remotion/CORRECTOR.md`
y `remotion/CALENDARIO.md`. No publiques, no gastes, no toques `main`, `.github` ni `remotion/encargos`
salvo que el procedimiento lo indique, y no borres nada.
