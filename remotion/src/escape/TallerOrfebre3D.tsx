import React, {useEffect, useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Camara, hash, tex} from '../diorama/SalaLastre3D';

// ENIGMA 60 · Acertijo 19/11 «El taller del orfebre». Habitación propia (no la torre): taller de orfebre
// con mesa de trabajo, balanza de latón con llaves, monedas y pesa físicas, pizarra de tiza y caja fuerte
// de rueda. Procedural (three.js MIT); texturas dibujadas en canvas, propias. Todo depende solo del estado.

export type V3 = [number, number, number];
/** Paleta única (la usan escena y textos). */
export const COLOR = {oro: '#d9a93a', hierro: '#8d939c', laton: '#b88a3e', tiza: '#efe9da'} as const;
export const MASA = {llave: 30, moneda: 20, pesa: 50};

export const MESA_Y = 0.9;
export const PIVOTE: V3 = [0, 1.55, -1.95];
export const BRAZO = 0.5;
const CUELGA = 0.36; // de la punta del brazo al plato
export const PIZARRA: V3 = [-0.1, 2.32, -2.94];
export const CAJA: V3 = [1.45, 1.25, -2.7];
export const BANDEJA: V3 = [-0.92, MESA_Y, -1.7];
export const LAMPARA: V3 = [-1.0, MESA_Y, -2.25];

export type Pieza = {tipo: 'llave' | 'moneda' | 'pesa'; casa: V3; plato: -1 | 0 | 1; s: number; desde: -1 | 0 | 1};
export type EstadoTaller = {
	t: number;
	cam: {pos: V3; mira: V3; fov: number};
	/** 7 piezas: K1, K2, C1, C2, C3, P. `desde`→`plato` con avance `s` (0..1). plato −1 izq., 1 der., 0 bandeja. */
	piezas: Pieza[];
	pizarra: {lineas: string[]; resaltar: number; avance: number}; // avance: caracteres visibles de la última línea (0..1)
	dial: number; // número que marca la rueda (0..20)
	puertaCaja: number; // 0 cerrada … 1 abierta
	foco: number; // luz cálida de pista sobre la balanza
	focoCaja: number;
	lampara: number;
	puerta: number; // golpe de la puerta del taller (intro)
};

// ---------- posición de piezas ----------
const panPos = (lado: -1 | 1, ang: number): V3 => [PIVOTE[0] + lado * BRAZO * Math.cos(ang), PIVOTE[1] - lado * BRAZO * Math.sin(ang) - CUELGA, PIVOTE[2]];
/** Desplazamiento de cada pieza dentro de su plato (para que no se amontonen). */
const huecoPlato = (i: number, n: number, tipo: Pieza['tipo']): V3 => {
	if (tipo === 'pesa') return [0, 0.075, 0];
	const off = (i - (n - 1) / 2) * 0.09;
	return tipo === 'llave' ? [0, 0.03 + i * 0.03, off] : [0.03 * Math.sin(i * 2.1), 0.022 + i * 0.019, 0.03 * Math.cos(i * 2.1)];
};
const donde = (p: Pieza, plato: -1 | 0 | 1, ang: number, idx: number, n: number): V3 => {
	if (plato === 0) return p.casa;
	const b = panPos(plato, ang);
	const h = huecoPlato(idx, n, p.tipo);
	return [b[0] + h[0], b[1] + h[1], b[2] + h[2]];
};

/** Ángulo del brazo a partir de las masas que ya han llegado a cada plato (positivo: baja el izquierdo). */
export const anguloBalanza = (piezas: Pieza[], t: number) => {
	let izq = 0;
	let der = 0;
	for (const p of piezas) {
		const llegada = Math.min(1, Math.max(0, (p.s - 0.8) / 0.2));
		const m = MASA[p.tipo];
		const w = (lado: number) => (lado === -1 ? [m, 0] : lado === 1 ? [0, m] : [0, 0]);
		const [a1, b1] = w(p.desde);
		const [a2, b2] = w(p.plato);
		izq += a1 * (1 - llegada) + a2 * llegada;
		der += b1 * (1 - llegada) + b2 * llegada;
	}
	const d = izq - der;
	const base = 0.22 * Math.tanh(d / 35);
	return base + 0.012 * Math.sin(t * 2.3) * Math.exp(-Math.abs(d) / 20) * (izq + der > 0 ? 1 : 0);
};

