import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Easing, interpolate} from 'remotion';

// ENIGMA 60 · Mecanismos 3D de la semana 23-29/11/2026 (Claude, 22/11/2026).
// Cada puzle es un objeto 3D dentro de su sala (orden del Propietario, 16/11): lo que se ve es lo que se
// razona. Los tiempos salen de las líneas de voz de la ficha (`tm.L`), así que la animación acompaña a la voz.
// Geometría procedural de three.js (MIT) y texturas pintadas en canvas: sin recursos de terceros.

type V3 = [number, number, number];
export type Tiempos = {t: number; L: Record<string, {inicio: number; fin: number}>; F: Record<string, {inicio: number; fin: number}>; finSol: number; total: number; c: V3};
type P = {p: Record<string, unknown>; tm: Tiempos};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
const rampa = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: io});
const ini = (tm: Tiempos, id: string, d = 1e6) => tm.L[id]?.inicio ?? d;
const fin = (tm: Tiempos, id: string, d = 1e6) => tm.L[id]?.fin ?? d;
/** resalte 0..1 mientras suena una línea */
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
const rotulo = (txt: string, fondo = '#f1e3c2', tinta = '#1d150b', w = 256, h = 160, tam = 104) =>
	lienzo(w, h, (c) => {
		c.fillStyle = fondo;
		c.fillRect(0, 0, w, h);
		c.fillStyle = tinta;
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.font = `800 ${tam}px "Oswald", "DejaVu Sans", sans-serif`;
		c.fillText(txt, w / 2, h / 2 + 6);
	});
const Rotulo: React.FC<{txt: string; pos: V3; w: number; h: number; fondo?: string; tinta?: string; rot?: V3; opacidad?: number}> = ({txt, pos, w, h, fondo, tinta, rot = [0, 0, 0], opacidad = 1}) => {
	const T = useMemo(() => rotulo(txt, fondo, tinta, 256, Math.round((256 * h) / w), Math.round(Math.min(104, (256 * h) / w * 0.7))), [txt, fondo, tinta, w, h]);
	return (
		<mesh position={pos} rotation={rot}>
			<planeGeometry args={[w, h]} />
			<meshBasicMaterial map={T} toneMapped={false} transparent opacity={opacidad} />
		</mesh>
	);
};
const Caja: React.FC<{p: V3; s: V3; c: string; m?: number; r?: number; e?: string; ei?: number; sombra?: boolean}> = ({p, s, c, m = 0.1, r = 0.7, e, ei = 0, sombra}) => (
	<mesh position={p} castShadow={sombra} receiveShadow={sombra}>
		<boxGeometry args={s} />
		<meshStandardMaterial color={c} metalness={m} roughness={r} emissive={e ?? '#000'} emissiveIntensity={ei} />
	</mesh>
);

