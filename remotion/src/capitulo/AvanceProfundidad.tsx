import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {cargarFuentes, MONO, SERIF} from '../style/fonts';
import {AnilloDe60, BordeMaqueta, E60, FichasPista, Subtitulo} from '../e60/nucleo';
import {FichaT, PropsT, V3, planificarT} from '../escape/AvanceTorre';
import {EstadoCap, SalaCapitulo3D} from './SalaCapitulo3D';

cargarFuentes();

// ENIGMA 60 · Avance vertical 9:16 de «Profundidad 600» cap. 1 «La sala de lastre»:
// apertura por radio + puzle 1 (el cuaderno boca abajo) SIN solución → capítulo completo en YouTube.
// Misma sala 3D que el capítulo (SalaCapitulo3D a 720x1280) y mismas voces v2.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
type Tramo = {inicio: number; fin: number};

// Planos del capítulo con más campo (el fov es vertical: en 9:16 hay que abrirlo para no perder la sala).
const PLANOS: Record<string, {pos: V3; mira: V3; fov: number}> = {
	pasillo: {pos: [0.5, 0.35, 5.3], mira: [-0.2, 0.05, -3.0], fov: 74},
	suelo: {pos: [0.3, -0.7, 4.7], mira: [0.25, -1.55, 3.2], fov: 72},
	sala: {pos: [0.9, 0.3, 5.2], mira: [-0.3, -0.1, -2.0], fov: 76},
	caja: {pos: [1.0, -0.55, 4.35], mira: [0.75, -1.45, 3.0], fov: 66},
	cuaderno: {pos: [0.84, -0.88, 3.62], mira: [0.75, -1.45, 2.98], fov: 62},
	pensar: {pos: [0.95, -0.5, 4.3], mira: [0.75, -1.3, 2.95], fov: 70},
};

const HABLA: Record<string, [string, string]> = {
	archivera: ['ALMA · RADIO DEL VIGÍA', '#F2B35B'],
	conservador: ['DAMIÁN · RADIO DEL VIGÍA', '#9FD18B'],
};

const camara = (t: number, L: Record<string, Tramo>, pensar: Tramo): EstadoCap['cam'] => {
	const ev: [number, string][] = [
		[0, 'pasillo'], [L.n01.inicio - 0.6, 'suelo'], [L.n03.inicio - 0.4, 'sala'], [L.n06.inicio - 0.6, 'caja'],
		[L.n07.inicio + 1.5, 'cuaderno'], [L.r01.inicio - 0.3, 'caja'], [L.n11.inicio, 'cuaderno'], [pensar.inicio + 0.5, 'pensar'],
	];
	let k = 0;
	for (let i = 0; i < ev.length; i++) if (t >= ev[i][0]) k = i;
	const f = interpolate(t, [ev[k][0], ev[k][0] + 1.8], [0, 1], {...clamp, easing: io});
	const a = PLANOS[ev[Math.max(0, k - 1)][1]];
	const b = PLANOS[ev[k][1]];
	const mix = (x: V3, y: V3) => [0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * f) as V3;
	const pos = mix(a.pos, b.pos);
	const mira = mix(a.mira, b.mira);
	// empuje lento hacia el objeto + balanceo continuo del submarino (evita segundos congelados en la QA)
	const sig = ev[k + 1]?.[0] ?? t + 8;
	const push = interpolate(t, [ev[k][0] + 1.8, sig], [0, 0.08], clamp);
	for (let i = 0; i < 3; i++) pos[i] += (mira[i] - pos[i]) * push;
	pos[0] += Math.sin(t * 0.7) * 0.05 + Math.sin(t * 0.23) * 0.04;
	pos[1] += Math.sin(t * 0.53 + 1) * 0.035;
	mira[0] += Math.sin(t * 0.41 + 2) * 0.06;
	mira[1] += Math.sin(t * 0.31 + 0.5) * 0.03;
	return {pos, mira, fov: a.fov + (b.fov - a.fov) * f};
};

