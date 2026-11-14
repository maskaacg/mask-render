"""MASK GROUP / ENIGMA 60 · animación física 2D y subtítulos seguros.

Módulo sin APIs, sin red y sin dependencias comerciales; utiliza Pillow.
Claude genera especificaciones JSON limitadas, NUNCA Python ejecutable arbitrario.
Estado: probado como módulo experimental; activar en motor principal solo tras QA.
"""
from __future__ import annotations
from dataclasses import dataclass
from math import cos, pi, sin
from typing import Any
from PIL import Image, ImageDraw, ImageFont, ImageFilter

CANVAS=(720,1280)
SAFE_BOX=(42,175,678,1110)  # margen móvil; confirmar con UI TikTok al publicar
ACTION_TYPES=frozenset({'door_close','door_open','gear_spin','symbol_insert',
                        'symbol_reject','light_pulse','card_reveal','counter_tick','caption'})


def ease(t:float)->float:
    t=max(0.,min(1.,float(t)))
    return t*t*(3.-2.*t)


def progress(t:float,start:float,end:float)->float:
    if end <= start: raise ValueError('intervalo de animación inválido')
    return ease((t-start)/(end-start))


def _font(size:int,bold:bool=True):
    paths=['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
           '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
    for p in (paths if bold else paths[::-1]):
        try:return ImageFont.truetype(p,size)
        except OSError:pass
    return ImageFont.load_default()


def _wrapped(draw:ImageDraw.ImageDraw,text:str,font:ImageFont.FreeTypeFont,max_width:int)->list[str]:
    result=[]
    for raw in str(text).split('\n'):
        if not raw.strip(): continue
        line=''
        for word in raw.split():
            trial=f'{line} {word}'.strip()
            if draw.textbbox((0,0),trial,font=font)[2] <= max_width:
                line=trial
                continue
            if line:
                result.append(line)
                line=''
            if draw.textbbox((0,0),word,font=font)[2]<=max_width:
                line=word
                continue
            # split long unbroken identifiers rather than overflowing.
            for ch in word:
                trial=line+ch
                if line and draw.textbbox((0,0),trial,font=font)[2] > max_width:
                    result.append(line)
                    line=ch
                else: line=trial
        if line:result.append(line)
    return result


@dataclass(frozen=True)
class CaptionLayout:
    lines:list[str]
    font_size:int
    line_height:int
    bounds:tuple[int,int,int,int]


def caption_layout(text:str,bounds:tuple[int,int,int,int], min_font:int=22,
                   max_font:int=40, padding:int=18)->CaptionLayout:
    x0,y0,x1,y1=map(int,bounds)
    W,H=CANVAS
    if not (0<=x0<x1<=W and 0<=y0<y1<=H):raise ValueError('recuadro fuera del vídeo')
    usable_w=x1-x0-2*padding
    usable_h=y1-y0-2*padding
    if usable_w<50 or usable_h<30:raise ValueError('recuadro pequeño')
    d=ImageDraw.Draw(Image.new('RGB',(1,1)))
    for size in range(max_font,min_font-1,-1):
        f=_font(size)
        lines=_wrapped(d,text,f,usable_w)
        lh=int(size*1.30)
        if len(lines)*lh<=usable_h and all(d.textbbox((0,0),l,font=f)[2]<=usable_w for l in lines):
            return CaptionLayout(lines,size,lh,bounds)
    raise ValueError('SUBTITULOS_DESBORDADOS: dividir el texto o agrandar el recuadro')


def draw_caption(frame:Image.Image, text:str, bounds:tuple[int,int,int,int]=(48,1050,672,1190),
                 min_font:int=22,max_font:int=38)->CaptionLayout:
    lay=caption_layout(text,bounds,min_font,max_font)
    d=ImageDraw.Draw(frame,'RGBA')
    d.rounded_rectangle(bounds,radius=20,fill=(4,17,24,236),outline=(220,181,112,225),width=3)
    x0,y0,x1,y1=bounds
    y=y0+(y1-y0-len(lay.lines)*lay.line_height)//2
    f=_font(lay.font_size)
    for line in lay.lines:
        bb=d.textbbox((0,0),line,font=f)
        width=bb[2]-bb[0]
        x=x0+max(0,(x1-x0-width)//2)
        d.text((x,y),line,font=f,fill=(244,238,220,255),stroke_width=1,stroke_fill=(4,8,10,255))
        y+=lay.line_height
    return lay


def door_panel(frame:Image.Image,t:float,hinge=(160,362),height=620,width=378,
               direction:str='close',start:float=0,end:float=1.35)->float:
    """Pinta una puerta animada en perspectiva 2D sobre la imagen.
    Retorna el progreso físico de cierre/apertura (0..1). No desplaza el fondo.
    """
    u=progress(t,start,end)
    if direction not in ('close','open'):raise ValueError('dirección de puerta')
    a=u if direction=='close' else 1-u
    # Se abre en escorzo y se ensancha al cerrar; la manilla se desplaza físicamente.
    visible_width=round(width*(.14+.86*a))
    hx,hy=hinge
    if visible_width < 1: return u
    shadow=Image.new('RGBA',frame.size,(0,0,0,0))
    sh=ImageDraw.Draw(shadow,'RGBA')
    sh.polygon([(hx+16,hy+10),(hx+visible_width+42,hy+40),
                (hx+visible_width+42,hy+height+29),(hx+16,hy+height+12)],fill=(0,0,0,153))
    frame.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(14))) if frame.mode=='RGBA' else frame.paste(Image.alpha_composite(frame.convert('RGBA'),shadow.filter(ImageFilter.GaussianBlur(14))).convert('RGB'))
    d=ImageDraw.Draw(frame,'RGBA')
    trapezoid=[(hx,hy),(hx+visible_width,hy+int((1-a)*50)),
               (hx+visible_width,hy+height-int((1-a)*50)),(hx,hy+height)]
    d.polygon(trapezoid,fill=(30,51,48,255))
    d.line(trapezoid+[trapezoid[0]],fill=(212,171,96,245),width=7)
    for v in (.22,.48,.74):
        xx=hx+int(visible_width*v)
        d.line((xx,hy+65,xx,hy+height-65),fill=(107,91,64,110),width=5)
    cx=hx+max(12,int(visible_width*.82));cy=hy+height//2
    d.ellipse((cx-10,cy-10,cx+10,cy+10),fill=(235,190,100,255))
    return u


