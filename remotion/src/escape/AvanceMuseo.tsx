import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {cargarFuentes, MONO, OSWALD, SERIF} from '../style/fonts';
import {AnilloDe60, BordeMaqueta, Cabecera, E60, FichasPista, Subtitulo} from '../e60/nucleo';
import {EstadoMuseo, Museo3D, RELOJ, VITRINA_Z, VITRINAS_X} from './Museo3D';
import {FichaT, PropsT, V3, planificarT} from './AvanceTorre';

cargarFuentes();

// Avance vertical 9:16 del escape room 2: contexto + primer puzle (las tres vitrinas) SIN solución → vídeo completo en YouTube.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
type Tramo = {inicio: number; fin: number};

const PLANOS: Record<string, {pos: V3; mira: V3; fov: number}> = {
	esfera: {pos: [-3.3, 2.5, -3.2], mira: [RELOJ[0], 2.5, RELOJ[2]], fov: 56},
	vestibulo: {pos: [1.0, 1.7, -0.2], mira: [-0.3, 1.9, -6.5], fov: 80},
	conservador: {pos: [2.6, 2.1, -2.6], mira: [4.6, 2.2, -3], fov: 64},
	monedas: {pos: [0, 1.85, -6.4], mira: [0, 1.0, VITRINA_Z], fov: 84},
	placas: {pos: [0, 1.15, -8.2], mira: [0, 0.75, VITRINA_Z], fov: 78},
	v2: {pos: [1.3, 1.5, -8.7], mira: [VITRINAS_X[2], 1.2, VITRINA_Z], fov: 64},
	vitrinas: {pos: [0, 1.7, -7.6], mira: [0, 1.1, VITRINA_Z], fov: 82},
};

