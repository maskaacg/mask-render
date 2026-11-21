import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate as interpolateRaw, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {cargarFuentes, MONO, SERIF} from '../style/fonts';
import {CortinaEngranajes, E60} from '../e60/nucleo';
import {PlanC, PropsC, planificarC} from '../capitulo/plan';
import {Anillo16, BordeMaqueta16, Cabecera16, Fichas16, PortadaEnVideo, Proximo, Recuento, RotuloPuzle, Subtitulo16, TituloCapitulo} from '../capitulo/ui';
import {ChipNarrativo, PantallaFinal} from './EscapeRoom';
import {EstadoObservatorio, Observatorio3D, PALETA, SALAS} from './Observatorio3D';
import {centroPuzle, planosSala} from '../salas/SalaCorto3D';

cargarFuentes();

// ENIGMA 60 · Escape room 3 «El observatorio apagado» (16:9). Coreografía ligada a la ficha E60-ER-003.
const interpolate = (input: number, inputRange: readonly number[], outputRange: readonly number[], options?: Parameters<typeof interpolateRaw>[3]): number => {
	const r = [...inputRange];
	for (let i = 1; i < r.length; i++) if (!(r[i] > r[i - 1])) r[i] = r[i - 1] + 0.001;
	return interpolateRaw(input, r, outputRange as number[], options) as number;
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
type V3 = [number, number, number];
type Plano = {pos: V3; mira: V3; fov: number};
type SalaId = EstadoObservatorio['sala'];

// ---------- planos de cámara por sala
const PL: Record<SalaId, Record<string, Plano>> = (() => {
	const A = SALAS.almacen, G = SALAS.galeria, T = SALAS.telescopio, C = SALAS.cupula;
	const cruza = (s: typeof A): Plano => ({pos: [0, 1.55, -s.fondo / 2 + 0.9], mira: [0, 1.35, -s.fondo / 2 - 2], fov: 62});
	const zc = centroPuzle(A)[2] - 0.6;
	const zf = centroPuzle(G)[2] - 0.4;
	const zm = centroPuzle(T)[2];
	const ze = centroPuzle(C)[2] - 0.9;
	return {
		almacen: {
			...planosSala(A),
			cajas: {pos: [0.7, 1.85, zc + 2.2], mira: [0, 0.45, zc], fov: 48},
			cajasAlto: {pos: [-0.15, 1.95, zc + 0.95], mira: [-0.43, 1.15, zc - 0.43], fov: 46},
			cajasExp: {pos: [-0.2, 2.05, zc + 3.0], mira: [-1.0, 0.7, zc], fov: 54},
			cruza: cruza(A),
		},
		galeria: {
			...planosSala(G),
			farolas: {pos: [0, 1.45, zf + 3.6], mira: [0, 0.95, zf - 0.4], fov: 56},
			palancas: {pos: [0.4, 1.25, zf + 2.2], mira: [0, 0.35, zf + 0.4], fov: 54},
			farolasExp: {pos: [-0.5, 1.5, zf + 3.8], mira: [-2.0, 0.95, zf - 0.4], fov: 60},
			cruza: cruza(G),
		},
		telescopio: {
			...planosSala(T),
			anillos: {pos: [0, 1.6, zm + 1.6], mira: [0, 0.98, zm], fov: 46},
			anillosExp: {pos: [-0.2, 1.7, zm + 2.1], mira: [-0.6, 0.98, zm], fov: 52},
			telescopio: {pos: [-0.6, 1.55, zm + 1.6], mira: [1.7, 1.7, -T.fondo / 2 + 1.3], fov: 58},
			reloj: {pos: [0.8, 1.7, 0.4], mira: [T.ancho / 2, 1.9, 0.2], fov: 50},
			cruza: {pos: [0.4, 2.2, zm + 0.6], mira: [1.0, 3.6, -1.6], fov: 64},
		},
		cupula: {
			...planosSala(C),
			ventana: {pos: [0.6, 1.05, 1.6], mira: [-C.ancho / 2, 0.55, ze + 1], fov: 56},
			tablero: {pos: [0, 2.35, ze + 3.3], mira: [0, 0.2, ze - 0.2], fov: 56},
			cenital: {pos: [0, 3.45, ze + 1.7], mira: [0, 0, ze - 0.2], fov: 62},
			cenitalExp: {pos: [-1.7, 3.45, ze + 1.9], mira: [-1.7, 0, ze - 0.2], fov: 64},
			cerraduras: {pos: [0, 1.0, ze + 1.4], mira: [0, 0.6, -C.fondo / 2], fov: 56},
			techo: {pos: [0, 1.5, 1.6], mira: [0, 4.2, -1.8], fov: 70},
			final: {pos: [0, 1.3, 2.7], mira: [0, 3.4, -2.2], fov: 74},
		},
	};
})();

const SALA_DE_BLOQUE: Record<string, SalaId> = {gancho: 'almacen', p1: 'almacen', p2: 'galeria', p3: 'telescopio', p4: 'cupula', giro: 'cupula', cierre: 'cupula'};
const PLANO_DE: Record<string, string> = {
	h01: 'entrada', g01: 'detalle', g02: 'entrada', g03: 'detalle', g04: 'cajas',
	a01: 'cajas', a02: 'cajasAlto', a03: 'cajas', a05: 'cajas', a07: 'cajasExp', a10: 'puerta',
	b01: 'farolas', b03: 'palancas', b05: 'puerta', b06: 'farolas', b08: 'farolasExp', b11: 'puerta',
	c01: 'telescopio', c02: 'reloj', c03: 'anillos', c05: 'telescopio', c06: 'anillos', c08: 'anillosExp', c11: 'telescopio',
	d01: 'ventana', d02: 'tablero', d04: 'cenital', d05: 'cerraduras', d06: 'cenital', d08: 'cenitalExp', d11: 'cerraduras',
	e01: 'techo', e02: 'final',
};
const FICHAS: Record<string, string> = {
	a03: 'Ninguna caja flota',
	a04: 'Base 3 × 3 · falta la esquina delantera derecha',
	b02: 'Encendida: solo la farola 2',
	b03: 'Palanca = su farola + las de al lado',
	b04: 'Palanca 2 → 1·2·3   ·   Palanca 1 → 1·2',
	b05: 'Cada palanca, una sola vez',
	c03: '4 anillos · 3 varillas',
	c04: 'Uno cada vez · nunca grande sobre pequeño',
	c05: 'Marca el mínimo de movimientos',
	d03: 'Entra por la fila de delante → derecha',
	d04: 'Cada espejo gira el rayo 90°',
	d05: 'Solo vale la cerradura con luz',
};
const BLOQUES = ['p1', 'p2', 'p3', 'p4'];

/** Cambio de sala a mitad de cada transición (bajo un fundido a negro). */
const cambios = (P0: PlanC) => {
	const tr = (b: string) => P0.transiciones.find((x) => x.a === b);
	return {p2: (tr('p2')?.inicio ?? 0) + 6, p3: (tr('p3')?.inicio ?? 0) + 6, p4: (tr('p4')?.inicio ?? 0) + 6};
};
const salaEn = (t: number, P0: PlanC): SalaId => {
	const c = cambios(P0);
	return t < c.p2 ? 'almacen' : t < c.p3 ? 'galeria' : t < c.p4 ? 'telescopio' : 'cupula';
};

const camara = (t: number, P0: PlanC, sala: SalaId): Plano => {
	const c = cambios(P0);
	const inicioSala = sala === 'almacen' ? -10 : sala === 'galeria' ? c.p2 : sala === 'telescopio' ? c.p3 : c.p4;
	const ev: {t: number; plano: string; dur: number}[] = [{t: inicioSala, plano: 'entrada', dur: 0.05}];
	for (const l of P0.lineas) {
		if (SALA_DE_BLOQUE[l.bloque] !== sala) continue;
		const p = PLANO_DE[l.id];
		if (p) ev.push({t: Math.max(inicioSala + 1.5, l.inicio - (l.fase === 'accion' ? 0.4 : 1.0)), plano: p, dur: 1.6});
	}
	// al terminar cada sala, la cámara cruza la puerta abierta antes del fundido
	const sig = sala === 'almacen' ? c.p2 : sala === 'galeria' ? c.p3 : sala === 'telescopio' ? c.p4 : 1e9;
	if (sig < 1e8) ev.push({t: sig - 4.5, plano: 'cruza', dur: 4.0});
	// planos extra dentro de líneas largas
	const extra: [string, number, string][] = [['h01', 6.0, 'detalle'], ['a04', 0.2, 'cajasAlto'], ['a04', 4.0, 'cajas'], ['b09', 0, 'farolasExp'], ['c09', 0, 'anillosExp'], ['d09', 0, 'cenitalExp'], ['d11', 3.0, 'techo']];
	for (const [id, off, plano] of extra) {
		const T = P0.t[id];
		if (T && SALA_DE_BLOQUE[P0.lineas.find((l) => l.id === id)!.bloque] === sala) ev.push({t: T.inicio + off, plano, dur: 1.8});
	}
	ev.sort((a, b) => a.t - b.t);
	let k = 0;
	for (let i = 0; i < ev.length; i++) if (t >= ev[i].t) k = i;
	const planos = PL[sala];
	const cur = planos[ev[k].plano];
	const prev = planos[ev[Math.max(0, k - 1)].plano];
	const f = interpolate(t, [ev[k].t, ev[k].t + ev[k].dur], [0, 1], {...clamp, easing: io});
	const mix = (a: V3, b: V3): V3 => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * f) as V3;
	const pos = mix(prev.pos, cur.pos);
	const mira = mix(prev.mira, cur.mira);
	const siguiente = ev[k + 1]?.t ?? P0.total;
	const a0 = ev[k].t + ev[k].dur;
	const push = siguiente > a0 + 0.01 ? interpolate(t, [a0, siguiente], [0, Math.min(0.12, 0.01 * (siguiente - a0))], clamp) : 0;
	for (let i = 0; i < 3; i++) pos[i] += (mira[i] - pos[i]) * push;
	pos[0] += Math.sin(t * 0.6) * 0.025 + Math.sin(t * 0.23 + 0.7) * 0.035;
	pos[1] += Math.sin(t * 0.47 + 1) * 0.018;
	mira[0] += Math.sin(t * 0.37 + 2) * 0.03;
	return {pos, mira, fov: prev.fov + (cur.fov - prev.fov) * f};
};

