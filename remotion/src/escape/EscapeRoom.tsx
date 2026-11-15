import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate as interpolateRaw, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/** interpolate tolerante: si dos puntos del rango coinciden o se cruzan (voces más cortas o largas de lo previsto), los separa 1 ms en vez de romper el render. */
const interpolate = (input: number, inputRange: readonly number[], outputRange: readonly number[], options?: Parameters<typeof interpolateRaw>[3]): number => {
	const r = [...inputRange];
	for (let i = 1; i < r.length; i++) if (!(r[i] > r[i - 1])) r[i] = r[i - 1] + 0.001;
	return interpolateRaw(input, r, outputRange as number[], options) as number;
};
import {MONO, SERIF, cargarFuentes} from '../style/fonts';
import {CortinaEngranajes, E60} from '../e60/nucleo';
import {PlanC, PropsC, planificarC} from '../capitulo/plan';
import {Anillo16, BordeMaqueta16, Cabecera16, Fichas16, Proximo, Recuento, RotuloPuzle, Subtitulo16, TituloCapitulo} from '../capitulo/ui';
import {CERRADURA, COLUMNA, EstadoTorre, LOSA, NICHO, P, TorreArchivero3D, VENTANA_DEG, peldano} from './TorreArchivero3D';
import {ExpCifrado, ExpEscudos, ExpFibonacci, ExpGuardias} from './uiER';

cargarFuentes();

// ENIGMA 60 · Escape room independiente 1 «La torre del archivero» (16:9). Coreografía ligada a la ficha E60-ER-001.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
type V3 = [number, number, number];

const p13 = peldano(13).pos;
const PLANOS: Record<string, {pos: V3; mira: V3; fov?: number}> = {
	inicio: {pos: [0.25, 1.62, 3.3], mira: [0.1, 1.9, -3], fov: 62},
	ventana: {pos: [0.5, 1.6, 1.3], mira: P(VENTANA_DEG, 4.2, 3.0), fov: 54},
	entrada: {pos: [0.2, 1.65, 2.9], mira: [0, 1.5, -3.5], fov: 60},
	torre: {pos: [0.4, 1.7, 2.6], mira: [-0.6, 3.2, -2.5], fov: 66},
	mesa: {pos: [-0.7, 1.55, 1.1], mira: [-2.05, 0.95, 2.55], fov: 50},
	vela: {pos: [-1.25, 1.25, 1.75], mira: [-1.95, 0.98, 2.45], fov: 42},
	escudosSuelo: {pos: [-0.9, 1.55, 0.6], mira: [-2.8, 0.35, 0.15], fov: 56},
	escudos: {pos: [-0.5, 1.8, 0.45], mira: [-3.4, 0.9, 0.05], fov: 64},
	losa: {pos: [-1.55, 1.35, 0.75], mira: [LOSA[0], 0.2, LOSA[2]], fov: 50},
	criptex: {pos: [LOSA[0] + 1.45, 1.62, LOSA[2] + 0.53], mira: [LOSA[0], 1.3, LOSA[2]], fov: 40},
	dintel: {pos: [0, 1.75, -0.4], mira: [0, 3.0, -4.1], fov: 50},
	regla: {pos: [0, 1.75, -1.3], mira: [0, 3.6, -4.1], fov: 44},
	escalera: {pos: [0.0, 1.75, 1.9], mira: [COLUMNA[0], 1.5, COLUMNA[2]], fov: 58},
	// el peldaño queda a la derecha del encuadre para que no lo tape el panel de la explicación
	p13: {pos: [1.35, 2.3, 2.25], mira: [2.44, 2.21, 0.9], fov: 44},
	nicho: {pos: [1.5, 1.45, 1.35], mira: NICHO, fov: 46},
	guardias: {pos: [0, 1.6, 0.7], mira: [0, 1.75, -4], fov: 62},
	g1: {pos: [-0.9, 1.45, -0.6], mira: P(-44, 3.65, 1.3), fov: 50},
	g2: {pos: [-0.45, 1.45, -1.05], mira: P(-27, 3.65, 1.3), fov: 50},
	g3: {pos: [0.45, 1.45, -1.05], mira: P(27, 3.65, 1.3), fov: 50},
	puerta: {pos: [0, 1.55, -1.7], mira: [0, 1.35, -4.2], fov: 54},
	cerradura: {pos: [0.35, 1.55, -3.05], mira: CERRADURA, fov: 50},
	sala2: {pos: [0, 1.6, -2.6], mira: [0, 1.55, -7.5], fov: 54},
	sombra: {pos: [0, 1.6, -4.4], mira: [0, 1.7, -7.8], fov: 56},
	libro: {pos: [0, 1.75, -5.35], mira: [0, 1.15, -6.45], fov: 44},
	final: {pos: [0.2, 2.2, 2.2], mira: [0, 2.4, -4], fov: 64},
};

