import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {cargarFuentes} from '../style/fonts';
import {CortinaEngranajes} from '../e60/nucleo';
import {EstadoCap, SalaCapitulo3D} from './SalaCapitulo3D';
import {PlanC, PropsC, planificarC} from './plan';
import {ChipNarrativo, PantallaFinal} from '../escape/EscapeRoom';
import {
	Anillo16, BordeMaqueta16, Cabecera16, ExpCajas16, ExpCajones, ExpGiro, ExpReloj, Fichas16, Proximo, Recuento,
	RotuloPuzle, Subtitulo16, TituloCapitulo, PortadaEnVideo,
} from './ui';

cargarFuentes();

// ENIGMA 60 · «Profundidad 600» · capítulo 1 «La sala de lastre» (16:9). Coreografía ligada a las líneas de la ficha.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
type V3 = [number, number, number];

const PLANOS: Record<string, {pos: V3; mira: V3; fov?: number}> = {
	suelo: {pos: [0.3, -0.75, 4.55], mira: [0.25, -1.55, 3.3]},
	sala: {pos: [1.1, 0.4, 5.2], mira: [-0.4, 0.0, -2.0], fov: 58},
	sala2: {pos: [0.6, 0.3, 4.8], mira: [-0.1, 0.2, -6], fov: 56},
	caja: {pos: [1.05, -0.6, 4.25], mira: [0.75, -1.45, 3.0]},
	cuaderno: {pos: [0.86, -0.92, 3.55], mira: [0.75, -1.45, 2.98], fov: 46},
	cuadro: {pos: [0.4, 0.1, 2.9], mira: [2.25, -0.3, 1.3]},
	cajones: {pos: [0.7, -0.5, 2.55], mira: [2.1, -1.0, 1.3]},
	tanques: {pos: [1.1, 0.45, 1.6], mira: [-1.0, 0.2, -2.6], fov: 56},
	AB: {pos: [0.95, 0.5, 0.75], mira: [-1.0, 0.33, -1.75]},
	C: {pos: [0.9, 0.5, -1.7], mira: [-1.0, 0.33, -3.45]},
	placa: {pos: [0.15, 0.3, -0.95], mira: [2.28, 0.1, -2.2]},
	valvulas: {pos: [0.8, -0.2, 0.6], mira: [-1.0, -0.85, -2.45]},
	bascula: {pos: [0.62, 0.2, 1.05], mira: [0.62, -0.62, -0.5]},
	armario: {pos: [0.4, 0.1, -3.5], mira: [1.55, -0.6, -5.8]},
	reloj: {pos: [0.75, 0.8, -3.75], mira: [1.45, 1.1, -5.93], fov: 46},
	escotilla: {pos: [0.15, 0.35, -3.2], mira: [0, 0.5, -6]},
	dial: {pos: [0.1, 0.95, -4.35], mira: [0, 1.15, -5.93], fov: 48},
	pasillo: {pos: [0.1, 0.25, -4.7], mira: [0, 0.1, -10]},
	altavoz: {pos: [0.2, 0.1, -3.6], mira: [0, 1.5, -5.5]},
	final: {pos: [0.1, 0.2, -5.1], mira: [0, 0.1, -10.4]},
};

const PLANO_DE: Record<string, string> = {
	n01: 'suelo', x01: 'sala', n03: 'sala', n04: 'sala2', n05: 'sala',
	n06: 'caja', n07: 'cuaderno', r01: 'caja', n12: 'cuaderno', n14: 'caja',
	x02: 'sala', n15: 'tanques', n16: 'cuadro', n17: 'cajones', n24: 'cuadro', x03: 'tanques',
	n25: 'tanques', n27: 'AB', n28: 'C', n29: 'placa', r03: 'tanques', n30: 'tanques', n33: 'valvulas',
	n34: 'armario', n36: 'reloj', n41: 'armario', n49: 'escotilla',
	n50: 'pasillo', n52: 'altavoz', n54: 'final',
};

