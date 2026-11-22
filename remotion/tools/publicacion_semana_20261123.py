"""Genera remotion/publicacion/<video_id>.json para las piezas de la semana 23-29/11 (Claude, 22/11/2026).

Uso: python tools/publicacion_semana_20261123.py VIDEO_ID ENCARGO RUN_ID SHA256 [capitulos.json]
WF-PUB-02 lee este archivo al pulsar APROBAR: run_id y sha256 deben ser los del máster entregado.
"""
import json, sys

COMUN_YT = {"categoryId": "24", "privacyStatus": "public", "selfDeclaredMadeForKids": False, "containsSyntheticMedia": True, "defaultLanguage": "es"}
IA = "Contenido creado con ayuda de IA."
CORTOS = {
    "E60ES-AC-20261124": dict(ficha="fichas/E60-2026-11-24-corto.json", programado="2026-11-24T18:00:00",
        titulo="3 sombras de colores: ¿de qué color es cada lámpara? 🎨",
        youtube_title="3 sombras de colores: ¿de qué color es cada lámpara? 🎨 #shorts #acertijos",
        youtube_description="Tres lámparas tapadas (roja, verde y azul) iluminan una estatua y en la pared aparecen tres sombras: cian, magenta y amarilla. Cada sombra cae al lado contrario de su lámpara. ¿De qué color es cada una, de izquierda a derecha? 15 segundos y solución explicada paso a paso. " + IA + " #shorts #acertijos #logica",
        tiktok_title="Tres lámparas tapadas y tres sombras de colores: cian, magenta y amarilla. Cada sombra cae al lado contrario de su lámpara. ¿De qué color es cada lámpara, de izquierda a derecha? Solución explicada en el vídeo. #acertijos #logica #enigma #retomental #colores",
        facebook_title="¿De qué color es cada lámpara?", facebook_description="Sombras cian, magenta y amarilla: ¿dónde está la lámpara roja, la verde y la azul? Solución explicada en el vídeo. ENIGMA 60. " + IA + " #acertijos #logica",
        tags=["acertijos", "sombras", "colores", "lógica", "shorts", "enigma 60"]),
    "E60ES-ER-004-AVANCE": dict(ficha="fichas/E60-ER-004-T.json", programado="2026-11-25T18:00:00", requiere_publicado_antes="E60ES-ER-004",
        titulo="¿Qué campana falta? 🔔",
        youtube_title="¿Qué campana falta? 🔔 #shorts #acertijos",
        youtube_description="Cuatro campanas, cuatro compases: en cada compás suenan las cuatro una vez y ninguna repite posición. En el último falta una. ¿Cuál? Solución explicada en el vídeo, y cuatro puertas más en el escape room completo «El castillo sin amanecer» del canal. " + IA + " #shorts #acertijos #escaperoom",
        tiktok_title="Cuatro campanas y una partitura incompleta: en cada compás suenan las cuatro una vez y ninguna repite posición. ¿Qué campana falta? Solución en el vídeo y el escape room completo en YouTube (ENIGMA 60). #acertijos #escaperoom #logica #enigma #retomental",
        facebook_title="¿Qué campana falta?", facebook_description="Una partitura de cuatro campanas con un hueco. ¿Cuál falta? Solución en el vídeo; el escape room completo, en YouTube (ENIGMA 60). " + IA + " #acertijos #escaperoom",
        tags=["acertijos", "escape room", "campanas", "lógica", "shorts", "enigma 60"]),
    "E60ES-AC-20261126": dict(ficha="fichas/E60-2026-11-26-corto.json", programado="2026-11-26T18:00:00",
        titulo="2 reflejos dicen 825, 1 dice 258: ¿cuál es el código? 🪞",
        youtube_title="2 reflejos dicen 825 y 1 dice 258: ¿cuál es el código? 🪞 #shorts #acertijos",
        youtube_description="La placa del código está de espaldas y solo puedes leerla en dos espejos en ángulo recto. Dos reflejos dicen 825 y el del rincón dice 258. ¿Cuál es el código real? 15 segundos y solución explicada. " + IA + " #shorts #acertijos #logica",
        tiktok_title="Una placa de espaldas y dos espejos en ángulo recto: dos reflejos dicen 825 y el del rincón dice 258. ¿Cuál es el código de verdad? Solución explicada en el vídeo. #acertijos #logica #enigma #espejos #retomental",
        facebook_title="¿Cuál es el código de verdad?", facebook_description="Dos reflejos dicen 825 y uno dice 258. ¿Cuál es el código real? Solución en el vídeo. ENIGMA 60. " + IA + " #acertijos #logica",
        tags=["acertijos", "espejos", "reflejos", "lógica", "shorts", "enigma 60"]),
    "E60ES-AC-20261127": dict(ficha="fichas/E60-2026-11-27-corto.json", programado="2026-11-27T18:00:00",
        titulo="Tres dados apilados: ¿cuánto suman las caras que no ves? 🎲",
        youtube_title="Tres dados apilados: ¿cuánto suman las caras que no ves? 🎲 #shorts #acertijos",
        youtube_description="Tres dados normales apilados y un 5 arriba del todo. ¿Cuánto suman las cinco caras ocultas (entre dados y contra la mesa)? Pista: las caras opuestas de un dado suman 7. 15 segundos y solución explicada. " + IA + " #shorts #acertijos #logica",
        tiktok_title="Tres dados apilados con un 5 arriba. ¿Cuánto suman las caras que no ves? Pista: las caras opuestas suman 7. Solución explicada en el vídeo. #acertijos #logica #enigma #dados #retomental",
        facebook_title="¿Cuánto suman las caras ocultas?", facebook_description="Tres dados apilados, un 5 arriba. ¿Cuánto suman las caras que no se ven? Solución en el vídeo. ENIGMA 60. " + IA + " #acertijos #logica",
        tags=["acertijos", "dados", "lógica", "shorts", "enigma 60"]),
    "E60ES-S001-E02-AVANCE": dict(ficha="fichas/E60-S01-C02-T.json", programado="2026-11-28T18:00:00", requiere_publicado_antes="E60ES-S001-E02",
        titulo="4 palancas, un solo orden: ¿cómo abres la esclusa? ⚓",
        youtube_title="4 palancas, un solo orden: ¿cómo abres la esclusa? ⚓ #shorts #acertijos",
        youtube_description="Una esclusa a 600 metros de profundidad: cerrar la exterior, igualar, abrir la interior y purgar. Cuatro reglas y un solo orden posible. Solución explicada en el vídeo; el capítulo 2 de «Profundidad 600», en el canal. " + IA + " #shorts #acertijos #misterio",
        tiktok_title="Una esclusa a 600 metros bajo el mar y cuatro palancas: cerrar, igualar, abrir y purgar. Con cuatro reglas, solo hay un orden. ¿Cuál? Solución en el vídeo y el capítulo 2 de «Profundidad 600» en YouTube (ENIGMA 60). #acertijos #misterio #serie #enigma #retomental",
        facebook_title="¿En qué orden abres la esclusa?", facebook_description="Cuatro palancas y cuatro reglas: un solo orden posible. Solución en el vídeo; el capítulo 2 de «Profundidad 600», en YouTube (ENIGMA 60). " + IA + " #acertijos #misterio",
        tags=["acertijos", "misterio", "serie", "submarino", "shorts", "enigma 60", "profundidad 600"]),
    "E60ES-AC-20261129": dict(ficha="fichas/E60-2026-11-29-corto.json", programado="2026-11-29T18:00:00",
        titulo="El ascensor tardó 30 segundos: ¿en qué planta se paró? 🛗",
        youtube_title="El ascensor tardó 30 segundos: ¿en qué planta se paró? 🛗 #shorts #acertijos",
        youtube_description="Sale de la planta 1, tarda 8 s por planta, para una sola vez con las puertas abiertas 6 s y el viaje dura 30 s. El hotel tiene 3 plantas. ¿Dónde paró y dónde se quedó? 15 segundos y solución explicada. " + IA + " #shorts #acertijos #logica",
        tiktok_title="Un ascensor sale de la planta 1: 8 s por planta, una parada de 6 s y 30 s en total, en un hotel de 3 plantas. ¿Dónde paró y en qué planta se quedó? Solución explicada en el vídeo. #acertijos #logica #enigma #retomental",
        facebook_title="¿En qué planta se paró el ascensor?", facebook_description="8 s por planta, una parada de 6 s y 30 s en total. ¿Dónde se quedó? Solución en el vídeo. ENIGMA 60. " + IA + " #acertijos #logica",
        tags=["acertijos", "ascensor", "lógica", "shorts", "enigma 60"]),
}
LARGOS = {
    "E60ES-ER-004": dict(ficha="fichas/E60-ER-004.json", programado="2026-11-25T17:00:00", titulo="El castillo sin amanecer || Escape Room #4",
        gancho="Medianoche: la poterna se cierra a tu espalda y una vela se enciende sola. En este castillo no amanece desde hace cien años. Cinco puertas, una vela… y si se apaga antes de abrir la última, te quedas dentro hasta mañana.",
        puzles=["🪟 El rosetón: ocho vidrios en círculo y uno roto. ¿Qué número tenía?", "🔔 ¿Qué campana falta? Cuatro campanas, cuatro compases y un hueco en la partitura.", "🛡️ El escudo falso: cuatro escudos y la regla de los heraldos. ¿Cuál miente?", "⛓️ El puente levadizo: 120 kg, tu fuerza de 45 kg y 3,5 m de cuerda. ¿Qué aparejo de poleas usas?", "🌅 La puerta del amanecer: cuatro torres y tres palancas. ¿En qué orden?"],
        cierre="¿Te perdiste la sala anterior? Escape Room #3: El observatorio apagado, en el canal. Suscríbete y activa la campanita para entrar el primero en la siguiente.",
        tags=["escape room", "acertijos", "acertijos de lógica", "enigmas", "puzles", "castillo", "escape room virtual", "acertijos con respuesta", "enigma 60", "retos de lógica"],
        hashtags="#escaperoom #acertijos #logica #enigmas #enigma60"),
    "E60ES-S001-E02": dict(ficha="fichas/E60-S01-C02.json", programado="2026-11-28T17:00:00", titulo="El mamparo || Profundidad 600 #2",
        gancho="Tres golpes desde el otro lado de una puerta que lleva dieciocho años cerrada. La señal del Abisal vuelve a abrirse: sesenta minutos para cruzar el mamparo… y Damián está a punto de descubrir qué le pasó a su hermano.",
        puzles=["🎛️ Las cuatro cámaras: 4, 0, 10 y 0 bar. ¿Qué válvulas abres, y en qué orden, para dejar 3 bar en D?", "🔐 La taquilla de Iker: número primo, cifras que suman 4 y no la última. ¿Cuál es?", "🔋 Energía limitada: una batería de 10 y cinco consumos. ¿Cómo mueves la compuerta sin apagar la radio?", "📻 El mensaje de 2008: cuatro letras en Morse. ¿Qué dice?", "⚓ La esclusa de las dos mareas: cuatro palancas y cuatro reglas. ¿En qué orden?"],
        cierre="Capítulo 2 de «Profundidad 600», la serie de ENIGMA 60. ¿Te perdiste el capítulo 1, «La sala de lastre»? Está en el canal. Y si ves algo violeta… apúntalo con el de la semana pasada. Próximo capítulo: «El comedor». Suscríbete y activa la campanita para bajar el primero.",
        tags=["acertijos", "misterio", "serie de misterio", "submarino", "enigmas", "puzles", "retos de lógica", "enigma 60", "profundidad 600", "ciencia ficción"],
        hashtags="#acertijos #misterio #serie #enigmas #enigma60"),
}

