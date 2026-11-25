import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Easing, interpolate} from 'remotion';

// Isla low-poly 3D (three.js, MIT): torre del reloj, mesa con engranajes, Leo y puerta del campanario.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);

export type Clave = {t: number; pos: [number, number, number]; mira: [number, number, number]};

const gearShape = (teeth: number, r: number, depth: number) => {
	const s = new THREE.Shape();
	const step = (Math.PI * 2) / teeth;
	for (let i = 0; i < teeth; i++) {
		const a = i * step;
		[[r - depth, a], [r, a + step * 0.12], [r, a + step * 0.42], [r - depth, a + step * 0.54]].forEach(([rad, an], k) => {
			const x = Math.cos(an) * rad, y = Math.sin(an) * rad;
			if (i === 0 && k === 0) s.moveTo(x, y);
			else s.lineTo(x, y);
		});
	}
	const hole = new THREE.Path();
	hole.absarc(0, 0, r * 0.18, 0, Math.PI * 2, true);
	s.holes.push(hole);
	return s;
};

const K = 0.03;
const Gear: React.FC<{z: number; x: number; color: string; rot: number; lift: number; glow: number}> = ({z, x, color, rot, lift, glow}) => {
	const geo = useMemo(() => new THREE.ExtrudeGeometry(gearShape(z, z * K, 0.09), {depth: 0.18, bevelEnabled: false}), [z]);
	return (
		<mesh geometry={geo} position={[x, 1.0 + z * K + lift, 0.3]} rotation={[0, 0, rot]} castShadow>
			<meshStandardMaterial color={color} flatShading metalness={0.2} roughness={0.55} emissive={color} emissiveIntensity={glow} />
		</mesh>
	);
};

const Tree: React.FC<{p: [number, number, number]; s?: number; sway: number}> = ({p, s = 1, sway}) => (
	<group position={p} scale={s} rotation={[0, 0, sway]}>
		<mesh position={[0, 0.5, 0]} castShadow>
			<cylinderGeometry args={[0.12, 0.16, 1, 5]} />
			<meshStandardMaterial color="#6b3f22" flatShading />
		</mesh>
		<mesh position={[0, 1.5, 0]} castShadow>
			<icosahedronGeometry args={[0.8, 0]} />
			<meshStandardMaterial color="#3d8f48" flatShading />
		</mesh>
	</group>
);

const Camara: React.FC<{t: number; claves: Clave[]}> = ({t, claves}) => {
	const {camera} = useThree();
	const ts = claves.map((c) => c.t);
	const v = (k: 'pos' | 'mira', i: number) => interpolate(t, ts, claves.map((c) => c[k][i]), {...clamp, easing: io});
	camera.position.set(v('pos', 0), v('pos', 1), v('pos', 2));
	camera.lookAt(v('mira', 0), v('mira', 1), v('mira', 2));
	camera.updateProjectionMatrix();
	return null;
};

export type Estado3D = {
	t: number;
	claves: Clave[];
	leo: [number, number, number];
	leoRot: number;
	paso: number; // 0..1 ciclo de paso (balanceo de piernas)
	giro: number[]; // rotación de los 3 engranajes (rad)
	realce: number[]; // 0..1 realce de cada engranaje
	puerta: number; // 0..1 apertura
	minutos: number; // minutos que faltan para medianoche (aguja)
	luzPuerta: number;
};

