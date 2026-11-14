#!/usr/bin/env python3
"""A/B voces españolas de ENIGMA 60, sin API de pago.

No instala dependencias ni descarga pesos por sorpresa: solo se ejecuta cuando
se invoca explícitamente. Los modelos requieren conexión para primera descarga.
Kokoro: Apache 2.0  /  PocketTTS: CC BY 4.0 (términos Hugging Face).
No usar grabaciones de otra persona para clonar su voz.
"""
from __future__ import annotations
import argparse
import json
import subprocess
from pathlib import Path
import wave

TEXT = ('La puerta está cerrada. El reloj sigue funcionando, pero el péndulo se ha detenido. '
        'En la mesa hay tres símbolos. ¿Cuál investigarías primero?')

def sample_info(path:Path):
    try:
        import soundfile as sf
        import numpy as np
        x,sr=sf.read(str(path))
        return {'duracion_s':round(len(x)/sr,3),'frecuencia_hz':sr,
                'pico':round(float(np.abs(x).max()),4),'rms':round(float(np.sqrt(np.mean(x*x))),4)}
    except Exception:
        try:
            with wave.open(str(path)) as wav:
                return {'duracion_s':round(wav.getnframes()/wav.getframerate(),3),
                        'frecuencia_hz':wav.getframerate()}
        except Exception as exc:return {'error':str(exc)[:180]}

def kokoro(path:Path,voice:str,speed:float):
    try:
        from kokoro import KPipeline
        import numpy as np
        import soundfile as sf
    except ImportError:
        raise SystemExit('Falta kokoro; entorno aislado: pip install "kokoro>=0.9.2" soundfile. En Linux requiere espeak-ng.')
    pipe=KPipeline(lang_code='e')
    chunks=[]
    for _,_,x in pipe(TEXT,voice=voice,speed=speed):
        chunks.append(np.asarray(x,dtype='float32'))
    if not chunks:raise RuntimeError('Kokoro no generó audio')
    sr=24000
    samples=np.concatenate([v for chunk in chunks for v in [chunk,np.zeros(int(sr*.10),dtype='float32')]])
    sf.write(str(path),samples,sr)

def pocket(path:Path):
    cmd=['pocket-tts','generate','--language','spanish','--voice','lola',
         '--text',TEXT,'--output-path',str(path),'--device','cpu']
    try:subprocess.run(cmd,check=True,timeout=180)
    except FileNotFoundError:
        raise SystemExit('Falta PocketTTS. En un entorno aislado: pip install pocket-tts. Puede requerir aceptar términos del modelo en Hugging Face.')

if __name__=='__main__':
    a=argparse.ArgumentParser(description='Genera comparaciones A/B locales de narración original ENIGMA 60')
    a.add_argument('motor',choices=['kokoro_dora','kokoro_alex','pocket_lola'])
    a.add_argument('--salida',default='.')
    a.add_argument('--solo-plan',action='store_true',help='Validar sin ejecutar ni descargar pesos')
    args=a.parse_args()
    out=Path(args.salida);out.mkdir(parents=True,exist_ok=True)
    path=out/('E60_VOZ_'+args.motor+'.wav')
    if args.solo_plan:
        print(json.dumps({'estado':'PENDIENTE_NO_EJECUTADO','motor':args.motor,
                          'texto':TEXT,'salida':str(path)},ensure_ascii=False,indent=2))
        raise SystemExit(0)
    if args.motor=='pocket_lola':pocket(path)
    else:kokoro(path,voice='ef_dora' if args.motor=='kokoro_dora' else 'em_alex',speed=.96)
    manifest={'estado':'AUDIO_GENERADO_SIN_APROBAR','modelo':args.motor,'texto':TEXT,
              'archivo':str(path),'metadatos':sample_info(path),'revisar_licencias':True}
    (out/('E60_VOZ_'+args.motor+'.json')).write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
    print(json.dumps(manifest,indent=2,ensure_ascii=False))
