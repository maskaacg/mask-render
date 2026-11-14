import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

// ENIGMA 60 · kit «submarino» (procedural, three.js MIT). Sala de lastre de «Profundidad 600».
// Todo es determinista: cada fotograma depende solo de t (requisito de Remotion).

export type ClaveCam = {t: number; pos: [number, number, number]; mira: [number, number, number]};
export type EstadoSala = {
	t: number;
	cam: {pos: [number, number, number]; mira: [number, number, number]; fov: number};
	agua: number; // altura del agua (y)
	agujas: [number, number, number]; // valor mostrado 0..10 por cada manómetro
	pista: [number, number, number, number]; // 0..1 luz cian sobre A, B, C y placa
	valvulas: [number, number, number]; // giro de cada volante (rad)
	escotilla: number; // 0..1 apertura
	violeta: number; // 0..1 destello de la pista secreta
	guante: {visible: number; pos: [number, number, number]; rot: [number, number, number]; orden?: 'XYZ' | 'YXZ'};
	alarma: number; // 0..1 intensidad de la luz roja
	soplado: number; // 0..1 burbujas del lastre
};

// el 3D se dibuja a 720x1280 y se amplía: interfaz y subtítulos siguen a 1080x1920 (render ~2,2 veces más rápido)
const W3D = 720;
const H3D = 1280;
const HULL_R = 3;
const FLOOR_Y = -1.7;
const TANK_X = -1.55;
const TANK_Z = [-1.0, -2.6, -4.2];
const GAUGE_X = TANK_X + 0.56;
const GAUGE_Y = 0.35;
const ARC0 = Math.asin(FLOOR_Y / HULL_R); // arco de cuadernas desde el suelo derecho, por arriba, al izquierdo
const ARC = Math.PI - 2 * ARC0;

const hash = (n: number) => {
	const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return s - Math.floor(s);
};

const tex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
	const cv = document.createElement('canvas');
	cv.width = w;
	cv.height = h;
	draw(cv.getContext('2d') as CanvasRenderingContext2D);
	const t = new THREE.CanvasTexture(cv);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 4;
	if (repeat) {
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.repeat.set(repeat[0], repeat[1]);
	}
	return t;
};