const PISTA_DE: Record<string, string[]> = {
	n06: ['caja'], n07: ['caja'], n08: ['caja'], n09: ['caja'], n10: ['caja'], r01: ['caja'],
	n16: ['cuadro'], n17: ['cajones'], n18: ['cajones'], n19: ['cajones'], r02: ['cajones'],
	n27: ['A', 'B'], n28: ['C', 'B'], n29: ['placa'], r03: ['A', 'B', 'C'],
	n34: ['armario'], n35: ['armario'], n36: ['reloj'], n37: ['reloj'], r04: ['reloj'],
};

const FICHAS: Record<string, string> = {
	n09: 'En la tapa se lee: 16',
	n10: 'El cuaderno flota boca abajo',
	n17: 'Arriba SONAR · medio ROTOR · abajo RADAR',
	n18: 'Igual del derecho y del revés · no es el del medio',
	n19: 'Solo puedes forzar un cajón',
	n27: 'A = 2 × B',
	n28: 'C = B + 3',
	n29: 'A + B + C = 19',
	n36: 'El reloj se paró a las 3:10',
	n37: 'Inundación 45 min antes · alarma 20 min después',
};
// Quién habla (v2 21/11): rótulo y color del subtítulo de cada personaje. El narrador no lleva rótulo.
const HABLA: Record<string, [string, string]> = {
	custodio: ['OPERADOR CERO · ALTAVOCES DEL ABISAL', '#3FE0E6'],
	archivera: ['ALMA · RADIO DEL VIGÍA', '#F2B35B'],
	conservador: ['DAMIÁN · RADIO DEL VIGÍA', '#9FD18B'],
};
const BLOQUES = ['p1', 'p2', 'p3', 'p5']; // v1 20/11: 4 puzles (p4 báscula y p6 volante retirados por repetir familia)