def main():
    vid, enc, run, sha = sys.argv[1:5]
    caps = json.load(open(sys.argv[5])) if len(sys.argv) > 5 else []
    base = {"video_id": vid, "version": "v1", "canal": "ENIGMA_60", "perfil_upload_post": "enigama60", "encargo_master": enc, "run_id": int(run),
            "zona": "Europe/Madrid", "sha256": sha, "historial": [{"version": "v1", "motivo_cambio": "Producción nueva de la semana 23-29/11 (Claude)", "corrector": "Claude"}],
            "estado_aprobacion": "v1 entregada (22/11), pendiente de APROBAR"}
    if vid in CORTOS:
        c = dict(CORTOS[vid])
        d = {**base, "ficha": c.pop("ficha"), "composicion": "E60CortoSala", "formato": "TikTok / Reels / Shorts 9:16", "plataformas": ["tiktok", "youtube", "facebook"],
             "pendiente_conectar": ["instagram"], "portada": f"remotion/publicacion/{vid}_portada.jpg", "youtube": COMUN_YT,
             "tiktok": {"privacy_level": "PUBLIC_TO_EVERYONE", "is_aigc": True, "cover_timestamp_ms": 1000},
             "facebook": {"facebook_media_type": "REELS", "facebook_is_ai_generated": True}, **c}
    else:
        c = LARGOS[vid]
        cap_txt = "\n".join(f"{m}:{s:02d} {n}" for (m, s, n) in caps) if caps else ""
        desc = c["gancho"] + "\n\nLos 5 acertijos:\n" + "\n".join(c["puzles"]) + "\n\nTienes 20 segundos en cada puzle antes de la solución. Cuéntame en los comentarios cuántos resolviste sin mirar.\n\n" + (cap_txt + "\n\n" if cap_txt else "") + c["cierre"] + "\n\nContenido creado con ayuda de IA (voces sintéticas y escenas 3D generadas por ordenador).\n\n" + c["hashtags"]
        d = {**base, "ficha": c["ficha"], "composicion": "E60LargoSalas", "tramos": 10, "formato": "YouTube 16:9", "plataformas": ["youtube"], "programado": c["programado"],
             "miniatura": f"remotion/publicacion/{vid}_miniatura.jpg", "titulo": c["titulo"], "youtube_title": c["titulo"], "youtube_description": desc, "tags": c["tags"], "youtube": COMUN_YT}
    json.dump(d, open(f"publicacion/{vid}.json", "w"), ensure_ascii=False, indent=1)
    print("OK", vid)

if __name__ == "__main__":
    main()