export const AvanceProfundidad: React.FC<PropsT> = (props) => {
	const ficha = props.ficha as FichaT & {temporada?: string; capitulo?: number};
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const {L, pensar, total} = planificarT(props);
	const v = (x: Tramo, pre = 0.3, post = 0.5) => interpolate(t, [x.inicio - pre, x.inicio, x.fin + post, x.fin + post + 0.5], [0, 1, 1, 0], clamp);
	const pistaCaja = Math.max(
		interpolate(t, [L.n06.inicio - 0.3, L.n06.inicio, L.r01.fin + 0.4, L.r01.fin + 0.9], [0, 1, 1, 0], clamp),
		interpolate(t, [pensar.inicio, pensar.inicio + 0.5, pensar.fin, pensar.fin + 0.5], [0, 0.55, 0.55, 0], clamp),
	);
	const e: EstadoCap = {
		t, cam: camara(t, L, pensar), agua: interpolate(t, [0, total], [-1.64, -1.56], clamp), agujas: [0, 0, 0], pista: {caja: pistaCaja},
		valvulas: [0, 0, 0], escotilla: 0, violeta: 0, guante: {visible: interpolate(t, [L.n01.inicio, L.n01.inicio + 0.7, L.n01.fin + 0.3, L.n01.fin + 1.0], [0, 1, 1, 0], clamp), pos: [0.28, -1.5, 3.6], rot: [0.35, 0.3, 0]},
		alarma: 1, soplado: 0, linterna: 0, energia: 0, inclinacion: 0, caja: 0, linternaEnCaja: 0, cajon: 0, fusible: 0, chispa: 0,
		brazo: 0, pesas: [0, 0, 0], relojMin: 190, armario: 0, indicador: 0, altavoz: 0,
	};
	const pistas = [
		{id: 'n09', texto: 'En la tapa se lee: 16'},
		{id: 'n10', texto: 'El cuaderno flota boca abajo'},
		{id: 'n11', texto: 'Candado de 2 dígitos'},
	].map((p) => ({texto: p.texto, desde: L[p.id].inicio + 0.3, activa: v(L[p.id], 0.05, 0.3)}));
	const linea = ficha.lineas.find((l) => t >= L[l.id].inicio - 0.1 && t < L[l.id].fin + 0.35);
	const quien = linea?.voz ? HABLA[linea.voz] : undefined;
	const cta = interpolate(t, [L.t99.inicio + 0.4, L.t99.inicio + 1.2], [0, 1], clamp);
	const cab = interpolate(t, [0.4, 1.2], [0, 1], clamp);
	const tit = interpolate(t, [L.n03.inicio, L.n03.inicio + 0.8, L.n06.inicio - 0.4, L.n06.inicio + 0.4], [0, 1, 1, 0], clamp);
	const oscuro = interpolate(t, [0, 2.0, L.g03.fin, L.n01.inicio + 0.5], [0.85, 0.55, 0.55, 0], clamp);
	const fundido = Math.max(interpolate(t, [0, 0.8], [1, 0], clamp), interpolate(t, [total - 0.8, total], [0, 1], clamp));
	const radio = linea && quien ? interpolate(t, [L[linea.id].inicio - 0.1, L[linea.id].inicio + 0.2], [0, 1], clamp) : 0;
	return (
		<AbsoluteFill style={{background: '#0b0f12', overflow: 'hidden'}}>
			<SalaCapitulo3D e={e} ancho={720} alto={1280} escala={1080 / 720} />
			<AbsoluteFill style={{background: '#fff4e0', opacity: 0.016 + 0.016 * Math.sin(t * 1.7) + 0.006 * Math.sin(t * 5.3)}} />
			<AbsoluteFill style={{background: '#0b0f12', opacity: oscuro}} />
			<BordeMaqueta />
			<div style={{position: 'absolute', top: 92, left: 70, right: 70, opacity: cab}}>
				<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 24, letterSpacing: 4, color: E60.plata}}>
					<span style={{color: E60.cian}}>E60</span> · {(ficha.temporada ?? 'Profundidad 600').toUpperCase()} · CAP. {String(ficha.capitulo ?? 1).padStart(2, '0')}
				</div>
				<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 76, color: E60.blanco, opacity: tit, marginTop: 10, lineHeight: 1, transform: `translateY(${(1 - tit) * 14}px)`}}>
					{ficha.titulo}
				</div>
			</div>
			<FichasPista t={t} pistas={pistas} hasta={L.t99.inicio} />
			<AnilloDe60 t={t} inicio={pensar.inicio} fin={pensar.fin} />
			{quien && (
				<div style={{position: 'absolute', top: 1098, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: radio}}>
					<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 28, letterSpacing: 4, color: quien[1], background: 'rgba(16,17,21,0.92)', border: `2px solid ${quien[1]}`, borderRadius: 10, padding: '6px 16px'}}>
						📻 {quien[0]}
					</div>
				</div>
			)}
			{linea && <Subtitulo texto={linea.texto} inicio={L[linea.id].inicio} fin={L[linea.id].fin} t={t} />}
			{cta > 0 && (
				<div style={{position: 'absolute', top: 430, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: cta, transform: `translateY(${(1 - cta) * 30}px)`}}>
					<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 8, color: E60.cian, background: 'rgba(16,17,21,0.96)', padding: '8px 18px', borderRadius: 10}}>SOLUCIÓN Y 3 PUZLES MÁS</div>
					<div style={{background: 'rgba(16,17,21,0.96)', border: `3px solid ${E60.cian}`, borderRadius: 22, padding: '26px 40px', textAlign: 'center', boxShadow: '0 0 30px rgba(63,224,230,0.35)'}}>
						<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, color: E60.plata, letterSpacing: 4}}>CAPÍTULO COMPLETO EN YOUTUBE</div>
						<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 84, color: E60.blanco, lineHeight: 1.05, marginTop: 10}}>{ficha.temporada ?? 'Profundidad 600'}</div>
						<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 52, color: E60.blanco, marginTop: 8}}>Cap. {ficha.capitulo ?? 1} · {ficha.titulo}</div>
						<div style={{fontFamily: MONO, fontSize: 28, color: E60.plata, marginTop: 14}}>ENIGMA 60 · serie</div>
					</div>
					<div style={{fontFamily: MONO, fontSize: 22, color: E60.plata, letterSpacing: 2, marginTop: 6, background: 'rgba(16,17,21,0.96)', padding: '6px 14px', borderRadius: 8}}>{ficha.aviso_ia}</div>
				</div>
			)}
			<AbsoluteFill style={{background: '#08080c', opacity: fundido}} />
			<SonidoAvanceProfundidad ficha={ficha} L={L} pensar={pensar} total={total} fr={(s) => Math.max(0, Math.round(s * fps))} />
		</AbsoluteFill>
	);
};

