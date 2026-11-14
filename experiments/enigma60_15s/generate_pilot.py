#!/usr/bin/env python3
"""ENIGMA 60 • mini piloto 15 s. Original 2D layered animation, PIL+FFmpeg.
No external AI assets, no paid API, no prior approval implied.
Temporary espeak narration is a timing placeholder, not the natural TTS audition.
"""
import os, math, random, subprocess, wave
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
from scipy.io import wavfile

OUT=Path(__file__).resolve().parent
W,H=720,1280
FPS=24
DUR=15
N=FPS*DUR
SEED=43
random.seed(SEED)
FONT_SANS='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_SERIF='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'

def font(path,size):return ImageFont.truetype(path,size)
COLORS={'gold':'#D9BB7B','ivory':'#F2E8D2','pale':'#B9D6CF','red':'#BC7462','teal':'#1C4445','dark':'#0C2028'}

def smooth(a):a=max(0,min(1,a));return a*a*(3-2*a)
def lerp(a,b,t):return a+(b-a)*t

def poly(d,pts,fill,outline=None,width=1):d.polygon(pts, fill=fill);outline and d.line(pts+[pts[0]],fill=outline,width=width,joint='curve')
def ellipse(d,cx,cy,rx,ry,fill,outline=None,width=1):d.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=fill,outline=outline,width=width)