const PLANO_DE: Record<string, string> = {
	h01: 'vela', g01: 'ventana', g02: 'entrada', g03: 'torre', g04: 'mesa', g05: 'vela',
	a01: 'escudosSuelo', a02: 'escudos', a07: 'escudos', a11: 'escudos',
	b01: 'criptex', b02: 'dintel', b04: 'criptex', b05: 'dintel', b09: 'dintel', b11: 'criptex',
	c01: 'escalera', c02: 'vela', c03: 'escalera', c07: 'p13', c10: 'p13',
	d01: 'nicho', d02: 'guardias', d03: 'g1', d04: 'g2', d05: 'g3', d06: 'regla', d07: 'guardias', d10: 'guardias', d12: 'cerradura',
	e01: 'sombra', e03: 'libro', f01: 'final',
};
// cortes dentro de una línea: [línea, segundos desde su inicio, plano]
const EXTRA: [string, number, string][] = [
	['h01', 3.4, 'cerradura'],
	['h01', 6.6, 'puerta'],
	['g03', 3.2, 'mesa'],
	['a11', 1.6, 'losa'],
	['c10', 2.4, 'nicho'],
	['d12', 2.6, 'puerta'],
	['d12', 99, 'sala2'],
];

const PISTA_DE: Record<string, string[]> = {
	g01: ['ventana'], a01: ['escudos'], a02: ['escudos'], a03: ['escudos'], a04: ['escudos'], a05: ['escudos'], a06: ['escudos'],
	b01: ['criptex'], b02: ['dintel'], b03: ['dintel'], b04: ['criptex'], b05: ['criptex'], b06: ['dintel'],
	c01: ['escalera'], c03: ['escalera'], c04: ['escalera'], c05: ['escalera'], c07: ['p13'], c08: ['p13'],
	d01: ['nicho'], d03: ['g1'], d04: ['g2'], d05: ['g3'], d06: ['regla'], d07: ['g1', 'g2', 'g3'],
};
const EN_PENSAR: Record<string, string[]> = {p1: ['escudos'], p2: ['dintel'], p3: ['escalera'], p4: ['g1', 'g2', 'g3']};

const FICHAS: Record<string, string> = {
	a03: 'Rojo: no en el gancho 1',
	a04: 'Azul: a la derecha del rojo',
	a05: 'Verde: no en el gancho 3',
	b03: 'HO WLHPSR QR SHUGRQD',
	b04: 'Retrocede 3 letras (A–Z, sin Ñ)',
	b05: 'La 2.ª palabra abre el criptex',
	c03: 'Peldaño equivocado = sin salida',
	c04: '1 · 1 · 2 · 3 · 5 · 8 · ?',
	d03: 'I · «La de oro abre»',
	d04: 'II · «La de plata no abre»',
	d05: 'III · «La de oro no abre»',
	d06: 'Solo una dice la verdad',
};
const BLOQUES = ['p1', 'p2', 'p3', 'p4'];