const estado = (t: number, L: Record<string, Tramo>, pensar: Tramo): EstadoMuseo => {
	const ev: [number, string][] = [
		[0, 'esfera'], [L.t01.fin - 1.4, 'vestibulo'], [L.t02.inicio - 0.3, 'conservador'],
		[L.t03.inicio, 'monedas'], [L.t03.fin - 1.2, 'placas'], [L.t05.inicio, 'v2'], [L.t06.inicio, 'vitrinas'],
	];
	let k = 0;
	for (let i = 0; i < ev.length; i++) if (t >= ev[i][0]) k = i;
	const f = interpolate(t, [ev[k][0], ev[k][0] + 1.6], [0, 1], {...clamp, easing: io});
	const a = PLANOS[ev[Math.max(0, k - 1)][1]];
	const b = PLANOS[ev[k][1]];
	const mix = (x: V3, y: V3) => [0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * f) as V3;
	const pos = mix(a.pos, b.pos);
	const mira = mix(a.mira, b.mira);
	pos[0] += Math.sin(t * 0.6) * 0.02;
	pos[1] += Math.sin(t * 0.47 + 1) * 0.015;
	const ventana = (x: Tramo, pre = 0.3, post = 0.6) => interpolate(t, [x.inicio - pre, x.inicio, x.fin + post, x.fin + post + 0.5], [0, 1, 1, 0], clamp);
	const piensa = interpolate(t, [pensar.inicio, pensar.inicio + 0.4, pensar.fin, pensar.fin + 0.4], [0, 0.6, 0.6, 0], clamp);
	// la monedas de las vitrinas siguen tapadas: el avance no da pistas extra
	const reja = interpolate(t, [L.t03.inicio - 2.2, L.t03.inicio - 0.2], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return {
		t, cam: {pos, mira, fov: a.fov + (b.fov - a.fov) * f},
		pista: {reloj: ventana(L.t01) * 0.5, vitrinas: Math.max(ventana(L.t03), ventana(L.t04), ventana(L.t06), piensa) * 0.7, v0: ventana(L.t03) * 0.4, v1: ventana(L.t03) * 0.4, v2: ventana(L.t05)},
		minutos: interpolate(t, [0, 60], [0, 4], clamp),
		luces: [0.55, reja, 0, 0, 0],
		rejas: [reja, 0, 0, 0],
		moneda: interpolate(t, [L.t05.inicio + 0.6, L.t05.inicio + 2.0], [0, 1], clamp),
		panos: 0, placas: 0, retrato: 0, ruedas: 0, caja: 0, balanza: 0, dial: 0, gatoRoto: 0, mapa: 0, cabezas: 0, verdad: 0,
		puerta: 0, calle: 0, alarma: 0, escaparate: 0, luna: 1,
	};
};

export const AvanceMuseo: React.FC<PropsT> = (props) => {
	const {ficha} = props;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const {L, pensar, total} = planificarT(props);
	const e = estado(t, L, pensar);
	const ventana = (x: Tramo, pre = 0.3, post = 0.6) => interpolate(t, [x.inicio - pre, x.inicio, x.fin + post, x.fin + post + 0.5], [0, 1, 1, 0], clamp);
	const pistas = [
		{id: 't03', texto: 'Placas: ORO · PLATA · ORO Y PLATA'},
		{id: 't04', texto: 'Las tres placas mienten'},
		{id: 't05', texto: 'De «Oro y plata» sale PLATA'},
	].map((p) => ({texto: p.texto, desde: L[p.id].inicio + 0.2, activa: ventana(L[p.id], 0.05, 0.3)}));
	const linea = ficha.lineas.find((l) => t >= L[l.id].inicio - 0.1 && t < L[l.id].fin + 0.35);
	const cta = interpolate(t, [L.t07.inicio + 0.4, L.t07.inicio + 1.2], [0, 1], clamp);
	const fundido = Math.max(interpolate(t, [0, 0.8], [1, 0], clamp), interpolate(t, [total - 0.8, total], [0, 1], clamp));
	const fr = (s: number) => Math.max(0, Math.round(s * fps));
	const personaje = linea && linea.fase === 'conservador';
	return (
		<AbsoluteFill style={{background: '#08080c', overflow: 'hidden'}}>
			<Museo3D e={e} ancho={720} alto={1280} escala={1080 / 720} />
			<BordeMaqueta />
			<Cabecera t={t} aventura="Escape room" titulo={ficha.titulo} sala={ficha.sala} tituloHasta={L.t03.inicio} />
			<FichasPista t={t} pistas={pistas} hasta={L.t07.inicio} />
			<AnilloDe60 t={t} inicio={pensar.inicio} fin={pensar.fin} />
			{linea && !personaje && <Subtitulo texto={linea.texto} inicio={L[linea.id].inicio} fin={L[linea.id].fin} t={t} />}
			{linea && personaje && (
				<div style={{position: 'absolute', top: 1160, left: 80, right: 80, display: 'flex', justifyContent: 'center', opacity: ventana(L[linea.id], 0.1, 0.2)}}>
					<div style={{background: 'rgba(16,17,21,0.92)', border: '2px solid #d9b25a', borderRadius: 14, padding: '14px 30px', fontFamily: OSWALD, fontWeight: 500, fontSize: 58, color: '#d9b25a', textAlign: 'center'}}>
						<span style={{display: 'block', fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: E60.plata}}>EL CONSERVADOR</span>
						{linea.texto}
					</div>
				</div>
			)}
			{cta > 0 && (
				<div style={{position: 'absolute', top: 470, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: cta, transform: `translateY(${(1 - cta) * 30}px)`}}>
					<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 8, color: E60.cian, background: 'rgba(16,17,21,0.96)', padding: '8px 18px', borderRadius: 10}}>SOLUCIÓN Y 3 SALAS MÁS</div>
					<div style={{background: 'rgba(16,17,21,0.96)', border: `3px solid ${E60.cian}`, borderRadius: 22, padding: '26px 40px', textAlign: 'center', boxShadow: '0 0 30px rgba(63,224,230,0.35)'}}>
						<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, color: E60.plata, letterSpacing: 4}}>VÍDEO COMPLETO EN YOUTUBE</div>
						<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 78, color: E60.blanco, lineHeight: 1.05, marginTop: 10}}>{ficha.titulo}</div>
						<div style={{fontFamily: MONO, fontSize: 28, color: E60.plata, marginTop: 14}}>ENIGMA 60 · escape room {ficha.sala}</div>
					</div>
					<div style={{fontFamily: MONO, fontSize: 22, color: E60.plata, letterSpacing: 2, marginTop: 6, background: 'rgba(16,17,21,0.92)', padding: '6px 14px', borderRadius: 8}}>{ficha.aviso_ia}</div>
				</div>
			)}
			<AbsoluteFill style={{background: '#08080c', opacity: fundido}} />
			<SonidoAvanceMuseo ficha={ficha} L={L} pensar={pensar} fr={fr} />
		</AbsoluteFill>
	);
};

const SonidoAvanceMuseo: React.FC<{ficha: FichaT; L: Record<string, Tramo>; pensar: Tramo; fr: (s: number) => number}> = ({ficha, L, pensar, fr}) => {
	const sfx = (name: string, at: number, vol = 0.6) => (
		<Sequence from={fr(at)} key={name + at}>
			<Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={vol} />
		</Sequence>
	);
	return (
		<>
			<Audio src={staticFile('audio/sfx/tictac.wav')} volume={0.25} loop />
			<Audio src={staticFile('audio/sfx/musica.wav')} volume={0.1} loop />
			{sfx('campanadas', 0.2, 0.45)}
			{sfx('cerrojo', L.t03.inicio - 2.4, 0.45)}
			{sfx('bisagra', L.t03.inicio - 2.1, 0.4)}
			{sfx('cristal', L.t05.inicio + 0.5, 0.4)}
			{Array.from({length: ficha.pensar_s}, (_, i) => sfx('tic', pensar.inicio + i, 0.45))}
			{sfx('logo', L.t07.inicio + 0.4, 0.45)}
			{ficha.lineas.map((l) => (
				<Sequence key={l.id} from={fr(L[l.id].inicio)}>
					<Audio src={staticFile(`audio/${ficha.id}/${l.id}.wav`)} volume={1} />
				</Sequence>
			))}
		</>
	);
};

export const AvanceMuseoAudio: React.FC<PropsT> = (props) => {
	const {L, pensar} = planificarT(props);
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<SonidoAvanceMuseo ficha={props.ficha} L={L} pensar={pensar} fr={(s) => Math.max(0, Math.round(s * fps))} />
		</AbsoluteFill>
	);
};
