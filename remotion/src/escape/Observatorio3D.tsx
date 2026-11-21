import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex} from '../diorama/SalaLastre3D';
import {EstadoSalaCorto, MESA_ALTO, Sala, SalaCorto3D, centroPuzle} from '../salas/SalaCorto3D';

// ENIGMA 60 · Escape room 3 «El observatorio apagado» (ficha E60-ER-003).
// Cuatro salas propias construidas con la habitación procedural de SalaCorto3D (three.js, MIT;
// texturas pintadas en canvas, propias) y un puzle 3D distinto en cada una.
type V3 = [number, number, number];

/** Paleta única del vídeo: la usan la escena 3D y los paneles (PRODUCCION.md). */
export const PALETA = {
	madera: '#9a6a3c',
	maderaOsc: '#5e3c1f',
	piso: ['#e0b25a', '#5fc4d8', '#c084fc'] as const, // 1.º, 2.º y 3.er piso de cajas en la explicación
	farolaOn: '#ffd27a',
	farolaOff: '#6a6c74',
	anillos: ['#e8c170', '#c99a4a', '#a8743a', '#7e5530'] as const, // del más pequeño al más grande
	rayo: '#cfe6ff',
	laton: '#b8893a',
};

export const SALAS: Record<'almacen' | 'galeria' | 'telescopio' | 'cupula', Sala> = {
	almacen: {
		id: 'observatorio-almacen', nombre: 'Almacén de lentes', ancho: 6, fondo: 7, alto: 3.2,
		pared: {patron: 'ladrillo', color: '#6b3b2a', color2: '#2e1a12'},
		suelo: {patron: 'losas', color: '#5a5650', color2: '#2a2824'},
		techo: '#1c1714', luz: {tipo: 'lampara', color: '#ffd9a0', intensidad: 1.0}, niebla: '#0b0908', puzle_en: 'suelo',
		atrezo: [
			{tipo: 'estanteria', pared: 'O', x: -0.8}, {tipo: 'estanteria', pared: 'E', x: 0.6}, {tipo: 'caja', pared: 'E', x: -2.2, escala: 0.8},
			{tipo: 'barril', pared: 'O', x: 1.9}, {tipo: 'mapa', pared: 'N', x: -2.0},
		],
	},
	galeria: {
		id: 'observatorio-galeria', nombre: 'Pasillo de las farolas', ancho: 6.4, fondo: 8, alto: 3.4,
		pared: {patron: 'piedra', color: '#5d5a58', color2: '#252423'},
		suelo: {patron: 'damero', color: '#4a4744', color2: '#1d1c1b'},
		techo: '#161616', luz: {tipo: 'luna', color: '#9fb6ff', intensidad: 1.15}, niebla: '#07080c', puzle_en: 'suelo',
		atrezo: [{tipo: 'ventana', pared: 'O', x: -1.5}, {tipo: 'ventana', pared: 'E', x: 1.2}, {tipo: 'banco', pared: 'O', x: 1.6}, {tipo: 'cuadro', pared: 'E', x: -1.8}],
	},
	telescopio: {
		id: 'observatorio-telescopio', nombre: 'Sala del telescopio', ancho: 6.4, fondo: 7, alto: 3.6,
		pared: {patron: 'tablas', color: '#5b3a22', color2: '#2a1a0e'},
		suelo: {patron: 'losas', color: '#3d3a36', color2: '#1a1917'},
		techo: '#120f0c', luz: {tipo: 'chimenea', color: '#ffb46a', intensidad: 0.95}, niebla: '#0a0806', puzle_en: 'mesa', mesa: {color: '#4a2e1a'},
		atrezo: [{tipo: 'chimenea', pared: 'O', x: 0.4}, {tipo: 'reloj', pared: 'E', x: 0.2}, {tipo: 'estanteria', pared: 'E', x: -1.9}, {tipo: 'mapa', pared: 'E', x: 1.4}, {tipo: 'alfombra', x: 0, z: 0.3, color: '#5a1f1f'}],
	},
	cupula: {
		id: 'observatorio-cupula', nombre: 'La cúpula', ancho: 6, fondo: 6.4, alto: 3.8,
		pared: {patron: 'chapa', color: '#3c4148', color2: '#1a1d21'},
		suelo: {patron: 'tablones', color: '#4b3a2a', color2: '#251b12'},
		techo: '#0e1014', luz: {tipo: 'luna', color: '#a9c2ff', intensidad: 0.85}, niebla: '#05060a', puzle_en: 'suelo',
		atrezo: [{tipo: 'ventana', pared: 'O', x: 0.45}, {tipo: 'tuberia', pared: 'E', x: -1.5}],
	},
};