/** Relámpagos deterministas: instante de cada destello. */
export const relampagos = (total: number) => {
	const out = [2.2];
	let t = 2.2;
	while (t < total) {
		t += 14 + ((t * 7.31) % 9);
		out.push(t);
	}
	return out;
};
const destello = (t: number, lista: number[]) => {
	let v = 0;
	for (const r of lista) {
		const d = t - r;
		if (d < -0.1 || d > 1.2) continue;
		v = Math.max(v, interpolate(d, [-0.05, 0, 0.08, 0.16, 0.24, 0.6, 1.2], [0, 1, 0.2, 0.85, 0.3, 0.1, 0], clamp));
	}
	return v;
};

const camara = (t: number, P0: PlanC): EstadoTorre['cam'] => {
	const ev: {t: number; plano: string; dur: number}[] = [{t: -10, plano: 'inicio', dur: 0.1}];
	let bloquePrev = 'gancho';
	for (const l of P0.lineas) {
		const p = PLANO_DE[l.id];
		const cambia = l.bloque !== bloquePrev;
		if (p) ev.push({t: l.inicio - (cambia ? 6 : l.fase === 'accion' ? 4.6 : 1.2), plano: p, dur: cambia ? 5 : 1.5});
		bloquePrev = l.bloque;
	}
	for (const [id, off, plano] of EXTRA) {
		const T = P0.t[id];
		ev.push({t: Math.min(T.inicio + off, T.fin + 0.6), plano, dur: 2.2});
	}
	ev.sort((a, b) => a.t - b.t);
	let k = 0;
	for (let i = 0; i < ev.length; i++) if (t >= ev[i].t) k = i;
	const cur = PLANOS[ev[k].plano];
	const prev = PLANOS[ev[Math.max(0, k - 1)].plano];
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

/** Estado de la torre en el instante t (lo comparten el vídeo largo y el avance vertical). */
export const estadoTorre = (t: number, P0: PlanC): EstadoTorre => {
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
	const m1 = M.p1.inicio;
	const escudos: EstadoTorre['escudos'] = [tr(m1 + 0.3, m1 + 1.5, 0, 1), tr(m1 + 1.0, m1 + 2.2, 0, 1), tr(m1 + 1.7, m1 + 2.9, 0, 1)];
	const losa = tr(T.a11.inicio + 2.4, T.a11.fin + 1.2, 0, 1);
	const criptex = tr(T.a11.fin + 2.5, T.a11.fin + 6.5, 0, 1, Easing.out(Easing.cubic));
	const m2 = M.p2.inicio;
	const anillos = tr(m2 + 0.3, m2 + 3.4, 0, 1, Easing.linear);
	const tapa = tr(m2 + 3.6, m2 + 4.3, 0, 1, Easing.out(Easing.back(1.4)));
	const descifrado = tr(T.b08.inicio, T.b08.inicio + 1.6, 0, 1);
	const m3 = M.p3.inicio;
	const p13 = tr(m3 + 1.0, m3 + 1.6, 0, 1, Easing.out(Easing.bounce));
	const nicho = tr(T.c10.inicio + 3.0, T.c10.inicio + 4.8, 0, 1);
	const m4 = M.p4.inicio;
	const llave = tr(m4 + 0.3, m4 + 2.8, 0, 1);
	const giroLlave = tr(m4 + 2.9, m4 + 3.7, 0, 1, Easing.out(Easing.back(1.6)));
	const apaga = T.d12.inicio + 1.2;
	// v3: en el gancho inicial (h01) la vela ya arde: es un adelanto; luego se «enciende» en g05
	const llamaGancho = T.h01 ? interpolate(t, [T.h01.inicio - 0.2, T.h01.inicio + 0.4, T.h01.fin + 0.3, T.h01.fin + 1.0], [0, 1, 1, 0], clamp) : 0;
	const llama = Math.max(llamaGancho, Math.min(tr(T.g05.inicio + 0.2, T.g05.inicio + 1.2, 0, 1), tr(apaga, apaga + 0.5, 1, 0)));
	const vela = interpolate(t, [T.g05.inicio, apaga], [1, 0.12], clamp);
	const puerta = tr(T.d12.fin - 1.4, T.d12.fin + 2.2, 0, 1, Easing.out(Easing.cubic));
	const sombra = interpolate(t, [T.e01.inicio + 1.5, T.e01.inicio + 3.5, T.e02.fin + 0.3, T.e03.inicio + 2.0], [0, 1, 1, 0], clamp);
	const libro = interpolate(t, [T.e03.inicio + 1.5, T.e03.inicio + 2.5], [0, 1], clamp);
	const verdad = interpolate(t, [T.d09.inicio, T.d09.inicio + 0.6, T.d11.fin + 0.5, T.d11.fin + 1.2], [0, 1, 1, 0], clamp);
	const gramofono = tr(T.g03.inicio + 3.0, T.g03.inicio + 4.5, 0, 1) * tr(apaga, apaga + 2, 1, 0);
	const antorchas = Math.max(tr(apaga, apaga + 0.6, 1, 0.25), 0) * tr(0, 1.5, 0.6, 1) + 0.0;
	return {
		t, cam: camara(t, P0), pista, escudos, losa, criptex, anillos, tapa, descifrado, p13, nicho, llave, giroLlave, verdad, vela, llama, puerta, sombra, libro,
		relampago: destello(t, relampagos(P0.total)), gramofono, antorchas,
	};
};

/** Recordatorio de suscripción integrado en la historia (sin logotipos de terceros). */
const ChipNarrativo: React.FC<{t: number; a: number; b: number; icono: 'sus' | 'campana'; texto: string}> = ({t, a, b, icono, texto}) => {
	const o = interpolate(t, [a, a + 0.6, b, b + 0.6], [0, 1, 1, 0], clamp);
	if (o <= 0) return null;
	const pulso = 1 + 0.04 * Math.sin((t - a) * 5);
	return (
		<div style={{position: 'absolute', right: 90, top: 150, opacity: o, transform: `translateY(${(1 - o) * -20}px) scale(${pulso})`, display: 'flex', alignItems: 'center', gap: 18, padding: '18px 30px', borderRadius: 18, background: 'rgba(20,21,26,0.94)', border: `3px solid ${E60.violeta}`, boxShadow: '0 0 28px rgba(123,92,255,0.45)'}}>
			<svg width="46" height="46" viewBox="0 0 46 46">
				{icono === 'sus' ? (
					<>
						<circle cx="23" cy="23" r="20" fill="none" stroke={E60.cian} strokeWidth="3" />
						<path d="M23 12 v22 M12 23 h22" stroke={E60.cian} strokeWidth="4" strokeLinecap="round" />
					</>
				) : (
					<g transform={`rotate(${Math.sin((t - a) * 9) * 14} 23 8)`}>
						<path d="M23 6 C14 6 12 15 12 22 L9 32 H37 L34 22 C34 15 32 6 23 6 Z" fill="none" stroke={E60.cian} strokeWidth="3" strokeLinejoin="round" />
						<circle cx="23" cy="37" r="4" fill={E60.cian} />
					</g>
				)}
			</svg>
			<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 4, color: E60.blanco}}>{texto}</div>
		</div>
	);
};

