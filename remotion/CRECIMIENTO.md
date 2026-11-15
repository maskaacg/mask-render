# Estrategia de crecimiento de ENIGMA 60 (orden del Propietario, 15/11/2026)

Obligatoria para toda producción nueva (Claude o Codex). No sustituye a `PRODUCCION.md`: se suma.
Fuentes consultadas el 15/11/2026: guías de retención de vidIQ, TubeMilestone, OutlierKit y la
documentación de la YouTube Data API.

## Distribución (obligatoria, la aplica también WF-PUB-02)
- **YouTube (16:9)**: SOLO vídeos largos: escape rooms completos, capítulos de serie, historias,
  recopilaciones y especiales.
- **TikTok, Instagram Reels, Facebook Reels y YouTube Shorts (9:16)**: acertijos cortos, avances,
  teasers y fragmentos adaptados, siempre pensados para llevar al vídeo largo de YouTube.
- Un vídeo 16:9 nunca se publica en redes verticales ni al revés (WF-PUB-02 lo bloquea).

## 1. Gancho (0–30 s)
La métrica «Intro» de YouTube Studio es el porcentaje de espectadores que siguen tras 30 s, y la
retención rara vez recupera lo perdido ahí.
- **0–5 s**: imagen y frase que confirman título y miniatura (p. ej. la vela encendiéndose y «Tienes
  hasta que se apague para salir»). Nada de saludos, logotipos largos ni presentaciones.
- **5–20 s**: lo que está en juego y el reto al espectador («Cuatro cerraduras. ¿Cuántas abres tú?»).
- **20–30 s**: hoja de ruta en una frase. El sello de ENIGMA 60, como mucho 2 s y después del gancho.
- Cambio visual cada 8–12 s dentro del gancho.

## 2. Suscripción y campanita (integradas, no repetitivas)
- **Una sola** petición de suscripción en el vídeo largo, dicha por un personaje dentro de la historia
  y justo después de un acierto (p. ej. tras resolver la 2.ª cerradura: «Los que llegan hasta aquí
  suelen volver… únete a los que abren todas las puertas»). Nunca dentro de un puzle ni durante los
  segundos de pensar.
- **Campanita**: una sola mención, al final, ligada a algo concreto («el miércoles se abre la sala
  siguiente; activa la campanita para entrar el primero»).
- Avances y cortos: sin petición de suscripción hablada; texto discreto «Vídeo completo en YouTube»
  al final.

## 3. Comentarios y participación
- Una pregunta concreta antes de cada solución («Escribe en comentarios qué escudo va primero»), y una
  final («¿Cuántas cerraduras abriste sin mirar la solución?»).
- Descripción con la misma pregunta y capítulos (marcas de tiempo).

## 4. Misterio entre episodios
- Cada vídeo largo esconde **una pista del misterio que conecta episodios** (en series, la pista del
  megapuzle oculto: 1 por capítulo, comprobada por código y anotada en la ficha, nunca explicada).
- El final abre el siguiente: «la archivera deja caer una llave con un símbolo…».

## 5. Pantalla final de YouTube (últimos 20 s)
- El vídeo reserva los **últimos 20 s** con fondo limpio y dos huecos marcados (vídeo
  relacionado + suscripción), sin texto encima.
- **Limitación verificada**: la YouTube Data API no permite crear pantallas finales; hay que añadirlas
  en YouTube Studio (o copiarlas de un vídeo anterior). Queda como paso manual del Propietario hasta
  que exista una vía automática.

## 6. Avances que llevan al largo
- 9:16, ≤ 60 s, gancho en el primer segundo, un puzle sin resolver y cierre «La solución, en el vídeo
  completo de YouTube». Fragmento real del largo, adaptado a vertical (no estirado).

## 7. Títulos y miniaturas
- Título = promesa + reto, ≤ 60 caracteres útiles; la miniatura no repite el título: muestra el objeto
  del reto (vela, cerradura, escudos) y como mucho 3 palabras.
- Coherencia: lo que promete la miniatura aparece en los primeros 5 s.

## 8. Listas y continuidad
- Listas de reproducción por formato («Escape rooms», «Serie T1», «Acertijos»). Añadir vídeos a
  listas sí lo permite la YouTube Data API (`playlistItems.insert`), pero Upload-Post no: **pendiente**
  de conectar la API de YouTube; hasta entonces, manual.
- Descripción: enlace al vídeo anterior/siguiente y a la lista.

## 9. Medición (después de publicar)
- A las 48 h y a los 7 días: Intro (30 s), duración media, picos/caídas, CTR de impresiones y
  suscriptores ganados por vídeo. **Pendiente**: requiere acceso a YouTube Analytics (no está
  conectado). No se inventan cifras.
