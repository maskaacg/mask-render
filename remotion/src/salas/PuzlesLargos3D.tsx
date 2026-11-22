import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Easing, interpolate} from 'remotion';
import type {Tiempos} from './PuzlesSemana3D';

// ENIGMA 60 · Mecanismos 3D de los dos largos de la semana 23-29/11 (Claude, 22/11/2026):
// «El castillo sin amanecer» (rosetón, escudos, poleas, puerta del amanecer) y
// «Profundidad 600 #2 · El mamparo» (cámaras de presión, taquillas, cuadro eléctrico, radio Morse).
// Cada mecanismo usa alias de líneas (`sol`, `v1`…) que la ficha traduce a sus ids reales.
type V3 = [number, number, number];
type P = {p: Record<string, unknown>; tm: Tiempos};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
const rampa = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: io});
const ini = (tm: Tiempos, id: string, d = 1e6) => tm.L[id]?.inicio ?? d;
const fin = (tm: Tiempos, id: string, d = 1e6) => tm.L[id]?.fin ?? d;
const durante = (tm: Tiempos, id: string) => interpolate(tm.t, [ini(tm, id) - 0.2, ini(tm, id) + 0.2, fin(tm, id), fin(tm, id) + 0.4], [0, 1, 1, 0], clamp);

const lienzo = (w: number, h: number, pinta: (c: CanvasRenderingContext2D) => void) => {
	const cv = document.createElement('canvas');
	cv.width = w;
	cv.height = h;
	pinta(cv.getContext('2d')!);
	const t = new THREE.CanvasTexture(cv);
	t.anisotropy = 8;
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
};
const Rotulo: React.FC<{txt: string; pos: V3; w: number; h: number; fondo?: string; tinta?: string; rot?: V3; op?: number}> = ({txt, pos, w, h, fondo = '#f1e3c2', tinta = '#1d150b', rot = [0, 0, 0], op = 1}) => {
	const T = useMemo(
		() =>
			lienzo(256, Math.max(32, Math.round((256 * h) / w)), (c) => {
				const H = Math.max(32, Math.round((256 * h) / w));
				c.fillStyle = fondo;
				c.fillRect(0, 0, 256, H);
				c.fillStyle = tinta;
				c.textAlign = 'center';
				c.textBaseline = 'middle';
				let tam = Math.round(H * 0.72);
				c.font = `800 ${tam}px "Oswald", "DejaVu Sans", sans-serif`;
				while (c.measureText(txt).width > 240 && tam > 10) c.font = `800 ${--tam}px "Oswald", "DejaVu Sans", sans-serif`;
				c.fillText(txt, 128, H / 2 + 3);
			}),
		[txt, fondo, tinta, w, h],
	);
	return (
		<mesh position={pos} rotation={rot}>
			<planeGeometry args={[w, h]} />
			<meshBasicMaterial map={T} toneMapped={false} transparent opacity={op} />
		</mesh>
	);
};
const Caja: React.FC<{p: V3; s: V3; c: string; m?: number; r?: number; e?: string; ei?: number; rot?: V3}> = ({p, s, c, m = 0.1, r = 0.7, e, ei = 0, rot = [0, 0, 0]}) => (
	<mesh position={p} rotation={rot}>
		<boxGeometry args={s} />
		<meshStandardMaterial color={c} metalness={m} roughness={r} emissive={e ?? '#000'} emissiveIntensity={ei} />
	</mesh>
);