/** Últimos segundos: zonas libres para la pantalla final de YouTube (vídeo + suscripción), sin texto encima. */
const PantallaFinal: React.FC<{t: number; desde: number; total: number}> = ({t, desde, total}) => {
	const o = interpolate(t, [desde, desde + 1.2], [0, 1], clamp);
	if (o <= 0) return null;
	const marco = interpolate(t, [desde + 0.8, desde + 2.2], [0, 1], clamp);
	return (
		<AbsoluteFill style={{opacity: o}}>
			<AbsoluteFill style={{background: 'rgba(10,8,7,0.62)'}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', fontFamily: SERIF, fontWeight: 800, fontSize: 64, color: E60.blanco}}>¿Te atreves con la siguiente sala?</div>
			<div style={{position: 'absolute', left: 230, top: 330, width: 820, height: 461, borderRadius: 14, border: `3px solid rgba(63,224,230,${0.55 * marco})`, boxShadow: `0 0 40px rgba(63,224,230,${0.18 * marco})`}} />
			<div style={{position: 'absolute', left: 1240, top: 410, width: 300, height: 300, borderRadius: 150, border: `3px solid rgba(123,92,255,${0.65 * marco})`, boxShadow: `0 0 40px rgba(123,92,255,${0.25 * marco})`}} />
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 70, textAlign: 'center', fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: 'rgba(184,190,200,0.8)'}}>
				ENIGMA <span style={{color: E60.cian}}>60</span> · {Math.max(0, Math.ceil(total - t))}
			</div>
		</AbsoluteFill>
	);
};

