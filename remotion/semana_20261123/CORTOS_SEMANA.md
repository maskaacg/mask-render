# ENIGMA 60 · Cortos 9:16 de la semana 23-29/11/2026 — paquetes v1 (GUIONES PARA REVISIÓN)

**Formato común (auditoría del 22/11, ya aplicado en «La balanza del molinero»):**
- **0–2 s:** el objeto del puzle en cuadro y una pregunta corta en una etiqueta ámbar. Sin entrada por la sala, sin título vacío, sin fundido desde negro.
- Pizarra grande con los datos (≥ 44 px, una idea por fila, máximo 4 filas). Subtítulos de 1–2 líneas en su franja.
- 15 s de cuenta atrás. La **respuesta y su demostración paso a paso van DENTRO del corto**. En los vinculados, la invitación al vídeo largo va después de resolver.
- Llamada a suscribirse natural al final (tarjeta de 3 s).
- Duración: 85–100 s (regla vigente de 70–120 s). **Propuesta de prueba A/B, solo con autorización:** versión de 60–75 s de uno de los cortos para comparar la retención.
- Motor: `E60CortoSala` con `gancho: true` (ya en el repositorio). Cada corto independiente necesita su componente 3D (se indica en cada uno). Voz: Chatterbox, como en los cortos del 17-22/11.

| Día | Pieza | video_id propuesto | Tipo | Familia (nueva) | Sala propia (firma) | Estado |
|---|---|---|---|---|---|---|
| Lun 23 | Avance del Observatorio **v2** | E60ES-ER-003-AVANCE v2 | Vinculado | (la del largo: conteo_cubos_ocultos) | La del largo | Guion. **v1 programada; no se toca sin orden** |
| Mar 24 | La habitación de las tres sombras | E60ES-AC-20261124 | Independiente | mezcla_aditiva_sombras | galeria-escultor-01 (papel · losas · luna) | Guion verificado |
| Mié 25 | La esclusa que nadie debía abrir | E60ES-S001-E02-AVANCE | Vinculado al cap. 2 | (la del cap. 2: secuencia_estados) | La del cap. 2 | Guion verificado |
| Jue 26 | La vitrina de los tres reflejos | E60ES-AC-20261126 | Independiente | espejo_doble_reflexion | joyeria-cerrada-01 (azulejo · damero · lámpara) | Guion verificado |
| Vie 27 | ¿Qué campana falta? | E60ES-ER-004-AVANCE | Vinculado al ER #4 | (la del largo: cuadrado_latino) | La del largo | Guion verificado |
| Sáb 28 | **La torre de dados** (antes «La llave de dos caras») | E60ES-AC-20261128 | Independiente | dados_caras_opuestas | casino-barco-01 (tablas · damero · chimenea) | Guion verificado |
| Dom 29 | El ascensor de las tres plantas | E60ES-AC-20261129 | Independiente | tiempos_recorrido | hotel-ascensor-01 (chapa · losas · lámpara) | Guion verificado |

**Cambio de título del sábado:** con «La llave de dos caras» no conseguí un enunciado que se pudiera verificar sin símbolos diminutos ni trucos. ChatGPT ya pedía evitarlos. Propongo «La torre de dados», que es visual y tiene una sola solución. Si el Propietario prefiere la llave, hay que rediseñarla.

Todas las soluciones: `python tools/verificar_semana_20261123.py` → **TODO OK** (22/11, Claude).

---

## Lun 23 · Avance del Observatorio v2 (corrección propuesta)
**Problema de la v1 (programada, 88,4 s):** la pregunta llega a los 25 s, el **72 % de los fotogramas** está por debajo de la luminancia 35 y **no resuelve** el conteo («la solución… en el vídeo completo»). Eso incumple la regla 7 del Propietario.
**Propuesta v2 (≈ 95 s).** Se mantienen la sala y las cajas. Lo que cambia:
- 0–2 s: plano cenital del montón con la etiqueta «¿Cuántas cajas hay? (también las que no ves)».
- NARR: Ninguna caja flota. Desde arriba solo ves las tapas. ¿Cuántas cajas hay en este montón?
- NARR: La base es un cuadrado de tres por tres, pero falta la esquina de delante a la derecha. Encima, otro piso más pequeño. Y arriba del todo, una sola caja.
- (cuenta de 15 s con la pizarra «BASE 3×3 SIN UNA ESQUINA · NINGUNA FLOTA»)
- NARR: Trece cajas.
- NARR: Abajo, nueve menos una: ocho. En el segundo piso, cuatro. Arriba, una. Ocho más cuatro más una: trece.
- (las cajas se separan por pisos y se cuentan con números grandes, reutilizando la animación del largo, 1:00–2:55)
- NARR: Esa fue la primera puerta. Quedan tres salas y una luna que solo dura treinta minutos: el escape room completo, «El observatorio apagado», está en el canal. Suscríbete para la siguiente.
- **Cómo se cambiaría:** render nuevo (composición `E60AvanceObservatorio` con modo puzle) → revisión → si se aprueba, **WF-PUB-CANCELAR** retira la v1 de Upload-Post y WF-PUB-02 programa la v2. **Hace falta orden expresa del Propietario** para cancelar la v1. Sin esa orden, la v1 sale el lunes a las 18:00 tal como está.

