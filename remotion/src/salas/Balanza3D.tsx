import React, {useMemo} from 'react';
import * as THREE from 'three';

// ENIGMA 60 · «La balanza del molinero» (familia palanca_momentos), 22/11/2026.
// Mecanismo 3D real sobre la mesa: una barra con 5 ganchos numerados a cada lado del eje.
// La inclinación se calcula con los momentos (kg × número de gancho) de las pesas colgadas,
// así que lo que se ve es exactamente la cuenta que explica la voz.
export const SEP = 0.12; // distancia (m) entre ganchos
export const ALTO_EJE = 0.62; // altura del eje sobre la mesa
export const MADERA = '#8a5a30';
export const HIERRO = '#3c4148';
export const ACENTO = '#3fd0c0'; // turquesa ENIGMA 60 (pesas sueltas del espectador)

export type Pesa = {kg: number; lado: -1 | 1; gancho: number}; // lado -1 izquierda, 1 derecha
export type PesaSuelta = Pesa & {progreso: number; reposo: [number, number]}; // reposo: x, z sobre la mesa
export type EstadoBalanza = {
	fijas: Pesa[];
	sueltas: PesaSuelta[];
	golpe: number; // 0..1, caída inicial (gancho visual de los 0-2 s)
	luz: {lado: -1 | 1; gancho: number; v: number; color?: string}[];
	ocupado: number; // 0..1, cruz roja sobre el gancho ocupado (la trampa)
	ocupadoEn?: {lado: -1 | 1; gancho: number};
	aparece: number;
	centro?: [number, number, number];
};

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

const texNumero = (n: number) =>
	lienzo(200, 200, (c) => {
		c.fillStyle = '#f1e3c2';
		c.fillRect(0, 0, 200, 200);
		c.strokeStyle = '#4a2e16';
		c.lineWidth = 12;
		c.strokeRect(6, 6, 188, 188);
		c.fillStyle = '#1d150b';
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.font = '800 150px "Oswald", "DejaVu Sans", sans-serif';
		c.fillText(String(n), 100, 110);
	});

const texKg = (kg: number, suelta: boolean) =>
	lienzo(256, 160, (c) => {
		c.fillStyle = suelta ? '#0f3d3a' : '#22262b';
		c.fillRect(0, 0, 256, 160);
		c.fillStyle = suelta ? '#bff7ef' : '#f3efe6';
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.font = '800 104px "Oswald", "DejaVu Sans", sans-serif';
		c.fillText(`${kg} kg`, 128, 86);
	});

/** Momento neto (derecha − izquierda) con las pesas fijas y la parte colgada de las sueltas. */
export const momentoNeto = (b: EstadoBalanza) => {
	let m = 0;
	b.fijas.forEach((p) => (m += p.lado * p.kg * p.gancho));
	b.sueltas.forEach((p) => (m += p.lado * p.kg * p.gancho * Math.min(1, Math.max(0, (p.progreso - 0.75) / 0.25))));
	return m;
};

/** Ángulo de la barra (rad). Positivo = baja la derecha. */
export const inclinacion = (b: EstadoBalanza, t: number) => {
	const m = momentoNeto(b);
	const objetivo = 0.2 * Math.tanh(m / 5);
	// caída inicial con rebote amortiguado: la barra arranca recta y se desploma al empezar el vídeo
	const g = b.golpe;
	const rebote = g < 1 ? 1 - Math.exp(-5.5 * g) * Math.cos(11 * g) : 1;
	return objetivo * rebote + 0.004 * Math.sin(t * 1.3);
};

const Peso: React.FC<{kg: number; suelta: boolean}> = ({kg, suelta}) => {
	const T = useMemo(() => texKg(kg, suelta), [kg, suelta]);
	const r = 0.03 + 0.009 * kg; // la de 3 kg mide menos que la distancia entre ganchos: nunca se tapan
	const h = 0.05 + 0.018 * kg;
	return (
		<group>
			<mesh position={[0, -h / 2, 0]}>
				<cylinderGeometry args={[r, r * 1.05, h, 24]} />
				<meshStandardMaterial color={suelta ? '#1f7f77' : HIERRO} metalness={0.7} roughness={0.35} emissive={suelta ? ACENTO : '#000'} emissiveIntensity={suelta ? 0.25 : 0} />
			</mesh>
			{/* asa */}
			<mesh position={[0, 0.012, 0]} rotation={[0, 0, 0]}>
				<torusGeometry args={[0.018, 0.005, 8, 16]} />
				<meshStandardMaterial color="#c9c2b0" metalness={0.9} roughness={0.25} />
			</mesh>
			{/* etiqueta legible de frente */}
			<mesh position={[0, -h / 2, r + 0.002]}>
				<planeGeometry args={[r * 2.6, r * 1.625]} />
				<meshBasicMaterial map={T} toneMapped={false} />
			</mesh>
		</group>
	);
};

