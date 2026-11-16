import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Camara, hash, tex} from '../diorama/SalaLastre3D';
import {Cerillas3D, CERILLAS_CENTRO, EstadoCerillas} from './Cerillas3D';

// ENIGMA 60 · Escape room 1 «La torre del archivero». Interior de torre de castillo (kit castillo,
// procedural, three.js MIT; texturas dibujadas en canvas, propias). Todo depende solo del estado.

const W3D = 1280;
const H3D = 720;
export const R = 4.2; // radio interior de la torre
const ALTO = 7.5;
const HUECO = 0.19; // medio ángulo del hueco de la puerta (rad)
type V3 = [number, number, number];

/** Punto en la torre: grados (0 = norte, la puerta; 90 = este), radio y altura. */
export const P = (deg: number, r: number, y: number): V3 => {
	const a = (deg * Math.PI) / 180;
	return [r * Math.sin(a), y, -r * Math.cos(a)];
};
/** Giro en Y para que un objeto en «deg» mire al centro de la torre. */
const mira = (deg: number) => (-deg * Math.PI) / 180;

export const GANCHOS = [-102, -90, -78]; // ganchos 1, 2, 3 (de izquierda a derecha mirando al oeste)
export const ESCUDO_COLOR = {rojo: '#b8322a', azul: '#3a6ad0', verde: '#3a9147'} as const;
export const LOSA: V3 = [-2.85, 0, 0.15];
export const COLUMNA: V3 = [2.35, 0, 0.7]; // eje de la escalera de caracol
export const PELDANOS = 20;
const PASO_ANG = 23;
const PASO_ALTO = 0.17;
const ANG0 = -125;
export const peldano = (k: number): {pos: V3; ang: number} => {
	const ang = ANG0 + (k - 1) * PASO_ANG;
	const a = (ang * Math.PI) / 180;
	return {pos: [COLUMNA[0] + Math.sin(a) * 0.82, k * PASO_ALTO, COLUMNA[2] - Math.cos(a) * 0.82], ang};
};
export const NICHO_DEG = 128;
export const NICHO: V3 = P(NICHO_DEG, R - 0.5, 1.25);
export const GUARDIAS = [-44, -27, 27];
export const MESA_DEG = -142;
export const VENTANA_DEG = -64;
export const CERRADURA: V3 = [0, 1.39, -4.09];

export type EstadoTorre = {
	t: number;
	cam: {pos: V3; mira: V3; fov: number};
	pista: Record<string, number>; // escudos, dintel, criptex, escalera, p13, nicho, g1, g2, g3, puerta, mesa, ventana
	escudos: [number, number, number]; // verde, rojo, azul: 0 en el suelo … 1 en su gancho
	losa: number;
	criptex: number; // sube del suelo 0..1
	anillos: number; // 0 letras al azar … 1 TIEMPO
	tapa: number; // tapa del criptex abierta
	descifrado: number; // dintel: lema cifrado → descifrado
	p13: number; // peldaño 13 hundido
	nicho: number; // losa del nicho levantada
	llave: number; // llave de plata: 0 en el cojín … 1 en la cerradura
	giroLlave: number;
	verdad: number; // ojos de la tercera armadura
	vela: number; // altura restante 1..0
	llama: number; // 1 encendida … 0 apagada
	puerta: number;
	sombra: number;
	libro: number;
	relampago: number;
	gramofono: number;
	antorchas: number;
	cerillas?: EstadoCerillas; // acertijo corto de cerillas, en el suelo
};

// ---------- texturas
const ruidoPiedra = (c: CanvasRenderingContext2D, w: number, h: number, base: [number, number, number], seed: number) => {
	const img = c.getImageData(0, 0, w, h);
	for (let i = 0; i < w * h; i++) {
		const n = hash(i * 0.731 + seed) * 26 - 13;
		img.data[i * 4] = Math.max(0, Math.min(255, img.data[i * 4] + n + base[0] * 0));
		img.data[i * 4 + 1] = Math.max(0, Math.min(255, img.data[i * 4 + 1] + n));
		img.data[i * 4 + 2] = Math.max(0, Math.min(255, img.data[i * 4 + 2] + n));
	}
	c.putImageData(img, 0, 0);
};

