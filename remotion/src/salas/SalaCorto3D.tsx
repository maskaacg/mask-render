import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Camara, hash, tex} from '../diorama/SalaLastre3D';
import {Cerillas3D, EstadoCerillas} from '../escape/Cerillas3D';
import {Engranajes3D, EstadoEngranajes} from './Engranajes3D';

// ENIGMA 60 · Habitación propia para cada acertijo corto (orden del Propietario, 16/11/2026).
// La sala se describe en la ficha (`sala`) y se construye aquí con geometría procedural de three.js
// (MIT) y texturas pintadas en canvas (propias). Cada corto declara su sala; el verificador
// impide repetir el `id` o la combinación pared + suelo + luz de otro vídeo.

type V3 = [number, number, number];
export type Atrezo = {
	tipo: 'estanteria' | 'reloj' | 'ventana' | 'cuadro' | 'barril' | 'caja' | 'alfombra' | 'chimenea' | 'tuberia' | 'banco' | 'lampara_pie' | 'mapa';
	pared?: 'N' | 'E' | 'O' | 'S';
	x?: number; // posición a lo largo de la pared (m, 0 = centro) o en el suelo
	z?: number;
	escala?: number;
	color?: string;
};
export type Sala = {
	id: string;
	nombre: string;
	ancho: number; // eje X
	fondo: number; // eje Z (la cámara entra por el sur, la puerta de salida está al norte)
	alto: number;
	pared: {patron: 'ladrillo' | 'tablas' | 'papel' | 'azulejo' | 'piedra' | 'chapa'; color: string; color2: string};
	suelo: {patron: 'tablones' | 'damero' | 'losas' | 'rejilla'; color: string; color2: string};
	techo: string;
	luz: {tipo: 'velas' | 'lampara' | 'luna' | 'fluorescente' | 'chimenea'; color: string; intensidad: number};
	niebla: string;
	puzle_en: 'suelo' | 'mesa';
	mesa?: {color: string};
	atrezo: Atrezo[];
};
export type EstadoSalaCorto = {t: number; cam: {pos: V3; mira: V3; fov: number}; puerta: number; foco: number; cerillas?: EstadoCerillas; engranajes?: EstadoEngranajes; relampago?: number};

export const MESA_ALTO = 0.78;
/** Centro del acertijo en la sala (sobre el suelo o sobre la mesa central). */
export const centroPuzle = (s: Sala): V3 => [0, s.puzle_en === 'mesa' ? MESA_ALTO + 0.035 : 0, 0.35];
/** Planos de cámara derivados de la geometría de cada sala. */
export const planosSala = (s: Sala) => {
	const c = centroPuzle(s);
	const z0 = s.fondo / 2 - 0.45;
	return {
		entrada: {pos: [0.25, 1.62, z0] as V3, mira: [0, 1.45, -s.fondo / 2] as V3, fov: 80},
		detalle: {pos: [s.ancho / 4, 1.55, z0 - 0.5] as V3, mira: [-s.ancho / 2, 1.25, -s.fondo / 8] as V3, fov: 72},
		puzle: {pos: [0, c[1] + 1.8, c[2] + 2.5] as V3, mira: [0, c[1] + 0.02, c[2] - 0.1] as V3, fov: 62},
		puerta: {pos: [0, 1.5, -s.fondo / 2 + 2.6] as V3, mira: [0, 1.2, -s.fondo / 2] as V3, fov: 62},
	};
};