// placas de acero envejecido con manchas y vetas de óxido
const useTexturas = () =>
	useMemo(() => {
		const acero = tex(
			512,
			512,
			(c) => {
				c.fillStyle = '#4b5a5c';
				c.fillRect(0, 0, 512, 512);
				for (let i = 0; i < 900; i++) {
					const x = hash(i) * 512, y = hash(i + 0.5) * 512, r = 2 + hash(i + 0.7) * 22;
					c.fillStyle = `rgba(${20 + hash(i + 1) * 30},${25 + hash(i + 2) * 30},${28 + hash(i + 3) * 25},${0.05 + hash(i + 4) * 0.1})`;
					c.beginPath();
					c.arc(x, y, r, 0, Math.PI * 2);
					c.fill();
				}
				for (let i = 0; i < 60; i++) {
					const x = hash(i + 9) * 512, y = hash(i + 19) * 512;
					const g = c.createLinearGradient(x, y, x, y + 60 + hash(i) * 120);
					g.addColorStop(0, 'rgba(140,72,34,0.35)');
					g.addColorStop(1, 'rgba(140,72,34,0)');
					c.fillStyle = g;
					c.fillRect(x, y, 2 + hash(i + 5) * 5, 180);
				}
				c.strokeStyle = 'rgba(10,14,16,0.7)';
				c.lineWidth = 3;
				for (const p of [0, 256]) {
					c.beginPath();
					c.moveTo(p, 0);
					c.lineTo(p, 512);
					c.stroke();
					c.beginPath();
					c.moveTo(0, p + 128);
					c.lineTo(512, p + 128);
					c.stroke();
				}
			},
			[6, 3],
		);
		const rejilla = tex(
			256,
			256,
			(c) => {
				c.fillStyle = '#15191b';
				c.fillRect(0, 0, 256, 256);
				c.strokeStyle = '#4e575a';
				c.lineWidth = 10;
				for (let i = 0; i <= 256; i += 32) {
					c.beginPath();
					c.moveTo(i, 0);
					c.lineTo(i, 256);
					c.stroke();
				}
				c.lineWidth = 4;
				for (let i = 0; i <= 256; i += 32) {
					c.beginPath();
					c.moveTo(0, i);
					c.lineTo(256, i);
					c.stroke();
				}
			},
			[10, 28],
		);
		const pintura = tex(
			256,
			512,
			(c) => {
				c.fillStyle = '#3f6660';
				c.fillRect(0, 0, 256, 512);
				for (let i = 0; i < 400; i++) {
					c.fillStyle = `rgba(${hash(i) > 0.7 ? '120,64,30' : '20,30,30'},${0.05 + hash(i + 3) * 0.12})`;
					c.fillRect(hash(i + 1) * 256, hash(i + 2) * 512, 2 + hash(i + 4) * 14, 2 + hash(i + 5) * 30);
				}
				const g = c.createLinearGradient(0, 380, 0, 512);
				g.addColorStop(0, 'rgba(30,20,12,0)');
				g.addColorStop(1, 'rgba(30,20,12,0.55)');
				c.fillStyle = g;
				c.fillRect(0, 380, 256, 132);
			},
			[2, 1],
		);
		const esfera = tex(512, 512, (c) => {
			const g = c.createRadialGradient(256, 230, 40, 256, 256, 256);
			g.addColorStop(0, '#f1ead6');
			g.addColorStop(1, '#bfb59b');
			c.fillStyle = g;
			c.beginPath();
			c.arc(256, 256, 250, 0, Math.PI * 2);
			c.fill();
			c.translate(256, 256);
			for (let v = 0; v <= 10; v++) {
				const a = (-135 + v * 27) * (Math.PI / 180);
				c.strokeStyle = v >= 9 ? '#b3261e' : '#2a2a2a';
				c.lineWidth = 7;
				c.beginPath();
				c.moveTo(Math.sin(a) * 185, -Math.cos(a) * 185);
				c.lineTo(Math.sin(a) * 225, -Math.cos(a) * 225);
				c.stroke();
				c.fillStyle = '#222';
				c.font = '600 46px "IBM Plex Mono", monospace';
				c.textAlign = 'center';
				c.textBaseline = 'middle';
				c.fillText(String(v), Math.sin(a) * 145, -Math.cos(a) * 145);
				if (v < 10)
					for (let k = 1; k < 5; k++) {
						const b = a + (k * 27 * Math.PI) / 180 / 5;
						c.lineWidth = 2;
						c.beginPath();
						c.moveTo(Math.sin(b) * 205, -Math.cos(b) * 205);
						c.lineTo(Math.sin(b) * 225, -Math.cos(b) * 225);
						c.stroke();
					}
			}
			c.strokeStyle = '#b3261e';
			c.lineWidth = 14;
			c.beginPath();
			c.arc(0, 0, 232, (-90 + 108) * (Math.PI / 180), (-90 + 135) * (Math.PI / 180));
			c.stroke();
			c.fillStyle = '#555';
			c.font = '400 26px "IBM Plex Mono", monospace';
			c.fillText('×10 BAR', 0, 96);
			// grietas del cristal
			c.strokeStyle = 'rgba(255,255,255,0.55)';
			c.lineWidth = 2;
			for (let k = 0; k < 7; k++) {
				let x = 40, y = -60;
				c.beginPath();
				c.moveTo(x, y);
				for (let s = 0; s < 6; s++) {
					const a = k * 0.9 + (hash(k * 10 + s) - 0.5) * 0.9;
					x += Math.cos(a) * 38;
					y += Math.sin(a) * 38;
					c.lineTo(x, y);
				}
				c.stroke();
			}
		});
		const letra = (l: string) =>
			tex(256, 256, (c) => {
				c.fillStyle = 'rgba(0,0,0,0)';
				c.fillRect(0, 0, 256, 256);
				c.fillStyle = 'rgba(228,224,210,0.85)';
				c.font = '600 200px "IBM Plex Mono", monospace';
				c.textAlign = 'center';
				c.textBaseline = 'middle';
				c.fillText(l, 128, 140);
				c.globalCompositeOperation = 'destination-out';
				for (let i = 0; i < 160; i++) {
					c.fillStyle = `rgba(0,0,0,${0.3 + hash(i + l.charCodeAt(0)) * 0.6})`;
					c.fillRect(hash(i * 3 + 1) * 256, hash(i * 7 + 2) * 256, 3 + hash(i) * 10, 2 + hash(i + 9) * 6);
				}
			});
		const placa = tex(512, 256, (c) => {
			c.fillStyle = '#8a6a3c';
			c.fillRect(0, 0, 512, 256);
			c.strokeStyle = '#4c3a1e';
			c.lineWidth = 8;
			c.strokeRect(12, 12, 488, 232);
			c.fillStyle = '#2b2012';
			c.textAlign = 'center';
			c.font = '600 40px "IBM Plex Mono", monospace';
			c.fillText('LASTRE · TOTAL', 256, 80);
			c.font = '600 108px "IBM Plex Mono", monospace';
			c.fillText('Σ 19', 256, 196);
			for (const [x, y] of [[36, 36], [476, 36], [36, 220], [476, 220]]) {
				c.fillStyle = '#5a4524';
				c.beginPath();
				c.arc(x, y, 10, 0, Math.PI * 2);
				c.fill();
			}
		});
		const taquilla = tex(256, 512, (c) => {
			c.fillStyle = '#5b6458';
			c.fillRect(0, 0, 256, 512);
			c.fillStyle = 'rgba(20,24,22,0.8)';
			for (let i = 0; i < 6; i++) c.fillRect(60, 40 + i * 18, 136, 8);
			c.strokeStyle = 'rgba(230,225,215,0.75)';
			c.lineWidth = 7;
			c.lineCap = 'round';
			// número 6 rayado a mano
			c.beginPath();
			c.moveTo(160, 230);
			c.bezierCurveTo(100, 220, 80, 300, 96, 360);
			c.bezierCurveTo(110, 410, 180, 400, 172, 350);
			c.bezierCurveTo(165, 305, 110, 310, 100, 345);
			c.stroke();
		});
		return {acero, rejilla, pintura, esfera, A: letra('A'), B: letra('B'), C: letra('C'), placa, taquilla};
	}, []);