/** Minutos de luna: 0 al leer la nota (g02), 15 en el telescopio (c02), 30 al abrir la cúpula (d11). */
const minutos = (t: number, P0: PlanC) => {
	const T = P0.t;
	return interpolate(t, [T.g02.inicio, T.c02.inicio, T.d11.inicio + 2.0], [0, 15, 30], clamp);
};

export const estadoObservatorio = (t: number, P0: PlanC): EstadoObservatorio => {
	const T = P0.t;
	const M = P0.mecanismo;
	const sala = salaEn(t, P0);
	const tr = (a: number, b: number, v0: number, v1: number, ease = io) => interpolate(t, [a, b], [v0, v1], {...clamp, easing: ease});
	const fr = (id: string, x: number) => T[id].inicio + (T[id].fin - T[id].inicio) * x;
	const ventanaPistas = (b: string) => {
		const ls = P0.lineas.filter((l) => l.bloque === b && (l.fase === 'pista' || l.fase === 'repaso'));
		const pe = P0.pensar[b];
		return interpolate(t, [ls[0].inicio - 0.4, ls[0].inicio, pe.fin, pe.fin + 0.6], [0, 0.7, 0.7, 0], clamp);
	};
	const bloque = SALA_DE_BLOQUE[P0.lineas.find((l) => t < l.fin + 0.5)?.bloque ?? 'cierre'];
	void bloque;
	const puerta =
		sala === 'almacen' ? tr(T.a10.inicio + 2.0, T.a10.inicio + 4.0, 0, 1) : sala === 'galeria' ? tr(T.b11.inicio + 2.0, T.b11.inicio + 4.0, 0, 1) : sala === 'telescopio' ? tr(T.c11.inicio + 4.0, T.c11.inicio + 6.0, 0, 1) : 0;
	const foco = sala === 'almacen' ? ventanaPistas('p1') : sala === 'galeria' ? ventanaPistas('p2') : sala === 'telescopio' ? ventanaPistas('p3') : ventanaPistas('p4');
	const e: EstadoObservatorio = {sala, base: {t, cam: camara(t, P0, sala), puerta, foco}};
	if (sala === 'almacen') {
		const sep = interpolate(t, [T.a08.inicio, T.a08.inicio + 1.4, T.a09.fin + 0.4, T.a09.fin + 1.6], [0, 1, 1, 0], clamp);
		const piso = (x: number): number => interpolate(t, [fr('a08', x), fr('a08', x) + 0.5, T.a09.fin + 0.4, T.a09.fin + 1.6], [0, 1, 1, 0], clamp);
		e.cajas = {separa: sep, piso: [piso(0.12), piso(0.5), piso(0.8)], foco: 0};
	}
	if (sala === 'galeria') {
		const p1 = tr(fr('b09', 0.05), fr('b09', 0.05) + 0.6, 0, 1);
		const p3 = tr(fr('b09', 0.55), fr('b09', 0.55) + 0.6, 0, 1);
		const on1 = p1;
		const on2 = 1 - p1 + p3 * p1; // se apaga con la palanca 1 y se vuelve a encender con la 3
		e.farolas = {luz: [on1, Math.min(1, Math.max(0, on2)), p3, p3], palanca: [p1, 0, p3, 0]};
	}
	if (sala === 'telescopio') {
		// c09: 7 movimientos (los tres pequeños al centro), 1 (el grande), 7 (los tres encima)
		const paso = interpolate(t, [fr('c09', 0.02), fr('c09', 0.44), fr('c09', 0.56), fr('c09', 0.98)], [0, 7, 8, 15], clamp);
		e.anillos = {paso};
		e.telescopio = tr(M.p3.inicio + 0.6, M.p3.inicio + 3.6, 0, 1);
	}
	if (sala === 'cupula') {
		const rayo = interpolate(t, [fr('d09', 0.08), fr('d09', 0.9)], [0, 1], clamp);
		const resalta = Math.max(interpolate(t, [T.d04.inicio, T.d04.inicio + 0.4, T.d04.fin, T.d04.fin + 0.5], [0, 1, 1, 0], clamp), interpolate(t, [P0.pensar.p4.inicio, P0.pensar.p4.inicio + 0.5, P0.pensar.p4.fin, P0.pensar.p4.fin + 0.5], [0, 0.6, 0.6, 0], clamp));
		e.espejos = {rayo, lente: [rayo > 0.97 ? 1 : 0, 0, 0], resalta};
		e.cielo = tr(T.e01.inicio + 0.2, T.e01.inicio + 3.0, 0, 1);
		e.luna = minutos(t, P0) / 30;
	}
	return e;
};