// ---------------------------------------------------------------- MAR 24 · Tres sombras de colores (mezcla aditiva real)
// Tres focos tapados delante de una estatua blanca; las sombras caen en la pantalla blanca del fondo.
// Una sombra recibe las otras dos luces: su color es la mezcla aditiva de esas dos (lo calcula el render).
const RGB: Record<string, string> = {R: '#ff2a1a', V: '#18ff3a', A: '#2a4dff'};
const Sombras: React.FC<P> = ({p, tm}) => {
	const orden = String(p.lamparas ?? 'AVR').split(''); // izquierda, centro, derecha
	const {t, c} = tm;
	const objetivo = useMemo(() => {
		const o = new THREE.Object3D();
		o.position.set(c[0], c[1] + 0.5, c[2] - 0.35);
		o.updateMatrixWorld();
		return o;
	}, [c]);
	// las pantallas se levantan una a una al dar la solución (l07 derecha, l08 centro, l09 izquierda)
	const abre = [rampa(t, ini(tm, 'l09'), ini(tm, 'l09') + 1.2), rampa(t, ini(tm, 'l08'), ini(tm, 'l08') + 1.2), rampa(t, ini(tm, 'l07'), ini(tm, 'l07') + 1.2)];
	// comprobación: en l10 se apagan y encienden de una en una (desaparece su sombra)
	const l10 = ini(tm, 'l10');
	const d10 = Math.max(1.5, (fin(tm, 'l10') - l10) / 3);
	const on = [0, 1, 2].map((i) => {
		const a = l10 + i * d10;
		return 1 - interpolate(t, [a + 0.1, a + 0.3, a + d10 - 0.3, a + d10 - 0.1], [0, 1, 1, 0], clamp);
	});
	const xs = [-0.62, 0, 0.62];
	return (
		<group>
			{/* pantalla blanca del fondo y suelo claro: aquí se ven las sombras */}
			<mesh position={[c[0], c[1] + 0.85, c[2] - 1.05]} receiveShadow>
				<planeGeometry args={[2.6, 1.7]} />
				<meshStandardMaterial color="#f4f1ea" roughness={0.95} />
			</mesh>
			<mesh position={[c[0], c[1] + 0.004, c[2] - 0.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[2.6, 1.5]} />
				<meshStandardMaterial color="#ece8de" roughness={0.95} />
			</mesh>
			{/* estatua: pedestal, cuerpo y cabeza (blanca) */}
			<group position={[c[0], c[1], c[2] - 0.35]}>
				<Caja p={[0, 0.09, 0]} s={[0.26, 0.18, 0.26]} c="#e9e4d8" sombra />
				<mesh position={[0, 0.42, 0]} castShadow>
					<cylinderGeometry args={[0.07, 0.11, 0.5, 18]} />
					<meshStandardMaterial color="#efeae0" roughness={0.6} />
				</mesh>
				<mesh position={[0, 0.76, 0]} castShadow>
					<sphereGeometry args={[0.1, 20, 16]} />
					<meshStandardMaterial color="#efeae0" roughness={0.6} />
				</mesh>
				<mesh position={[0.14, 0.5, 0]} rotation={[0, 0, -0.6]} castShadow>
					<cylinderGeometry args={[0.025, 0.025, 0.32, 10]} />
					<meshStandardMaterial color="#efeae0" />
				</mesh>
			</group>
			{/* tres focos con pantalla opaca hacia la cámara: su color no se ve hasta la solución */}
			{orden.map((k, i) => (
				<group key={i} position={[c[0] + xs[i], c[1] + 0.34, c[2] + 0.75]}>
					<Caja p={[0, -0.17, 0]} s={[0.04, 0.32, 0.04]} c="#2a2622" m={0.6} r={0.4} />
					<mesh rotation={[0.25, 0, 0]}>
						<cylinderGeometry args={[0.11, 0.08, 0.2, 18]} />
						{/* el color del foco no se ve hasta que su pantalla se levanta (no se regala la respuesta) */}
						<meshStandardMaterial color={abre[i] > 0.35 ? RGB[k] : '#2a2622'} emissive={RGB[k]} emissiveIntensity={1.2 * on[i] * abre[i]} toneMapped={false} />
					</mesh>
					{/* pantalla que tapa el color (gira hacia arriba al resolver) */}
					<group position={[0, 0.0, 0.12]} rotation={[-abre[i] * 1.6, 0, 0]}>
						<Caja p={[0, 0, 0.0]} s={[0.2, 0.2, 0.02]} c="#3b2f24" m={0.3} r={0.6} />
					</group>
					<Rotulo txt={['IZQ.', 'CENTRO', 'DER.'][i]} pos={[0, -0.26, 0.03]} w={0.22} h={0.08} />
					<spotLight
						position={[0, 0, -0.05]}
						target={objetivo}
						color={RGB[k]}
						intensity={9 * on[i]}
						angle={0.75}
						penumbra={0.25}
						distance={6}
						decay={1.2}
						castShadow
						shadow-mapSize-width={1024}
						shadow-mapSize-height={1024}
						shadow-bias={-0.002}
					/>
				</group>
			))}
		</group>
	);
};

// ---------------------------------------------------------------- JUE 26 · La vitrina de los tres reflejos
// Dos espejos en ángulo recto. Las imágenes son copias de la placa reflejadas por los planos de los espejos
// (simples: invertidas; doble: girada 180° sin invertir), que es exactamente lo que hace un espejo plano.
const SEG: Record<string, number[]> = {'0': [1, 1, 1, 1, 1, 1, 0], '1': [0, 1, 1, 0, 0, 0, 0], '2': [1, 1, 0, 1, 1, 0, 1], '5': [1, 0, 1, 1, 0, 1, 1], '8': [1, 1, 1, 1, 1, 1, 1]};
const texCodigo = (cod: string) =>
	lienzo(600, 260, (c) => {
		c.fillStyle = '#121212';
		c.fillRect(0, 0, 600, 260);
		c.strokeStyle = '#c9a45a';
		c.lineWidth = 12;
		c.strokeRect(6, 6, 588, 248);
		cod.split('').forEach((d, i) => {
			const x0 = 70 + i * 170;
			const y0 = 40;
			const W = 110;
			const H = 180;
			const s = SEG[d] ?? SEG['8'];
			c.fillStyle = '#ff4a2e';
			const seg = (on: number, x: number, y: number, w: number, h: number) => on && c.fillRect(x, y, w, h);
			seg(s[0], x0 + 12, y0, W - 24, 16); // a
			seg(s[1], x0 + W - 16, y0 + 10, 16, H / 2 - 14); // b
			seg(s[2], x0 + W - 16, y0 + H / 2 + 4, 16, H / 2 - 14); // c
			seg(s[3], x0 + 12, y0 + H - 16, W - 24, 16); // d
			seg(s[4], x0, y0 + H / 2 + 4, 16, H / 2 - 14); // e
			seg(s[5], x0, y0 + 10, 16, H / 2 - 14); // f
			seg(s[6], x0 + 12, y0 + H / 2 - 8, W - 24, 16); // g
		});
	});
const reflejo = (punto: THREE.Vector3, n: THREE.Vector3) => {
	// matriz de reflexión respecto al plano que pasa por `punto` con normal `n`
	const m = new THREE.Matrix4();
	const [a, b, cc] = [n.x, n.y, n.z];
	m.set(1 - 2 * a * a, -2 * a * b, -2 * a * cc, 0, -2 * a * b, 1 - 2 * b * b, -2 * b * cc, 0, -2 * a * cc, -2 * b * cc, 1 - 2 * cc * cc, 0, 0, 0, 0, 1);
	const t1 = new THREE.Matrix4().makeTranslation(-punto.x, -punto.y, -punto.z);
	const t2 = new THREE.Matrix4().makeTranslation(punto.x, punto.y, punto.z);
	return t2.multiply(m).multiply(t1);
};
const Placa: React.FC<{tex: THREE.Texture; m: THREE.Matrix4; opacidad: number}> = ({tex, m, opacidad}) => (
	<group matrixAutoUpdate={false} matrix={m}>
		<mesh>
			<planeGeometry args={[0.3, 0.13]} />
			<meshBasicMaterial map={tex} side={THREE.DoubleSide} toneMapped={false} transparent opacity={opacidad} />
		</mesh>
	</group>
);
const Reflejos: React.FC<P> = ({p, tm}) => {
	const {t, c} = tm;
	const cod = String(p.codigo ?? '258');
	const tex = useMemo(() => texCodigo(cod), [cod]);
	const C = new THREE.Vector3(c[0], c[1] + 0.32, c[2] - 0.47); // rincón de los espejos (35 cm detrás de la placa)
	const nA = new THREE.Vector3(1, 0, 1).normalize(); // espejo izquierdo
	const nB = new THREE.Vector3(-1, 0, 1).normalize(); // espejo derecho
	// placa delante del rincón, mirando a los espejos (de espaldas a la cámara); al final gira 180°
	const giro = rampa(t, ini(tm, 'l09'), ini(tm, 'l09') + 1.6) * Math.PI;
	const base = new THREE.Matrix4().compose(new THREE.Vector3(c[0], c[1] + 0.32, c[2] - 0.12), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)), new THREE.Vector3(1, 1, 1));
	const mA = reflejo(C, nA).multiply(base.clone());
	const mB = reflejo(C, nB).multiply(base.clone());
	const mAB = reflejo(C, nB).multiply(reflejo(C, nA)).multiply(base.clone());
	const real = new THREE.Matrix4().compose(new THREE.Vector3(c[0], c[1] + 0.32, c[2] - 0.12), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + giro, 0)), new THREE.Vector3(1, 1, 1));
	const brillo = (id: string) => durante(tm, id);
	const marcos: [V3, number][] = [
		[[C.x - 0.32, C.y, C.z + 0.32], Math.PI / 4],
		[[C.x + 0.32, C.y, C.z + 0.32], -Math.PI / 4],
	];
	return (
		<group>
			{/* imágenes virtuales detrás de los espejos (se apagan cuando la placa gira) */}
			{[mA, mB, mAB].map((m, i) => (
				<Placa key={i} tex={tex} m={m} opacidad={0.92 - 0.5 * rampa(t, ini(tm, 'l09'), ini(tm, 'l09') + 1.6)} />
			))}
			{/* espejos: vidrio azulado casi transparente con marco de latón */}
			{marcos.map(([pos, r], i) => (
				<group key={i} position={pos} rotation={[0, r, 0]}>
					<mesh>
						<planeGeometry args={[0.9, 0.7]} />
						<meshStandardMaterial color="#9fc4d6" metalness={0.9} roughness={0.05} transparent opacity={0.16 + 0.12 * brillo('l07')} depthWrite={false} side={THREE.DoubleSide} />
					</mesh>
					<Caja p={[0, 0.36, 0]} s={[0.94, 0.03, 0.03]} c="#b08a46" m={0.8} r={0.3} />
					<Caja p={[0, -0.36, 0]} s={[0.94, 0.03, 0.03]} c="#b08a46" m={0.8} r={0.3} />
				</group>
			))}
			{/* sin poste en el rincón: taparía el reflejo doble */}
			{/* placa real: de espaldas (dorso liso), al final se da la vuelta */}
			<group matrixAutoUpdate={false} matrix={real}>
				<mesh position={[0, 0, -0.004]} rotation={[0, Math.PI, 0]}>
					<planeGeometry args={[0.32, 0.15]} />
					<meshStandardMaterial color="#5a4630" roughness={0.6} />
				</mesh>
				<mesh>
					<planeGeometry args={[0.3, 0.13]} />
					<meshBasicMaterial map={tex} toneMapped={false} />
				</mesh>
			</group>
			<Caja p={[c[0], c[1] + 0.11, c[2] - 0.12]} s={[0.05, 0.22, 0.05]} c="#3a2a1a" />
			{/* etiquetas de los tres reflejos */}
			<Rotulo txt="IZQ." pos={[C.x - 0.4, C.y + 0.28, C.z + 0.42]} w={0.16} h={0.06} rot={[0, Math.PI / 4, 0]} />
			<Rotulo txt="RINCÓN" pos={[C.x, C.y + 0.3, C.z + 0.03]} w={0.2} h={0.065} />
			<Rotulo txt="DER." pos={[C.x + 0.4, C.y + 0.28, C.z + 0.42]} w={0.16} h={0.06} rot={[0, -Math.PI / 4, 0]} />
		</group>
	);
};

