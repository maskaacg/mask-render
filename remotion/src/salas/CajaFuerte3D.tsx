import React, {useMemo} from 'react';
import * as THREE from 'three';

// Acertijo «código por pistas» como objetos 3D sobre la mesa (no un dibujo): una caja fuerte de latón
// con tres ruedas numeradas y cinco placas grabadas con los intentos del cartógrafo y la respuesta de la caja.
// Paleta única: latón para placas y caja, cifras en tinta oscura, resalte cálido neutro (no tiñe).
export type PlacaPista = {cifras: number[]; texto: string};
export type EstadoCajaFuerte = {
	placas: PlacaPista[];
	ruedas: number[]; // valor mostrado por cada rueda (fraccionario mientras gira)
	luz: number[]; // resalte de cada placa 0..1
	puertaCaja: number; // 0 cerrada · 1 abierta
	aparece: number;
	centro?: [number, number, number];
};

export const LATON = '#b08a46';
const TINTA = '#1d150b';

const lienzo = (w: number, h: number, pinta: (c: CanvasRenderingContext2D) => void) => {
	const cv = document.createElement('canvas');
	cv.width = w;
	cv.height = h;
	const c = cv.getContext('2d')!;
	pinta(c);
	const t = new THREE.CanvasTexture(cv);
	t.anisotropy = 8;
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
};

const texPlaca = (p: PlacaPista) =>
	lienzo(640, 400, (c) => {
		c.fillStyle = '#d8b46a';
		c.fillRect(0, 0, 640, 400);
		c.strokeStyle = '#6b4f22';
		c.lineWidth = 14;
		c.strokeRect(10, 10, 620, 380);
		c.fillStyle = TINTA;
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.font = '700 170px "IBM Plex Mono", monospace';
		c.fillText(p.cifras.join(' '), 320, 160);
		c.font = '600 54px "IBM Plex Mono", monospace';
		c.fillText(p.texto, 320, 320);
	});

// una textura por cifra: la rueda muestra su cifra en una ventanilla plana (legible en vertical)
const texCifra = (d: number) =>
	lienzo(160, 200, (c) => {
		c.fillStyle = '#efe6cf';
		c.fillRect(0, 0, 160, 200);
		c.fillStyle = TINTA;
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.font = '700 150px "IBM Plex Mono", monospace';
		c.fillText(String(d), 80, 108);
	});

const Rueda: React.FC<{x: number; valor: number; tex: THREE.Texture[]}> = ({x, valor, tex}) => {
	// al girar, la cifra «pasa» con un volteo vertical (escala Y) entre una cifra y la siguiente
	const d = Math.round(valor);
	const fr = valor - Math.floor(valor);
	const volteo = Number.isInteger(valor) ? 1 : Math.max(0.08, Math.abs(Math.cos(fr * Math.PI)));
	return (
		<mesh position={[x, 0, 0]} scale={[1, volteo, 1]}>
			<planeGeometry args={[0.085, 0.105]} />
			<meshStandardMaterial map={tex[((d % 10) + 10) % 10]} roughness={0.6} emissive="#fff1d6" emissiveMap={tex[((d % 10) + 10) % 10]} emissiveIntensity={0.15} />
		</mesh>
	);
};

export const CajaFuerte3D: React.FC<{c: EstadoCajaFuerte}> = ({c}) => {
	const c0 = c.centro ?? [0, 0, 0];
	const placasTex = useMemo(() => c.placas.map(texPlaca), [JSON.stringify(c.placas)]);
	const cifras = useMemo(() => Array.from({length: 10}, (_, d) => texCifra(d)), []);
	if (c.aparece <= 0.001) return null;
	// 3 placas delante y 2 detrás-centro, inclinadas hacia la cámara
	const pos: [number, number][] = [
		[-0.5, -0.03],
		[0, -0.03],
		[0.5, -0.03],
		[-0.25, 0.45],
		[0.25, 0.45],
	];
	return (
		<group position={[c0[0], c0[1] + 0.002, c0[2]]} scale={[1, c.aparece, 1]}>
			{/* caja fuerte al fondo de la mesa */}
			{/* peana: eleva la caja para que sus ruedas se vean por encima de las placas */}
			<mesh position={[0, 0.07, -0.36]}>
				<boxGeometry args={[0.7, 0.14, 0.4]} />
				<meshStandardMaterial color="#3a2616" roughness={0.8} />
			</mesh>
			<group position={[0, 0.14, -0.36]}>
				<mesh position={[0, 0.2, 0]}>
					<boxGeometry args={[0.62, 0.4, 0.34]} />
					<meshStandardMaterial color="#3d3a36" metalness={0.7} roughness={0.38} />
				</mesh>
				{/* puerta frontal con bisagra arriba: se abre hacia arriba y no tapa las placas */}
				<group position={[0, 0.38, 0.172]} rotation={[-c.puertaCaja * 1.45, 0, 0]}>
					<mesh position={[0, -0.18, 0]}>
						<boxGeometry args={[0.58, 0.36, 0.02]} />
						<meshStandardMaterial color={LATON} metalness={0.75} roughness={0.32} />
					</mesh>
					{/* ventana de las ruedas */}
					<mesh position={[0, -0.16, 0.011]}>
						<planeGeometry args={[0.36, 0.13]} />
						<meshStandardMaterial color="#141210" />
					</mesh>
					<group position={[0, -0.16, 0.013]}>
						{[-0.11, 0, 0.11].map((x, i) => (
							<Rueda key={i} x={x} valor={c.ruedas[i] ?? 0} tex={cifras} />
						))}
					</group>
					{/* tirador */}
					<mesh position={[0.21, -0.28, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
						<cylinderGeometry args={[0.025, 0.025, 0.04, 20]} />
						<meshStandardMaterial color="#e2c47e" metalness={0.85} roughness={0.25} />
					</mesh>
				</group>
				{/* llave dentro */}
				{c.puertaCaja > 0.05 && (
					<group position={[0, 0.14, 0.05]}>
						<mesh rotation={[0, 0, Math.PI / 2]}>
							<cylinderGeometry args={[0.012, 0.012, 0.16, 12]} />
							<meshStandardMaterial color="#e2c47e" metalness={0.85} roughness={0.25} emissive="#ffcf8a" emissiveIntensity={0.4 * c.puertaCaja} />
						</mesh>
						<mesh position={[-0.09, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
							<torusGeometry args={[0.03, 0.01, 10, 24]} />
							<meshStandardMaterial color="#e2c47e" metalness={0.85} roughness={0.25} emissive="#ffcf8a" emissiveIntensity={0.4 * c.puertaCaja} />
						</mesh>
					</group>
				)}
			</group>
			{/* placas grabadas */}
			{c.placas.map((_, i) => {
				const [x, z] = pos[i];
				const l = c.luz[i] ?? 0;
				return (
					// el borde inferior de la placa apoya en la mesa (antes media placa quedaba hundida)
					<group key={i} position={[x, 0.15 * Math.sin(1.0) + 0.01, z]} rotation={[-1.0, 0, 0]}>
						<mesh position={[0, 0, -0.008]}>
							<boxGeometry args={[0.47, 0.3, 0.014]} />
							<meshStandardMaterial color="#5a4220" metalness={0.5} roughness={0.5} />
						</mesh>
						<mesh>
							<planeGeometry args={[0.45, 0.28]} />
							<meshStandardMaterial map={placasTex[i]} metalness={0.35} roughness={0.45} emissive="#fff1d6" emissiveMap={placasTex[i]} emissiveIntensity={0.08 + 0.42 * l} />
						</mesh>
					</group>
				);
			})}
		</group>
	);
};
