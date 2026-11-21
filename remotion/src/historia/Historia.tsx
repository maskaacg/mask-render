import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BEBAS, OSWALD, cargarFuentes} from '../style/fonts';
import {Clave, Isla3D} from './Escena3D';
import {PropsH, planificarH} from './plan';

cargarFuentes();

// ENIGMA 60 · corto-historia (70–120 s). Prototipo «El reloj de la torre», estilo isla 3D low-poly.
// Estructura: gancho → escena → pistas una a una → pregunta + cuenta atrás → solución → giro → CTA.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
const pop = (t: number, at: number) => interpolate(t, [at, at + 0.35], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
const AMARILLO = '#ffd34d';
const TINTA = '#1f2a3a';

/** Subtítulo palabra a palabra: grupos de hasta 4 palabras; la palabra que suena, en amarillo. */
const Karaoke: React.FC<{texto: string; inicio: number; fin: number; t: number}> = ({texto, inicio, fin, t}) => {
	const palabras = texto.split(/\s+/);
	const pesos = palabras.map((p) => p.replace(/[^\p{L}\p{N}]/gu, '').length + 1.5 + (/[.,:;?!…]$/.test(p) ? 3 : 0));
	const total = pesos.reduce((a, b) => a + b, 0);
	let acc = 0;
	const tiempos = pesos.map((w) => {
		const ini = inicio + (acc / total) * (fin - inicio);
		acc += w;
		return ini;
	});
	let k = 0;
	for (let i = 0; i < palabras.length; i++) if (t >= tiempos[i]) k = i;
	const g0 = Math.floor(k / 4) * 4;
	const grupo = palabras.slice(g0, g0 + 4);
	return (
		<div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 22px', padding: '0 50px'}}>
			{grupo.map((p, j) => {
				const idx = g0 + j;
				const activa = idx === k;
				return (
					<span key={idx} style={{fontFamily: BEBAS, fontSize: activa ? 104 : 92, color: activa ? AMARILLO : '#fff', WebkitTextStroke: `10px ${TINTA}`, paintOrder: 'stroke', opacity: idx <= k ? 1 : 0.55, lineHeight: 1.05}}>
						{p.toUpperCase()}
					</span>
				);
			})}
		</div>
	);
};

export const Historia: React.FC<PropsH> = (props) => {
	const {ficha} = props;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const P = planificarH(props);
	const T = P.t;
	const [z0, z1, z2] = ficha.puzle.dientes;
	const sol = T.s01.inicio;
	const giroT = T.t01.inicio;

	// ---- cámara (claves por fase de la historia)
	const claves: Clave[] = [
		{t: 0, pos: [0, 9, 19], mira: [0.5, 1.5, -2]},
		{t: T.g01.fin - 1.2, pos: [3.6, 4.6, 6.4], mira: [2.6, 3.4, -4]},
		{t: T.e01.inicio + 1.2, pos: [-0.6, 4.6, 10.5], mira: [-0.6, 1.5, 0]},
		{t: T.p01.inicio + 0.3, pos: [-2.0, 2.9, 5.6], mira: [-2.0, 1.4, 0.3]},
		{t: T.p02.inicio + 0.3, pos: [-1.4, 3.1, 6.2], mira: [-1.4, 1.6, 0.3]},
		{t: T.p03.inicio + 0.3, pos: [0.4, 3.4, 7.4], mira: [0.4, 2.0, 0.3]},
		{t: T.p04.inicio + 0.3, pos: [-1.9, 2.9, 5.8], mira: [-1.9, 1.4, 0.3]},
		{t: T.q01.inicio + 0.6, pos: [-0.4, 4.4, 10.0], mira: [-0.2, 1.9, -0.8]},
		{t: P.pensar.fin, pos: [-0.2, 4.1, 9.2], mira: [-0.2, 1.9, -0.8]},
		{t: sol + 0.6, pos: [-0.8, 3.7, 8.4], mira: [-0.8, 1.7, 0.3]},
		{t: giroT, pos: [-0.6, 3.9, 9.0], mira: [-0.6, 1.7, 0.3]},
		{t: giroT + 1.4, pos: [3.6, 2.6, 4.2], mira: [2.6, 1.2, -3]},
		{t: T.c01.inicio + 0.5, pos: [3.9, 2.8, 4.8], mira: [2.6, 1.3, -3.2]},
		{t: P.total, pos: [0, 10, 20], mira: [0.5, 1.5, -2]},
	];

	// ---- Leo: entra andando, espera junto a la mesa, va hacia la puerta al abrirse
	const caminaA = [T.g01.fin - 0.5, T.e01.inicio + 2.5];
	const caminaB = [giroT + 0.6, giroT + 4.2];
	const kT = [caminaA[0], caminaA[1], caminaB[0], caminaB[0] + 1.6, caminaB[0] + 2.8, caminaB[1]];
	const lx = interpolate(t, kT, [-7.5, -3.75, -3.75, 3.8, 3.8, 2.6], {...clamp});
	const lz = interpolate(t, kT, [3.2, 1.2, 1.2, 2.0, -1.6, -2.3], {...clamp});
	const andando = (t > caminaA[0] && t < caminaA[1]) || (t > caminaB[0] && t < caminaB[1]);
	const leoRot = t < caminaA[1] ? 1.3 : t < caminaB[0] ? 0.4 + 0.1 * Math.sin(t * 0.8) : t < caminaB[0] + 1.6 ? 1.57 : 3.14;
	const bob = andando ? Math.abs(Math.sin(t * 9)) * 0.06 : Math.sin(t * 2) * 0.015;

	// ---- engranajes
	const vueltas = interpolate(t, [sol + 0.2, sol + 7.2], [0, ficha.puzle.vueltas], {...clamp, easing: io});
	const th = t * 0.25 + vueltas * Math.PI * 2;
	const giro = [th, -(th * z0) / z1 + Math.PI / z1, (th * z0) / z2];
	const realce = ['p01', 'p02', 'p03'].map((id, i) => {
		const r = T[id];
		const a = interpolate(t, [r.inicio - 0.2, r.inicio + 0.3, r.fin + 0.6, r.fin + 1.1], [0, 1, 1, 0], clamp);
		const s = i === 2 ? interpolate(t, [sol, sol + 0.4], [0, 1], clamp) * interpolate(t, [giroT, giroT + 0.6], [1, 0], clamp) : 0;
		return Math.max(a, s);
	});

	// ---- reloj de medianoche: cuenta atrás de todo el vídeo
	const restante = Math.max(0, Math.ceil(P.total - 2 - t));
	const minutos = 60 - interpolate(t, [0, sol], [2, 0], clamp);
	const reloj = `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}`;
	const urgente = restante <= 10 || (t >= P.pensar.inicio && t < P.pensar.fin);

	// ---- puerta
	const puerta = interpolate(t, [giroT + 0.2, giroT + 1.4], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});

	// ---- capas de interfaz
	const linea = P.lineas.find((l) => t >= l.inicio && t < l.fin + 0.25);
	const pistasVisibles = ficha.pistas.filter((p) => t >= T[p.id].inicio);
	const enPistas = t >= T.p01.inicio - 0.2 && t < sol;
	const pensando = t >= P.pensar.inicio && t < P.pensar.fin;
	const segPensar = Math.max(0, Math.ceil(P.pensar.fin - t));
	const codigoRelleno = t >= sol;
	const cuenta = Math.floor(vueltas + 1e-6);
	const grande = Math.floor((vueltas * z0) / z2 + 1e-6);
	const flash = interpolate(t, [sol, sol + 0.12, sol + 0.8], [0, 0.55, 0], clamp);
	const salidaO = interpolate(t, [P.total - 1.6, P.total - 1.2], [0, 1], clamp);

	const sfx = (name: string, at: number, vol = 0.6) => (
		<Sequence from={Math.round(at * fps)} key={name + at}>
			<Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={vol} />
		</Sequence>
	);

	return (
		<AbsoluteFill style={{background: '#f3a77b', overflow: 'hidden'}}>
			<Isla3D
				dientes={ficha.puzle.dientes}
				e={{t, claves, leo: [lx, bob, lz], leoRot, paso: andando ? t * 1.6 : 0, giro, realce, puerta, minutos, luzPuerta: puerta * 1.2}}
			/>
			<AbsoluteFill style={{background: '#fff4d6', opacity: flash}} />

			{/* cabecera de la sala */}
			<div style={{position: 'absolute', top: 56, left: 44, right: 44, background: '#fffaf0', borderRadius: 22, padding: '14px 22px', boxShadow: '0 8px 0 #c98b3a', display: 'flex', gap: 18, alignItems: 'center'}}>
				<div style={{width: 72, height: 72, borderRadius: 16, background: '#e05a47', color: '#fff', fontFamily: BEBAS, fontSize: 44, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>60</div>
				<div style={{flex: 1}}>
					<div style={{fontFamily: OSWALD, fontWeight: 500, fontSize: 22, color: '#a66b2c', letterSpacing: 3}}>ENIGMA 60 · SALA {String(ficha.sala).padStart(2, '0')} · DIFICULTAD ●○○</div>
					<div style={{fontFamily: BEBAS, fontSize: 56, color: TINTA, lineHeight: 1}}>{ficha.titulo.toUpperCase()}</div>
				</div>
			</div>
			{/* cuenta atrás hasta medianoche */}
			<div style={{position: 'absolute', top: 214, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
				<div style={{background: urgente ? '#c0392b' : TINTA, color: '#fff', borderRadius: 40, padding: '8px 30px', fontFamily: BEBAS, fontSize: 64, letterSpacing: 2, transform: `scale(${urgente ? 1 + 0.04 * Math.sin(t * 12) : 1})`}}>
					⏱ {reloj}
				</div>
			</div>

			{/* tablón de pistas (se acumulan) */}
			{enPistas && (
				<div style={{position: 'absolute', top: 330, left: 60, right: 60, background: 'rgba(31,42,58,0.93)', border: `5px solid ${AMARILLO}`, borderRadius: 20, padding: '18px 26px', opacity: interpolate(t, [T.p01.inicio - 0.2, T.p01.inicio + 0.2], [0, 1], clamp)}}>
					<div style={{fontFamily: OSWALD, fontWeight: 500, fontSize: 26, color: AMARILLO, letterSpacing: 4, marginBottom: 6}}>LAS PISTAS</div>
					{pistasVisibles.map((p) => (
						<div key={p.id} style={{display: 'flex', alignItems: 'center', gap: 16, fontFamily: OSWALD, fontWeight: 500, fontSize: 42, color: '#fff', transform: `scale(${pop(t, T[p.id].inicio)})`, transformOrigin: 'left center', margin: '4px 0'}}>
							<span style={{width: 30, height: 30, borderRadius: '50%', background: p.color, border: '3px solid #fff', flex: 'none'}} />
							{p.texto}
						</div>
					))}
				</div>
			)}

			{/* código del candado */}
			{t >= T.q01.inicio && t < giroT + 1.2 && (
				<div style={{position: 'absolute', top: 1230, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: interpolate(t, [T.q01.inicio, T.q01.inicio + 0.3], [0, 1], clamp)}}>
					<div style={{fontFamily: OSWALD, fontWeight: 500, fontSize: 30, letterSpacing: 4, color: '#fff', background: TINTA, padding: '6px 20px', borderRadius: 12}}>CÓDIGO DEL CANDADO</div>
					<div style={{marginTop: 12, width: 150, height: 170, borderRadius: 20, background: codigoRelleno ? '#2e9e5b' : TINTA, border: `6px solid ${AMARILLO}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BEBAS, fontSize: 140, color: codigoRelleno ? '#fff' : AMARILLO, transform: `scale(${codigoRelleno ? pop(t, sol) : 1})`}}>
						{codigoRelleno ? ficha.puzle.respuesta : '?'}
					</div>
				</div>
			)}

			{/* tiempo para pensar */}
			{pensando && (
				<>
					<div style={{position: 'absolute', top: 600, left: 60, right: 60, background: '#fffaf0', borderRadius: 22, padding: '16px 26px', boxShadow: '0 8px 0 #c98b3a', fontFamily: OSWALD, fontWeight: 500, fontSize: 44, color: TINTA, textAlign: 'center'}}>
						¿Cuántas vueltas da <span style={{color: '#c0392b'}}>el grande</span>?
					</div>
					<div style={{position: 'absolute', top: 1540, left: 0, right: 0, textAlign: 'center', fontFamily: BEBAS, fontSize: 190, color: '#fff', WebkitTextStroke: `12px ${TINTA}`, paintOrder: 'stroke', lineHeight: 1}}>{segPensar}</div>
				</>
			)}

			{/* contador de la solución */}
			{t >= sol && t < giroT + 0.5 && (
				<div style={{position: 'absolute', top: 330, left: 60, right: 60, display: 'flex', gap: 20, justifyContent: 'center', opacity: interpolate(t, [giroT, giroT + 0.5], [1, 0], clamp)}}>
					{[[`PEQUEÑO`, cuenta, '#f2c84b'], ['GRANDE', grande, '#4fa3e0']].map(([n, v, c]) => (
						<div key={n as string} style={{background: 'rgba(31,42,58,0.93)', border: `5px solid ${c}`, borderRadius: 20, padding: '12px 26px', textAlign: 'center', minWidth: 300}}>
							<div style={{fontFamily: OSWALD, fontWeight: 500, fontSize: 28, color: c as string, letterSpacing: 3}}>{n}</div>
							<div style={{fontFamily: BEBAS, fontSize: 110, color: '#fff', lineHeight: 1}}>{v} <span style={{fontSize: 50}}>{v === 1 ? 'VUELTA' : 'VUELTAS'}</span></div>
						</div>
					))}
				</div>
			)}

			{/* subtítulo palabra a palabra */}
			<div style={{position: 'absolute', top: 1560, left: 0, right: 0}}>
				{linea && !pensando && <Karaoke texto={linea.texto} inicio={linea.inicio} fin={linea.fin} t={t} />}
			</div>

			{/* gancho del día siguiente */}
			{t >= T.c01.inicio && (
				<div style={{position: 'absolute', top: 330, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
					<div style={{background: '#2e9e5b', color: '#fff', borderRadius: 22, padding: '14px 34px', boxShadow: '0 8px 0 #1d6b3c', fontFamily: BEBAS, fontSize: 70, transform: `scale(${pop(t, T.c01.inicio)})`}}>MAÑANA · SALA 02 →</div>
				</div>
			)}

			{/* cierre */}
			<div style={{position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', fontFamily: OSWALD, fontSize: 24, letterSpacing: 3, color: TINTA, opacity: Math.max(0.55, salidaO)}}>{ficha.aviso_ia.toUpperCase()}</div>

			{/* audio */}
			<Audio src={staticFile('audio/sfx/ambiente.wav')} volume={0.35} />
			{sfx('aire', 0.05, 0.45)}
			{sfx('golpe', 0.15, 0.5)}
			{P.lineas.map((l) => (
				<Sequence key={l.id} from={Math.round(l.inicio * fps)}>
					<Audio src={staticFile(`audio/${ficha.id}/${l.id}.wav`)} />
				</Sequence>
			))}
			{ficha.pistas.map((p) => sfx('tic', T[p.id].inicio, 0.5))}
			{Array.from({length: ficha.pensar_s}, (_, i) => (
				<Sequence key={'tic' + i} from={Math.round((P.pensar.inicio + i) * fps)} durationInFrames={Math.round(0.3 * fps)}>
					<Audio src={staticFile('audio/sfx/tic.wav')} volume={0.6} />
				</Sequence>
			))}
			{sfx('campana', sol, 0.6)}
			{sfx('cerrojo', giroT, 0.7)}
			{sfx('bisagra', giroT + 0.25, 0.6)}
			{sfx('viento', giroT + 1.2, 0.4)}
		</AbsoluteFill>
	);
};