// ================================================================ CASTILLO
// P1 · Rosetón de 8 vidrios (opuestos suman 13); el roto se repone al resolver
const VIDRIO = ['#b3262b', '#2a4fa3', '#d8a93a', '#2f7a3b'];
const Roseton: React.FC<P> = ({p, tm}) => {
	const {t, c} = tm;
	const nums = (p.numeros as (number | null)[]) ?? [2, 9, 5, 7, 11, null, 8, 6];
	const sol = rampa(t, ini(tm, 'sol') + 0.5, ini(tm, 'sol') + 1.8);
	const ayuda = durante(tm, 'ayuda');
	const R = 0.62;
	return (
		<group position={[c[0], c[1] + 1.25, c[2] - 0.6]}>
			<mesh>
				<torusGeometry args={[R + 0.1, 0.05, 10, 48]} />
				<meshStandardMaterial color="#8a8074" roughness={0.8} />
			</mesh>
			{nums.map((n, i) => {
				const a = Math.PI / 2 - (i * Math.PI) / 4;
				const pos: V3 = [Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66, 0];
				const roto = n === null;
				const v = roto ? sol : 1;
				const col = roto ? '#d8a93a' : VIDRIO[i % 4];
				return (
					<group key={i} position={pos}>
						<mesh>
							<circleGeometry args={[0.17, 24]} />
							<meshStandardMaterial color={roto && v < 0.1 ? '#0a0a0a' : col} emissive={col} emissiveIntensity={(roto ? v : 1) * (0.55 + 0.25 * ayuda)} toneMapped={false} />
						</mesh>
						{(!roto || v > 0.5) && <Rotulo txt={String(roto ? p.respuesta ?? 4 : n)} pos={[0, 0, 0.01]} w={0.16} h={0.12} fondo="rgba(0,0,0,0)" tinta="#fff8e6" op={roto ? v : 1} />}
					</group>
				);
			})}
			{/* ayuda visual: líneas de luz entre opuestos (2-11 y 5-8) */}
			{[0, 2].map((i) => (
				<mesh key={i} rotation={[0, 0, Math.PI / 2 - (i * Math.PI) / 4]} position={[0, 0, 0.02]}>
					<planeGeometry args={[R * 1.32, 0.012]} />
					<meshBasicMaterial color="#fff2c0" transparent opacity={ayuda * 0.9} toneMapped={false} />
				</mesh>
			))}
			<pointLight position={[0, 0, 0.6]} color="#ffe2b0" intensity={2.5} distance={3} />
		</group>
	);
};

// P3 · Escudos heráldicos (regla de las tinturas); el falso se descuelga
const TINTA: Record<string, string> = {gules: '#b3262b', azur: '#2a4fa3', sinople: '#2f7a3b', oro: '#d8a93a', plata: '#d9dde2'};
const Escudos: React.FC<P> = ({p, tm}) => {
	const {t, c} = tm;
	const lista = (p.escudos as {nombre: string; campo: string; figura: string}[]) ?? [];
	const falso = String(p.falso ?? 'Águila');
	const cae = rampa(t, ini(tm, 'sol') + 0.6, ini(tm, 'sol') + 2.0);
	return (
		<group position={[c[0], c[1] + 1.0, c[2] - 0.7]}>
			{lista.map((e, i) => {
				const x = -0.75 + i * 0.5;
				const es = e.nombre === falso;
				return (
					<group key={e.nombre} position={[x, es ? -cae * 0.9 : 0, es ? cae * 0.25 : 0]} rotation={[es ? -cae * 0.6 : 0, 0, es ? cae * 0.3 : 0]}>
						<mesh>
							<boxGeometry args={[0.38, 0.46, 0.03]} />
							<meshStandardMaterial color={TINTA[e.campo]} metalness={e.campo === 'oro' || e.campo === 'plata' ? 0.7 : 0.1} roughness={0.4} />
						</mesh>
						{/* figura (silueta sencilla) */}
						<mesh position={[0, 0.02, 0.02]}>
							<circleGeometry args={[0.11, 5]} />
							<meshStandardMaterial color={TINTA[e.figura]} metalness={0.7} roughness={0.35} />
						</mesh>
						<Rotulo txt={e.nombre.toUpperCase()} pos={[0, -0.32, 0.02]} w={0.36} h={0.08} />
						<Rotulo txt={`${e.campo} / ${e.figura}`} pos={[0, -0.41, 0.02]} w={0.4} h={0.07} fondo="#1a1410" tinta="#f1e3c2" />
					</group>
				);
			})}
		</group>
	);
};