// ---------- paneles (opacos, uno cada vez, columna izquierda)
const entra = (t: number, a: number, d = 0.4) => interpolate(t, [a, a + d], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.5))});
const ventana = (t: number, a: number, b: number, s = 0.4) => interpolate(t, [a - s, a, b, b + s], [0, 1, 1, 0], clamp);
const Panel: React.FC<{o: number; children: React.ReactNode; ancho?: number}> = ({o, children, ancho = 900}) => (
	<div style={{position: 'absolute', top: 170, left: 64, width: ancho, background: 'rgba(16,17,21,0.96)', border: '2px solid rgba(184,190,200,0.35)', borderRadius: 18, padding: '28px 36px', opacity: o}}>
		{children}
	</div>
);
const Tit: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 22, letterSpacing: 6, color: E60.cian, marginBottom: 18}}>{children}</div>;

const ExpCajas: React.FC<{t: number; a: number; b: number; T: PlanC['t']}> = ({t, a, b, T}) => {
	const o = ventana(t, a, b);
	if (o <= 0) return null;
	const d = T.a08.fin - T.a08.inicio;
	const filas = [
		{txt: 'EN EL SUELO', n: 8, f: 0.12, c: PALETA.piso[0]},
		{txt: '2.º PISO', n: 4, f: 0.5, c: PALETA.piso[1]},
		{txt: '3.er PISO', n: 1, f: 0.8, c: PALETA.piso[2]},
	];
	return (
		<Panel o={o} ancho={760}>
			<Tit>CUENTA LAS CAJAS POR PISOS</Tit>
			{filas.map((r, i) => {
				const e = entra(t, T.a08.inicio + r.f * d);
				return (
					<div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, minHeight: 78, opacity: e}}>
						<div style={{width: 44, height: 44, borderRadius: 8, background: r.c, flexShrink: 0}} />
						<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 34, color: E60.blanco, flex: 1}}>{r.txt}</div>
						<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 56, color: r.c}}>{r.n}</div>
					</div>
				);
			})}
			<div style={{borderTop: '2px solid rgba(184,190,200,0.35)', marginTop: 10, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: entra(t, T.a09.inicio)}}>
				<span style={{fontFamily: MONO, fontSize: 30, color: E60.plata}}>8 + 4 + 1</span>
				<span style={{fontFamily: SERIF, fontWeight: 800, fontSize: 72, color: E60.cian}}>13</span>
			</div>
		</Panel>
	);
};

