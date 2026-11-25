import React from 'react';
import {AbsoluteFill} from 'remotion';
import {cargarFuentes, MONO, SERIF} from '../style/fonts';
import {E60} from '../e60/nucleo';
import {EstadoMuseo, Museo3D, VITRINA_Z} from './Museo3D';

cargarFuentes();

// Miniatura (16:9, 1280×720) y portada vertical del escape room 2. Escena real del vídeo + rótulo.
const base = (cam: EstadoMuseo['cam']): EstadoMuseo => ({
	t: 7.3, cam, pista: {vitrinas: 0.8}, minutos: 24, luces: [0.55, 1, 0, 0, 0], rejas: [1, 0, 0, 0], moneda: 1, panos: 0, placas: 0, retrato: 0,
	ruedas: 0, caja: 0, balanza: 0, dial: 0, gatoRoto: 0, mapa: 0, cabezas: 0, verdad: 0, puerta: 0, calle: 0, alarma: 0.5, escaparate: 0, luna: 1,
});

export const MiniaturaMuseo: React.FC<{vertical?: boolean}> = ({vertical}) => {
	const e = base(vertical ? {pos: [0, 1.75, -7.2], mira: [0, 1.1, VITRINA_Z], fov: 82} : {pos: [-0.6, 1.6, -7.7], mira: [0.6, 1.15, VITRINA_Z], fov: 56});
	return (
		<AbsoluteFill style={{background: '#08080c'}}>
			<Museo3D e={e} ancho={vertical ? 720 : 1280} alto={vertical ? 1280 : 720} escala={vertical ? 1080 / 720 : 1} />
			<AbsoluteFill style={{background: vertical ? 'linear-gradient(180deg, rgba(8,8,12,0.85) 0%, rgba(8,8,12,0) 35%, rgba(8,8,12,0) 65%, rgba(8,8,12,0.9) 100%)' : 'linear-gradient(90deg, rgba(8,8,12,0.92) 0%, rgba(8,8,12,0.55) 42%, rgba(8,8,12,0) 70%)'}} />
			<div style={{position: 'absolute', left: vertical ? 60 : 56, right: vertical ? 60 : undefined, top: vertical ? 120 : 150, width: vertical ? undefined : 640, textAlign: vertical ? 'center' : 'left'}}>
				<div style={{fontFamily: MONO, fontWeight: 600, fontSize: vertical ? 34 : 26, letterSpacing: 6, color: E60.cian}}>ESCAPE ROOM · SALA 2</div>
				<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: vertical ? 120 : 96, lineHeight: 0.98, color: E60.blanco, marginTop: 14, textShadow: '0 6px 30px rgba(0,0,0,0.8)'}}>
					Todo aquí te miente
				</div>
				<div style={{display: 'inline-block', marginTop: 26, background: E60.cian, color: '#08080c', fontFamily: MONO, fontWeight: 700, fontSize: vertical ? 40 : 30, padding: '10px 20px', borderRadius: 10}}>
					4 SALAS · 30 MINUTOS
				</div>
			</div>
			<div style={{position: 'absolute', right: vertical ? undefined : 40, left: vertical ? 0 : undefined, width: vertical ? '100%' : undefined, textAlign: vertical ? 'center' : 'right', bottom: vertical ? 110 : 34, fontFamily: MONO, fontWeight: 600, fontSize: vertical ? 30 : 22, letterSpacing: 4, color: E60.plata}}>
				ENIGMA 60
			</div>
		</AbsoluteFill>
	);
};
