import React from 'react';
import {AbsoluteFill} from 'remotion';
import {cargarFuentes, MONO, SERIF} from '../style/fonts';
import {E60} from '../e60/nucleo';
import {EstadoTorre, TorreArchivero3D} from './TorreArchivero3D';

cargarFuentes();

// Miniatura (16:9, 1280×720) y portada vertical del escape room 1. Escena real del vídeo + rótulo.
const base = (cam: EstadoTorre['cam']): EstadoTorre => ({
	t: 12.3, cam, pista: {puerta: 0.7}, escudos: [0, 0, 0], losa: 0, criptex: 0, anillos: 0, tapa: 0, descifrado: 0, p13: 0, nicho: 0,
	llave: 0, giroLlave: 0, verdad: 0, vela: 0.35, llama: 1, puerta: 0, sombra: 0, libro: 0, relampago: 0.35, gramofono: 1, antorchas: 1,
});

export const MiniaturaTorre: React.FC<{vertical?: boolean}> = ({vertical}) => {
	const e = base(vertical ? {pos: [0, 1.6, 1.2], mira: [0, 1.75, -4], fov: 74} : {pos: [0, 1.62, 0.9], mira: [0, 1.6, -4], fov: 58});
	return (
		<AbsoluteFill style={{background: '#0a0807'}}>
			<TorreArchivero3D e={e} ancho={vertical ? 720 : 1280} alto={vertical ? 1280 : 720} escala={vertical ? 1080 / 720 : 1} />
			<AbsoluteFill style={{background: vertical ? 'linear-gradient(180deg, rgba(10,8,7,0.85) 0%, rgba(10,8,7,0) 35%, rgba(10,8,7,0) 65%, rgba(10,8,7,0.9) 100%)' : 'linear-gradient(90deg, rgba(10,8,7,0.92) 0%, rgba(10,8,7,0.55) 42%, rgba(10,8,7,0) 70%)'}} />
			<div style={{position: 'absolute', left: vertical ? 60 : 56, right: vertical ? 60 : undefined, top: vertical ? 120 : 150, width: vertical ? undefined : 640, textAlign: vertical ? 'center' : 'left'}}>
				<div style={{fontFamily: MONO, fontWeight: 600, fontSize: vertical ? 34 : 26, letterSpacing: 6, color: E60.cian}}>ESCAPE ROOM · SALA 1</div>
				<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: vertical ? 120 : 96, lineHeight: 0.98, color: E60.blanco, marginTop: 14, textShadow: '0 6px 30px rgba(0,0,0,0.8)'}}>
					¿Saldrías de esta torre?
				</div>
				<div style={{display: 'inline-block', marginTop: 26, background: E60.cian, color: '#0a0807', fontFamily: MONO, fontWeight: 700, fontSize: vertical ? 40 : 30, padding: '10px 20px', borderRadius: 10}}>
					4 CERRADURAS · 1 VELA
				</div>
			</div>
			<div style={{position: 'absolute', right: vertical ? undefined : 40, left: vertical ? 0 : undefined, width: vertical ? '100%' : undefined, textAlign: vertical ? 'center' : 'right', bottom: vertical ? 110 : 34, fontFamily: MONO, fontWeight: 600, fontSize: vertical ? 30 : 22, letterSpacing: 4, color: E60.plata}}>
				ENIGMA 60
			</div>
		</AbsoluteFill>
	);
};