const Bombillas: React.FC<{s: number[]; marca?: number}> = ({s, marca}) => (
	<div style={{display: 'flex', gap: 18}}>
		{s.map((v, i) => (
			<div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
				<div style={{width: 58, height: 58, borderRadius: 29, background: v ? PALETA.farolaOn : PALETA.farolaOff, boxShadow: v ? `0 0 22px ${PALETA.farolaOn}` : 'none', border: `3px solid ${marca === i ? '#ff6a5a' : 'rgba(184,190,200,0.4)'}`}} />
				<div style={{fontFamily: MONO, fontSize: 22, color: E60.plata}}>{i + 1}</div>
			</div>
		))}
	</div>
);
const ExpFarolas: React.FC<{t: number; a: number; b: number; T: PlanC['t']}> = ({t, a, b, T}) => {
	const o = ventana(t, a, b);
	if (o <= 0) return null;
	const d = T.b09.fin - T.b09.inicio;
	const filas = [
		{txt: 'AL EMPEZAR', s: [0, 1, 0, 0], f: -0.05},
		{txt: 'PALANCA 1', s: [1, 0, 0, 0], f: 0.05, m: 0},
		{txt: 'PALANCA 3', s: [1, 1, 1, 1], f: 0.55, m: 2},
	];
	return (
		<Panel o={o} ancho={780}>
			<Tit>PALANCAS 1 Y 3</Tit>
			{filas.map((r, i) => (
				<div key={i} style={{display: 'flex', alignItems: 'center', gap: 30, minHeight: 104, opacity: i === 0 ? 1 : entra(t, T.b09.inicio + r.f * d)}}>
					<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, color: E60.blanco, width: 250}}>{r.txt}</div>
					<Bombillas s={r.s} marca={r.m} />
				</div>
			))}
		</Panel>
	);
};