const Mat: React.FC<{c: string; r?: number; m?: number; e?: string; ei?: number}> = ({c, r = 0.75, m = 0, e, ei = 0}) => (
	<meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e ?? '#000000'} emissiveIntensity={ei} />
);
const letraTex = (txt: string, fondo: string, tinta: string, size = 128) =>
	tex(size, size, (c) => {
		c.fillStyle = fondo;
		c.fillRect(0, 0, size, size);
		c.fillStyle = tinta;
		c.font = `bold ${Math.round(size * 0.7)}px serif`;
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.fillText(txt, size / 2, size / 2 + size * 0.04);
	});

// ---------------- P1 · cajas apiladas
export const LADO_CAJA = 0.42;
export const ALTURAS: number[][] = [
	[3, 2, 1],
	[2, 2, 1],
	[1, 1, 0],
];
export type EstadoCajas = {separa: number; piso: [number, number, number]; foco: number};
const Cajas3D: React.FC<{c: EstadoCajas; centro: V3}> = ({c, centro}) => {
	const sello = useMemo(
		() =>
			tex(128, 128, (g) => {
				g.fillStyle = PALETA.madera;
				g.fillRect(0, 0, 128, 128);
				g.strokeStyle = PALETA.maderaOsc;
				g.lineWidth = 8;
				g.strokeRect(6, 6, 116, 116);
				g.lineWidth = 3;
				for (let i = 0; i < 5; i++) {
					g.beginPath();
					g.moveTo(10, 26 + i * 20);
					g.lineTo(118, 22 + i * 20);
					g.stroke();
				}
				g.fillStyle = '#2a1a0c';
				g.beginPath();
				g.arc(64, 64, 16, 0, Math.PI * 2);
				g.fill();
				g.fillStyle = PALETA.madera;
				g.font = 'bold 22px serif';
				g.textAlign = 'center';
				g.textBaseline = 'middle';
				g.fillText('★', 64, 65);
			}),
		[],
	);
	const L = LADO_CAJA;
	const cajas: React.ReactNode[] = [];
	for (let fila = 0; fila < 3; fila++)
		for (let col = 0; col < 3; col++)
			for (let k = 0; k < ALTURAS[fila][col]; k++) {
				const x = centro[0] + (col - 1) * (L + 0.02);
				const z = centro[2] + (fila - 1) * (L + 0.02);
				const y = centro[1] + L / 2 + k * (L + 0.005 + c.separa * 0.2);
				const tinte = c.piso[k];
				cajas.push(
					<mesh key={`${fila}${col}${k}`} position={[x, y, z]}>
						<boxGeometry args={[L, L, L]} />
						<meshStandardMaterial map={sello} color={tinte > 0.01 ? new THREE.Color(PALETA.madera).lerp(new THREE.Color(PALETA.piso[k]), 0.75 * tinte) : '#ffffff'} emissive={PALETA.piso[k]} emissiveIntensity={0.35 * tinte} roughness={0.8} />
					</mesh>,
				);
			}
	return <group>{cajas}</group>;
};

