import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {cargarFuentes, MONO, OSWALD, SERIF} from '../style/fonts';
import {E60} from '../e60/nucleo';
import {Props, planificar} from '../shorts/timeline';
import {BANDEJA, EstadoTaller, MESA_Y, PIVOTE, Pieza, TallerOrfebre3D, V3} from './TallerOrfebre3D';

cargarFuentes();

// ENIGMA 60 · acertijo vertical 19/11 «El taller del orfebre» (v2, tras el rechazo del Propietario):
// habitación propia en 3D y el puzle dentro de la sala (balanza, piezas, pizarra y caja fuerte), sin cuadros
// con dibujos. Duración guiada por la voz (≥ 70 s).
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
const AMBAR = '#F0B955';

type Plano = {pos: V3; mira: V3; fov: number};
const PL: Record<string, Plano> = {
	entrada: {pos: [0.15, 1.8, 2.2], mira: [0.1, 1.45, -2.2], fov: 62},
	mesa: {pos: [-0.45, 1.45, -0.2], mira: [-0.4, 1.12, -1.9], fov: 62},
	caja: {pos: [0.85, 1.4, -1.0], mira: [1.45, 1.1, -2.7], fov: 58},
	balanza: {pos: [0, 1.72, 0.4], mira: [0, 1.72, -2.4], fov: 68},
	pensar: {pos: [0.15, 1.75, 0.65], mira: [0.15, 1.72, -2.4], fov: 68},
	pizarra: {pos: [-0.1, 2.25, -0.7], mira: [-0.1, 2.3, -2.94], fov: 66},
	cajaCerca: {pos: [1.05, 1.3, -1.3], mira: [1.45, 1.15, -2.7], fov: 56},
	salida: {pos: [0.1, 1.9, 1.9], mira: [0.3, 1.5, -2.3], fov: 62},
};

// piezas: 0 K1, 1 K2, 2 C1, 3 C2, 4 C3, 5 pesa
const CASAS: V3[] = [
	[BANDEJA[0] - 0.13, MESA_Y + 0.03, BANDEJA[2] - 0.09],
	[BANDEJA[0] - 0.13, MESA_Y + 0.03, BANDEJA[2] + 0.09],
	[BANDEJA[0] + 0.1, MESA_Y + 0.022, BANDEJA[2] - 0.1],
	[BANDEJA[0] + 0.12, MESA_Y + 0.022, BANDEJA[2] + 0.04],
	[BANDEJA[0] + 0.02, MESA_Y + 0.022, BANDEJA[2] + 0.12],
	[0.72, MESA_Y + 0.06, PIVOTE[2] + 0.3],
];
const TIPOS: Pieza['tipo'][] = ['llave', 'llave', 'moneda', 'moneda', 'moneda', 'pesa'];

type Mov = {t: number; a: -1 | 0 | 1};
const DUR_MOV = 0.85;
const piezaEn = (i: number, movs: Mov[], t: number): Pieza => {
	let desde: -1 | 0 | 1 = 0;
	let plato: -1 | 0 | 1 = 0;
	let s = 1;
	for (const m of movs) {
		if (t < m.t) break;
		desde = plato;
		plato = m.a;
		s = Math.min(1, (t - m.t) / DUR_MOV);
	}
	return {tipo: TIPOS[i], casa: CASAS[i], desde, plato, s};
};