const ExpAnillos: React.FC<{t: number; a: number; b: number; T: PlanC['t']}> = ({t, a, b, T}) => {
	const o = ventana(t, a, b);
	if (o <= 0) return null;
	const d = T.c09.fin - T.c09.inicio;
	const paso = Math.round(interpolate(t, [T.c09.inicio + 0.02 * d, T.c09.inicio + 0.44 * d, T.c09.inicio + 0.56 * d, T.c09.inicio + 0.98 * d], [0, 7, 8, 15], clamp));
	const filas = [
		{txt: '3 pequeños → centro', n: '7', f: 0.02},
		{txt: 'el grande → derecha', n: '1', f: 0.44},
		{txt: '3 pequeños → encima', n: '7', f: 0.56},
	];
	return (
		<Panel o={o} ancho={760}>
			<Tit>MOVIMIENTOS: {String(paso).padStart(2, '0')}</Tit>
			{filas.map((r, i) => (
				<div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, minHeight: 78, opacity: entra(t, T.c09.inicio + r.f * d)}}>
					<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 32, color: E60.blanco, flex: 1}}>{r.txt}</div>
					<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 56, color: PALETA.anillos[1]}}>{r.n}</div>
				</div>
			))}
			<div style={{borderTop: '2px solid rgba(184,190,200,0.35)', marginTop: 10, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: entra(t, T.c10.inicio)}}>
				<span style={{fontFamily: MONO, fontSize: 30, color: E60.plata}}>7 + 1 + 7</span>
				<span style={{fontFamily: SERIF, fontWeight: 800, fontSize: 72, color: E60.cian}}>15</span>
			</div>
		</Panel>
	);
};

