import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {cargarFuentes, MONO, OSWALD, SERIF} from '../style/fonts';
import {BordeMaqueta, E60} from '../e60/nucleo';
import {EstadoTorre, TorreArchivero3D} from './TorreArchivero3D';
import {PLANOS, V3} from './AvanceTorre';
import {relampagos} from './EscapeRoom';
import {PUZLES} from '../plano/puzles';
import {Props, planificar} from '../shorts/timeline';

cargarFuentes();

// ENIGMA 60 · acertijo vertical con la estética de «La torre del archivero» (corrección del
// Propietario del 15/11: «que se vea como el vídeo de la torre»). La sala 3D de la torre es el
// escenario; el acertijo se plantea sobre un pergamino iluminado por la vela.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
const AMBAR = '#F0B955';

type FichaCT = Props['ficha'] & {numero?: number};

export const CortoTorre: React.FC<Props> = (props) => {
	const ficha = props.ficha as FichaCT;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const plan = planificar(props);
	const F = plan.fases;
	const enun = F.enunciado.inicio;
	const sol = F.solucion.inicio;
	const Puzle = PUZLES[ficha.puzle.tipo];

	// cámara: torre → vela → mesa (acertijo) → vela al resolver → puerta al final
	const ev: [number, string][] = [[-10, 'torre'], [0, 'torre'], [Math.max(0.5, enun - 3.2), 'vela'], [enun - 0.6, 'mesa'], [plan.total - 3.2, 'puerta']];
	let k = 0;
	for (let i = 0; i < ev.length; i++) if (t >= ev[i][0]) k = i;
	const f = interpolate(t, [ev[k][0], ev[k][0] + 1.8], [0, 1], {...clamp, easing: io});
	const a = PLANOS[ev[Math.max(0, k - 1)][1]];
	const b = PLANOS[ev[k][1]];
	const mix = (x: V3, y: V3) => [0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * f) as V3;
	const pos = mix(a.pos, b.pos);
	const mira = mix(a.mira, b.mira);
	pos[0] += Math.sin(t * 0.6) * 0.02;
	pos[1] += Math.sin(t * 0.47 + 1) * 0.015;
	let rel = 0;
	for (const r of relampagos(plan.total)) {
		const d = t - r;
		if (d >= -0.1 && d <= 1.2) rel = Math.max(rel, interpolate(d, [-0.05, 0, 0.08, 0.16, 0.24, 0.6, 1.2], [0, 1, 0.2, 0.85, 0.3, 0.1, 0], clamp));
	}
	const resuelto = interpolate(t, [sol, sol + 0.8], [0, 1], clamp);
	const e: EstadoTorre = {
		t, cam: {pos, mira, fov: a.fov + (b.fov - a.fov) * f},
		pista: {escudos: 0, ventana: 0, mesa: interpolate(t, [enun - 0.6, enun + 0.6], [0, 0.5], clamp), puerta: interpolate(t, [plan.total - 3.2, plan.total - 2.2], [0, 0.5], clamp)},
		escudos: [0, 0, 0], losa: 0, criptex: 0, anillos: 0, tapa: 0, descifrado: 0, p13: 0, nicho: 0, llave: 0, giroLlave: 0, verdad: 0,
		vela: 1, llama: 1, puerta: 0, sombra: 0, libro: 0,
		relampago: rel, gramofono: 1, antorchas: interpolate(t, [0, 1.2], [0.6, 1], clamp) + 0.3 * resuelto,
	};

	// pergamino con el acertijo
	const perg = interpolate(t, [enun - 0.5, enun + 0.4], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	// temporizador y pregunta fija mientras se piensa
	const pz = interpolate(t, [F.pensar.inicio, F.pensar.fin], [0, 1], clamp);
	const tO = interpolate(t, [F.pensar.inicio - 0.4, F.pensar.inicio, F.pensar.fin + 0.2, F.pensar.fin + 0.8], [0, 1, 1, 0], clamp);
	const secs = Math.max(0, Math.ceil(ficha.pensar_s * (1 - pz) - 1e-6));
	const pregunta = [...ficha.lineas].reverse().find((l) => l.fase === 'enunciado')?.texto ?? '';
	const enPensar = t >= F.pensar.inicio - 0.1 && t < F.pensar.fin + 0.3;
	const linea = plan.lineas.find((l) => t >= l.inicio && t < l.fin + 0.3);
	const subO = linea ? Math.max(0, Math.min(1, (t - linea.inicio) / 0.15, (linea.fin + 0.3 - t) / 0.2)) : 0;
	const titO = interpolate(t, [0.2, 0.9, enun - 0.4, enun + 0.2], [0, 1, 1, 0.85], clamp);
	const ticks = Array.from({length: Math.floor(ficha.pensar_s)}, (_, i) => F.pensar.inicio + i);
	const fundido = Math.max(interpolate(t, [0, 0.8], [1, 0], clamp), interpolate(t, [plan.total - 0.8, plan.total], [0, 1], clamp));
	const tail = plan.total - 1.8;

	return (
		<AbsoluteFill style={{background: '#0a0807', overflow: 'hidden'}}>
			<TorreArchivero3D e={e} ancho={720} alto={1280} escala={1080 / 720} />
			<AbsoluteFill style={{background: '#e8eeff', opacity: rel * 0.12}} />
			<AbsoluteFill style={{background: `radial-gradient(ellipse 70% 40% at 50% 62%, rgba(240,185,85,${0.10 * perg}) 0%, rgba(0,0,0,0) 70%)`}} />
			<BordeMaqueta />

			{/* cabecera */}
			<div style={{position: 'absolute', top: 90, left: 64, right: 64, opacity: titO}}>
				<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 26, letterSpacing: 8, color: AMBAR}}>ENIGMA 60 · ACERTIJO {String(ficha.numero ?? 1).padStart(2, '0')}</div>
				<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 70, lineHeight: 1.05, color: E60.blanco, marginTop: 8, textShadow: '0 4px 18px rgba(0,0,0,0.8)'}}>{ficha.titulo}</div>
			</div>

			{/* pergamino iluminado por la vela */}
			<div style={{position: 'absolute', left: 40, top: 640, width: 1000, height: 900, opacity: perg, transform: `translateY(${(1 - perg) * 40}px)`}}>
				<div style={{position: 'absolute', inset: 0, borderRadius: 26, background: 'linear-gradient(180deg, rgba(20,16,12,0.86), rgba(12,10,8,0.92))', border: `3px solid ${AMBAR}`, boxShadow: `0 0 50px rgba(240,185,85,0.22), inset 0 0 60px rgba(240,185,85,0.08)`}} />
				<svg width={1000} height={900} viewBox="0 0 1080 972" style={{position: 'absolute', inset: 0}}>
					<g transform="translate(0 -20)">{Puzle && <Puzle datos={ficha.puzle} t={t} enunciado={enun} solucion={sol} acento={AMBAR} />}</g>
				</svg>
			</div>

			{/* temporizador de vela */}
			<div style={{position: 'absolute', right: 56, top: 470, width: 150, height: 150, opacity: tO}}>
				<svg width={150} height={150} viewBox="-75 -75 150 150">
					<circle r={70} fill="rgba(12,10,8,0.85)" stroke={E60.plata} strokeOpacity={0.4} strokeWidth={2} />
					<circle r={60} fill="none" stroke={AMBAR} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={pz} transform="rotate(-90)" strokeLinecap="round" />
					<text y={22} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={64} fill={E60.blanco}>{secs}</text>
				</svg>
			</div>

			{/* pregunta fija mientras se piensa */}
			<div style={{position: 'absolute', left: 56, right: 230, top: 300, opacity: tO, fontFamily: OSWALD, fontWeight: 500, fontSize: 46, lineHeight: 1.15, color: E60.blanco, background: 'rgba(12,10,8,0.82)', borderLeft: `8px solid ${AMBAR}`, padding: '14px 22px', borderRadius: 8}}>
				{pregunta}
			</div>

			{/* subtítulos */}
			{!enPensar && linea && (
				<div style={{position: 'absolute', left: 56, right: 56, top: 1572, display: 'flex', justifyContent: 'center', opacity: subO}}>
					<div style={{background: 'rgba(12,10,8,0.78)', borderLeft: `8px solid ${linea.fase === 'solucion' ? AMBAR : E60.violeta}`, padding: '12px 22px', borderRadius: 8, fontFamily: OSWALD, fontWeight: 500, fontSize: 42, lineHeight: 1.16, color: linea.fase === 'solucion' ? '#ffe2b0' : E60.blanco, transform: `translateY(${(1 - subO) * 10}px)`}}>
						{linea.texto}
					</div>
				</div>
			)}

			<div style={{position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, letterSpacing: 3, fontSize: 24, color: E60.plata, opacity: interpolate(t, [tail, tail + 0.3], [0, 0.9], clamp)}}>
				{ficha.aviso_ia.toUpperCase()}
			</div>
			<AbsoluteFill style={{background: '#0a0807', opacity: fundido}} />

			{/* audio (mismo esquema que el acertijo plano) */}
			<Audio src={staticFile('audio/sfx/ambiente.wav')} volume={0.4} />
			<Audio src={staticFile('audio/sfx/musica.wav')} volume={0.08} loop />
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
			<Sequence from={Math.round(sol * fps)}>
				<Audio src={staticFile('audio/sfx/campana.wav')} volume={0.55} />
			</Sequence>
		</AbsoluteFill>
	);
};
