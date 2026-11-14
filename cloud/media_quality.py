#!/usr/bin/env python3
"""Independent *technical* audiovisual checks for MASK GROUP. No perceptual claims.

Uses ffmpeg/ffprobe on actual MP4. Thresholds conservative; flagged videos must
be held for manual review, not silently approved.
"""
import json
import re
import subprocess
import math
from pathlib import Path


def _run(args):
    p = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                       check=False, timeout=110)
    if p.returncode != 0:
        raise RuntimeError('FFMPEG_AUDIT_FAILURE:' + p.stderr.decode(errors='ignore')[-250:])
    return p.stdout, p.stderr.decode('utf8',errors='replace')


def _mean_volume(path, start=0, length=None):
    cmd=['ffmpeg','-hide_banner','-nostdin','-loglevel','info','-ss',str(max(0,float(start)))]
    if length is not None:
        cmd+=['-t',str(max(0.5,float(length)))]
    cmd+=['-i',str(path),'-vn','-af','volumedetect','-f','null','-']
    _,log=_run(cmd)
    vals=re.findall(r'mean_volume:\s*([-+\d.]+)\s*dB',log)
    return round(float(vals[-1]),1) if vals else None


def audit(path, cues=None):
    path=Path(path)
    cues=cues or []
    data,_=_run(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type',
                 '-of','json',str(path)])
    meta=json.loads(data)
    duration=float(meta.get('format',{}).get('duration') or 0)
    has_audio=any(s.get('codec_type')=='audio' for s in meta.get('streams',[]))
    details={'duracion_s':round(duration,2),'pista_audio':has_audio,
             'umbral_silencio_db':-42,'silencio_largo_max_s':0.0,
             'silencios_largos':[],'volumen_medio_dbfs':None,
             'cuenta_atras':None,'fraccion_pares_estaticos':None,
             'racha_estatica_max_s':None,'umbrales_solo_tecnicos':True}
    if has_audio and duration>0:
        _,log=_run(['ffmpeg','-hide_banner','-nostdin','-i',str(path),
                    '-vn','-af','silencedetect=noise=-42dB:d=2',
                    '-f','null','-'])
        starts=[float(v) for v in re.findall(r'silence_start:\s*([\d.]+)',log)]
        ends=[float(v) for v in re.findall(r'silence_end:\s*([\d.]+)',log)]
        gaps=[]
        for i,st in enumerate(starts):
            en=ends[i] if i<len(ends) else duration
            gaps.append({'inicio_s':round(st,1),'duracion_s':round(max(0,en-st),1)})
        details['silencios_largos']=gaps[:12]
        details['silencio_largo_max_s']=round(max([0]+[g['duracion_s'] for g in gaps]),1)
        details['volumen_medio_dbfs']=_mean_volume(path)
        intervals=[x for x in cues if x.get('name')=='countdown']
        if intervals:
            x=intervals[0]
            st=float(x.get('at',0));dur=float(x.get('length',8))
            inside=_mean_volume(path,st,dur)
            # Mean of first narrated seconds, without using normalization artifacts.
            spoken=_mean_volume(path,0,min(10,max(3,duration*0.2)))
            if inside is not None and spoken is not None:
                details['cuenta_atras']={'inicio_s':round(st,1),'duracion_s':round(dur,1),
                    'nivel_medio_dbfs':inside,'inicio_narrado_dbfs':spoken,
                    'caida_relativa_db':round(spoken-inside,1)}
    # Sample actual decoded frames at intervals of 2 s. A proxy for stillness only.
    if duration>2:
        width,height=80,140
        raw,_=_run(['ffmpeg','-hide_banner','-nostdin','-loglevel','error','-i',str(path),
                    '-vf',f'fps=1/2,scale={width}:{height}:flags=fast_bilinear,format=gray',
                    '-frames:v','120','-f','rawvideo','-'])
        size=width*height
        n=len(raw)//size
        if n>=3:
            frames=[raw[i*size:(i+1)*size] for i in range(n)]
            # Subsampling each 8th pixel to keep the audit cheap.
            values=[]
            for a,b in zip(frames,frames[1:]):
                diff=sum(abs(x-y) for x,y in zip(a[::8],b[::8]))/(len(a[::8])*255)
                values.append(diff)
            low=[v<0.008 for v in values]
            run=big=0
            for stat in low:
                run=run+1 if stat else 0;big=max(run,big)
            details['fraccion_pares_estaticos']=round(sum(low)/len(low),3)
            details['racha_estatica_max_s']=int(big*2)
    checks={'pista_audio':has_audio,
            'sin_silencio_prolongado':has_audio and details['silencio_largo_max_s']<=2.5,
            'dinamismo_basico':details['racha_estatica_max_s'] is not None and details['racha_estatica_max_s']<=10,
            'variacion_visual_minima':details['fraccion_pares_estaticos'] is not None and details['fraccion_pares_estaticos']<=0.55}
    if details['cuenta_atras']:
        checks['cuenta_atras_audible']=details['cuenta_atras']['caida_relativa_db']<=16
    return {'mediciones':details,'comprobaciones':checks,
            'apto_tecnicamente':all(checks.values()),
            'advertencia':'No evalua gusto, coherencia semantica ni legibilidad real de pistas. Requiere visionado humano.'}


if __name__=='__main__':
    import sys
    cues=[{'name':'countdown','at':28.8,'length':8}]
    print(json.dumps(audit(sys.argv[1],cues),ensure_ascii=False,indent=2))