---

## Mar 24 · La habitación de las tres sombras (E60ES-AC-20261124)
- **Gancho (0–2 s):** una estatua blanca en el centro de una galería y tres sombras de colores en el suelo (cian, magenta y amarillo). Etiqueta: «3 lámparas tapadas. ¿De qué color es cada una?»
- **Guion (≈ 175 palabras):**
  - l01 intro: Tres lámparas tapadas, y una estatua que proyecta tres sombras… de colores.
  - l02 intro: La puerta se abre con los tres interruptores, pero solo si sabes de qué color es cada lámpara, de izquierda a derecha.
  - l03 enunciado: Las lámparas son roja, verde y azul. Una está a la izquierda, otra justo encima y otra a la derecha.
  - l04 enunciado: Donde una luz no llega, la sombra se queda con las otras dos: sin rojo, verde y azul dan cian; sin verde, magenta; sin azul, amarillo.
  - l05 enunciado: Y cada sombra cae al lado contrario de su lámpara. ¿De qué color es cada lámpara, de izquierda a derecha?
  - l06 solución: Azul, verde y rojo.
  - l07 solución: La sombra cian, la que no tiene rojo, cae a la izquierda: la roja está a la derecha.
  - l08 solución: La magenta, sin verde, cae justo debajo: la verde está encima.
  - l09 solución: Y la amarilla, sin azul, cae a la derecha: la azul está a la izquierda.
  - l10 solución: Lo compruebas apagando una a una. Cada vez que apagas una, desaparece su sombra.
  - l11 cta: ¿Te lo esperabas? Cuéntalo en los comentarios.
  - l12 cta: Y suscríbete: mañana, otra habitación.
- **Pizarra:** «ROJO+VERDE = AMARILLO · VERDE+AZUL = CIAN · ROJO+AZUL = MAGENTA» y «LA SOMBRA CAE AL LADO CONTRARIO».
- **Solución formal:** sombra cian a la izquierda → falta el rojo → la roja está a la derecha; magenta en el centro → la verde está arriba; amarilla a la derecha → la azul está a la izquierda. Respuesta: **azul, verde, rojo**. Es la única de las 6 permutaciones que cumple (verificador).
- **Demostración (animación con propósito):** las pantallas se levantan una a una. Al encender o apagar cada lámpara, su sombra aparece o desaparece. Es física real de mezcla aditiva, la renderiza three.js con tres `SpotLight` de colores puros sobre un suelo blanco.
- **Componente nuevo:** `Sombras3D` (estatua, tres focos con pantalla que se levanta y suelo claro). **Ventaja de iluminación:** el suelo es blanco y las tres luces suman blanco. Es el corto más luminoso de la semana.
- **Sala:** galeria-escultor-01 · papel · losas · luna (luz ambiental baja para que destaquen las sombras de color).
- **Metadatos:** título «Tres sombras de colores: ¿de qué color es cada lámpara? 🎨 #shorts #acertijos»; portada en el fotograma del gancho.

---

## Mié 25 · La esclusa que nadie debía abrir (E60ES-S001-E02-AVANCE)
- **Gancho (0–2 s):** cuatro palancas oxidadas en una esclusa con agua hasta las rodillas. Etiqueta: «4 palancas. Un solo orden».
- **Guion (≈ 170 palabras):**
  - l01 intro: Seiscientos metros bajo el mar. Una esclusa entre dos compartimentos y el agua subiendo.
  - l02 intro: Cuatro palancas: cerrar la compuerta exterior, igualar la presión, abrir la interior y purgar el agua.
  - l03 enunciado: La placa tiene cuatro reglas. Nunca dos compuertas abiertas a la vez. No se abre con presiones distintas.
  - l04 enunciado: Igualar con la exterior abierta inunda la esclusa. Y la purga va al final.
  - l05 enunciado: ¿En qué orden bajas las palancas?
  - l06 solución: Cerrar, igualar, abrir, purgar.
  - l07 solución: Primero cierras la exterior: si no, al igualar entraría el mar.
  - l08 solución: Igualas, y la compuerta interior ya se puede abrir.
  - l09 solución: Y la purga, al final, saca el agua que entra al abrir. Cualquier otro orden rompe una regla.
  - l10 cta: Esta esclusa es uno de los cinco puzles del capítulo dos de Profundidad 600. Lo que hay al otro lado… está en YouTube.
  - l11 cta: Suscríbete para no perderte el siguiente capítulo.
