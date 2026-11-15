import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate as interpolateRaw, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {cargarFuentes} from '../style/fonts';
import {CortinaEngranajes, E60} from '../e60/nucleo';
import {PlanC, PropsC, planificarC} from '../capitulo/plan';
import {Anillo16, BordeMaqueta16, Cabecera16, Fichas16, Proximo, Recuento, RotuloPuzle, Subtitulo16, TituloCapitulo} from '../capitulo/ui';
import {BALANZA, ESCAPARATE, EstadoMuseo, GATOS_Z, GATO_FALSO, Museo3D, RELOJ, RETRATO, VITRINA_Z, VITRINAS_X, gatoX} from './Museo3D';
import {ExpBalanza, ExpRomanos, ExpVigilantes, ExpVitrinas, RelojHUD} from './uiMuseo';
import {ChipNarrativo, PantallaFinal} from './EscapeRoom';

cargarFuentes();

// ENIGMA 60 · Escape room independiente 2 «El museo que miente» (16:9). Coreografía ligada a la ficha E60-ER-002.
const interpolate = (input: number, inputRange: readonly number[], outputRange: readonly number[], options?: Parameters<typeof interpolateRaw>[3]): number => {
	const r = [...inputRange];
	for (let i = 1; i < r.length; i++) if (!(r[i] > r[i - 1])) r[i] = r[i - 1] + 0.001;
	return interpolateRaw(input, r, outputRange as number[], options) as number;
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
type V3 = [number, number, number];
const COLOR_CONSERVADOR = '#d9b25a';

export const PLANOS_MUSEO: Record<string, {pos: V3; mira: V3; fov?: number}> = {
	inicio: {pos: [0, 1.65, 1.5], mira: [0, 1.8, -6], fov: 60},
	cupula: {pos: [0, 1.5, -0.6], mira: [0, 4.6, -3.2], fov: 68},
	reloj: {pos: [-2.0, 1.9, -2.6], mira: [RELOJ[0], 2.0, RELOJ[2]], fov: 50},
	relojEsfera: {pos: [-3.25, 2.5, -3.2], mira: [RELOJ[0], 2.5, RELOJ[2]], fov: 40},
	conservador: {pos: [2.2, 2.0, -2.4], mira: [4.6, 2.2, -3], fov: 46},
	vestibulo: {pos: [1.4, 1.75, -0.4], mira: [-0.6, 1.6, -7], fov: 62},
	monedas: {pos: [0, 1.75, -6.6], mira: [0, 1.1, -10.2], fov: 58},
	vitrinas: {pos: [0, 1.95, -6.9], mira: [0, 1.05, VITRINA_Z], fov: 62},
	placas: {pos: [0, 1.15, -7.9], mira: [0, 0.75, VITRINA_Z], fov: 64},
	v2: {pos: [0.95, 1.7, -8.1], mira: [VITRINAS_X[2] - 0.2, 1.35, VITRINA_Z], fov: 50},
	pintura: {pos: [1.6, 1.75, -12.6], mira: [-2.6, 1.8, -15.6], fov: 60},
	retrato: {pos: [-1.3, 1.95, -15.0], mira: RETRATO, fov: 52},
	placaRetrato: {pos: [-3.25, 1.2, -15.0], mira: [RETRATO[0], 0.74, RETRATO[2]], fov: 42},
	caja: {pos: [-2.4, 1.95, -14.55], mira: [RETRATO[0], 1.95, RETRATO[2]], fov: 46},
	egipcia: {pos: [0, 1.8, -18.7], mira: [0, 1.0, -22.5], fov: 62},
	gatos: {pos: [0, 1.5, -20.5], mira: [0, 1.15, GATOS_Z], fov: 56},
	gatoFalso: {pos: [gatoX(GATO_FALSO) - 0.2, 1.6, -20.7], mira: [gatoX(GATO_FALSO), 1.2, GATOS_Z], fov: 50},
	balanza: {pos: [1.15, 1.65, -19.3], mira: [BALANZA[0], 1.3, BALANZA[2]], fov: 48},
	salida: {pos: [0, 1.7, -24.5], mira: [0, 1.4, -28], fov: 62},
	vg1: {pos: [-1.5, 1.55, -25.3], mira: [-2.55, 1.45, -26.9], fov: 48},
	vg2: {pos: [1.5, 1.55, -25.3], mira: [2.55, 1.45, -26.9], fov: 48},
	puertas: {pos: [0, 1.6, -25.0], mira: [0, 1.3, -28], fov: 58},
	puertaDer: {pos: [0.95, 1.6, -26.2], mira: [1.4, 1.3, -28.6], fov: 54},
	calle: {pos: [1.1, 1.6, -33.4], mira: [1.4, 1.8, -28.2], fov: 62},
	escaparate: {pos: [3.0, 1.7, -30.6], mira: ESCAPARATE, fov: 46},
	final: {pos: [0.6, 1.9, -35.5], mira: [0.8, 2.3, -28], fov: 60},
};

const PLANO_DE: Record<string, string> = {
	h01: 'relojEsfera', h02: 'conservador', g01: 'cupula', g02: 'reloj', g03: 'conservador', g04: 'monedas',
	a01: 'vitrinas', a02: 'placas', a04: 'v2', a06: 'vitrinas', a07: 'placas', a10: 'vitrinas',
	b01: 'retrato', b02: 'caja', b03: 'placaRetrato', b07: 'retrato', b08: 'caja', b11: 'caja', b12: 'pintura',
	c01: 'egipcia', c02: 'gatos', c04: 'balanza', c07: 'gatos', c09: 'balanza', c11: 'gatoFalso',
	d01: 'puertas', d02: 'salida', d04: 'vg1', d05: 'vg2', d06: 'puertas', d07: 'salida', d09: 'vg1', d11: 'puertaDer',
	e01: 'calle', e02: 'escaparate', f01: 'final',
};
const EXTRA: [string, number, string][] = [
	['h01', 4.0, 'cupula'],
	['h01', 8.5, 'vestibulo'],
	['g02', 2.6, 'relojEsfera'],
	['a10', 3.2, 'pintura'],
	['c05', 0.2, 'gatos'],
	['d11', 4.2, 'calle'],
	['e01', 3.0, 'escaparate'],
];

const PISTA_DE: Record<string, string[]> = {
	g02: ['reloj'], a01: ['vitrinas'], a02: ['v0', 'v1', 'v2'], a03: ['vitrinas'], a04: ['v2'], a05: ['vitrinas'],
	b01: ['retrato'], b02: ['caja'], b03: ['placaRetrato'], b04: ['placaRetrato'], b05: ['retrato'], b06: ['placaRetrato'],
	c01: ['gatos'], c03: ['gatos'], c04: ['balanza'], c05: ['balanza'], c06: ['gatos', 'balanza'],
	d01: ['puertas'], d02: ['vg1', 'vg2'], d04: ['vg1'], d05: ['vg2'], d06: ['vg1', 'vg2'], e01: ['escaparate'], e02: ['escaparate'],
};
const EN_PENSAR: Record<string, string[]> = {p1: ['vitrinas'], p2: ['placaRetrato'], p3: ['balanza'], p4: ['vg1', 'vg2']};
const FICHAS: Record<string, string> = {
	a03: 'Las tres placas mienten',
	a04: 'De «Oro y plata» sale PLATA',
	b04: 'M D C C C L X X X I X',
	b05: 'Se abre con el año verdadero',
	b06: 'M 1000 · D 500 · C 100 · L 50 · X 10 · I 1',
	c03: '8 gatos · 1 más ligero',
	c04: 'Balanza de 2 platos, sin pesas',
	c05: '¿Mínimo de pesadas, seguro?',
	d03: 'Uno siempre miente; el otro, nunca',
	d04: 'I · «Al menos uno de los dos miente»',
	d05: 'II · «La salida es la izquierda»',
};
const BLOQUES = ['p1', 'p2', 'p3', 'p4'];

const camara = (t: number, P0: PlanC): EstadoMuseo['cam'] => {
	const ev: {t: number; plano: string; dur: number}[] = [{t: -10, plano: 'relojEsfera', dur: 0.1}];
	let bloquePrev = 'gancho';
	for (const l of P0.lineas) {
		const p = PLANO_DE[l.id];
		const cambia = l.bloque !== bloquePrev;
		if (p) ev.push({t: l.inicio - (cambia ? 6 : l.fase === 'accion' ? 4.6 : 1.2), plano: p, dur: cambia ? 5 : 1.5});
		bloquePrev = l.bloque;
	}
	for (const [id, off, plano] of EXTRA) {
		const T = P0.t[id];
		if (T) ev.push({t: Math.min(T.inicio + off, T.fin + 0.6), plano, dur: id === 'd11' ? 3.2 : 2.2});
	}
	ev.sort((a, b) => a.t - b.t);
	let k = 0;
	for (let i = 0; i < ev.length; i++) if (t >= ev[i].t) k = i;
	const cur = PLANOS_MUSEO[ev[k].plano];
	const prev = PLANOS_MUSEO[ev[Math.max(0, k - 1)].plano];
	const f = interpolate(t, [ev[k].t, ev[k].t + ev[k].dur], [0, 1], {...clamp, easing: io});
	const mix = (a: V3, b: V3): V3 => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * f) as V3;
	const pos = mix(prev.pos, cur.pos);
	const mira = mix(prev.mira, cur.mira);
	const sig = ev[k + 1]?.t ?? P0.total;
	const a0 = ev[k].t + ev[k].dur;
	const push = sig > a0 + 0.01 ? interpolate(t, [a0, sig], [0, 0.05], clamp) : 0;
	for (let i = 0; i < 3; i++) pos[i] += (mira[i] - pos[i]) * push;
	pos[0] += Math.sin(t * 0.6) * 0.018;
	pos[1] += Math.sin(t * 0.47 + 1) * 0.014;
	mira[0] += Math.sin(t * 0.37 + 2) * 0.022;
	const fov = (prev.fov ?? 52) + ((cur.fov ?? 52) - (prev.fov ?? 52)) * f;
	return {pos, mira, fov};
};

