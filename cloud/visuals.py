"""Ilustraciones originales y gratuitas para ENIGMA 60: Pillow puro."""
import math
from PIL import ImageDraw

def paint(bg,kind,step=0,steps=10,phase="scene"):
    w,h=bg.size
    d=ImageDraw.Draw(bg)
    t=2*math.pi*(step%steps)/steps
    def oval(b,color,stroke=None,width=2):
        d.ellipse(tuple(int(v) for v in b),fill=color,outline=stroke,width=width)
    def line(coords,color,width=4):
        d.line([(int(x),int(y)) for x,y in coords],fill=color,width=width,joint="curve")
    if kind=="sheep_meadow":
        d.rectangle((0,0,w,h),fill="#223c56")
        d.rectangle((0,int(h*.22),w,int(h*.64)),fill="#6badd6")
        for k in range(3):
            cx=w*(.13+.32*k)+18*math.sin(t+k)
            cy=h*(.28+.02*(k%2))
            oval((cx-38,cy-12,cx+36,cy+14),"#edf1ed")
        d.polygon([(0,int(h*.48)),(w*.35,h*.40),(w*.72,h*.48),(w,h*.42),(w,h*.71),(0,h*.71)],fill="#4e8645")
        d.rectangle((0,int(h*.55),w,int(h*.74)),fill="#336634")
        for k in range(6):
            xx=int(w*k/5)
            d.rectangle((xx,int(h*.42),xx+8,int(h*.59)),fill="#9f7049")
        d.rectangle((0,int(h*.47),w,int(h*.49)),fill="#b88b59")
        d.rectangle((0,int(h*.54),w,int(h*.56)),fill="#b88b59")
        scale=min(w,h)/720
        for k in range(4):
            cx=w*(.12+.17*k)+16*math.sin(t+1.4*k)
            cy=h*(.56-.025*(k%2))+5*math.sin(t*2+k)
            for m in range(3):
                oval((cx-33+m*20,cy-38,cx+11+m*20,cy+16),"#f5f4e9")
            oval((cx+44,cy-22,cx+78,cy+13),"#2a2a30")
            oval((cx+67,cy-14,cx+72,cy-9),"#fefefe")
            line([(cx-10,cy+10),(cx-10,cy+35)],"#24272b",4)
            line([(cx+45,cy+10),(cx+45,cy+35)],"#24272b",4)
        x=w*.80; y=h*.48
        oval((x-17,y-58,x+20,y-20),"#d7a77b")
        d.rectangle((int(x-20),int(y-20),int(x+22),int(y+65)),fill="#24476d")
        d.polygon([(x-29,y-60),(x+27,y-60),(x+38,y-48),(x-40,y-48)],fill="#89603b")
        line([(x-6,y+65),(x-17,y+117)],"#1d283b",10)
        line([(x+12,y+65),(x+26,y+117)],"#1d283b",10)
        line([(x+18,y-12),(x+35+15*math.sin(t),y+12)],"#d7a77b",9)
        line([(x-16,y-10),(x-36,y+28)],"#d7a77b",9)
    elif kind=="clockwork":
        d.rectangle((0,0,w,h),fill="#132334")
        for k in range(4):
            x=w*(.13+.24*k);y=h*(.32+.06*(k%2))
            r=min(w,h)*(.085+.015*(k%2))
            oval((x-r,y-r,x+r,y+r),"#24384a","#d6b36c",5)
            for n in range(12):
                a=2*math.pi*n/12
                line([(x+(r*.78)*math.cos(a),y+(r*.78)*math.sin(a)),
                      (x+r*.91*math.cos(a),y+r*.91*math.sin(a))],"#d6b36c",3)
            a=t*(1 if k%2==0 else -1)+k
            line([(x,y),(x+r*.68*math.sin(a),y-r*.68*math.cos(a))],"#e8e3c7",6)
            line([(x,y),(x+r*.43*math.sin(a*.2),y-r*.43*math.cos(a*.2))],"#6cb9b0",4)
        for k,(teeth,r,cx,cy) in enumerate([(10,.10,.30,.53),(20,.16,.50,.52),(40,.23,.75,.48)]):
            rad=min(w,h)*r;cx*=w;cy*=h
            coords=[]
            aoff=t*(1 if k%2==0 else -.5)/(k+1)
            for j in range(teeth*4):
                a=2*math.pi*j/(teeth*4)+aoff
                rr=rad*(1.13 if j%4==0 or j%4==1 else 1.0)
                coords.append((int(cx+rr*math.cos(a)),int(cy+rr*math.sin(a))))
            d.polygon(coords,fill="#9f8750",outline="#e2c37d",width=3)
            oval((cx-rad*.38,cy-rad*.38,cx+rad*.38,cy+rad*.38),"#132334","#e3bf78",4)
            oval((cx-7,cy-7,cx+7,cy+7),"#e8e9ea")
    else:
        d.rectangle((0,0,w,h),fill="#14293a")
        for k in range(8):
            x=w*(.12+.10*k);y=h*(.28+.19*math.sin(t+k*.8))
            r=min(w,h)*(.028+.006*(k%3))
            oval((x-r,y-r,x+r,y+r),["#e8c986","#86c8c1","#b5a1ed"][k%3])
            if k:
                xp=w*(.12+.10*(k-1))
                yp=h*(.28+.19*math.sin(t+(k-1)*.8))
                line([(xp,yp),(x,y)],"#8094a5",3)
        d.rounded_rectangle((int(w*.15),int(h*.41),int(w*.85),int(h*.57)),radius=20,outline="#c6ae69",width=4)
        for k in range(5):
            x=w*(.2+.15*k)
            y=h*(.49+.04*math.sin(t*2+k))
            oval((x-14,y-14,x+14,y+14),"#9bcfc5")
    return bg
