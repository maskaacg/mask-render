import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BEBAS, HAND, OSWALD, cargarFuentes} from '../style/fonts';
import {ESCENA_POR_PUZLE, Escena, EscenaId, LINEA, TEMAS} from './escenas';
import {PUZLES, ROJO} from './puzles';
import {Props, planificar} from '../shorts/timeline';

cargarFuentes();

// ENIGMA 60 · estilo «Plano + Linterna» (elegido por el Propietario el 14/11/2026).
// Todo es un plano de inventor a oscuras; una linterna lo va descubriendo y, al
// revelar la solución, se «encienden las luces» y el plano entero queda a la vista.

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
const rng = (i: number, k: number) => Math.sin(i * 91.7 + k * 13.1) * 0.5 + 0.5;

type FichaPlano = Props['ficha'] & {escena?: EscenaId; numero?: number};

const wobbly = (x: number, y: number, w: number, h: number, amp = 3, seed = 1) => {
	const n = (i: number) => Math.sin(i * 12.9898 + seed * 78.233) * amp;
	const seg = (x1: number, y1: number, x2: number, y2: number, k: number) =>
		Array.from({length: 6}, (_, j) => {
			const f = (j + 1) / 6;
			return `L${(x1 + (x2 - x1) * f + n(k + j)).toFixed(1)},${(y1 + (y2 - y1) * f + n(k + j + 50)).toFixed(1)}`;
		}).join(' ');
	return `M${x},${y} ${seg(x, y, x + w, y, 1)} ${seg(x + w, y, x + w, y + h, 10)} ${seg(x + w, y + h, x, y + h, 20)} ${seg(x, y + h, x, y, 30)} Z`;
};

