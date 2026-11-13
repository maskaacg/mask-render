#!/usr/bin/env python3
"""Banda sonora ambiental original y efectos de relojería; sin material protegido."""
import array
import math
import wave

def create(path, duration=16, sample_rate=22050):
    chords = [
        (174.61, 220.0, 261.63),
        (196.00, 246.94, 293.66),
        (164.81, 207.65, 246.94),
        (174.61, 220.0, 293.66),
    ]
    buf = array.array("h")
    total=int(sample_rate * duration)
    twopi=2.0*math.pi
    for n in range(total):
        t=n/sample_rate
        c=chords[int(t//4)%len(chords)]
        beat=t%1.0
        # Pad armónico lento, arpegio simple y tres matices de timbre
        breathe=0.50+0.16*math.sin(twopi*t/8.0)
        pad=sum(math.sin(twopi*f*t) for f in c)*0.018*breathe
        note=c[int(t*2)%3]*2
        gate=max(0.0,1.0-(t%0.5)*2.1)
        arpeggio=math.sin(twopi*note*t)*gate*0.023
        # Tictac sintético, suavizado, y pequeño impacto en el inicio del compás
        tick=math.sin(twopi*880*t)*math.exp(-45*beat)*0.09
        click=math.sin(twopi*175*t)*math.exp(-35*(t%4))*0.07
        sample=max(-0.85,min(0.85,pad+arpeggio+tick+click))
        buf.append(int(sample*32767))
    with wave.open(str(path),"wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(buf.tobytes())
    return path
