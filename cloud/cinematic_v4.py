"""MASK GROUP / ENIGMA 60 -- cinematic sheep pilot. 2D original procedural assets.
Pillow and Python stdlib only. No external or paid API calls.
"""
import array
import math
import random
import wave
from PIL import ImageDraw, ImageFont

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def _font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)


def paint_cinematic(bg, stage, step=0, steps=16, phase='scene'):
    w, h = bg.size
    d = ImageDraw.Draw(bg)
    t = 2 * math.pi * ((step % steps) / steps)
    dark = stage in ('storm', 'question', 'countdown') or phase in ('puzzle', 'countdown')
    dawn = stage in ('answer', 'end') or phase == 'answer'
    top = (14, 28, 52) if dark else ((27, 67, 91) if dawn else (33, 80, 117))
    bottom = (48, 83, 104) if dark else ((224, 174, 107) if dawn else (137, 190, 186))
    for y in range(0, h, 20):
        a = min(1, y / (h * .81))
        color = tuple(int(top[c] * (1-a) + bottom[c] * a) for c in range(3))
        d.rectangle((0, y, w, y+20), fill=color)
    # Moon / sun, distant scenery and camera-like cloud parallax
    sx, sy = int(w*.75), int(h*.19)
    glow = '#ead9a8' if dark else '#f7d994'
    d.ellipse((sx-43, sy-43, sx+43, sy+43), fill=glow)
    for i in range(6):
        bx = int((i*173+32 + 16*math.sin(t+i*.37)) % (w+150)-75)
        by = int(h*(.13 + .051*(i%3)))
        color = '#253b52' if dark else '#f0ece1'
        for offx, r in ((0,43),(34,31),(-30,25)):
            d.ellipse((bx+offx-r, by-r//2, bx+offx+r, by+r//2), fill=color)
    d.polygon([(0,h*.51),(w*.24,h*.39),(w*.51,h*.46),(w*.76,h*.37),(w,h*.43),(w,h),(0,h)], fill='#365965' if dark else '#729574')
    d.polygon([(0,h*.62),(w*.31,h*.53),(w*.66,h*.60),(w,h*.52),(w,h),(0,h)], fill='#204a43' if dark else '#4b8058')
    d.polygon([(0,h*.75),(w*.38,h*.65),(w*.83,h*.73),(w,h*.66),(w,h),(0,h)], fill='#254a43' if dark else '#50844a')
    # Countryside barn: consistent location in every stage
    barnx, barny = int(w*.73), int(h*.47)
    d.polygon([(barnx-112,barny-18),(barnx+4,barny-115),(barnx+117,barny-18)], fill='#342e36' if dark else '#724733')
    d.rectangle((barnx-97,barny-18,barnx+104,barny+188), fill='#6e4140' if dark else '#b55a46')
    d.polygon([(barnx-112,barny-18),(barnx+4,barny-115),(barnx+117,barny-18)], outline='#e1b878')
    for liney in range(barny+10,barny+188,26):
        d.line((barnx-93,liney,barnx+101,liney), fill='#98595a',width=3)
    d.rectangle((barnx-7,barny+74,barnx+62,barny+188), fill='#273340')
    d.line((barnx+28,barny+74,barnx+28,barny+188),fill='#c68956',width=4)
    # Fencing in foreground
    fence = '#a77d55' if dark else '#c99c64'
    for x in range(15,w,100):
        d.rounded_rectangle((x,int(h*.70),x+11,int(h*.86)),radius=3,fill=fence)
    for y in (.74,.81): d.rectangle((0,int(h*y),w,int(h*y)+8),fill=fence)
    # Sheep are visible only when the mystery allows it.
    if stage in ('intro','setup'):
        number = 17
    elif dawn:
        number = 9
    elif stage in ('storm','question','countdown'):
        number = 9 if phase=='answer' else 0
    else:
        number = 17
    def sheep(x,y,scale,n):
        bob=4*math.sin(t+n*.53)
        x,y=x+4*math.sin(t+n*.27),y+bob
        bw,bh=32*scale,21*scale
        # legs + ground shadow
        d.ellipse((x-bw*1.2,y+bh*.8,x+bw*1.35,y+bh*1.65), fill='#1d4438' if dark else '#3b7440')
        for dx in (-.5,.52):
            d.line((x+bw*dx,y+8*scale,x+bw*dx-3*scale,y+30*scale),fill='#283237',width=max(3,int(5*scale)))
        # modular wool body
        for xx,yy,r in ((-.73,-.2,.56),(-.36,-.61,.56),(.1,-.62,.59),(.58,-.39,.56),(.25,.05,.66),(-.32,.09,.62)):
            rr=r*bw
            d.ellipse((x+bw*xx-rr,y+bh*yy-rr,x+bw*xx+rr,y+bh*yy+rr),fill='#f0ece3' if dark else '#fff9e9')
        face_x=x+bw*.94
        d.ellipse((face_x-13*scale,y-14*scale,face_x+13*scale,y+18*scale),fill='#373c43')
        d.ellipse((face_x+3*scale,y-7*scale,face_x+6*scale,y-4*scale),fill='#fffdf5')
        d.ellipse((face_x+6*scale,y+6*scale,face_x+9*scale,y+8*scale),fill='#d4a0a4')
    if number:
        # 17 sheep before the storm; 9 survivors appear only at the reveal.
        cols = 5 if number==17 else 3
        for i in range(number):
            row,col=divmod(i,cols)
            base_x=w*(.12 + col*(.17 if cols==5 else .24))
            base_y=h*(.57+row*.071)
            sheep(base_x,base_y,.58+row*.09,i)
    # The farmer reacts through head/arm motion, always same design
    fx,fy = int(w*.86), int(h*.75)
    d.ellipse((fx-36,fy+122,fx+41,fy+141),fill='#183d33')
    d.line((fx-12,fy+61,fx-25,fy+129),fill='#1e2c35',width=14)
    d.line((fx+17,fy+61,fx+29,fy+129),fill='#1e2c35',width=14)
    d.polygon([(fx-37,fy-24),(fx+37,fy-24),(fx+28,fy+72),(fx-28,fy+72)],fill='#2d5471')
    d.ellipse((fx-21,fy-82,fx+21,fy-36),fill='#e6b58e')
    d.polygon([(fx-42,fy-81),(fx+41,fy-81),(fx+22,fy-100),(fx-21,fy-100)],fill='#8a6141')
    arm_angle=19*math.sin(t)
    d.line((fx+24,fy-10,fx+41+arm_angle,fy+25),fill='#e6b58e',width=11)
    d.line((fx-22,fy-12,fx-39,fy+20),fill='#e6b58e',width=11)
    # Rain + cinematic lightning, consistent across frames
    if dark and stage in ('storm','question','countdown'):
        for j in range(82):
            rng=random.Random(700+j)
            px=(rng.randint(0,w)+step*18)%w
            py=(rng.randint(0,h)+step*27)%h
            d.line((px,py,px-7,py+25),fill='#7b9aaf',width=2)
        if (step % steps) in (1,2,3) and stage=='storm':
            d.line([(w*.38,h*.09),(w*.31,h*.25),(w*.42,h*.26),(w*.29,h*.45)],fill='#f2e6ba',width=10,joint='curve')
    if dawn:
        for i in range(6):
            x=int(w*(.13+i*.12));y=int(h*.39+20*math.sin(t+i))
            d.ellipse((x-5,y-5,x+5,y+5),fill='#f9da96')
    return bg


def paint_overlay(bg, job, scene, shown, phase, timer=None):
    w,h=bg.size
    d=ImageDraw.Draw(bg,'RGBA')
    gold='#eecb85'; white='#fff8e9'
    # Brand kept away from platform UI overlays
    d.rounded_rectangle((50,105,265,158),radius=15,fill=(9,25,38,187))
    d.text((66,115),'ENIGMA 60',font=_font(26,True),fill=gold)
    if phase=='answer':
        main='¡QUEDAN 9!'
        subtitle='Todas menos nueve significa que nueve sobreviven.'
    elif phase=='countdown':
        main='¿8, 9 o 17?'
        subtitle='Piensa: ¿qué significa «todas menos nueve»?'
    elif phase=='puzzle':
        main='¿CUÁNTAS QUEDAN?'
        subtitle='17 ovejas. Mueren todas menos nueve.'
    else:
        main=str(scene.get('rotulo') or shown).replace('\n',' ').strip()[:52]
        subtitle=''
    lower=int(h*.79) if phase in ('scene','answer') else int(h*.76)
    d.rounded_rectangle((36,lower,w-36,int(h*.90)),radius=22,fill=(7,19,32,210),outline=(238,203,133,140),width=2)
    if len(main)>35:
        size=30
    elif len(main)>22:
        size=34
    else:
        size=41
    d.text((62,lower+22),main,font=_font(size,True),fill=white)
    if subtitle:
        d.text((62,lower+85),subtitle[:58],font=_font(20),fill=gold)
    if timer is not None:
        total=max(1,int(scene.get('pensar',8)))
        d.ellipse((int(w*.39),int(h*.41),int(w*.61),int(h*.535)),fill=(7,19,30,214),outline=(235,201,128,255),width=6)
        d.text((int(w*.443),int(h*.435)),str(timer).zfill(2),font=_font(52,True),fill=white)
        d.rounded_rectangle((58,int(h*.92),w-58,int(h*.929)),radius=5,fill=(44,62,69,225))
        d.rounded_rectangle((58,int(h*.92),58+int((w-116)*(timer/total)),int(h*.929)),radius=5,fill=(236,199,113,240))
    return bg


def create_audio(path, duration, cues=None, sample_rate=22050):
    """Original atmospheric bed with cue-based SFX. No copyrighted recordings."""
    cues=cues or []
    total=int(sample_rate*min(180,max(2,float(duration))))
    buf=array.array('h')
    tau=math.tau
    for n in range(total):
        t=n/sample_rate
        # Non-silent musical texture and continuous pulse during the decision window
        melody=math.sin(tau*196*t)*.024+math.sin(tau*246.94*t)*.016+math.sin(tau*293.66*t)*.012
        pulse=math.sin(tau*440*t)*math.exp(-20*(t%1))*.018
        score=melody*(.7+.15*math.sin(tau*t/8))+pulse
        for cue in cues:
            dt=t-float(cue.get('at',0))
            if cue.get('name')=='thunder' and 0<=dt<2.3:
                # Low-frequency rumble with layered pulses and decay.
                score+=.19*math.exp(-dt*1.25)*(math.sin(tau*51*dt)+.4*math.sin(tau*74*dt))
            elif cue.get('name')=='reveal' and 0<=dt<2:
                score+=.07*math.exp(-dt*2.8)*(math.sin(tau*783.99*dt)+math.sin(tau*587.33*dt))
            elif cue.get('name')=='countdown' and 0<=dt<float(cue.get('length',8)):
                sec=dt%1
                score+=.14*math.exp(-33*sec)*math.sin(tau*960*sec)
        # Fade in and fade out gently
        gain=min(1,t/1.2,(total/sample_rate-t)/1.4)
        value=max(-.9,min(.9,score*max(0,gain)))
        buf.append(int(value*32767))
    with wave.open(str(path),'wb') as wav:
        wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(sample_rate)
        wav.writeframes(buf.tobytes())
    return path