export const Balanza3D: React.FC<{b: EstadoBalanza; t: number}> = ({b, t}) => {
	const nums = useMemo(() => [1, 2, 3, 4, 5].map(texNumero), []);
	const c = b.centro ?? [0, 0, 0];
	const ang = inclinacion(b, t);
	const L = SEP * 5 + 0.07;
	// posición en mundo (relativa a la mesa) del gancho k del lado s, con la barra inclinada
	const gancho = (s: -1 | 1, k: number): [number, number] => {
		const d = s * k * SEP;
		return [d * Math.cos(ang), ALTO_EJE - d * Math.sin(ang) - 0.045];
	};
	const cuerda = 0.16;
	const brillo = (s: -1 | 1, k: number) => b.luz.filter((l) => l.lado === s && l.gancho === k).reduce((a, l) => Math.max(a, l.v), 0);
	const colorLuz = (s: -1 | 1, k: number) => b.luz.find((l) => l.lado === s && l.gancho === k && l.v > 0.05)?.color ?? '#ffd27a';
	const s = 0.85 + 0.15 * b.aparece;
	return (
		<group position={c} scale={[s, s, s]}>
			{/* pie y eje */}
			<mesh position={[0, 0.02, 0]}>
				<boxGeometry args={[0.36, 0.04, 0.22]} />
				<meshStandardMaterial color="#3a2616" roughness={0.8} />
			</mesh>
			<mesh position={[0, ALTO_EJE / 2, 0]}>
				<boxGeometry args={[0.07, ALTO_EJE, 0.07]} />
				<meshStandardMaterial color="#4a2e1a" roughness={0.75} />
			</mesh>
			<mesh position={[0, ALTO_EJE, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.03, 0.03, 0.06, 18]} />
				<meshStandardMaterial color="#c9a45a" metalness={0.85} roughness={0.3} />
			</mesh>
			{/* fiel: aguja que marca si la barra está recta */}
			<group position={[0, ALTO_EJE, 0.085]} rotation={[0, 0, -ang]}>
				<mesh position={[0, 0.11, 0]}>
					<boxGeometry args={[0.012, 0.2, 0.01]} />
					<meshStandardMaterial color={Math.abs(ang) < 0.012 ? ACENTO : '#e04a30'} emissive={Math.abs(ang) < 0.012 ? ACENTO : '#e04a30'} emissiveIntensity={0.8} />
				</mesh>
			</group>
			<mesh position={[0, ALTO_EJE + 0.13, 0.075]}>
				<boxGeometry args={[0.012, 0.03, 0.004]} />
				<meshStandardMaterial color="#f1e3c2" />
			</mesh>
			{/* barra */}
			<group position={[0, ALTO_EJE, 0]} rotation={[0, 0, -ang]}>
				<mesh>
					<boxGeometry args={[L * 2, 0.05, 0.07]} />
					<meshStandardMaterial color={MADERA} roughness={0.7} />
				</mesh>
				{([-1, 1] as const).map((sd) =>
					[1, 2, 3, 4, 5].map((k) => {
						const v = brillo(sd, k);
						return (
							<group key={`${sd}${k}`} position={[sd * k * SEP, 0, 0]}>
								{/* gancho */}
								<mesh position={[0, -0.04, 0]}>
									<torusGeometry args={[0.012, 0.004, 6, 12, Math.PI * 1.4]} />
									<meshStandardMaterial color="#c9c2b0" metalness={0.9} roughness={0.3} />
								</mesh>
								{/* número del gancho, grande y de frente */}
								<mesh position={[0, 0.085, 0.036]}>
									<planeGeometry args={[0.092, 0.092]} />
									<meshBasicMaterial map={nums[k - 1]} toneMapped={false} />
								</mesh>
								{v > 0.01 && (
									<mesh position={[0, 0.085, 0.034]}>
										<planeGeometry args={[0.12, 0.12]} />
										<meshBasicMaterial color={colorLuz(sd, k)} transparent opacity={0.9 * v} toneMapped={false} />
									</mesh>
								)}
								{b.ocupadoEn && b.ocupadoEn.lado === sd && b.ocupadoEn.gancho === k && b.ocupado > 0.01 && (
									<group position={[0, 0.085, 0.04]}>
										{[1, -1].map((g) => (
											<mesh key={g} rotation={[0, 0, (g * Math.PI) / 4]}>
												<boxGeometry args={[0.13, 0.016, 0.004]} />
												<meshBasicMaterial color="#ff3b2e" transparent opacity={b.ocupado} toneMapped={false} />
											</mesh>
										))}
									</group>
								)}
							</group>
						);
					}),
				)}
			</group>
			{/* pesas fijas colgadas: la cuerda sigue al gancho y la pesa cuelga en vertical */}
			{b.fijas.map((p, i) => {
				const [x, y] = gancho(p.lado, p.gancho);
				return (
					<group key={`f${i}`} position={[x, y, 0]}>
						<mesh position={[0, -cuerda / 2, 0]}>
							<cylinderGeometry args={[0.0025, 0.0025, cuerda, 6]} />
							<meshStandardMaterial color="#d9cfb0" />
						</mesh>
						<group position={[0, -cuerda, 0]}>
							<Peso kg={p.kg} suelta={false} />
						</group>
					</group>
				);
			})}
			{/* pesas sueltas: de la mesa a su gancho siguiendo un arco */}
			{b.sueltas.map((p, i) => {
				const [gx, gy] = gancho(p.lado, p.gancho);
				const fin: [number, number, number] = [gx, gy - cuerda, 0];
				const ini: [number, number, number] = [p.reposo[0], 0.055 + 0.018 * p.kg, p.reposo[1]];
				const q = Math.min(1, Math.max(0, p.progreso));
				const pos = [0, 1, 2].map((j) => ini[j] + (fin[j] - ini[j]) * q) as [number, number, number];
				pos[1] += Math.sin(q * Math.PI) * 0.22; // arco
				const cuelga = q > 0.75 ? (q - 0.75) / 0.25 : 0;
				const largo = cuerda * cuelga;
				return (
					<group key={`s${i}`}>
						{cuelga > 0.01 && (
							<mesh position={[gx, gy - largo / 2, 0]}>
								<cylinderGeometry args={[0.0025, 0.0025, Math.max(0.001, largo), 6]} />
								<meshStandardMaterial color="#d9cfb0" />
							</mesh>
						)}
						<group position={pos}>
							<Peso kg={p.kg} suelta />
						</group>
					</group>
				);
			})}
		</group>
	);
};
