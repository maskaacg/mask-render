import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Camara, hash, tex} from '../diorama/SalaLastre3D';

// ENIGMA 60 · Escape room 2 «El museo que miente». Museo de noche: cinco salas en fila a lo largo de −Z
// (vestíbulo, monedas, pintura, egipcia y salida) y la calle. Procedural (three.js MIT); texturas dibujadas
// en canvas, propias. Todo depende solo del estado.

const W3D = 1280;
const H3D = 720;
type V3 = [number, number, number];
export const ANCHO = 4.6; // medio ancho de las salas
const ALTO = 4.6;
/** Límites en z de cada sala (la puerta entre salas está en el límite). */
export const SALA = {vestibulo: [0, -6], monedas: [-6, -12], pintura: [-12, -18], egipcia: [-18, -24], salida: [-24, -28]} as const;
export const VITRINAS_X = [-1.7, 0, 1.7];
export const VITRINA_Z = -10.2;
/** Contenido real de cada vitrina (0: placa «Oro», 1: «Plata», 2: «Oro y plata»). */
export const CONTENIDO = ['mixta', 'oro', 'plata'] as const;
export const PLACAS = ['MONEDAS DE ORO', 'MONEDAS DE PLATA', 'ORO Y PLATA'];
/** A qué vitrina va cada placa cuando se colocan bien. */
export const PLACA_DESTINO = [1, 2, 0];
/** Retrato grande en la pared izquierda de la pinacoteca (mira hacia +x). */
export const RETRATO: V3 = [-ANCHO + 0.1, 2.0, -15];
const RETRATO_BASE: V3 = [-ANCHO, 0, -15];
export const BALANZA: V3 = [2.3, 0, -20.6];
export const GATOS_Z = -22.3;
export const gatoX = (i: number) => -2.1 + i * 0.6;
export const GATO_FALSO = 5;
export const PUERTAS_X = [-1.4, 1.4];
export const VIGILANTES_X = [-2.55, 2.55];
export const ESCAPARATE: V3 = [3.1, 1.7, -28.35];
export const RELOJ: V3 = [-ANCHO + 0.35, 0, -3.2];

export type EstadoMuseo = {
	t: number;
	cam: {pos: V3; mira: V3; fov: number};
	pista: Record<string, number>; // reloj, vitrinas, v0..v2, retrato, placaRetrato, caja, gatos, balanza, v1g, v2g, puertas, cartel, escaparate
	minutos: number; // 0..30 (reloj de pie)
	luces: [number, number, number, number, number]; // luz de cada sala 0..1
	rejas: [number, number, number, number]; // 0 cerrada … 1 abierta (vestíbulo→monedas, →pintura, →egipcia, →salida)
	moneda: number; // moneda de plata que sale de la vitrina 2
	panos: number; // paños negros retirados
	placas: number; // placas recolocadas
	retrato: number; // el cuadro se abre como una puerta
	ruedas: number; // ruedas de la caja fuerte → 1 8 8 9
	caja: number; // puerta de la caja fuerte
	balanza: number; // −1..1 inclinación
	dial: number; // marca «2» en la balanza
	gatoRoto: number;
	mapa: number;
	cabezas: number; // los vigilantes giran la cabeza
	verdad: number; // ojos del vigilante sincero
	puerta: number; // puerta derecha abierta
	calle: number; // ya en la calle
	alarma: number; // luz roja
	escaparate: number;
	luna: number;
};

const ruido = (c: CanvasRenderingContext2D, w: number, h: number, a: number, seed: number) => {
	const img = c.getImageData(0, 0, w, h);
	for (let i = 0; i < w * h; i++) {
		const n = (hash(i * 0.731 + seed) - 0.5) * a;
		for (let k = 0; k < 3; k++) img.data[i * 4 + k] = Math.max(0, Math.min(255, img.data[i * 4 + k] + n));
	}
	c.putImageData(img, 0, 0);
};

const texto = (w: number, h: number, fondo: string, color: string, lineas: {t: string; size: number; y: number; font?: string; tachado?: boolean; color?: string}[], borde?: string) =>
	tex(w, h, (c) => {
		c.fillStyle = fondo;
		c.fillRect(0, 0, w, h);
		if (borde) {
			c.strokeStyle = borde;
			c.lineWidth = Math.max(4, w / 60);
			c.strokeRect(c.lineWidth, c.lineWidth, w - 2 * c.lineWidth, h - 2 * c.lineWidth);
		}
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		for (const l of lineas) {
			c.fillStyle = l.color ?? color;
			c.font = `${l.font ?? '700'} ${l.size}px Georgia, serif`;
			c.fillText(l.t, w / 2, l.y);
			if (l.tachado) {
				const m = c.measureText(l.t).width;
				c.strokeStyle = '#7a1010';
				c.lineWidth = l.size / 9;
				c.beginPath();
				c.moveTo(w / 2 - m / 2 - 8, l.y + 4);
				c.lineTo(w / 2 + m / 2 + 8, l.y - 6);
				c.stroke();
			}
		}
	});