const useTexTorre = () =>
	useMemo(() => {
		const piedra = tex(
			512,
			512,
			(c) => {
				c.fillStyle = '#2a2622';
				c.fillRect(0, 0, 512, 512);
				const filas = 8;
				const hF = 512 / filas;
				for (let f = 0; f < filas; f++) {
					let x = f % 2 ? -40 : 0;
					let k = 0;
					while (x < 512) {
						const w = 70 + hash(f * 31 + k * 7) * 60;
						const g = 78 + hash(f * 13 + k * 3) * 34;
						c.fillStyle = `rgb(${g + 6},${g},${g - 8})`;
						c.fillRect(x + 3, f * hF + 3, w - 6, hF - 6);
						c.fillStyle = 'rgba(0,0,0,0.18)';
						c.fillRect(x + 3, f * hF + hF - 12, w - 6, 9);
						x += w;
						k++;
					}
				}
				ruidoPiedra(c, 512, 512, [0, 0, 0], 3);
			},
			[10, 4],
		);
		const madera = tex(
			512,
			512,
			(c) => {
				for (let i = 0; i < 8; i++) {
					const g = 60 + hash(i * 5.3) * 22;
					c.fillStyle = `rgb(${g + 24},${g + 8},${g - 10})`;
					c.fillRect(i * 64, 0, 64, 512);
					c.strokeStyle = 'rgba(20,10,4,0.6)';
					c.lineWidth = 3;
					c.strokeRect(i * 64, -2, 64, 516);
					c.strokeStyle = 'rgba(30,16,6,0.22)';
					c.lineWidth = 1.5;
					for (let v = 0; v < 9; v++) {
						c.beginPath();
						const x0 = i * 64 + 6 + v * 6.5;
						c.moveTo(x0, 0);
						c.bezierCurveTo(x0 + 4, 160, x0 - 4, 340, x0 + 2, 512);
						c.stroke();
					}
				}
				ruidoPiedra(c, 512, 512, [0, 0, 0], 9);
			},
			[3, 3],
		);
		const vitral = tex(256, 512, (c) => {
			c.fillStyle = '#0c0d14';
			c.fillRect(0, 0, 256, 512);
			const cols = ['#5d2a7a', '#2a4f8f', '#8f6a1f', '#22675a', '#7a2a2a', '#3a3f8f'];
			for (let y = 0; y < 512; y += 64)
				for (let x = 0; x < 256; x += 64) {
					c.fillStyle = cols[Math.floor(hash(x * 3 + y * 7) * cols.length)];
					c.beginPath();
					c.moveTo(x + 4, y + 32);
					c.lineTo(x + 32, y + 4);
					c.lineTo(x + 60, y + 32);
					c.lineTo(x + 32, y + 60);
					c.fill();
				}
			c.strokeStyle = '#111';
			c.lineWidth = 6;
			for (let y = 0; y <= 512; y += 64) {
				c.beginPath();
				c.moveTo(0, y);
				c.lineTo(256, y);
				c.stroke();
			}
			c.fillStyle = 'rgba(230,220,160,0.85)';
			c.beginPath();
			c.arc(128, 200, 50, 0, Math.PI * 2);
			c.fill();
			c.fillStyle = '#0c0d14';
			c.font = '700 64px "Fraunces", serif';
			c.textAlign = 'center';
			c.textBaseline = 'middle';
			c.fillText('A', 128, 204);
		});
		const placa = (lineas: string[], ancho = 512, alto = 128, color = '#b08d4a', tinta = '#2a1d0c', tam = 40) =>
			tex(ancho, alto, (c) => {
				c.fillStyle = color;
				c.fillRect(0, 0, ancho, alto);
				c.strokeStyle = tinta;
				c.lineWidth = 6;
				c.strokeRect(8, 8, ancho - 16, alto - 16);
				c.fillStyle = tinta;
				c.font = `700 ${tam}px "Fraunces", serif`;
				c.textAlign = 'center';
				c.textBaseline = 'middle';
				lineas.forEach((l, i) => c.fillText(l, ancho / 2, alto / 2 + (i - (lineas.length - 1) / 2) * tam * 1.15));
			});
		const tallado = (txt: string, color: string, sombra: string) =>
			tex(1024, 160, (c) => {
				c.fillStyle = '#4a443c';
				c.fillRect(0, 0, 1024, 160);
				ruidoPiedra(c, 1024, 160, [0, 0, 0], 17);
				c.font = '800 66px "Fraunces", serif';
				c.textAlign = 'center';
				c.textBaseline = 'middle';
				c.fillStyle = sombra;
				c.fillText(txt, 515, 86);
				c.fillStyle = color;
				c.fillText(txt, 512, 82);
			});
		const numeroPeldano = Array.from({length: PELDANOS}, (_, i) =>
			tex(128, 128, (c) => {
				c.fillStyle = '#6b6156';
				c.fillRect(0, 0, 128, 128);
				ruidoPiedra(c, 128, 128, [0, 0, 0], i * 5 + 1);
				c.fillStyle = '#1e1a16';
				c.font = '800 70px "Fraunces", serif';
				c.textAlign = 'center';
				c.textBaseline = 'middle';
				c.fillText(String(i + 1), 64, 70);
			}),
		);
		const letras = tex(1040, 64, (c) => {
			c.fillStyle = '#8a6a2c';
			c.fillRect(0, 0, 1040, 64);
			c.fillStyle = '#20160a';
			c.font = '800 44px "IBM Plex Mono", monospace';
			c.textAlign = 'center';
			c.textBaseline = 'middle';
			for (let k = 0; k < 26; k++) c.fillText(String.fromCharCode(65 + k), (k + 0.5) * 40, 34);
		});
		const lomo = tex(64, 256, (c) => {
			c.fillStyle = '#ffffff';
			c.fillRect(0, 0, 64, 256);
			c.fillStyle = 'rgba(0,0,0,0.25)';
			c.fillRect(0, 30, 64, 8);
			c.fillRect(0, 210, 64, 8);
			c.fillStyle = 'rgba(210,170,90,0.7)';
			c.fillRect(14, 90, 36, 50);
		});
		const sombra = tex(512, 1024, (c) => {
			c.clearRect(0, 0, 512, 1024);
			c.filter = 'blur(14px)';
			c.fillStyle = 'rgba(0,0,0,0.92)';
			c.beginPath();
			c.ellipse(256, 230, 70, 86, 0, 0, Math.PI * 2);
			c.fill();
			c.beginPath();
			c.moveTo(150, 330);
			c.quadraticCurveTo(256, 290, 362, 330);
			c.lineTo(430, 1024);
			c.lineTo(82, 1024);
			c.closePath();
			c.fill();
			c.beginPath(); // capucha
			c.moveTo(170, 250);
			c.quadraticCurveTo(256, 80, 342, 250);
			c.fill();
		});
		const portada = tex(256, 340, (c) => {
			c.fillStyle = '#3d1f1a';
			c.fillRect(0, 0, 256, 340);
			c.strokeStyle = '#c9a457';
			c.lineWidth = 5;
			c.strokeRect(16, 16, 224, 308);
			c.fillStyle = '#e8c977';
			c.font = '700 46px "Fraunces", serif';
			c.textAlign = 'center';
			c.textBaseline = 'middle';
			c.fillText('MUSEO', 128, 170);
		});
		const cerradura = tex(256, 512, (c) => {
			c.fillStyle = '#3c2a1a';
			c.fillRect(0, 0, 256, 512);
			c.fillStyle = '#7c6a48';
			c.fillRect(24, 200, 208, 150);
			['ORO', 'PLATA', 'HIERRO'].forEach((n, i) => {
				const x = 60 + i * 68;
				c.fillStyle = '#0c0a08';
				c.beginPath();
				c.arc(x, 250, 12, 0, Math.PI * 2);
				c.fill();
				c.fillRect(x - 5, 250, 10, 30);
				c.fillStyle = '#20180e';
				c.font = '700 16px "IBM Plex Mono", monospace';
				c.textAlign = 'center';
				c.fillText(n, x, 315);
			});
			c.strokeStyle = 'rgba(0,0,0,0.5)';
			c.lineWidth = 4;
			for (let y = 0; y < 512; y += 64) {
				c.beginPath();
				c.moveTo(0, y);
				c.lineTo(256, y);
				c.stroke();
			}
		});
		return {
			piedra, madera, vitral, numeroPeldano, letras, lomo, sombra, portada, cerradura,
			cifrado: tallado('HO WLHPSR QR SHUGRQD', '#d9ccb0', 'rgba(0,0,0,0.75)'),
			claro: tallado('EL TIEMPO NO PERDONA', '#7ff1f5', 'rgba(0,0,0,0.6)'),
			placaEscudos: placa(['DEVUELVE CADA ESCUDO', 'A SU SITIO'], 512, 160, '#9a7a3c', '#24180a', 38),
			romano: ['1', '2', '3'].map((n) => placa([n], 128, 128, '#9a7a3c', '#24180a', 72)),
			frases: [
				['LA LLAVE DE ORO', 'ABRE LA PUERTA'],
				['LA LLAVE DE PLATA', 'NO LA ABRE'],
				['LA LLAVE DE ORO', 'NO LA ABRE'],
			].map((l) => placa(l, 512, 256, '#8d8f94', '#15161a', 44)),
			regla: placa(['SOLO UNA DICE LA VERDAD'], 768, 110, '#9a7a3c', '#24180a', 46),
		};
	}, []);
