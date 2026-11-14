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
                   max_font:int=40, padding:int=18, canvas:tuple[int,int]=CANVAS)->CaptionLayout:
    x0,y0,x1,y1=map(int,bounds)
    W,H=canvas
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
    lay=caption_layout(text,bounds,min_font,max_font,canvas=frame.size)
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
        if typ != "caption": ids.add(obj)
        st=float(m.get('inicio',-1)); en=float(m.get('fin',-1))
        if not(0<=st<en<=600):raise ValueError('DURACION_ANIMACION_INVALIDA')
        if m.get('codigo') or m.get('script') or m.get('eval'):
            raise ValueError('CODIGO_ARBITRARIO_PROHIBIDO')
    if len(ids)<2:raise ValueError('DOS_MOVIMIENTOS_DEL_MISMO_OBJETO')
    caption=spec.get('subtitulo',{})
    if caption:
        if not isinstance(caption,dict):raise ValueError('subtitulo inválido')
        caption_layout(str(caption.get('texto','')),tuple(caption.get('recuadro',(48,1050,672,1190))), canvas=tuple(spec.get('canvas', CANVAS)))
    return sorted(ids)


def animate_scene(frame:Image.Image,spec:dict[str,Any],t:float)->Image.Image:
    """Renderiza acciones controladas sobre un fondo original. No mueve la cámara.

    Acciones permitidas: puerta que cierra, engranaje, fichas insertadas/rechazadas,
    luces, tarjeta, contador. Cada una cambia de estado durante su intervalo.
    La narración y los subtítulos son una capa independiente del encuadre.
    """
    local={**spec, 'canvas':list(frame.size)}
    validate_animation_spec(local)
    frame=frame.convert('RGBA')
    w,h=frame.size
    for idx,m in enumerate(spec['movimientos']):
        typ=m['tipo'];start=float(m['inicio']);end=float(m['fin'])
        if t<start and typ not in ('door_close','door_open'):
            continue
        u=progress(t,start,end)
        anchor_x=int(w*(.24 + .18*(idx%3)))
        anchor_y=int(h*(.40 + .11*(idx%2)))
        if typ in ('door_close','door_open'):
            # Puerta ligada al lateral, sin desplazar el escenario ni reiniciar.
            door_panel(frame,t,hinge=(int(w*.13),int(h*.26)),
                       height=int(h*.48),width=int(w*.54),direction=('close' if typ=='door_close' else 'open'),start=start,end=end)
            continue
        d=ImageDraw.Draw(frame,'RGBA')
        if typ=='gear_spin':
            cx,cy=int(w*.5),int(h*.43);ang=u*2*pi
            d.ellipse((cx-58,cy-58,cx+58,cy+58),fill=(11,30,36,240),outline=(219,181,111,250),width=7)
            for k in range(12):
                a=ang+2*pi*k/12
                d.line((cx+38*cos(a),cy+38*sin(a),cx+67*cos(a),cy+67*sin(a)),fill=(216,175,102,255),width=12)
            d.ellipse((cx-17,cy-17,cx+17,cy+17),fill=(239,212,147,255))
        elif typ in ('symbol_insert','symbol_reject'):
            d_x=int((1-u)*w*.22)*(1 if typ=='symbol_insert' else -1)
            xx=anchor_x-d_x;yy=anchor_y+int((1-u)*26)
            color=(221,185,112,255) if typ=='symbol_insert' else (198,90,74,255)
            d.rounded_rectangle((xx-46,yy-48,xx+46,yy+48),radius=15,fill=(13,43,49,248),outline=color,width=4)
            mark='✦' if typ=='symbol_insert' else '×'
            d.text((xx-16,yy-25),mark,font=_font(39),fill=color)
        elif typ=='light_pulse':
            alpha=int(65*(sin(u*pi)**2))
            d.ellipse((anchor_x-95,anchor_y-95,anchor_x+95,anchor_y+95),fill=(231,188,99,alpha))
        elif typ=='card_reveal':
            xx,yy=int(w*.17),int(h*.38)+int((1-u)*90)
            d.rounded_rectangle((xx,yy,xx+int(w*.66),yy+int(h*.22)),radius=18,
                                fill=(211,191,153,int(245*u)),outline=(242,217,166,int(250*u)),width=3)
        elif typ=='counter_tick':
            count=int(round(60+(2-60)*u));txt=str(count)
            d.rounded_rectangle((anchor_x-56,anchor_y-61,anchor_x+76,anchor_y+82),radius=15,fill=(9,39,44,235),outline=(213,180,113,245),width=3)
            d.text((anchor_x-40,anchor_y-35),txt,font=_font(56),fill=(240,225,170,255))
        elif typ=='caption':
            # Es una acción de texto, no cuenta como objeto móvil independiente.
            pass
    subtitle=spec.get('subtitulo') or {}
    if subtitle and str(subtitle.get('texto','')).strip():
        bounds=tuple(subtitle.get('recuadro',([48,1050,672,1190] if h>w else [85,580,w-85,h-45])))
        draw_caption(frame,str(subtitle['texto']),bounds)
    return frame
