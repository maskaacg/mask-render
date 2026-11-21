import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import spec from './e60_cinco_sellos_proto.json';
import manifest from '../../public/audio/manifest.json';
import {Room} from '../components/Room';
import {Door} from '../components/Door';
import {SealsTable} from '../components/Seals';
import {Dust, Vignette} from '../components/Atmosphere';
import {Subtitle} from '../components/Subtitle';

type Accion = (typeof spec.acciones)[number];
const accion = (objeto: string, tipo?: string): Accion => {
	const a = spec.acciones.find((x) => x.objeto === objeto && (!tipo || x.tipo === tipo));
	if (!a) throw new Error(`Falta la acción ${objeto}/${tipo} en la ficha`);
	return a;
};
const pistas = manifest.pistas as Record<string, {segundos: number; texto?: string}>;

export const CincoSellosProto: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const time = frame / fps;

	// --- Puerta: se cierra acelerando, golpea y rebota levemente ---
	const cierre = accion('puerta', 'cerrar');
	const a0 = cierre.angulo_inicial ?? -42;
	const startAngle = Math.abs(a0);
	let angle: number;
	if (time < cierre.inicio) {
		angle = startAngle;
	} else if (time < (cierre.fin ?? 1.1)) {
		const p = (time - cierre.inicio) / ((cierre.fin ?? 1.1) - cierre.inicio);
		angle = startAngle * (1 - Math.pow(p, 2.3));
	} else {
		const q = time - (cierre.fin ?? 1.1);
		angle = 2.6 * Math.sin(Math.PI * Math.min(1, q / (cierre.rebote ?? 0.35))) * Math.exp(-q * 6);
	}

	// --- Cámara: sacudida al golpe y travelling hacia la puerta ---
	const sac = accion('camara', 'sacudida');
	const shakeT = time - sac.inicio;
	const shakeAmp = shakeT > 0 && time < (sac.fin ?? 1.55) ? (sac.intensidad ?? 12) * Math.exp(-shakeT * 7) : 0;
	const shakeX = shakeAmp * Math.sin(time * 91);
	const shakeY = shakeAmp * Math.cos(time * 73);

	const trav = accion('camara', 'travelling');
	const dolly = interpolate(time, [trav.inicio, trav.fin ?? 7.8], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.cubic),
	});
	const drift = Math.sin(time * 0.5) * 0.01; // deriva lenta para que nada quede congelado
	const scale = 1 + ((trav.escala_final ?? 1.3) - 1) * dolly + drift;
	const [fx, fy] = (trav.foco as number[]) ?? [540, 860];

	// --- Ranuras y mesa ---
	const slot = (n: number) => {
		const s = accion(`ranura_${n}`).inicio;
		return frame < s * fps ? 0 : spring({frame: frame - s * fps, fps, config: {damping: 14, mass: 0.6}});
	};
	const mesa = accion('mesa_sellos');
	const enter = frame < mesa.inicio * fps ? 0 : spring({frame: frame - mesa.inicio * fps, fps, config: {damping: 16, mass: 0.9}});
	const glint = interpolate(time, [8.8, 10.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	// --- Lámpara: parpadeo suave y oscilación tras el portazo ---
	const lamp = 0.85 + 0.1 * Math.sin(time * 7.3) * Math.sin(time * 2.1) - (shakeAmp > 0 ? 0.25 * Math.abs(Math.sin(time * 40)) : 0);

	// --- Subtítulos: el texto de la línea de voz activa ---
	const linea = spec.voz_lineas.find((l) => time >= l.inicio && time < l.inicio + pistas[l.id].segundos + 0.35);
	const subOpacity = linea
		? Math.min(1, (time - linea.inicio) / 0.15, (linea.inicio + pistas[linea.id].segundos + 0.35 - time) / 0.2)
		: 0;

	const world = `translate(${shakeX}px, ${shakeY}px) scale(${scale})`;
	// primer término: se mueve más que el fondo (parallax) pero anclado abajo para no salir de cuadro
	const fore = `translate(${shakeX * 1.6}px, ${shakeY * 1.6 - dolly * 40}px) scale(${1 + (scale - 1) * 0.45})`;

	return (
		<AbsoluteFill style={{backgroundColor: '#050807', overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: world, transformOrigin: `${fx}px ${fy}px`}}>
				<Room lamp={lamp} />
				<Door angle={angle} slots={[slot(1), slot(2), slot(3)]} />
				<Dust time={time} slamAt={sac.inicio} />
			</AbsoluteFill>
			<AbsoluteFill style={{transform: fore, transformOrigin: '540px 1700px'}}>
				<SealsTable enter={enter} glint={glint} />
			</AbsoluteFill>
			<Vignette strength={0.62} />
			<Subtitle
				text={linea ? (pistas[linea.id].texto as string) : ''}
				opacity={Math.max(0, subOpacity)}
				zone={spec.subtitulos.zona as [number, number, number, number]}
			/>
			{spec.voz_lineas.map((l) => (
				<Sequence key={l.id} from={Math.round(l.inicio * fps)}>
					<Audio src={staticFile(`audio/${l.id}.wav`)} volume={1} />
				</Sequence>
			))}
			{spec.efectos.map((e) => (
				<Sequence key={e.id} from={Math.round(e.inicio * fps)}>
					<Audio src={staticFile(`audio/${e.id}.wav`)} volume={e.volumen} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