export const Isla3D: React.FC<{e: Estado3D; dientes: number[]}> = ({e, dientes}) => {
	const colors = ['#f2c84b', '#f08c3a', '#4fa3e0'];
	const R = dientes.map((z) => z * K);
	const x0 = -2.2;
	const xs = [x0, x0 + R[0] + R[1] - 0.06, x0 + R[0] + 2 * R[1] + R[2] - 0.12];
	const legA = Math.sin(e.paso * Math.PI * 2) * 0.5;
	const minAng = (e.minutos / 60) * Math.PI * 2;
	return (
		<ThreeCanvas width={1080} height={1920} style={{position: 'absolute', inset: 0}} camera={{fov: 60, position: [0, 9, 18]}} shadows>
			<Camara t={e.t} claves={e.claves} />
			<color attach="background" args={['#f3a77b']} />
			<fog attach="fog" args={['#f6b98e', 16, 34]} />
			<hemisphereLight args={['#ffe9d2', '#5a8a5a', 1.1]} />
			<ambientLight intensity={0.25} />
			<directionalLight position={[-6, 8, 6]} intensity={1.5} color="#ffd6a8" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
			{/* isla */}
			<mesh position={[0, -0.5, -2]} receiveShadow>
				<cylinderGeometry args={[9, 7.5, 1, 9]} />
				<meshStandardMaterial color="#5cb85a" flatShading />
			</mesh>
			<mesh position={[0, -1.6, -2]}>
				<cylinderGeometry args={[7.5, 3, 2.2, 9]} />
				<meshStandardMaterial color="#8a5a32" flatShading />
			</mesh>
			{/* camino de piedras */}
			{[[-6, 2.8], [-5, 2.5], [-4, 2.4], [0.8, -1.2], [1.6, -1.9]].map(([x, z], i) => (
				<mesh key={i} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, i]} receiveShadow>
					<circleGeometry args={[0.32, 6]} />
					<meshStandardMaterial color="#d9cdb5" flatShading />
				</mesh>
			))}
			{/* torre del reloj */}
			<group position={[2.6, 0, -4]}>
				<mesh position={[0, 2.5, 0]} castShadow receiveShadow>
					<boxGeometry args={[2, 5, 2]} />
					<meshStandardMaterial color="#e8cfa6" flatShading />
				</mesh>
				<mesh position={[0, 5.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
					<coneGeometry args={[1.8, 1.8, 4]} />
					<meshStandardMaterial color="#c0503c" flatShading />
				</mesh>
				<mesh position={[0, 3.8, 1.01]}>
					<circleGeometry args={[0.7, 12]} />
					<meshStandardMaterial color="#fff8e6" emissive="#fff1c4" emissiveIntensity={0.4} />
				</mesh>
				{/* aguja de las horas en las 12 y minutero que se acerca a medianoche */}
				<mesh position={[0, 4.0, 1.03]}>
					<boxGeometry args={[0.08, 0.42, 0.02]} />
					<meshStandardMaterial color="#222" />
				</mesh>
				<group position={[0, 3.8, 1.04]} rotation={[0, 0, minAng]}>
					<mesh position={[0, 0.27, 0]}>
						<boxGeometry args={[0.05, 0.56, 0.02]} />
						<meshStandardMaterial color="#c0392b" />
					</mesh>
				</group>
				{/* puerta con bisagra a la izquierda */}
				<group position={[-0.45, 0.75, 1.02]} rotation={[0, -e.puerta * 1.6, 0]}>
					<mesh position={[0.45, 0, 0]} castShadow>
						<boxGeometry args={[0.9, 1.5, 0.06]} />
						<meshStandardMaterial color="#6b3d22" flatShading />
					</mesh>
					<mesh position={[0.75, 0, 0.05]}>
						<boxGeometry args={[0.16, 0.2, 0.06]} />
						<meshStandardMaterial color="#f2c84b" metalness={0.6} roughness={0.3} />
					</mesh>
				</group>
				<mesh position={[0, 0.75, 0.99]}>
					<planeGeometry args={[0.9, 1.5]} />
					<meshStandardMaterial color="#1a1020" emissive="#7fd4ff" emissiveIntensity={e.luzPuerta} />
				</mesh>
			</group>
			<Tree p={[-4.5, 0, -5]} s={1.3} sway={Math.sin(e.t * 0.8) * 0.03} />
			<Tree p={[-2.8, 0, -7]} s={1} sway={Math.sin(e.t * 0.9 + 1) * 0.03} />
			<Tree p={[5.8, 0, -6]} s={1.1} sway={Math.sin(e.t * 0.7 + 2) * 0.03} />
			<Tree p={[-6.2, 0, -1.5]} s={0.9} sway={Math.sin(e.t + 3) * 0.03} />
			<Tree p={[6.4, 0, -1]} s={0.8} sway={Math.sin(e.t * 0.6 + 4) * 0.03} />
			{/* mesa de trabajo */}
			<mesh position={[0, 0.5, 0.3]} castShadow receiveShadow>
				<boxGeometry args={[6, 1, 1.6]} />
				<meshStandardMaterial color="#a8703f" flatShading />
			</mesh>
			{dientes.map((z, i) => (
				<Gear key={i} z={z} x={xs[i]} color={colors[i]} rot={e.giro[i]} lift={e.realce[i] * 0.25} glow={e.realce[i] * 0.45} />
			))}
			{/* Leo */}
			<group position={e.leo} rotation={[0, e.leoRot, 0]}>
				<group position={[-0.13, 0.9, 0]} rotation={[legA, 0, 0]}>
					<mesh position={[0, -0.45, 0]} castShadow>
						<boxGeometry args={[0.22, 0.9, 0.28]} />
						<meshStandardMaterial color="#2f4f8f" flatShading />
					</mesh>
				</group>
				<group position={[0.13, 0.9, 0]} rotation={[-legA, 0, 0]}>
					<mesh position={[0, -0.45, 0]} castShadow>
						<boxGeometry args={[0.22, 0.9, 0.28]} />
						<meshStandardMaterial color="#2f4f8f" flatShading />
					</mesh>
				</group>
				<mesh position={[0, 1.25, 0]} castShadow>
					<boxGeometry args={[0.6, 0.7, 0.35]} />
					<meshStandardMaterial color="#e05a47" flatShading />
				</mesh>
				<mesh position={[0, 1.9, 0]} castShadow>
					<boxGeometry args={[0.5, 0.5, 0.5]} />
					<meshStandardMaterial color="#f1c7a0" flatShading />
				</mesh>
				<mesh position={[0, 2.2, 0]} castShadow>
					<boxGeometry args={[0.55, 0.15, 0.55]} />
					<meshStandardMaterial color="#3a2a1f" flatShading />
				</mesh>
				<mesh position={[-0.11, 1.95, 0.26]}>
					<boxGeometry args={[0.07, 0.07, 0.02]} />
					<meshStandardMaterial color="#111" />
				</mesh>
				<mesh position={[0.11, 1.95, 0.26]}>
					<boxGeometry args={[0.07, 0.07, 0.02]} />
					<meshStandardMaterial color="#111" />
				</mesh>
			</group>
		</ThreeCanvas>
	);
};