export const CortoTaller: React.FC<Props> = (props) => {
	const ficha = props.ficha as Props['ficha'] & {numero?: number};
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const plan = planificar(props);
	const F = plan.fases;
	const L = Object.fromEntries(plan.lineas.map((l) => [l.id, l]));
	const ini = (id: string, d = 0) => (L[id]?.inicio ?? 0) + d;
	const fin = (id: string) => L[id]?.fin ?? 0;

	// ---- cámara ----
	const ev: [number, string][] = [
		[-10, 'entrada'],
		[0, 'entrada'],
		[ini('l02') - 0.2, 'mesa'],
		[ini('l03') + 0.6, 'caja'],
		[ini('l04') - 0.8, 'balanza'],
		[F.pensar.inicio - 0.6, 'pensar'],
		[ini('l08') - 0.4, 'pizarra'],
		[ini('l10') - 0.6, 'cajaCerca'],
		[F.cta.inicio + 1.6, 'salida'],
	];
	let k = 0;
	for (let i = 0; i < ev.length; i++) if (t >= ev[i][0]) k = i;
	const f = interpolate(t, [ev[k][0], ev[k][0] + 1.7], [0, 1], {...clamp, easing: io});
	const a = PL[ev[Math.max(0, k - 1)][1]];
	const b = PL[ev[k][1]];
	const mix = (x: V3, y: V3) => [0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * f) as V3;
	const pos = mix(a.pos, b.pos);
	const mira = mix(a.mira, b.mira);
	pos[0] += Math.sin(t * 0.5) * 0.015;
	pos[1] += Math.sin(t * 0.41 + 1) * 0.01;

	// ---- piezas: pesada 1 (l04) y pesada 2 (l05) ----
	const p1 = ini('l04', 0.3);
	const p2 = ini('l05', 0.2);
	const MOVS: Mov[][] = [
		[{t: p1, a: -1}],
		[{t: p1 + 0.5, a: -1}, {t: p2, a: 0}],
		[{t: p1 + 1.2, a: 1}, {t: p2 + 1.3, a: -1}],
		[{t: p1 + 1.6, a: 1}, {t: p2 + 0.4, a: 0}],
		[{t: p1 + 2.0, a: 1}, {t: p2 + 0.8, a: 0}],
		[{t: p2 + 2.1, a: 1}],
	];
	const piezas = MOVS.map((m, i) => piezaEn(i, m, t));

	// ---- pizarra ----
	const esc = (id: string) => interpolate(t, [ini(id, 0.2), Math.max(ini(id, 0.3), fin(id) - 0.2)], [0, 1], clamp);
	const lineas: string[] = [];
	let avance = 1;
	let resaltar = -1;
	if (t >= ini('l04', 0.2)) {
		lineas.push('1) 2 llaves = 3 monedas');
		avance = esc('l04');
	}
	if (t >= ini('l05', 0.2)) {
		lineas.push('2) 1 llave + 1 moneda = 50 g');
		avance = esc('l05');
	}
	if (t >= ini('l06', 0.1) && t < ini('l08', 0.2)) {
		lineas.push('1 moneda = ¿?');
		avance = esc('l06');
	}
	if (t >= ini('l08', 0.2)) {
		lineas.push('1 llave = 1,5 monedas');
		avance = esc('l08');
	}
	const l09m = (ini('l09') + fin('l09')) / 2;
	if (t >= ini('l09', 0.2)) {
		lineas.push('2,5 monedas = 50 g');
		avance = interpolate(t, [ini('l09', 0.2), l09m - 0.3], [0, 1], clamp);
	}
	if (t >= l09m) {
		lineas.push('1 moneda = 20 g');
		avance = interpolate(t, [l09m, fin('l09')], [0, 1], clamp);
		resaltar = 4;
	}

	// ---- caja fuerte ----
	const dial = interpolate(t, [ini('l10', 0.5), ini('l10', 2.2)], [0, 20], {...clamp, easing: io});
	const puertaCaja = interpolate(t, [fin('l10') - 0.6, fin('l10') + 1.0], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});

	const e: EstadoTaller = {
		t,
		cam: {pos, mira, fov: a.fov + (b.fov - a.fov) * f},
		piezas,
		pizarra: {lineas, resaltar, avance},
		dial,
		puertaCaja,
		foco: interpolate(t, [ini('l04') - 0.8, ini('l04'), F.pensar.fin, F.pensar.fin + 0.6], [0, 0.6, 0.6, 0.25], clamp),
		focoCaja: Math.max(interpolate(t, [ini('l03'), ini('l03', 0.8), fin('l03'), fin('l03') + 0.6], [0, 0.7, 0.7, 0], clamp), interpolate(t, [ini('l10') - 0.6, ini('l10')], [0, 0.7], clamp)),
		lampara: interpolate(t, [0, 1.0], [0.5, 1], clamp),
		puerta: interpolate(t, [0.2, 0.5, 1.2], [1, 0, 0], clamp),
	};

	// ---- capa 2D mínima: cabecera, temporizador, pregunta, subtítulos ----
	const pz = interpolate(t, [F.pensar.inicio, F.pensar.fin], [0, 1], clamp);
	const tO = interpolate(t, [F.pensar.inicio - 0.4, F.pensar.inicio, F.pensar.fin + 0.2, F.pensar.fin + 0.8], [0, 1, 1, 0], clamp);
	const secs = Math.max(0, Math.ceil(ficha.pensar_s * (1 - pz) - 1e-6));
	const enPensar = t >= F.pensar.inicio - 0.1 && t < F.pensar.fin + 0.3;
	const linea = plan.lineas.find((l) => t >= l.inicio && t < l.fin + 0.3);
	const subO = linea ? Math.max(0, Math.min(1, (t - linea.inicio) / 0.15, (linea.fin + 0.3 - t) / 0.2)) : 0;
	const titO = interpolate(t, [0.3, 1.0, ini('l04') - 0.6, ini('l04')], [0, 1, 1, 0], clamp);
	const ticks = Array.from({length: Math.floor(ficha.pensar_s)}, (_, i) => F.pensar.inicio + i);
	const fundido = Math.max(interpolate(t, [0, 0.7], [1, 0], clamp), interpolate(t, [plan.total - 0.8, plan.total], [0, 1], clamp));
	const tail = plan.total - 1.8;
	const pregunta = [...ficha.lineas].reverse().find((l) => l.fase === 'enunciado')?.texto ?? '';
	const suaveCam = interpolate(t, [0, 1], [1.04, 1], clamp);

	return (
		<AbsoluteFill style={{background: '#0b0705', overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `scale(${suaveCam})`}}>
				<TallerOrfebre3D e={e} ancho={720} alto={1280} escala={1080 / 720} />
			</AbsoluteFill>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />

			{/* cabecera (solo al principio) */}
			<div style={{position: 'absolute', top: 96, left: 64, right: 64, opacity: titO}}>
				<div style={{display: 'inline-block', background: 'rgba(12,9,6,0.94)', padding: '18px 26px', borderRadius: 10, borderLeft: `8px solid ${AMBAR}`}}>
					<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 26, letterSpacing: 8, color: AMBAR}}>ENIGMA 60 · ACERTIJO {String(ficha.numero ?? 1).padStart(2, '0')}</div>
					<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 64, lineHeight: 1.05, color: E60.blanco, marginTop: 6}}>{ficha.titulo}</div>
				</div>
			</div>

			{/* pregunta y temporizador mientras se piensa */}
			<div style={{position: 'absolute', left: 56, right: 56, top: 96, opacity: tO, display: 'flex', alignItems: 'center', gap: 24}}>
				<div style={{flex: 1, fontFamily: OSWALD, fontWeight: 500, fontSize: 48, lineHeight: 1.15, color: E60.blanco, background: 'rgba(12,9,6,0.94)', borderLeft: `8px solid ${AMBAR}`, padding: '16px 24px', borderRadius: 8}}>{pregunta}</div>
				<svg width={150} height={150} viewBox="-75 -75 150 150" style={{flexShrink: 0}}>
					<circle r={70} fill="rgba(12,9,6,0.94)" stroke={E60.plata} strokeOpacity={0.4} strokeWidth={2} />
					<circle r={60} fill="none" stroke={AMBAR} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={pz} transform="rotate(-90)" strokeLinecap="round" />
					<text y={22} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={64} fill={E60.blanco}>{secs}</text>
				</svg>
			</div>

			{/* subtítulos (franja inferior reservada) */}
			{!enPensar && linea && (
				<div style={{position: 'absolute', left: 56, right: 56, top: 1560, display: 'flex', justifyContent: 'center', opacity: subO}}>
					<div style={{background: 'rgba(12,9,6,0.94)', borderLeft: `8px solid ${linea.fase === 'solucion' ? AMBAR : E60.violeta}`, padding: '12px 22px', borderRadius: 8, fontFamily: OSWALD, fontWeight: 500, fontSize: 42, lineHeight: 1.16, color: linea.fase === 'solucion' ? '#ffe2b0' : E60.blanco, transform: `translateY(${(1 - subO) * 10}px)`}}>
						{linea.texto}
					</div>
				</div>
			)}

			<div style={{position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, letterSpacing: 3, fontSize: 24, color: E60.plata, opacity: interpolate(t, [tail, tail + 0.3], [0, 0.9], clamp)}}>
				{ficha.aviso_ia.toUpperCase()}
			</div>
			<AbsoluteFill style={{background: '#0b0705', opacity: fundido}} />

			{/* audio */}
			<Audio src={staticFile('audio/sfx/ambiente.wav')} volume={0.4} />
			<Audio src={staticFile('audio/sfx/musica.wav')} volume={0.08} loop />
			<Sequence from={Math.round(0.25 * fps)}>
				<Audio src={staticFile('audio/sfx/cerrojo.wav')} volume={0.7} />
			</Sequence>
			{plan.lineas.map((l) => (
				<Sequence key={l.id} from={Math.round(l.inicio * fps)}>
					<Audio src={staticFile(`audio/${ficha.id}/${l.id}.wav`)} />
				</Sequence>
			))}
			{ticks.map((s) => (
				<Sequence key={s} from={Math.round(s * fps)} durationInFrames={Math.round(0.3 * fps)}>
					<Audio src={staticFile('audio/sfx/tic.wav')} volume={0.6} />
				</Sequence>
			))}
			<Sequence from={Math.round(F.solucion.inicio * fps)}>
				<Audio src={staticFile('audio/sfx/campana.wav')} volume={0.55} />
			</Sequence>
			<Sequence from={Math.round((fin('l10') - 0.6) * fps)}>
				<Audio src={staticFile('audio/sfx/cerrojo.wav')} volume={0.8} />
			</Sequence>
		</AbsoluteFill>
	);
};

