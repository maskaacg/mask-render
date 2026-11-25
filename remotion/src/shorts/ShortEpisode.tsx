import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Room} from '../components/Room';
import {Door} from '../components/Door';
import {Dust, Vignette} from '../components/Atmosphere';
import {Subtitle} from '../components/Subtitle';
import {PUZZLES} from './puzzles';
import {Props, planificar} from './timeline';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Reloj de arena diegético para el tiempo de pensar. */
const Hourglass: React.FC<{p: number; o: number; secs: number}> = ({p, o, secs}) => {
	const top = 1 - p;
	return (
		<g opacity={o} transform="translate(930 560)">
			<rect x={-70} y={-150} width={140} height={16} rx={6} fill="#6b4c22" />
			<rect x={-70} y={134} width={140} height={16} rx={6} fill="#6b4c22" />
			<path d="M-55 -134 L55 -134 L8 0 L55 134 L-55 134 L-8 0 Z" fill="#d7ecff" fillOpacity={0.18} stroke="#e8f2ff" strokeWidth={3} />
			<path d={`M${-50 * top} ${-130 + 125 * (1 - top)} L${50 * top} ${-130 + 125 * (1 - top)} L4 -4 L-4 -4 Z`} fill="#e3c27a" />
			<path d={`M-52 130 L52 130 L${46 * (1 - p * 0.6)} ${130 - 120 * p} L${-46 * (1 - p * 0.6)} ${130 - 120 * p} Z`} fill="#e3c27a" opacity={p > 0 ? 1 : 0} />
			{p > 0 && p < 1 && <line x1={0} y1={-4} x2={0} y2={128} stroke="#e3c27a" strokeWidth={3} strokeDasharray="4 6" />}
			<rect x={-60} y={170} width={120} height={70} rx={10} fill="#2a1d10" stroke="#c9a25a" strokeWidth={3} />
			<text x={0} y={220} textAnchor="middle" fontFamily="DejaVu Serif, serif" fontWeight={700} fontSize={48} fill="#f3e6c6">{secs}</text>
		</g>
	);
};

export const ShortEpisode: React.FC<Props> = (props) => {
	const {ficha} = props;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const plan = planificar(props);
	const F = plan.fases;
	const Puzzle = PUZZLES[ficha.puzle.tipo];

	// cámara: avance lento hacia la mesa durante el enunciado y deriva constante
	const push = interpolate(t, [F.enunciado.inicio - 0.5, F.enunciado.inicio + 1.5], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const scale = 1 + 0.06 * push + 0.012 * Math.sin(t * 0.45);
	const lamp = 0.85 + 0.1 * Math.sin(t * 7.3) * Math.sin(t * 2.1);

	// mesa del puzle: sube al empezar el enunciado
	const table = interpolate(t, [F.enunciado.inicio - 0.6, F.enunciado.inicio + 0.2], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});

	// reloj de arena
	const p = interpolate(t, [F.pensar.inicio, F.pensar.fin], [0, 1], clamp);
	const hgO = interpolate(t, [F.pensar.inicio - 0.4, F.pensar.inicio, F.pensar.fin + 0.3, F.pensar.fin + 0.9], [0, 1, 1, 0], clamp);
	const secs = Math.max(0, Math.ceil(ficha.pensar_s * (1 - p) - 1e-6));

	// destello al revelar la solución
	const flash = interpolate(t, [F.solucion.inicio, F.solucion.inicio + 0.15, F.solucion.inicio + 0.9], [0, 0.35, 0], clamp);

	// título
	const titleO = interpolate(t, [0.2, 0.7, F.enunciado.inicio - 0.3, F.enunciado.inicio + 0.2], [0, 1, 1, 0], clamp);

	const linea = plan.lineas.find((l) => t >= l.inicio && t < l.fin + 0.3);
	const subO = linea ? Math.min(1, (t - linea.inicio) / 0.15, (linea.fin + 0.3 - t) / 0.2) : 0;

	const tail = plan.total - 1.6;
	const ticks = Array.from({length: Math.floor(ficha.pensar_s)}, (_, i) => F.pensar.inicio + i);

	return (
		<AbsoluteFill style={{backgroundColor: '#050807', overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: '540px 900px'}}>
				<Room lamp={lamp} />
				<Door angle={0} slots={[0, 0, 0]} />
				<div style={{position: 'absolute', inset: 0, background: ficha.tinte, mixBlendMode: 'soft-light', opacity: 0.45}} />
				<Dust time={t} slamAt={-10} />
			</AbsoluteFill>
			{/* mesa / panel del puzle en primer término */}
			<AbsoluteFill style={{transform: `translateY(${(1 - table) * 900}px)`}}>
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					<defs>
						<linearGradient id="mesa" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stopColor="#3b2818" stopOpacity={0.96} />
							<stop offset="1" stopColor="#140d07" />
						</linearGradient>
					</defs>
					<path d="M-40 840 L1120 840 L1120 1920 L-40 1920 Z" fill="url(#mesa)" />
					<line x1={-40} y1={842} x2={1120} y2={842} stroke="#7a5a2e" strokeWidth={6} />
					<g transform="translate(0 840)">
						{Puzzle && <Puzzle datos={ficha.puzle} t={t} enunciado={F.enunciado.inicio} solucion={F.solucion.inicio} />}
					</g>
				</svg>
			</AbsoluteFill>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<Hourglass p={p} o={hgO} secs={secs} />
			</svg>
			<AbsoluteFill style={{background: '#ffe2a0', opacity: flash, mixBlendMode: 'screen'}} />
			<Vignette strength={0.55} />
			{/* título del episodio */}
			<div style={{position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: titleO}}>
				<div style={{padding: '14px 30px', border: '3px solid #c9a25a', borderRadius: 14, background: 'rgba(26,18,10,0.85)', color: '#f3e6c6', fontFamily: 'DejaVu Serif, serif', fontWeight: 700, fontSize: 30, textAlign: 'center', maxWidth: 980, whiteSpace: 'nowrap'}}>
					ENIGMA 60 · {ficha.titulo}
				</div>
			</div>
			<Subtitle text={linea?.texto ?? ''} opacity={Math.max(0, subO)} zone={[70, 200, 1010, 470]} />
			<div style={{position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center', fontFamily: 'DejaVu Sans, sans-serif', fontSize: 26, color: '#cbbf9f', opacity: interpolate(t, [tail, tail + 0.3], [0, 0.9], clamp)}}>
				{ficha.aviso_ia}
			</div>
			{/* audio */}
			<Audio src={staticFile('audio/sfx/ambiente.wav')} volume={0.4} />
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
			{ficha.modo === 'puzle' && (
				<Sequence from={Math.round(F.solucion.inicio * fps)}>
					<Audio src={staticFile('audio/sfx/campana.wav')} volume={0.55} />
				</Sequence>
			)}
		</AbsoluteFill>
	);
};
