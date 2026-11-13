#!/usr/bin/env python3
"""MASK GROUP: motor de vídeo económico. Solo assets locales, Piper, Pillow y FFmpeg."""
import base64,hashlib,json,math,os,pathlib,random,re,subprocess,sys,textwrap,unicodedata
from PIL import Image,ImageDraw,ImageFont
from visuals import paint
from soundscape import create as create_soundscape

BASE=pathlib.Path(__file__).resolve().parents[1]
OUT=BASE/"out";OUT.mkdir(exist_ok=True)
ASSETS=BASE/"assets"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
THEMES={
 "ENIGMA_60":("#101724","#d9b56e","#9bcfc5","ENIGMA 60"),
 "DRAMIA":("#241420","#efa6b7","#f6d08f","DRAMIA"),
 "ENTRE_NOS":("#1b1e2b","#dcb77b","#b4aaff","ENTRE NOS"),
 "INSOLITO":("#102b2c","#82d8c2","#d5e0ff","INSÓLITO"),
 "ELIGE":("#192b20","#bade84","#f1c87e","ELIGE"),
 "PIXEL_LIFE":("#14261b","#c0e98f","#e3c092","PIXEL LIFE"),
 "ARCHIVOS_13":("#242020","#e7d3a2","#ef9e9e","ARCHIVOS 13"),
 "MINI_MUNDO":("#132639","#a3d9f2","#fbd191","MINI MUNDO")
}
ALIASES={"ENIGMA60":"ENIGMA_60","ARCHIVOS13":"ARCHIVOS_13","PIXELLIFE":"PIXEL_LIFE","MINIMUNDO":"MINI_MUNDO","ENTRENOS":"ENTRE_NOS"}
def run(a):
 p=subprocess.run(a,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 return p.stdout.decode("utf-8","replace").strip()
def seconds(path):
 return float(run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)]))
def font(n=38,bold=False):
 return ImageFont.truetype(BOLD if bold else FONT,n)
def asset(s):
 name=pathlib.PurePosixPath(str(s))
 if name.is_absolute() or ".." in name.parts or str(name).startswith("."):raise ValueError("ASSET_RUTA_INVALIDA")
 p=(ASSETS/name).resolve()
 if not p.is_relative_to(ASSETS.resolve()) or not p.is_file():raise ValueError("ASSET_AUSENTE")
 return p
def norm(s):
 s=unicodedata.normalize("NFKD",str(s).upper())
 return "".join(c for c in s if not unicodedata.combining(c)).replace("-","_").replace(" ","_")