/** Minutos del reloj: 00:00 al empezar (g02), 00:15 en la sala egipcia (c02), 00:30 al salir (d11). */
export const minutosMuseo = (t: number, P0: PlanC) => {
	const T = P0.t;
	return interpolate(t, [T.g02.inicio, T.c02.inicio, T.d11.inicio + 2.2], [0, 15, 30], clamp);
};

export const estadoMuseo = (t: number, P0: PlanC): EstadoMuseo => {
	const T = P0.t;
	const M = P0.mecanismo;
	const tr = (a: number, b: number, v0: number, v1: number, ease = io) => interpolate(t, [a, b], [v0, v1], {...clamp, easing: ease});
	const pista: Record<string, number> = {};
	const sube = (k: string, v: number) => (pista[k] = Math.max(pista[k] ?? 0, v));
	for (const l of P0.lineas) {
		const objs = PISTA_DE[l.id];
		if (!objs) continue;
		const v = interpolate(t, [l.inicio - 0.3, l.inicio, l.fin + 0.4, l.fin + 0.9], [0, 1, 1, 0], clamp);
		objs.forEach((o) => sube(o, v));
	}
	for (const b of BLOQUES) {
		const pe = P0.pensar[b];
		if (!pe) continue;
		const v = interpolate(t, [pe.inicio, pe.inicio + 0.5, pe.fin, pe.fin + 0.5], [0, 0.55, 0.55, 0], clamp);
		EN_PENSAR[b].forEach((o) => sube(o, v));
	}
	const reja = (a: number) => tr(a, a + 2.4, 0, 1, Easing.out(Easing.cubic));
	const m1 = M.p1.inicio;
	const m2 = M.p2.inicio;
	const m3 = M.p3.inicio;
	const c09 = T.c09;
	const fC = (x: number) => c09.inicio + (c09.fin - c09.inicio) * x;
	// c09: 3 contra 3 (equilibrio), luego el caso en que se inclina, y 1 contra 1
	const balanzaSol = interpolate(t, [fC(0), fC(0.12), fC(0.32), fC(0.45), fC(0.6), fC(0.72), fC(0.85), fC(1)], [0, 0, 0, 0.9, 0.9, 0, 0.9, 0], clamp);
	const titubea = interpolate(t, [T.c04.inicio, T.c04.inicio + 0.6, T.c05.fin], [0, 1, 0], clamp) * Math.sin(t * 2.4) * 0.35;
	const salida = T.d11.inicio;
	const alarmaEnv = interpolate(t, [salida + 3.8, salida + 4.2, T.e01.inicio + 3, T.e01.inicio + 5], [0, 1, 1, 0.25], clamp);
	return {
		t,
		cam: camara(t, P0),
		pista,
		minutos: minutosMuseo(t, P0),
		luces: [
			tr(0, 2, 0.25, 0.55),
			tr(T.g04.inicio + 0.4, T.g04.inicio + 1.6, 0, 1),
			tr(T.a10.inicio + 2.2, T.a10.inicio + 3.5, 0, 1),
			tr(T.c01.inicio - 5, T.c01.inicio - 3.5, 0, 1),
			tr(T.c11.inicio + 3.2, T.c11.inicio + 4.5, 0, 1),
		],
		rejas: [reja(T.g04.inicio + 0.6), reja(T.a10.inicio + 2.4), reja(T.c01.inicio - 5.2), reja(T.c11.inicio + 3.4)],
		moneda: interpolate(t, [T.a04.inicio + 0.4, T.a04.inicio + 2.0, P0.pensar.p1.fin, P0.pensar.p1.fin + 1.2], [0, 1, 1, 0], clamp),
		panos: tr(m1 + 0.3, m1 + 2.0, 0, 1),
		placas: tr(m1 + 1.8, m1 + 3.8, 0, 1),
		retrato: tr(T.b02.inicio + 0.6, T.b02.inicio + 2.4, 0, 0.2) + tr(m2 + 0.0, m2 + 0.8, 0, 0.8),
		ruedas: tr(m2 + 0.4, m2 + 2.8, 0, 1, Easing.out(Easing.cubic)),
		caja: tr(m2 + 3.0, m2 + 4.0, 0, 1, Easing.out(Easing.back(1.3))),
		balanza: titubea + balanzaSol,
		dial: tr(m3 + 0.3, m3 + 1.0, 0, 1),
		gatoRoto: tr(m3 + 1.3, m3 + 2.1, 0, 1, Easing.out(Easing.back(1.6))),
		mapa: tr(T.c11.inicio + 1.6, T.c11.inicio + 3.0, 0, 1),
		cabezas: tr(T.d02.inicio + 1.4, T.d02.inicio + 2.6, 0, 1),
		verdad: interpolate(t, [T.d09.inicio, T.d09.inicio + 0.6, T.d10.fin + 0.6, T.d10.fin + 1.3], [0, 1, 1, 0], clamp),
		puerta: tr(salida + 0.8, salida + 3.0, 0, 1, Easing.out(Easing.cubic)),
		calle: tr(salida + 3, salida + 5, 0, 1),
		alarma: alarmaEnv * (0.55 + 0.45 * Math.sin(t * 7)),
		escaparate: tr(T.e01.inicio + 2.0, T.e01.inicio + 3.4, 0, 1),
		luna: 0.85 + 0.15 * Math.sin(t * 0.21),
	};
};