export const EscapeRoom: React.FC<PropsC> = (props) => {
	const {ficha} = props;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const P0 = planificarC(props);
	const T = P0.t;
	const e = estadoTorre(t, P0);

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
	const apagon = interpolate(t, [T.d12.inicio + 1.2, T.d12.inicio + 1.5, T.d12.fin - 1.2, T.d12.fin + 0.5], [0, 0.55, 0.55, 0], clamp);
	const archivera = linea?.fase === 'archivera';
	const finalDesde = (ficha.pantalla_final_s ?? 0) > 0 ? T.f02.fin + 3.0 : P0.total + 1;
	const ocultaFinal = interpolate(t, [finalDesde - 0.6, finalDesde], [1, 0], clamp);

	return (
		<AbsoluteFill style={{background: '#0a0807', overflow: 'hidden'}}>
			<TorreArchivero3D e={e} />
			<AbsoluteFill style={{background: '#e8eeff', opacity: e.relampago * 0.12}} />
			<BordeMaqueta16 />
			<Cabecera16 t={t} temporada={ficha.temporada} capitulo={ficha.capitulo} titulo={ficha.titulo} desde={P0.titulo.fin} unidad="SALA" />
			<TituloCapitulo t={t} inicio={P0.titulo.inicio} fin={P0.titulo.fin} temporada={ficha.temporada} capitulo={ficha.capitulo} titulo={ficha.titulo} unidad="SALA" />
			{BLOQUES.map((b, i) => (
				<RotuloPuzle key={b} t={t} inicio={P0.bloques[b].inicio - 0.6} n={i + 1} total={BLOQUES.length} titulo={ficha.puzles[i].titulo} />
			))}
			<Fichas16 t={t} pistas={fichas} visible={fichasVis * sinFichas} />
			{BLOQUES.map((b) => (
				<Anillo16 key={b} t={t} inicio={P0.pensar[b].inicio} fin={P0.pensar[b].fin} />
			))}
			<ExpEscudos t={t} a={ex.p1.a} b={ex.p1.b} />
			<ExpCifrado t={t} a={ex.p2.a} b={ex.p2.b} />
			<ExpFibonacci t={t} a={ex.p3.a} b={ex.p3.b} />
			<ExpGuardias t={t} a={ex.p4.a} b={ex.p4.b} />
			<Recuento t={t} a={T.f01.inicio} b={T.f02.fin + 1.5} puzles={ficha.puzles} rotulo="SOLUCIONES DE LA SALA" />
			<AbsoluteFill style={{opacity: ocultaFinal}}>
				<Proximo t={t} desde={T.f02.inicio} siguiente={ficha.siguiente} aviso={ficha.aviso_ia} rotulo="PRÓXIMA SALA · MIÉRCOLES" />
			</AbsoluteFill>
			{T.b12 && <ChipNarrativo t={t} a={T.b12.inicio + 3.0} b={T.b12.fin + 0.8} icono="sus" texto="SUSCRÍBETE" />}
			{(ficha.pantalla_final_s ?? 0) > 0 && <ChipNarrativo t={t} a={T.f02.inicio + 2.5} b={T.f02.fin + 1.2} icono="campana" texto="ACTIVA LA CAMPANITA" />}
			<PantallaFinal t={t} desde={finalDesde} total={P0.total} />
			{linea && <Subtitulo16 texto={linea.texto} inicio={linea.inicio} fin={linea.fin} t={t} custodio={archivera} quien="LA ARCHIVERA" color={E60.violeta} />}
			{BLOQUES.map((b) => (
				<CortinaEngranajes key={b} t={t} en={P0.mecanismo[b].inicio + 1.6} />
			))}
			<AbsoluteFill style={{background: '#0a0807', opacity: Math.max(fundidoIn, fundidoOut, apagon)}} />
			<SonidoEscape ficha={ficha} P0={P0} fps={fps} />
		</AbsoluteFill>
	);
};