const colocar = (piezas: Pieza[], ang: number) => {
	const cuenta = (plato: number, tipo: string) => piezas.filter((p) => p.plato === plato && p.tipo === tipo);
	const cuentaD = (plato: number, tipo: string) => piezas.filter((p) => p.desde === plato && p.tipo === tipo);
	return piezas.map((p) => {
		const lista = cuenta(p.plato, p.tipo);
		const listaD = cuentaD(p.desde, p.tipo);
		const a = donde(p, p.desde, ang, listaD.indexOf(p), listaD.length);
		const b = donde(p, p.plato, ang, lista.indexOf(p), lista.length);
		const s = p.s * p.s * (3 - 2 * p.s);
		const arco = Math.sin(Math.PI * s) * 0.22;
		return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s + arco, a[2] + (b[2] - a[2]) * s] as V3;
	});
};

// ---------- texturas ----------
const ruido = (c: CanvasRenderingContext2D, w: number, h: number, a: number, seed: number) => {
	const img = c.getImageData(0, 0, w, h);
	for (let i = 0; i < w * h; i++) {
		const n = (hash(i * 0.613 + seed) - 0.5) * a;
		for (let k = 0; k < 3; k++) img.data[i * 4 + k] = Math.max(0, Math.min(255, img.data[i * 4 + k] + n));
	}
	c.putImageData(img, 0, 0);
};

const useTexTaller = () =>
	useMemo(() => {
		const ladrillo = tex(
			512,
			512,
			(c) => {
				c.fillStyle = '#3a2418';
				c.fillRect(0, 0, 512, 512);
				const filas = 10;
				const hF = 512 / filas;
				for (let f = 0; f < filas; f++) {
					for (let k = -1; k < 5; k++) {
						const x = k * 128 + (f % 2 ? 64 : 0);
						const g = hash(f * 17 + k * 5);
						c.fillStyle = `rgb(${120 + g * 40},${62 + g * 22},${40 + g * 14})`;
						c.fillRect(x + 3, f * hF + 3, 122, hF - 6);
					}
				}
				ruido(c, 512, 512, 26, 1);
			},
			[3, 2],
		);
		const tablas = tex(
			512,
			512,
			(c) => {
				for (let i = 0; i < 6; i++) {
					const g = 70 + hash(i * 3.1) * 25;
					c.fillStyle = `rgb(${g + 30},${g + 12},${g - 12})`;
					c.fillRect(0, i * 86, 512, 86);
					c.fillStyle = 'rgba(15,8,3,0.7)';
					c.fillRect(0, i * 86 + 83, 512, 3);
					c.strokeStyle = 'rgba(30,15,5,0.25)';
					for (let v = 0; v < 7; v++) {
						c.beginPath();
						const y0 = i * 86 + 8 + v * 11;
						c.moveTo(0, y0);
						c.bezierCurveTo(170, y0 + 5, 340, y0 - 5, 512, y0 + 2);
						c.stroke();
					}
				}
				ruido(c, 512, 512, 14, 2);
			},
			[2, 3],
		);
		const mesa = tex(512, 256, (c) => {
			c.fillStyle = '#5a3a22';
			c.fillRect(0, 0, 512, 256);
			c.strokeStyle = 'rgba(25,12,4,0.35)';
			for (let v = 0; v < 26; v++) {
				c.beginPath();
				c.moveTo(0, v * 10);
				c.bezierCurveTo(170, v * 10 + 6, 340, v * 10 - 6, 512, v * 10 + 3);
				c.stroke();
			}
			// marcas de trabajo
			c.strokeStyle = 'rgba(15,8,3,0.4)';
			for (let i = 0; i < 14; i++) {
				const x = hash(i * 7) * 512;
				const y = hash(i * 11) * 256;
				c.beginPath();
				c.moveTo(x, y);
				c.lineTo(x + 20 + hash(i) * 30, y + 4 - hash(i * 3) * 8);
				c.stroke();
			}
			ruido(c, 512, 256, 12, 3);
		});
		const pesa = tex(512, 64, (c) => {
			c.fillStyle = COLOR.laton;
			c.fillRect(0, 0, 512, 64);
			c.fillStyle = '#2a1a08';
			c.font = 'bold 30px serif';
			c.textAlign = 'center';
			c.textBaseline = 'middle';
			for (let k = 0; k < 5; k++) c.fillText('50 g', 51 + k * 102.4, 34);
		});
		const nota = tex(256, 160, (c) => {
			c.fillStyle = '#e6d8b4';
			c.fillRect(0, 0, 256, 160);
			c.fillStyle = '#3a2a18';
			c.font = '22px serif';
			c.textAlign = 'center';
			c.fillText('Se abre con el peso,', 128, 52);
			c.fillText('en gramos,', 128, 84);
			c.fillText('de UNA moneda.', 128, 116);
			ruido(c, 256, 160, 16, 4);
		});
		return {ladrillo, tablas, mesa, pesa, nota};
	}, []);