export const MuseoEscape: React.FC<PropsC> = (props) => {
	const {ficha} = props;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const P0 = planificarC(props);
	const T = P0.t;
	const e = estadoMuseo(t, P0);

	const linea = P0.lineas.find((l) => t >= l.inicio - 0.1 && t < l.fin + 0.35);
	const bloqueAct = BLOQUES.find((b) => t >= P0.bloques[b].inicio - 0.5 && t < P0.bloques[b].fin + 1.5);
	const explicando = (b: string) => {
		const sol = P0.lineas.filter((l) => l.bloque === b && (l.fase === 'solucion' || l.fase === 'comprobacion'));
		return {a: sol[0].inicio, b: sol[sol.length - 1].fin + 0.6};
	};
	const ex = Object.fromEntries(BLOQUES.map((b) => [b, explicando(b)]));
	const fichas = bloqueAct
		? P0.lineas
				.filter((l) => l.bloque === bloqueAct && FICHAS[l.id])
				.map((l) => ({texto: FICHAS[l.id], desde: l.inicio + 0.3, activa: interpolate(t, [l.inicio, l.inicio + 0.3, l.fin + 0.4, l.fin + 0.8], [0, 1, 1, 0], clamp)}))
		: [];
	const fichasVis = bloqueAct ? interpolate(t, [ex[bloqueAct].a - 0.4, ex[bloqueAct].a, ex[bloqueAct].b, ex[bloqueAct].b + 0.4], [1, 0, 0, 1], clamp) * interpolate(t, [P0.bloques[bloqueAct].fin, P0.bloques[bloqueAct].fin + 1.2], [1, 0], clamp) : 0;
	const sinFichas = T.b12 ? interpolate(t, [T.b12.inicio - 0.8, T.b12.inicio - 0.2, T.b12.fin + 0.4, T.b12.fin + 1.0], [1, 0, 0, 1], clamp) : 1;
	const fundidoIn = interpolate(t, [0, 1.2], [1, 0], clamp);
	const fundidoOut = interpolate(t, [P0.total - 1.2, P0.total], [0, 1], clamp);
	// destello blanco al cruzar la puerta hacia la calle
	const cruce = interpolate(t, [T.d11.inicio + 3.9, T.d11.inicio + 4.4, T.d11.inicio + 5.2], [0, 0.6, 0], clamp);
	const conservador = linea?.fase === 'conservador';
	const finalDesde = (ficha.pantalla_final_s ?? 0) > 0 ? T.f02.fin + 3.0 : P0.total + 1;
	const ocultaFinal = interpolate(t, [finalDesde - 0.6, finalDesde], [1, 0], clamp);

	return (
		<AbsoluteFill style={{background: '#08080c', overflow: 'hidden'}}>
			<Museo3D e={e} />
			<AbsoluteFill style={{background: '#ff1a1a', opacity: e.alarma * 0.07}} />
			<BordeMaqueta16 />
			<Cabecera16 t={t} temporada={ficha.temporada} capitulo={ficha.capitulo} titulo={ficha.titulo} desde={P0.titulo.fin} unidad="SALA" />
			<TituloCapitulo t={t} inicio={P0.titulo.inicio} fin={P0.titulo.fin} temporada={ficha.temporada} capitulo={ficha.capitulo} titulo={ficha.titulo} unidad="SALA" />
			{BLOQUES.map((b, i) => (
				<RotuloPuzle key={b} t={t} inicio={P0.bloques[b].inicio - 0.6} n={i + 1} total={BLOQUES.length} titulo={ficha.puzles[i].titulo} />
			))}
			<RelojHUD t={t} desde={T.g02.inicio + 0.5} hasta={T.d11.inicio + 4.5} minutos={e.minutos} />
			<Fichas16 t={t} pistas={fichas} visible={fichasVis * sinFichas} />
			{BLOQUES.map((b) => (
				<Anillo16 key={b} t={t} inicio={P0.pensar[b].inicio} fin={P0.pensar[b].fin} />
			))}
			<ExpVitrinas t={t} a={ex.p1.a} b={ex.p1.b} />
			<ExpRomanos t={t} a={ex.p2.a} b={ex.p2.b} />
			<ExpBalanza t={t} a={ex.p3.a} b={ex.p3.b} />
			<ExpVigilantes t={t} a={ex.p4.a} b={ex.p4.b} />
			<Recuento t={t} a={T.f01.inicio} b={T.f02.fin + 1.5} puzles={ficha.puzles} rotulo="SOLUCIONES DEL MUSEO" />
			<AbsoluteFill style={{opacity: ocultaFinal}}>
				<Proximo t={t} desde={T.f02.inicio} siguiente={ficha.siguiente} aviso={ficha.aviso_ia} rotulo="ESTE SÁBADO" />
			</AbsoluteFill>
			{T.h02 && <ChipNarrativo t={t} a={T.h02.inicio + 1.0} b={(T.h02.inicio + T.h02.fin) / 2 + 0.6} icono="sus" texto="SUSCRÍBETE" />}
			{T.h02 && <ChipNarrativo t={t} a={(T.h02.inicio + T.h02.fin) / 2 + 0.9} b={T.h02.fin + 1.2} icono="campana" texto="ACTIVA LA CAMPANITA" />}
			{(ficha.pantalla_final_s ?? 0) > 0 && <ChipNarrativo t={t} a={T.f02.inicio + 2.5} b={T.f02.fin + 1.2} icono="campana" texto="ACTIVA LA CAMPANITA" />}
			<PantallaFinal t={t} desde={finalDesde} total={P0.total} />
			{linea && <Subtitulo16 texto={linea.texto} inicio={linea.inicio} fin={linea.fin} t={t} custodio={conservador} quien="EL CONSERVADOR" color={COLOR_CONSERVADOR} />}
			{BLOQUES.map((b) => (
				<CortinaEngranajes key={b} t={t} en={P0.mecanismo[b].inicio + 1.6} />
			))}
			<AbsoluteFill style={{background: '#e8eeff', opacity: cruce}} />
			<AbsoluteFill style={{background: '#08080c', opacity: Math.max(fundidoIn, fundidoOut)}} />
			<SonidoMuseo ficha={ficha} P0={P0} fps={fps} />
		</AbsoluteFill>
	);
};

