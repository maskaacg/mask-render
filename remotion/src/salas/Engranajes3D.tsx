import React, {useMemo} from 'react';
import * as THREE from 'three';

// Acertijo de engranajes como mecanismo 3D sobre la mesa de la sala (no un dibujo).
// Tres ruedas en línea; el radio es proporcional al número de dientes (mismo paso de diente),
// así que engranan de verdad y las vueltas que se ven son las del cálculo.
export const PASO = 0.012; // radio (m) por diente
export type EstadoEngranajes = {dientes: number[]; vueltasPequeno: number; aparece: number; marca: number; centro?: [number, number, number]};

const forma = (n: number) => {
	const r = n * PASO;
	const h = 0.022;
	const s = new THREE.Shape();
	const pasos = n * 4;
	for (let i = 0; i <= pasos; i++) {
		const a = (i / pasos) * Math.PI * 2;
		const fase = i % 4;
		const rr = fase === 0 || fase === 1 ? r + h : r - h;
		const x = Math.cos(a) * rr;
		const y = Math.sin(a) * rr;
		if (i === 0) s.moveTo(x, y);
		else s.lineTo(x, y);
	}
	const hueco = new THREE.Path();
	hueco.absarc(0, 0, Math.min(0.03, r * 0.25), 0, Math.PI * 2, true);
	s.holes.push(hueco);
	return s;
};

const Rueda: React.FC<{n: number; pos: [number, number, number]; ang: number; color: string; marca: number}> = ({n, pos, ang, color, marca}) => {
	const geo = useMemo(() => new THREE.ExtrudeGeometry(forma(n), {depth: 0.04, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 1}), [n]);
	const r = n * PASO;
	return (
		<group position={pos} rotation={[-Math.PI / 2, 0, 0]}>
			<group rotation={[0, 0, ang]}>
				<mesh geometry={geo}>
					<meshStandardMaterial color={color} metalness={0.75} roughness={0.35} />
				</mesh>
				{/* radios */}
				{[0, 1, 2].map((k) => (
					<mesh key={k} position={[0, 0, 0.045]} rotation={[0, 0, (k * Math.PI) / 3]}>
						<boxGeometry args={[r * 1.6, 0.025, 0.012]} />
						<meshStandardMaterial color="#3a2a14" metalness={0.5} roughness={0.5} />
					</mesh>
				))}
				{/* diente marcado en rojo para poder contar vueltas */}
				<mesh position={[r - 0.02, 0, 0.05]}>
					<sphereGeometry args={[0.022, 12, 10]} />
					<meshStandardMaterial color="#d8402a" emissive="#ff5a3a" emissiveIntensity={0.4 + 1.2 * marca} />
				</mesh>
			</group>
			{/* eje */}
			<mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.02, 0.02, 0.12, 12]} />
				<meshStandardMaterial color="#c9c2b0" metalness={0.9} roughness={0.25} />
			</mesh>
		</group>
	);
};

/** Posiciones x de los centros: cada rueda toca a la anterior (suma de radios). */
export const centrosX = (dientes: number[]) => {
	const r = dientes.map((n) => n * PASO);
	const xs: number[] = [0];
	for (let i = 1; i < r.length; i++) xs.push(xs[i - 1] + r[i - 1] + r[i] + 0.004);
	const medio = (xs[0] - r[0] + xs[xs.length - 1] + r[r.length - 1]) / 2;
	return xs.map((x) => x - medio);
};

export const Engranajes3D: React.FC<{c: EstadoEngranajes}> = ({c}) => {
	const c0 = c.centro ?? [0, 0, 0];
	const xs = centrosX(c.dientes);
	const colores = ['#c9a24a', '#9aa0a6', '#b87333'];
	// ángulo del pequeño; cada engrane invierte el sentido y divide por la relación de dientes
	const a0 = c.vueltasPequeno * Math.PI * 2;
	if (c.aparece <= 0.001) return null;
	return (
		<group position={[c0[0], c0[1] + 0.005, c0[2]]} scale={[1, c.aparece, 1]}>
			<mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[2.1, 1.05]} />
				<meshStandardMaterial color="#1e1a16" roughness={0.9} metalness={0.2} />
			</mesh>
			{c.dientes.map((n, i) => {
				const ang = (i % 2 === 0 ? 1 : -1) * a0 * (c.dientes[0] / n) + (i % 2 ? Math.PI / n : 0);
				return <Rueda key={i} n={n} pos={[xs[i], 0.01, 0]} ang={ang} color={colores[i % 3]} marca={c.marca} />;
			})}
		</group>
	);
};