const Camara: React.FC<{c: EstadoSala['cam']}> = ({c}) => {
	const {camera} = useThree();
	const cam = camera as THREE.PerspectiveCamera;
	cam.fov = c.fov;
	cam.near = 0.05;
	cam.far = 40;
	cam.position.set(...c.pos);
	cam.lookAt(...c.mira);
	cam.updateProjectionMatrix();
	return null;
};

const Remaches: React.FC<{z: number}> = ({z}) => {
	const ref = React.useRef<THREE.InstancedMesh>(null);
	const n = 26;
	React.useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		for (let i = 0; i < n; i++) {
			const a = ARC0 + (i / (n - 1)) * ARC;
			m.makeTranslation(Math.cos(a) * (HULL_R - 0.13), Math.sin(a) * (HULL_R - 0.13), z + 0.09);
			ref.current?.setMatrixAt(i, m);
		}
		if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
	}, [z]);
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, n]}>
			<sphereGeometry args={[0.035, 8, 6]} />
			<meshStandardMaterial color="#6d7a7c" metalness={0.6} roughness={0.45} />
		</instancedMesh>
	);
};

const Volante: React.FC<{rot: number; pos: [number, number, number]; brillo: number}> = ({rot, pos, brillo}) => (
	<group position={pos} rotation={[0, Math.PI / 2, 0]}>
		<group rotation={[0, 0, rot]}>
			<mesh>
				<torusGeometry args={[0.22, 0.03, 10, 40]} />
				<meshStandardMaterial color="#9b2f22" metalness={0.4} roughness={0.5} emissive="#3fe0e6" emissiveIntensity={brillo * 0.25} />
			</mesh>
			{[0, 1, 2].map((k) => (
				<mesh key={k} rotation={[0, 0, (k * Math.PI) / 3]}>
					<boxGeometry args={[0.44, 0.03, 0.03]} />
					<meshStandardMaterial color="#7d2519" metalness={0.4} roughness={0.5} />
				</mesh>
			))}
			<mesh rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.05, 0.05, 0.08, 16]} />
				<meshStandardMaterial color="#b8bec8" metalness={0.8} roughness={0.3} />
			</mesh>
		</group>
		<mesh position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
			<cylinderGeometry args={[0.03, 0.03, 0.24, 10]} />
			<meshStandardMaterial color="#555c5e" metalness={0.6} roughness={0.4} />
		</mesh>
	</group>
);