type TT = ReturnType<typeof useTexTorre>;

// ---------- piezas
const Muro: React.FC<{T: TT}> = ({T}) => {
	const geo = useMemo(() => new THREE.CylinderGeometry(R, R, ALTO, 96, 1, true, Math.PI + HUECO, Math.PI * 2 - 2 * HUECO), []);
	const sobre = useMemo(() => new THREE.CylinderGeometry(R, R, ALTO - 2.75, 12, 1, true, Math.PI - HUECO, 2 * HUECO), []);
	return (
		<>
			<mesh geometry={geo} position={[0, ALTO / 2, 0]}>
				<meshStandardMaterial map={T.piedra} side={THREE.BackSide} roughness={0.92} />
			</mesh>
			<mesh geometry={sobre} position={[0, 2.75 + (ALTO - 2.75) / 2, 0]}>
				<meshStandardMaterial map={T.piedra} side={THREE.BackSide} roughness={0.92} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
				<circleGeometry args={[R + 0.05, 72]} />
				<meshStandardMaterial map={T.madera} roughness={0.8} />
			</mesh>
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ALTO, 0]}>
				<circleGeometry args={[R + 0.05, 48]} />
				<meshStandardMaterial color="#120e0b" roughness={1} />
			</mesh>
			{[0, 60, 120].map((d) => (
				<mesh key={d} position={[0, ALTO - 0.4, 0]} rotation={[0, (d * Math.PI) / 180, 0]}>
					<boxGeometry args={[2 * R, 0.25, 0.3]} />
					<meshStandardMaterial color="#2a1c12" roughness={0.9} />
				</mesh>
			))}
			{/* zócalo */}
			<mesh position={[0, 0.12, 0]}>
				<cylinderGeometry args={[R - 0.02, R - 0.02, 0.24, 96, 1, true, Math.PI + HUECO, Math.PI * 2 - 2 * HUECO]} />
				<meshStandardMaterial color="#3a342e" side={THREE.BackSide} roughness={0.9} />
			</mesh>
		</>
	);
};

const Puerta: React.FC<{e: EstadoTorre; T: TT}> = ({e, T}) => {
	const zP = -R * Math.cos(HUECO) - 0.02;
	const ancho = 2 * R * Math.sin(HUECO);
	const brillo = e.pista.puerta ?? 0;
	return (
		<group>
			{/* marco de piedra */}
			{[-1, 1].map((s) => (
				<mesh key={s} position={[s * (ancho / 2 + 0.1), 1.4, zP + 0.05]}>
					<boxGeometry args={[0.24, 2.8, 0.4]} />
					<meshStandardMaterial map={T.piedra} roughness={0.9} />
				</mesh>
			))}
			<mesh position={[0, 2.86, zP + 0.05]}>
				<boxGeometry args={[ancho + 0.44, 0.24, 0.4]} />
				<meshStandardMaterial map={T.piedra} roughness={0.9} />
			</mesh>
			{/* dintel con el lema */}
			<mesh position={[0, 3.35, zP + 0.16]}>
				<planeGeometry args={[2.9, 0.45]} />
				<meshStandardMaterial map={T.cifrado} roughness={0.9} emissive="#3fe0e6" emissiveIntensity={(e.pista.dintel ?? 0) * 0.08} />
			</mesh>
			{e.descifrado > 0.01 && (
				<mesh position={[0, 3.35, zP + 0.17]}>
					<planeGeometry args={[2.9, 0.45]} />
					<meshBasicMaterial map={T.claro} transparent opacity={e.descifrado} toneMapped={false} />
				</mesh>
			)}
			<mesh position={[0, 3.72, zP + 0.16]}>
				<planeGeometry args={[1.9, 0.27]} />
				<meshStandardMaterial map={T.regla} roughness={0.6} metalness={0.3} emissive="#3fe0e6" emissiveIntensity={(e.pista.regla ?? 0) * 0.2} />
			</mesh>
			{/* hoja de la puerta (bisagra a la izquierda, abre hacia fuera) */}
			<group position={[-ancho / 2, 0, zP]} rotation={[0, e.puerta * 1.45, 0]}>
				<mesh position={[ancho / 2, 1.36, 0]}>
					<boxGeometry args={[ancho, 2.72, 0.1]} />
					<meshStandardMaterial map={T.cerradura} roughness={0.75} emissive="#3fe0e6" emissiveIntensity={brillo * 0.12} />
				</mesh>
				{[0.5, 2.2].map((y) => (
					<mesh key={y} position={[ancho / 2, y, 0.06]}>
						<boxGeometry args={[ancho * 0.96, 0.08, 0.02]} />
						<meshStandardMaterial color="#1a1612" metalness={0.6} roughness={0.5} />
					</mesh>
				))}
			</group>
		</group>
	);
};

