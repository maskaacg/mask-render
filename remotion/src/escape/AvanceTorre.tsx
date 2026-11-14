import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {cargarFuentes, MONO, OSWALD, SERIF} from '../style/fonts';
import {AnilloDe60, BordeMaqueta, Cabecera, E60, FichasPista, Subtitulo} from '../e60/nucleo';
import {EstadoTorre, LOSA, P, TorreArchivero3D, VENTANA_DEG} from './TorreArchivero3D';
import {relampagos} from './EscapeRoom';

cargarFuentes();

// Avance vertical 9:16 del escape room 1: contexto + primer puzle SIN solución → vídeo completo en YouTube.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
type V3 = [number, number, number];
export type LineaT = {id: string; fase: string; texto: string; voz?: string};
export type FichaT = {id: string; titulo: string; sala: number; pensar_s: number; fps: number; ancho: number; alto: number; aviso_ia: string; lineas: LineaT[]};
export type PropsT = {ficha: FichaT; duraciones: Record<string, number>};
type Tramo = {inicio: number; fin: number};

export const planificarT = ({ficha, duraciones}: PropsT) => {
	let t = 0.8;
	const L: Record<string, Tramo> = {};
	let pensar: Tramo = {inicio: 0, fin: 0};
	let prev: LineaT | null = null;
	for (const l of ficha.lineas) {
		if (prev) {
			if (prev.fase === 'pregunta') {
				pensar = {inicio: t + 0.3, fin: t + 0.3 + ficha.pensar_s};
				t += ficha.pensar_s + 0.8;
			} else if (l.fase === 'archivera' || prev.fase === 'archivera') t += 0.7;
			else t += 0.35;
		}
		const d = duraciones[l.id] ?? 3;
		L[l.id] = {inicio: t, fin: t + d};
		t += d;
		prev = l;
	}
	return {L, pensar, total: t + 4.5};
};

const PLANOS: Record<string, {pos: V3; mira: V3; fov: number}> = {
	ventana: {pos: [0.4, 1.6, 1.4], mira: P(VENTANA_DEG, 4.2, 2.9), fov: 70},
	torre: {pos: [0.3, 1.6, 2.9], mira: [0, 2.2, -3], fov: 78},
	vela: {pos: [-1.2, 1.3, 1.75], mira: [-1.95, 1.0, 2.45], fov: 60},
	mesa: {pos: [-0.75, 1.6, 1.1], mira: [-2.05, 1.0, 2.55], fov: 68},
	suelo: {pos: [-0.8, 1.7, 0.5], mira: [-2.8, 0.3, 0.15], fov: 74},
	escudos: {pos: [-0.55, 1.5, 0.2], mira: [-4.1, 1.35, 0.0], fov: 74},
	ganchos: {pos: [-1.6, 1.6, 0.1], mira: [-4.1, 1.85, 0.0], fov: 66},
	puerta: {pos: [0, 1.6, 0.4], mira: [0, 1.9, -4.1], fov: 76},
};