const Manometro: React.FC<{valor: number; luz: number; esfera: THREE.Texture; z: number}> = ({valor, luz, esfera, z}) => {
	const ang = ((-135 + valor * 27) * Math.PI) / 180;
	return (
		<group position={[GAUGE_X, GAUGE_Y, z]} rotation={[0, Math.PI / 2, 0]}>
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.03]}>
				<cylinderGeometry args={[0.27, 0.29, 0.08, 40]} />
				<meshStandardMaterial color="#b08d57" metalness={0.85} roughness={0.32} />
			</mesh>
			<mesh position={[0, 0, 0.012]}>
				<circleGeometry args={[0.245, 48]} />
				<meshStandardMaterial map={esfera} roughness={0.6} emissive="#ffffff" emissiveMap={esfera} emissiveIntensity={0.08 + luz * 0.25} />
			</mesh>
			<group position={[0, 0, 0.03]} rotation={[0, 0, -ang]}>
				<mesh position={[0, 0.09, 0]}>
					<boxGeometry args={[0.016, 0.2, 0.006]} />
					<meshStandardMaterial color="#1a1a1a" />
				</mesh>
			</group>
			<mesh position={[0, 0, 0.032]}>
				<circleGeometry args={[0.022, 16]} />
				<meshStandardMaterial color="#b8bec8" metalness={0.8} roughness={0.3} />
			</mesh>
			{/* luz de pista E60: aro cian */}
			<mesh position={[0, 0, 0.02]}>
				<ringGeometry args={[0.29, 0.31 + luz * 0.02, 64]} />
				<meshBasicMaterial color="#3fe0e6" transparent opacity={luz} toneMapped={false} />
			</mesh>
		</group>
	);
};