// ---------- piezas ----------
const Llave: React.FC<{pos: V3; rot: number}> = ({pos, rot}) => (
	<group position={pos} rotation={[Math.PI / 2, 0, rot]} scale={1.9}>
		<mesh position={[-0.055, 0, 0]}>
			<torusGeometry args={[0.028, 0.009, 10, 24]} />
			<meshStandardMaterial color={COLOR.hierro} metalness={0.8} roughness={0.35} />
		</mesh>
		<mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
			<cylinderGeometry args={[0.007, 0.007, 0.1, 10]} />
			<meshStandardMaterial color={COLOR.hierro} metalness={0.8} roughness={0.35} />
		</mesh>
		<mesh position={[0.06, -0.016, 0]}>
			<boxGeometry args={[0.022, 0.026, 0.008]} />
			<meshStandardMaterial color={COLOR.hierro} metalness={0.8} roughness={0.35} />
		</mesh>
	</group>
);
const Moneda: React.FC<{pos: V3}> = ({pos}) => (
	<mesh position={pos}>
		<cylinderGeometry args={[0.06, 0.06, 0.016, 32]} />
		<meshStandardMaterial color={COLOR.oro} metalness={0.95} roughness={0.22} emissive={COLOR.oro} emissiveIntensity={0.18} />
	</mesh>
);
const Pesa: React.FC<{pos: V3; T: ReturnType<typeof useTexTaller>}> = ({pos, T}) => (
	<group position={[pos[0], pos[1] - 0.06, pos[2]]} scale={1.35}>
		<mesh position={[0, 0.045, 0]}>
			<cylinderGeometry args={[0.05, 0.055, 0.09, 32]} />
			<meshStandardMaterial map={T.pesa} metalness={0.7} roughness={0.3} />
		</mesh>
		<mesh position={[0, 0.105, 0]}>
			<sphereGeometry args={[0.022, 16, 12]} />
			<meshStandardMaterial color={COLOR.laton} metalness={0.8} roughness={0.3} />
		</mesh>
	</group>
);

const Plato: React.FC<{punta: V3}> = ({punta}) => {
	const fondo: V3 = [punta[0], punta[1] - CUELGA, punta[2]];
	const cuerdas = [0, 1, 2].map((k) => {
		const a = (k / 3) * Math.PI * 2;
		const b: V3 = [fondo[0] + Math.cos(a) * 0.15, fondo[1] + 0.01, fondo[2] + Math.sin(a) * 0.15];
		const mid: V3 = [(punta[0] + b[0]) / 2, (punta[1] + b[1]) / 2, (punta[2] + b[2]) / 2];
		const dir = new THREE.Vector3(b[0] - punta[0], b[1] - punta[1], b[2] - punta[2]);
		const len = dir.length();
		const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
		return {mid, len, q};
	});
	return (
		<group>
			{cuerdas.map((c, i) => (
				<mesh key={i} position={c.mid} quaternion={c.q}>
					<cylinderGeometry args={[0.003, 0.003, c.len, 6]} />
					<meshStandardMaterial color={COLOR.laton} metalness={0.8} roughness={0.35} />
				</mesh>
			))}
			<mesh position={fondo}>
				<cylinderGeometry args={[0.18, 0.13, 0.025, 40]} />
				<meshStandardMaterial color={COLOR.laton} metalness={0.85} roughness={0.28} />
			</mesh>
		</group>
	);
};