/** Pista de sonido del museo: péndulo, música con ducking, voces y efectos. */
export const SonidoMuseo: React.FC<{ficha: PropsC['ficha']; P0: PlanC; fps: number}> = ({ficha, P0, fps}) => {
	const T = P0.t;
	const M = P0.mecanismo;
	const fr = (s: number) => Math.max(0, Math.round(s * fps));
	const sfx = (name: string, at: number, vol = 0.6) => (
		<Sequence from={fr(at)} key={name + at}>
			<Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={vol} />
		</Sequence>
	);
	const salida = T.d11.inicio;
	const fuera = salida + 4.2;
	const rejas = [T.g04.inicio + 0.6, T.a10.inicio + 2.4, T.c01.inicio - 5.2, T.c11.inicio + 3.4];
	return (
		<>
			{/* péndulo del reloj de pie: se apaga al salir a la calle */}
			<Sequence durationInFrames={fr(fuera)}>
				<Audio src={staticFile('audio/sfx/tictac.wav')} volume={0.22} loop />
			</Sequence>
			<Sequence from={fr(fuera - 0.5)}>
				<Audio src={staticFile('audio/sfx/viento.wav')} volume={0.25} loop />
			</Sequence>
			<Audio
				src={staticFile('audio/sfx/musica.wav')}
				loop
				volume={(f) => {
					const s = f / fps;
					const entrada = Math.min(1, s / 4);
					const salidaV = Math.max(0, Math.min(1, (P0.total - s) / 3));
					const d = P0.lineas.reduce((m, l) => Math.min(m, s < l.inicio ? l.inicio - s : s > l.fin ? s - l.fin : 0), 99);
					const libre = Math.min(1, Math.max(0, (d - 0.15) / 0.6));
					return (0.13 + 0.11 * libre) * entrada * salidaV;
				}}
			/>
			{sfx('golpe', 1.2, 0.5)}
			{sfx('campanadas', T.g02.inicio - 1.2, 0.5)}
			{sfx('logo', P0.titulo.inicio, 0.45)}
			{sfx('campana', T.c02.inicio - 0.6, 0.3)}
			{rejas.map((r) => [sfx('cerrojo', r - 0.2, 0.5), sfx('bisagra', r + 0.1, 0.45)])}
			{BLOQUES.map((b) => Array.from({length: ficha.pensar_s}, (_, i) => sfx('tic', P0.pensar[b].inicio + i, 0.45)))}
			{BLOQUES.map((b) => sfx('cerrojo', M[b].inicio + 1.4, 0.55))}
			{sfx('cristal', T.a04.inicio + 0.3, 0.4)}
			{sfx('cristal', M.p1.inicio + 0.4, 0.45)}
			{sfx('aire', M.p1.inicio + 1.8, 0.3)}
			{sfx('bisagra', T.b02.inicio + 0.6, 0.35)}
			{Array.from({length: 4}, (_, i) => sfx('cerrojo', M.p2.inicio + 0.7 + i * 0.5, 0.4))}
			{sfx('bisagra', M.p2.inicio + 3.0, 0.5)}
			{sfx('golpe', M.p3.inicio + 1.3, 0.55)}
			{sfx('piedra', M.p3.inicio + 1.4, 0.35)}
			{sfx('bisagra', salida + 0.8, 0.7)}
			<Sequence from={fr(salida + 3.8)} durationInFrames={fr(T.e01.inicio + 5 - (salida + 3.8))}>
				<Audio src={staticFile('audio/sfx/alarma.wav')} volume={0.22} loop />
			</Sequence>
			{sfx('logo', T.f02.inicio, 0.45)}
			{P0.lineas.map((l) => (
				<Sequence key={l.id} from={fr(l.inicio)}>
					<Audio src={staticFile(`audio/${ficha.id}/${l.id}.wav`)} volume={1} />
				</Sequence>
			))}
		</>
	);
};

export const MuseoEscapeAudio: React.FC<PropsC> = (props) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<SonidoMuseo ficha={props.ficha} P0={planificarC(props)} fps={fps} />
		</AbsoluteFill>
	);
};

void E60;