const SalaOculta: React.FC<{e: EstadoTorre; T: TT}> = ({e, T}) => {
	if (e.puerta < 0.01) return null;
	const z0 = -R - 0.05;
	return (
		<group>
			<mesh position={[0, 1.6, z0 - 1.8]}>
				<boxGeometry args={[3.4, 3.2, 3.6]} />
				<meshStandardMaterial map={T.piedra} side={THREE.BackSide} roughness={0.95} />
			</mesh>
			<mesh position={[0, 1.5, z0 - 3.58]}>
				<planeGeometry args={[1.6, 3.0]} />
				<meshBasicMaterial map={T.sombra} transparent opacity={e.sombra} depthWrite={false} />
			</mesh>
			{/* atril y libro */}
			<group position={[0, 0, z0 - 2.2]}>
				<mesh position={[0, 0.55, 0]}>
					<cylinderGeometry args={[0.06, 0.12, 1.1, 10]} />
					<meshStandardMaterial color="#3a2616" roughness={0.8} />
				</mesh>
				<mesh position={[0, 1.12, 0]} rotation={[0.45, 0, 0]}>
					<boxGeometry args={[0.6, 0.04, 0.45]} />
					<meshStandardMaterial color="#3a2616" roughness={0.8} />
				</mesh>
				<mesh position={[0, 1.16, 0.02]} rotation={[-(Math.PI / 2 - 0.45), 0, 0]}>
					<planeGeometry args={[0.34, 0.45]} />
					<meshStandardMaterial map={T.portada} roughness={0.7} emissive="#7b5cff" emissiveIntensity={e.libro * 0.35} />
				</mesh>
			</group>
			<pointLight position={[0.6, 2.4, z0 - 0.6]} color="#9fb4ff" intensity={6 * e.puerta} distance={6} decay={1.5} />
		</group>
	);
};

const formaEscudo = (() => {
	const s = new THREE.Shape();
	s.moveTo(-0.26, 0.3);
	s.lineTo(0.26, 0.3);
	s.lineTo(0.26, 0.02);
	s.quadraticCurveTo(0.24, -0.25, 0, -0.38);
	s.quadraticCurveTo(-0.24, -0.25, -0.26, 0.02);
	s.closePath();
	return s;
})();
const Escudo: React.FC<{color: string; brillo: number; texto?: THREE.Texture; escala?: number}> = ({color, brillo, texto, escala = 1}) => {
	const geo = useMemo(() => new THREE.ExtrudeGeometry(formaEscudo, {depth: 0.04, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2}), []);
	return (
		<group scale={escala}>
			<mesh geometry={geo} position={[0, 0, -0.02]}>
				<meshStandardMaterial color={color} roughness={0.55} metalness={0.2} emissive={color} emissiveIntensity={0.08 + brillo * (texto ? 0.05 : 0.18)} />
			</mesh>
			{texto ? (
				<mesh position={[0, 0.02, 0.045]}>
					<planeGeometry args={[0.44, 0.22]} />
					<meshStandardMaterial map={texto} roughness={0.5} metalness={0.3} />
				</mesh>
			) : (
				<mesh position={[0, -0.02, 0.045]} rotation={[0, 0, Math.PI / 4]}>
					<boxGeometry args={[0.18, 0.18, 0.02]} />
					<meshStandardMaterial color="#c9a457" metalness={0.7} roughness={0.35} />
				</mesh>
			)}
		</group>
	);
};