// ---------------- P2 · farolas y palancas
export const FAROLA_X = [-1.5, -0.5, 0.5, 1.5];
export type EstadoFarolas = {luz: [number, number, number, number]; palanca: [number, number, number, number]};
const Farolas3D: React.FC<{c: EstadoFarolas; centro: V3}> = ({c, centro}) => {
	const nums = useMemo(() => [1, 2, 3, 4].map((n) => letraTex(String(n), '#d9c9a0', '#1a1410')), []);
	return (
		<group position={[centro[0], 0, centro[2]]}>
			{FAROLA_X.map((x, i) => {
				const on = c.luz[i];
				const ang = -0.6 + 1.2 * c.palanca[i];
				return (
					<group key={i} position={[x, 0, 0]}>
						{/* poste */}
						<mesh position={[0, 0.7, -0.5]}>
							<cylinderGeometry args={[0.035, 0.05, 1.4, 10]} />
							<Mat c="#1e1e22" m={0.6} r={0.5} />
						</mesh>
						<mesh position={[0, 0.03, -0.5]}>
							<cylinderGeometry args={[0.14, 0.16, 0.06, 14]} />
							<Mat c="#1e1e22" m={0.6} r={0.5} />
						</mesh>
						{/* farol */}
						<mesh position={[0, 1.58, -0.5]}>
							<boxGeometry args={[0.24, 0.32, 0.24]} />
							<meshStandardMaterial color={on > 0.5 ? PALETA.farolaOn : PALETA.farolaOff} emissive={PALETA.farolaOn} emissiveIntensity={1.6 * on} roughness={0.3} transparent opacity={0.95} />
						</mesh>
						<mesh position={[0, 1.8, -0.5]}>
							<coneGeometry args={[0.2, 0.14, 4]} />
							<Mat c="#1e1e22" m={0.6} r={0.5} />
						</mesh>
						{on > 0.02 && <pointLight position={[0, 1.55, -0.3]} color={PALETA.farolaOn} intensity={2.2 * on} distance={3.2} decay={1.6} />}
						{/* número sobre el poste y palanca delante */}
						<mesh position={[0, 0.55, -0.44]}>
							<planeGeometry args={[0.2, 0.2]} />
							<meshStandardMaterial map={nums[i]} roughness={0.8} />
						</mesh>
						<group position={[0, 0, 0.45]}>
							<mesh position={[0, 0.16, 0]}>
								<boxGeometry args={[0.26, 0.32, 0.16]} />
								<Mat c="#2c2a28" m={0.4} />
							</mesh>
							<mesh position={[0, 0.33, 0.081]}>
								<planeGeometry args={[0.16, 0.16]} />
								<meshStandardMaterial map={nums[i]} roughness={0.8} />
							</mesh>
							<group position={[0, 0.32, 0]} rotation={[ang, 0, 0]}>
								<mesh position={[0, 0.22, 0]}>
									<cylinderGeometry args={[0.018, 0.018, 0.44, 8]} />
									<Mat c="#8a8a8a" m={0.8} r={0.3} />
								</mesh>
								<mesh position={[0, 0.45, 0]}>
									<sphereGeometry args={[0.045, 12, 10]} />
									<Mat c="#a01818" r={0.4} />
								</mesh>
							</group>
						</group>
					</group>
				);
			})}
		</group>
	);
};