const useTexMuseo = () =>
	useMemo(() => {
		const marmol = tex(
			512,
			512,
			(c) => {
				for (let y = 0; y < 4; y++)
					for (let x = 0; x < 4; x++) {
						c.fillStyle = (x + y) % 2 ? '#2b2a2e' : '#cdc6b6';
						c.fillRect(x * 128, y * 128, 128, 128);
					}
				c.strokeStyle = 'rgba(120,110,100,0.35)';
				for (let k = 0; k < 40; k++) {
					c.lineWidth = 0.6 + hash(k) * 1.4;
					c.beginPath();
					let x = hash(k * 3) * 512;
					let y = hash(k * 5) * 512;
					c.moveTo(x, y);
					for (let s = 0; s < 6; s++) {
						x += (hash(k * 7 + s) - 0.5) * 120;
						y += (hash(k * 11 + s) - 0.3) * 90;
						c.lineTo(x, y);
					}
					c.stroke();
				}
				ruido(c, 512, 512, 14, 2);
			},
			[6, 7],
		);
		const pared = (base: string, motivo: string) =>
			tex(
				256,
				256,
				(c) => {
					c.fillStyle = base;
					c.fillRect(0, 0, 256, 256);
					c.fillStyle = motivo;
					for (let y = 0; y < 4; y++)
						for (let x = 0; x < 4; x++) {
							const cx = x * 64 + (y % 2 ? 32 : 0) + 16;
							const cy = y * 64 + 32;
							c.beginPath();
							c.moveTo(cx, cy - 16);
							c.quadraticCurveTo(cx + 12, cy, cx, cy + 16);
							c.quadraticCurveTo(cx - 12, cy, cx, cy - 16);
							c.fill();
						}
					ruido(c, 256, 256, 10, 7);
				},
				[8, 3],
			);
		const jeroglificos = tex(
			512,
			512,
			(c) => {
				c.fillStyle = '#b89463';
				c.fillRect(0, 0, 512, 512);
				ruido(c, 512, 512, 22, 4);
				c.strokeStyle = '#5a3c1c';
				c.fillStyle = '#5a3c1c';
				c.lineWidth = 3;
				for (let col = 0; col < 8; col++) {
					c.beginPath();
					c.moveTo(col * 64 + 2, 0);
					c.lineTo(col * 64 + 2, 512);
					c.stroke();
					for (let r = 0; r < 8; r++) {
						const x = col * 64 + 32;
						const y = r * 64 + 32;
						const k = Math.floor(hash(col * 17 + r * 3) * 6);
						c.beginPath();
						if (k === 0) {
							// ojo
							c.ellipse(x, y, 16, 8, 0, 0, Math.PI * 2);
							c.stroke();
							c.beginPath();
							c.arc(x, y, 4, 0, Math.PI * 2);
							c.fill();
						} else if (k === 1) {
							// pájaro
							c.moveTo(x - 14, y + 10);
							c.lineTo(x - 4, y - 8);
							c.lineTo(x + 12, y - 4);
							c.lineTo(x + 4, y + 2);
							c.lineTo(x + 8, y + 14);
							c.stroke();
						} else if (k === 2) {
							// agua
							c.moveTo(x - 16, y);
							for (let s = 0; s < 4; s++) c.lineTo(x - 12 + s * 8, y + (s % 2 ? -6 : 6));
							c.stroke();
						} else if (k === 3) {
							// ankh
							c.ellipse(x, y - 8, 6, 8, 0, 0, Math.PI * 2);
							c.moveTo(x, y);
							c.lineTo(x, y + 16);
							c.moveTo(x - 10, y + 3);
							c.lineTo(x + 10, y + 3);
							c.stroke();
						} else if (k === 4) {
							c.arc(x, y, 12, Math.PI, 0);
							c.stroke();
						} else {
							c.rect(x - 10, y - 10, 20, 20);
							c.stroke();
						}
					}
				}
			},
			[4, 1.2],
		);
		const paisaje = (k: number) =>
			tex(256, 200, (c) => {
				const cielos = [['#2a3a5c', '#c98a4a'], ['#16303a', '#7aa0a0'], ['#3a2030', '#d0a070'], ['#1e2a1a', '#8aa06a'], ['#0f1830', '#5a6aa0'], ['#402818', '#e0b070']];
				const [a, b] = cielos[k % cielos.length];
				const g = c.createLinearGradient(0, 0, 0, 200);
				g.addColorStop(0, a);
				g.addColorStop(1, b);
				c.fillStyle = g;
				c.fillRect(0, 0, 256, 200);
				for (let capa = 0; capa < 3; capa++) {
					c.fillStyle = `rgba(${20 + capa * 15},${25 + capa * 12},${20 + capa * 8},0.9)`;
					c.beginPath();
					c.moveTo(0, 200);
					for (let x = 0; x <= 256; x += 16) c.lineTo(x, 110 + capa * 28 + Math.sin(x * 0.03 + k * 2 + capa) * 18 + hash(x + k * 40 + capa) * 10);
					c.lineTo(256, 200);
					c.fill();
				}
				ruido(c, 256, 200, 18, k);
			});
		const retrato = tex(400, 520, (c) => {
			const g = c.createRadialGradient(200, 200, 40, 200, 260, 320);
			g.addColorStop(0, '#5a4630');
			g.addColorStop(1, '#1a120c');
			c.fillStyle = g;
			c.fillRect(0, 0, 400, 520);
			// chaqueta
			c.fillStyle = '#16141a';
			c.beginPath();
			c.moveTo(60, 520);
			c.quadraticCurveTo(80, 330, 200, 320);
			c.quadraticCurveTo(320, 330, 340, 520);
			c.fill();
			c.fillStyle = '#e8e0d0';
			c.beginPath();
			c.moveTo(175, 330);
			c.lineTo(200, 400);
			c.lineTo(225, 330);
			c.fill();
			// cara
			c.fillStyle = '#c99a78';
			c.beginPath();
			c.ellipse(200, 220, 68, 90, 0, 0, Math.PI * 2);
			c.fill();
			c.fillStyle = '#2a1c14';
			c.beginPath();
			c.ellipse(200, 150, 72, 40, 0, Math.PI, 0);
			c.fill();
			// ojos y bigote
			c.fillStyle = '#1a120c';
			[170, 230].forEach((x) => {
				c.beginPath();
				c.ellipse(x, 212, 8, 5, 0, 0, Math.PI * 2);
				c.fill();
			});
			c.beginPath();
			c.moveTo(200, 248);
			c.quadraticCurveTo(170, 240, 150, 256);
			c.quadraticCurveTo(138, 250, 140, 240);
			c.quadraticCurveTo(150, 268, 200, 262);
			c.quadraticCurveTo(250, 268, 260, 240);
			c.quadraticCurveTo(262, 250, 250, 256);
			c.quadraticCurveTo(230, 240, 200, 248);
			c.fill();
			c.fillStyle = '#8a4a3a';
			c.fillRect(186, 276, 28, 5);
			// reloj de bolsillo
			c.fillStyle = '#d4b04a';
			c.beginPath();
			c.arc(270, 440, 22, 0, Math.PI * 2);
			c.fill();
			c.strokeStyle = '#d4b04a';
			c.lineWidth = 3;
			c.beginPath();
			c.moveTo(250, 432);
			c.quadraticCurveTo(220, 400, 205, 410);
			c.stroke();
			ruido(c, 400, 520, 20, 9);
		});
		const visitante = tex(400, 520, (c) => {
			c.fillStyle = '#1c2230';
			c.fillRect(0, 0, 400, 520);
			const g = c.createRadialGradient(200, 230, 20, 200, 260, 260);
			g.addColorStop(0, 'rgba(120,140,190,0.35)');
			g.addColorStop(1, 'rgba(0,0,0,0)');
			c.fillStyle = g;
			c.fillRect(0, 0, 400, 520);
			c.fillStyle = '#05070c';
			c.beginPath();
			c.ellipse(200, 210, 64, 82, 0, 0, Math.PI * 2);
			c.fill();
			c.beginPath();
			c.moveTo(70, 520);
			c.quadraticCurveTo(90, 320, 200, 310);
			c.quadraticCurveTo(310, 320, 330, 520);
			c.fill();
			c.fillStyle = 'rgba(200,210,230,0.5)';
			c.font = '700 120px Georgia, serif';
			c.textAlign = 'center';
			c.fillText('?', 200, 250);
		});
		const mapa = tex(256, 256, (c) => {
			c.fillStyle = '#d9c39a';
			c.fillRect(0, 0, 256, 256);
			ruido(c, 256, 256, 26, 3);
			c.strokeStyle = '#4a2e14';
			c.lineWidth = 4;
			[[40, 30, 176, 40], [40, 75, 176, 40], [40, 120, 176, 40], [40, 165, 176, 40]].forEach(([x, y, w, h]) => c.strokeRect(x, y, w, h));
			c.strokeStyle = '#a01010';
			c.lineWidth = 5;
			c.beginPath();
			c.moveTo(128, 50);
			c.lineTo(128, 215);
			c.stroke();
			c.beginPath();
			c.moveTo(118, 205);
			c.lineTo(128, 225);
			c.lineTo(138, 205);
			c.stroke();
			c.fillStyle = '#a01010';
			c.font = '700 22px Georgia, serif';
			c.textAlign = 'center';
			c.fillText('SALIDA', 128, 244);
		});
		const placas = PLACAS.map((p) => texto(512, 128, '#c9a24a', '#2a1a08', [{t: p, size: 50, y: 66}], '#7a5a1a'));
		const placaRetrato = texto(512, 200, '#c9a24a', '#2a1a08', [
			{t: 'RETRATO DE CABALLERO · 1999', size: 40, y: 56, tachado: true},
			{t: 'MDCCCLXXXIX', size: 62, y: 140, font: 'italic 700', color: '#3a2410'},
		], '#7a5a1a');
		const cartelSalida = texto(512, 160, '#0e3a22', '#7dffb0', [{t: 'SALIDA →', size: 92, y: 84, font: '800'}]);
		cartelSalida.anisotropy = 8;
		const placaVisitante = texto(768, 128, '#c9a24a', '#2a1a08', [{t: 'EL VISITANTE QUE NO SALIÓ', size: 46, y: 66}], '#7a5a1a');
		const frases = [
			texto(512, 220, '#efe6d0', '#1a1a20', [{t: '«Al menos uno de', size: 44, y: 80}, {t: 'los dos miente»', size: 44, y: 140}], '#1a1a20'),
			texto(512, 220, '#efe6d0', '#1a1a20', [{t: '«La salida es la', size: 44, y: 80}, {t: 'puerta izquierda»', size: 44, y: 140}], '#1a1a20'),
		];
		const esfera = tex(256, 256, (c) => {
			c.fillStyle = '#efe6d0';
			c.beginPath();
			c.arc(128, 128, 124, 0, Math.PI * 2);
			c.fill();
			c.fillStyle = '#1a1410';
			c.font = '700 26px Georgia, serif';
			c.textAlign = 'center';
			c.textBaseline = 'middle';
			['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((r, i) => {
				const a = (i / 12) * Math.PI * 2;
				c.fillText(r, 128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100);
			});
		});
		const dial = texto(256, 128, '#1a1410', '#e8d8a8', [{t: '1 · 2 · 3', size: 48, y: 64}]);
		return {
			marmol, jeroglificos, esfera, mapa, retrato, visitante, placas, placaRetrato, cartelSalida, placaVisitante, frases, dial,
			paisajes: Array.from({length: 6}, (_, k) => paisaje(k)),
			paredes: [pared('#d8cfbd', 'rgba(150,130,100,0.18)'), pared('#1f3b3a', 'rgba(180,160,90,0.16)'), pared('#5a1a20', 'rgba(210,170,90,0.14)'), pared('#b89463', 'rgba(0,0,0,0)'), pared('#1c2438', 'rgba(180,170,120,0.12)')],
		};
	}, []);