export const AvanceTorre: React.FC<PropsT> = (props) => {
	const {ficha} = props;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const {L, pensar, total} = planificarT(props);
	const ev: [number, string][] = [
		[0, 'ventana'], [L.t01.inicio + 2.6, 'torre'], [L.t01.fin - 2.8, 'vela'], [L.t02.inicio - 0.3, 'mesa'],
		[L.t03.inicio, 'suelo'], [L.t03.fin - 1.6, 'ganchos'], [L.t05.inicio, 'escudos'], [L.t08.inicio + 0.5, 'puerta'],
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
	const escudosLuz = Math.max(ventana(L.t03), ventana(L.t04), ventana(L.t05), ventana(L.t06), ventana(L.t07), interpolate(t, [pensar.inicio, pensar.inicio + 0.4, pensar.fin, pensar.fin + 0.4], [0, 0.6, 0.6, 0], clamp));
	const lista = relampagos(total);
	let rel = 0;
	for (const r of lista) {
		const d = t - r;
		if (d >= -0.1 && d <= 1.2) rel = Math.max(rel, interpolate(d, [-0.05, 0, 0.08, 0.16, 0.24, 0.6, 1.2], [0, 1, 0.2, 0.85, 0.3, 0.1, 0], clamp));
	}
	const e: EstadoTorre = {
		t, cam: {pos, mira, fov: a.fov + (b.fov - a.fov) * f},
		pista: {escudos: escudosLuz, ventana: ventana(L.t01) * 0.0, mesa: ventana(L.t02) * 0.4, puerta: interpolate(t, [L.t08.inicio, L.t08.inicio + 1], [0, 0.5], clamp)},
		escudos: [0, 0, 0], losa: 0, criptex: 0, anillos: 0, tapa: 0, descifrado: 0, p13: 0, nicho: 0, llave: 0, giroLlave: 0, verdad: 0,
		vela: 1, llama: interpolate(t, [L.t01.fin - 2.0, L.t01.fin - 1.2], [0, 1], clamp), puerta: 0, sombra: 0, libro: 0,
		relampago: rel, gramofono: 1, antorchas: interpolate(t, [0, 1.2], [0.6, 1], clamp),
	};
	void LOSA;
	const pistas = [
		{id: 't04', texto: 'Rojo: no en el 1'},
		{id: 't05', texto: 'Azul: a la derecha del rojo'},
		{id: 't06', texto: 'Verde: no en el 3'},
	].map((p) => ({texto: p.texto, desde: L[p.id].inicio + 0.2, activa: ventana(L[p.id], 0, 0.3)}));
	const linea = ficha.lineas.find((l) => t >= L[l.id].inicio - 0.1 && t < L[l.id].fin + 0.35);
	const cta = interpolate(t, [L.t08.inicio + 0.4, L.t08.inicio + 1.2], [0, 1], clamp);
	const fundido = Math.max(interpolate(t, [0, 0.8], [1, 0], clamp), interpolate(t, [total - 0.8, total], [0, 1], clamp));
	const fr = (s: number) => Math.max(0, Math.round(s * fps));
	return (
		<AbsoluteFill style={{background: '#0a0807', overflow: 'hidden'}}>
			<TorreArchivero3D e={e} ancho={720} alto={1280} escala={1080 / 720} />
			<AbsoluteFill style={{background: '#e8eeff', opacity: rel * 0.12}} />
			<BordeMaqueta />
			<Cabecera t={t} aventura="Escape room" titulo={ficha.titulo} sala={ficha.sala} tituloHasta={L.t03.inicio} />
			<FichasPista t={t} pistas={pistas} hasta={L.t08.inicio} />
			<AnilloDe60 t={t} inicio={pensar.inicio} fin={pensar.fin} />
			{linea && linea.fase !== 'archivera' && <Subtitulo texto={linea.texto} inicio={L[linea.id].inicio} fin={L[linea.id].fin} t={t} />}
			{linea && linea.fase === 'archivera' && (
				<div style={{position: 'absolute', top: 1160, left: 80, right: 80, display: 'flex', justifyContent: 'center', opacity: ventana(L[linea.id], 0.1, 0.2)}}>
					<div style={{background: 'rgba(20,21,26,0.78)', border: `2px solid ${E60.violeta}`, borderRadius: 14, padding: '14px 30px', fontFamily: OSWALD, fontWeight: 500, fontSize: 58, color: E60.violeta, textAlign: 'center'}}>
						<span style={{display: 'block', fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: E60.plata}}>LA ARCHIVERA</span>
						{linea.texto}
					</div>
				</div>
			)}
			{cta > 0 && (
				<div style={{position: 'absolute', top: 470, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: cta, transform: `translateY(${(1 - cta) * 30}px)`}}>
					<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 8, color: E60.cian}}>SOLUCIÓN Y 3 CERRADURAS MÁS</div>
					<div style={{background: 'rgba(20,21,26,0.85)', border: `3px solid ${E60.cian}`, borderRadius: 22, padding: '26px 40px', textAlign: 'center', boxShadow: '0 0 30px rgba(63,224,230,0.35)'}}>
						<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, color: E60.plata, letterSpacing: 4}}>VÍDEO COMPLETO EN YOUTUBE</div>
						<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 78, color: E60.blanco, lineHeight: 1.05, marginTop: 10}}>{ficha.titulo}</div>
						<div style={{fontFamily: MONO, fontSize: 28, color: E60.plata, marginTop: 14}}>ENIGMA 60 · escape room 1</div>
					</div>
					<div style={{fontFamily: MONO, fontSize: 20, color: 'rgba(184,190,200,0.75)', letterSpacing: 2, marginTop: 6}}>{ficha.aviso_ia}</div>
				</div>
			)}
			<AbsoluteFill style={{background: '#0a0807', opacity: fundido}} />
			<SonidoAvance ficha={ficha} L={L} pensar={pensar} total={total} fps={fps} fr={fr} />
		</AbsoluteFill>
	);
};

const SonidoAvance: React.FC<{ficha: FichaT; L: Record<string, Tramo>; pensar: Tramo; total: number; fps: number; fr: (s: number) => number}> = ({ficha, L, pensar, total, fr}) => {
	const sfx = (name: string, at: number, vol = 0.6) => (
		<Sequence from={fr(at)} key={name + at}>
			<Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={vol} />
		</Sequence>
	);
	return (
		<>
			<Audio src={staticFile('audio/sfx/lluvia.wav')} volume={0.3} loop />
			<Audio src={staticFile('audio/sfx/fuego.wav')} volume={0.12} loop />
			<Audio src={staticFile('audio/sfx/gramofono.wav')} volume={0.1} loop />
			{relampagos(total).map((r) => sfx('trueno', r + 0.45, 0.5))}
			{Array.from({length: ficha.pensar_s}, (_, i) => sfx('tic', pensar.inicio + i, 0.45))}
			{sfx('logo', L.t08.inicio + 0.4, 0.45)}
			{ficha.lineas.map((l) => (
				<Sequence key={l.id} from={fr(L[l.id].inicio)}>
					<Audio src={staticFile(`audio/${ficha.id}/${l.id}.wav`)} volume={1} />
				</Sequence>
			))}
		</>
	);
};

export const AvanceTorreAudio: React.FC<PropsT> = (props) => {
	const {fps} = useVideoConfig();
	const {L, pensar, total} = planificarT(props);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<SonidoAvance ficha={props.ficha} L={L} pensar={pensar} total={total} fps={fps} fr={(s) => Math.max(0, Math.round(s * fps))} />
		</AbsoluteFill>
	);
};