const ExpEspejos: React.FC<{t: number; a: number; b: number; T: PlanC['t']}> = ({t, a, b, T}) => {
	const o = ventana(t, a, b);
	if (o <= 0) return null;
	const d = T.d09.fin - T.d09.inicio;
	const rayo = interpolate(t, [T.d09.inicio + 0.08 * d, T.d09.inicio + 0.9 * d], [0, 1], clamp);
	const S = 120, X0 = 90, Y0 = 70;
	const cx = (c: number) => X0 + c * S + S / 2;
	const cy = (f: number) => Y0 + f * S + S / 2;
	const espejos: [number, number, string][] = [[1, 2, '/'], [1, 1, '\\'], [0, 1, '\\'], [2, 2, '/'], [2, 0, '\\']];
	const pts: [number, number][] = [[0, cy(2)], [cx(1), cy(2)], [cx(1), cy(1)], [cx(0), cy(1)], [cx(0), Y0 - 30]];
	const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
	const total = lens.reduce((x, y) => x + y, 0);
	return (
		<Panel o={o} ancho={640}>
			<Tit>EL RAYO, VISTO DESDE ARRIBA</Tit>
			<svg width={560} height={470}>
				{[0, 1, 2].map((c) => (
					<text key={c} x={cx(c)} y={36} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={34} fill={c === 0 && rayo > 0.97 ? E60.cian : E60.plata}>
						{'ABC'[c]}
					</text>
				))}
				{[0, 1, 2].map((c) => [0, 1, 2].map((f) => <rect key={`${c}${f}`} x={X0 + c * S + 3} y={Y0 + f * S + 3} width={S - 6} height={S - 6} fill={(c + f) % 2 ? '#2e3238' : '#454a52'} rx={6} />))}
				{espejos.map(([c, f, k]) => (
					<line key={`${c}${f}`} x1={cx(c) - 40} y1={cy(f) + (k === '/' ? 40 : -40)} x2={cx(c) + 40} y2={cy(f) + (k === '/' ? -40 : 40)} stroke="#d6e4f2" strokeWidth={9} strokeLinecap="round" />
				))}
				<polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={PALETA.rayo} strokeWidth={6} strokeDasharray={total} strokeDashoffset={total * (1 - rayo)} strokeLinejoin="round" />
			</svg>
		</Panel>
	);
};

const LunaHUD: React.FC<{t: number; desde: number; hasta: number; minutos: number; oculto: number}> = ({t, desde, hasta, minutos: m, oculto}) => {
	const o = interpolate(t, [desde, desde + 0.8, hasta, hasta + 0.8], [0, 1, 1, 0], clamp) * (1 - oculto);
	if (o <= 0) return null;
	const quedan = Math.max(0, 30 - Math.floor(m));
	const urgente = quedan <= 10;
	const pulso = urgente ? 0.75 + 0.25 * Math.sin(t * 6) : 1;
	return (
		<div style={{position: 'absolute', right: 70, top: 150, opacity: o, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, padding: '12px 22px', borderRadius: 14, background: 'rgba(16,17,21,0.95)', border: `2px solid ${urgente ? `rgba(224,90,80,${pulso})` : 'rgba(184,190,200,0.35)'}`}}>
			<div style={{fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: E60.plata}}>LA LUNA SE VA EN</div>
			<div style={{fontFamily: MONO, fontWeight: 700, fontSize: 46, color: urgente ? '#ff8a7a' : E60.blanco}}>{String(quedan).padStart(2, '0')} MIN</div>
		</div>
	);
};

/** Portada (1,2 s al empezar y miniatura): las cajas del almacén, la luna y el título. */
export const MiniaturaObservatorio: React.FC<{vertical?: boolean}> = ({vertical}) => {
	const zc = centroPuzle(SALAS.almacen)[2] - 0.6;
	const e: EstadoObservatorio = {
		sala: 'almacen',
		base: {t: 3, cam: vertical ? {pos: [0.3, 1.9, zc + 2.6], mira: [-0.1, 0.55, zc], fov: 70} : {pos: [1.1, 1.75, zc + 2.3], mira: [-0.55, 0.6, zc], fov: 50}, puerta: 0, foco: 0.8},
		cajas: {separa: 0, piso: [0, 0, 0], foco: 0},
	};
	return (
		<AbsoluteFill style={{background: '#05060a'}}>
			<Observatorio3D e={e} ancho={vertical ? 720 : 1280} alto={vertical ? 1280 : 720} escala={vertical ? 1080 / 720 : 1} />
			<AbsoluteFill style={{background: vertical ? 'linear-gradient(180deg, rgba(5,6,10,0.88) 0%, rgba(5,6,10,0) 35%, rgba(5,6,10,0) 65%, rgba(5,6,10,0.9) 100%)' : 'linear-gradient(90deg, rgba(5,6,10,0.94) 0%, rgba(5,6,10,0.6) 42%, rgba(5,6,10,0) 70%)'}} />
			<div style={{position: 'absolute', left: vertical ? 60 : 56, right: vertical ? 60 : undefined, top: vertical ? 120 : 150, width: vertical ? undefined : 640, textAlign: vertical ? 'center' : 'left'}}>
				<div style={{fontFamily: MONO, fontWeight: 600, fontSize: vertical ? 34 : 26, letterSpacing: 6, color: E60.cian}}>ESCAPE ROOM · SALA 3</div>
				<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: vertical ? 116 : 92, lineHeight: 0.98, color: E60.blanco, marginTop: 14, textShadow: '0 6px 30px rgba(0,0,0,0.8)'}}>Sal antes que la luna</div>
				<div style={{display: 'inline-block', marginTop: 26, background: E60.cian, color: '#08080c', fontFamily: MONO, fontWeight: 700, fontSize: vertical ? 40 : 30, padding: '10px 20px', borderRadius: 10}}>4 SALAS · 30 MINUTOS</div>
			</div>
			<div style={{position: 'absolute', right: vertical ? undefined : 40, left: vertical ? 0 : undefined, width: vertical ? '100%' : undefined, textAlign: vertical ? 'center' : 'right', bottom: vertical ? 110 : 34, fontFamily: MONO, fontWeight: 600, fontSize: vertical ? 30 : 22, letterSpacing: 4, color: E60.plata}}>ENIGMA 60</div>
		</AbsoluteFill>
	);
};