// ---------- texturas por patrón
const ruido = (c: CanvasRenderingContext2D, w: number, h: number, n = 1600, a = 0.06) => {
	for (let i = 0; i < n; i++) {
		c.fillStyle = hash(i * 3.1) > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.6})`;
		c.fillRect(hash(i) * w, hash(i + 0.37) * h, 1 + hash(i * 1.7) * 3, 1 + hash(i * 2.3) * 3);
	}
};
const texPared = (p: Sala['pared'], rep: [number, number]) =>
	tex(512, 512, (c) => {
		c.fillStyle = p.color2;
		c.fillRect(0, 0, 512, 512);
		if (p.patron === 'ladrillo' || p.patron === 'piedra') {
			const filas = p.patron === 'ladrillo' ? 16 : 7;
			const hF = 512 / filas;
			for (let f = 0; f < filas; f++) {
				let x = f % 2 ? -hF : 0;
				let k = 0;
				while (x < 512) {
					const w = p.patron === 'ladrillo' ? hF * 2.2 : 60 + hash(f * 31 + k * 7) * 70;
					c.fillStyle = p.color;
					c.globalAlpha = 0.75 + hash(f * 13 + k * 3) * 0.25;
					c.fillRect(x + 3, f * hF + 3, w - 6, hF - 6);
					c.globalAlpha = 1;
					x += w;
					k++;
				}
			}
		} else if (p.patron === 'tablas') {
			for (let i = 0; i < 10; i++) {
				c.fillStyle = p.color;
				c.globalAlpha = 0.7 + hash(i * 5.3) * 0.3;
				c.fillRect(i * 51.2 + 2, 0, 47, 512);
			}
			c.globalAlpha = 1;
		} else if (p.patron === 'papel') {
			c.fillStyle = p.color;
			for (let y = 0; y < 512; y += 64)
				for (let x = (y / 64) % 2 ? 32 : 0; x < 512; x += 64) {
					c.beginPath();
					c.moveTo(x + 32, y + 8);
					c.lineTo(x + 52, y + 32);
					c.lineTo(x + 32, y + 56);
					c.lineTo(x + 12, y + 32);
					c.closePath();
					c.fill();
				}
			c.fillStyle = 'rgba(0,0,0,0.25)';
			c.fillRect(0, 430, 512, 82);
		} else if (p.patron === 'azulejo') {
			for (let y = 0; y < 512; y += 64)
				for (let x = 0; x < 512; x += 64) {
					c.fillStyle = p.color;
					c.globalAlpha = 0.8 + hash(x * 0.3 + y) * 0.2;
					c.fillRect(x + 3, y + 3, 58, 58);
				}
			c.globalAlpha = 1;
		} else {
			// chapa remachada
			c.fillStyle = p.color;
			c.fillRect(6, 6, 500, 500);
			c.fillStyle = p.color2;
			for (let i = 0; i < 8; i++) [[16 + i * 64, 16], [16 + i * 64, 496], [16, 16 + i * 64], [496, 16 + i * 64]].forEach(([x, y]) => c.fillRect(x - 4, y - 4, 8, 8));
		}
		ruido(c, 512, 512);
	}, rep);
const texSuelo = (p: Sala['suelo'], rep: [number, number]) =>
	tex(512, 512, (c) => {
		c.fillStyle = p.color2;
		c.fillRect(0, 0, 512, 512);
		if (p.patron === 'tablones') {
			for (let i = 0; i < 8; i++) {
				c.fillStyle = p.color;
				c.globalAlpha = 0.75 + hash(i * 2.7) * 0.25;
				c.fillRect(i * 64 + 2, 0, 60, 512);
			}
		} else if (p.patron === 'damero') {
			for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) {
				c.fillStyle = p.color;
				c.fillRect(x * 64, y * 64, 64, 64);
			}
		} else if (p.patron === 'losas') {
			for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
				c.fillStyle = p.color;
				c.globalAlpha = 0.7 + hash(x * 7 + y) * 0.3;
				c.fillRect(x * 128 + 4, y * 128 + 4, 120, 120);
			}
		} else {
			c.strokeStyle = p.color;
			c.lineWidth = 6;
			for (let i = 0; i <= 512; i += 32) {
				c.beginPath();
				c.moveTo(i, 0);
				c.lineTo(i, 512);
				c.moveTo(0, i);
				c.lineTo(512, i);
				c.stroke();
			}
		}
		c.globalAlpha = 1;
		ruido(c, 512, 512, 2200, 0.05);
	}, rep);

// ---------- atrezo
const Mat: React.FC<{c: string; r?: number; m?: number; e?: string; ei?: number}> = ({c, r = 0.8, m = 0, e, ei = 0}) => <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e ?? '#000000'} emissiveIntensity={ei} />;
const Caja: React.FC<{p: V3; s: V3; c: string; r?: number; m?: number; rot?: V3}> = ({p, s, c, r, m, rot}) => (
	<mesh position={p} rotation={rot}>
		<boxGeometry args={s} />
		<Mat c={c} r={r} m={m} />
	</mesh>
);

const colocar = (s: Sala, a: Atrezo, prof = 0.2): {pos: V3; rotY: number} => {
	const x = a.x ?? 0;
	switch (a.pared) {
		case 'N': return {pos: [x, 0, -s.fondo / 2 + prof], rotY: 0};
		case 'S': return {pos: [x, 0, s.fondo / 2 - prof], rotY: Math.PI};
		case 'E': return {pos: [s.ancho / 2 - prof, 0, x], rotY: -Math.PI / 2};
		case 'O': return {pos: [-s.ancho / 2 + prof, 0, x], rotY: Math.PI / 2};
		default: return {pos: [x, 0, a.z ?? 0], rotY: 0};
	}
};

const Pieza: React.FC<{s: Sala; a: Atrezo; t: number}> = ({s, a, t}) => {
	const k = a.escala ?? 1;
	const col = a.color ?? '#5a3a22';
	const {pos, rotY} = colocar(s, a, a.tipo === 'ventana' || a.tipo === 'cuadro' || a.tipo === 'reloj' || a.tipo === 'mapa' ? 0.03 : 0.25);
	let cuerpo: React.ReactNode = null;
	if (a.tipo === 'estanteria') {
		cuerpo = (
			<group>
				<Caja p={[0, 1.1, 0]} s={[1.3, 2.2, 0.36]} c={col} />
				{[0.35, 0.85, 1.35, 1.85].map((y, i) => (
					<group key={y}>
						<Caja p={[0, y, 0.05]} s={[1.2, 0.04, 0.32]} c="#2a1a0e" />
						{Array.from({length: 7}, (_, j) => (
							<Caja key={j} p={[-0.5 + j * 0.15 + hash(i * 9 + j) * 0.03, y + 0.15, 0.06]} s={[0.07, 0.24 + hash(i + j * 3) * 0.08, 0.22]} c={['#7a2e22', '#2e4a6a', '#3d5a2e', '#8a6a2c', '#4a2e5a'][(i + j) % 5]} />
						))}
					</group>
				))}
			</group>
		);
	} else if (a.tipo === 'reloj') {
		const ang = t * 0.6;
		cuerpo = (
			<group position={[0, 1.9, 0.04]} scale={k}>
				<mesh rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.32, 0.32, 0.06, 40]} />
					<Mat c={col} m={0.5} r={0.4} />
				</mesh>
				<mesh position={[0, 0, 0.032]}>
					<circleGeometry args={[0.28, 40]} />
					<Mat c="#efe3c4" r={0.6} />
				</mesh>
				<Caja p={[Math.sin(ang) * 0.1, Math.cos(ang) * 0.1, 0.04]} s={[0.015, 0.2, 0.01]} c="#1a1a1a" rot={[0, 0, -ang]} />
				<Caja p={[Math.sin(ang / 12) * 0.07, Math.cos(ang / 12) * 0.07, 0.045]} s={[0.022, 0.14, 0.01]} c="#1a1a1a" rot={[0, 0, -ang / 12]} />
				{/* péndulo */}
				<group position={[0, -0.32, 0.01]} rotation={[0, 0, Math.sin(t * 3.1) * 0.25]}>
					<Caja p={[0, -0.3, 0]} s={[0.02, 0.6, 0.01]} c="#8a6a2c" m={0.7} />
					<mesh position={[0, -0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
						<cylinderGeometry args={[0.07, 0.07, 0.02, 24]} />
						<Mat c="#b8963a" m={0.8} r={0.3} />
					</mesh>
				</group>
			</group>
		);
	} else if (a.tipo === 'ventana') {
		const rel = 0;
		cuerpo = (
			<group position={[0, 1.7, 0]}>
				<mesh>
					<planeGeometry args={[1.0 * k, 1.4 * k]} />
					<meshBasicMaterial color={a.color ?? '#1d2a4a'} toneMapped={false} />
				</mesh>
				<mesh position={[0.22 * k, 0.35 * k, 0.005]}>
					<circleGeometry args={[0.1 * k, 24]} />
					<meshBasicMaterial color="#e8eeff" toneMapped={false} />
				</mesh>
				{[-0.5, 0, 0.5].map((x) => <Caja key={'v' + x} p={[x * k, 0, 0.02]} s={[0.05, 1.45 * k, 0.05]} c="#2a1a10" />)}
				{[-0.7, 0, 0.7].map((y) => <Caja key={'h' + y} p={[0, y * k, 0.02]} s={[1.05 * k, 0.05, 0.05]} c="#2a1a10" />)}
				<pointLight position={[0, 0, 0.6]} color="#9fb4ff" intensity={0.9 + rel} distance={4} decay={1.6} />
			</group>
		);
	} else if (a.tipo === 'cuadro' || a.tipo === 'mapa') {
		cuerpo = (
			<group position={[0, 1.65, 0]} scale={k}>
				<Caja p={[0, 0, 0]} s={[0.9, 0.65, 0.04]} c="#6a4a1e" m={0.4} r={0.5} />
				<mesh position={[0, 0, 0.022]}>
					<planeGeometry args={[0.78, 0.53]} />
					<Mat c={a.color ?? (a.tipo === 'mapa' ? '#c9b48a' : '#3a4a3a')} r={0.9} />
				</mesh>
			</group>
		);
	} else if (a.tipo === 'barril') {
		cuerpo = (
			<mesh position={[0, 0.45 * k, 0]}>
				<cylinderGeometry args={[0.3 * k, 0.3 * k, 0.9 * k, 20]} />
				<Mat c={col} />
			</mesh>
		);
	} else if (a.tipo === 'caja') {
		cuerpo = <Caja p={[0, 0.3 * k, 0]} s={[0.6 * k, 0.6 * k, 0.6 * k]} c={col} rot={[0, hash((a.x ?? 0) * 7) * 0.6, 0]} />;
	} else if (a.tipo === 'alfombra') {
		cuerpo = (
			<mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[2.6 * k, 1.7 * k]} />
				<Mat c={col} r={1} />
			</mesh>
		);
	} else if (a.tipo === 'chimenea') {
		const f = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 4.3);
		cuerpo = (
			<group>
				<Caja p={[0, 0.6, 0]} s={[1.6, 1.2, 0.5]} c="#4a3c34" r={0.95} />
				<Caja p={[0, 0.45, 0.06]} s={[0.9, 0.75, 0.42]} c="#0d0806" />
				<Caja p={[0, 1.25, 0.05]} s={[1.8, 0.1, 0.6]} c="#2a1a10" />
				<mesh position={[0, 0.3, 0.12]} scale={[1, f, 1]}>
					<coneGeometry args={[0.22, 0.45, 10]} />
					<meshBasicMaterial color="#ff9a3c" toneMapped={false} />
				</mesh>
				<pointLight position={[0, 0.5, 0.6]} color="#ff8a3c" intensity={4 * f} distance={6} decay={1.5} />
			</group>
		);
	} else if (a.tipo === 'tuberia') {
		cuerpo = (
			<group>
				{[0.4, 2.3].map((y) => (
					<mesh key={y} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
						<cylinderGeometry args={[0.07, 0.07, 3.2 * k, 14]} />
						<Mat c={col} m={0.7} r={0.45} />
					</mesh>
				))}
				<mesh position={[1.5 * k, 1.35, 0]}>
					<cylinderGeometry args={[0.07, 0.07, 1.9, 14]} />
					<Mat c={col} m={0.7} r={0.45} />
				</mesh>
				<mesh position={[1.5 * k, 1.35, 0.1]} rotation={[Math.PI / 2, t * 0.4, 0]}>
					<torusGeometry args={[0.14, 0.025, 8, 20]} />
					<Mat c="#a03a2a" m={0.4} />
				</mesh>
			</group>
		);
	} else if (a.tipo === 'banco') {
		cuerpo = (
			<group>
				<Caja p={[0, 0.85, 0]} s={[1.8, 0.07, 0.7]} c={col} />
				<Caja p={[-0.8, 0.42, 0]} s={[0.08, 0.84, 0.6]} c={col} />
				<Caja p={[0.8, 0.42, 0]} s={[0.08, 0.84, 0.6]} c={col} />
				{[0, 1, 2].map((i) => <Caja key={i} p={[-0.5 + i * 0.4, 0.92, 0.05]} s={[0.18, 0.08 + i * 0.03, 0.14]} c="#7a6a4a" m={0.6} r={0.4} />)}
			</group>
		);
	} else if (a.tipo === 'lampara_pie') {
		cuerpo = (
			<group>
				<mesh position={[0, 0.8, 0]}>
					<cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
					<Mat c="#2a2a2a" m={0.6} />
				</mesh>
				<mesh position={[0, 1.65, 0]}>
					<coneGeometry args={[0.25, 0.3, 16, 1, true]} />
					<Mat c={col} e="#ffcf8a" ei={0.6} />
				</mesh>
				<pointLight position={[0, 1.5, 0]} color="#ffcf8a" intensity={1.8} distance={4} decay={1.6} />
			</group>
		);
	}
	return (
		<group position={pos} rotation={[0, rotY, 0]}>
			{cuerpo}
		</group>
	);
};

const PuertaSalida: React.FC<{s: Sala; abre: number}> = ({s, abre}) => (
	<group position={[0, 0, -s.fondo / 2 + 0.06]}>
		<Caja p={[0, 1.15, 0]} s={[1.3, 2.4, 0.1]} c="#1a120c" />
		<group position={[-0.55, 0, 0.06]} rotation={[0, -abre * 1.1, 0]}>
			<Caja p={[0.55, 1.1, 0]} s={[1.1, 2.2, 0.07]} c="#4a2c18" />
			<mesh position={[0.95, 1.05, 0.06]}>
				<sphereGeometry args={[0.045, 12, 10]} />
				<Mat c="#c9a24a" m={0.85} r={0.3} />
			</mesh>
		</group>
		{abre > 0.01 && <pointLight position={[0, 1.2, -0.6]} color="#fff2d0" intensity={5 * abre} distance={5} decay={1.4} />}
	</group>
);

export const SalaCorto3D: React.FC<{s: Sala; e: EstadoSalaCorto; ancho?: number; alto?: number; escala?: number}> = ({s, e, ancho = 720, alto = 1280, escala = 1080 / 720}) => {
	const T = useMemo(
		() => ({
			pared: texPared(s.pared, [Math.max(1, Math.round(s.ancho / 2.5)), Math.max(1, Math.round(s.alto / 2.5))]),
			paredL: texPared(s.pared, [Math.max(1, Math.round(s.fondo / 2.5)), Math.max(1, Math.round(s.alto / 2.5))]),
			suelo: texSuelo(s.suelo, [Math.max(1, Math.round(s.ancho / 1.5)), Math.max(1, Math.round(s.fondo / 1.5))]),
		}),
		[s],
	);
	const {t} = e;
	const c = centroPuzle(s);
	const foco = useMemo(() => new THREE.Object3D(), []);
	foco.position.set(c[0], c[1], c[2]);
	foco.updateMatrixWorld();
	const parpadeo = 0.9 + 0.1 * Math.sin(t * 15) * Math.sin(t * 4.7);
	const L = s.luz;
	return (
		<ThreeCanvas width={ancho} height={alto} style={{position: 'absolute', left: 0, top: 0, transform: `scale(${escala})`, transformOrigin: '0 0'}} camera={{fov: 60, position: [0, 1.6, 3]}} gl={{antialias: true}}>
			<Camara c={e.cam} />
			<color attach="background" args={[s.niebla]} />
			<fogExp2 attach="fog" args={[s.niebla, 0.05]} />
			<hemisphereLight args={[L.color, '#0a0807', 1.0 * L.intensidad]} />
			<pointLight position={[e.cam.pos[0], e.cam.pos[1] + 0.2, e.cam.pos[2]]} color="#ffe2c0" intensity={0.8} distance={4} decay={1.7} />
			{/* luz principal de la sala */}
			{L.tipo === 'lampara' && (
				<group position={[Math.sin(t * 0.7) * 0.08, s.alto - 0.6, 0.2]}>
					<mesh>
						<coneGeometry args={[0.3, 0.25, 18, 1, true]} />
						<Mat c="#2e3a2e" m={0.5} e={L.color} ei={0.3} />
					</mesh>
					<mesh position={[0, -0.1, 0]}>
						<sphereGeometry args={[0.07, 12, 10]} />
						<meshBasicMaterial color={L.color} toneMapped={false} />
					</mesh>
					<Caja p={[0, (0.6) / 2 + 0.1, 0]} s={[0.012, 0.6, 0.012]} c="#111" />
					<pointLight position={[0, -0.15, 0]} color={L.color} intensity={5 * L.intensidad * parpadeo} distance={8} decay={1.5} />
				</group>
			)}
			{L.tipo === 'fluorescente' && (
				<group position={[0, s.alto - 0.05, 0]}>
					<Caja p={[0, 0, 0]} s={[1.6, 0.06, 0.18]} c="#dfe8ea" />
					<pointLight position={[0, -0.4, 0]} color={L.color} intensity={3 * L.intensidad} distance={8} decay={1.4} />
				</group>
			)}
			{(L.tipo === 'velas' || L.tipo === 'chimenea' || L.tipo === 'luna') && (
				<pointLight position={[0, s.alto * 0.7, 0.5]} color={L.color} intensity={2.4 * L.intensidad * (L.tipo === 'luna' ? 1 : parpadeo)} distance={9} decay={1.5} />
			)}
			{L.tipo === 'velas' &&
				[[-0.35, 0.25], [0.4, 0.5]].map(([x, z], i) => {
					const y0 = s.puzle_en === 'mesa' ? MESA_ALTO + 0.04 : 0;
					return (
						<group key={i} position={[x * 2.2, y0, c[2] - 0.75 + z * 0.2]}>
							<mesh position={[0, 0.12, 0]}>
								<cylinderGeometry args={[0.035, 0.038, 0.24, 12]} />
								<Mat c="#efe6cf" e="#ffcf8a" ei={0.3} />
							</mesh>
							<mesh position={[0, 0.27, 0]} scale={[1, parpadeo, 1]}>
								<coneGeometry args={[0.018, 0.07, 8]} />
								<meshBasicMaterial color="#ffd27a" toneMapped={false} />
							</mesh>
							<pointLight position={[0, 0.35, 0]} color="#ffbf6a" intensity={1.6 * parpadeo} distance={3} decay={1.6} />
						</group>
					);
				})}
			{e.foco > 0.01 && <spotLight position={[c[0], c[1] + 3.2, c[2] + 0.8]} target={foco} color="#fff0d8" intensity={8 * e.foco} angle={0.42} penumbra={0.6} distance={8} decay={1.3} />}

			{/* caja de la habitación */}
			<mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[s.ancho, s.fondo]} />
				<meshStandardMaterial map={T.suelo} roughness={0.85} />
			</mesh>
			<mesh position={[0, s.alto, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<planeGeometry args={[s.ancho, s.fondo]} />
				<Mat c={s.techo} r={0.95} />
			</mesh>
			{([['N', [0, s.alto / 2, -s.fondo / 2], 0, s.ancho], ['S', [0, s.alto / 2, s.fondo / 2], Math.PI, s.ancho], ['E', [s.ancho / 2, s.alto / 2, 0], -Math.PI / 2, s.fondo], ['O', [-s.ancho / 2, s.alto / 2, 0], Math.PI / 2, s.fondo]] as [string, V3, number, number][]).map(([k, p, r, w]) => (
				<mesh key={k} position={p} rotation={[0, r, 0]}>
					<planeGeometry args={[w, s.alto]} />
					<meshStandardMaterial map={k === 'N' || k === 'S' ? T.pared : T.paredL} roughness={0.9} />
				</mesh>
			))}
			{/* zócalo */}
			{([[0, -s.fondo / 2 + 0.02, s.ancho, 0], [0, s.fondo / 2 - 0.02, s.ancho, 0], [s.ancho / 2 - 0.02, 0, s.fondo, 1], [-s.ancho / 2 + 0.02, 0, s.fondo, 1]] as number[][]).map(([x, z, w, giro], i) => (
				<Caja key={i} p={[x, 0.08, z]} s={giro ? [0.04, 0.16, w] : [w, 0.16, 0.04]} c="#1a120c" />
			))}

			{s.puzle_en === 'mesa' && (
				<group position={[0, 0, c[2]]}>
					<Caja p={[0, MESA_ALTO, 0]} s={[2.3, 0.07, 1.15]} c={s.mesa?.color ?? '#4a2e1a'} />
					{[[-1.05, -0.48], [1.05, -0.48], [-1.05, 0.48], [1.05, 0.48]].map(([x, z]) => <Caja key={`${x}${z}`} p={[x, MESA_ALTO / 2, z]} s={[0.08, MESA_ALTO, 0.08]} c={s.mesa?.color ?? '#4a2e1a'} />)}
				</group>
			)}
			{s.atrezo.map((a, i) => <Pieza key={i} s={s} a={a} t={t} />)}
			<PuertaSalida s={s} abre={e.puerta} />
			{e.cerillas && <Cerillas3D c={{...e.cerillas, centro: c}} />}
			{e.engranajes && <Engranajes3D c={{...e.engranajes, centro: c}} />}
		</ThreeCanvas>
	);
};