// P4 · Puente levadizo con tres aparejos (2, 3, 4 tramos); sube con el B
const Poleas: React.FC<P> = ({tm}) => {
	const {t, c} = tm;
	const sube = rampa(t, ini(tm, 'sol') + 0.8, fin(tm, 'sol') + 1.5);
	const malA = durante(tm, 'c1');
	const malC = durante(tm, 'c2');
	const sistemas: [string, number, number, number][] = [
		['A', 2, -0.7, malA],
		['B', 3, 0, 0],
		['C', 4, 0.7, malC],
	];
	return (
		<group position={[c[0], c[1], c[2] - 0.4]}>
			{/* puente (gira sobre su bisagra inferior) */}
			<group position={[0, 0.05, -0.55]} rotation={[-sube * 1.2, 0, 0]}>
				<Caja p={[0, 0, 0.45]} s={[1.6, 0.06, 0.9]} c="#6a4a2a" />
				<Rotulo txt="120 kg" pos={[0, 0.04, 0.45]} w={0.3} h={0.12} rot={[-Math.PI / 2, 0, 0]} />
			</group>
			{sistemas.map(([n, tramos, x, mal]) => (
				<group key={n} position={[x, 1.2, 0.2]}>
					<Caja p={[0, 0.12, 0]} s={[0.36, 0.04, 0.1]} c="#3a2a1a" />
					{Array.from({length: tramos}, (_, k) => (
						<mesh key={k} position={[-0.12 + (k * 0.24) / Math.max(1, tramos - 1), -0.35, 0]}>
							<cylinderGeometry args={[0.006, 0.006, 0.9, 6]} />
							<meshStandardMaterial color={mal > 0.1 ? '#ff6a55' : n === 'B' && sube > 0.05 ? '#3fd0c0' : '#d9cfb0'} emissive={mal > 0.1 ? '#ff6a55' : '#000'} emissiveIntensity={mal} />
						</mesh>
					))}
					<mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
						<cylinderGeometry args={[0.07, 0.07, 0.04, 20]} />
						<meshStandardMaterial color="#8a8074" metalness={0.6} />
					</mesh>
					<Rotulo txt={`${n} · ${tramos} tramos`} pos={[0, 0.26, 0.06]} w={0.4} h={0.09} />
				</group>
			))}
			<Rotulo txt="Tu fuerza: 45 kg · Cuerda: 3,5 m" pos={[0, 1.62, 0.25]} w={1.1} h={0.1} fondo="#1a1410" tinta="#f1e3c2" />
		</group>
	);
};

// P5 · Puerta del amanecer: mapa con rosa de los vientos y tres palancas Halcón-Ciervo-Lobo
const Amanecer: React.FC<P> = ({tm}) => {
	const {t, c} = tm;
	const s0 = ini(tm, 'sol');
	const pal = [0, 1, 2].map((i) => rampa(t, s0 + 0.6 + i * 1.1, s0 + 1.4 + i * 1.1));
	const torres: [string, number, number][] = [
		['N · OSO', 0, 0.42],
		['E · HALCÓN', 0.55, 0],
		['S · CIERVO', 0, -0.42],
		['O · LOBO', -0.55, 0],
	];
	return (
		<group position={[c[0], c[1], c[2] - 0.5]}>
			<group position={[0, 1.15, -0.2]}>
				<Caja p={[0, 0, -0.02]} s={[1.5, 1.1, 0.02]} c="#c9b48a" />
				{torres.map(([n, x, y]) => (
					<Rotulo key={n} txt={n} pos={[x, y, 0.01]} w={0.36} h={0.1} fondo="#3a2a1a" tinta="#f1e3c2" />
				))}
				<mesh position={[0, 0, 0.01]}>
					<circleGeometry args={[0.12, 4]} />
					<meshStandardMaterial color="#b3262b" />
				</mesh>
			</group>
			{['HALCÓN', 'CIERVO', 'LOBO'].map((n, i) => (
				<group key={n} position={[-0.45 + i * 0.45, 0.05, 0.35]}>
					<Caja p={[0, 0.06, 0]} s={[0.18, 0.12, 0.12]} c="#2a221a" />
					<group position={[0, 0.12, 0]} rotation={[0.7 - pal[i] * 1.4, 0, 0]}>
						<Caja p={[0, 0.17, 0]} s={[0.03, 0.34, 0.03]} c="#c9a45a" m={0.8} r={0.3} />
					</group>
					<Rotulo txt={`${i + 1} · ${n}`} pos={[0, 0.06, 0.065]} w={0.2} h={0.07} />
				</group>
			))}
		</group>
	);
};

