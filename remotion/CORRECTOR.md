# Corrector automático ENIGMA 60 (tarea programada de Claude, 3 veces al día)

Procedimiento que sigue la tarea programada «Corrector ENIGMA 60». Nunca publica: solo prepara la versión
corregida y la manda a Telegram con los botones; publicar sigue exigiendo que el Propietario pulse APROBAR.

## 1. Buscar correcciones pendientes (Neon, proyecto wild-meadow-19641563)
```sql
SELECT s.approval_id, s.video_id, s.version, s.motivo, s.decidido_en
FROM mg.solicitudes s
LEFT JOIN mg.correcciones_v2 c ON c.approval_id = s.approval_id
WHERE s.estado = 'CAMBIOS_SOLICITADOS' AND s.canal = 'ENIGMA_60'
  AND s.origen ~ '(WF-TEST-REMOTION|WF-ENTREGA-REVISION)' AND c.approval_id IS NULL
ORDER BY s.decidido_en;
```
Si no hay filas: terminar sin hacer nada (no escribir en Telegram).
Para cada fila, reservarla antes de trabajar:
`INSERT INTO mg.correcciones_v2 (approval_id, video_id, version_origen, estado) VALUES (...,'EN_CURSO')`.

## 2. Localizar el vídeo
`remotion/publicacion/<video_id>.json` da la ficha, la composición, los tramos y el formato.
La ficha (`remotion/fichas/*.json`) tiene guion, puzles y voces; las escenas están en `remotion/src/escape/`.

## 3. Aplicar la corrección del Propietario (texto libre en `motivo`)
- Textos, subtítulos, título, descripción, hashtags → ficha y/o `publicacion/<video_id>.json`.
- Voz: borrar `public/audio/<ficha_id>/<línea>.wav` de las líneas cambiadas y regenerar con
  `python3 tools/voz_chatterbox.py --ficha <ficha> --reanudar --hilos 2` (antes: `python3 tools/voz_lista.py restaurar --ficha <ficha>`),
  después `python3 tools/voz_lista.py guardar --ficha <ficha>`. Si el proceso muere por memoria, relanzar con --reanudar.
- Puzles: cualquier puzle nuevo o cambiado se verifica por código (solución única) antes de seguir; anotar la verificación en `auditoria` de la ficha.
- Antes de entregar: QA visual completa según `remotion/PRODUCCION.md` (colores coherentes, sin textos superpuestos, hoja de contactos revisada).
- Escenas: editar los componentes 3D/UI. Renderizar fotogramas de prueba en local
  (`npx remotion bundle src/index.ts --out-dir /tmp/b && npx remotion still /tmp/b <composición> x.jpg --frame=N --props=out/props_<ficha>.json --gl=swangle`) y mirarlos.
- Si la petición es ambigua o imposible, no inventar: marcar ERROR en mg.correcciones_v2 con el motivo y avisar por Telegram con `SELECT ops.dejar_mensaje('CLAUDE','AVISO','Corrección ENIGMA 60', '<qué falta>')`.

## 4. Nueva versión
- Versión nueva = siguiente `vN` (v1 → v2). Actualizar `version` en `publicacion/<video_id>.json`.
- Commit en la rama `feat/e60-diorama-20261114` (nunca en main) con el motivo y push
  (`git fetch --depth=10 origin feat/e60-diorama-20261114 && git rebase FETCH_HEAD && git push origin HEAD:feat/e60-diorama-20261114`).
- Encargo de render: escribir `remotion/encargos/capitulos/<ENCARGO_ID>.json`
  (`{"encargo_id","composicion","ficha","tramos","estado":"BORRADOR_PENDIENTE_APROBACION"}`, ENCARGO_ID = `<video_id>-<vN>-<AAAAMMDD-HHMMSS>`),
  commit con mensaje `render-capitulo <ENCARGO_ID>` y push: GitHub Actions renderiza (render-capitulo.yml).
- Esperar a que termine (`gh run list --workflow render-capitulo.yml --branch feat/e60-diorama-20261114`); si falla, revisar el log y corregir.
- Actualizar `encargo_master` y `run_id` en `publicacion/<video_id>.json` (para que WF-PUB-02 publique esta versión) y hacer push.

## 5. Enviar a Telegram con botones
```sql
INSERT INTO mg.entregas_v2 (video_id, version, encargo_id, run_id, formato, titulo, descripcion, puzles, notas)
VALUES ('<video_id>','<vN>','<ENCARGO_ID>',<run_id>,'<formato>','<título>','<descripción>','<puzles>','Corrección: <resumen>');
UPDATE mg.correcciones_v2 SET estado='ENTREGADA', nueva_version='<vN>', actualizado_en=now() WHERE approval_id='<id>';
```
Después ejecutar en n8n el workflow WF-ENTREGA-REVISION (id IlIqjndymg4HosrO, modo manual).

## Reglas
No publicar, no gastar, no crear cuentas ni credenciales, no tocar main, no borrar workflows ni datos.
QA técnica superada no es aprobación artística.