type TM = ReturnType<typeof useTexMuseo>;

const Oro = () => <meshStandardMaterial color="#c9a24a" metalness={0.8} roughness={0.32} />;

// ---------- arquitectura
const Salas: React.FC<{e: EstadoMuseo; T: TM}> = ({e, T}) => {
	const zs = Object.values(SALA);
	return (
		<group>
			{/* suelo y techo */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -14]}>
				<planeGeometry args={[ANCHO * 2, 28]} />
				<meshStandardMaterial map={T.marmol} roughness={0.35} metalness={0.1} />
			</mesh>
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ALTO, -14]}>
				<planeGeometry args={[ANCHO * 2, 28]} />
				<meshStandardMaterial color="#121014" roughness={0.95} />
			</mesh>
			{/* suelo de arena en la sala egipcia */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -21]}>
				<planeGeometry args={[ANCHO * 2, 6]} />
				<meshStandardMaterial color="#9a7a4c" roughness={1} />
			</mesh>
			{zs.map(([z0, z1], i) => {
				const lado = <meshStandardMaterial map={i === 3 ? T.jeroglificos : T.paredes[i]} roughness={0.9} />;
				const largo = z0 - z1;
				return (
					<group key={i}>
						{[-1, 1].map((s) => (
							<mesh key={s} position={[s * ANCHO, ALTO / 2, (z0 + z1) / 2]} rotation={[0, -s * (Math.PI / 2), 0]}>
								<planeGeometry args={[largo, ALTO]} />
								{lado}
							</mesh>
						))}
						{/* zócalo */}
						{[-1, 1].map((s) => (
							<mesh key={`z${s}`} position={[s * (ANCHO - 0.03), 0.15, (z0 + z1) / 2]}>
								<boxGeometry args={[0.06, 0.3, largo]} />
								<meshStandardMaterial color="#2a2018" roughness={0.6} />
							</mesh>
						))}
					</group>
				);
			})}
			{/* tabiques con arco entre salas */}
			{[-6, -12, -18, -24].map((z, i) => (
				<group key={z}>
					{[-1, 1].map((s) => (
						<mesh key={s} position={[s * (ANCHO + 1.1) / 2, ALTO / 2, z]}>
							<boxGeometry args={[ANCHO - 1.1, ALTO, 0.3]} />
							<meshStandardMaterial map={T.paredes[i]} roughness={0.9} />
						</mesh>
					))}
					<mesh position={[0, (ALTO + 2.8) / 2, z]}>
						<boxGeometry args={[2.2, ALTO - 2.8, 0.3]} />
						<meshStandardMaterial map={T.paredes[i]} roughness={0.9} />
					</mesh>
					{/* marco dorado */}
					{[-1.12, 1.12].map((x) => (
						<mesh key={x} position={[x, 1.4, z + 0.16]}>
							<boxGeometry args={[0.1, 2.8, 0.06]} />
							<Oro />
						</mesh>
					))}
					<mesh position={[0, 2.82, z + 0.16]}>
						<boxGeometry args={[2.34, 0.1, 0.06]} />
						<Oro />
					</mesh>
					{/* reja que sube al abrirse */}
					<group position={[0, 1.4 + 2.7 * e.rejas[i], z]}>
						{Array.from({length: 9}, (_, k) => (
							<mesh key={k} position={[-1 + k * 0.25, 0, 0]}>
								<cylinderGeometry args={[0.02, 0.02, 2.8, 6]} />
								<meshStandardMaterial color="#1a1a1c" metalness={0.7} roughness={0.4} />
							</mesh>
						))}
						{[-1.2, 0, 1.2].map((y) => (
							<mesh key={y} position={[0, y, 0]}>
								<boxGeometry args={[2.1, 0.05, 0.05]} />
								<meshStandardMaterial color="#1a1a1c" metalness={0.7} roughness={0.4} />
							</mesh>
						))}
					</group>
				</group>
			))}
		</group>
	);
};

// ---------- vestíbulo
const Cupula: React.FC<{e: EstadoMuseo}> = ({e}) => (
	<group position={[0, ALTO - 0.01, -3]}>
		<mesh rotation={[Math.PI / 2, 0, 0]}>
			<circleGeometry args={[1.6, 40]} />
			<meshBasicMaterial color={new THREE.Color('#5a74b8').multiplyScalar(0.35 + 0.5 * e.luna)} toneMapped={false} />
		</mesh>
		{Array.from({length: 8}, (_, k) => (
			<mesh key={k} rotation={[Math.PI / 2, 0, (k * Math.PI) / 8]} position={[0, -0.01, 0]}>
				<planeGeometry args={[3.2, 0.04]} />
				<meshBasicMaterial color="#0c0c10" />
			</mesh>
		))}
	</group>
);

