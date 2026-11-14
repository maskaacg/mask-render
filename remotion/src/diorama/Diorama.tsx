import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {cargarFuentes} from '../style/fonts';
import {AnilloDe60, BordeMaqueta, Cabecera, CortinaEngranajes, ExplicacionCajas, FichasPista, SelloE60, Subtitulo} from '../e60/nucleo';
import {ClaveCam, EstadoSala, SalaLastre3D} from './SalaLastre3D';
import {PropsD, planificarD} from './plan';

cargarFuentes();

// ENIGMA 60 · prototipo «Diorama E60» · «La sala de lastre» (submarino «Profundidad 600»).
// Estructura: gancho → barrido de sala → pistas → pregunta → anillo de 60 → solución visual → clac → giro → cierre.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
const lerp = (t: number, ts: number[], vs: number[]) => interpolate(t, ts, vs, {...clamp, easing: io});
const pulso = (t: number, a: number, b: number, sube = 0.35, baja = 0.6) => interpolate(t, [a - sube, a, b, b + baja], [0, 1, 1, 0], clamp);

export const Diorama: React.FC<PropsD> = (props) => {
	const {ficha} = props;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const P = planificarD(props);
	const T = P.t;
	const [rA, rB, rC] = ficha.puzle.respuesta;
	const sol = T.s01.inicio;
	const clac = P.clac;
	const giro = T.t01.inicio;

	// ---- cámara subjetiva (claves por fase)
	const claves: ClaveCam[] = [
		{t: 0, pos: [0.3, -0.75, 4.55], mira: [0.25, -1.55, 3.3]},
		{t: T.g01.fin, pos: [0.33, -0.65, 4.5], mira: [0.2, -1.4, 2.6]},
		{t: T.e01.inicio - 0.6, pos: [1.05, 0.35, 5.0], mira: [-0.6, 0.0, 1.2]},
		{t: T.e01.inicio + 3.2, pos: [0.85, 0.25, 4.1], mira: [-1.0, 0.1, -2.6]},
		{t: T.e01.fin + 0.2, pos: [0.4, 0.2, 3.1], mira: [-0.1, 0.1, -6]},
		{t: T.p01.inicio + 0.7, pos: [0.95, 0.5, 0.75], mira: [-1.0, 0.33, -1.75]},
		{t: T.p02.inicio + 0.7, pos: [0.9, 0.5, -1.7], mira: [-1.0, 0.33, -3.45]},
		{t: T.p03.inicio + 0.7, pos: [0.15, 0.3, -0.95], mira: [2.28, 0.1, -2.2]},
		{t: T.q01.inicio + 0.7, pos: [1.25, 0.3, 0.9], mira: [-1.1, -0.35, -2.6]},
		{t: P.pensar.inicio, pos: [0.95, 0.5, 0.3], mira: [-1.1, -0.1, -2.6]},
		{t: P.pensar.fin, pos: [1.15, 0.75, 2.3], mira: [-0.8, 0.05, -2.6]},
		{t: sol + 0.6, pos: [0.95, 0.42, 0.55], mira: [-1.0, 0.3, -2.6]},
		{t: T.s02.fin, pos: [0.95, 0.42, 0.25], mira: [-1.0, 0.25, -2.6]},
		{t: clac.inicio + 0.5, pos: [0.75, -0.2, 0.35], mira: [-1.0, -0.85, -2.45]},
		{t: clac.fin, pos: [0.65, -0.15, 0.05], mira: [-1.0, -0.8, -2.6]},
		{t: giro + 0.5, pos: [0.3, 0.25, -2.4], mira: [0, 0.1, -6]},
		{t: giro + 2.9, pos: [0.15, 0.25, -2.75], mira: [1.6, -0.3, -5.1]},
		{t: T.t01.fin, pos: [0.25, 0.15, -3.9], mira: [-0.2, 0.1, -7]},
		{t: P.total, pos: [0.12, 0.2, -4.7], mira: [-0.3, 0.1, -7.6]},
	];
	const ts = claves.map((c) => c.t);
	const v3 = (k: 'pos' | 'mira'): [number, number, number] => [0, 1, 2].map((i) => lerp(t, ts, claves.map((c) => c[k][i]))) as [number, number, number];
	// deriva continua (nunca quieta) + golpes de cámara en el clac y la escotilla
	const golpe = (at: number) => interpolate(t, [at, at + 0.05, at + 0.25], [0, 1, 0], clamp);
	const g = golpe(clac.inicio + 3.0) + golpe(giro + 0.3) * 0.7;
	const pos = v3('pos');
	const mira = v3('mira');
	pos[0] += Math.sin(t * 0.7) * 0.025 + Math.sin(t * 37) * 0.012 * g;
	pos[1] += Math.sin(t * 0.53 + 1) * 0.02 + Math.sin(t * 41) * 0.018 * g;
	mira[0] += Math.sin(t * 0.41 + 2) * 0.03;
	const fov = lerp(t, [0, T.e01.inicio, P.pensar.inicio, P.pensar.fin, P.total], [52, 56, 54, 50, 54]);

	// ---- manómetros: bailan hasta la solución y se asientan en 8, 4, 7
	const asiento = interpolate(t, [sol - 0.2, sol + 1.3], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
	const baila = (i: number) => 5 + 3.8 * Math.sin(t * (1.7 + i * 0.6) + i * 2) + 1.2 * Math.sin(t * (7.3 + i) + i);
	const agujas = [rA, rB, rC].map((r, i) => baila(i) * (1 - asiento) + r * asiento) as EstadoSala['agujas'];

	// ---- luz de pista cian
	const todas = interpolate(t, [sol, sol + 0.4, clac.fin, clac.fin + 0.6], [0, 0.8, 0.8, 0], clamp);
	const pista: EstadoSala['pista'] = [
		Math.max(pulso(t, T.p01.inicio, T.p01.fin + 0.4), todas),
		Math.max(pulso(t, T.p01.inicio + 1.2, T.p02.fin + 0.4) * 0.6, todas),
		Math.max(pulso(t, T.p02.inicio, T.p02.fin + 0.4), todas),
		pulso(t, T.p03.inicio, T.p03.fin + 0.4),
	];

	// ---- válvulas (clac) y soplado de lastre
	const valv = (i: number, r: number) => interpolate(t, [clac.inicio + 0.4 + i * 0.8, clac.inicio + 1.1 + i * 0.8], [0, -r * 0.62], {...clamp, easing: Easing.out(Easing.back(1.5))});
	const valvulas: EstadoSala['valvulas'] = [valv(0, rA), valv(1, rB), valv(2, rC)];
	const soplado = interpolate(t, [clac.inicio + 3.0, clac.inicio + 3.3, giro + 2, giro + 4], [0, 1, 1, 0], clamp);

	// ---- guante: en el agua al empezar y girando los volantes en el clac
	const zMano = interpolate(t, [clac.inicio, clac.inicio + 0.4, clac.inicio + 1.2, clac.inicio + 2.0, clac.inicio + 2.8], [-1.0, -1.0, -2.6, -2.6, -4.2], {...clamp, easing: io});
	const enClac = pulso(t, clac.inicio + 0.25, clac.inicio + 3.0, 0.3, 0.5);
	const enGancho = interpolate(t, [0, 0.4, T.g01.fin + 0.2, T.g01.fin + 0.9], [0, 1, 1, 0], clamp);
	const guante: EstadoSala['guante'] =
		enClac > 0
			? {visible: enClac, pos: [-0.66, -1.02, zMano], rot: [Math.PI / 2, Math.PI / 2, 0], orden: 'YXZ'}
			: {visible: enGancho, pos: [0.28, interpolate(t, [0, T.g01.fin], [-1.48, -1.58], clamp), 3.55], rot: [0.35, 0.3, 0]};

	const e: EstadoSala = {
		t,
		cam: {pos, mira, fov},
		agua: interpolate(t, [0, P.total], [-1.62, -1.22], clamp),
		agujas,
		pista,
		valvulas,
		escotilla: interpolate(t, [giro + 0.2, giro + 1.8], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}),
		violeta: interpolate(t, [giro + 2.4, giro + 2.6, giro + 3.1], [0, 1, 0.15], clamp),
		guante,
		alarma: interpolate(t, [giro, giro + 1.5], [1, 0.35], clamp),
		soplado,
	};

	// ---- interfaz
	const linea = P.lineas.find((l) => t >= l.inicio - 0.1 && t < l.fin + 0.35);
	const fichas = ficha.pistas.map((p, i) => ({texto: p.texto, desde: T[p.id].inicio + 0.3, activa: [pista[0], pista[2], pista[3]][i]}));
	const flash = interpolate(t, [clac.inicio + 3.0, clac.inicio + 3.1, clac.inicio + 3.7], [0, 0.35, 0], clamp);
	const fundidoIn = interpolate(t, [0, 0.6], [1, 0], clamp);
	const fundidoOut = interpolate(t, [P.total - 0.8, P.total], [0, 1], clamp);

	const sfx = (name: string, at: number, vol = 0.6) => (
		<Sequence from={Math.max(0, Math.round(at * fps))} key={name + at}>
			<Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={vol} />
		</Sequence>
	);
	const gotas = Array.from({length: Math.floor(P.total / 2.3)}, (_, i) => 1.2 + i * 2.3 + (i % 3) * 0.4);

	return (
		<AbsoluteFill style={{background: '#0b0f12', overflow: 'hidden'}}>
			<SalaLastre3D e={e} />
			<AbsoluteFill style={{background: '#dff6ff', opacity: flash}} />
			<BordeMaqueta />
			<Cabecera t={t} aventura={ficha.aventura} titulo={ficha.titulo} sala={ficha.sala} tituloHasta={T.e01.fin} />
			<FichasPista t={t} pistas={fichas} hasta={clac.fin} />
			<AnilloDe60 t={t} inicio={P.pensar.inicio} fin={P.pensar.fin} />
			<ExplicacionCajas t={t} inicio={T.s02.inicio} fin={T.s02.fin} valor={rB} />
			{linea && <Subtitulo texto={linea.texto} inicio={linea.inicio} fin={linea.fin} t={t} />}
			<CortinaEngranajes t={t} en={clac.inicio + 2.85} />
			<SelloE60 t={t} desde={T.c01.inicio + 0.6} aviso={ficha.aviso_ia} />
			<AbsoluteFill style={{background: '#14151A', opacity: Math.max(fundidoIn, fundidoOut)}} />

			{/* sonido */}
			<Audio src={staticFile('audio/sfx/ambiente.wav')} volume={0.45} />
			{sfx('logo', 0.2, 0.25)}
			{sfx('casco', 1.2, 0.55)}
			{sfx('sonar', 3.0, 0.3)}
			{sfx('casco', T.e01.inicio + 4, 0.4)}
			{sfx('sonar', T.p02.fin + 0.5, 0.22)}
			{sfx('casco', P.pensar.inicio + 6, 0.45)}
			{gotas.map((g0) => sfx('gota', g0, 0.18))}
			{Array.from({length: ficha.pensar_s}, (_, i) => sfx('tic', P.pensar.inicio + i, 0.5))}
			{[0, 1, 2].map((i) => sfx('cerrojo', clac.inicio + 1.05 + i * 0.8, 0.55))}
			{sfx('golpe', clac.inicio + 3.0, 0.8)}
			{sfx('aire', clac.inicio + 3.0, 0.7)}
			{sfx('burbujas', clac.inicio + 3.1, 0.6)}
			{sfx('bisagra', giro + 0.2, 0.6)}
			{sfx('golpe', giro + 0.3, 0.4)}
			{sfx('logo', T.c01.inicio + 0.6, 0.45)}
			{P.lineas.map((l) => (
				<Sequence key={l.id} from={Math.round(l.inicio * fps)}>
					<Audio src={staticFile(`audio/${ficha.id}/${l.id}.wav`)} volume={1} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