const Balanza: React.FC<{ang: number}> = ({ang}) => {
	const pIzq: V3 = [PIVOTE[0] - BRAZO * Math.cos(ang), PIVOTE[1] + BRAZO * Math.sin(ang), PIVOTE[2]];
	const pDer: V3 = [PIVOTE[0] + BRAZO * Math.cos(ang), PIVOTE[1] - BRAZO * Math.sin(ang), PIVOTE[2]];
	const mat = <meshStandardMaterial color={COLOR.laton} metalness={0.85} roughness={0.28} />;
	return (
		<group>
			<mesh position={[PIVOTE[0], MESA_Y + 0.02, PIVOTE[2]]}>
				<cylinderGeometry args={[0.16, 0.19, 0.04, 40]} />
				{mat}
			</mesh>
			<mesh position={[PIVOTE[0], (MESA_Y + PIVOTE[1]) / 2, PIVOTE[2]]}>
				<cylinderGeometry args={[0.018, 0.024, PIVOTE[1] - MESA_Y, 16]} />
				{mat}
			</mesh>
			<mesh position={PIVOTE} rotation={[0, 0, -ang]}>
				<boxGeometry args={[BRAZO * 2 + 0.04, 0.022, 0.03]} />
				{mat}
			</mesh>
			<mesh position={[PIVOTE[0], PIVOTE[1] + 0.07, PIVOTE[2]]} rotation={[0, 0, -ang]}>
				<coneGeometry args={[0.012, 0.13, 10]} />
				{mat}
			</mesh>
			<mesh position={PIVOTE}>
				<sphereGeometry args={[0.03, 16, 12]} />
				{mat}
			</mesh>
			<Plato punta={pIzq} />
			<Plato punta={pDer} />
		</group>
	);
};