const Columnas: React.FC = () => (
	<group>
		{[
			[-2.6, -1.2],
			[2.6, -1.2],
			[-2.6, -4.8],
			[2.6, -4.8],
		].map(([x, z]) => (
			<group key={`${x}${z}`} position={[x, 0, z]}>
				<mesh position={[0, ALTO / 2, 0]}>
					<cylinderGeometry args={[0.24, 0.27, ALTO, 20]} />
					<meshStandardMaterial color="#d8d0c0" roughness={0.45} />
				</mesh>
				<mesh position={[0, 0.12, 0]}>
					<boxGeometry args={[0.7, 0.24, 0.7]} />
					<meshStandardMaterial color="#c8bfae" roughness={0.5} />
				</mesh>
				<mesh position={[0, ALTO - 0.12, 0]}>
					<boxGeometry args={[0.7, 0.24, 0.7]} />
					<meshStandardMaterial color="#c8bfae" roughness={0.5} />
				</mesh>
			</group>
		))}
		{/* cordones de terciopelo */}
		{[-1, 1].map((s) => (
			<group key={s}>
				{[-1.6, -4.4].map((z) => (
					<group key={z} position={[s * 1.4, 0, z]}>
						<mesh position={[0, 0.48, 0]}>
							<cylinderGeometry args={[0.03, 0.05, 0.96, 10]} />
							<Oro />
						</mesh>
						<mesh position={[0, 0.98, 0]}>
							<sphereGeometry args={[0.055, 12, 10]} />
							<Oro />
						</mesh>
					</group>
				))}
				<mesh position={[s * 1.4, 0.86, -3]} rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.025, 0.025, 2.8, 8]} />
					<meshStandardMaterial color="#8a1418" roughness={0.7} />
				</mesh>
			</group>
		))}
	</group>
);

const RelojPie: React.FC<{e: EstadoMuseo; T: TM}> = ({e, T}) => {
	const luz = e.pista.reloj ?? 0;
	const ang = (m: number) => -(m / 60) * Math.PI * 2;
	const pend = Math.sin(e.t * Math.PI) * 0.22;
	const madera = <meshStandardMaterial color="#3a2214" roughness={0.55} emissive="#fff0d8" emissiveIntensity={luz * 0.05} />;
	return (
		<group position={RELOJ} rotation={[0, Math.PI / 2, 0]}>
			<mesh position={[0, 1.1, 0]}>
				<boxGeometry args={[0.7, 2.2, 0.4]} />
				{madera}
			</mesh>
			<mesh position={[0, 2.5, 0]}>
				<boxGeometry args={[0.85, 0.75, 0.45]} />
				{madera}
			</mesh>
			<mesh position={[0, 2.95, 0]}>
				<coneGeometry args={[0.5, 0.25, 4]} />
				{madera}
			</mesh>
			<mesh position={[0, 2.5, 0.231]}>
				<circleGeometry args={[0.3, 40]} />
				<meshStandardMaterial map={T.esfera} roughness={0.5} emissive="#fff0d0" emissiveMap={T.esfera} emissiveIntensity={0.08 + 0.3 * luz} />
			</mesh>
			{/* agujas: la hora fija en las 12, el minutero avanza */}
			<mesh position={[0, 2.59, 0.24]} rotation={[0, 0, 0]}>
				<planeGeometry args={[0.026, 0.18]} />
				<meshBasicMaterial color="#111" side={THREE.DoubleSide} />
			</mesh>
			<group position={[0, 2.5, 0.245]} rotation={[0, 0, ang(e.minutos)]}>
				<mesh position={[0, 0.12, 0]}>
					<planeGeometry args={[0.018, 0.26]} />
					<meshBasicMaterial color="#111" side={THREE.DoubleSide} />
				</mesh>
			</group>
			<group position={[0, 2.5, 0.25]}>
				<mesh position={[0, -0.18, 0]} rotation={[0, 0, 0]}>
					<planeGeometry args={[0.04, 0.04]} />
					<meshBasicMaterial color="#111" />
				</mesh>
			</group>
			{/* ventana del péndulo */}
			<mesh position={[0, 1.2, 0.205]}>
				<planeGeometry args={[0.42, 1.2]} />
				<meshStandardMaterial color="#120a06" roughness={0.3} />
			</mesh>
			<group position={[0, 1.78, 0.21]} rotation={[0, 0, pend]}>
				<mesh position={[0, -0.4, 0]}>
					<planeGeometry args={[0.02, 0.8]} />
					<meshStandardMaterial color="#c9a24a" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
				</mesh>
				<mesh position={[0, -0.85, 0.01]}>
					<circleGeometry args={[0.09, 24]} />
					<meshStandardMaterial color="#d4b04a" metalness={0.85} roughness={0.25} />
				</mesh>
			</group>
		</group>
	);
};

const Cuadro: React.FC<{pos: V3; rotY: number; w: number; h: number; map: THREE.Texture; luz?: number; brillo?: number}> = ({pos, rotY, w, h, map, luz = 0, brillo = 0.12}) => (
	<group position={pos} rotation={[0, rotY, 0]}>
		<mesh position={[0, 0, -0.02]}>
			<boxGeometry args={[w + 0.22, h + 0.22, 0.08]} />
			<meshStandardMaterial color="#b08a34" metalness={0.75} roughness={0.35} emissive="#fff0d8" emissiveIntensity={luz * 0.08} />
		</mesh>
		<mesh position={[0, 0, 0.025]}>
			<planeGeometry args={[w, h]} />
			<meshStandardMaterial map={map} roughness={0.7} emissive="#ffffff" emissiveMap={map} emissiveIntensity={brillo + luz * 0.25} />
		</mesh>
	</group>
);

// ---------- sala de las monedas
const Monedas: React.FC<{tipo: (typeof CONTENIDO)[number]; v: number}> = ({tipo, v}) => {
	const cols = tipo === 'oro' ? ['#d4af37'] : tipo === 'plata' ? ['#c8ccd2'] : ['#d4af37', '#c8ccd2'];
	return (
		<group scale={[1, Math.max(0.001, v), 1]}>
			{Array.from({length: 14}, (_, k) => {
				const c = cols[k % cols.length];
				const r = hash(k * 3.1) * 0.22;
				const a = hash(k * 7.7) * Math.PI * 2;
				return (
					<mesh key={k} position={[Math.cos(a) * r, 0.02 + Math.floor(k / 5) * 0.025, Math.sin(a) * r]} rotation={[(hash(k) - 0.5) * 0.4, 0, (hash(k * 2) - 0.5) * 0.4]}>
						<cylinderGeometry args={[0.07, 0.07, 0.02, 20]} />
						<meshStandardMaterial color={c} metalness={0.9} roughness={0.25} />
					</mesh>
				);
			})}
		</group>
	);
};

