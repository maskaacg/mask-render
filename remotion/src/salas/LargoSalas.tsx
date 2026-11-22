import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate as interpolateRaw, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {cargarFuentes, MONO, OSWALD, SERIF} from '../style/fonts';
import {E60} from '../e60/nucleo';
import {FichaC, PlanC, PropsC, planificarC} from '../capitulo/plan';
import {Sala, SalaCorto3D, EstadoSalaCorto, centroPuzle} from './SalaCorto3D';
import {PUZLES_3D, Tiempos} from './PuzlesSemana3D';
import {PUZLES_LARGOS} from './PuzlesLargos3D';

cargarFuentes();

// ENIGMA 60 · Vídeo largo 16:9 por salas, descrito por completo en la ficha (Claude, 22/11/2026).
// Sirve para escape rooms y capítulos: cada bloque (p1…p5) tiene su sala 3D y su mecanismo; los bloques
// narrativos (gancho, escenas, final) usan la sala que indique `escenas`. Auditoría del 22/11 aplicada:
// portada 1,2 s, gancho con imagen desde el segundo 0, transiciones cortas, luz local en cada puzle,
// pizarra legible (≥ 40 px a 1080p), cuentas paso a paso, suscripción a mitad y pantalla final con movimiento.
const interpolate = (x: number, a: readonly number[], b: readonly number[], o?: Parameters<typeof interpolateRaw>[3]): number => {
	const r = [...a];
	for (let i = 1; i < r.length; i++) if (!(r[i] > r[i - 1])) r[i] = r[i - 1] + 0.001;
	return interpolateRaw(x, r, b as number[], o) as number;
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
const AMBAR = '#F0B955';
const TURQ = '#3fd0c0';
type V3 = [number, number, number];
type Pizarra = {desde: string; filas: {etiqueta?: string; texto: string; color?: string}[]; pregunta?: string};
export type BloqueSala = {
	sala: Sala;
	tipo?: string; // mecanismo de PUZLES_3D o PUZLES_LARGOS
	puzle?: Record<string, unknown>;
	camara: {alto: number; dist: number; mira: number; fov: number; x?: number};
	alias?: Record<string, string>; // nombre que usa el mecanismo (l06…) → id real de la línea
	pizarra?: Pizarra;
	titulo?: string; // rótulo de la sala
	sombras?: boolean;
};
export type FichaLargo = FichaC & {
	tipo_largo: 'escape' | 'capitulo';
	etiqueta: string; // «ESCAPE ROOM #4» o «PROFUNDIDAD 600 · 2»
	salas: Record<string, BloqueSala>; // por bloque
	escenas?: Record<string, string>; // bloque narrativo → bloque cuya sala reutiliza
	cuentas?: Record<string, {linea: string; texto: string; ok?: boolean}[]>;
	suscribir_en?: string; // línea donde aparece la tarjeta de suscripción
	voces_rotulo?: Record<string, {nombre: string; color: string}>;
};
type P = PropsC & {ficha: FichaLargo};

const salaDe = (f: FichaLargo, b: string): string => (f.salas[b] ? b : f.escenas?.[b] ?? Object.keys(f.salas)[0]);
const bloqueEn = (P0: PlanC, t: number, orden: string[]) => {
	let b = orden[0];
	for (const k of orden) if (P0.bloques[k] && t >= P0.bloques[k].inicio - 0.01) b = k;
	// durante la transición ya se ve la sala siguiente (tras el fundido)
	for (const tr of P0.transiciones) if (t >= (tr.inicio + tr.fin) / 2 && t < tr.fin) b = tr.a;
	return b;
};

const Escena: React.FC<{f: FichaLargo; P0: PlanC; t: number; b: string}> = ({f, P0, t, b}) => {
	const sk = salaDe(f, b);
	const B = f.salas[sk];
	const c = centroPuzle(B.sala);
	const z0 = c[2];
	const cam = B.camara;
	const tb = Math.max(0, t - (P0.bloques[b]?.inicio ?? 0));
	const pz = P0.pensar[sk];
	const enPensar = pz && t >= pz.inicio && t < pz.fin;
	// cámara: plano del puzle con un avance lento y un vaivén suave (nunca segundos congelados)
	const avance = Math.min(0.35, tb * 0.006) * (enPensar ? 0.2 : 1);
	const pos: V3 = [(cam.x ?? 0) + Math.sin(t * 0.21) * 0.05 + Math.sin(t * 0.6) * 0.012, c[1] + cam.alto + Math.sin(t * 0.17) * 0.02, z0 + cam.dist - avance];
	const mira: V3 = [cam.x ?? 0, c[1] + cam.mira, z0];
	// alias de líneas del mecanismo → tiempos reales
	const L: Tiempos['L'] = {};
	for (const [k, v] of Object.entries(P0.t)) L[k] = v;
	for (const [a, id] of Object.entries(B.alias ?? {})) if (P0.t[id]) L[a] = P0.t[id];
	const solL = P0.lineas.filter((l) => l.bloque === sk && (l.fase === 'solucion' || l.fase === 'comprobacion' || l.fase === 'accion'));
	const finSol = solL.length ? solL[solL.length - 1].fin + 0.4 : 1e6;
	const tm: Tiempos = {t, L, F: {pensar: pz ?? {inicio: 1e6, fin: 1e6}}, finSol, total: P0.total, c};
	const Pz = B.tipo ? PUZLES_3D[B.tipo] ?? PUZLES_LARGOS[B.tipo] : undefined;
	const e: EstadoSalaCorto = {t, cam: {pos, mira, fov: cam.fov}, puerta: interpolate(t, [finSol, finSol + 2], [0, 1], {...clamp, easing: io}), foco: B.tipo ? 0.85 : 0.4};
	return (
		<SalaCorto3D s={B.sala} e={e} ancho={1280} alto={720} escala={1920 / 1280} sombras={!!(Pz?.sombras || B.sombras)}>
			{Pz && B.puzle && <Pz.C p={B.puzle} tm={tm} />}
		</SalaCorto3D>
	);
};

export const LargoSalas: React.FC<P> = (props) => {
	const f = props.ficha;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const P0 = planificarC(props);
	const orden = [...new Set(f.lineas.map((l) => l.bloque))];
	const b = bloqueEn(P0, t, orden);
	const sk = salaDe(f, b);
	const B = f.salas[sk];
	const linea = P0.lineas.find((l) => t >= l.inicio && t < l.fin + 0.35);
	const pz = P0.pensar[sk];
	const enPensar = !!pz && t >= pz.inicio - 0.1 && t < pz.fin + 0.2;
	const pzK = pz ? interpolate(t, [pz.inicio, pz.fin], [0, 1], clamp) : 0;
	const secs = pz ? Math.max(0, Math.ceil(f.pensar_s * (1 - pzK) - 1e-6)) : 0;
	// fundidos: transiciones entre salas (a negro en el centro) y cierre
	let negro = interpolate(t, [P0.total - 1.2, P0.total], [0, 1], clamp);
	let rotuloTr = '';
	let trO = 0;
	for (const tr of P0.transiciones) {
		const m = (tr.inicio + tr.fin) / 2;
		const o = interpolate(t, [tr.inicio, m - 0.2, m + 0.2, tr.fin], [0, 1, 1, 0], clamp);
		if (o > negro) negro = o;
		if (t >= tr.inicio && t < tr.fin) {
			rotuloTr = f.salas[salaDe(f, tr.a)]?.titulo ?? '';
			trO = interpolate(t, [tr.inicio + 0.3, m, tr.fin - 0.3], [0, 1, 0], clamp);
		}
	}
	const portada = interpolate(t, [0, 1.2, 1.6], [1, 1, 0], clamp);
	const tit = interpolate(t, [P0.titulo.inicio, P0.titulo.inicio + 0.6, P0.titulo.fin - 0.6, P0.titulo.fin], [0, 1, 1, 0], clamp);
	// pizarra de datos del puzle
	const pizL = B.pizarra ? P0.t[B.pizarra.desde] : undefined;
	const pizO = pizL && pz ? interpolate(t, [pizL.inicio - 0.3, pizL.inicio + 0.3, pz.fin + 0.2, pz.fin + 0.7], [0, 1, 1, 0], clamp) : 0;
	const cuentas = f.cuentas?.[sk] ?? [];
	const c0 = cuentas.length ? P0.t[cuentas[0].linea]?.inicio ?? 1e6 : 1e6;
	const solL = P0.lineas.filter((l) => l.bloque === sk && (l.fase === 'solucion' || l.fase === 'comprobacion' || l.fase === 'accion'));
	const finSol = solL.length ? solL[solL.length - 1].fin : 1e6;
	const cuenO = interpolate(t, [c0 - 0.3, c0 + 0.2, finSol + 1.0, finSol + 1.6], [0, 1, 1, 0], clamp);
	const sus = f.suscribir_en ? P0.t[f.suscribir_en] : undefined;
	const susO = sus ? interpolate(t, [sus.inicio, sus.inicio + 0.4, sus.inicio + 4, sus.inicio + 4.5], [0, 1, 1, 0], clamp) : 0;
	const fin0 = P0.total - 5 - (f.pantalla_final_s ?? 0);
	const pfO = interpolate(t, [fin0, fin0 + 1], [0, 1], clamp);
	const rot = linea?.voz && f.voces_rotulo?.[linea.voz];
	const nPuzle = Object.keys(f.salas).filter((k) => f.salas[k].tipo).indexOf(sk) + 1;
	const nTot = Object.keys(f.salas).filter((k) => f.salas[k].tipo).length;
	return (
		<AbsoluteFill style={{background: '#06070a', overflow: 'hidden'}}>
			<Escena f={f} P0={P0} t={t} b={b} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 70% at 50% 55%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />

			{/* chip de sala / puzle */}
			{B.tipo && nPuzle > 0 && t > (P0.bloques[sk]?.inicio ?? 1e6) && (
				<div style={{position: 'absolute', top: 40, left: 48, fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: AMBAR, background: 'rgba(8,8,10,0.78)', padding: '10px 18px', borderRadius: 8}}>
					{f.etiqueta} · PUZLE {nPuzle}/{nTot} · <span style={{color: E60.blanco}}>{B.titulo}</span>
				</div>
			)}

			{/* pizarra */}
			{pizO > 0.01 && B.pizarra && (
				<div style={{position: 'absolute', left: 48, top: 110, width: 700, opacity: pizO, background: 'rgba(10,10,12,0.94)', borderLeft: `8px solid ${AMBAR}`, borderRadius: 10, padding: '18px 26px', fontFamily: OSWALD, fontWeight: 500, fontSize: 40, lineHeight: 1.28, color: E60.blanco}}>
					{B.pizarra.filas.map((r, i) => (
						<div key={i} style={{color: r.color ?? E60.blanco}}>{r.etiqueta && <b style={{color: AMBAR}}>{r.etiqueta} · </b>}{r.texto}</div>
					))}
					{enPensar && B.pizarra.pregunta && <div style={{marginTop: 8, color: '#ffe2b0', fontWeight: 600}}>{B.pizarra.pregunta}</div>}
				</div>
			)}

			{/* cuenta atrás */}
			{enPensar && (
				<div style={{position: 'absolute', right: 60, top: 60, width: 170, height: 170}}>
					<svg width={170} height={170} viewBox="-85 -85 170 170">
						<circle r={80} fill="rgba(10,10,12,0.85)" stroke={E60.plata} strokeOpacity={0.4} strokeWidth={2} />
						<circle r={68} fill="none" stroke={AMBAR} strokeWidth={9} pathLength={1} strokeDasharray={1} strokeDashoffset={pzK} transform="rotate(-90)" strokeLinecap="round" />
						<text y={26} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={72} fill={E60.blanco}>{secs}</text>
					</svg>
				</div>
			)}

			{/* cuentas de la solución */}
			{cuenO > 0.01 && (
				<div style={{position: 'absolute', left: 48, top: 110, width: 820, opacity: cuenO, background: 'rgba(10,10,12,0.94)', borderLeft: `8px solid ${TURQ}`, borderRadius: 10, padding: '18px 26px', fontFamily: OSWALD, fontWeight: 500, fontSize: 40, lineHeight: 1.28, color: E60.blanco}}>
					{cuentas.map((c, i) => {
						const a0 = P0.t[c.linea]?.inicio ?? 1e6;
						const o = interpolate(t, [a0 + 0.1, a0 + 0.5], [0, 1], clamp);
						return o > 0.01 ? <div key={i} style={{opacity: o, color: c.ok === true ? TURQ : c.ok === false ? '#ff8a75' : E60.blanco}}>{c.texto}</div> : null;
					})}
				</div>
			)}

			{/* subtítulos con rótulo de quién habla */}
			{linea && !enPensar && (
				<div style={{position: 'absolute', left: 160, right: 160, bottom: 70, display: 'flex', justifyContent: 'center'}}>
					<div style={{background: 'rgba(8,8,10,0.8)', borderLeft: `8px solid ${rot ? rot.color : linea.fase === 'solucion' ? AMBAR : E60.violeta}`, padding: '12px 24px', borderRadius: 8, fontFamily: OSWALD, fontWeight: 500, fontSize: 40, lineHeight: 1.2, color: E60.blanco, maxWidth: 1500}}>
						{rot && <span style={{color: rot.color, fontWeight: 700}}>{rot.nombre}: </span>}
						{linea.texto}
					</div>
				</div>
			)}

			{/* suscripción a mitad del vídeo */}
			{susO > 0.01 && (
				<div style={{position: 'absolute', right: 60, bottom: 190, opacity: susO, fontFamily: OSWALD, fontWeight: 600, fontSize: 44, color: '#0b0806', background: AMBAR, padding: '12px 28px', borderRadius: 12}}>SUSCRÍBETE · {f.tipo_largo === 'capitulo' ? 'no te pierdas el siguiente capítulo' : 'una sala nueva cada semana'}</div>
			)}

			{/* rótulo tras el gancho */}
			{tit > 0.01 && (
				<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: tit, background: 'rgba(4,4,6,0.55)'}}>
					<div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 12, color: AMBAR}}>ENIGMA 60 · {f.etiqueta}</div>
					<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 120, color: E60.blanco, textShadow: '0 6px 30px rgba(0,0,0,0.8)'}}>{f.titulo}</div>
				</AbsoluteFill>
			)}

			<AbsoluteFill style={{background: '#000', opacity: negro}} />
			{trO > 0.01 && (
				<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: trO}}>
					<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 84, color: E60.blanco}}>{rotuloTr}</div>
				</AbsoluteFill>
			)}

			{/* pantalla final: zona libre para Suscribirse + vídeo siguiente (YouTube Studio) */}
			{pfO > 0.01 && (
				<AbsoluteFill style={{opacity: pfO, background: 'linear-gradient(180deg, rgba(6,7,10,0.55), rgba(6,7,10,0.85))'}}>
					<div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center', fontFamily: SERIF, fontWeight: 800, fontSize: 76, color: E60.blanco}}>{f.siguiente}</div>
					<div style={{position: 'absolute', left: 220, top: 380, width: 640, height: 360, border: `4px dashed ${AMBAR}`, borderRadius: 16, opacity: 0.85 + 0.15 * Math.sin(t * 2)}} />
					<div style={{position: 'absolute', right: 300, top: 430, width: 260, height: 260, borderRadius: 130, border: `4px dashed ${TURQ}`, transform: `scale(${1 + 0.03 * Math.sin(t * 2.2)})`}} />
					<div style={{position: 'absolute', bottom: 70, width: '100%', textAlign: 'center', fontFamily: MONO, letterSpacing: 3, fontSize: 24, color: E60.plata}}>{f.aviso_ia.toUpperCase()}</div>
				</AbsoluteFill>
			)}

			{/* portada dentro del vídeo (1,2 s, regla del 16/11) */}
			{portada > 0.01 && (
				<AbsoluteFill style={{opacity: portada, background: 'linear-gradient(90deg, rgba(6,7,10,0.92) 0%, rgba(6,7,10,0.55) 60%, rgba(6,7,10,0.15) 100%)', justifyContent: 'center', paddingLeft: 110}}>
					<div style={{fontFamily: MONO, fontSize: 36, letterSpacing: 12, color: TURQ}}>ENIGMA 60</div>
					<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 130, lineHeight: 1.0, color: E60.blanco, maxWidth: 1200, textShadow: '0 6px 30px rgba(0,0,0,0.8)'}}>{f.titulo}</div>
					<div style={{marginTop: 26, display: 'inline-block', alignSelf: 'flex-start', fontFamily: OSWALD, fontWeight: 600, fontSize: 52, color: '#0b0806', background: AMBAR, padding: '8px 26px', borderRadius: 10}}>{f.etiqueta}</div>
				</AbsoluteFill>
			)}
		</AbsoluteFill>
	);
};