const Pizarra: React.FC<{p: EstadoTaller['pizarra']}> = ({p}) => {
	const clave = JSON.stringify(p) + (typeof document !== 'undefined' ? document.fonts.status : '');
	const t = useMemo(
		() =>
			tex(1024, 640, (c) => {
				c.fillStyle = '#1f2a24';
				c.fillRect(0, 0, 1024, 640);
				ruido(c, 1024, 640, 18, 5);
				// restos de tiza borrada
				c.fillStyle = 'rgba(230,225,210,0.05)';
				for (let i = 0; i < 9; i++) c.fillRect(hash(i * 3) * 900, hash(i * 7) * 560, 120 + hash(i) * 200, 26);
				c.font = "64px 'Architects Daughter', cursive";
				c.textBaseline = 'top';
				c.shadowColor = 'rgba(255,255,240,0.35)';
				c.shadowBlur = 6;
				p.lineas.forEach((l, i) => {
					const ultima = i === p.lineas.length - 1;
					const txt = ultima ? l.slice(0, Math.round(l.length * p.avance)) : l;
					c.fillStyle = i === p.resaltar ? '#ffd27a' : COLOR.tiza;
					c.fillText(txt, 50, 34 + i * 116);
				});
			}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[clave],
	);
	useEffect(() => () => t.dispose(), [t]);
	return (
		<group position={PIZARRA}>
			<mesh position={[0, 0, -0.02]}>
				<boxGeometry args={[1.62, 1.04, 0.04]} />
				<meshStandardMaterial color="#4a2e18" roughness={0.8} />
			</mesh>
			<mesh>
				<planeGeometry args={[1.5, 0.94]} />
				<meshStandardMaterial map={t} roughness={0.95} emissive="#ffffff" emissiveMap={t} emissiveIntensity={0.45} />
			</mesh>
		</group>
	);
};

const CajaFuerte: React.FC<{e: EstadoTaller; T: ReturnType<typeof useTexTaller>}> = ({e, T}) => {
	const n = Math.round(e.dial);
	const ventana = useMemo(
		() =>
			tex(128, 96, (c) => {
				c.fillStyle = '#0d0b08';
				c.fillRect(0, 0, 128, 96);
				c.fillStyle = '#ffe2a8';
				c.font = "bold 64px 'IBM Plex Mono', monospace";
				c.textAlign = 'center';
				c.textBaseline = 'middle';
				c.fillText(String(n).padStart(2, '0'), 64, 52);
			}),
		[n],
	);
	useEffect(() => () => ventana.dispose(), [ventana]);
	const giro = -e.puertaCaja * 1.9;
	return (
		<group position={CAJA}>
			{/* cuerpo */}
			<mesh position={[0, 0, -0.27]}>
				<boxGeometry args={[0.8, 0.8, 0.26]} />
				<meshStandardMaterial color="#2c3034" metalness={0.6} roughness={0.45} />
			</mesh>
			{([[0, 0.365, 0.8, 0.07], [0, -0.365, 0.8, 0.07], [-0.365, 0, 0.07, 0.8], [0.365, 0, 0.07, 0.8]] as const).map(([x, y, w, h], i) => (
				<mesh key={i} position={[x, y, -0.07]}>
					<boxGeometry args={[w, h, 0.14]} />
					<meshStandardMaterial color="#2c3034" metalness={0.6} roughness={0.45} />
				</mesh>
			))}
			{/* interior iluminado */}
			<mesh position={[0, 0, -0.135]}>
				<planeGeometry args={[0.66, 0.66]} />
				<meshStandardMaterial color="#1a1208" emissive="#7a3f0e" emissiveIntensity={0.8 * e.puertaCaja} />
			</mesh>
			{/* dentro: la llave maestra del taller */}
			<group position={[0, -0.05, -0.08]} rotation={[0, 0, 0.3]} scale={2.2}>
				<mesh position={[-0.05, 0, 0]}>
					<torusGeometry args={[0.03, 0.01, 12, 28]} />
					<meshStandardMaterial color={COLOR.oro} metalness={0.95} roughness={0.2} emissive={COLOR.oro} emissiveIntensity={0.4 * e.puertaCaja} />
				</mesh>
				<mesh position={[0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
					<cylinderGeometry args={[0.008, 0.008, 0.11, 10]} />
					<meshStandardMaterial color={COLOR.oro} metalness={0.95} roughness={0.2} emissive={COLOR.oro} emissiveIntensity={0.4 * e.puertaCaja} />
				</mesh>
			</group>
			{e.puertaCaja > 0.01 && <pointLight position={[0, 0.1, 0.15]} color="#ffb347" intensity={1.6 * e.puertaCaja} distance={1.5} decay={1.6} />}
			{/* puerta con bisagra a la izquierda */}
			<group position={[-0.37, 0, 0.01]} rotation={[0, giro, 0]}>
				<mesh position={[0.37, 0, 0.03]}>
					<boxGeometry args={[0.74, 0.74, 0.06]} />
					<meshStandardMaterial color="#353a40" metalness={0.65} roughness={0.38} />
				</mesh>
				<mesh position={[0.37, 0.02, 0.07]} rotation={[Math.PI / 2, (e.dial / 40) * Math.PI * 2, 0]}>
					<cylinderGeometry args={[0.13, 0.13, 0.04, 40]} />
					<meshStandardMaterial color={COLOR.laton} metalness={0.85} roughness={0.25} />
				</mesh>
				<mesh position={[0.37, 0.24, 0.065]}>
					<planeGeometry args={[0.16, 0.12]} />
					<meshBasicMaterial map={ventana} toneMapped={false} />
				</mesh>
				<mesh position={[0.62, -0.05, 0.08]}>
					<boxGeometry args={[0.03, 0.18, 0.03]} />
					<meshStandardMaterial color={COLOR.laton} metalness={0.85} roughness={0.25} />
				</mesh>
			</group>
			{/* nota del orfebre */}
			<mesh position={[0, -0.56, 0.0]} rotation={[0, 0, 0.04]}>
				<planeGeometry args={[0.42, 0.26]} />
				<meshStandardMaterial map={T.nota} roughness={0.9} />
			</mesh>
		</group>
	);
};

const Lampara: React.FC<{luz: number; t: number}> = ({luz, t}) => {
	const fl = 1 + 0.08 * Math.sin(t * 11) + 0.05 * Math.sin(t * 23 + 1);
	return (
		<group position={LAMPARA}>
			<mesh position={[0, 0.06, 0]}>
				<cylinderGeometry args={[0.07, 0.09, 0.12, 20]} />
				<meshStandardMaterial color={COLOR.laton} metalness={0.8} roughness={0.3} />
			</mesh>
			<mesh position={[0, 0.2, 0]}>
				<sphereGeometry args={[0.07, 20, 16]} />
				<meshStandardMaterial color="#fff2d0" emissive="#ffb347" emissiveIntensity={2.2 * luz * fl} transparent opacity={0.85} />
			</mesh>
			<pointLight position={[0, 0.25, 0]} color="#ffbe6a" intensity={3.2 * luz * fl} distance={5} decay={1.6} />
		</group>
	);
};

export const TallerOrfebre3D: React.FC<{e: EstadoTaller; ancho: number; alto: number; escala: number}> = ({e, ancho, alto, escala}) => {
	const T = useTexTaller();
	const ang = anguloBalanza(e.piezas, e.t);
	const pos = colocar(e.piezas, ang);
	const focoB = useMemo(() => new THREE.Object3D(), []);
	focoB.position.set(PIVOTE[0], MESA_Y + 0.25, PIVOTE[2]);
	focoB.updateMatrixWorld();
	const focoC = useMemo(() => new THREE.Object3D(), []);
	focoC.position.set(...CAJA);
	focoC.updateMatrixWorld();
	return (
		<ThreeCanvas width={ancho} height={alto} style={{position: 'absolute', left: 0, top: 0, transform: `scale(${escala})`, transformOrigin: '0 0'}} camera={{fov: 50, position: [0, 1.6, 2]}} gl={{antialias: true}}>
			<Camara c={e.cam} />
			<color attach="background" args={['#0b0705']} />
			<fogExp2 attach="fog" args={['#0d0805', 0.06]} />
			<hemisphereLight args={['#8a6a4a', '#140c06', 0.75]} />
			<pointLight position={[0, 3.1, 0.2]} color="#ffd9a8" intensity={1.4} distance={7} decay={1.5} />
			<pointLight position={[-0.2, 2.6, -1.4]} color="#ffcf8a" intensity={1.4} distance={4} decay={1.6} />
			{e.foco > 0.01 && <spotLight position={[0.2, 3.2, 0.1]} target={focoB} color="#fff1dc" intensity={14 * e.foco} angle={0.34} penumbra={0.5} distance={8} decay={1.2} />}
			{e.focoCaja > 0.01 && <spotLight position={[0.6, 3.1, -1.0]} target={focoC} color="#fff1dc" intensity={10 * e.focoCaja} angle={0.32} penumbra={0.5} distance={8} decay={1.2} />}
			{/* sala: 5,2 × 3,4 m */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.6]}>
				<planeGeometry args={[5.2, 5.4]} />
				<meshStandardMaterial map={T.tablas} roughness={0.85} />
			</mesh>
			<mesh position={[0, 1.7, -3]}>
				<planeGeometry args={[5.2, 3.4]} />
				<meshStandardMaterial map={T.ladrillo} roughness={0.9} />
			</mesh>
			<mesh position={[-2.6, 1.7, -0.6]} rotation={[0, Math.PI / 2, 0]}>
				<planeGeometry args={[5.4, 3.4]} />
				<meshStandardMaterial map={T.ladrillo} roughness={0.9} />
			</mesh>
			<mesh position={[2.6, 1.7, -0.6]} rotation={[0, -Math.PI / 2, 0]}>
				<planeGeometry args={[5.4, 3.4]} />
				<meshStandardMaterial map={T.ladrillo} roughness={0.9} />
			</mesh>
			<mesh position={[0, 3.4, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
				<planeGeometry args={[5.2, 5.4]} />
				<meshStandardMaterial color="#1a100a" roughness={1} />
			</mesh>
			{/* vigas del techo */}
			{[-1.6, -0.2, 1.2].map((z) => (
				<mesh key={z} position={[0, 3.3, z]}>
					<boxGeometry args={[5.2, 0.16, 0.18]} />
					<meshStandardMaterial color="#2e1c10" roughness={0.9} />
				</mesh>
			))}
			{/* estanterías laterales con frascos y herramientas */}
			{[-1, 1].map((lado) => (
				<group key={lado} position={[lado * 2.45, 0, -1.6]}>
					{[0.8, 1.35, 1.9].map((y) => (
						<mesh key={y} position={[0, y, 0]}>
							<boxGeometry args={[0.28, 0.04, 1.6]} />
							<meshStandardMaterial color="#3d2716" roughness={0.85} />
						</mesh>
					))}
					{Array.from({length: 9}, (_, i) => (
						<mesh key={i} position={[0, [0.8, 1.35, 1.9][i % 3] + 0.1, -0.6 + Math.floor(i / 3) * 0.5 + hash(i + lado) * 0.1]}>
							<cylinderGeometry args={[0.05, 0.05, 0.16 + hash(i * 3 + lado) * 0.08, 12]} />
							<meshStandardMaterial color={['#4a6a5a', '#6a4a2a', '#5a5a6a'][i % 3]} roughness={0.4} metalness={0.2} />
						</mesh>
					))}
				</group>
			))}
			{/* mesa de trabajo */}
			<mesh position={[0, MESA_Y - 0.04, -1.9]}>
				<boxGeometry args={[2.6, 0.08, 1.0]} />
				<meshStandardMaterial map={T.mesa} roughness={0.75} />
			</mesh>
			{[
				[-1.2, -1.5],
				[1.2, -1.5],
				[-1.2, -2.3],
				[1.2, -2.3],
			].map(([x, z]) => (
				<mesh key={`${x}${z}`} position={[x, (MESA_Y - 0.08) / 2, z]}>
					<boxGeometry args={[0.09, MESA_Y - 0.08, 0.09]} />
					<meshStandardMaterial color="#3a2414" roughness={0.85} />
				</mesh>
			))}
			{/* bandeja de fieltro */}
			<mesh position={[BANDEJA[0], MESA_Y + 0.006, BANDEJA[2]]}>
				<boxGeometry args={[0.5, 0.012, 0.36]} />
				<meshStandardMaterial color="#5a1f22" roughness={1} />
			</mesh>
			<Balanza ang={ang} />
			{e.piezas.map((p, i) =>
				p.tipo === 'llave' ? <Llave key={i} pos={pos[i]} rot={0.2 + i * 0.3} /> : p.tipo === 'moneda' ? <Moneda key={i} pos={pos[i]} /> : <Pesa key={i} pos={pos[i]} T={T} />,
			)}
			<Lampara luz={e.lampara} t={e.t} />
			<Pizarra p={e.pizarra} />
			<CajaFuerte e={e} T={T} />
			{/* puerta del taller a la izquierda */}
			<mesh position={[-2.58, 1.05, 0.9]} rotation={[0, Math.PI / 2 - 0.25 * e.puerta, 0]}>
				<boxGeometry args={[0.95, 2.1, 0.06]} />
				<meshStandardMaterial color="#3b2412" roughness={0.8} />
			</mesh>
		</ThreeCanvas>
	);
};