const Vitrinas: React.FC<{e: EstadoMuseo; T: TM}> = ({e, T}) => (
	<group>
		{VITRINAS_X.map((x, i) => {
			const luz = Math.max(e.pista.vitrinas ?? 0, e.pista[`v${i}`] ?? 0);
			const panoY = 1.35 + e.panos * 1.6;
			return (
				<group key={i} position={[x, 0, VITRINA_Z]}>
					<mesh position={[0, 0.5, 0]}>
						<boxGeometry args={[0.95, 1.0, 0.95]} />
						<meshStandardMaterial color="#20140c" roughness={0.5} emissive="#fff0d8" emissiveIntensity={luz * 0.05} />
					</mesh>
					<mesh position={[0, 1.33, 0]}>
						<boxGeometry args={[0.85, 0.65, 0.85]} />
						<meshPhysicalMaterial color="#cfe6ff" transparent opacity={0.16} roughness={0.05} metalness={0} />
					</mesh>
					<mesh position={[0, 1.02, 0]}>
						<boxGeometry args={[0.8, 0.04, 0.8]} />
						<meshStandardMaterial color="#5a0e14" roughness={0.9} />
					</mesh>
					<group position={[0, 1.04, 0]}>
						<Monedas tipo={CONTENIDO[i]} v={e.panos} />
					</group>
					{/* paño negro: se levanta y desaparece */}
					{e.panos < 0.98 && (
						<mesh position={[0, panoY, 0]} scale={[1, 1 - e.panos * 0.7, 1]}>
							<boxGeometry args={[0.92, 0.72, 0.92]} />
							<meshStandardMaterial color="#1c1424" roughness={0.6} metalness={0.1} transparent opacity={1 - e.panos} />
						</mesh>
					)}
					<pointLight position={[0, 2.7, 0.5]} color="#ffe6c0" intensity={2.6 * e.luces[1]} distance={3.2} decay={1.6} />
					{e.panos > 0.02 && <pointLight position={[0, 1.55, 0]} color="#ffe0a0" intensity={1.6 * e.panos} distance={1.6} decay={2} />}
				</group>
			);
		})}
		{/* placas: se mueven a su vitrina verdadera */}
		{PLACAS.map((_, i) => {
			const a = VITRINAS_X[i];
			const b = VITRINAS_X[PLACA_DESTINO[i]];
			const f = e.placas;
			const x = a + (b - a) * f;
			const y = 0.62 + Math.sin(f * Math.PI) * (0.35 + i * 0.12);
			const luz = Math.max(e.pista.vitrinas ?? 0, e.pista[`v${i}`] ?? 0);
			return (
				<mesh key={i} position={[x, y, VITRINA_Z + 0.485 + Math.sin(f * Math.PI) * 0.15]}>
					<planeGeometry args={[0.8, 0.2]} />
					<meshStandardMaterial map={T.placas[i]} metalness={0.5} roughness={0.4} emissive="#ffffff" emissiveMap={T.placas[i]} emissiveIntensity={0.15 + luz * 0.35} />
				</mesh>
			);
		})}
		{/* la moneda de plata que sale de la vitrina «Oro y plata» */}
		{e.moneda > 0.01 && (
			<group position={[VITRINAS_X[2] - 0.35 * e.moneda, 1.2 + 0.28 * e.moneda, VITRINA_Z + 0.7 * e.moneda]} rotation={[Math.PI / 2 - 0.3, 0, e.t * 1.2]}>
				<mesh>
					<cylinderGeometry args={[0.09, 0.09, 0.02, 28]} />
					<meshStandardMaterial color="#d6dae0" metalness={0.9} roughness={0.25} emissive="#ffffff" emissiveIntensity={0.04} />
				</mesh>
				<pointLight color="#e6eeff" intensity={0.35 * e.moneda} distance={1.0} decay={2} />
			</group>
		)}
	</group>
);

// ---------- pinacoteca
const Pinacoteca: React.FC<{e: EstadoMuseo; T: TM}> = ({e, T}) => {
	const luzR = e.pista.retrato ?? 0;
	const luzP = e.pista.placaRetrato ?? 0;
	const luzC = e.pista.caja ?? 0;
	const digitos = [1, 8, 8, 9];
	return (
		<group>
			{[-1, 1].map((s) =>
				(s < 0 ? [-13.0, -17.0] : [-13.4, -15, -16.6]).map((z, k) => (
					<Cuadro key={`${s}${z}`} pos={[s * (ANCHO - 0.06), 2.0, z]} rotY={-s * (Math.PI / 2)} w={1.1} h={0.85} map={T.paisajes[(k + (s > 0 ? 3 : 0)) % 6]} />
				)),
			)}
			{/* retrato, caja fuerte y placa: grupo en la pared izquierda; en local, la pared es z = 0 y +z mira a la sala */}
			<group position={RETRATO_BASE} rotation={[0, Math.PI / 2, 0]}>
			{/* caja fuerte empotrada detrás del retrato */}
			<group position={[0, RETRATO[1], 0.04]}>
				<mesh>
					<boxGeometry args={[1.2, 1.2, 0.05]} />
					<meshStandardMaterial color="#2a2c30" metalness={0.75} roughness={0.35} emissive="#fff0d8" emissiveIntensity={luzC * 0.05} />
				</mesh>
				{/* puerta de la caja */}
				<group position={[-0.5, 0, 0.05]} rotation={[0, -e.caja * 1.6, 0]}>
					<mesh position={[0.5, 0, 0]}>
						<boxGeometry args={[1.0, 1.0, 0.06]} />
						<meshStandardMaterial color="#3a3d44" metalness={0.8} roughness={0.3} />
					</mesh>
					{digitos.map((d, k) => {
						const giro = e.ruedas * (d + 10) * ((Math.PI * 2) / 10);
						return (
							<group key={k} position={[0.2 + k * 0.2, 0.15, 0.06]}>
								<mesh rotation={[giro, 0, Math.PI / 2]}>
									<cylinderGeometry args={[0.07, 0.07, 0.12, 20]} />
									<meshStandardMaterial color="#b8bcc4" metalness={0.85} roughness={0.25} />
								</mesh>
							</group>
						);
					})}
					<mesh position={[0.5, -0.22, 0.06]}>
						<planeGeometry args={[0.72, 0.16]} />
						<meshBasicMaterial color="#0c0c0e" />
					</mesh>
				</group>
				{e.caja > 0.05 && (
					<group position={[0, -0.1, 0.0]}>
						<pointLight position={[0, 0.2, 0.3]} color="#ffd9a0" intensity={1.2 * e.caja} distance={1.4} decay={2} />
						{/* llave con cabeza de gato */}
						<group position={[0, 0, 0.08 + 0.25 * e.caja]} rotation={[0, 0, Math.PI / 2]}>
							<mesh>
								<cylinderGeometry args={[0.014, 0.014, 0.22, 8]} />
								<Oro />
							</mesh>
							<mesh position={[0, 0.14, 0]}>
								<sphereGeometry args={[0.045, 14, 10]} />
								<Oro />
							</mesh>
							{[-1, 1].map((s) => (
								<mesh key={s} position={[s * 0.028, 0.19, 0]} rotation={[0, 0, -s * 0.3]}>
									<coneGeometry args={[0.016, 0.04, 6]} />
									<Oro />
								</mesh>
							))}
						</group>
					</group>
				)}
			</group>
			{/* el retrato: bisagra en su borde izquierdo */}
			<group position={[-0.8, RETRATO[1], 0.14]} rotation={[0, -e.retrato * 1.45, 0]}>
				<Cuadro pos={[0.8, 0, 0]} rotY={0} w={1.4} h={1.8} map={T.retrato} luz={luzR} brillo={0.18} />
			</group>
			{/* placa del retrato */}
			<mesh position={[0, 0.72, 0.19]}>
				<planeGeometry args={[0.9, 0.35]} />
				<meshStandardMaterial map={T.placaRetrato} metalness={0.45} roughness={0.45} emissive="#ffffff" emissiveMap={T.placaRetrato} emissiveIntensity={0.18 + luzP * 0.45} />
			</mesh>
			{/* foco de galería sobre el retrato */}
			<mesh position={[0, 3.25, 0.4]} rotation={[0.6, 0, 0]}>
				<cylinderGeometry args={[0.06, 0.1, 0.25, 12]} />
				<Oro />
			</mesh>
			<pointLight position={[0, 3.0, 1.2]} color="#ffe2b8" intensity={3 * e.luces[2]} distance={4} decay={1.6} />
			</group>
		</group>
	);
};

