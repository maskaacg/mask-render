import React from 'react';
import {P2, SEGS, segmento, CY, CH} from '../plano/puzles';

// Acertijo de cerillas como objetos 3D en el suelo de la torre (no un dibujo en un panel).
// Usa la misma geometría de segmentos que la versión plana, convertida a metros.
export const CERILLAS_CENTRO: [number, number, number] = [0, 0, 0.75];
const ESC = 0.0019; // metros por píxel del diseño plano
const aMundo = ([x, y]: P2): [number, number] => [CERILLAS_CENTRO[0] + (x - 540) * ESC, CERILLAS_CENTRO[2] + (y - (CY + CH / 2)) * ESC];

export type EstadoCerillas = {inicial: [number, string, number, number]; mueve: {de: [number, string]; a: [number, string]}; aparece: number; mov: number; brillo: number};

const Palo: React.FC<{a: P2; b: P2; y?: number; color?: string; cabeza?: string; o?: number}> = ({a, b, y = 0.018, color = '#d9b878', cabeza = '#7a1e14', o = 1}) => {
	const [x1, z1] = aMundo(a);
	const [x2, z2] = aMundo(b);
	const k = 0.1;
	const ax = x1 + (x2 - x1) * k, az = z1 + (z2 - z1) * k, bx = x2 - (x2 - x1) * k, bz = z2 - (z2 - z1) * k;
	const len = Math.hypot(bx - ax, bz - az);
	const ang = Math.atan2(bz - az, bx - ax);
	if (o <= 0.001) return null;
	return (
		<group position={[(ax + bx) / 2, y, (az + bz) / 2]} rotation={[0, -ang, 0]} scale={[1, o, o]}>
			<mesh>
				<boxGeometry args={[len, 0.022, 0.022]} />
				<meshStandardMaterial color={color} roughness={0.8} />
			</mesh>
			<mesh position={[len / 2 + 0.012, 0, 0]}>
				<sphereGeometry args={[0.02, 10, 8]} />
				<meshStandardMaterial color={cabeza} roughness={0.6} />
			</mesh>
		</group>
	);
};

export const Cerillas3D: React.FC<{c: EstadoCerillas}> = ({c}) => {
	const [d1, op, d2, d3] = c.inicial;
	const lista: {celda: number; s: string}[] = [];
	SEGS[d1].split('').forEach((s) => lista.push({celda: 0, s}));
	lista.push({celda: 1, s: 'h'});
	if (op === '+') lista.push({celda: 1, s: 'v'});
	SEGS[d2].split('').forEach((s) => lista.push({celda: 2, s}));
	lista.push({celda: 3, s: 'i1'}, {celda: 3, s: 'i2'});
	SEGS[d3].split('').forEach((s) => lista.push({celda: 4, s}));
	const [dc, ds] = c.mueve.de;
	const [ac, as] = c.mueve.a;
	const pA = segmento(dc, ds);
	const pB = segmento(ac, as);
	const m = c.mov;
	const mez = (u: P2, v: P2): P2 => [u[0] + (v[0] - u[0]) * m, u[1] + (v[1] - u[1]) * m];
	const alto = 0.018 + Math.sin(Math.min(1, m) * Math.PI) * 0.35;
	const [cx, , cz] = CERILLAS_CENTRO;
	return (
		<group>
			{/* tablón de madera oscura sobre el suelo */}
			<mesh position={[cx, 0.004, cz]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[2.0, 0.95]} />
				<meshStandardMaterial color="#2a1a10" roughness={0.9} />
			</mesh>
			{lista.map((s, i) => {
				if (s.celda === dc && s.s === ds && m > 0) return null;
				const [a, b] = segmento(s.celda, s.s);
				const o = Math.max(0, Math.min(1, c.aparece * lista.length - i));
				return <Palo key={i} a={a} b={b} o={o} />;
			})}
			{m > 0 && <Palo a={mez(pA[0], pB[0])} b={mez(pA[1], pB[1])} y={alto} color={m >= 1 ? '#f0c27a' : '#e9cf98'} cabeza="#c0331f" />}
			{c.brillo > 0.01 && <pointLight position={[cx, 0.6, cz + 0.1]} color="#ffbf6a" intensity={1.6 * c.brillo} distance={2.2} decay={1.4} />}
		</group>
	);
};