const POS_SUELO: {pos: V3; rot: V3}[] = [
	{pos: [-2.7, 0.04, 1.35], rot: [-Math.PI / 2, 0, 0.6]},
	{pos: [-3.25, 0.04, -0.9], rot: [-Math.PI / 2, 0, -0.4]},
	{pos: [-2.25, 0.04, -0.55], rot: [-Math.PI / 2, 0, 2.1]},
];
const PAREDEscudos: React.FC<{e: EstadoTorre; T: TT}> = ({e, T}) => {
	const colores = [ESCUDO_COLOR.verde, ESCUDO_COLOR.rojo, ESCUDO_COLOR.azul];
	const luz = e.pista.escudos ?? 0;
	return (
		<group>
			{GANCHOS.map((d, i) => (
				<group key={d} position={P(d, R - 0.06, 1.95)} rotation={[0, mira(d), 0]}>
					<mesh position={[0, 0.36, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
						<cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
						<meshStandardMaterial color="#2a241c" metalness={0.7} roughness={0.4} />
					</mesh>
					<mesh position={[0, -0.6, 0.01]}>
						<planeGeometry args={[0.2, 0.2]} />
						<meshStandardMaterial map={T.romano[i]} metalness={0.4} roughness={0.5} emissive="#3fe0e6" emissiveIntensity={luz * 0.15} />
					</mesh>
				</group>
			))}
			<group position={P(-90, R - 0.05, 1.0)} rotation={[0, mira(-90), 0]}>
				<mesh>
					<planeGeometry args={[0.9, 0.28]} />
					<meshStandardMaterial map={T.placaEscudos} metalness={0.4} roughness={0.5} />
				</mesh>
			</group>
			{colores.map((c, i) => {
				const f = e.escudos[i];
				const d = GANCHOS[i];
				const dest = P(d, R - 0.12, 1.95);
				const a = POS_SUELO[i];
				const s = f * f * (3 - 2 * f);
				const pos: V3 = [0, 1, 2].map((k) => a.pos[k] + (dest[k] - a.pos[k]) * s + (k === 1 ? Math.sin(Math.PI * s) * 0.5 : 0)) as V3;
				const rot: V3 = [a.rot[0] * (1 - s), a.rot[1] + (mira(d) - a.rot[1]) * s, a.rot[2] * (1 - s)];
				return (
					<group key={c} position={pos} rotation={rot}>
						<Escudo color={c} brillo={luz} escala={1.1} />
					</group>
				);
			})}
		</group>
	);
};

const Criptex: React.FC<{e: EstadoTorre; T: TT}> = ({e, T}) => {
	const palabra = 'TIEMPO';
	const azar = [3, 17, 9, 22, 1, 12];
	const brillo = e.pista.criptex ?? 0;
	const y = -1.25 + e.criptex * 1.6;
	const ring = useMemo(() => {
		const g = new THREE.CylinderGeometry(0.15, 0.15, 0.075, 52, 1, true);
		return g;
	}, []);
	return (
		<group>
			{/* losa: se hunde y se desliza bajo el suelo */}
			<mesh position={[LOSA[0] + Math.max(0, e.losa - 0.4) * 1.5, 0.02 - Math.min(e.losa, 0.4) * 0.3, LOSA[2]]}>
				<boxGeometry args={[0.9, 0.06, 0.9]} />
				<meshStandardMaterial map={T.piedra} roughness={0.9} emissive="#3fe0e6" emissiveIntensity={(e.pista.losa ?? 0) * 0.1} />
			</mesh>
			{e.losa > 0.02 && (
				<mesh position={[LOSA[0], 0.003, LOSA[2]]} rotation={[-Math.PI / 2, 0, 0]}>
					<planeGeometry args={[0.86, 0.86]} />
					<meshBasicMaterial color="#030202" />
				</mesh>
			)}
			{e.criptex > 0.01 && (
				<group position={[LOSA[0], y, LOSA[2]]} rotation={[0, Math.PI / 2 - 0.35, 0]}>
					<mesh position={[0, 0.35, 0]}>
						<cylinderGeometry args={[0.16, 0.2, 0.7, 16]} />
						<meshStandardMaterial map={T.piedra} roughness={0.9} />
					</mesh>
					<group position={[0, 0.72 + 0.03, 0]}>
						{palabra.split('').map((ch, i) => {
							const k = ch.charCodeAt(0) - 65;
							const objetivo = ((k + 0.5) / 26) * Math.PI * 2;
							const inicial = ((azar[i] + 0.5) / 26) * Math.PI * 2;
							const f = Math.max(0, Math.min(1, e.anillos * 6 - i));
							const s = f * f * (3 - 2 * f);
							const ang = inicial + (objetivo + Math.PI * 2 - inicial) * s;
							return (
								<mesh key={i} geometry={ring} position={[0, 0.48 - i * 0.08, 0]} rotation={[0, -ang, 0]}>
									<meshStandardMaterial map={T.letras} metalness={0.55} roughness={0.4} emissive="#3fe0e6" emissiveIntensity={brillo * 0.12 + (f >= 1 ? 0.06 : 0)} />
								</mesh>
							);
						})}
						{[-1, 1].map((sx) => (
							<mesh key={sx} position={[sx * 0.026, 0.28, 0.153]}>
								<planeGeometry args={[0.006, 0.5]} />
								<meshBasicMaterial color="#3fe0e6" transparent opacity={0.5 + 0.5 * e.anillos} toneMapped={false} />
							</mesh>
						))}
						{[0.55, -0.05].map((yy, j) => (
							<mesh key={yy} position={[0, yy + (j === 0 ? e.tapa * 0.16 : 0), 0]}>
								<cylinderGeometry args={[0.165, 0.165, 0.06, 32]} />
								<meshStandardMaterial color="#6e5320" metalness={0.75} roughness={0.35} />
							</mesh>
						))}
					</group>
				</group>
			)}
		</group>
	);
};

const Escalera: React.FC<{e: EstadoTorre; T: TT}> = ({e, T}) => {
	const luz = e.pista.escalera ?? 0;
	const l13 = e.pista.p13 ?? 0;
	const baranda = useMemo(() => {
		const pts = Array.from({length: 60}, (_, i) => {
			const k = 1 + (i / 59) * (PELDANOS - 1);
			const ang = ((ANG0 + (k - 1) * PASO_ANG) * Math.PI) / 180;
			return new THREE.Vector3(COLUMNA[0] + Math.sin(ang) * 1.28, k * PASO_ALTO + 0.95, COLUMNA[2] - Math.cos(ang) * 1.28);
		});
		return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.025, 6, false);
	}, []);
	return (
		<group>
			<mesh position={[COLUMNA[0], 2.3, COLUMNA[2]]}>
				<cylinderGeometry args={[0.24, 0.26, 4.6, 20]} />
				<meshStandardMaterial map={T.piedra} roughness={0.9} />
			</mesh>
			{Array.from({length: PELDANOS}, (_, i) => {
				const k = i + 1;
				const {pos, ang} = peldano(k);
				const hund = k === 13 ? e.p13 * 0.07 : 0;
				const brillo = k === 13 ? Math.max(l13, luz * 0.3) : luz * 0.25;
				return (
					<group key={k} position={[pos[0], pos[1] - hund, pos[2]]} rotation={[0, mira(ang) + Math.PI / 2, 0]}>
						<mesh>
							<boxGeometry args={[1.12, 0.16, 0.42]} />
							<meshStandardMaterial map={T.piedra} roughness={0.9} emissive="#3fe0e6" emissiveIntensity={brillo * 0.08} />
						</mesh>
						<mesh position={[0.25, 0, 0.212]}>
							<planeGeometry args={[0.15, 0.15]} />
							<meshStandardMaterial map={T.numeroPeldano[i]} roughness={0.9} emissive="#3fe0e6" emissiveIntensity={brillo * 0.45} />
						</mesh>
					</group>
				);
			})}
			<mesh geometry={baranda}>
				<meshStandardMaterial color="#2a1e14" roughness={0.6} metalness={0.3} />
			</mesh>
		</group>
	);
};

const Llave: React.FC<{color: string; metal: number}> = ({color, metal}) => (
	<group>
		<mesh position={[0, 0, 0]}>
			<torusGeometry args={[0.045, 0.012, 8, 20]} />
			<meshStandardMaterial color={color} metalness={metal} roughness={0.3} />
		</mesh>
		<mesh position={[0.13, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
			<cylinderGeometry args={[0.008, 0.008, 0.18, 8]} />
			<meshStandardMaterial color={color} metalness={metal} roughness={0.3} />
		</mesh>
		<mesh position={[0.2, -0.02, 0]}>
			<boxGeometry args={[0.03, 0.04, 0.012]} />
			<meshStandardMaterial color={color} metalness={metal} roughness={0.3} />
		</mesh>
	</group>
);
const LLAVES = [
	{color: '#d8b04a', metal: 0.8},
	{color: '#d4d8de', metal: 0.85},
	{color: '#4a4744', metal: 0.6},
];
const Nicho: React.FC<{e: EstadoTorre; T: TT}> = ({e, T}) => {
	const luz = e.pista.nicho ?? 0;
	const rot = mira(NICHO_DEG);
	const s = e.llave * e.llave * (3 - 2 * e.llave);
	return (
		<group>
			<group position={NICHO} rotation={[0, rot, 0]}>
				<mesh position={[0, 0, -0.18]}>
					<boxGeometry args={[0.8, 0.5, 0.36]} />
					<meshStandardMaterial color="#0d0a08" side={THREE.BackSide} roughness={1} />
				</mesh>
				{[[-0.55, 0, 0.3, 1.0], [0.55, 0, 0.3, 1.0], [0, 0.4, 1.4, 0.3], [0, -0.4, 1.4, 0.3]].map(([x, y, w, h]) => (
					<mesh key={`${x}${y}`} position={[x, y, -0.2]}>
						<boxGeometry args={[w, h, 0.45]} />
						<meshStandardMaterial map={T.piedra} roughness={0.9} />
					</mesh>
				))}
				<mesh position={[0, -0.2, -0.16]}>
					<boxGeometry args={[0.62, 0.08, 0.26]} />
					<meshStandardMaterial color="#5a1420" roughness={0.9} />
				</mesh>
				{LLAVES.map((k, i) =>
					i === 1 && e.llave > 0.01 ? null : (
						<group key={i} position={[-0.22 + i * 0.2, -0.15, -0.12]} rotation={[-Math.PI / 2 + 0.3, 0, Math.PI / 2]}>
							<Llave {...k} />
						</group>
					),
				)}
				{e.nicho > 0.01 && <pointLight position={[0, 0.1, 0.1]} color="#ffd9a0" intensity={1.4 * e.nicho} distance={1.4} decay={2} />}
				{/* losa que tapa el nicho */}
				<mesh position={[0, 0.02 + e.nicho * 0.55, 0.06]}>
					<boxGeometry args={[0.84, 0.54, 0.06]} />
					<meshStandardMaterial map={T.piedra} roughness={0.9} emissive="#3fe0e6" emissiveIntensity={luz * 0.1} />
				</mesh>
			</group>
			{e.llave > 0.01 && e.puerta < 0.03 && (() => {
				const a = [0, 1, 2].map((k) => {
					const o = NICHO;
					const dir = [Math.sin((NICHO_DEG * Math.PI) / 180), 0, -Math.cos((NICHO_DEG * Math.PI) / 180)];
					return o[k] - dir[k] * 0.12 + (k === 1 ? -0.15 : 0);
				}) as V3;
				const b: V3 = [CERRADURA[0], CERRADURA[1], CERRADURA[2] + 0.2];
				const pos = [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * s + (k === 1 ? Math.sin(Math.PI * s) * 0.4 : 0)) as V3;
				return (
					<group position={pos} rotation={[0, (Math.PI / 2) * s, e.giroLlave * Math.PI * 0.5, 'ZYX']}>
						<Llave {...LLAVES[1]} />
					</group>
				);
			})()}
		</group>
	);
};

const Armadura: React.FC<{deg: number; i: number; e: EstadoTorre; T: TT}> = ({deg, i, e, T}) => {
	const luz = e.pista[`g${i + 1}`] ?? 0;
	const acero = <meshStandardMaterial color="#8c9198" metalness={0.55} roughness={0.38} emissive="#fff0d8" emissiveIntensity={luz * 0.06} />;
	const ojos = i === 2 ? e.verdad : 0;
	return (
		<group position={P(deg, R - 0.55, 0)} rotation={[0, mira(deg), 0]}>
			<mesh position={[0, 0.06, 0]}>
				<boxGeometry args={[0.6, 0.12, 0.45]} />
				<meshStandardMaterial color="#3b3530" roughness={0.9} />
			</mesh>
			{[-0.1, 0.1].map((x) => (
				<mesh key={x} position={[x, 0.55, 0]}>
					<cylinderGeometry args={[0.065, 0.075, 0.85, 12]} />
					{acero}
				</mesh>
			))}
			<mesh position={[0, 1.25, 0]}>
				<cylinderGeometry args={[0.2, 0.15, 0.62, 16]} />
				{acero}
			</mesh>
			{[-0.27, 0.27].map((x) => (
				<group key={x}>
					<mesh position={[x, 1.48, 0]}>
						<sphereGeometry args={[0.09, 14, 10]} />
						{acero}
					</mesh>
					<mesh position={[x * 1.05, 1.18, 0.05]} rotation={[0.3, 0, 0]}>
						<cylinderGeometry args={[0.05, 0.05, 0.5, 10]} />
						{acero}
					</mesh>
				</group>
			))}
			<mesh position={[0, 1.72, 0]}>
				<sphereGeometry args={[0.13, 18, 14]} />
				{acero}
			</mesh>
			<mesh position={[0, 1.72, 0.1]}>
				<boxGeometry args={[0.16, 0.025, 0.05]} />
				<meshStandardMaterial color="#05070a" emissive="#3fe0e6" emissiveIntensity={ojos * 2.5} toneMapped={ojos < 0.01} />
			</mesh>
			{/* lanza */}
			<mesh position={[0.34, 1.2, 0.08]}>
				<cylinderGeometry args={[0.015, 0.015, 2.4, 6]} />
				<meshStandardMaterial color="#3a2616" roughness={0.8} />
			</mesh>
			<mesh position={[0.34, 2.45, 0.08]}>
				<coneGeometry args={[0.04, 0.16, 6]} />
				{acero}
			</mesh>
			<group position={[0, 1.08, 0.24]}>
				<Escudo color="#5c6068" brillo={luz} texto={T.frases[i]} escala={1.05} />
			</group>
		</group>
	);
};

const Antorcha: React.FC<{deg: number; t: number; v: number; luz: boolean; k: number}> = ({deg, t, v, luz, k}) => {
	const f = 0.85 + 0.15 * Math.sin(t * 13 + k) * Math.sin(t * 7.3 + k * 2) + 0.08 * (hash(Math.floor(t * 18) + k * 100) - 0.5);
	const pos = P(deg, R - 0.18, 2.25);
	return (
		<group>
			<group position={pos} rotation={[0, mira(deg), 0]}>
				<mesh position={[0, -0.12, 0.08]} rotation={[0.35, 0, 0]}>
					<cylinderGeometry args={[0.035, 0.025, 0.42, 8]} />
					<meshStandardMaterial color="#2a1c10" roughness={0.9} />
				</mesh>
				<mesh position={[0, 0.16, 0.15]} scale={[1, f * v, 1]}>
					<coneGeometry args={[0.06, 0.22, 8]} />
					<meshBasicMaterial color="#ffb347" toneMapped={false} />
				</mesh>
				<mesh position={[0, 0.12, 0.15]} scale={[1, f * v, 1]}>
					<coneGeometry args={[0.035, 0.12, 8]} />
					<meshBasicMaterial color="#fff1c2" toneMapped={false} />
				</mesh>
			</group>
			{luz && v > 0.01 && <pointLight position={P(deg, R - 0.55, 2.5)} color="#ff9a3c" intensity={7.5 * f * v} distance={6.5} decay={1.5} />}
		</group>
	);
};

const Mesa: React.FC<{e: EstadoTorre}> = ({e}) => {
	const {t} = e;
	const luz = e.pista.mesa ?? 0;
	const hVela = 0.06 + 0.3 * e.vela;
	const f = 0.9 + 0.1 * Math.sin(t * 17) * Math.sin(t * 5.1) + 0.05 * (hash(Math.floor(t * 20)) - 0.5);
	const madera = <meshStandardMaterial color="#4a2e1a" roughness={0.75} emissive="#3fe0e6" emissiveIntensity={luz * 0.04} />;
	return (
		<group position={P(MESA_DEG, R - 0.95, 0)} rotation={[0, mira(MESA_DEG), 0]}>
			<mesh position={[0, 0.8, 0]}>
				<boxGeometry args={[1.5, 0.07, 0.8]} />
				{madera}
			</mesh>
			{[[-0.68, -0.33], [0.68, -0.33], [-0.68, 0.33], [0.68, 0.33]].map(([x, z]) => (
				<mesh key={`${x}${z}`} position={[x, 0.39, z]}>
					<boxGeometry args={[0.07, 0.78, 0.07]} />
					{madera}
				</mesh>
			))}
			{/* papeles */}
			{[0, 1, 2].map((k) => (
				<mesh key={k} position={[-0.2 + k * 0.12, 0.838 + k * 0.002, 0.1 - k * 0.05]} rotation={[-Math.PI / 2, 0, 0.2 * k - 0.1]}>
					<planeGeometry args={[0.3, 0.4]} />
					<meshStandardMaterial color="#d9cfb2" roughness={0.9} />
				</mesh>
			))}
			{/* vela */}
			<group position={[0.4, 0.835, 0.12]}>
				<mesh position={[0, 0.02, 0]}>
					<cylinderGeometry args={[0.09, 0.1, 0.03, 16]} />
					<meshStandardMaterial color="#8a6a2c" metalness={0.7} roughness={0.35} />
				</mesh>
				<mesh position={[0, 0.035 + hVela / 2, 0]}>
					<cylinderGeometry args={[0.035, 0.038, hVela, 14]} />
					<meshStandardMaterial color="#efe6cf" roughness={0.6} emissive="#ffcf8a" emissiveIntensity={0.25 * e.llama} />
				</mesh>
				{e.llama > 0.01 && (
					<>
						<mesh position={[0, 0.06 + hVela, 0]} scale={[1, f * e.llama, 1]}>
							<coneGeometry args={[0.018, 0.07, 8]} />
							<meshBasicMaterial color="#ffd27a" toneMapped={false} />
						</mesh>
						<pointLight position={[0, 0.16 + hVela, 0]} color="#ffbf6a" intensity={2.6 * f * e.llama} distance={3.5} decay={1.6} />
					</>
				)}
				{e.llama < 0.99 && e.llama > 0 && (
					<mesh position={[0, 0.15 + hVela + (1 - e.llama) * 0.25, 0]}>
						<sphereGeometry args={[0.03 + (1 - e.llama) * 0.06, 8, 6]} />
						<meshBasicMaterial color="#9a9a9a" transparent opacity={0.35 * e.llama} />
					</mesh>
				)}
			</group>
			{/* gramófono */}
			<group position={[-0.42, 0.835, -0.1]}>
				<mesh position={[0, 0.07, 0]}>
					<boxGeometry args={[0.36, 0.14, 0.36]} />
					<meshStandardMaterial color="#3a2010" roughness={0.6} />
				</mesh>
				<mesh position={[0, 0.15, 0]} rotation={[0, t * 3.5 * e.gramofono, 0]}>
					<cylinderGeometry args={[0.15, 0.15, 0.01, 28]} />
					<meshStandardMaterial color="#0d0d0f" roughness={0.3} metalness={0.4} />
				</mesh>
				<mesh position={[0.06, 0.22, -0.08]} rotation={[0.2, 0, -0.9]}>
					<cylinderGeometry args={[0.012, 0.012, 0.2, 6]} />
					<meshStandardMaterial color="#b08d4a" metalness={0.8} roughness={0.3} />
				</mesh>
				<mesh position={[0.2, 0.4, -0.16]} rotation={[0.25, 0, -0.95 + Math.PI]}>
					<coneGeometry args={[0.2, 0.42, 20, 1, true]} />
					<meshStandardMaterial color="#b08d4a" metalness={0.75} roughness={0.32} side={THREE.DoubleSide} />
				</mesh>
			</group>
		</group>
	);
};

const Estanterias: React.FC<{T: TT}> = ({T}) => {
	const ref = React.useRef<THREE.InstancedMesh>(null);
	const arcos = [
		{a: 152, b: 212},
		{a: 48, b: 76},
		{a: -128, b: -112},
	];
	const libros = useMemo(() => {
		const out: {pos: V3; rot: number; s: V3; color: THREE.Color}[] = [];
		const paleta = ['#5a1e1a', '#1e3a5a', '#3a4a22', '#5a4a1e', '#2a1e3a', '#6a5a3a', '#3a1a12', '#22322e'];
		let n = 0;
		for (const arco of arcos)
			for (let d = arco.a; d < arco.b; d += 1.55)
				for (let fila = 0; fila < 8; fila++) {
					n++;
					if (hash(n * 1.7) < 0.08) continue;
					const h = 0.24 + hash(n * 2.3) * 0.12;
					const y = 0.35 + fila * 0.55 + h / 2;
					out.push({
						pos: P(d + 0.6, R - 0.3, y),
						rot: mira(d + 0.6) + (hash(n * 5.1) < 0.06 ? 0.25 : 0),
						s: [0.07 + hash(n * 3.1) * 0.05, h, 0.26],
						color: new THREE.Color(paleta[Math.floor(hash(n * 4.7) * paleta.length)]),
					});
				}
		return out;
	}, []);
	React.useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		const q = new THREE.Quaternion();
		libros.forEach((l, i) => {
			q.setFromEuler(new THREE.Euler(0, l.rot, 0));
			m.compose(new THREE.Vector3(...l.pos), q, new THREE.Vector3(...l.s));
			ref.current?.setMatrixAt(i, m);
			ref.current?.setColorAt(i, l.color);
		});
		if (ref.current) {
			ref.current.instanceMatrix.needsUpdate = true;
			if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
		}
	}, [libros]);
	return (
		<group>
			<instancedMesh ref={ref} args={[undefined, undefined, libros.length]}>
				<boxGeometry args={[1, 1, 1]} />
				<meshStandardMaterial map={T.lomo} roughness={0.85} />
			</instancedMesh>
			{arcos.map((arco) =>
				Array.from({length: 9}, (_, fila) =>
					Array.from({length: Math.ceil((arco.b - arco.a) / 10)}, (_, k) => {
						const d = arco.a + k * 10 + 5;
						return (
							<mesh key={`${arco.a}-${fila}-${k}`} position={P(d, R - 0.3, 0.33 + fila * 0.55)} rotation={[0, mira(d), 0]}>
								<boxGeometry args={[0.75, 0.04, 0.34]} />
								<meshStandardMaterial color="#2e1d10" roughness={0.85} />
							</mesh>
						);
					}),
				),
			)}
		</group>
	);
};

const Ventana: React.FC<{e: EstadoTorre; T: TT}> = ({e, T}) => (
	<group position={P(VENTANA_DEG, R - 0.04, 3.1)} rotation={[0, mira(VENTANA_DEG), 0]}>
		<mesh>
			<planeGeometry args={[0.85, 1.7]} />
			<meshBasicMaterial map={T.vitral} color={new THREE.Color(0.25 + 1.6 * e.relampago, 0.25 + 1.6 * e.relampago, 0.3 + 1.7 * e.relampago)} toneMapped={false} />
		</mesh>
		<mesh position={[0, 0.85, 0]}>
			<circleGeometry args={[0.425, 24, 0, Math.PI]} />
			<meshBasicMaterial map={T.vitral} color={new THREE.Color(0.2 + 1.4 * e.relampago, 0.2 + 1.4 * e.relampago, 0.28 + 1.5 * e.relampago)} toneMapped={false} />
		</mesh>
	</group>
);

const Polvo: React.FC<{t: number}> = ({t}) => {
	const ref = React.useRef<THREE.InstancedMesh>(null);
	const n = 260;
	React.useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		for (let i = 0; i < n; i++) {
			const a = hash(i * 1.3) * Math.PI * 2;
			const r = Math.sqrt(hash(i * 2.9)) * (R - 0.4);
			const y = ((hash(i * 2.1) * 4.5 + t * (0.02 + hash(i * 6.1) * 0.03)) % 4.5) + 0.2;
			const s = 0.004 + hash(i * 4.1) * 0.005;
			m.makeScale(s, s, s);
			m.setPosition(Math.sin(a) * r + Math.sin(t * 0.2 + i) * 0.1, y, -Math.cos(a) * r);
			ref.current?.setMatrixAt(i, m);
		}
		if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
	}, [t]);
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, n]}>
			<sphereGeometry args={[1, 6, 4]} />
			<meshBasicMaterial color="#ffdcb0" transparent opacity={0.45} />
		</instancedMesh>
	);
};