def draw_screen(job,scene,n,phase,shown,w,h,theme,timer=None,frame=None):
 dark,gold,accent,brand=theme
 out=OUT/f"img_{n:03}_{phase}{'_'+str(timer) if timer is not None else ''}{'_f'+str(frame).zfill(2) if frame is not None else ''}.png"
 local=scene.get("imagen_path") or scene.get("imagen_local")
 if local:
  with Image.open(asset(local)) as raw:
   raw=raw.convert("RGB");sc=max(w/raw.width,h/raw.height)
   raw=raw.resize((math.ceil(raw.width*sc),math.ceil(raw.height*sc)),Image.Resampling.LANCZOS)
   bg=raw.crop(((raw.width-w)//2,(raw.height-h)//2,(raw.width+w)//2,(raw.height+h)//2))
 else:
  bg=Image.new("RGB",(w,h),dark);d=ImageDraw.Draw(bg)
  rng=random.Random(n*43+len(phase))
  for k in range(5):
   inset=int((k+1)*min(w,h)/17)
   d.rounded_rectangle((inset,inset,w-inset,h-inset),radius=22,outline=accent,width=2)
  if brand=="ENIGMA 60":
   d.polygon([(0,h),(w*.3,h*.55),(w*.7,h*.55),(w,h)],fill="#1c3040")
   d.arc((w*.31,h*.24,w*.69,h*.80),0,359,fill=gold,width=5)
  elif brand in ("PIXEL LIFE","ELIGE"):
   for _ in range(90):
    x=rng.randrange(w//25)*25;y=rng.randrange(h//25)*25
    d.rectangle((x,y,x+10,y+10),fill=accent)
 if scene.get("visual"):
  bg=paint(bg,str(scene.get("visual")),frame or 0,10,phase)
 d=ImageDraw.Draw(bg,"RGBA")
 if scene.get("color_extra"):
  colors=["#e87bb0","#7cddf1","#8bdf91","#ffc769"]
  for k in range(12):
   angle=2*math.pi*k/12+0.22*(frame or 0)
   px=w*.5+w*.34*math.cos(angle)
   py=h*.38+h*.16*math.sin(angle)
   d.ellipse((int(px-6),int(py-6),int(px+6),int(py+6)),fill=colors[k%4])
 if scene.get("subtitulo_discreto") and phase=="scene":
  left=int(w*.07);y=int(h*.86)
  short=str(shown).replace("\n"," ")[:90]
  lines=textwrap.wrap(short,width=42 if w>h else 28)[:2]
  d.rounded_rectangle((left-10,y-14,w-left+10,min(h-12,y+78)),radius=15,fill=(5,11,21,175))
  for k,ln in enumerate(lines):
   d.text((left,y+k*32),ln,font=font(23,True),fill="#f7f8fb")
  bg.save(out)
  return out
 x=int(w*.07);top=int(h*(.26 if h>w else .23));bot=int(h*(.77 if h>w else .83))
 if scene.get("visual"):
  top=int(h*(.64 if h>w else .58));bot=int(h*(.90 if h>w else .92))
 if scene.get("tarjeta_compacta") and phase=="puzzle":
  top=int(h*(.70 if h>w else .59));bot=int(h*(.93 if h>w else .91))
 if scene.get("tarjeta_compacta") and phase=="countdown":
  top=int(h*(.56 if h>w else .57));bot=int(h*(.82 if h>w else .81))
 d.rounded_rectangle((x-15,top,w-x+15,bot),radius=25,fill=(8,14,27,228),outline=gold,width=3)
 d.text((x,int(h*.10)),brand,font=font(28,True),fill=gold)
 title=str(job.get("titulo") or brand)[:46]
 d.text((x,int(h*.16)),title,font=font(30,True),fill="#f1f4fa")
 max_width=w-2*x-25;max_height=bot-top-70
 ok=None
 for sz in range(40,23,-2):
  f=font(sz,phase=="answer");lines=[]
  for p in str(shown)[:1800].splitlines():
   words=p.split();line=""
   for word in words:
    candidate=(line+" "+word).strip()
    if d.textbbox((0,0),candidate,font=f)[2] > max_width:
     if line:lines.append(line)
     line=word
    else:line=candidate
   if line:lines.append(line)
  if len(lines)*int(sz*1.43)<=max_height:
   ok=(f,lines,int(sz*1.43));break
 if not ok:raise ValueError("TEXTO_MUY_LARGO_EN_PANTALLA")
 f,lines,step=ok;y=top+32
 for line in lines:d.text((x+5,y),line,font=f,fill="#f6f8fc");y+=step
 if phase=="answer":
  d.text((x,int(h*.86)),"SOLUCIÓN EXPLICADA",font=font(23,True),fill=gold)
 if timer is not None:
  total=int(scene.get("pensar",12))
  d.rounded_rectangle((x,int(h*.84),w-x,int(h*.855)),radius=6,fill="#394656")
  d.rounded_rectangle((x,int(h*.84),x+max(7,int((w-2*x)*timer/total)),int(h*.855)),radius=6,fill=gold)
  d.text((x,int(h*.87)),str(timer)+" s",font=font(34,True),fill=gold)
 d.text((x,int(h*.95)),f"MASK GROUP • {n+1}/{len(job['escenas'])}",font=font(17),fill="#b1bfd0")
 bg.save(out)
 return out
def render_screen(job,scene,n,phase,shown,w,h,theme):
 if scene.get("visual"):
  for k in range(10): draw_screen(job,scene,n,phase,shown,w,h,theme,frame=k)
  return OUT/f"img_{n:03}_{phase}_f%02d.png"
 return draw_screen(job,scene,n,phase,shown,w,h,theme)

def voice(text,scene,n,kind,language):
 path=scene.get("audio_respuesta_path") if kind=="answer" else scene.get("audio_path")
 if path:return asset(path)
 out=OUT/f"voz_{n:03}_{kind}.wav"
 model=BASE/"models"/"es_ES-davefx-medium.onnx"
 if language=="es" and model.is_file():
  proc=subprocess.run([sys.executable,"-m","piper","--model",str(model),"--output_file",str(out)],input=str(text).encode("utf-8"),stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  if proc.returncode!=0:raise RuntimeError("PIPER_FALLO: "+proc.stderr.decode("utf-8","replace")[:300])
 else:
  run(["espeak-ng","-v","es" if language=="es" else "en","-s","145","-w",str(out),str(text)])
 return out
def clip(img,audio,duration,out,w,h):
 sources=["ffmpeg","-hide_banner","-loglevel","error","-y"]
 if "%02d" in str(img):sources+=["-stream_loop","-1","-framerate","5","-i",str(img)]
 else:sources+=["-loop","1","-framerate","24","-i",str(img)]
 sources+=["-i",str(audio)] if audio else ["-f","lavfi","-i","anullsrc=channel_layout=mono:sample_rate=48000"]
 visual=f"zoompan=z='min(zoom+0.000035,1.04)':d=1:s={w}x{h}:fps=24,fade=t=in:st=0:d=0.2,fade=t=out:st={max(0.1,duration-0.3):.3f}:d=0.25,format=yuv420p"
 if "%02d" in str(img):visual=f"fps=24,fade=t=in:st=0:d=0.2,fade=t=out:st={max(0.1,duration-0.3):.3f}:d=0.25,format=yuv420p"
 run(sources+["-t",str(duration),"-vf",visual,"-r","24","-c:v","libx264","-preset","veryfast","-crf","23","-pix_fmt","yuv420p","-c:a","aac","-ar","48000","-ac","2","-af","apad","-shortest",str(out)])
 return out
def countdown(images,out,w,h,length):
 manifest=OUT/(out.stem+"_frames.txt")
 lines=[]
 for p in images:lines+=["file '"+p.name+"'","duration 1"]
 lines+=["file '"+images[-1].name+"'"]
 manifest.write_text("\n".join(lines)+"\n")
 run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",str(manifest),"-f","lavfi","-i","anullsrc=channel_layout=mono:sample_rate=48000","-t",str(length),"-vf",f"fps=24,scale={w}:{h},format=yuv420p","-c:v","libx264","-preset","veryfast","-crf","23","-c:a","aac","-ar","48000","-ac","2","-shortest",str(out)])
 return out
def main():
 job=json.loads(base64.b64decode(os.environ["ENCARGO_B64"],validate=True))
 eid=os.environ["ENCARGO_ID"]
 if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{2,80}",eid) or job.get("id")!=eid:raise ValueError("ID_INVALIDO")
 # El render para revision NO equivale a autorizar el guion para publicacion.
 if job.get("aprobado") is not True:
  if job.get("modo_entrega")!="BORRADOR_REVISION_TELEGRAM" or job.get("autorizado_publicar") is not False or job.get("marca")!="ENIGMA_60":
   raise ValueError("SOLO_BORRADOR_INTERNO_AUTORIZADO_PARA_RENDER")

 if os.getenv("ALLOW_PAID_APIS","0")!="0":raise ValueError("NO_PERMITIDO_USAR_API_PAGADA")
 channel=ALIASES.get(norm(job.get("marca") or job.get("canal","")),norm(job.get("marca") or job.get("canal","")))
 if channel not in THEMES:raise ValueError("CANAL_NO_SOPORTADO")
 lang=job.get("idioma","es")
 if lang not in ("es","en"):raise ValueError("IDIOMA_NO_SOPORTADO")
 scenes=job.get("escenas")
 if not isinstance(scenes,list) or not 1<=len(scenes)<=60:raise ValueError("ESCENAS_INVALIDAS")
 fmt=str(job.get("orientacion") or job.get("formato") or "").lower()
 wide=fmt in ("horizontal","16:9","largo","landscape")
 w,h=(1280,720) if wide else (720,1280)
 parts=[];estimated=0;puzzles=0
 for i,s in enumerate(scenes):
  if not isinstance(s,dict):raise ValueError("ESCENA_NO_OBJETO")
  typ=norm(s.get("tipo","narracion"))
  if typ in ("PUZLE","PUZZLE","ACERTIJO","RETO"):
   puzzles+=1
   question=str(s.get("pantalla") or s.get("enunciado") or "").strip()
   spoken=str(s.get("enunciado") or question)
   answer=str(s.get("respuesta") or "").strip();why=str(s.get("explicacion") or "").strip()
   if not question or not answer or not why:raise ValueError("PUZLE_INCOMPLETO")
   audio=voice(spoken,s,i,"question",lang);sec=max(3.5,seconds(audio)+.7)
   img=render_screen(job,s,i,"puzzle",question,w,h,THEMES[channel])
   parts.append(clip(img,audio,sec,OUT/f"{i:03}_question.mp4",w,h));estimated+=sec
   delay=int(s.get("pensar",12))
   if not 3<=delay<=30:raise ValueError("CUENTA_ATRAS_INVALIDA")
   images=[draw_screen(job,s,i,"countdown",question,w,h,THEMES[channel],j) for j in range(delay,0,-1)]
   parts.append(countdown(images,OUT/f"{i:03}_countdown.mp4",w,h,delay));estimated+=delay
   audio=voice(answer+". "+why,s,i,"answer",lang);sec=max(3.5,seconds(audio)+.7)
   img=render_screen(job,s,i,"answer",answer+"\n\n"+why,w,h,THEMES[channel])
   parts.append(clip(img,audio,sec,OUT/f"{i:03}_answer.mp4",w,h));estimated+=sec
  else:
   shown=str(s.get("pantalla") or s.get("texto") or s.get("narracion") or "").strip()
   narration=str(s.get("texto") or s.get("narracion") or shown).strip()
   if not shown or not narration:raise ValueError("ESCENA_INCOMPLETA")
   audio=voice(narration,s,i,"scene",lang);sec=max(3.5,seconds(audio)+.7)
   img=render_screen(job,s,i,"scene",shown,w,h,THEMES[channel])
   parts.append(clip(img,audio,sec,OUT/f"{i:03}_scene.mp4",w,h));estimated+=sec
  if estimated>int(os.getenv("MAX_RENDER_SECONDS","1800")):raise ValueError("VIDEO_SUPERA_LIMITE_DURACION")
 requisitos=job.get("correcciones_requeridas") or []
 if not isinstance(requisitos,list):raise ValueError("REQUISITOS_INVALIDOS")
 investigacion=job.get("investigacion") or {}
 if investigacion.get("solicitada") and not (investigacion.get("verificada") is True and len(investigacion.get("fuentes") or [])>=2):
  raise ValueError("INVESTIGACION_NO_VERIFICADA_NO_RENDERIZAR")
 controles={}
 for requisito in requisitos:
  if requisito=="musica_y_efectos":
   controles[requisito]=bool(job.get("audio_ambiente_original"))
  elif requisito=="animacion_original":
   controles[requisito]=all(bool(s.get("visual")) for s in scenes)
  elif requisito=="texto_compacto":
   controles[requisito]=any(bool(s.get("tarjeta_compacta")) for s in scenes) and all(bool(s.get("tarjeta_compacta")) for s in scenes if norm(s.get("tipo","")) in ("PUZLE","PUZZLE","ACERTIJO","RETO"))
  elif requisito=="subtitulos_discretos":
   controles[requisito]=all(bool(s.get("subtitulo_discreto")) for s in scenes if norm(s.get("tipo","")) not in ("PUZLE","PUZZLE","ACERTIJO","RETO"))
  else:raise ValueError("REQUISITO_NO_SOPORTADO:"+str(requisito))
 if not all(controles.values()):raise ValueError("CORRECCION_TECNICA_NO_APLICADA:"+",".join(k for k,v in controles.items() if not v))
 manifest=OUT/"concat.txt"
 manifest.write_text("".join("file '"+p.name+"'\n" for p in parts))
 movie=OUT/(eid+".mp4")
 run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",str(manifest),"-c","copy","-movflags","+faststart",str(movie)])
 if job.get("audio_ambiente_original"):
  soundtrack=OUT/(eid+"_original.wav")
  create_soundscape(soundtrack)
  tmp=OUT/(eid+"_audio_mix.mp4")
  dur=seconds(movie)
  fc="[0:a]volume=1.32,acompressor=threshold=0.09:ratio=2:attack=12:release=120[voz];[1:a]volume=0.27[mus];[voz][mus]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]"
  run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(movie),"-stream_loop","-1","-i",str(soundtrack),
       "-filter_complex",fc,"-map","0:v:0","-map","[a]","-c:v","copy","-c:a","aac","-b:a","160k",
       "-movflags","+faststart","-t",str(dur),str(tmp)])
  os.replace(tmp,movie)
 real=seconds(movie);size=movie.stat().st_size
 if real<2 or size<6000 or size>350000000:raise ValueError("VIDEO_FALLA_QA_TECNICA")
 sha=hashlib.sha256(movie.read_bytes()).hexdigest()
 qa={"veredicto":"PASS","tipo_control":"SOLO_TECNICO","sha256":sha,"duracion_s":round(real,2),"resolucion":f"{w}x{h}","tamano_bytes":size,"escenas":len(scenes),"puzles":puzzles,"canal":channel,"idioma":lang,
     "titulo":job.get("titulo") or eid,"descripcion":job.get("descripcion") or "Pendiente revisión editorial","hashtags":job.get("hashtags") or [],
     "fuentes_licencias":"Assets locales/procedurales; revisar derechos","riesgos":"Revisión editorial y de soluciones pendiente","aprobacion_publicacion":False,"revision_humana_pendiente":True,
     "motor":"MASK_ENGINE_V3_ILLUSTRATIONS_ORIGINAL_AUDIO","audio_original":bool(job.get("audio_ambiente_original")),"fallos":[]}
 qa["control_correcciones"]={"requisitos":controles,"tecnicamente_aplicados":all(controles.values()),"solicitud":(job.get("correccion") or {}).get("solicitud"),"solo_tecnico":True}
 (OUT/(eid+".qa.json")).write_text(json.dumps(qa,ensure_ascii=False,indent=2))
 print(json.dumps({"video":str(movie),"sha256":sha,"duracion_s":real}))
if __name__=="__main__":
 try:main()
 except Exception as e:
  print("MASK_RENDER_ERROR: "+str(e),file=sys.stderr);sys.exit(1)