// ---------- sala egipcia
const Gato: React.FC<{x: number; roto: number; luz: number; falso: boolean; mapa: number; T: TM}> = ({x, roto, luz, falso, mapa, T}) => {
	const piedra = <meshStandardMaterial color="#1d1a16" metalness={0.35} roughness={0.45} emissive="#d4b04a" emissiveIntensity={luz * 0.08} />;
	const mitad = (s: number) => (
		<group position={[s * roto * 0.1, 0, 0]} rotation={[0, 0, -s * roto * 0.9]}>
			<mesh position={[0, 0.17, 0]} scale={[0.5, 1, 1]}>
				<cylinderGeometry args={[0.07, 0.11, 0.34, 14, 1, false, s > 0 ? 0 : Math.PI, Math.PI]} />
				{piedra}
			</mesh>
			<mesh position={[0, 0.39, 0.01]}>
				<sphereGeometry args={[0.065, 14, 10, s > 0 ? 0 : Math.PI, Math.PI]} />
				{piedra}
			</mesh>
			<mesh position={[s * 0.035, 0.46, 0.01]}>
				<coneGeometry args={[0.022, 0.06, 4]} />
				{piedra}
			</mesh>
		</group>
	);
	return (
		<group position={[x, 0.92, GATOS_Z]}>
			{falso && roto > 0 ? (
				<>
					{mitad(1)}
					{mitad(-1)}
					{mapa > 0.01 && (
						<mesh position={[0, 0.2 + 0.18 * mapa, 0.1 + 0.15 * mapa]} rotation={[-0.5, 0, 0]} scale={[mapa, mapa, mapa]}>
							<planeGeometry args={[0.42, 0.42]} />
							<meshStandardMaterial map={T.mapa} emissive="#ffffff" emissiveMap={T.mapa} emissiveIntensity={0.35} side={THREE.DoubleSide} />
						</mesh>
					)}
				</>
			) : (
				<>
					<mesh position={[0, 0.17, 0]} scale={[0.75, 1, 1]}>
						<cylinderGeometry args={[0.07, 0.11, 0.34, 14]} />
						{piedra}
					</mesh>
					<mesh position={[0, 0.39, 0.01]}>
						<sphereGeometry args={[0.065, 14, 10]} />
						{piedra}
					</mesh>
					{[-1, 1].map((s) => (
						<mesh key={s} position={[s * 0.035, 0.46, 0.01]}>
							<coneGeometry args={[0.022, 0.06, 4]} />
							{piedra}
						</mesh>
					))}
					<mesh position={[0, 0.41, 0.06]}>
						<boxGeometry args={[0.06, 0.012, 0.01]} />
						<meshBasicMaterial color="#d4b04a" />
					</mesh>
				</>
			)}
		</group>
	);
};

const Egipcia: React.FC<{e: EstadoMuseo; T: TM}> = ({e, T}) => {
	const luzG = e.pista.gatos ?? 0;
	const luzB = e.pista.balanza ?? 0;
	const tilt = e.balanza * 0.22;
	return (
		<group>
			<mesh position={[0, 0.45, GATOS_Z]}>
				<boxGeometry args={[5.0, 0.9, 0.7]} />
				<meshStandardMaterial color="#c2a57a" roughness={0.85} emissive="#fff0d8" emissiveIntensity={luzG * 0.04} />
			</mesh>
			{Array.from({length: 8}, (_, i) => (
				<Gato key={i} x={gatoX(i)} roto={i === GATO_FALSO ? e.gatoRoto : 0} luz={luzG} falso={i === GATO_FALSO} mapa={e.mapa} T={T} />
			))}
			{/* balanza de dos platos */}
			<group position={BALANZA}>
				<mesh position={[0, 0.45, 0]}>
					<boxGeometry args={[1.0, 0.9, 0.6]} />
					<meshStandardMaterial color="#2a1e14" roughness={0.6} />
				</mesh>
				<mesh position={[0, 1.25, 0]}>
					<cylinderGeometry args={[0.03, 0.05, 0.7, 10]} />
					<meshStandardMaterial color="#b08a34" metalness={0.8} roughness={0.3} emissive="#fff0d8" emissiveIntensity={luzB * 0.1} />
				</mesh>
				<group position={[0, 1.6, 0]} rotation={[0, 0, tilt]}>
					<mesh rotation={[0, 0, Math.PI / 2]}>
						<cylinderGeometry args={[0.018, 0.018, 0.9, 8]} />
						<meshStandardMaterial color="#b08a34" metalness={0.8} roughness={0.3} emissive="#fff0d8" emissiveIntensity={luzB * 0.1} />
					</mesh>
					{[-1, 1].map((s) => (
						<group key={s} position={[s * 0.44, 0, 0]} rotation={[0, 0, -tilt]}>
							{[-1, 1].map((k) => (
								<mesh key={k} position={[k * 0.06, -0.15, 0]} rotation={[0, 0, k * 0.35]}>
									<cylinderGeometry args={[0.004, 0.004, 0.32, 4]} />
									<meshBasicMaterial color="#8a6a2a" />
								</mesh>
							))}
							<mesh position={[0, -0.3, 0]}>
								<cylinderGeometry args={[0.16, 0.12, 0.03, 20]} />
								<meshStandardMaterial color="#b08a34" metalness={0.8} roughness={0.3} />
							</mesh>
						</group>
					))}
				</group>
				{/* dial de pesadas: 1 · 2 · 3; el 2 se ilumina */}
				<mesh position={[0, 0.7, 0.305]}>
					<planeGeometry args={[0.6, 0.3]} />
					<meshStandardMaterial map={T.dial} emissive="#ffffff" emissiveMap={T.dial} emissiveIntensity={0.15 + luzB * 0.3} />
				</mesh>
				{e.dial > 0.01 && (
					<mesh position={[0, 0.7, 0.31]}>
						<ringGeometry args={[0.06, 0.075, 28]} />
						<meshBasicMaterial color="#3fe0e6" transparent opacity={e.dial} toneMapped={false} />
					</mesh>
				)}
			</group>
			{/* sarcófago decorativo */}
			<group position={[-3.6, 0, -20.6]} rotation={[0, Math.PI / 2, 0]}>
				<mesh position={[0, 0.35, 0]}>
					<boxGeometry args={[0.8, 0.7, 2.0]} />
					<meshStandardMaterial color="#8a6a32" roughness={0.6} metalness={0.3} />
				</mesh>
				<mesh position={[0, 0.75, 0]} scale={[0.4, 0.12, 1]}>
					<sphereGeometry args={[1, 20, 12]} />
					<meshStandardMaterial color="#c9a24a" roughness={0.4} metalness={0.7} />
				</mesh>
			</group>
		</group>
	);
};