// ---------------- P3 · anillos del telescopio (torres de Hanói, 4 anillos)
/** Secuencia mínima de 15 movimientos (anillo 0 = el más pequeño), de la varilla 0 a la 2. */
export const MOVS_HANOI: {anillo: number; de: number; a: number}[] = (() => {
	const r: {anillo: number; de: number; a: number}[] = [];
	const h = (n: number, de: number, a: number, via: number) => {
		if (n < 0) return;
		h(n - 1, de, via, a);
		r.push({anillo: n, de, a});
		h(n - 1, via, a, de);
	};
	h(3, 0, 2, 1);
	return r;
})();
export const VARILLA_X = [-0.62, 0, 0.62];
export const ALTO_ANILLO = 0.07;
export type EstadoAnillos = {paso: number};
/** Posición de cada anillo para un paso continuo 0..15 (arco de subida, traslado y bajada). */
export const posAnillos = (paso: number): V3[] => {
	const pila: number[][] = [[3, 2, 1, 0], [], []];
	const k = Math.floor(Math.max(0, Math.min(15, paso)));
	for (let i = 0; i < k; i++) {
		const m = MOVS_HANOI[i];
		pila[m.de].pop();
		pila[m.a].push(m.anillo);
	}
	const pos: V3[] = [];
	pila.forEach((p, v) => p.forEach((an, nivel) => (pos[an] = [VARILLA_X[v], (nivel + 0.5) * ALTO_ANILLO, 0])));
	if (k < 15 && paso > k) {
		const m = MOVS_HANOI[k];
		const f = paso - k;
		const yA = (pila[m.de].length - 0.5) * ALTO_ANILLO;
		const yB = (pila[m.a].length + 0.5) * ALTO_ANILLO;
		const top = 0.42;
		const ease = (x: number) => x * x * (3 - 2 * x);
		if (f < 0.33) pos[m.anillo] = [VARILLA_X[m.de], yA + (top - yA) * ease(f / 0.33), 0];
		else if (f < 0.66) pos[m.anillo] = [VARILLA_X[m.de] + (VARILLA_X[m.a] - VARILLA_X[m.de]) * ease((f - 0.33) / 0.33), top, 0];
		else pos[m.anillo] = [VARILLA_X[m.a], top + (yB - top) * ease((f - 0.66) / 0.34), 0];
	}
	return pos;
};
const Anillos3D: React.FC<{c: EstadoAnillos; centro: V3}> = ({c, centro}) => {
	const pos = posAnillos(c.paso);
	return (
		<group position={centro}>
			<mesh position={[0, 0.02, 0]}>
				<boxGeometry args={[1.75, 0.04, 0.5]} />
				<Mat c="#3a2412" r={0.6} />
			</mesh>
			{VARILLA_X.map((x) => (
				<mesh key={x} position={[x, 0.2, 0]}>
					<cylinderGeometry args={[0.014, 0.014, 0.4, 8]} />
					<Mat c={PALETA.laton} m={0.85} r={0.3} />
				</mesh>
			))}
			{pos.map((p, i) => (
				<mesh key={i} position={[p[0], p[1] + 0.04, p[2]]} rotation={[Math.PI / 2, 0, 0]}>
					<torusGeometry args={[0.07 + i * 0.045, 0.028, 12, 32]} />
					<Mat c={PALETA.anillos[i]} m={0.75} r={0.32} />
				</mesh>
			))}
		</group>
	);
};
/** Telescopio de latón al fondo de la sala: gira hacia el techo al terminar. */
const Telescopio3D: React.FC<{giro: number; s: Sala}> = ({giro, s}) => (
	<group position={[1.7, 0, -s.fondo / 2 + 1.3]}>
		<mesh position={[0, 0.45, 0]}>
			<cylinderGeometry args={[0.25, 0.4, 0.9, 16]} />
			<Mat c="#2a2622" m={0.5} />
		</mesh>
		<group position={[0, 1.0, 0]} rotation={[0, 0, 0.9 - 0.55 * giro]}>
			<mesh position={[0, 0.9, 0]}>
				<cylinderGeometry args={[0.16, 0.22, 2.2, 20]} />
				<Mat c={PALETA.laton} m={0.85} r={0.28} />
			</mesh>
			<mesh position={[0, 2.0, 0]}>
				<cylinderGeometry args={[0.2, 0.2, 0.08, 20]} />
				<meshStandardMaterial color="#9fc6ff" emissive="#9fc6ff" emissiveIntensity={0.9 * giro} metalness={0.2} roughness={0.1} />
			</mesh>
		</group>
	</group>
);