export const TorreArchivero3D: React.FC<{e: EstadoTorre; ancho?: number; alto?: number; escala?: number}> = ({e, ancho = W3D, alto = H3D, escala = 1920 / W3D}) => {
	const T = useTexTorre();
	const {t} = e;
	const pistaTarget = useMemo(() => new THREE.Object3D(), []);
	const OBJ: Record<string, V3> = {
		escudos: P(-90, R - 0.2, 1.8), losa: [LOSA[0], 0, LOSA[2]], criptex: [LOSA[0], 1.0, LOSA[2]], dintel: [0, 3.35, -4.1], regla: [0, 3.72, -4.1],
		escalera: [COLUMNA[0], 1.4, COLUMNA[2]], p13: peldano(13).pos, nicho: NICHO, puerta: [0, 1.3, -4.1],
		g1: P(GUARDIAS[0], R - 0.6, 1.3), g2: P(GUARDIAS[1], R - 0.6, 1.3), g3: P(GUARDIAS[2], R - 0.6, 1.3), mesa: P(MESA_DEG, R - 0.95, 0.9), ventana: P(VENTANA_DEG, R, 3), cerillas: CERILLAS_CENTRO,
	};
	let clave = 'puerta';
	let luzPista = 0;
	for (const [k, v] of Object.entries(e.pista)) if (v > luzPista && OBJ[k]) [clave, luzPista] = [k, v];
	const objetivo = OBJ[clave];
	pistaTarget.position.set(...objetivo);
	pistaTarget.updateMatrixWorld();
	const rayo = useMemo(() => new THREE.Object3D(), []);
	rayo.position.set(0, 0.5, 0);
	rayo.updateMatrixWorld();

	return (
		<ThreeCanvas width={ancho} height={alto} style={{position: 'absolute', left: 0, top: 0, transform: `scale(${escala})`, transformOrigin: '0 0'}} camera={{fov: 50, position: [0, 1.6, 3]}} gl={{antialias: true}}>
			<Camara c={e.cam} />
			<color attach="background" args={['#0a0807']} />
			<fogExp2 attach="fog" args={['#0c0907', 0.045]} />
			<hemisphereLight args={['#7a6248', '#120c08', 0.8 + 0.6 * e.relampago]} />
			<pointLight position={[e.cam.pos[0], e.cam.pos[1] + 0.2, e.cam.pos[2]]} color="#ffd6a8" intensity={1.1} distance={4.5} decay={1.7} />
			{e.relampago > 0.01 && (
				<spotLight position={P(VENTANA_DEG, R + 0.5, 3.4)} target={rayo} color="#c9d8ff" intensity={60 * e.relampago} angle={0.75} penumbra={0.6} distance={12} decay={1.2} />
			)}
			{luzPista > 0.01 && (
				<spotLight position={[objetivo[0] * 0.35, 4.2, objetivo[2] * 0.35]} target={pistaTarget} color="#fff0d8" intensity={9 * luzPista} angle={0.22} penumbra={0.5} distance={9} decay={1.3} />
			)}
			<Muro T={T} />
			<Puerta e={e} T={T} />
			<SalaOculta e={e} T={T} />
			<PAREDEscudos e={e} T={T} />
			<Criptex e={e} T={T} />
			<Escalera e={e} T={T} />
			<Nicho e={e} T={T} />
			{GUARDIAS.map((d, i) => (
				<Armadura key={d} deg={d} i={i} e={e} T={T} />
			))}
			<Mesa e={e} />
			{e.cerillas && <Cerillas3D c={e.cerillas} />}
			<Estanterias T={T} />
			<Ventana e={e} T={T} />
			{[-112, 58, 180, -20].map((d, k) => (
				<Antorcha key={d} deg={d} t={t} v={e.antorchas} luz={k < 4} k={k} />
			))}
			<Polvo t={t} />
		</ThreeCanvas>
	);
};