// ---------- salida
const Vigilante: React.FC<{x: number; i: number; e: EstadoMuseo; T: TM}> = ({x, i, e, T}) => {
	const luz = e.pista[`vg${i + 1}`] ?? 0;
	const giro = e.cabezas * (x > 0 ? -0.55 : 0.55);
	const ojos = i === 0 ? e.verdad : 0;
	const tela = <meshStandardMaterial color="#1a2238" roughness={0.75} emissive="#fff0d8" emissiveIntensity={luz * 0.05} />;
	const cera = <meshStandardMaterial color="#d9b89a" roughness={0.35} emissive="#fff0d8" emissiveIntensity={luz * 0.05} />;
	return (
		<group position={[x, 0, -26.9]}>
			{[-0.1, 0.1].map((lx) => (
				<mesh key={lx} position={[lx, 0.45, 0]}>
					<cylinderGeometry args={[0.07, 0.08, 0.9, 10]} />
					{tela}
				</mesh>
			))}
			<mesh position={[0, 1.2, 0]}>
				<cylinderGeometry args={[0.22, 0.18, 0.7, 16]} />
				{tela}
			</mesh>
			{[-1, 1].map((s) => (
				<mesh key={s} position={[s * 0.27, 1.15, 0]} rotation={[0, 0, s * 0.12]}>
					<cylinderGeometry args={[0.055, 0.05, 0.62, 10]} />
					{tela}
				</mesh>
			))}
			{[-0.09, 0, 0.09].map((y) => (
				<mesh key={y} position={[0, 1.25 + y, 0.2]}>
					<sphereGeometry args={[0.017, 8, 6]} />
					<Oro />
				</mesh>
			))}
			<group position={[0, 1.7, 0]} rotation={[0, giro, 0]}>
				<mesh>
					<sphereGeometry args={[0.13, 18, 14]} />
					{cera}
				</mesh>
				<mesh position={[0, 0.12, 0]}>
					<cylinderGeometry args={[0.14, 0.14, 0.1, 16]} />
					<meshStandardMaterial color="#121828" roughness={0.6} />
				</mesh>
				<mesh position={[0, 0.08, 0.1]} rotation={[0.3, 0, 0]}>
					<boxGeometry args={[0.24, 0.015, 0.1]} />
					<meshStandardMaterial color="#05070a" roughness={0.4} />
				</mesh>
				{[-0.045, 0.045].map((ex) => (
					<mesh key={ex} position={[ex, 0.0, 0.118]}>
						<sphereGeometry args={[0.016, 8, 6]} />
						<meshStandardMaterial color="#0a0a0a" emissive="#3fe0e6" emissiveIntensity={ojos * 3} toneMapped={ojos < 0.01} />
					</mesh>
				))}
			</group>
			{/* cartel con su frase, a sus pies */}
			<group position={[0, 0.55, 0.45]} rotation={[-0.35, 0, 0]}>
				<mesh position={[0, -0.3, -0.05]}>
					<cylinderGeometry args={[0.012, 0.012, 0.6, 6]} />
					<Oro />
				</mesh>
				<mesh>
					<planeGeometry args={[0.62, 0.27]} />
					<meshStandardMaterial map={T.frases[i]} roughness={0.6} emissive="#ffffff" emissiveMap={T.frases[i]} emissiveIntensity={0.12 + luz * 0.4} />
				</mesh>
			</group>
		</group>
	);
};

const Salida: React.FC<{e: EstadoMuseo; T: TM}> = ({e, T}) => {
	const luzP = e.pista.puertas ?? 0;
	return (
		<group>
			{/* muro del fondo con dos huecos */}
			{[
				[-3.55, 2.1],
				[0, 0.7],
				[3.55, 2.1],
			].map(([x, w]) => (
				<mesh key={x} position={[x, ALTO / 2, -28]}>
					<boxGeometry args={[w, ALTO, 0.3]} />
					<meshStandardMaterial map={T.paredes[4]} roughness={0.9} />
				</mesh>
			))}
			{PUERTAS_X.map((x) => (
				<mesh key={`d${x}`} position={[x, (ALTO + 2.5) / 2, -28]}>
					<boxGeometry args={[1.4, ALTO - 2.5, 0.3]} />
					<meshStandardMaterial map={T.paredes[4]} roughness={0.9} />
				</mesh>
			))}
			{PUERTAS_X.map((x, k) => {
				const abre = k === 1 ? e.puerta : 0;
				return (
					<group key={x} position={[x - 0.6, 0, -27.95]} rotation={[0, abre * 1.4, 0]}>
						<mesh position={[0.6, 1.25, 0]}>
							<boxGeometry args={[1.2, 2.5, 0.08]} />
							<meshStandardMaterial color="#3a2414" roughness={0.6} emissive="#fff0d8" emissiveIntensity={luzP * 0.06} />
						</mesh>
						{[0.6, 1.8].map((y) => (
							<mesh key={y} position={[0.6, y, 0.045]}>
								<boxGeometry args={[0.9, 0.9, 0.02]} />
								<meshStandardMaterial color="#2c1a0e" roughness={0.6} />
							</mesh>
						))}
						<mesh position={[1.05, 1.2, 0.07]}>
							<sphereGeometry args={[0.04, 12, 10]} />
							<Oro />
						</mesh>
					</group>
				);
			})}
			{/* el museo miente: el cartel de salida señala la puerta equivocada */}
			<mesh position={[PUERTAS_X[0], 2.85, -27.83]}>
				<planeGeometry args={[0.9, 0.28]} />
				<meshBasicMaterial map={T.cartelSalida} toneMapped={false} />
			</mesh>
			<pointLight position={[PUERTAS_X[0], 2.7, -27.4]} color="#5dffa0" intensity={0.6} distance={2.2} decay={2} />
			{VIGILANTES_X.map((x, i) => (
				<Vigilante key={x} x={x} i={i} e={e} T={T} />
			))}
			{VIGILANTES_X.map((x) => (
				<pointLight key={`l${x}`} position={[x * 0.7, 2.6, -25.6]} color="#ffe2b8" intensity={2.2 * e.luces[4]} distance={3.5} decay={1.6} />
			))}
			{/* luz de la calle que entra por la puerta derecha */}
			{e.puerta > 0.02 && <pointLight position={[PUERTAS_X[1], 1.8, -29.2]} color="#9fb4ff" intensity={6 * e.puerta} distance={7} decay={1.5} />}
		</group>
	);
};