// ---------------------------------------------------------------- SÁB 28 · La torre de dados
const PIPS: Record<number, [number, number][]> = {1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]};
const texCara = (n: number) =>
	lienzo(256, 256, (c) => {
		c.fillStyle = '#f6f1e6';
		c.fillRect(0, 0, 256, 256);
		c.fillStyle = n === 1 ? '#b3262b' : '#151515';
		PIPS[n].forEach(([x, y]) => {
			c.beginPath();
			c.arc(128 + x * 64, 128 + y * 64, 26, 0, Math.PI * 2);
			c.fill();
		});
	});
const Dado: React.FC<{caras: number[]; pos: V3; rot: V3; lado: number}> = ({caras, pos, rot, lado}) => {
	// orden de caras en three.js: +x, -x, +y, -y, +z, -z
	const mats = useMemo(() => caras.map((n) => new THREE.MeshStandardMaterial({map: texCara(n), roughness: 0.5})), [caras.join(',')]);
	return (
		<mesh position={pos} rotation={rot} material={mats} castShadow>
			<boxGeometry args={[lado, lado, lado]} />
		</mesh>
	);
};
const Dados: React.FC<P> = ({tm}) => {
	const {t, c} = tm;
	const L = 0.26;
	// abajo → arriba; caras +x,-x,+y,-y,+z,-z (opuestas suman 7)
	const dados = [
		[2, 5, 6, 1, 4, 3],
		[1, 6, 3, 4, 2, 5],
		[3, 4, 5, 2, 1, 6],
	];
	// solución: la torre se separa (l07), cada dado gira para enseñar sus caras ocultas (l07-l09)
	const sep = rampa(t, ini(tm, 'l07') - 0.4, ini(tm, 'l07') + 0.8);
	const vuelta = (k: number, id: string) => rampa(t, ini(tm, id), ini(tm, id) + 1.4) * k;
	const ys = [0, 1, 2].map((i) => L / 2 + i * (L + 0.004) + sep * i * 0.16);
	const rots: V3[] = [
		[vuelta(Math.PI, 'l09') * 0.5 + 0.2 * sep, 0.12 + 0.35 * sep, 0],
		[vuelta(Math.PI, 'l08') * 0.5 + 0.2 * sep, -0.2 - 0.3 * sep, 0],
		[vuelta(Math.PI, 'l07') * 0.5 + 0.2 * sep, 0.25 + 0.3 * sep, 0],
	];
	return (
		<group position={[c[0], c[1], c[2] - 0.05]}>
			{dados.map((caras, i) => (
				<Dado key={i} caras={caras} pos={[0, ys[i], 0]} rot={rots[i]} lado={L} />
			))}
			{/* números de las caras ocultas, flotando junto a cada hueco al separar */}
			{sep > 0.05 && (
				<>
					<Rotulo txt="2" pos={[0.34, L * 2 + 0.08 + 0.16, 0.05]} w={0.14} h={0.11} fondo="#3fd0c0" opacidad={durante(tm, 'l07') * 0 + rampa(t, ini(tm, 'l07') + 0.6, ini(tm, 'l07') + 1.2)} />
					<Rotulo txt="3 + 4" pos={[0.4, L * 1.5 + 0.08, 0.05]} w={0.24} h={0.11} fondo="#3fd0c0" opacidad={rampa(t, ini(tm, 'l08') + 0.4, ini(tm, 'l08') + 1.0)} />
					<Rotulo txt="6 + 1" pos={[0.4, L * 0.5, 0.05]} w={0.24} h={0.11} fondo="#3fd0c0" opacidad={rampa(t, ini(tm, 'l09') + 0.4, ini(tm, 'l09') + 1.0)} />
				</>
			)}
			{/* tapete verde de casino */}
			<mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[1.2, 0.8]} />
				<meshStandardMaterial color="#1f5e3a" roughness={0.95} />
			</mesh>
		</group>
	);
};

