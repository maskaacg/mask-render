import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {cargarFuentes, MONO, SERIF} from '../style/fonts';
import {AnilloDe60, BordeMaqueta, Cabecera, E60, FichasPista, Subtitulo} from '../e60/nucleo';
import {FichaT, PropsT, V3, planificarT} from './AvanceTorre';
import {EstadoObservatorio, Observatorio3D, SALAS} from './Observatorio3D';
import {centroPuzle, planosSala} from '../salas/SalaCorto3D';

cargarFuentes();

// Avance vertical 9:16 del escape room 3: contexto + primer puzle (el montón de cajas) SIN solución → vídeo completo en YouTube.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
type Tramo = {inicio: number; fin: number};

const S = SALAS.almacen;
const ZC = centroPuzle(S)[2] - 0.6;
const base = planosSala(S);
const PLANOS: Record<string, {pos: V3; mira: V3; fov: number}> = {
	entrada: base.entrada,
	detalle: base.detalle,
	puerta: base.puerta,
	cajas: {pos: [0.5, 2.0, ZC + 2.6], mira: [0, 0.55, ZC], fov: 66},
	tapas: {pos: [0.2, 2.6, ZC + 1.5], mira: [-0.1, 0.6, ZC - 0.1], fov: 66},
	esquina: {pos: [1.0, 1.75, ZC + 2.5], mira: [0.25, 0.45, ZC], fov: 62},
	pensar: {pos: [0.5, 1.85, ZC + 3.0], mira: [0, 1.3, ZC], fov: 66},
};

const estado = (t: number, L: Record<string, Tramo>, pensar: Tramo): EstadoObservatorio => {
	const ev: [number, string][] = [
		[0, 'entrada'], [L.t02.inicio, 'detalle'], [L.t03.inicio - 0.3, 'cajas'], [L.t03.fin - 1.5, 'puerta'], [L.t04.inicio, 'tapas'],
		[L.t05.inicio + 2.5, 'esquina'], [L.t05.fin - 1.8, 'cajas'], [L.t06.inicio, 'pensar'],
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
	const foco = Math.max(
		interpolate(t, [L.t04.inicio - 0.3, L.t04.inicio, L.t05b.fin, L.t05b.fin + 0.5], [0, 0.7, 0.7, 0], clamp),
		interpolate(t, [pensar.inicio, pensar.inicio + 0.4, pensar.fin, pensar.fin + 0.4], [0, 0.6, 0.6, 0], clamp),
	);
	return {sala: 'almacen', base: {t, cam: {pos, mira, fov: a.fov + (b.fov - a.fov) * f}, puerta: 0, foco}, cajas: {separa: 0, piso: [0, 0, 0], foco: 0}};
};

export const AvanceObservatorio: React.FC<PropsT> = (props) => {
	const {ficha} = props;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const {L, pensar, total} = planificarT(props);
	const e = estado(t, L, pensar);
	const ventana = (x: Tramo, pre = 0.3, post = 0.6) => interpolate(t, [x.inicio - pre, x.inicio, x.fin + post, x.fin + post + 0.5], [0, 1, 1, 0], clamp);
	const pistas = [
		{id: 't04', texto: 'Código = número de cajas'},
		{id: 't04', texto: 'Ninguna caja flota'},
		{id: 't05', texto: 'Base 3 × 3 · sin la esquina delantera derecha'},
	].map((p, i) => ({texto: p.texto, desde: L[p.id].inicio + 0.2 + (i === 1 ? (L.t04.fin - L.t04.inicio) * 0.5 : 0), activa: ventana(L[p.id], 0.05, 0.3)}));
	const linea = ficha.lineas.find((l) => t >= L[l.id].inicio - 0.1 && t < L[l.id].fin + 0.35);
	const cta = interpolate(t, [L.t07.inicio + 0.4, L.t07.inicio + 1.2], [0, 1], clamp);
	const fundido = Math.max(interpolate(t, [0, 0.8], [1, 0], clamp), interpolate(t, [total - 0.8, total], [0, 1], clamp));
	const fr = (s: number) => Math.max(0, Math.round(s * fps));
	return (
		<AbsoluteFill style={{background: '#08080c', overflow: 'hidden'}}>
			<Observatorio3D e={e} ancho={720} alto={1280} escala={1080 / 720} />
			<BordeMaqueta />
			<Cabecera t={t} aventura="Escape room" titulo={ficha.titulo} sala={ficha.sala} tituloHasta={L.t03.inicio} />
			<FichasPista t={t} pistas={pistas} hasta={L.t07.inicio} />
			<AnilloDe60 t={t} inicio={pensar.inicio} fin={pensar.fin} />
			{linea && <Subtitulo texto={linea.texto} inicio={L[linea.id].inicio} fin={L[linea.id].fin} t={t} />}
			{cta > 0 && (
				<div style={{position: 'absolute', top: 470, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: cta, transform: `translateY(${(1 - cta) * 30}px)`}}>
					<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 8, color: E60.cian, background: 'rgba(16,17,21,0.96)', padding: '8px 18px', borderRadius: 10}}>SOLUCIÓN Y 3 SALAS MÁS</div>
					<div style={{background: 'rgba(16,17,21,0.96)', border: `3px solid ${E60.cian}`, borderRadius: 22, padding: '26px 40px', textAlign: 'center', boxShadow: '0 0 30px rgba(63,224,230,0.35)'}}>
						<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, color: E60.plata, letterSpacing: 4}}>VÍDEO COMPLETO EN YOUTUBE</div>
						<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 78, color: E60.blanco, lineHeight: 1.05, marginTop: 10}}>{ficha.titulo}</div>
						<div style={{fontFamily: MONO, fontSize: 28, color: E60.plata, marginTop: 14}}>ENIGMA 60 · escape room {ficha.sala}</div>
					</div>
					<div style={{fontFamily: MONO, fontSize: 22, color: E60.plata, letterSpacing: 2, marginTop: 6, background: 'rgba(16,17,21,0.96)', padding: '6px 14px', borderRadius: 8}}>{ficha.aviso_ia}</div>
				</div>
			)}
			<AbsoluteFill style={{background: '#08080c', opacity: fundido}} />
			<SonidoAvanceObservatorio ficha={ficha} L={L} pensar={pensar} fr={fr} />
		</AbsoluteFill>
	);
};

const SonidoAvanceObservatorio: React.FC<{ficha: FichaT; L: Record<string, Tramo>; pensar: Tramo; fr: (s: number) => number}> = ({ficha, L, pensar, fr}) => {
	const sfx = (name: string, at: number, vol = 0.6) => (
		<Sequence from={fr(at)} key={name + at}>
			<Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={vol} />
		</Sequence>
	);
	return (
		<>
			<Audio src={staticFile('audio/sfx/viento.wav')} volume={0.14} loop />
			<Audio src={staticFile('audio/sfx/musica.wav')} volume={0.1} loop />
			{sfx('golpe', 0.3, 0.5)}
			{sfx('apagar', L.t03.inicio - 0.4, 0.35)}
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

export const AvanceObservatorioAudio: React.FC<PropsT> = (props) => {
	const {L, pensar} = planificarT(props);
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<SonidoAvanceObservatorio ficha={props.ficha} L={L} pensar={pensar} fr={(s) => Math.max(0, Math.round(s * fps))} />
		</AbsoluteFill>
	);
};