const SonidoAvanceProfundidad: React.FC<{ficha: FichaT; L: Record<string, Tramo>; pensar: Tramo; total: number; fr: (s: number) => number}> = ({ficha, L, pensar, total, fr}) => {
	const sfx = (name: string, at: number, vol = 0.6) => (
		<Sequence from={fr(at)} key={name + at}>
			<Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={vol} />
		</Sequence>
	);
	const gotas = Array.from({length: Math.floor(total / 2.7)}, (_, i) => 1.2 + i * 2.7 + (i % 3) * 0.5);
	return (
		<>
			<Audio src={staticFile('audio/sfx/ambiente.wav')} volume={0.4} loop />
			{sfx('sonar', 0.4, 0.3)}
			{sfx('golpe', L.n01.inicio - 0.6, 0.7)}
			{sfx('alarma', L.n01.inicio, 0.25)}
			{sfx('casco', L.n03.inicio + 1.0, 0.45)}
			{gotas.map((g) => sfx('gota', g, 0.15))}
			{Array.from({length: ficha.pensar_s}, (_, i) => sfx('tic', pensar.inicio + i, 0.45))}
			{sfx('logo', L.t99.inicio + 0.4, 0.45)}
			{ficha.lineas.map((l) => (
				<Sequence key={l.id} from={fr(L[l.id].inicio)}>
					<Audio src={staticFile(`audio/${ficha.id}/${l.id}.wav`)} volume={1} />
				</Sequence>
			))}
		</>
	);
};

export const AvanceProfundidadAudio: React.FC<PropsT> = (props) => {
	const {L, pensar, total} = planificarT(props);
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<SonidoAvanceProfundidad ficha={props.ficha} L={L} pensar={pensar} total={total} fr={(s) => Math.max(0, Math.round(s * fps))} />
		</AbsoluteFill>
	);
};