// ---------------------------------------------------------------- DOM 29 · El ascensor de las tres plantas
const Ascensor: React.FC<P> = ({tm}) => {
	const {t, c} = tm;
	const H = 0.36; // altura de planta
	// recorrido demostrado en l08: 1 → 3 (16 s), puertas 6 s, 3 → 2 (8 s): 30 s simulados
	const a = ini(tm, 'l08');
	const b = Math.max(a + 6, fin(tm, 'l08'));
	const k = rampa(t, a, b); // 0..1 del viaje simulado
	const seg = k * 30;
	const planta = seg <= 16 ? 1 + seg / 8 : seg <= 22 ? 3 : 3 - (seg - 22) / 8;
	const puertas = seg > 16.4 && seg < 21.6 ? 1 : 0;
	// aguja girando sola mientras no se resuelve
	const aguja = t < a ? Math.sin(t * 2.3) * 0.9 + Math.sin(t * 0.7) * 0.4 : interpolate(planta, [1, 3], [0.9, -0.9]);
	const y = (planta - 1) * H;
	return (
		<group position={[c[0], c[1], c[2] - 0.15]}>
			{/* hueco en corte: tres plantas con su número grande */}
			{[1, 2, 3].map((n) => (
				<group key={n}>
					<Caja p={[0, (n - 1) * H, -0.05]} s={[0.9, 0.025, 0.4]} c="#6b5a4a" />
					<Rotulo txt={String(n)} pos={[-0.36, (n - 1) * H + 0.16, 0.16]} w={0.13} h={0.13} fondo="#f1e3c2" />
				</group>
			))}
			<Caja p={[-0.47, H, -0.05]} s={[0.03, H * 2 + 0.36, 0.4]} c="#3a3f46" m={0.7} r={0.4} />
			<Caja p={[0.47, H, -0.05]} s={[0.03, H * 2 + 0.36, 0.4]} c="#3a3f46" m={0.7} r={0.4} />
			{/* cabina */}
			<group position={[0.08, y + 0.15, -0.05]}>
				<Caja p={[0, 0, 0]} s={[0.36, 0.28, 0.3]} c="#b08a46" m={0.6} r={0.35} e="#ffcf8a" ei={0.15 + 0.4 * puertas} />
				<Caja p={[-0.09 - 0.07 * puertas, 0, 0.16]} s={[0.17, 0.26, 0.01]} c="#7a5a2a" m={0.7} />
				<Caja p={[0.09 + 0.07 * puertas, 0, 0.16]} s={[0.17, 0.26, 0.01]} c="#7a5a2a" m={0.7} />
			</group>
			<mesh position={[0.08, H * 1.2, -0.05]}>
				<cylinderGeometry args={[0.004, 0.004, H * 2.6, 6]} />
				<meshStandardMaterial color="#222" />
			</mesh>
			{/* esfera indicadora con aguja (1-2-3) */}
			<group position={[-0.2, H * 2 + 0.27, 0.17]} scale={[0.7, 0.7, 0.7]}>
				<mesh rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.15, 0.15, 0.02, 32, 1, false, 0, Math.PI]} />
					<meshStandardMaterial color="#f1e3c2" />
				</mesh>
				<Rotulo txt="1   2   3" pos={[0, 0.06, 0.012]} w={0.26} h={0.06} />
				<mesh position={[0, 0, 0.02]} rotation={[0, 0, aguja]}>
					<boxGeometry args={[0.008, 0.24, 0.006]} />
					<meshStandardMaterial color="#b3262b" emissive="#b3262b" emissiveIntensity={0.6} />
				</mesh>
			</group>
			{/* cronómetro de la demostración */}
			{t > a - 0.3 && <Rotulo txt={`${Math.floor(seg)} s`} pos={[0.22, H * 2 + 0.27, 0.18]} w={0.22} h={0.11} fondo="#121212" tinta={seg >= 29.9 ? '#3fd0c0' : '#ffd27a'} />}
		</group>
	);
};