export const ObservatorioEscape: React.FC<PropsC> = (props) => {
	const {ficha} = props;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const P0 = planificarC(props);
	const T = P0.t;
	const e = estadoObservatorio(t, P0);
	const cb = cambios(P0);

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
	const fichasVis = bloqueAct ? interpolate(t, [ex[bloqueAct].a - 0.4, ex[bloqueAct].a, ex[bloqueAct].b, ex[bloqueAct].b + 0.4], [1, 0, 0, 1], clamp) * interpolate(t, [P0.mecanismo[bloqueAct].inicio - 0.6, P0.mecanismo[bloqueAct].inicio], [1, 0], clamp) : 0;
	const fundidoIn = interpolate(t, [0, 1.2], [1, 0], clamp);
	const fundidoOut = interpolate(t, [P0.total - 1.2, P0.total], [0, 1], clamp);
	const negroSala = Math.max(...[cb.p2, cb.p3, cb.p4].map((c) => interpolate(t, [c - 0.9, c - 0.1, c + 0.1, c + 0.9], [0, 1, 1, 0], clamp)));
	const destello = interpolate(t, [T.e01.inicio + 0.2, T.e01.inicio + 0.8, T.e01.inicio + 2.0], [0, 0.35, 0], clamp);
	const finalDesde = (ficha.pantalla_final_s ?? 0) > 0 ? T.f02.fin + 3.0 : P0.total + 1;
	const ocultaFinal = interpolate(t, [finalDesde - 0.6, finalDesde], [1, 0], clamp);
	const chipSus = T.b12 ? interpolate(t, [T.b12.inicio + 0.4, T.b12.inicio + 0.9, T.b12.fin + 1.4, T.b12.fin + 1.9], [0, 1, 1, 0], clamp) : 0;

	return (
		<AbsoluteFill style={{background: '#08080c', overflow: 'hidden'}}>
			<Observatorio3D e={e} />
			<BordeMaqueta16 />
			<Cabecera16 t={t} temporada={ficha.temporada} capitulo={ficha.capitulo} titulo={ficha.titulo} desde={P0.titulo.fin} unidad="SALA" />
			<TituloCapitulo t={t} inicio={P0.titulo.inicio} fin={P0.titulo.fin} temporada={ficha.temporada} capitulo={ficha.capitulo} titulo={ficha.titulo} unidad="SALA" />
			{BLOQUES.map((b, i) => (
				<RotuloPuzle key={b} t={t} inicio={P0.bloques[b].inicio - 0.6} n={i + 1} total={BLOQUES.length} titulo={ficha.puzles[i].titulo} />
			))}
			<LunaHUD t={t} desde={T.g02.inicio + 0.5} hasta={T.d11.inicio + 3} minutos={minutos(t, P0)} oculto={chipSus} />
			<Fichas16 t={t} pistas={fichas} visible={fichasVis} />
			{BLOQUES.map((b) => (
				<Anillo16 key={b} t={t} inicio={P0.pensar[b].inicio} fin={P0.pensar[b].fin} />
			))}
			<ExpCajas t={t} a={ex.p1.a} b={ex.p1.b} T={T} />
			<ExpFarolas t={t} a={ex.p2.a} b={ex.p2.b} T={T} />
			<ExpAnillos t={t} a={ex.p3.a} b={ex.p3.b} T={T} />
			<ExpEspejos t={t} a={ex.p4.a} b={ex.p4.b} T={T} />
			<Recuento t={t} a={T.f01.inicio} b={T.f02.fin + 1.5} puzles={ficha.puzles} rotulo="SOLUCIONES DEL OBSERVATORIO" />
			<AbsoluteFill style={{opacity: ocultaFinal}}>
				<Proximo t={t} desde={T.f02.inicio} siguiente={ficha.siguiente} aviso={ficha.aviso_ia} rotulo="EL MIÉRCOLES" />
			</AbsoluteFill>
			{T.b12 && <ChipNarrativo t={t} a={T.b12.inicio + 0.9} b={T.b12.fin + 1.2} icono="sus" texto="SUSCRÍBETE" />}
			{(ficha.pantalla_final_s ?? 0) > 0 && <ChipNarrativo t={t} a={T.f02.inicio + 2.5} b={T.f02.fin + 1.2} icono="campana" texto="ACTIVA LA CAMPANITA" />}
			<PantallaFinal t={t} desde={finalDesde} total={P0.total} />
			{linea && <Subtitulo16 texto={linea.texto} inicio={linea.inicio} fin={linea.fin} t={t} />}
			{BLOQUES.map((b) => (
				<CortinaEngranajes key={b} t={t} en={P0.mecanismo[b].inicio + 1.6} />
			))}
			<AbsoluteFill style={{background: '#e8eeff', opacity: destello}} />
			<AbsoluteFill style={{background: '#08080c', opacity: Math.max(fundidoIn, fundidoOut, negroSala)}} />
			<PortadaEnVideo t={t} temporada={ficha.temporada} capitulo={ficha.capitulo} titulo={ficha.titulo} unidad="SALA">
				<MiniaturaObservatorio />
			</PortadaEnVideo>
			<SonidoObservatorio ficha={ficha} P0={P0} fps={fps} />
		</AbsoluteFill>
	);
};