/** Pista de sonido (voz, efectos y ambiente). La usan el vídeo y la composición solo-audio. */
export const SonidoEscape: React.FC<{ficha: PropsC['ficha']; P0: PlanC; fps: number}> = ({ficha, P0, fps}) => {
	const T = P0.t;
	const M = P0.mecanismo;
	const fr = (s: number) => Math.max(0, Math.round(s * fps));
	const sfx = (name: string, at: number, vol = 0.6) => (
		<Sequence from={fr(at)} key={name + at}>
			<Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={vol} />
		</Sequence>
	);
	const apaga = T.d12.inicio + 1.2;
	const gIni = T.g03.inicio + 3.0;
	return (
		<>
			<Audio src={staticFile('audio/sfx/lluvia.wav')} volume={0.32} loop />
			<Audio src={staticFile('audio/sfx/fuego.wav')} volume={0.14} loop />
			{(ficha.pantalla_final_s ?? 0) > 0 && (
				<Sequence from={fr(P0.titulo.inicio)}>
					<Audio src={staticFile('audio/sfx/musica.wav')} volume={0.09} loop />
				</Sequence>
			)}
			<Sequence from={fr(gIni)} durationInFrames={fr(apaga + 1.5 - gIni)}>
				<Audio src={staticFile('audio/sfx/gramofono.wav')} volume={0.12} loop />
			</Sequence>
			{relampagos(P0.total).map((r) => sfx('trueno', r + 0.45, 0.5))}
			{sfx('golpe', 1.4, 0.6)}
			{sfx('logo', P0.titulo.inicio, 0.45)}
			{BLOQUES.map((b) => Array.from({length: ficha.pensar_s}, (_, i) => sfx('tic', P0.pensar[b].inicio + i, 0.45)))}
			{BLOQUES.map((b) => sfx('cerrojo', M[b].inicio + 1.4, 0.55))}
			{[0, 1, 2].map((i) => sfx('golpe', M.p1.inicio + 1.5 + i * 0.7, 0.35))}
			{sfx('piedra', T.a11.inicio + 2.4, 0.6)}
			{sfx('piedra', T.a11.fin + 2.5, 0.45)}
			{Array.from({length: 6}, (_, i) => sfx('cerrojo', M.p2.inicio + 0.6 + i * 0.52, 0.4))}
			{sfx('campana', T.b08.inicio + 0.4, 0.22)}
			{sfx('golpe', M.p3.inicio + 1.0, 0.6)}
			{sfx('piedra', T.c10.inicio + 3.0, 0.55)}
			{sfx('cerrojo', M.p4.inicio + 3.0, 0.7)}
			{sfx('apagar', apaga, 0.6)}
			{sfx('bisagra', T.d12.fin - 1.4, 0.7)}
			{sfx('logo', T.f02.inicio, 0.45)}
			{P0.lineas.map((l) => (
				<Sequence key={l.id} from={fr(l.inicio)}>
					<Audio src={staticFile(`audio/${ficha.id}/${l.id}.wav`)} volume={1} />
				</Sequence>
			))}
		</>
	);
};

export const EscapeRoomAudio: React.FC<PropsC> = (props) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<SonidoEscape ficha={props.ficha} P0={planificarC(props)} fps={fps} />
		</AbsoluteFill>
	);
};