// ---------------------------------------------------------------- VIE/MIÉ · ¿Qué campana falta? (cuadrado latino)
const METALES = ['#b87333', '#a97142', '#c9ccd1', '#4a4f57'];
const Campana: React.FC<{color: string; escala: number; pos: V3; vaiven: number; num: number}> = ({color, escala, pos, vaiven, num}) => (
	<group position={pos}>
		<group rotation={[0, 0, Math.sin(vaiven * Math.PI * 4) * 0.35 * (1 - vaiven)]}>
			<mesh position={[0, -0.12 * escala, 0]}>
				<cylinderGeometry args={[0.05 * escala, 0.12 * escala, 0.2 * escala, 24, 1, true]} />
				<meshStandardMaterial color={color} metalness={0.85} roughness={0.3} side={THREE.DoubleSide} />
			</mesh>
			<mesh position={[0, -0.02 * escala, 0]}>
				<sphereGeometry args={[0.05 * escala, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
				<meshStandardMaterial color={color} metalness={0.85} roughness={0.3} />
			</mesh>
			<Rotulo txt={String(num)} pos={[0, -0.13 * escala, 0.125 * escala]} w={0.08} h={0.08} />
		</group>
	</group>
);
const Campanas: React.FC<P> = ({p, tm}) => {
	const {t, c} = tm;
	const falta = Number(p.falta ?? 1);
	const xs = [-0.45, -0.15, 0.15, 0.45];
	// la partitura suena en bucle durante el enunciado (l04) y completa al resolver (l09)
	const toque = (i: number, desde: number, hasta: number) => {
		if (t < desde || t > hasta) return 1;
		const paso = ((t - desde) * 2.2) % 4;
		return Math.floor(paso) === i ? paso % 1 : 1;
	};
	const sube = rampa(t, ini(tm, 'l06') + 0.3, ini(tm, 'l06') + 2.0);
	return (
		<group position={[c[0], c[1], c[2] - 0.2]} scale={Number(p.escala ?? 1)}>
			<Caja p={[0, 1.05, 0]} s={[1.3, 0.06, 0.08]} c="#4a2e1a" />
			{xs.map((x, i) => {
				const n = i + 1;
				const esc = 1.3 - i * 0.12;
				const colgada = n !== falta || sube > 0.98;
				const pos: V3 = n === falta ? [x * sube + 0.55 * (1 - sube), 1.0 * sube + 0.12 * (1 - sube), 0.25 * (1 - sube)] : [x, 1.0, 0];
				return (
					<group key={n}>
						<mesh position={[x, 1.01, 0]}>
							<torusGeometry args={[0.018, 0.005, 6, 12]} />
							<meshStandardMaterial color="#c9c2b0" metalness={0.9} />
						</mesh>
						<Campana color={METALES[i]} escala={esc} pos={pos} num={n} vaiven={colgada ? Math.min(toque(i, ini(tm, 'l04'), fin(tm, 'l04')), toque(i, ini(tm, 'l09'), fin(tm, 'l09') + 2)) : 1} />
					</group>
				);
			})}
		</group>
	);
};

// ---------------------------------------------------------------- MIÉ/SÁB · La esclusa (secuencia de estados)
const Esclusa: React.FC<P> = ({tm}) => {
	const {t, c} = tm;
	// C cierra la exterior (l07), I iguala (l08), A abre la interior (l08 fin), P purga (l09)
	const C = rampa(t, ini(tm, 'l07') + 0.3, ini(tm, 'l07') + 1.5);
	const I = rampa(t, ini(tm, 'l08') + 0.2, ini(tm, 'l08') + 1.8);
	const A = rampa(t, fin(tm, 'l08') - 1.2, fin(tm, 'l08') + 0.2);
	const Pu = rampa(t, ini(tm, 'l09') + 0.4, ini(tm, 'l09') + 2.4);
	const palancas = [C, I, A, Pu];
	const agua = 0.24 * (1 - Pu) + 0.12 * A * (1 - Pu) + 0.06 * Math.sin(t * 1.3) * 0.1;
	const presion = interpolate(I, [0, 1], [1.1, -0.2]);
	return (
		<group position={[c[0], c[1], c[2] - 0.2]}>
			{/* cámara de la esclusa: suelo de rejilla, dos compuertas circulares */}
			<Caja p={[0, 0.01, 0]} s={[1.25, 0.02, 0.8]} c="#2c3238" m={0.6} r={0.5} />
			<mesh position={[0, agua / 2, 0]}>
				<boxGeometry args={[1.23, Math.max(0.01, agua), 0.78]} />
				<meshStandardMaterial color="#1f6f8b" transparent opacity={0.55} roughness={0.1} metalness={0.2} />
			</mesh>
			{([[-0.6, 1 - C, 'EXTERIOR'], [0.6, A, 'INTERIOR']] as [number, number, string][]).map(([x, abierta, nombre], i) => (
				<group key={i} position={[x * 0.85, 0.5, -0.2]}>
					<mesh>
						<torusGeometry args={[0.24, 0.04, 10, 32]} />
						<meshStandardMaterial color="#59606a" metalness={0.8} roughness={0.35} />
					</mesh>
					<group position={[x < 0 ? -0.23 : 0.23, 0, 0]} rotation={[0, (x < 0 ? -1 : 1) * abierta * 1.5, 0]}>
						<mesh position={[x < 0 ? 0.23 : -0.23, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
							<cylinderGeometry args={[0.22, 0.22, 0.04, 32]} />
							<meshStandardMaterial color="#a8b2bc" metalness={0.6} roughness={0.35} emissive="#2a3a48" emissiveIntensity={0.5} />
						</mesh>
					</group>
					<Rotulo txt={nombre} pos={[x < 0 ? 0.16 : -0.16, 0.45, 0.2]} w={0.3} h={0.08} />
				</group>
			))}
			{/* manómetro de diferencia de presión */}
			<group position={[0, 0.95, -0.38]}>
				<mesh rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.13, 0.13, 0.02, 32]} />
					<meshStandardMaterial color="#f1e3c2" />
				</mesh>
				<mesh position={[0, 0, 0.02]} rotation={[0, 0, presion]}>
					<boxGeometry args={[0.008, 0.2, 0.006]} />
					<meshStandardMaterial color={I > 0.95 ? '#3fd0c0' : '#b3262b'} emissive={I > 0.95 ? '#3fd0c0' : '#b3262b'} emissiveIntensity={0.7} />
				</mesh>
			</group>
			{/* cuatro palancas C I A P en primer plano */}
			{['C', 'I', 'A', 'P'].map((k, i) => (
				<group key={k} position={[-0.39 + i * 0.26, 0.05, 0.46]}>
					<Caja p={[0, 0.05, 0]} s={[0.14, 0.1, 0.1]} c="#2a2f35" m={0.6} />
					<group position={[0, 0.1, 0]} rotation={[0.7 - palancas[i] * 1.4, 0, 0]}>
						<Caja p={[0, 0.16, 0]} s={[0.025, 0.32, 0.025]} c="#c9c2b0" m={0.8} r={0.3} />
						<mesh position={[0, 0.33, 0]}>
							<sphereGeometry args={[0.035, 14, 10]} />
							<meshStandardMaterial color={palancas[i] > 0.95 ? '#3fd0c0' : '#b3262b'} />
						</mesh>
					</group>
					<Rotulo txt={k} pos={[0, 0.05, 0.051]} w={0.1} h={0.08} />
				</group>
			))}
		</group>
	);
};

export const PUZLES_3D: Record<string, {C: React.FC<P>; sombras?: boolean}> = {
	sombras: {C: Sombras, sombras: true},
	reflejos: {C: Reflejos},
	dados: {C: Dados, sombras: true},
	ascensor: {C: Ascensor},
	campanas: {C: Campanas},
	esclusa: {C: Esclusa},
};