- **Sin spoilers:** no aparecen Iker, el Morse ni el final. Solo la mecánica de la esclusa.
- **Verificación:** C-I-A-P es el único orden de las 24 permutaciones que cumple las 4 reglas.
- **Enlace a YouTube:** el vídeo relacionado del Short se añadirá en YouTube Studio cuando el capítulo esté publicado (función oficial).

---

## Jue 26 · La vitrina de los tres reflejos (E60ES-AC-20261126)
- **Gancho (0–2 s):** una placa de espaldas en una vitrina con dos espejos en ángulo recto y tres reflejos que dicen 825, 258 y 825. Etiqueta: «2 reflejos dicen 825. ¿Cuál es el código?»
- **Guion (≈ 170 palabras):**
  - l01 intro: Una joyería cerrada. La caja fuerte tiene tres cifras, y la placa con el código está de espaldas.
  - l02 intro: Solo puedes leerla en la vitrina: dos espejos unidos en ángulo recto que dan tres reflejos.
  - l03 enunciado: El de la izquierda dice ocho, dos, cinco. El de la derecha, también. El del rincón, en el centro, dice dos, cinco, ocho.
  - l04 enunciado: Las cifras son de reloj digital: el dos reflejado parece un cinco, y el cinco, un dos.
  - l05 enunciado: Dos reflejos contra uno. ¿Cuál es el código de verdad?
  - l06 solución: Dos, cinco, ocho. Gana el reflejo que está solo.
  - l07 solución: Un espejo da la vuelta a todo: invierte el orden y cada cifra. Por eso los dos laterales coinciden… y los dos mienten igual.
  - l08 solución: El del rincón ha rebotado en los dos espejos. Una vuelta deshace la otra: es el único que se ve como la placa.
  - l09 solución: Si le das la vuelta a la placa, lo compruebas: dos, cinco, ocho.
  - l10 cta: ¿Te ha engañado la mayoría? Cuéntalo en los comentarios.
  - l11 cta: Y suscríbete: mañana, otra habitación.
- **Demostración:** la placa gira 180° delante de la cámara y se lee 258. Después, la animación de los dos espejos alineándose muestra la doble inversión: una flecha rebota en los dos espejos.
- **Solución formal:** con los dígitos de 7 segmentos (solo 0, 1, 2, 5 y 8 siguen siendo cifras al reflejarse), el único código cuyos reflejos simples son 825 y cuyo reflejo doble es 258 es **258** (verificador).
- **Componente nuevo:** `Vitrina3D` (dos `Reflector` de three.js en ángulo de 90° y una placa con cifras de 7 segmentos grandes). El reflejo es real, no dibujado.
- **Sala:** joyeria-cerrada-01 · azulejo · damero · lámpara.

---

## Vie 27 · ¿Qué campana falta? (E60ES-ER-004-AVANCE)
- **Gancho (0–2 s):** cuatro campanas colgadas y un gancho vacío. Suena la melodía y se corta en la nota que falta. Etiqueta: «¿Qué campana falta?»
- **Guion (≈ 165 palabras):**
  - l01 intro: Campanario de un castillo en el que no amanece. La partitura está en la pared, y falta una nota.
  - l02 intro: Cuatro campanas: cobre, bronce, plata y hierro. Uno, dos, tres y cuatro.
  - l03 enunciado: En cada compás suenan las cuatro, una vez cada una. Y ninguna campana repite posición en dos compases.
  - l04 enunciado: Compases: uno, dos, tres, cuatro. Tres, cuatro, uno, dos. Cuatro, tres, dos, uno. Y el último: dos, hueco, cuatro, tres.
  - l05 enunciado: ¿Qué campana falta?
  - l06 solución: La uno: la de cobre.
  - l07 solución: En el último compás ya suenan la dos, la cuatro y la tres. Solo falta la uno.
  - l08 solución: Y en la segunda posición ya sonaron la dos, la cuatro y la tres. Las dos reglas lo confirman.
  - l09 solución: La campana de cobre baja y la melodía se completa.
  - l10 cta: Es la segunda de las cinco puertas de «El castillo sin amanecer». Las otras cuatro te esperan en el escape room completo, en YouTube.
  - l11 cta: Suscríbete para no perderte el próximo.