# Antic architectural backdrop with rich deterministic procedural surface.
def backdrop():
    rng=np.random.default_rng(43)
    yy=np.arange(H,dtype=np.float32)[:,None]
    xx=np.arange(W,dtype=np.float32)[None,:]
    glow=np.exp(-((xx-360)**2/260000+(yy-610)**2/750000))
    vertical=yy/H
    noise=rng.normal(0,3,(H,W)).astype('float32')
    arr=np.zeros((H,W,3),dtype=np.uint8)
    for j,(base,light) in enumerate([(12,24),(34,42),(43,38)]):
        arr[:,:,j]=np.clip(base+light*glow-14*vertical+noise,0,255)
    im=Image.fromarray(arr,'RGB').convert('RGBA');d=ImageDraw.Draw(im,'RGBA')
    # Wide stone columns, masonry, mortar and blind arch.
    for y in range(45,1210,97):
        shift=55 if ((y//97)%2) else 0
        d.line((0,y,W,y),fill=(8,24,30,105),width=6)
        for x in range(-100+shift,820,175):
            d.line((x,y,x,y+97),fill=(8,25,30,83),width=4)
            d.line((x+4,y+5,x+13,y+78),fill=(199,194,158,8),width=2)
    # Decorative side pillars
    for a in [34,632]:
        d.rounded_rectangle((a,75,a+55,1130),radius=12,fill=(4,19,22,190),outline=(163,136,82,108),width=3)
        for yy0 in range(132,1120,100):
            d.line((a+10,yy0,a+45,yy0),fill=(215,188,133,63),width=3)
            ellipse(d,a+27,yy0-19,8,8,(186,158,100,102))
    # Decorative arch and inset
    d.rounded_rectangle((105,110,612,1020),radius=205,fill=(5,18,26,215),outline=(202,174,108,140),width=9)
    d.rounded_rectangle((128,135,590,992),radius=190,fill=(9,37,39,200),outline=(193,161,94,80),width=4)
    # narrow stained glass slit on side
    d.polygon([(113,321),(155,300),(160,553),(111,560)],fill=(15,64,62,200))
    d.line((135,305,135,548),fill=(184,149,82,150),width=4)
    d.line((113,435,159,430),fill=(184,149,82,150),width=4)
    # door on far right, height below clock
    d.rounded_rectangle((435,724,598,1106),radius=72,fill=(9,20,23,255),outline=(189,143,79,155),width=7)
    d.rounded_rectangle((459,742,572,1091),radius=58,fill=(43,54,46,255),outline=(133,93,54,220),width=5)
    for j in range(4):
        y=801+j*72
        d.line((475,y,557,y),fill=(22,39,35,175),width=10)
        d.line((479,y+4,553,y+4),fill=(144,100,61,95),width=3)
    ellipse(d,543,956,10,10,(163,132,75,255),outline=(231,198,116,255),width=2)
    ellipse(d,543,956,3,3,(8,22,25,255))
    # Wood desk
    d.polygon([(38,1076),(682,1076),(720,1175),(0,1175)],fill=(47,33,33,255))
    d.line((39,1079,682,1079),fill=(218,165,102,180),width=7)
    d.polygon([(0,1170),(720,1170),(720,1280),(0,1280)],fill=(20,32,34,255))
    for y in [1194,1242]:d.line((0,y,720,y),fill=(147,111,75,95),width=4)
    # Desk ornament brass plate and ink bowl
    d.rounded_rectangle((62,1179,252,1236),radius=12,fill=(26,38,36,255),outline=(178,151,94,180),width=3)
    d.text((84,1191),'ENIGMA  60',font=font(FONT_SERIF,22),fill=(219,194,147,225))
    # golden chandelier threads
    d.line((354,105,354,200),fill=(167,134,77,160),width=4)
    ellipse(d,354,213,13,17,(201,169,107,180))
    return im

BASE=backdrop()
# Clock face independently animated on top of the environment.
CLOCK_CENTER=(338,558)
CR=195

def clock(t,move):
    lay=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(lay,'RGBA')
    x,y=CLOCK_CENTER
    # shadow and bevel rings
    ellipse(d,x+11,y+17,CR+14,CR+16,(0,4,8,190))
    ellipse(d,x,y,CR+9,CR+9,(54,45,35,255),outline=(204,170,104,210),width=7)
    ellipse(d,x,y,CR-4,CR-4,(14,40,45,252),outline=(75,56,40,255),width=6)
    ellipse(d,x,y,CR-20,CR-20,(27,59,57,255),outline=(221,189,111,220),width=3)
    # gear-like precise marks
    for k in range(60):
        ang=math.pi*2*k/60-math.pi/2
        outer=CR-21
        inner=outer-(22 if k%5==0 else 9)
        col=(232,210,157,220) if k%5==0 else (149,180,163,175)
        d.line((x+inner*math.cos(ang),y+inner*math.sin(ang),x+outer*math.cos(ang),y+outer*math.sin(ang)),fill=col,width=4 if k%5==0 else 2)
    # Roman numerals
    for k,label in enumerate(['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI']):
        a=2*math.pi*k/12-math.pi/2
        px=x+135*math.cos(a);py=y+135*math.sin(a)
        bb=d.textbbox((0,0),label,font=font(FONT_SERIF,24))
        d.text((px-(bb[2]-bb[0])/2,py-(bb[3]-bb[1])/2-2),label,font=font(FONT_SERIF,24),fill=(233,215,164,235))
    # rotating core and hands; the clock jumps during discovery
    sec=((t*0.74)%60)
    hour=4.10+(0.1*smooth((t-10.0)/2))
    minute=20+(5*smooth((t-10.1)/2))
    for value,length,width in [(hour/12,102,15),(minute/60,143,9)]:
        a=value*2*math.pi-math.pi/2
        d.line((x-12*math.cos(a),y-12*math.sin(a),x+length*math.cos(a),y+length*math.sin(a)),fill=(8,24,27,230),width=width+7)
        d.line((x-12*math.cos(a),y-12*math.sin(a),x+length*math.cos(a),y+length*math.sin(a)),fill=(212,180,102,255),width=width)
    a=sec/60*2*math.pi-math.pi/2
    d.line((x-25*math.cos(a),y-25*math.sin(a),x+158*math.cos(a),y+158*math.sin(a)),fill=(174,98,83,240),width=3)
    ellipse(d,x,y,13,13,(218,183,104,255),outline=(22,28,29,255),width=4)
    # pendulum hangs and swings
    v=math.sin(t*3.7)*math.radians(18)
    yy=y+210
    d.line((x,yy,x+math.sin(v)*55,yy+130*math.cos(v)),fill=(188,150,88,240),width=6)
    ellipse(d,x+math.sin(v)*55,yy+130*math.cos(v),23,30,(214,175,91,255),outline=(246,207,125,255),width=3)
    return lay

def desk_paper(t):
    lay=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(lay,'RGBA')
    # Slide paper into the viewer's focus near the end
    appear=smooth((t-6.0)/2.2)
    shift=190*(1-appear)
    xx=165+int(shift);y=1010
    poly(d,[(xx+10,y+40),(xx+360,y-15),(xx+401,y+165),(xx+20,y+180)],(222,203,162,245),(244,232,196,255),3)
    # script on parchment
    for j in range(4):
        d.line((xx+72,y+45+j*20,xx+312,y+12+j*20),fill=(81,74,58,70),width=2)
    # Three coded symbols emphasized on paper
    for i,form in enumerate(['◈','△','✦']):
        xf=xx+90+i*99
        d.text((xf,y+78-i*8),form,font=font(FONT_SANS,36),fill=(57,74,71,255))
    d.rounded_rectangle((xx+57,y+134,xx+341,y+157),radius=6,fill=(105,79,62,80))
    return lay

PARTICLES=[(random.randrange(W),random.randrange(H),random.uniform(.5,2.3),random.uniform(4,21)) for _ in range(45)]

# Small animated light and photographic grade.
def atmos(t):
    lay=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(lay,'RGBA')
    for i,(x,y,r,v) in enumerate(PARTICLES):
        yy=(y-(t*v)+H)%H
        xx=x+13*math.sin(i*.7+t*.3)
        a=35+int(28*(.5+.5*math.sin(t*1.2+i)))
        ellipse(d,int(xx),int(yy),r,r,(235,220,163,a))
    # Door glows during closing beat
    appear=smooth((t-11.2)/1.1)
    if appear:
        d.ellipse((474,867,614,1120),fill=(236,189,97,int(16*appear)))
        d.line((478,788,478,1092),fill=(237,196,103,int(170*appear)),width=5)
        d.ellipse((533,945,558,969),fill=(250,212,115,int(140*appear)))
    # lightning short transient
    flash=max(0,1-abs(t-4.4)/.13)*.11
    if flash:d.rectangle((0,0,W,H),fill=(188,225,221,int(255*flash)))
    return lay

# overlay callouts: only 1 line visible at a time, safe zones away from UI
def caption_card(im,t):
    d=ImageDraw.Draw(im,'RGBA')
    if t<2.8:
        kicker='HABITACIÓN 404'
        title='Algo no encaja…'
        alpha=smooth((t-.2)/.6)*(1-smooth((t-2.4)/.5))
    elif t<7.4:
        kicker='PISTA 01 / EL RELOJ'
        title='Las agujas se mueven.'
        alpha=smooth((t-2.9)/.5)*(1-smooth((t-6.8)/.6))
    elif t<11.1:
        kicker='PISTA 02 / LA NOTA'
        title='Tres símbolos ocultos.'
        alpha=smooth((t-7.4)/.5)*(1-smooth((t-10.65)/.5))
    else:
        kicker='TU PRIMERA DECISIÓN'
        title='¿Qué mirarías primero?'
        alpha=smooth((t-11.2)/.5)
    a=int(max(0,min(1,alpha))*255)
    if a==0:return
    # top header, not giant card, plus a glassy bottom subtitle bar
    d.rounded_rectangle((48,98,496,138),radius=16,fill=(3,17,22,int(a*.78)))
    d.text((68,107),kicker,font=font(FONT_BOLD,18),fill=(223,188,120,a))
    d.rounded_rectangle((38,1112,682,1207),radius=20,fill=(5,20,24,int(a*.80)),outline=(222,186,115,int(a*.65)),width=2)
    d.text((61,1140),title,font=font(FONT_BOLD,25),fill=(237,231,209,a))
    d.rounded_rectangle((61,1200,659,1205),radius=2,fill=(222,185,117,int(a*.28)))

def camera(im,t):
    """Purposeful shot sequence: establishing -> clock closeup -> symbol note -> door latch.
    Cinematic framing changes reflect new puzzle information, not random shaking.
    """
    if t < 2.8:
        k=smooth(t/2.8)
        z=1.07+0.10*k
        cx=360-13*k;cy=640-37*k
    elif t < 7.15:
        k=smooth((t-2.8)/3.6)
        z=1.17+0.60*k
        cx=347-18*k;cy=603-33*k
    elif t < 7.8:
        k=smooth((t-7.15)/.65)
        z=1.77+0.25*k
        cx=329+30*k;cy=570+449*k
    elif t < 11.05:
        k=smooth((t-7.8)/3.25)
        z=2.02+0.18*k
        cx=359+31*k;cy=1019-30*k
    elif t < 11.55:
        k=smooth((t-11.05)/.5)
        z=2.20-0.21*k
        cx=390+143*k;cy=989-78*k
    else:
        k=smooth((t-11.55)/3.45)
        z=1.99+0.13*k
        cx=533+8*math.sin(k*2.7);cy=911-30*k
    ww=int(W*z);hh=int(H*z)
    im=im.resize((ww,hh),Image.Resampling.BILINEAR)
    x=int(cx*z-W*.5);y=int(cy*z-H*.5)
    x=max(0,min(ww-W,x));y=max(0,min(hh-H,y))
    return im.crop((x,y,x+W,y+H))

def render_frames():
    out=OUT/'ENIGMA60_PILOTO_15S_SIN_VOZ.mp4'
    cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','-','-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',str(out)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    for f in range(N):
        t=f/FPS
        scene=BASE.copy()
        scene.alpha_composite(clock(t,0));scene.alpha_composite(desk_paper(t));scene.alpha_composite(atmos(t))
        im=camera(scene.convert('RGB'),t)
        caption_card(im,t)
        if f in (0,48,96,144,192,240,288,336):im.save(OUT/f'frame_{f:03}.jpg',quality=85)
        try:proc.stdin.write(im.tobytes())
        except BrokenPipeError:
            raise RuntimeError('FFmpeg pipe broken '+proc.stderr.read().decode()[:500])
        if f%72==0:print(f'frame {f}/{N}',flush=True)
    proc.stdin.close();proc.wait(timeout=90)
    if proc.returncode:raise RuntimeError(proc.stderr.read().decode()[:600])
    print('VIDEO',out,os.path.getsize(out),flush=True)
    return out

def temporary_narration():
    # This is espeak, not Kokoro / PocketTTS. Only for sync; cannot be approved as a human-like voice.
    items=[(0.40,'La puerta no tiene cerradura.'),(3.25,'El reloj sigue moviéndose, pero hay algo extraño.'),(7.65,'En la mesa han dejado tres símbolos.'),(11.95,'¿Qué investigarías primero?')]
    sr=24000; timeline=np.zeros(int(sr*DUR),dtype=np.float32)
    for n,(start,line) in enumerate(items):
        wavepath=OUT/f'voz_temporal_{n+1}.wav'
        subprocess.run(['espeak','-v','es','-s','147','-p','38','-w',str(wavepath),line],check=True,stdout=subprocess.DEVNULL)
        fr,a=wavfile.read(wavepath)
        if a.ndim>1:a=a.mean(axis=1)
        a=a.astype(np.float32)/32768
        if fr!=sr:
            ix=np.linspace(0,len(a)-1,round(len(a)*sr/fr))
            a=np.interp(ix,np.arange(len(a)),a).astype(np.float32)
        pos=int(start*sr);end=min(len(timeline),pos+len(a));timeline[pos:end]+=a[:end-pos]
    # normalize to -20 dBFS-ish rms on active voice, conservative peak
    peak=np.max(np.abs(timeline));timeline=np.clip(timeline*min(1.0,.75/(peak+1e-8)), -.95,.95)
    return timeline,sr

def soundscape(voice,sr):
    rng=np.random.default_rng(95)
    n=len(voice);t=np.arange(n,dtype=np.float32)/sr
    # original low dynamic music: chords unfold, slight rhythmic subpulse.
    chords=[(130.81,155.56,196.0),(146.83,174.61,220.0),(123.47,164.81,196.0)]
    bg=np.zeros(n,dtype=np.float32)
    for i,cs in enumerate(chords):
        env=np.sin(np.pi*np.clip((t-i*5.0)/5.0,0,1))**2
        for j,pitch in enumerate(cs):
            bg+=.011*env*np.sin(2*np.pi*pitch*t+0.2*j)
            bg+=.003*env*np.sin(2*np.pi*(pitch*.5)*t)
    # harmonics and warm ticks
    bg+=.012*np.sin(2*np.pi*65.4*t)*(0.4+0.6*(0.5+0.5*np.sin(2*np.pi*.2*t)))
    for k in range(23):
        start=k*.63;u=t-start;mask=(u>=0)&(u<.12)
        bg[mask]+=.082*np.exp(-u[mask]*36)*np.sin(2*np.pi*(600 if k%2 else 900)*u[mask])
    # subtle atmospheric hiss
    noise=rng.standard_normal(n).astype('float32');wind=np.cumsum(noise)*.000004;wind-=np.mean(wind)
    wind=np.clip(wind,-.018,.018)
    bg+=wind
    # door latch on closing beat, two metallic impacts
    for start in [11.35,12.55]:
        u=t-start;mask=(u>=0)&(u<1.2)
        v=u[mask]
        bg[mask]+=.125*np.exp(-5*v)*(np.sin(2*np.pi*430*v)+.25*np.sin(2*np.pi*660*v))
    # voice ducking: lower background during active voice
    active=np.convolve(np.abs(voice),np.ones(1400,dtype='float32')/1400,mode='same')
    sm=np.minimum(1.0,active/.020)
    env=np.convolve(sm,np.ones(2500,dtype='float32')/2500,mode='same')
    bg*=1-0.45*np.minimum(env,1)
    mix=np.clip(voice*.88+bg*.76,-.98,.98)
    pcm=(mix*32767).astype('<i2')
    p=OUT/'PILOTO15S_VOZ_TEMPORAL.wav'
    wavfile.write(p,sr,pcm)
    return p

def finish(video,audio):
    final=OUT/'ENIGMA60_PILOTO_15S_REVISION.mp4'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(video),'-i',str(audio),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','160k','-t',str(DUR),'-movflags','+faststart',str(final)],check=True)
    print('FINAL',final,os.path.getsize(final),flush=True)
    return final

if __name__=='__main__':
    import sys
    if len(sys.argv)>1 and sys.argv[1]=='audio':
        voice,sr=temporary_narration();audio=soundscape(voice,sr);print(audio)
    else:
        v=render_frames();voice,sr=temporary_narration();a=soundscape(voice,sr);finish(v,a)