def validate_animation_spec(spec:dict[str,Any])->list[str]:
    if not isinstance(spec,dict): raise ValueError('escena no es objeto')
    movements=spec.get('movimientos')
    if not isinstance(movements,list) or len(movements)<2:
        raise ValueError('FALTAN_MOVIMIENTOS_INDEPENDIENTES')
    ids=set()
    for m in movements:
        if not isinstance(m,dict):raise ValueError('movimiento no es objeto')
        typ=m.get('tipo')
        if typ not in ACTION_TYPES:raise ValueError(f'ACCION_NO_PERMITIDA:{typ}')
        obj=str(m.get('objeto','')).strip()
        if not obj:raise ValueError('OBJETO_SIN_NOMBRE')
        ids.add(obj)
        st=float(m.get('inicio',-1)); en=float(m.get('fin',-1))
        if not(0<=st<en<=600):raise ValueError('DURACION_ANIMACION_INVALIDA')
        if m.get('codigo') or m.get('script') or m.get('eval'):
            raise ValueError('CODIGO_ARBITRARIO_PROHIBIDO')
    if len(ids)<2:raise ValueError('DOS_MOVIMIENTOS_DEL_MISMO_OBJETO')
    caption=spec.get('subtitulo',{})
    if caption:
        if not isinstance(caption,dict):raise ValueError('subtitulo inválido')
        caption_layout(str(caption.get('texto','')),tuple(caption.get('recuadro',(48,1050,672,1190))))
    return sorted(ids)