export const CortoPlano: React.FC<Props> = (props) => {
	const ficha = props.ficha as FichaPlano;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const plan = planificar(props);
	const F = plan.fases;
	const escena: EscenaId = ficha.escena ?? ESCENA_POR_PUZLE[ficha.puzle.tipo] ?? 'archivo';
	const A = TEMAS[escena].acento;
	const Puzle = PUZLES[ficha.puzle.tipo];
	const esPuzle = ficha.modo === 'puzle';
	const sol = F.solucion.inicio;

	// ---- linterna: barrido por la sala → se posa en la mesa → deriva al pensar
	const enun = F.enunciado.inicio;
	const bx = interpolate(t, [0, 1.2, enun - 0.6, enun + 0.6], [180, 300, 860, 540], {...clamp, easing: io}) + (t > enun ? 26 * Math.sin(t * 0.7) : 0);
	const by = interpolate(t, [0, enun - 0.6, enun + 0.6], [640, 700, 1260], {...clamp, easing: io}) + (t > enun ? 18 * Math.sin(t * 0.53 + 1) : 0);
	const br = interpolate(t, [0, 0.5, enun, enun + 0.8], [380, 500, 480, 620], {...clamp, easing: io});
	const luces = esPuzle ? interpolate(t, [sol, sol + 0.6], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}) : 0;
	const ambiente = interpolate(t, [0, 1.2], [0.3, 0.15], clamp) + 0.85 * luces;
	const cono = 1 - luces;

	// ---- escena que se traza sola durante la introducción
	const pEsc = interpolate(t, [0, Math.min(2.6, Math.max(1.6, enun - 0.3))], [0.35, 1], clamp);
	const cam = 1 + 0.02 * Math.sin(t * 0.35);
	// deriva suave de cámara (evita segundos congelados con las luces encendidas)
	const dx = 7 * Math.sin(t * 0.9) * (0.3 + 0.7 * luces);
	const dy = 5 * Math.sin(t * 0.7 + 1) * (0.3 + 0.7 * luces);

	// ---- temporizador (compás) y pregunta fija mientras se piensa
	const pz = interpolate(t, [F.pensar.inicio, F.pensar.fin], [0, 1], clamp);
	const tO = interpolate(t, [F.pensar.inicio - 0.4, F.pensar.inicio, F.pensar.fin + 0.2, F.pensar.fin + 0.8], [0, 1, 1, 0], clamp);
	const secs = Math.max(0, Math.ceil(ficha.pensar_s * (1 - pz) - 1e-6));
	const pregunta = [...ficha.lineas].reverse().find((l) => l.fase === 'enunciado')?.texto ?? '';
	const qO = interpolate(t, [F.pensar.inicio, F.pensar.inicio + 0.3, F.pensar.fin, F.pensar.fin + 0.3], [0, 1, 1, 0], clamp);

	const linea = plan.lineas.find((l) => t >= l.inicio && t < l.fin + 0.3);
	const subO = linea ? Math.max(0, Math.min(1, (t - linea.inicio) / 0.15, (linea.fin + 0.3 - t) / 0.2)) : 0;
	const enPensar = t >= F.pensar.inicio - 0.1 && t < F.pensar.fin + 0.3;

	const tail = plan.total - 1.6;
	const ticks = Array.from({length: Math.floor(ficha.pensar_s)}, (_, i) => F.pensar.inicio + i);
	const titO = interpolate(t, [0.1, 0.6], [0, 1], clamp);
	const motas = Array.from({length: 60}, (_, i) => ({
		u: rng(i, 1), v: rng(i, 2), s: 1 + rng(i, 3) * 2.6, o: 0.25 + rng(i, 4) * 0.6,
	}));

	return (
		<AbsoluteFill style={{background: '#04070d', overflow: 'hidden'}}>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<defs>
					<radialGradient id="papel" cx="50%" cy="50%" r="75%">
						<stop offset="0" stopColor="#1c4c82" />
						<stop offset="1" stopColor="#0a2140" />
					</radialGradient>
					<pattern id="r1" width={40} height={40} patternUnits="userSpaceOnUse">
						<path d="M40 0H0V40" fill="none" stroke={LINEA} strokeOpacity={0.07} />
					</pattern>
					<pattern id="r5" width={200} height={200} patternUnits="userSpaceOnUse">
						<path d="M200 0H0V200" fill="none" stroke={LINEA} strokeOpacity={0.13} strokeWidth={1.5} />
					</pattern>
					<radialGradient id="haz" cx={bx} cy={by} r={Math.max(1, br)} gradientUnits="userSpaceOnUse">
						<stop offset="0" stopColor="#fff" />
						<stop offset="0.6" stopColor="#fff" stopOpacity={0.9} />
						<stop offset="1" stopColor="#fff" stopOpacity={0} />
					</radialGradient>
					<mask id="luz">
						<rect width={1080} height={1920} fill="#fff" opacity={ambiente} />
						<rect width={1080} height={1920} fill="url(#haz)" />
					</mask>
					<linearGradient id="cono" gradientUnits="userSpaceOnUse" x1={1080} y1={1920} x2={bx} y2={by}>
						<stop offset="0" stopColor={A} stopOpacity={0.2} />
						<stop offset="1" stopColor={A} stopOpacity={0.02} />
					</linearGradient>
					<radialGradient id="vig" cx="50%" cy="55%" r="72%">
						<stop offset="0.62" stopColor="#000" stopOpacity={0} />
						<stop offset="1" stopColor="#000" stopOpacity={0.8} />
					</radialGradient>
					<filter id="grano" x="0" y="0" width="100%" height="100%">
						<feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={3} />
						<feColorMatrix type="saturate" values="0" />
					</filter>
				</defs>

				{/* plano completo, visible solo donde llega la luz */}
				<g mask="url(#luz)" transform={`translate(${dx} ${dy})`}>
					<rect width={1080} height={1920} fill="url(#papel)" />
					<rect width={1080} height={1920} fill="url(#r1)" />
					<rect width={1080} height={1920} fill="url(#r5)" />
					<g transform={`translate(540 900) scale(${cam}) translate(-540 -900)`}>
						<Escena id={escena} p={pEsc} />
					</g>
					<path d="M0 838 H1080" stroke={LINEA} strokeWidth={2} strokeDasharray="14 10" opacity={0.5} />
					<g transform="translate(0 840)">
						{Puzle && <Puzle datos={ficha.puzle} t={t} enunciado={enun} solucion={sol} acento={A} />}
					</g>
				</g>

				{/* haz de la linterna y polvo */}
				<g opacity={cono * Math.min(1, br / 200)}>
					<path d={`M1080 1920 L1080 1680 L${bx - br * 0.75} ${by - br * 0.55} L${bx + br * 0.55} ${by - br * 0.8} L1080 1500 Z`} fill="url(#cono)" style={{mixBlendMode: 'screen'}} />
					{motas.map((m, i) => {
						const x = bx + (m.u - 0.5) * br * 1.4;
						const y = by + (m.v - 0.5) * br * 1.4 + Math.sin(t / 1.5 + i) * 8;
						return <circle key={i} cx={x} cy={y} r={m.s} fill="#fff1d6" opacity={m.o * 0.45} />;
					})}
				</g>
				<g opacity={luces * 0.8}>
					{motas.map((m, i) => (
						<circle key={i} cx={(m.u * 1080 + t * 9 * (0.5 + m.v)) % 1080} cy={(m.v * 1920 - t * 14 * (0.4 + m.u) + 1920 * 4) % 1920} r={m.s} fill="#dfeaff" opacity={m.o * 0.5} />
					))}
				</g>
				<rect width={1080} height={1920} fill="url(#vig)" />

				{/* cabecera fija: marca + caso + título */}
				<g opacity={titO}>
					<text x={60} y={92} fontFamily={OSWALD} fontWeight={500} fontSize={26} letterSpacing={8} fill={A}>
						ENIGMA 60 · CASO {String(ficha.numero ?? 1).padStart(2, '0')}
					</text>
					<text x={60} y={160} fontFamily={BEBAS} fontSize={66} letterSpacing={1} fill="#f2f4f8">{ficha.titulo.toUpperCase()}</text>
				</g>

				{/* compás-temporizador */}
				<g transform="translate(930 600)" opacity={tO}>
					<circle r={92} fill="rgba(4,7,13,0.75)" />
					<circle r={80} fill="none" stroke={LINEA} strokeWidth={2} strokeDasharray="6 8" opacity={0.6} />
					<circle r={80} fill="none" stroke={A} strokeWidth={7} pathLength={1} strokeDasharray={1} strokeDashoffset={pz} transform="rotate(-90)" strokeLinecap="round" />
					<text y={30} textAnchor="middle" fontFamily={BEBAS} fontSize={92} fill="#f2f4f8">{secs}</text>
				</g>

				{/* pregunta en lápiz rojo mientras se piensa */}
				<g opacity={qO}>
					<path d={wobbly(56, 214, 968, 240, 3, 7)} fill="rgba(4,7,13,0.78)" stroke={ROJO} strokeWidth={4} />
				</g>
				<rect width={1080} height={1920} filter="url(#grano)" opacity={0.12} style={{mixBlendMode: 'screen'}} />
			</svg>

			{/* pregunta (texto HTML para que ajuste líneas) */}
			<div style={{position: 'absolute', left: 80, top: 222, width: 920, height: 224, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: qO, fontFamily: HAND, fontSize: 56, lineHeight: 1.15, color: '#fff'}}>
				{pregunta}
			</div>

			{/* subtítulos */}
			{!enPensar && (
				<div style={{position: 'absolute', left: 56, top: 214, width: 968, height: 250, display: 'flex', alignItems: 'flex-start', opacity: subO}}>
					<div style={{borderLeft: `8px solid ${A}`, background: 'rgba(4,7,13,0.72)', padding: '18px 26px', fontFamily: OSWALD, fontWeight: 500, fontSize: 52, lineHeight: 1.18, color: linea?.fase === 'solucion' ? '#ffd9cf' : '#f2f4f8', transform: `translateY(${(1 - subO) * 10}px)`}}>
						{linea?.texto ?? ''}
					</div>
				</div>
			)}

			<div style={{position: 'absolute', bottom: 64, left: 0, right: 0, textAlign: 'center', fontFamily: OSWALD, fontWeight: 300, letterSpacing: 4, fontSize: 26, color: '#c9d4e6', opacity: interpolate(t, [tail, tail + 0.3], [0, 0.9], clamp)}}>
				{ficha.aviso_ia.toUpperCase()}
			</div>

			{/* audio */}
			<Audio src={staticFile('audio/sfx/ambiente.wav')} volume={0.4} />
			<Audio src={staticFile('audio/sfx/musica.wav')} volume={0.08} loop />
			<Sequence from={Math.round(0.1 * fps)}>
				<Audio src={staticFile('audio/sfx/aire.wav')} volume={0.45} />
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
			{esPuzle && (
				<Sequence from={Math.round(sol * fps)}>
					<Audio src={staticFile('audio/sfx/campana.wav')} volume={0.55} />
				</Sequence>
			)}
		</AbsoluteFill>
	);
};