- **Verificación:** con 4 opciones, solo el 1 cumple las dos reglas (verificador). **Audio:** las campanas suenan de verdad (síntesis FM propia). La melodía completa es la recompensa.

---

## Sáb 28 · La torre de dados (E60ES-AC-20261128)
- **Gancho (0–2 s):** tres dados gigantes apilados en una mesa de casino; arriba se ve un cinco. Etiqueta: «¿Cuánto suman las caras que no ves?»
- **Guion (≈ 165 palabras):**
  - l01 intro: El casino de un barco antiguo. La ruleta está rota, y la salida depende de una torre de dados.
  - l02 intro: Tres dados normales, uno encima del otro. En lo alto se ve un cinco.
  - l03 enunciado: El código es la suma de las caras ocultas: las que se tocan entre dados y la de abajo del todo, contra la mesa.
  - l04 enunciado: Una pista de jugador: en un dado normal, las caras opuestas siempre suman siete.
  - l05 enunciado: ¿Cuánto suman las cinco caras ocultas?
  - l06 solución: Dieciséis.
  - l07 solución: Debajo del cinco del dado de arriba hay un dos, porque se opone al cinco.
  - l08 solución: El dado del medio esconde arriba y abajo dos caras opuestas: siete.
  - l09 solución: Y el de abajo, igual: arriba y abajo, otros siete. Dos, más siete, más siete: dieciséis. Y no hace falta ver ninguna.
  - l10 cta: ¿Lo sacaste sin levantar los dados? Cuéntalo.
  - l11 cta: Y suscríbete: mañana, la última habitación de la semana.
- **Demostración:** los dados se separan en el aire, giran y enseñan cada cara oculta con su número. Debajo, la suma va creciendo.
- **Componente nuevo:** `Dados3D` (dados con puntos en relieve, opuestos que suman 7; animación de separación).
- **Sala:** casino-barco-01 · tablas · damero · chimenea.

---

## Dom 29 · El ascensor de las tres plantas (E60ES-AC-20261129)
- **Gancho (0–2 s):** la aguja del ascensor de un hotel viejo, rota y girando sola. Etiqueta: «¿En qué planta se paró?»
- **Guion (≈ 175 palabras):**
  - l01 intro: Hotel Miramar, de madrugada. El ascensor se ha parado entre gritos de cables, y su aguja está rota.
  - l02 intro: El portero lo vio salir de la planta uno. Tienes que saber dónde está para sacarlo con la llave de emergencia.
  - l03 enunciado: Tarda ocho segundos en cada planta. Paró una sola vez por el camino, y abrió las puertas seis segundos.
  - l04 enunciado: El viaje entero duró treinta segundos. El hotel solo tiene tres plantas.
  - l05 enunciado: ¿Dónde hizo la parada y en qué planta se quedó?
  - l06 solución: Paró en la tres y se quedó en la dos.
  - l07 solución: Si para en la dos: ocho segundos, más seis de puertas, más ocho hasta la tres o la uno. Veintidós. No llega.
  - l08 solución: Si para en la tres: dieciséis, más seis… y le quedan ocho segundos. Una planta. Baja a la dos.
  - l09 solución: Volver a la uno serían dieciséis más: treinta y ocho. Solo encaja la dos.
  - l10 cta: ¿Lo pillaste antes de la cuenta? Cuéntalo en los comentarios.
  - l11 cta: Y suscríbete: el lunes empieza otra semana de habitaciones.
- **Demostración:** una maqueta en corte del hueco del ascensor. La cabina sube y baja mientras un cronómetro grande suma los segundos y se para en 30.
- **Solución formal:** de los 4 recorridos posibles con una parada (2→1, 2→3, 3→1, 3→2), solo 3→2 dura 30 s (verificador).
- **Componente nuevo:** `Ascensor3D` (hueco en corte, cabina, esfera con aguja y cronómetro).
- **Sala:** hotel-ascensor-01 · chapa · losas · lámpara.

---

## Checklist de QA común (cada corto)
- [ ] Fotograma 0: el objeto del puzle se ve y hay pregunta en pantalla (portada de TikTok = ese fotograma).
- [ ] Ningún texto de menos de 40 px a 1080 de ancho; pizarra de 4 filas como máximo.
- [ ] Respuesta y demostración dentro del corto; la invitación al largo va después.
- [ ] Menos del 20 % de fotogramas con luminancia < 35 (los publicados van del 2,6 al 81,6 %).
- [ ] Duración de 70 a 120 s medida en el máster; −14 LUFS ±1; sin segundos congelados.
- [ ] Familia y sala nuevas en `PUZLES_USADOS.json` (verificador de puzles únicos en verde).
- [ ] Shorts vinculados: preparar el vídeo relacionado para YouTube Studio tras publicar el largo.