// ================================================================ PROFUNDIDAD 600 #2
// P1 · Cuatro cámaras A-B-C-D: abrir una válvula iguala sus dos cámaras a la media
const Camaras: React.FC<P> = ({p, tm}) => {
	const {t, c} = tm;
	const ini0 = (p.presiones as number[]) ?? [4, 0, 10, 0];
	const seq = (p.secuencia as [number, number][]) ?? [[0, 1], [1, 2], [2, 3]];
	const k = seq.map((_, i) => rampa(t, ini(tm, `v${i + 1}`) + 0.2, ini(tm, `v${i + 1}`) + 1.6));
	const pres = [...ini0];
	const giros = [0, 0, 0];
	seq.forEach(([a, b], i) => {
		const m = (pres[a] + pres[b]) / 2;
		const pa = pres[a] + (m - pres[a]) * k[i];
		const pb = pres[b] + (m - pres[b]) * k[i];
		pres[a] = pa;
		pres[b] = pb;
		giros[Math.min(a, b)] = k[i];
	});
	return (
		<group position={[c[0], c[1], c[2] - 0.45]}>
			{['A', 'B', 'C', 'D'].map((n, i) => {
				const x = -0.84 + i * 0.56;
				const ang = interpolate(pres[i], [0, 10], [1.2, -1.2], clamp);
				return (
					<group key={n} position={[x, 0, 0]}>
						<mesh position={[0, 0.45, 0]}>
							<cylinderGeometry args={[0.18, 0.18, 0.9, 24]} />
							<meshStandardMaterial color="#3e6e70" metalness={0.5} roughness={0.45} />
						</mesh>
						<group position={[0, 0.98, 0.2]}>
							<mesh rotation={[Math.PI / 2, 0, 0]}>
								<cylinderGeometry args={[0.14, 0.14, 0.03, 28]} />
								<meshStandardMaterial color="#f1e3c2" />
							</mesh>
							<mesh position={[0, 0, 0.02]} rotation={[0, 0, ang]}>
								<boxGeometry args={[0.01, 0.22, 0.006]} />
								<meshStandardMaterial color={i === 3 && Math.abs(pres[3] - 3) < 0.05 ? '#3fd0c0' : '#b3262b'} emissive="#b3262b" emissiveIntensity={0.4} />
							</mesh>
							<Rotulo txt={`${n} · ${Math.round(pres[i] * 10) / 10} bar`} pos={[0, -0.24, 0.02]} w={0.36} h={0.09} />
						</group>
					</group>
				);
			})}
			{['A-B', 'B-C', 'C-D'].map((n, i) => (
				<group key={n} position={[-0.56 + i * 0.56, 0.35, 0.1]}>
					<Caja p={[0, 0, 0]} s={[0.38, 0.06, 0.06]} c="#59606a" m={0.7} />
					<group rotation={[0, 0, giros[i] * Math.PI]}>
						<mesh position={[0, 0.08, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
							<torusGeometry args={[0.07, 0.012, 8, 20]} />
							<meshStandardMaterial color={giros[i] > 0.95 ? '#3fd0c0' : '#b3262b'} metalness={0.4} />
						</mesh>
					</group>
					<Rotulo txt={n} pos={[0, -0.09, 0.05]} w={0.16} h={0.07} />
				</group>
			))}
			<Rotulo txt="MAMPARO: 3 BAR EN D" pos={[0.84, 1.32, 0.2]} w={0.5} h={0.09} fondo="#b3262b" tinta="#fff" />
		</group>
	);
};

// P2 · 31 taquillas; se abre la 13 (y se ve el nombre rayado)
const Taquillas: React.FC<P> = ({tm}) => {
	const {t, c} = tm;
	const abre = rampa(t, ini(tm, 'sol') + 1.0, ini(tm, 'sol') + 2.2);
	const c1 = durante(tm, 'c1');
	const c2 = durante(tm, 'c2');
	return (
		<group position={[c[0], c[1], c[2] - 0.75]}>
			{Array.from({length: 31}, (_, i) => {
				const n = i + 1;
				const fila = i < 16 ? 0 : 1;
				const col = fila === 0 ? i : i - 16;
				const x = -1.2 + col * 0.16;
				const y = 0.95 - fila * 0.62;
				const marca = (n === 4 || n === 22 ? c1 : 0) + (n === 31 ? c2 : 0);
				const es13 = n === 13;
				return (
					<group key={n} position={[x, y, 0]}>
						<Caja p={[0, 0, -0.08]} s={[0.15, 0.58, 0.16]} c="#2a3036" m={0.5} />
						<group position={[-0.075, 0, 0]} rotation={[0, es13 ? -abre * 1.7 : 0, 0]}>
							<Caja p={[0.075, 0, 0.005]} s={[0.145, 0.56, 0.012]} c={marca > 0.1 ? '#8a3a30' : '#56616b'} m={0.6} r={0.4} e={es13 ? '#3fd0c0' : '#ff6a55'} ei={es13 ? 0.6 * abre : 0.5 * marca} />
							<Rotulo txt={String(n)} pos={[0.075, 0.2, 0.013]} w={0.1} h={0.07} />
						</group>
					</group>
				);
			})}
			{/* dentro de la 13: foto y nombre rayado */}
			{abre > 0.3 && <Rotulo txt="I̶K̶E̶R̶" pos={[-1.2 + 12 * 0.16, 0.95, -0.12]} w={0.12} h={0.06} fondo="#1a1a1a" tinta="#e8e0d0" op={abre} />}
			{/* casco con el 6 violeta (pista del megapuzle, fuera del puzle) */}
			<group position={[1.35, 0.55, 0.05]}>
				<mesh>
					<sphereGeometry args={[0.16, 20, 16]} />
					<meshStandardMaterial color="#8a6a2a" metalness={0.8} roughness={0.35} />
				</mesh>
				<Rotulo txt="6" pos={[0, 0, 0.165]} w={0.1} h={0.1} fondo="rgba(0,0,0,0)" tinta="#a35cff" />
			</group>
		</group>
	);
};

// P3 · Cuadro eléctrico: batería de 10 y cinco interruptores
const Cuadro: React.FC<P> = ({tm}) => {
	const {t, c} = tm;
	const items: [string, number][] = [
		['COMPUERTA', 5],
		['BOMBA', 4],
		['RADIO', 3],
		['FOCOS', 2],
		['CALEFACCIÓN', 1],
	];
	const s0 = ini(tm, 'sol');
	const on = (n: string) => (n === 'COMPUERTA' ? rampa(t, s0 + 0.3, s0 + 0.9) : n === 'RADIO' ? rampa(t, s0 + 1.2, s0 + 1.8) : n === 'FOCOS' ? rampa(t, s0 + 2.1, s0 + 2.7) : 0);
	const dam = durante(tm, 'damian');
	const usado = items.reduce((a, [n, v]) => a + v * on(n), 0);
	return (
		<group position={[c[0], c[1] + 0.95, c[2] - 0.8]}>
			<Caja p={[0, 0, -0.03]} s={[1.7, 0.95, 0.04]} c="#2a3036" m={0.5} />
			{items.map(([n, v], i) => {
				const x = -0.64 + i * 0.32;
				const k = on(n);
				const damN = (n === 'BOMBA' || n === 'CALEFACCIÓN' || n === 'COMPUERTA') && dam > 0.1;
				return (
					<group key={n} position={[x, 0.05, 0]}>
						<Caja p={[0, 0, 0]} s={[0.12, 0.2, 0.04]} c="#1a1e22" />
						<Caja p={[0, 0.06 - k * 0.12, 0.03]} s={[0.05, 0.08, 0.04]} c={k > 0.5 ? '#3fd0c0' : damN ? '#ff6a55' : '#c9c2b0'} m={0.6} e={k > 0.5 ? '#3fd0c0' : '#000'} ei={0.5 * k} />
						<Rotulo txt={n} pos={[0, -0.2, 0.025]} w={0.3} h={0.07} />
						<Rotulo txt={`${v}`} pos={[0, 0.2, 0.025]} w={0.1} h={0.08} fondo="#d8a93a" />
					</group>
				);
			})}
			{/* batería: barra que se llena con lo gastado */}
			<Caja p={[0, -0.38, 0.01]} s={[1.4, 0.08, 0.02]} c="#121416" />
			<Caja p={[-0.7 + (1.4 * usado) / 20, -0.38, 0.02]} s={[Math.max(0.001, (1.4 * usado) / 10), 0.07, 0.02]} c={Math.abs(usado - 10) < 0.05 ? '#3fd0c0' : '#d8a93a'} e="#d8a93a" ei={0.4} />
			<Rotulo txt={`BATERÍA ${Math.round(usado)}/10`} pos={[0, -0.27, 0.02]} w={0.4} h={0.07} />
		</group>
	);
};

// P4 · Radio de 2008 con luz Morse en bucle (‒·‒· · ·‒· ‒‒‒) y tabla en la pared
const MORSE = '-.-. . .-. ---';
const Morse: React.FC<P> = ({tm}) => {
	const {t, c} = tm;
	// secuencia en unidades: punto 1, raya 3, hueco 1, letra 3; bucle
	const pasos: number[] = [];
	MORSE.split(' ').forEach((letra) => {
		letra.split('').forEach((s) => {
			pasos.push(...(s === '.' ? [1] : [1, 1, 1]), 0);
		});
		pasos.push(0, 0);
	});
	pasos.push(0, 0, 0, 0);
	const u = Math.floor(t / 0.22) % pasos.length;
	const luz = pasos[u];
	const sol = durante(tm, 'sol');
	return (
		<group position={[c[0], c[1], c[2] - 0.7]}>
			<Caja p={[-0.5, 0.35, 0]} s={[0.6, 0.4, 0.3]} c="#3a3226" m={0.3} />
			<mesh position={[-0.5, 0.42, 0.16]}>
				<sphereGeometry args={[0.06, 16, 12]} />
				<meshStandardMaterial color="#ff3b2e" emissive="#ff3b2e" emissiveIntensity={0.2 + 2.5 * luz} toneMapped={false} />
			</mesh>
			<pointLight position={[-0.5, 0.45, 0.4]} color="#ff3b2e" intensity={1.5 * luz} distance={2} />
			<Rotulo txt="‒·‒· | · | ·‒· | ‒‒‒" pos={[-0.5, 0.65, 0.1]} w={0.62} h={0.1} fondo="#1a1410" tinta="#ffd27a" />
			{/* tabla Morse en la pared */}
			<group position={[0.55, 1.0, -0.1]}>
				<Caja p={[0, 0, -0.02]} s={[0.9, 0.7, 0.02]} c="#e9dfc6" />
				{['A ·‒', 'C ‒·‒·', 'E ·', 'I ··', 'M ‒‒', 'N ‒·', 'O ‒‒‒', 'R ·‒·', 'S ···', 'T ‒'].map((r, i) => (
					<Rotulo key={r} txt={r} pos={[-0.22 + (i % 2) * 0.44, 0.26 - Math.floor(i / 2) * 0.13, 0.001]} w={0.38} h={0.1} fondo={sol > 0.1 && /^[CERO]/.test(r) ? '#3fd0c0' : '#e9dfc6'} />
				))}
			</group>
		</group>
	);
};

export const PUZLES_LARGOS: Record<string, {C: React.FC<P>; sombras?: boolean}> = {
	roseton: {C: Roseton},
	escudos: {C: Escudos},
	poleas: {C: Poleas},
	amanecer: {C: Amanecer},
	camaras: {C: Camaras},
	taquillas: {C: Taquillas},
	cuadro: {C: Cuadro},
	morse: {C: Morse},
};