export const LargoSalasAudio: React.FC<P> = (props) => {
	const f = props.ficha;
	const {fps} = useVideoConfig();
	const P0 = planificarC(props);
	return (
		<AbsoluteFill>
			<Audio src={staticFile('audio/sfx/ambiente.wav')} volume={0.35} loop />
			<Audio src={staticFile('audio/sfx/musica.wav')} volume={0.06} loop />
			{P0.lineas.map((l) => (
				<Sequence key={l.id} from={Math.round(l.inicio * fps)}>
					<Audio src={staticFile(`audio/${f.id}/${l.id}.wav`)} />
				</Sequence>
			))}
			{Object.values(P0.pensar).flatMap((p, j) =>
				Array.from({length: Math.floor(p.fin - p.inicio)}, (_, i) => (
					<Sequence key={`${j}-${i}`} from={Math.round((p.inicio + i) * fps)} durationInFrames={Math.round(0.3 * fps)}>
						<Audio src={staticFile('audio/sfx/tic.wav')} volume={0.5} />
					</Sequence>
				)),
			)}
			{Object.values(P0.pensar).map((p, j) => (
				<Sequence key={`c${j}`} from={Math.round((p.fin + 0.4) * fps)}>
					<Audio src={staticFile('audio/sfx/campana.wav')} volume={0.5} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
