import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';

// Escena 3D low-poly (three.js, MIT) renderizada por Remotion: torre del reloj, isla y engranajes.
const gearShape = (teeth: number, r: number, depth: number) => {
	const s = new THREE.Shape();
	const step = (Math.PI * 2) / teeth;
	for (let i = 0; i < teeth; i++) {
		const a = i * step;
		const pts = [
			[r - depth, a],
			[r, a + step * 0.12],
			[r, a + step * 0.42],
			[r - depth, a + step * 0.54],
		];
		pts.forEach(([rad, an], k) => {
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

const Gear: React.FC<{z: number; x: number; color: string; rot: number}> = ({z, x, color, rot}) => {
	const geo = useMemo(() => new THREE.ExtrudeGeometry(gearShape(z, z * 0.03, 0.09), {depth: 0.18, bevelEnabled: false}), [z]);
	return (
		<mesh geometry={geo} position={[x, 1.0 + z * 0.03, 0.3]} rotation={[0, 0, rot]} castShadow>
			<meshStandardMaterial color={color} flatShading metalness={0.2} roughness={0.6} />
		</mesh>
	);
};

const Tree: React.FC<{p: [number, number, number]; s?: number}> = ({p, s = 1}) => (
	<group position={p} scale={s}>
		<mesh position={[0, 0.5, 0]} castShadow>
			<cylinderGeometry args={[0.12, 0.16, 1, 5]} />
			<meshStandardMaterial color="#7a4b2a" flatShading />
		</mesh>
		<mesh position={[0, 1.5, 0]} castShadow>
			<icosahedronGeometry args={[0.8, 0]} />
			<meshStandardMaterial color="#3fa34d" flatShading />
		</mesh>
	</group>
);

export const LowPolyScene: React.FC = () => {
	const f = useCurrentFrame();
	const spin = f * 0.03;
	return (
		<ThreeCanvas width={1080} height={1920} style={{position: 'absolute', inset: 0}} camera={{fov: 50, position: [0, 8.5, 15], rotation: [-0.42, 0, 0]}} shadows>
			<color attach="background" args={['#8fd3ff']} />
			<fog attach="fog" args={['#bfe6ff', 14, 30]} />
			<hemisphereLight args={['#ffffff', '#5aa05a', 0.9]} />
			<directionalLight position={[5, 9, 6]} intensity={1.6} castShadow />
			{/* isla */}
			<mesh position={[0, -0.5, -2]} receiveShadow>
				<cylinderGeometry args={[9, 7.5, 1, 9]} />
				<meshStandardMaterial color="#5cc25a" flatShading />
			</mesh>
			<mesh position={[0, -1.6, -2]}>
				<cylinderGeometry args={[7.5, 3, 2.2, 9]} />
				<meshStandardMaterial color="#9a6a3c" flatShading />
			</mesh>
			{/* torre del reloj */}
			<group position={[2.6, 0, -4]}>
				<mesh position={[0, 2.5, 0]} castShadow>
					<boxGeometry args={[2, 5, 2]} />
					<meshStandardMaterial color="#e3c9a0" flatShading />
				</mesh>
				<mesh position={[0, 5.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
					<coneGeometry args={[1.8, 1.8, 4]} />
					<meshStandardMaterial color="#c0503c" flatShading />
				</mesh>
				<mesh position={[0, 3.8, 1.01]}>
					<circleGeometry args={[0.7, 12]} />
					<meshStandardMaterial color="#fff8e6" />
				</mesh>
				<mesh position={[0, 4.05, 1.03]}>
					<boxGeometry args={[0.07, 0.5, 0.02]} />
					<meshStandardMaterial color="#222" />
				</mesh>
				<mesh position={[0.15, 3.8, 1.03]} rotation={[0, 0, -Math.PI / 2.4]}>
					<boxGeometry args={[0.06, 0.4, 0.02]} />
					<meshStandardMaterial color="#222" />
				</mesh>
				<mesh position={[0, 0.75, 1.01]}>
					<boxGeometry args={[0.9, 1.5, 0.05]} />
					<meshStandardMaterial color="#6b3d22" flatShading />
				</mesh>
			</group>
			<Tree p={[-4.5, 0, -5]} s={1.3} />
			<Tree p={[-2.8, 0, -7]} s={1} />
			<Tree p={[5.8, 0, -6]} s={1.1} />
			<Tree p={[-5.8, 0, -1.5]} s={0.9} />
			{/* mesa de trabajo con los engranajes */}
			<mesh position={[0, 0.5, 0.3]} castShadow receiveShadow>
				<boxGeometry args={[6, 1, 1.6]} />
				<meshStandardMaterial color="#a8703f" flatShading />
			</mesh>
			<Gear z={10} x={-2.2} color="#f2c84b" rot={spin} />
			<Gear z={20} x={-1.33} color="#f08c3a" rot={-spin / 2 + 0.16} />
			<Gear z={40} x={0.43} color="#4fa3e0" rot={spin / 4} />
			{/* personaje de bloques */}
			<group position={[-3.1, 0, 2.2]} rotation={[0, 0.6, 0]}>
				<mesh position={[0, 0.45, 0]} castShadow>
					<boxGeometry args={[0.5, 0.9, 0.3]} />
					<meshStandardMaterial color="#2f4f8f" flatShading />
				</mesh>
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
			</group>
		</ThreeCanvas>
	);
};