const Tanque: React.FC<{z: number; letra: THREE.Texture; pintura: THREE.Texture}> = ({z, letra, pintura}) => (
	<group position={[TANK_X, 0, z]}>
		<mesh position={[0, -0.35, 0]}>
			<cylinderGeometry args={[0.55, 0.55, 2.4, 40]} />
			<meshStandardMaterial map={pintura} metalness={0.35} roughness={0.55} />
		</mesh>
		<mesh position={[0, 0.85, 0]}>
			<sphereGeometry args={[0.55, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
			<meshStandardMaterial map={pintura} metalness={0.35} roughness={0.55} />
		</mesh>
		{[-1.2, -0.25, 0.75].map((y) => (
			<mesh key={y} position={[0, y, 0]}>
				<cylinderGeometry args={[0.565, 0.565, 0.07, 40]} />
				<meshStandardMaterial color="#a8834d" metalness={0.85} roughness={0.35} />
			</mesh>
		))}
		<mesh position={[0.556, -0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
			<planeGeometry args={[0.5, 0.5]} />
			<meshStandardMaterial map={letra} transparent roughness={0.8} />
		</mesh>
		{/* tubería al techo */}
		<mesh position={[0, 1.8, 0]}>
			<cylinderGeometry args={[0.07, 0.07, 1.2, 14]} />
			<meshStandardMaterial color="#596466" metalness={0.6} roughness={0.4} />
		</mesh>
	</group>
);

const Cable: React.FC<{pts: [number, number, number][]; r?: number}> = ({pts, r = 0.035}) => {
	const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 48, r, 8, false), [pts, r]);
	return (
		<mesh geometry={geo}>
			<meshStandardMaterial color="#1c1f22" roughness={0.75} />
		</mesh>
	);
};

const CABLES: [number, number, number][][] = [
	[[-1.2, 2.55, 4], [-0.8, 2.2, 1], [-1.0, 2.45, -2], [-0.7, 2.25, -5.8]],
	[[1.0, 2.6, 4], [0.7, 2.25, 0.5], [0.95, 2.5, -2.5], [0.6, 2.3, -5.8]],
	[[-0.2, 2.85, 4], [0.1, 2.55, 1.5], [-0.1, 2.75, -1.5], [0.2, 2.6, -5.8]],
];

const Burbujas: React.FC<{t: number; agua: number; soplado: number}> = ({t, agua, soplado}) => {
	const ref = React.useRef<THREE.InstancedMesh>(null);
	const n = 140;
	const m = useMemo(() => new THREE.Matrix4(), []);
	React.useLayoutEffect(() => {
		for (let i = 0; i < n; i++) {
			const fuerte = i >= 40; // burbujas del soplado de lastre
			const base = fuerte ? TANK_Z[i % 3] : -5.5 + hash(i) * 9;
			const x = fuerte ? TANK_X + 0.7 + hash(i + 1) * 0.5 : -1.8 + hash(i + 1) * 3.6;
			const vel = fuerte ? 1.6 + hash(i + 2) : 0.25 + hash(i + 2) * 0.3;
			const ciclo = (t * vel + hash(i + 3) * 3) % 3;
			const y = FLOOR_Y + ciclo * (fuerte ? 1.4 : 0.3);
			const s = (fuerte ? 0.025 + hash(i + 4) * 0.05 : 0.012 + hash(i + 4) * 0.02) * (fuerte ? soplado : y < agua ? 1 : 0);
			m.makeScale(s + 1e-5, s + 1e-5, s + 1e-5);
			m.setPosition(x + Math.sin(t * 3 + i) * 0.03, Math.min(y, fuerte ? 2.4 : agua), base + hash(i + 5) * 0.5);
			ref.current?.setMatrixAt(i, m);
		}
		if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
	}, [t, agua, soplado, m]);
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, n]}>
			<sphereGeometry args={[1, 10, 8]} />
			<meshStandardMaterial color="#cfeff0" transparent opacity={0.55} roughness={0.1} metalness={0.1} emissive="#5fb3b8" emissiveIntensity={0.25} />
		</instancedMesh>
	);
};

const Polvo: React.FC<{t: number}> = ({t}) => {
	const ref = React.useRef<THREE.InstancedMesh>(null);
	const n = 220;
	const m = useMemo(() => new THREE.Matrix4(), []);
	React.useLayoutEffect(() => {
		for (let i = 0; i < n; i++) {
			const x = -2 + hash(i * 1.3) * 4 + Math.sin(t * 0.2 + i) * 0.15;
			const y = -1.2 + hash(i * 2.1) * 3.6 + Math.sin(t * 0.15 + i * 0.7) * 0.2;
			const z = -5.8 + hash(i * 3.7) * 10;
			const s = 0.004 + hash(i * 4.1) * 0.006;
			m.makeScale(s, s, s);
			m.setPosition(x, y, z);
			ref.current?.setMatrixAt(i, m);
		}
		if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
	}, [t, m]);
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, n]}>
			<sphereGeometry args={[1, 6, 4]} />
			<meshBasicMaterial color="#d9c9a8" transparent opacity={0.5} toneMapped={false} />
		</instancedMesh>
	);
};

const Agua: React.FC<{t: number; y: number}> = ({t, y}) => {
	const geo = useMemo(() => new THREE.PlaneGeometry(5.2, 12.5, 48, 120), []);
	React.useLayoutEffect(() => {
		const p = geo.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < p.count; i++) {
			const x = p.getX(i), yy = p.getY(i);
			p.setZ(i, Math.sin(x * 3 + t * 1.6) * 0.012 + Math.sin(yy * 2.2 - t * 1.1) * 0.016 + Math.sin((x + yy) * 6 + t * 2.4) * 0.005);
		}
		p.needsUpdate = true;
		geo.computeVertexNormals();
	}, [t, geo]);
	return (
		<mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, -0.2]}>
			<meshStandardMaterial color="#0f3d42" transparent opacity={0.78} metalness={0.2} roughness={0.08} />
		</mesh>
	);
};