// ---------------- P4 · espejos y rayo de luna
export const BALDOSA = 1.0;
/** clave 'columna,fila' (columna 0 = izquierda, fila 0 = fondo). '/' visto desde arriba. */
export const ESPEJOS: Record<string, '/' | '\\'> = {'1,2': '/', '1,1': '\\', '0,1': '\\', '2,2': '/', '2,0': '\\'};
/** Las tres cerraduras van en atriles delante de la pared del fondo (no tapadas por la puerta). */
export const LOCK_Z = (s: Sala) => -s.fondo / 2 + 0.45;
export type EstadoEspejos = {rayo: number; lente: [number, number, number]; resalta: number};
const celda = (centro: V3, col: number, fila: number): V3 => [centro[0] + (col - 1) * BALDOSA, 0, centro[2] + (fila - 1) * BALDOSA];
const Espejos3D: React.FC<{c: EstadoEspejos; centro: V3; s: Sala}> = ({c, centro, s}) => {
	const letras = useMemo(() => ['A', 'B', 'C'].map((l) => letraTex(l, '#1a1d22', '#e8d6a0')), []);
	const yR = 0.42;
	// camino: entra por la pared izquierda en la fila 2, recorre (0,2)(1,2)(1,1)(0,1)(0,0) y sale por el fondo hacia A
	const P = (col: number, fila: number): V3 => {
		const k = celda(centro, col, fila);
		return [k[0], yR, k[2]];
	};
	const inicio: V3 = [-s.ancho / 2 + 0.05, yR, P(0, 2)[2]];
	const borde: V3 = [P(0, 2)[0] - BALDOSA / 2, yR, P(0, 2)[2]];
	const finA: V3 = [P(0, 0)[0], yR, LOCK_Z(s) + 0.03];
	const pts: V3[] = [inicio, borde, P(1, 2), P(1, 1), P(0, 1), finA];
	const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[2] - pts[i][2]));
	const total = lens.reduce((a, b) => a + b, 0);
	// rayo = 0: solo hasta el borde del tablero; rayo = 1: camino completo
	const largoVis = lens[0] + (total - lens[0]) * c.rayo;
	const segs: React.ReactNode[] = [];
	let acc = 0;
	for (let i = 0; i < lens.length; i++) {
		const l = Math.min(lens[i], Math.max(0, largoVis - acc));
		acc += lens[i];
		if (l <= 0.001) continue;
		const a = pts[i];
		const b = pts[i + 1];
		const dx = (b[0] - a[0]) / lens[i];
		const dz = (b[2] - a[2]) / lens[i];
		segs.push(
			<group key={i} position={[a[0] + (dx * l) / 2, yR, a[2] + (dz * l) / 2]} rotation={[0, Math.atan2(dx, dz), 0]}>
				<mesh rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.022, 0.022, l, 8]} />
					<meshBasicMaterial color={PALETA.rayo} toneMapped={false} />
				</mesh>
			</group>,
		);
	}
	return (
		<group>
			{/* tablero 3×3 */}
			{[0, 1, 2].map((col) =>
				[0, 1, 2].map((fila) => {
					const k = celda(centro, col, fila);
					return (
						<mesh key={`${col}${fila}`} position={[k[0], 0.015, k[2]]}>
							<boxGeometry args={[BALDOSA - 0.05, 0.03, BALDOSA - 0.05]} />
							<Mat c={(col + fila) % 2 ? '#2e3238' : '#454a52'} r={0.6} m={0.2} />
						</mesh>
					);
				}),
			)}
			{/* espejos de pie */}
			{Object.entries(ESPEJOS).map(([k, tipo]) => {
				const [col, fila] = k.split(',').map(Number);
				const p = celda(centro, col, fila);
				const brillo = c.resalta;
				return (
					<group key={k} position={[p[0], 0, p[2]]} rotation={[0, tipo === '/' ? Math.PI / 4 : -Math.PI / 4, 0]}>
						<mesh position={[0, 0.42, 0]}>
							<boxGeometry args={[0.78, 0.62, 0.03]} />
							<meshStandardMaterial color="#d6e4f2" metalness={0.95} roughness={0.08} emissive="#9fb8d8" emissiveIntensity={0.25 + 0.35 * brillo} />
						</mesh>
						<mesh position={[0, 0.42, -0.02]}>
							<boxGeometry args={[0.84, 0.68, 0.02]} />
							<Mat c="#3a2a1a" />
						</mesh>
						<mesh position={[0, 0.055, 0]}>
							<boxGeometry args={[0.5, 0.11, 0.14]} />
							<Mat c="#2a1e14" />
						</mesh>
					</group>
				);
			})}
			{segs}
			{c.rayo > 0.97 && <pointLight position={[finA[0], yR + 0.2, finA[2] + 0.3]} color={PALETA.rayo} intensity={3} distance={3} decay={1.5} />}
			{/* cerraduras con lente en la pared del fondo */}
			{[0, 1, 2].map((col) => {
				const k = celda(centro, col, 0);
				const on = c.lente[col];
				return (
					<group key={col} position={[k[0], 0, LOCK_Z(s)]}>
						<mesh position={[0, (yR + 0.6) / 2, -0.08]}>
							<boxGeometry args={[0.5, yR + 0.6, 0.1]} />
							<Mat c="#23272d" m={0.5} r={0.5} />
						</mesh>
						<mesh position={[0, yR, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
							<cylinderGeometry args={[0.12, 0.12, 0.05, 24]} />
							<meshStandardMaterial color={on > 0.5 ? PALETA.rayo : '#5d6a7a'} emissive={PALETA.rayo} emissiveIntensity={1.4 * on} metalness={0.4} roughness={0.2} />
						</mesh>
						<mesh position={[0, yR, 0.0]} rotation={[Math.PI / 2, 0, 0]}>
							<torusGeometry args={[0.14, 0.025, 10, 28]} />
							<Mat c={PALETA.laton} m={0.85} r={0.3} />
						</mesh>
						<mesh position={[0, yR + 0.36, 0.01]}>
							<planeGeometry args={[0.4, 0.4]} />
							<meshStandardMaterial map={letras[col]} emissiveMap={letras[col]} emissive="#ffffff" emissiveIntensity={0.6} roughness={0.7} />
						</mesh>
					</group>
				);
			})}
		</group>
	);
};

/** Estrellas al abrirse la cúpula. */
const Estrellas: React.FC<{o: number; t: number}> = ({o, t}) => {
	const geo = useMemo(() => {
		const g = new THREE.BufferGeometry();
		const n = 700;
		const p = new Float32Array(n * 3);
		for (let i = 0; i < n; i++) {
			const u = Math.sin(i * 12.9898) * 43758.5453;
			const v = Math.sin(i * 78.233) * 12345.678;
			const th = (u - Math.floor(u)) * Math.PI * 2;
			const ph = 0.15 + (v - Math.floor(v)) * 1.2;
			p[i * 3] = 30 * Math.cos(th) * Math.cos(ph);
			p[i * 3 + 1] = 30 * Math.sin(ph);
			p[i * 3 + 2] = 30 * Math.sin(th) * Math.cos(ph);
		}
		g.setAttribute('position', new THREE.BufferAttribute(p, 3));
		return g;
	}, []);
	if (o <= 0.01) return null;
	return (
		<points geometry={geo} rotation={[0, t * 0.025, 0]}>
			<pointsMaterial color="#ffffff" size={0.16} sizeAttenuation transparent opacity={o} fog={false} />
		</points>
	);
};

export type EstadoObservatorio = {
	sala: keyof typeof SALAS;
	base: EstadoSalaCorto;
	cajas?: EstadoCajas;
	farolas?: EstadoFarolas;
	anillos?: EstadoAnillos;
	telescopio?: number;
	espejos?: EstadoEspejos;
	cielo?: number;
	luna?: number;
};

export const Observatorio3D: React.FC<{e: EstadoObservatorio; ancho?: number; alto?: number; escala?: number}> = ({e, ancho = 1280, alto = 720, escala = 1.5}) => {
	const s = SALAS[e.sala];
	const c = centroPuzle(s);
	const cielo = e.cielo ?? 0;
	return (
		<SalaCorto3D s={s} e={e.base} ancho={ancho} alto={alto} escala={escala} sinTecho={cielo > 0.02}>
			{e.cajas && <Cajas3D c={e.cajas} centro={[c[0], 0, c[2] - 0.6]} />}
			{e.farolas && <Farolas3D c={e.farolas} centro={[0, 0, c[2] - 0.4]} />}
			{e.anillos && <Anillos3D c={e.anillos} centro={[0, MESA_ALTO + 0.035, c[2]]} />}
			{e.telescopio !== undefined && <Telescopio3D giro={e.telescopio} s={s} />}
			{e.espejos && <Espejos3D c={e.espejos} centro={[0, 0, c[2] - 0.9]} s={s} />}
			{e.sala === 'cupula' && (
				<>
					{/* ranura de la cúpula con la luna, en el techo */}
					{cielo < 0.98 && (
						<mesh position={[-0.6 + 1.2 * (e.luna ?? 0), s.alto - 0.02, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
							<circleGeometry args={[0.28, 24]} />
							<meshBasicMaterial color="#e8eeff" toneMapped={false} />
						</mesh>
					)}
					<pointLight position={[-s.ancho / 2 + 0.3, 0.6, c[2] - 0.9 + BALDOSA]} color={PALETA.rayo} intensity={1.6} distance={2.5} decay={1.6} />
					<Estrellas o={cielo} t={e.base.t} />
				</>
			)}
		</SalaCorto3D>
	);
};