const camara = (t: number, P: PlanC): EstadoCap['cam'] => {
	const ev: {t: number; plano: string; dur: number}[] = [{t: 0, plano: 'suelo', dur: 0.1}];
	let bloquePrev = 'gancho';
	for (const l of P.lineas) {
		const p = PLANO_DE[l.id];
		const cambia = l.bloque !== bloquePrev;
		if (p) ev.push({t: l.inicio - (cambia ? 6 : l.fase === 'accion' ? 4.6 : 1.2), plano: p, dur: cambia ? 5 : 1.4});
		bloquePrev = l.bloque;
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
	// empuje lento hacia el objeto mientras dura el plano + deriva continua
	const sig = ev[k + 1]?.t ?? P.total;
	const push = interpolate(t, [ev[k].t + ev[k].dur, sig], [0, 0.1], clamp);
	for (let i = 0; i < 3; i++) pos[i] += (mira[i] - pos[i]) * push;
	// deriva continua (balanceo del submarino): v1 20/11 más amplia, la QA marcaba segundos congelados en planos oscuros
	pos[0] += Math.sin(t * 0.7) * 0.05 + Math.sin(t * 0.23) * 0.04;
	pos[1] += Math.sin(t * 0.53 + 1) * 0.035;
	mira[0] += Math.sin(t * 0.41 + 2) * 0.06;
	mira[1] += Math.sin(t * 0.31 + 0.5) * 0.03;
	const fov = (prev.fov ?? 52) + ((cur.fov ?? 52) - (prev.fov ?? 52)) * f;
	return {pos, mira, fov};
};

export const Capitulo: React.FC<PropsC> = (props) => {
	const {ficha} = props;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const P = planificarC(props);
	const T = P.t;
	const M = P.mecanismo;
	const tr = (a: number, b: number, v0: number, v1: number, ease = io) => interpolate(t, [a, b], [v0, v1], {...clamp, easing: ease});

	// ---- estado de la sala
	const linterna = tr(T.n14.inicio + 0.8, T.n14.inicio + 1.6, 0, 1);
	const caja = tr(M.p1.inicio + 0.6, M.p1.inicio + 1.8, 0, 1, Easing.out(Easing.back(1.3)));
	const linternaEnCaja = caja > 0 ? tr(T.n14.inicio + 0.6, T.n14.inicio + 1.0, 1, 0) : 0;
	const cajon = tr(M.p2.inicio - 0.2, M.p2.inicio + 0.6, 0, 1, Easing.out(Easing.cubic));
	const fusible = tr(M.p2.inicio + 0.7, M.p2.inicio + 2.6, 0, 1);
	const energia = tr(M.p2.inicio + 2.7, M.p2.inicio + 3.4, 0, 1);
	const chispa = interpolate(t, [M.p2.inicio + 2.6, M.p2.inicio + 2.7, M.p2.inicio + 3.2], [0, 1, 0], clamp);
	const sol3 = T.n31.inicio;
	const asiento = tr(sol3 - 0.2, sol3 + 1.3, 0, 1, Easing.out(Easing.back(2.2)));
	const baila = (i: number) => 5 + 3.8 * Math.sin(t * (1.7 + i * 0.6) + i * 2) + 1.2 * Math.sin(t * (7.3 + i) + i);
	const agujas = [8, 4, 7].map((r, i) => (baila(i) * (1 - asiento) + r * asiento) * energia) as EstadoCap['agujas'];
	const valv = (i: number, r: number) => tr(M.p3.inicio + 0.3 + i * 0.8, M.p3.inicio + 1.0 + i * 0.8, 0, -r * 0.62, Easing.out(Easing.back(1.5)));
	const soplado = interpolate(t, [M.p3.inicio + 2.6, M.p3.inicio + 2.9, M.p3.fin, M.p3.fin + 2.0], [0, 1, 1, 0], clamp);
	const agua = interpolate(t, [0, M.p3.inicio + 3], [-1.64, -1.34], clamp);
	// el suelo se inclina al soltar el lastre y vuelve a nivelarse durante la frase de la acción
	const inclinacion = interpolate(t, [M.p3.inicio + 3.0, M.p3.inicio + 4.5, M.p3.fin - 1.0, M.p3.fin + 1.5], [0, 0.055, 0.055, 0], {...clamp, easing: io});
	const pesas: EstadoCap['pesas'] = [0, 0, 0];
	const brazo = 0;
	const n40 = T.n40;
	const relojMin = interpolate(t, [n40.inicio + 0.3, n40.inicio + 0.45 * (n40.fin - n40.inicio), n40.inicio + 0.55 * (n40.fin - n40.inicio), n40.fin - 0.3], [190, 145, 145, 165], {...clamp, easing: io});
	const tv = n40.inicio + 0.45 * (n40.fin - n40.inicio);
	const violeta = interpolate(t, [tv - 0.2, tv, tv + 1.4, tv + 1.9], [0, 1, 1, 0], clamp);
	const armario = tr(M.p5.inicio + 0.6, M.p5.inicio + 2.0, 0, 1, Easing.out(Easing.cubic));
	// palanca de emergencia: el volante gira solo y la escotilla cede
	const indicador = tr(T.n49.inicio + 0.2, T.n49.inicio + 2.4, 0, 10);
	const escotilla = tr(T.n49.fin - 1.6, T.n49.fin + 0.6, 0, 1, Easing.out(Easing.cubic));
	const altavoz = interpolate(t, [T.n52.inicio - 1.2, T.n52.inicio - 0.2, T.n53.fin + 0.3, T.n53.fin + 1.2], [0, 1, 1, 0], clamp);
	const alarma = interpolate(t, [M.p3.fin, M.p3.fin + 1.5, T.n50.inicio, T.n50.inicio + 2], [1, 0.45, 0.45, 0.2], clamp);

	// luz de pista cian
	const pista: Record<string, number> = {};
	const sube = (k: string, v: number) => (pista[k] = Math.max(pista[k] ?? 0, v));
	for (const l of P.lineas) {
		const objs = PISTA_DE[l.id];
		if (!objs) continue;
		const v = interpolate(t, [l.inicio - 0.3, l.inicio, l.fin + 0.4, l.fin + 0.9], [0, 1, 1, 0], clamp);
		objs.forEach((o, j) => sube(o, j === 0 ? v : v * 0.6));
	}
	const enPensar: Record<string, string[]> = {p1: ['caja'], p2: ['cajones'], p3: ['A', 'B', 'C'], p5: ['reloj']};
	for (const b of BLOQUES) {
		const pe = P.pensar[b];
		const v = interpolate(t, [pe.inicio, pe.inicio + 0.5, pe.fin, pe.fin + 0.5], [0, 0.55, 0.55, 0], clamp);
		enPensar[b].forEach((o) => sube(o, v));
	}
	sube('A', interpolate(t, [sol3, sol3 + 0.4, M.p3.fin, M.p3.fin + 0.6], [0, 0.8, 0.8, 0], clamp));
	sube('B', interpolate(t, [sol3, sol3 + 0.4, M.p3.fin, M.p3.fin + 0.6], [0, 0.8, 0.8, 0], clamp));
	sube('C', interpolate(t, [sol3, sol3 + 0.4, M.p3.fin, M.p3.fin + 0.6], [0, 0.8, 0.8, 0], clamp));

	// guante (subjetiva): solo cuando las manos actúan
	const w = (a: number, b: number) => interpolate(t, [a - 0.4, a, b, b + 0.5], [0, 1, 1, 0], clamp);
	let guante: EstadoCap['guante'] = {visible: 0, pos: [0, 0, 0], rot: [0, 0, 0]};
	const gGancho = interpolate(t, [0.5, 1.2, T.n02.fin, T.n02.fin + 0.8], [0, 1, 1, 0], clamp);
	const g1 = w(M.p1.inicio + 0.2, M.p1.inicio + 2.0);
	const g2 = w(M.p2.inicio - 0.3, M.p2.inicio + 2.8);
	const g3 = w(M.p3.inicio, M.p3.inicio + 2.6);
	const g6 = w(T.n49.inicio, T.n49.inicio + 2.6);
	if (gGancho > 0) guante = {visible: gGancho, pos: [0.28, interpolate(t, [0, T.n02.fin], [-1.48, -1.58], clamp), 3.55], rot: [0.35, 0.3, 0]};
	else if (g1 > 0) guante = {visible: g1, pos: [0.82, agua + 0.32 - caja * 0.05, 3.3], rot: [0.5, 0.4, 0]};
	else if (g2 > 0) {
		const a = interpolate(t, [M.p2.inicio + 0.7, M.p2.inicio + 2.6], [0, 1], clamp);
		guante = {visible: g2, pos: [1.6 + a * 0.35, -0.95 + a * 1.3, 1.45], rot: [Math.PI / 2, -Math.PI / 2, 0], orden: 'YXZ'};
	} else if (g3 > 0) {
		const z = interpolate(t, [M.p3.inicio, M.p3.inicio + 0.4, M.p3.inicio + 1.2, M.p3.inicio + 2.0, M.p3.inicio + 2.6], [-1.0, -1.0, -2.6, -2.6, -4.2], {...clamp, easing: io});
		guante = {visible: g3, pos: [-0.66, -1.02, z], rot: [Math.PI / 2, Math.PI / 2, 0], orden: 'YXZ'};
	} else if (g6 > 0) guante = {visible: g6, pos: [0.25, 0.05, -5.5], rot: [Math.PI / 2, 0, 0]};

	const e: EstadoCap = {
		t, cam: camara(t, P), agua, agujas, pista, valvulas: [valv(0, 8), valv(1, 4), valv(2, 7)], escotilla, violeta, guante, alarma, soplado,
		linterna, energia, inclinacion, caja, linternaEnCaja, cajon, fusible, chispa, brazo, pesas, relojMin, armario, indicador, altavoz,
	};

	// ---- interfaz
	const linea = P.lineas.find((l) => t >= l.inicio - 0.1 && t < l.fin + 0.35);
	const bloqueAct = BLOQUES.find((b) => t >= P.bloques[b].inicio - 0.5 && t < P.bloques[b].fin + 1.5);
	const explicando = (b: string) => {
		const sol = P.lineas.filter((l) => l.bloque === b && (l.fase === 'solucion' || l.fase === 'comprobacion'));
		return {a: sol[0].inicio, b: sol[sol.length - 1].fin + 0.6};
	};
	const ex = Object.fromEntries(BLOQUES.map((b) => [b, explicando(b)]));
	const fichas = bloqueAct
		? P.lineas
				.filter((l) => l.bloque === bloqueAct && FICHAS[l.id])
				.map((l) => ({texto: FICHAS[l.id], desde: l.inicio + 0.3, activa: interpolate(t, [l.inicio, l.inicio + 0.3, l.fin + 0.4, l.fin + 0.8], [0, 1, 1, 0], clamp)}))
		: [];
	const fichasVis = bloqueAct ? interpolate(t, [ex[bloqueAct].a - 0.4, ex[bloqueAct].a, ex[bloqueAct].b, ex[bloqueAct].b + 0.4], [1, 0, 0, 1], clamp) * interpolate(t, [P.bloques[bloqueAct].fin, P.bloques[bloqueAct].fin + 1.2], [1, 0], clamp) : 0;
	// últimos 20 s: pantalla final de YouTube (CRECIMIENTO.md §5)
	const finalDesde = (ficha.pantalla_final_s ?? 0) > 0 ? T.n56.fin + 3.0 : P.total + 1;
	const fundidoIn = interpolate(t, [0, 0.8], [1, 0], clamp);
	const fundidoOut = interpolate(t, [P.total - 1.2, P.total], [0, 1], clamp);
	const ganchoOscuro = interpolate(t, [0, 3.5], [1, 0.25], clamp) * interpolate(t, [3.5, 6], [1, 0], clamp);


	return (
		<AbsoluteFill style={{background: '#0b0f12', overflow: 'hidden'}}>
			<SalaCapitulo3D e={e} />
			{/* parpadeo leve de la luz de emergencia del submarino (blanca cálida, no tiñe objetos): evita segundos congelados en planos oscuros */}
			<AbsoluteFill style={{background: '#fff4e0', opacity: 0.016 + 0.016 * Math.sin(t * 1.7) + 0.006 * Math.sin(t * 5.3)}} />
			<AbsoluteFill style={{background: '#dff6ff', opacity: interpolate(t, [M.p3.inicio + 2.6, M.p3.inicio + 2.7, M.p3.inicio + 3.3], [0, 0.3, 0], clamp)}} />
			<BordeMaqueta16 />
			<Cabecera16 t={t} temporada={ficha.temporada} capitulo={ficha.capitulo} titulo={ficha.titulo} desde={P.titulo.fin} />
			<TituloCapitulo t={t} inicio={P.titulo.inicio} fin={P.titulo.fin} temporada={ficha.temporada} capitulo={ficha.capitulo} titulo={ficha.titulo} />
			{BLOQUES.map((b, i) => (
				<RotuloPuzle key={b} t={t} inicio={P.bloques[b].inicio - 0.6} n={i + 1} total={BLOQUES.length} titulo={ficha.puzles[i].titulo} />
			))}
			<Fichas16 t={t} pistas={fichas} visible={fichasVis} />
			{BLOQUES.map((b) => (
				<Anillo16 key={b} t={t} inicio={P.pensar[b].inicio} fin={P.pensar[b].fin} />
			))}
			<ExpGiro t={t} a={ex.p1.a} b={ex.p1.b} />
			<ExpCajones t={t} a={ex.p2.a} b={ex.p2.b} />
			<ExpCajas16 t={t} a={ex.p3.a} b={ex.p3.b} valor={4} />
			<ExpReloj t={t} a={ex.p5.a} b={ex.p5.b} />
			<Recuento t={t} a={T.n54.inicio} b={T.n56.fin + 1.5} puzles={ficha.puzles} />
			<AbsoluteFill style={{opacity: interpolate(t, [finalDesde - 0.2, finalDesde + 0.8], [1, 0], clamp)}}>
				<Proximo t={t} desde={T.n56.inicio} siguiente={ficha.siguiente} aviso={ficha.aviso_ia} />
			</AbsoluteFill>
			{T.s01 && <ChipNarrativo t={t} a={T.s01.inicio + 0.6} b={T.s01.fin + 1.0} icono="sus" texto="SUSCRÍBETE" />}
			<ChipNarrativo t={t} a={T.n56.inicio + 2.0} b={T.n56.fin + 1.2} icono="campana" texto="ACTIVA LA CAMPANITA" />
			<PantallaFinal t={t} desde={finalDesde} total={P.total} titulo={(ficha as any).pantalla_final_titulo} />
			{linea && <Subtitulo16 texto={linea.texto} inicio={linea.inicio} fin={linea.fin} t={t} custodio={Boolean(HABLA[linea.fase])} quien={HABLA[linea.fase]?.[0]} color={HABLA[linea.fase]?.[1]} />}
			{BLOQUES.map((b) => (
				<CortinaEngranajes key={b} t={t} en={P.mecanismo[b].inicio + 1.6} />
			))}
			<AbsoluteFill style={{background: '#14151A', opacity: Math.max(fundidoIn, fundidoOut, ganchoOscuro * 0.6)}} />

			<PortadaEnVideo t={t} temporada={ficha.temporada} capitulo={ficha.capitulo} titulo={ficha.titulo} />
			<SonidoCapitulo ficha={ficha} P={P} fps={fps} />
		</AbsoluteFill>
	);
};

/** Pista de sonido del capítulo (voz, efectos y ambiente). La usan el vídeo y la composición solo-audio. */
export const SonidoCapitulo: React.FC<{ficha: PropsC['ficha']; P: PlanC; fps: number}> = ({ficha, P, fps}) => {
	const T = P.t;
	const M = P.mecanismo;
	const sfx = (name: string, at: number, vol = 0.6) => (
		<Sequence from={Math.max(0, Math.round(at * fps))} key={name + at}>
			<Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={vol} />
		</Sequence>
	);
	const gotas = Array.from({length: Math.floor(P.total / 2.7)}, (_, i) => 1.2 + i * 2.7 + (i % 3) * 0.5);
	const caseo = Array.from({length: Math.floor(P.total / 47)}, (_, i) => 9 + i * 47 + (i % 4) * 6);
	return (
		<>
			<Audio src={staticFile('audio/sfx/ambiente.wav')} volume={0.4} loop />
			{sfx('golpe', 2.0, 0.7)}
			{sfx('alarma', 3.0, 0.3)}
			{sfx('alarma', T.n04.inicio, 0.22)}
			{sfx('logo', P.titulo.inicio, 0.45)}
			{caseo.map((c) => sfx('casco', c, 0.45))}
			{caseo.map((c) => sfx('sonar', c + 21, 0.22))}
			{gotas.map((g0) => sfx('gota', g0, 0.15))}
			{BLOQUES.map((b) => Array.from({length: ficha.pensar_s}, (_, i) => sfx('tic', P.pensar[b].inicio + i, 0.45)))}
			{BLOQUES.map((b) => sfx('cerrojo', P.mecanismo[b].inicio + 1.4, 0.6))}
			{BLOQUES.map((b) => sfx('golpe', P.mecanismo[b].inicio + 1.6, 0.35))}
			{[0, 1, 2].map((i) => sfx('cerrojo', M.p3.inicio + 0.95 + i * 0.8, 0.5))}
			{sfx('aire', M.p3.inicio + 2.6, 0.7)}
			{sfx('burbujas', M.p3.inicio + 2.7, 0.6)}
			{sfx('casco', M.p3.inicio + 3.2, 0.6)}
			{sfx('casco', M.p3.fin + 0.2, 0.5)}
			{sfx('campana', M.p2.inicio + 2.6, 0.2)}
			{sfx('cerrojo', T.n49.inicio + 0.2, 0.55)}
			{sfx('bisagra', T.n49.fin - 1.6, 0.6)}
			{sfx('logo', T.n56.inicio, 0.45)}
			{P.lineas.map((l) => (
				<Sequence key={l.id} from={Math.round(l.inicio * fps)}>
					<Audio src={staticFile(`audio/${ficha.id}/${l.id}.wav`)} volume={1} />
				</Sequence>
			))}
		</>
	);
};

/** Composición solo-audio: misma pista que el capítulo, sin escena (render de audio en segundos). */
export const CapituloAudio: React.FC<PropsC> = (props) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<SonidoCapitulo ficha={props.ficha} P={planificarC(props)} fps={fps} />
		</AbsoluteFill>
	);
};