export const SonidoObservatorio: React.FC<{ficha: PropsC['ficha']; P0: PlanC; fps: number}> = ({ficha, P0, fps}) => {
	const T = P0.t;
	const M = P0.mecanismo;
	const cb = cambios(P0);
	const fr = (s: number) => Math.max(0, Math.round(s * fps));
	const sfx = (name: string, at: number, vol = 0.6) => (
		<Sequence from={fr(at)} key={name + at}>
			<Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={vol} />
		</Sequence>
	);
	const b09 = (x: number) => T.b09.inicio + (T.b09.fin - T.b09.inicio) * x;
	return (
		<>
			<Audio src={staticFile('audio/sfx/viento.wav')} volume={0.12} loop />
			<Sequence from={fr(cb.p3)} durationInFrames={fr(cb.p4 - cb.p3)}>
				<Audio src={staticFile('audio/sfx/fuego.wav')} volume={0.18} loop />
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
			{sfx('logo', P0.titulo.inicio, 0.45)}
			{sfx('apagar', T.g04.inicio, 0.35)}
			{BLOQUES.map((b) => Array.from({length: ficha.pensar_s}, (_, i) => sfx('tic', P0.pensar[b].inicio + i, 0.45)))}
			{BLOQUES.map((b) => sfx('cerrojo', M[b].inicio + 1.4, 0.55))}
			{[cb.p2, cb.p3, cb.p4].map((c) => [sfx('bisagra', c - 5.5, 0.5), sfx('aire', c - 1.0, 0.3)])}
			{sfx('cerrojo', b09(0.05), 0.5)}
			{sfx('cerrojo', b09(0.55), 0.5)}
			{sfx('piedra', M.p2.inicio + 2.0, 0.35)}
			{sfx('golpe', M.p3.inicio + 0.8, 0.4)}
			{sfx('cristal', T.d09.inicio + (T.d09.fin - T.d09.inicio) * 0.9, 0.45)}
			{sfx('piedra', T.e01.inicio + 0.2, 0.5)}
			{sfx('campana', T.e02.inicio + 0.5, 0.3)}
			{sfx('logo', T.f02.inicio, 0.45)}
			{P0.lineas.map((l) => (
				<Sequence key={l.id} from={fr(l.inicio)}>
					<Audio src={staticFile(`audio/${ficha.id}/${l.id}.wav`)} volume={1} />
				</Sequence>
			))}
		</>
	);
};

export const ObservatorioEscapeAudio: React.FC<PropsC> = (props) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<SonidoObservatorio ficha={props.ficha} P0={planificarC(props)} fps={fps} />
		</AbsoluteFill>
	);
};
