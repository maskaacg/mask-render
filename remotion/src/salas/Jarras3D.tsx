import React from 'react';

// Acertijo de trasvases como objetos 3D sobre la mesa de la sala (no un dibujo).
// Tres jarras de cristal sin marcas (8, 5 y 3 litros). El nivel del agua es litros/capacidad
// y cada trasvase se anima: la jarra de origen se eleva, se inclina hacia la de destino y cae un chorro.
export type EstadoJarras = {
	capacidades: number[];
	litros: number[]; // nivel actual (puede ser fraccionario durante un trasvase)
	vierte?: {de: number; a: number; k: number}; // k: 0..1 dentro del trasvase
	aparece: number;
	centro?: [number, number, number];
};

// Paleta única del acertijo: la usa también el contador de CortoSala.
export const AGUA = '#4fa8d8';
export const JARRA_X = [-0.46, 0.02, 0.4];
const RADIO = [0.12, 0.1, 0.085];
const ALTO = [0.36, 0.3, 0.25];

const Jarra: React.FC<{i: number; nivel: number; inclina: number; sube: number; hacia: number}> = ({i, nivel, inclina, sube, hacia}) => {
	const r = RADIO[i];
	const h = ALTO[i];
	const hAgua = Math.max(0.0001, Math.min(1, nivel)) * (h - 0.02);
	// pivote en el borde inferior del lado hacia el que se vierte, para que la inclinación sea natural
	const px = hacia * r;
	return (
		<group position={[JARRA_X[i] + px, sube, 0]} rotation={[0, 0, -hacia * inclina]}>
			<group position={[-px, 0, 0]}>
				{/* cristal */}
				<mesh position={[0, h / 2, 0]}>
					<cylinderGeometry args={[r, r * 0.94, h, 36, 1, true]} />
					<meshPhysicalMaterial color="#dfeef2" roughness={0.08} metalness={0} transparent opacity={0.32} side={2} />
				</mesh>
				{/* fondo grueso */}
				<mesh position={[0, 0.008, 0]}>
					<cylinderGeometry args={[r * 0.94, r * 0.94, 0.016, 36]} />
					<meshPhysicalMaterial color="#cfe3e8" roughness={0.1} transparent opacity={0.55} />
				</mesh>
				{/* borde superior */}
				<mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
					<torusGeometry args={[r, 0.006, 8, 36]} />
					<meshStandardMaterial color="#eef6f8" roughness={0.2} transparent opacity={0.7} />
				</mesh>
				{/* asa */}
				<mesh position={[-r - 0.035, h * 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
					<torusGeometry args={[h * 0.2, 0.01, 8, 20, Math.PI]} />
					<meshPhysicalMaterial color="#dfeef2" roughness={0.1} transparent opacity={0.5} />
				</mesh>
				{/* agua */}
				{nivel > 0.002 && (
					<mesh position={[0, 0.016 + hAgua / 2, 0]}>
						<cylinderGeometry args={[r * 0.9, r * 0.88, hAgua, 32]} />
						<meshStandardMaterial color={AGUA} emissive={AGUA} emissiveIntensity={0.35} roughness={0.15} transparent opacity={0.88} />
					</mesh>
				)}
			</group>
		</group>
	);
};

export const Jarras3D: React.FC<{c: EstadoJarras}> = ({c}) => {
	const c0 = c.centro ?? [0, 0, 0];
	if (c.aparece <= 0.001) return null;
	const v = c.vierte;
	// la jarra de origen sube y se inclina en la primera parte del trasvase y vuelve al final
	const gesto = v ? Math.min(1, Math.min(v.k / 0.18, (1 - v.k) / 0.18)) : 0;
	const chorro = v ? Math.max(0, Math.min(1, (v.k - 0.15) / 0.1, (0.85 - v.k) / 0.1)) : 0;
	const xa = v ? JARRA_X[v.a] : 0;
	const xd = v ? JARRA_X[v.de] + Math.sign(xa - JARRA_X[v.de]) * RADIO[v.de] * 1.1 : 0;
	const yTop = v ? ALTO[v.de] + 0.16 : 0;
	const yFin = v ? 0.03 + Math.max(0, Math.min(1, c.litros[v.a] / c.capacidades[v.a])) * ALTO[v.a] : 0;
	return (
		<group position={[c0[0], c0[1] + 0.002, c0[2]]} scale={[1, c.aparece, 1]}>
			{/* bandeja de latón bajo las jarras */}
			<mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[1.45, 0.5]} />
				<meshStandardMaterial color="#5a4a2a" metalness={0.6} roughness={0.45} />
			</mesh>
			{c.capacidades.map((cap, i) => {
				const activa = v && v.de === i;
				return (
					<Jarra
						key={i}
						i={i}
						nivel={c.litros[i] / cap}
						sube={activa ? 0.14 * gesto : 0}
						inclina={activa ? 0.55 * gesto : 0}
						hacia={activa ? Math.sign(xa - JARRA_X[i]) : 1}
					/>
				);
			})}
			{v && chorro > 0.01 && (
				<mesh position={[(xd + xa) / 2, (yTop + yFin) / 2, 0]} rotation={[0, 0, Math.atan2(xa - xd, yTop - yFin)]}>
					<cylinderGeometry args={[0.011 * chorro, 0.016 * chorro, Math.hypot(xa - xd, yTop - yFin), 10]} />
					<meshStandardMaterial color={AGUA} emissive={AGUA} emissiveIntensity={0.5} transparent opacity={0.85} />
				</mesh>
			)}
		</group>
	);
};

/** Litros de cada jarra en el instante `k` (0..n trasvases, fraccionario durante un trasvase). */
export const estadoTrasvases = (cap: number[], inicial: number[], movs: [number, number][], k: number) => {
	let s = [...inicial];
	let vierte: EstadoJarras['vierte'];
	for (let m = 0; m < movs.length; m++) {
		const [de, a] = movs[m];
		const q = Math.min(s[de], cap[a] - s[a]);
		if (k >= m + 1) {
			s[de] -= q;
			s[a] += q;
			continue;
		}
		if (k > m) {
			const f = k - m;
			// el agua solo pasa mientras cae el chorro (entre 0,2 y 0,8 del gesto)
			const p = Math.max(0, Math.min(1, (f - 0.2) / 0.6));
			s = [...s];
			s[de] -= q * p;
			s[a] += q * p;
			vierte = {de, a, k: f};
		}
		break;
	}
	return {litros: s, vierte};
};
