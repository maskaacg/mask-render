import base64,hashlib,json,os,pathlib,re,subprocess,textwrap
from PIL import Image,ImageDraw,ImageFont
def cmd(*args):
 subprocess.run(list(args),check=True,stdout=subprocess.DEVNULL)
def duration(p):
 return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(p)],text=True))
d=json.loads(base64.b64decode(os.environ["ENCARGO_B64"],validate=True))
id=os.environ["ENCARGO_ID"]
if d.get("id")!=id or not re.fullmatch("[A-Z0-9][A-Z0-9_-]{2,80}",id):raise ValueError("ENCARGO_ID_INVALIDO")
es=d.get("escenas")
if not isinstance(es,list) or not 1<=len(es)<=40:raise ValueError("ESCENAS_INVALIDAS")
vertical=d.get("formato") not in ("largo","horizontal","16:9")
w,h=(1080,1920) if vertical else (1920,1080)
out=pathlib.Path("out");out.mkdir(exist_ok=True)
font="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
face=ImageFont.truetype(font,44)
large=ImageFont.truetype(font,65)
files=[]
for i,e in enumerate(es):
 if not isinstance(e,dict):raise ValueError("ESCENA_INVALIDA")
 txt=str(e.get("texto") or e.get("puzle") or e.get("narracion") or "").strip()
 voice=str(e.get("narracion") or txt).strip()
 if not txt or len(txt)>1000 or not voice or len(voice)>1400:raise ValueError("ESCENA_SIN_CONTENIDO_"+str(i))
 name=f"scene_{i:03}"
 img=Image.new("RGB",(w,h),(12,24,42))
 asset=e.get("imagen_path")
 if asset:
  p=pathlib.Path("assets")/str(asset)
  if ".." in p.parts or not p.is_file():raise ValueError("ASSET_INVALIDO")
  src=Image.open(p).convert("RGB")
  ratio=max(w/src.width,h/src.height)
  src=src.resize((int(src.width*ratio)+1,int(src.height*ratio)+1))
  img=src.crop(((src.width-w)//2,(src.height-h)//2,(src.width+w)//2,(src.height+h)//2))
 draw=ImageDraw.Draw(img)
 draw.rounded_rectangle((45,int(h*.12),w-45,int(h*.88)),radius=40,fill=(15,23,42),outline="#52658b",width=3)
 draw.text((90,int(h*.17)),str(d.get("titulo") or "ENIGMA 60")[:50],font=large,fill="#ffffff")
 y=int(h*.29)
 for line in textwrap.wrap(txt,width=34 if vertical else 54,break_long_words=False):
  if y>h*.84:raise ValueError("TEXTO_LARGO")
  draw.text((90,y),line,font=face,fill="#e0e7ff")
  y+=68
 png=out/(name+".png");img.save(png)
 audio_path=e.get("audio_path")
 if audio_path:
  audio=pathlib.Path("assets")/str(audio_path)
  if ".." in audio.parts or not audio.is_file():raise ValueError("AUDIO_INVALIDO")
 else:
  audio=out/(name+".wav")
  cmd("espeak-ng","-v","es" if d.get("idioma","es")=="es" else "en","-s","145","-w",str(audio),voice)
 sec=min(90,max(4,duration(audio)+1))
 part=out/(name+".mp4")
 cmd("ffmpeg","-y","-loglevel","error","-loop","1","-framerate","30","-i",str(png),"-i",str(audio),"-t",str(sec),"-vf",f"scale={w}:{h},format=yuv420p","-r","30","-c:v","libx264","-preset","veryfast","-crf","22","-c:a","aac","-af","apad","-ar","48000","-ac","2",str(part))
 files.append(part)
listfile=out/"list.txt"
listfile.write_text("".join("file '"+p.name+"'\n" for p in files))
mp4=out/(id+".mp4")
cmd("ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",str(listfile),"-c","copy","-movflags","+faststart",str(mp4))
sec=duration(mp4);length=mp4.stat().st_size
if sec<3 or length<5000 or length>250000000:raise ValueError("QA_TECNICA_INVALIDA")
sha=hashlib.sha256(mp4.read_bytes()).hexdigest()
qa={"veredicto":"PASS","tipo_control":"TECNICO","sha256":sha,"duracion_s":round(sec,2),"titulo":str(d.get("titulo") or id),"descripcion":str(d.get("descripcion") or ""),"hashtags":d.get("hashtags") or [],"fuentes_licencias":"Revisar permisos de recursos usados","riesgos":"Revisión creativa y derechos pendiente","fallos":[]}
(out/(id+".qa.json")).write_text(json.dumps(qa,ensure_ascii=False))
print(json.dumps({"id":id,"sha256":sha,"duracion_s":sec}))