const Guante: React.FC<{g: EstadoSala['guante']}> = ({g}) => {
	if (g.visible <= 0.01) return null;
	const mat = <meshStandardMaterial color="#aab1b9" roughness={0.7} metalness={0.15} />;
	return (
		<group position={g.pos} rotation={[g.rot[0], g.rot[1], g.rot[2], g.orden ?? 'XYZ']} scale={g.visible}>
			<mesh>
				<boxGeometry args={[0.2, 0.07, 0.22]} />
				{mat}
			</mesh>
			{[-0.07, -0.023, 0.023, 0.07].map((x, i) => (
				<mesh key={x} position={[x, 0, -0.17 - (i === 1 || i === 2 ? 0.02 : 0)]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
					<capsuleGeometry args={[0.024, 0.11, 4, 10]} />
					{mat}
				</mesh>
			))}
			<mesh position={[0.13, 0, -0.04]} rotation={[Math.PI / 2, 0, -0.9]}>
				<capsuleGeometry args={[0.026, 0.09, 4, 10]} />
				{mat}
			</mesh>
			{/* puño y costura cian */}
			<mesh position={[0, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.1, 0.11, 0.14, 20]} />
				<meshStandardMaterial color="#5d636a" roughness={0.8} />
			</mesh>
			<mesh position={[0, 0.037, 0.0]}>
				<boxGeometry args={[0.012, 0.004, 0.2]} />
				<meshBasicMaterial color="#3fe0e6" toneMapped={false} />
			</mesh>
		</group>
	);
};

export const SalaLastre3D: React.FC<{e: EstadoSala}> = ({e}) => {
	const T = useTexturas();
	const {t} = e;
	const hull = useMemo(() => {
		const g = new THREE.CylinderGeometry(HULL_R, HULL_R, 13, 64, 1, true);
		g.rotateX(Math.PI / 2);
		return g;
	}, []);
	// lámpara de trabajo que oscila
	const swing = Math.sin(t * 0.9) * 0.08;
	const lampPos: [number, number, number] = [0.45 + Math.sin(swing) * 0.6, 1.55, -0.6];
	const parpadeo = 1 - (hash(Math.floor(t * 12)) > 0.93 ? 0.55 : 0);
	// luz de emergencia giratoria
	const giro = t * 2.4;
	const alarmTarget = useMemo(() => new THREE.Object3D(), []);
	alarmTarget.position.set(Math.cos(giro) * 3, 1.2, -2.2 + Math.sin(giro) * 3);
	alarmTarget.updateMatrixWorld();
	const pistaTarget = useMemo(() => new THREE.Object3D(), []);
	const iPista = e.pista.indexOf(Math.max(...e.pista));
	const objetivo: [number, number, number] = iPista < 3 ? [GAUGE_X, GAUGE_Y, TANK_Z[iPista]] : [2.3, 0.1, -2.2];
	pistaTarget.position.set(...objetivo);
	pistaTarget.updateMatrixWorld();
	const luzPista = Math.max(...e.pista);
	const hingeX = -0.85;

	return (
		<ThreeCanvas width={W3D} height={H3D} style={{position: 'absolute', left: 0, top: 0, transform: `scale(${1080 / W3D})`, transformOrigin: '0 0'}} camera={{fov: 50, position: [0, 0, 5]}} gl={{antialias: true}}>
			<Camara c={e.cam} />
			<color attach="background" args={['#0b0f12']} />
			<fogExp2 attach="fog" args={['#0a1316', 0.075]} />
			<hemisphereLight args={['#2b4a50', '#07090b', 0.7]} />
			{/* linterna del casco del protagonista */}
			<pointLight position={[e.cam.pos[0], e.cam.pos[1] + 0.15, e.cam.pos[2]]} color="#d6ecff" intensity={2.6} distance={5} decay={1.6} />
			{/* lámpara de trabajo (luz motivada principal) */}
			<pointLight position={lampPos} color="#ffcf8f" intensity={9 * parpadeo} distance={9} decay={1.6} />
			<mesh position={lampPos}>
				<sphereGeometry args={[0.07, 16, 12]} />
				<meshBasicMaterial color="#fff1c9" toneMapped={false} />
			</mesh>
			<mesh position={[lampPos[0], lampPos[1] + 0.12, lampPos[2]]}>
				<cylinderGeometry args={[0.09, 0.09, 0.2, 8, 1, true]} />
				<meshStandardMaterial color="#222" wireframe />
			</mesh>
			<Cable pts={[[0.45, 2.95, -0.6], [lampPos[0], 2.2, -0.6], [lampPos[0], lampPos[1] + 0.2, lampPos[2]]]} r={0.01} />
			{/* luz roja de emergencia */}
			{e.alarma > 0.01 && <spotLight position={[0.2, 2.6, -2.2]} target={alarmTarget} color="#ff2a1a" intensity={20 * e.alarma} angle={0.5} penumbra={0.6} distance={10} decay={1.4} />}
			<mesh position={[0.2, 2.72, -2.2]}>
				<sphereGeometry args={[0.13, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
				<meshStandardMaterial color="#5a0d08" emissive="#ff2a1a" emissiveIntensity={0.6 + 0.8 * e.alarma * (0.5 + 0.5 * Math.sin(giro * 2))} />
			</mesh>
			{/* luces piloto ámbar */}
			<pointLight position={[TANK_X + 0.9, 1.3, -2.6]} color="#ffae42" intensity={2.2} distance={4} decay={2} />
			{/* luz de pista cian E60 */}
			{luzPista > 0.01 && <spotLight position={[0.9, 1.6, objetivo[2] + 1.4]} target={pistaTarget} color="#3fe0e6" intensity={18 * luzPista} angle={0.22} penumbra={0.5} distance={6} decay={1.5} />}

			{/* casco */}
			<mesh geometry={hull} position={[0, 0, -0.5]}>
				<meshStandardMaterial map={T.acero} side={THREE.BackSide} metalness={0.45} roughness={0.6} />
			</mesh>
			{[-5.4, -3.8, -2.2, -0.6, 1.0, 2.6].map((z) => (
				<group key={z}>
					<mesh position={[0, 0, z]} rotation={[0, 0, ARC0]}>
						<torusGeometry args={[HULL_R - 0.06, 0.08, 8, 64, ARC]} />
						<meshStandardMaterial color="#3a4648" metalness={0.5} roughness={0.5} />
					</mesh>
					<Remaches z={z} />
				</group>
			))}
			{/* suelo de rejilla */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, -0.5]}>
				<planeGeometry args={[5, 13]} />
				<meshStandardMaterial map={T.rejilla} metalness={0.5} roughness={0.55} />
			</mesh>
			<Agua t={t} y={e.agua} />
			{/* mamparo del fondo con escotilla */}
			<mesh position={[0, 0.1, -6]}>
				<ringGeometry args={[0.82, HULL_R + 0.2, 64]} />
				<meshStandardMaterial map={T.acero} metalness={0.45} roughness={0.6} />
			</mesh>
			<mesh position={[0, 0.1, -5.97]}>
				<ringGeometry args={[0.82, 1.02, 64]} />
				<meshStandardMaterial color="#6f7a7c" metalness={0.7} roughness={0.35} />
			</mesh>
			{/* pasillo inundado tras la escotilla */}
			<mesh position={[0, 0.1, -8.2]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.84, 0.84, 4.4, 40, 1, true]} />
				<meshStandardMaterial map={T.acero} side={THREE.BackSide} metalness={0.4} roughness={0.6} />
			</mesh>
			<mesh position={[0, 0.1, -10.35]}>
				<circleGeometry args={[0.84, 40]} />
				<meshStandardMaterial color="#1b2a2c" />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, -8.2]}>
				<planeGeometry args={[1.7, 4.4]} />
				<meshStandardMaterial color="#0f3d42" metalness={0.2} roughness={0.08} transparent opacity={0.85} />
			</mesh>
			{e.escotilla > 0.01 && <pointLight position={[0, 0.5, -8.6]} color="#8fe8ff" intensity={6 * e.escotilla} distance={6} decay={1.4} />}
			<mesh position={[0, 0.85, -9.6]}>
				<sphereGeometry args={[0.06, 12, 8]} />
				<meshBasicMaterial color="#c9f4ff" toneMapped={false} />
			</mesh>
			<group position={[hingeX, 0.1, -5.94]} rotation={[0, e.escotilla * 1.7, 0]}>
				<mesh position={[-hingeX, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.84, 0.84, 0.12, 56]} />
					<meshStandardMaterial map={T.acero} metalness={0.55} roughness={0.45} />
				</mesh>
				<group position={[-hingeX, 0, 0.1]}>
					<Volante rot={e.escotilla * 4} pos={[0, 0, 0]} brillo={0} />
				</group>
			</group>
			{/* taquilla con la pista secreta violeta */}
			<group position={[1.85, -0.35, -5.1]} rotation={[0, -Math.PI / 2 + 0.35, 0]}>
				<mesh>
					<boxGeometry args={[0.55, 1.6, 0.45]} />
					<meshStandardMaterial color="#4c5449" metalness={0.4} roughness={0.6} />
				</mesh>
				<mesh position={[0, 0, 0.227]}>
					<planeGeometry args={[0.52, 1.56]} />
					<meshStandardMaterial map={T.taquilla} roughness={0.7} emissive="#7b5cff" emissiveMap={T.taquilla} emissiveIntensity={e.violeta * 1.6} />
				</mesh>
			</group>
			{e.violeta > 0.01 && <pointLight position={[1.4, -0.2, -4.8]} color="#7b5cff" intensity={4 * e.violeta} distance={2} decay={2} />}
			{/* tanques, manómetros y válvulas */}
			{TANK_Z.map((z, i) => (
				<group key={z}>
					<Tanque z={z} letra={[T.A, T.B, T.C][i]} pintura={T.pintura} />
					<Manometro z={z} valor={e.agujas[i]} luz={e.pista[i]} esfera={T.esfera} />
					<Volante rot={e.valvulas[i]} pos={[TANK_X + 0.72, -0.95, z]} brillo={e.pista[i]} />
				</group>
			))}
			{/* tuberías de la pared derecha y placa */}
			{[0.6, 0.95].map((y) => (
				<mesh key={y} position={[2.35, y, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.09, 0.09, 13, 16]} />
					<meshStandardMaterial color="#6b5a3e" metalness={0.7} roughness={0.4} />
				</mesh>
			))}
			{[-4.6, -2.9, -1.2, 0.5, 2.2].map((z) => (
				<mesh key={z} position={[2.35, 0.78, z]} rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.15, 0.15, 0.08, 16]} />
					<meshStandardMaterial color="#8a7550" metalness={0.75} roughness={0.35} />
				</mesh>
			))}
			<mesh position={[2.28, 0.1, -2.2]} rotation={[0, -Math.PI / 2, 0]}>
				<planeGeometry args={[0.8, 0.4]} />
				<meshStandardMaterial map={T.placa} metalness={0.6} roughness={0.4} emissive="#3fe0e6" emissiveIntensity={e.pista[3] * 0.2} />
			</mesh>
			{CABLES.map((p, i) => (
				<Cable key={i} pts={p} />
			))}
			<Burbujas t={t} agua={e.agua} soplado={e.soplado} />
			<Polvo t={t} />
			{/* gotas que caen del techo */}
			{[0, 1, 2].map((k) => {
				const ciclo = (t * 0.7 + k * 0.37) % 1.6;
				const y = 2.3 - ciclo * ciclo * 2.4;
				return y > e.agua ? (
					<mesh key={k} position={[-0.5 + k * 0.6, y, -1.6 - k * 1.3]}>
						<sphereGeometry args={[0.018, 8, 6]} />
						<meshStandardMaterial color="#bfe9ec" transparent opacity={0.8} roughness={0.05} />
					</mesh>
				) : null;
			})}
			<Guante g={e.guante} />
		</ThreeCanvas>
	);
};