// ---------- calle y escaparate (giro final)
const Calle: React.FC<{e: EstadoMuseo; T: TM}> = ({e, T}) => (
	<group>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -34]}>
			<planeGeometry args={[24, 12]} />
			<meshStandardMaterial color="#14161c" roughness={0.6} metalness={0.2} />
		</mesh>
		{/* fachada vista desde fuera: tapa el interior salvo los huecos de las dos puertas */}
		{[
			[-4.5, 5.0, 0, ALTO + 1.2],
			[0, 1.6, 0, ALTO + 1.2],
			[4.5, 5.0, 0, ALTO + 1.2],
			[-1.4, 1.2, 2.5, ALTO + 1.2],
			[1.4, 1.2, 2.5, ALTO + 1.2],
		].map(([x, w, y0, y1]) => (
			<mesh key={`${x}${y0}`} position={[x, (y0 + y1) / 2, -28.22]}>
				<boxGeometry args={[w, y1 - y0, 0.1]} />
				<meshStandardMaterial color="#4a4650" roughness={0.85} />
			</mesh>
		))}
		<mesh position={[0, ALTO + 0.9, -28.4]}>
			<boxGeometry args={[14, 0.25, 0.5]} />
			<meshStandardMaterial color="#5a5660" roughness={0.8} />
		</mesh>
		{/* escaparate con el retrato del visitante */}
		<group position={ESCAPARATE} rotation={[0, Math.PI, 0]}>
			<mesh position={[0, 0, -0.02]}>
				<boxGeometry args={[1.5, 1.9, 0.05]} />
				<meshStandardMaterial color="#0c0d12" />
			</mesh>
			<Cuadro pos={[0, 0.12, 0.03]} rotY={0} w={0.9} h={1.15} map={T.visitante} luz={e.escaparate * (e.pista.escaparate ?? 0)} brillo={0.1 + 0.4 * e.escaparate} />
			<mesh position={[0, -0.72, 0.04]}>
				<planeGeometry args={[1.35, 0.225]} />
				<meshStandardMaterial map={T.placaVisitante} emissive="#ffffff" emissiveMap={T.placaVisitante} emissiveIntensity={0.1 + 0.5 * e.escaparate} />
			</mesh>
			{e.escaparate > 0.02 && <pointLight position={[0, 0.6, 0.6]} color="#ffe6b0" intensity={2.4 * e.escaparate} distance={2.6} decay={2} />}
		</group>
		{/* farola */}
		<group position={[-2.2, 0, -32.5]}>
			<mesh position={[0, 1.7, 0]}>
				<cylinderGeometry args={[0.04, 0.06, 3.4, 10]} />
				<meshStandardMaterial color="#141414" metalness={0.6} roughness={0.4} />
			</mesh>
			<mesh position={[0, 3.45, 0]}>
				<sphereGeometry args={[0.14, 14, 10]} />
				<meshBasicMaterial color="#ffd89a" toneMapped={false} />
			</mesh>
			<pointLight position={[0, 3.3, 0]} color="#ffcf8a" intensity={4 * e.calle} distance={7} decay={1.5} />
		</group>
	</group>
);

const Polvo: React.FC<{t: number; z: number}> = ({t, z}) => {
	const ref = React.useRef<THREE.InstancedMesh>(null);
	const n = 80;
	React.useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		for (let i = 0; i < n; i++) {
			const x = (hash(i * 1.3) - 0.5) * 6;
			const y = ((hash(i * 2.7) * 4 + t * 0.05 * (0.5 + hash(i))) % 4) + 0.1;
			const zz = z + (hash(i * 3.9) - 0.5) * 5;
			m.makeTranslation(x + Math.sin(t * 0.3 + i) * 0.1, y, zz);
			ref.current!.setMatrixAt(i, m);
		}
		ref.current!.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, n]}>
			<sphereGeometry args={[0.008, 4, 3]} />
			<meshBasicMaterial color="#e8e0c8" transparent opacity={0.45} />
		</instancedMesh>
	);
};

export const Museo3D: React.FC<{e: EstadoMuseo; ancho?: number; alto?: number; escala?: number}> = ({e, ancho = W3D, alto = H3D, escala = 1920 / W3D}) => {
	const T = useTexMuseo();
	const pistaTarget = useMemo(() => new THREE.Object3D(), []);
	const OBJ: Record<string, V3> = {
		reloj: [RELOJ[0] + 0.2, 2.4, RELOJ[2]],
		vitrinas: [0, 1.1, VITRINA_Z],
		v0: [VITRINAS_X[0], 1.1, VITRINA_Z],
		v1: [VITRINAS_X[1], 1.1, VITRINA_Z],
		v2: [VITRINAS_X[2], 1.1, VITRINA_Z],
		retrato: RETRATO,
		placaRetrato: [RETRATO[0], 0.72, RETRATO[2]],
		caja: RETRATO,
		gatos: [0, 1.1, GATOS_Z],
		balanza: [BALANZA[0], 1.3, BALANZA[2]],
		vg1: [VIGILANTES_X[0], 1.3, -26.9],
		vg2: [VIGILANTES_X[1], 1.3, -26.9],
		puertas: [0, 1.3, -28],
		escaparate: ESCAPARATE,
	};
	let clave = '';
	let luzPista = 0;
	for (const [k, v] of Object.entries(e.pista)) if (v > luzPista && OBJ[k]) [clave, luzPista] = [k, v];
	const objetivo = OBJ[clave] ?? [0, 1, -3];
	pistaTarget.position.set(...objetivo);
	pistaTarget.updateMatrixWorld();
	const centros = [-3, -9, -15, -21, -26];
	const colores = ['#ffe2b8', '#ffe6b0', '#ffd8a8', '#ffcf90', '#c8d4ff'];
	const enCalle = e.cam.pos[2] < -28.2;
	return (
		<ThreeCanvas width={ancho} height={alto} style={{position: 'absolute', left: 0, top: 0, transform: `scale(${escala})`, transformOrigin: '0 0'}} camera={{fov: 50, position: [0, 1.6, 3]}} gl={{antialias: true}}>
			<Camara c={e.cam} />
			<color attach="background" args={[enCalle ? '#070a14' : '#08080c']} />
			<fogExp2 attach="fog" args={[enCalle ? '#0a0e1a' : '#0b0a10', 0.05]} />
			<hemisphereLight args={['#5a6688', '#100c0a', 0.45 + 0.25 * e.luna]} />
			<pointLight position={[e.cam.pos[0], e.cam.pos[1] + 0.3, e.cam.pos[2]]} color="#ffe2c0" intensity={0.9} distance={4.5} decay={1.7} />
			{centros.map((z, i) =>
				e.luces[i] > 0.01 ? <pointLight key={z} position={[0, ALTO - 0.6, z]} color={colores[i]} intensity={14 * e.luces[i]} distance={10} decay={1.3} /> : null,
			)}
			{/* luna por la cúpula */}
			<pointLight position={[0, ALTO - 0.2, -3]} color="#8aa0ff" intensity={4 * e.luna} distance={7} decay={1.4} />
			{e.alarma > 0.01 && <pointLight position={[e.cam.pos[0], 3.5, e.cam.pos[2] + 1]} color="#ff2020" intensity={8 * e.alarma} distance={10} decay={1.2} />}
			{luzPista > 0.01 && (
				<spotLight position={[objetivo[0] * 0.4, 4.2, objetivo[2] + 1.6]} target={pistaTarget} color="#fff0d8" intensity={10 * luzPista} angle={0.26} penumbra={0.5} distance={9} decay={1.3} />
			)}
			<Salas e={e} T={T} />
			<Cupula e={e} />
			<Columnas />
			<RelojPie e={e} T={T} />
			<Cuadro pos={[ANCHO - 0.06, 2.2, -3]} rotY={-Math.PI / 2} w={1.0} h={1.3} map={T.retrato} brillo={0.08} />
			<Vitrinas e={e} T={T} />
			<Pinacoteca e={e} T={T} />
			<Egipcia e={e} T={T} />
			<Salida e={e} T={T} />
			<Calle e={e} T={T} />
			<Polvo t={e.t} z={e.cam.pos[2] - 2} />
		</ThreeCanvas>
	);
};
