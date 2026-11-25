import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {
	Agua, ARC, ARC0, Burbujas, Cable, CABLES, Camara, FLOOR_Y, GAUGE_X, GAUGE_Y, Guante, hash, HULL_R, Manometro, Polvo, Remaches,
	TANK_X, TANK_Z, Tanque, tex, useTexturas, Volante,
} from '../diorama/SalaLastre3D';

// ENIGMA 60 · «Profundidad 600» · capítulo 1. Sala de lastre ampliada (kit submarino, procedural, three.js MIT).
// Todo depende solo del estado (determinista). 3D a 1280x720 ampliado a 1920x1080.

const W3D = 1280;
const H3D = 720;

export type EstadoCap = {
	t: number;
	cam: {pos: [number, number, number]; mira: [number, number, number]; fov: number};
	agua: number;
	agujas: [number, number, number];
	pista: Record<string, number>; // luz cian por objeto: A, B, C, placa, caja, cuadro, cajones, bascula, reloj, armario, indicador
	valvulas: [number, number, number];
	escotilla: number;
	violeta: number; // destello del «0» en el reloj
	guante: {visible: number; pos: [number, number, number]; rot: [number, number, number]; orden?: 'XYZ' | 'YXZ'};
	alarma: number;
	soplado: number;
	linterna: number;
	energia: number;
	inclinacion: number;
	caja: number; // tapa 0..1
	linternaEnCaja: number;
	cajon: number; // cajón de abajo «RADAR» 0..1
	fusible: number; // 0 en el cajón … 1 colocado en el cuadro
	chispa: number;
	brazo: number; // ángulo de la báscula (rad, + = izquierda abajo)
	pesas: [number, number, number]; // progreso 0..1 de las pesas de 1, 3 y 9 kg hacia su platillo
	relojMin: number; // minutos desde las 12:00 que marcan las agujas
	armario: number;
	indicador: number; // 0..12
	altavoz: number;
};

const useTexCap = () =>
	useMemo(() => {
		// P1 «El cuaderno boca abajo»: el cuaderno flota del revés; su dueño escribió 91, el espectador ve «16».
		const cuaderno = tex(512, 384, (c) => {
			c.translate(512, 384);
			c.rotate(Math.PI);
			c.fillStyle = '#e9e1c9';
			c.fillRect(0, 0, 512, 384);
			c.strokeStyle = 'rgba(80,110,160,0.35)';
			for (let y = 40; y < 384; y += 36) {
				c.beginPath();
				c.moveTo(20, y);
				c.lineTo(492, y);
				c.stroke();
			}
			c.fillStyle = '#23324d';
			c.font = '600 30px "IBM Plex Mono", monospace';
			c.textAlign = 'center';
			c.fillText('REGISTRO DE INMERSIÓN', 256, 44);
			// «91» a rotulador: el 1 es un palo recto (sin pie) para que, del revés, se lea «16»
			c.strokeStyle = '#141414';
			c.lineWidth = 26;
			c.lineCap = 'round';
			c.beginPath();
			c.arc(200, 185, 52, 0, Math.PI * 2);
			c.stroke();
			c.beginPath();
			c.moveTo(252, 185);
			c.quadraticCurveTo(254, 315, 160, 322); // cola curva del 9: del revés es la del 6
			c.stroke();
			c.beginPath();
			c.moveTo(340, 130);
			c.lineTo(340, 320);
			c.stroke();
			c.fillStyle = 'rgba(60,40,20,0.22)';
			c.beginPath();
			c.arc(430, 330, 46, 0, Math.PI * 2);
			c.fill();
		});
		const etiqueta = (txt: string) =>
			tex(512, 128, (c) => {
				c.fillStyle = '#d8d2bf';
				c.fillRect(0, 0, 512, 128);
				c.strokeStyle = '#3b3326';
				c.lineWidth = 6;
				c.strokeRect(6, 6, 500, 116);
				c.fillStyle = '#1e1a14';
				c.font = `600 ${txt.length > 10 ? 46 : 64}px "IBM Plex Mono", monospace`;
				c.textAlign = 'center';
				c.textBaseline = 'middle';
				c.fillText(txt, 256, 68);
			});
		const esferaReloj = tex(512, 512, (c) => {
			c.fillStyle = '#ece6d2';
			c.beginPath();
			c.arc(256, 256, 250, 0, Math.PI * 2);
			c.fill();
			c.translate(256, 256);
			c.fillStyle = '#1d1d1d';
			c.textAlign = 'center';
			c.textBaseline = 'middle';
			c.font = '600 54px "Fraunces", serif';
			for (let h = 1; h <= 12; h++) {
				const a = (h / 12) * Math.PI * 2;
				c.fillText(String(h), Math.sin(a) * 190, -Math.cos(a) * 190);
			}
			for (let m = 0; m < 60; m++) {
				const a = (m / 60) * Math.PI * 2;
				c.lineWidth = m % 5 === 0 ? 6 : 2;
				c.beginPath();
				c.moveTo(Math.sin(a) * 225, -Math.cos(a) * 225);
				c.lineTo(Math.sin(a) * 242, -Math.cos(a) * 242);
				c.strokeStyle = '#1d1d1d';
				c.stroke();
			}
			c.strokeStyle = 'rgba(70,50,30,0.35)';
			c.lineWidth = 3;
			c.beginPath();
			c.moveTo(-120, 160);
			c.bezierCurveTo(-60, 120, -20, 180, 40, 140);
			c.stroke();
		});
		const cero = tex(256, 256, (c) => {
			c.clearRect(0, 0, 256, 256);
			c.strokeStyle = '#ffffff';
			c.lineWidth = 16;
			c.lineCap = 'round';
			c.beginPath();
			c.ellipse(128, 128, 46, 72, 0, 0, Math.PI * 2);
			c.stroke();
		});
		const dial = tex(512, 288, (c) => {
			c.fillStyle = '#2a3133';
			c.fillRect(0, 0, 512, 288);
			c.translate(256, 262);
			c.fillStyle = '#e6e2d4';
			c.beginPath();
			c.arc(0, 0, 230, Math.PI, 0);
			c.fill();
			c.fillStyle = '#1d1d1d';
			c.textAlign = 'center';
			c.textBaseline = 'middle';
			c.font = '600 30px "IBM Plex Mono", monospace';
			for (let v = 0; v <= 12; v++) {
				const a = Math.PI + (v / 12) * Math.PI;
				c.lineWidth = v === 10 ? 8 : 4;
				c.strokeStyle = v === 10 ? '#2fb8bd' : '#1d1d1d';
				c.beginPath();
				c.moveTo(Math.cos(a) * 190, Math.sin(a) * 190);
				c.lineTo(Math.cos(a) * 222, Math.sin(a) * 222);
				c.stroke();
				c.fillText(String(v), Math.cos(a) * 160, Math.sin(a) * 160);
			}
		});
		const nota = tex(256, 192, (c) => {
			c.fillStyle = '#f1e7b8';
			c.fillRect(0, 0, 256, 192);
			c.fillStyle = '#2a2318';
			c.font = '400 30px "Architects Daughter", cursive';
			c.font = '400 25px "Architects Daughter", cursive';
			c.fillText('Se lee igual', 18, 52);
			c.fillText('al derecho y', 18, 88);
			c.fillText('al revés.', 18, 124);
			c.fillText('¡No el del medio!', 18, 164);
		});
		const placaVolante = tex(512, 256, (c) => {
			c.fillStyle = '#8a6a3c';
			c.fillRect(0, 0, 512, 256);
			c.fillStyle = '#2b2012';
			c.font = '600 44px "IBM Plex Mono", monospace';
			c.textAlign = 'center';
			c.fillText('EMERGENCIA', 256, 90);
			c.font = '600 32px "IBM Plex Mono", monospace';
			c.fillText('APERTURA DE ESCOTILLA', 256, 170);
		});
		const lingote = tex(256, 128, (c) => {
			c.fillStyle = '#6b6f75';
			c.fillRect(0, 0, 256, 128);
			c.fillStyle = '#e8e8e8';
			c.font = '600 64px "IBM Plex Mono", monospace';
			c.textAlign = 'center';
			c.textBaseline = 'middle';
			c.fillText('7 kg', 128, 68);
		});
		return {cuaderno, eLlave: etiqueta('SONAR'), eFusible: etiqueta('ROTOR'), eAmbos: etiqueta('RADAR'), esferaReloj, cero, dial, nota, placaVolante, lingote};
	}, []);

const halo = (v: number) => ({emissive: '#3fe0e6', emissiveIntensity: v * 0.15});

// ---------- objetos nuevos del kit ----------
const CAJA_POS: [number, number, number] = [0.75, 0, 3.0];
const CUADRO_POS: [number, number, number] = [2.28, 0.45, 1.3];
const CAJONES_POS: [number, number, number] = [2.12, -1.0, 1.3];
export const BASCULA_POS: [number, number, number] = [0.55, -0.3, -0.5];
const RELOJ_POS: [number, number, number] = [1.45, 1.15, -5.93];
const ARMARIO_POS: [number, number, number] = [1.6, -0.72, -5.83];
const DIAL_POS: [number, number, number] = [0, 1.32, -5.92];

const CajaHerramientas: React.FC<{e: EstadoCap; T: ReturnType<typeof useTexCap>}> = ({e, T}) => {
	const y = e.agua + 0.06 + Math.sin(e.t * 1.3) * 0.015;
	return (
		<group position={[CAJA_POS[0], y, CAJA_POS[2]]} rotation={[Math.sin(e.t * 0.9) * 0.04, 0.4, Math.sin(e.t * 1.1) * 0.05]}>
			<mesh>
				<boxGeometry args={[0.56, 0.2, 0.32]} />
				<meshStandardMaterial color="#a8402a" metalness={0.45} roughness={0.45} {...halo(e.pista.caja ?? 0)} />
			</mesh>
			<group position={[0, 0.1, -0.16]} rotation={[-e.caja * 1.7, 0, 0]}>
				<mesh position={[0, 0.03, 0.16]}>
					<boxGeometry args={[0.57, 0.06, 0.33]} />
					<meshStandardMaterial color="#b44a30" metalness={0.45} roughness={0.45} />
				</mesh>
				<mesh position={[0, 0.062, 0.16]} rotation={[-Math.PI / 2, 0, 0.08]}>
					<planeGeometry args={[0.34, 0.25]} />
					<meshStandardMaterial map={T.cuaderno} roughness={0.9} />
				</mesh>
			</group>
			{/* candado */}
			<group position={[0, 0.02, 0.17]}>
				<mesh>
					<boxGeometry args={[0.09, 0.08, 0.03]} />
					<meshStandardMaterial color="#c9a45c" metalness={0.85} roughness={0.3} />
				</mesh>
				<mesh position={[0, 0.06, 0]} visible={e.caja < 0.05}>
					<torusGeometry args={[0.03, 0.008, 6, 16, Math.PI]} />
					<meshStandardMaterial color="#b8bec8" metalness={0.9} roughness={0.25} />
				</mesh>
			</group>
			{e.linternaEnCaja > 0.01 && (
				<mesh position={[0.05, 0.06, 0]} rotation={[0, 0, Math.PI / 2]} scale={e.linternaEnCaja}>
					<cylinderGeometry args={[0.035, 0.045, 0.24, 16]} />
					<meshStandardMaterial color="#e2b13c" metalness={0.5} roughness={0.4} emissive="#ffe39a" emissiveIntensity={0.2} />
				</mesh>
			)}
		</group>
	);
};

const CuadroYCajones: React.FC<{e: EstadoCap; T: ReturnType<typeof useTexCap>}> = ({e, T}) => {
	const etiquetas = [T.eLlave, T.eFusible, T.eAmbos];
	// el fusible viaja del cajón 3 al hueco del cuadro
	const f = e.fusible;
	const desde = new THREE.Vector3(CAJONES_POS[0] - 0.2 - e.cajon * 0.28, CAJONES_POS[1] - 0.22 + 0.08, CAJONES_POS[2]);
	const hasta = new THREE.Vector3(CUADRO_POS[0] - 0.1, CUADRO_POS[1], CUADRO_POS[2]);
	const fp = desde.clone().lerp(hasta, f);
	fp.y += Math.sin(f * Math.PI) * 0.35;
	return (
		<group>
			{/* cuadro eléctrico */}
			<group position={CUADRO_POS} rotation={[0, -Math.PI / 2, 0]}>
				<mesh>
					<boxGeometry args={[0.62, 0.5, 0.12]} />
					<meshStandardMaterial color="#59625f" metalness={0.5} roughness={0.5} {...halo(e.pista.cuadro ?? 0)} />
				</mesh>
				{[-0.18, 0, 0.18].map((x, i) => (
					<group key={x} position={[x, 0, 0.07]}>
						<mesh rotation={[Math.PI / 2, 0, 0]}>
							<cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
							<meshStandardMaterial color="#202325" />
						</mesh>
						{(i !== 1 || f > 0.98) && (
							<mesh position={[0, 0, 0.03]} rotation={[0, 0, Math.PI / 2]}>
								<cylinderGeometry args={[0.025, 0.025, 0.12, 12]} />
								<meshStandardMaterial color="#d9c47a" metalness={0.6} roughness={0.35} emissive="#ffd36a" emissiveIntensity={e.energia * 0.6} />
							</mesh>
						)}
					</group>
				))}
				<mesh position={[0.22, 0.18, 0.07]}>
					<sphereGeometry args={[0.022, 10, 8]} />
					<meshBasicMaterial color={e.energia > 0.5 ? '#6dff9a' : '#3a1210'} toneMapped={false} />
				</mesh>
			</group>
			{e.chispa > 0.01 && (
				<pointLight position={[CUADRO_POS[0] - 0.2, CUADRO_POS[1], CUADRO_POS[2]]} color="#bfe8ff" intensity={6 * e.chispa} distance={2.5} decay={2} />
			)}
			{/* mueble de cajones */}
			<group position={CAJONES_POS} rotation={[0, -Math.PI / 2, 0]}>
				<mesh position={[0, 0, -0.05]}>
					<boxGeometry args={[0.72, 0.78, 0.46]} />
					<meshStandardMaterial color="#4f5a52" metalness={0.4} roughness={0.6} {...halo(e.pista.cajones ?? 0)} />
				</mesh>
				{[0.25, 0, -0.25].map((y, i) => (
					<group key={y} position={[0, y, 0.18 + (i === 2 ? e.cajon * 0.28 : 0)]}>
						<mesh>
							<boxGeometry args={[0.66, 0.22, 0.06]} />
							<meshStandardMaterial color="#606b62" metalness={0.45} roughness={0.5} />
						</mesh>
						<mesh position={[0, 0.02, 0.031]}>
							<planeGeometry args={[0.42, 0.105]} />
							<meshStandardMaterial map={etiquetas[i]} roughness={0.9} />
						</mesh>
						<mesh position={[0, -0.07, 0.04]}>
							<boxGeometry args={[0.16, 0.025, 0.03]} />
							<meshStandardMaterial color="#b8bec8" metalness={0.85} roughness={0.3} />
						</mesh>
					</group>
				))}
				<mesh position={[0.22, 0.42, 0.0]} rotation={[-Math.PI / 2, 0, -0.2]}>
					<planeGeometry args={[0.22, 0.165]} />
					<meshStandardMaterial map={T.nota} roughness={0.95} />
				</mesh>
			</group>
			{e.cajon > 0.3 && (
				<mesh position={fp} rotation={[0, 0, Math.PI / 2]}>
					<cylinderGeometry args={[0.025, 0.025, 0.12, 12]} />
					<meshStandardMaterial color="#d9c47a" metalness={0.6} roughness={0.35} emissive="#3fe0e6" emissiveIntensity={0.25} />
				</mesh>
			)}
		</group>
	);
};

const Bascula: React.FC<{e: EstadoCap; T: ReturnType<typeof useTexCap>}> = ({e, T}) => {
	const [px, py, pz] = BASCULA_POS;
	const th = e.brazo;
	const L = 0.48;
	const fin = (s: number): [number, number, number] => [px + s * L * Math.cos(th), py + s * L * Math.sin(th) - 0.38, pz];
	const izq = fin(-1);
	const der = fin(1);
	// pesas: 1 kg y 9 kg al platillo derecho; 3 kg al izquierdo
	const caja: [number, number, number] = [px + 0.95, -0.95, pz + 0.35];
	const pesas = [
		{kg: 1, r: 0.045, h: 0.05, dest: [der[0] + 0.1, der[1] + 0.05, der[2]] as [number, number, number], i: 0},
		{kg: 3, r: 0.06, h: 0.07, dest: [izq[0] + 0.12, izq[1] + 0.06, izq[2]] as [number, number, number], i: 1},
		{kg: 9, r: 0.085, h: 0.11, dest: [der[0] - 0.06, der[1] + 0.075, der[2]] as [number, number, number], i: 2},
	];
	const mat = <meshStandardMaterial color="#8c7a55" metalness={0.75} roughness={0.35} {...halo(e.pista.bascula ?? 0)} />;
	return (
		<group>
			<mesh position={[px, -1.15, pz]}>
				<cylinderGeometry args={[0.05, 0.1, 1.4, 16]} />
				{mat}
			</mesh>
			<mesh position={[px, py, pz]} rotation={[0, 0, th]}>
				<boxGeometry args={[L * 2, 0.04, 0.05]} />
				{mat}
			</mesh>
			<mesh position={[px, py + 0.06, pz]}>
				<coneGeometry args={[0.04, 0.12, 12]} />
				<meshStandardMaterial color="#b8bec8" metalness={0.9} roughness={0.25} />
			</mesh>
			{[izq, der].map((p, i) => (
				<group key={i}>
					<mesh position={[p[0], p[1] + 0.19, p[2]]}>
						<cylinderGeometry args={[0.006, 0.006, 0.38, 6]} />
						<meshStandardMaterial color="#3a3a3a" />
					</mesh>
					<mesh position={p}>
						<cylinderGeometry args={[0.18, 0.15, 0.025, 28]} />
						{mat}
					</mesh>
				</group>
			))}
			{/* lingote de 7 kg en el platillo izquierdo */}
			<group position={[izq[0] - 0.05, izq[1] + 0.05, izq[2]]}>
				<mesh>
					<boxGeometry args={[0.16, 0.07, 0.1]} />
					<meshStandardMaterial color="#6b6f75" metalness={0.5} roughness={0.5} />
				</mesh>
				<mesh position={[0, 0, 0.051]}>
					<planeGeometry args={[0.15, 0.065]} />
					<meshStandardMaterial map={T.lingote} />
				</mesh>
			</group>
			{/* caja de pesas */}
			<mesh position={caja}>
				<boxGeometry args={[0.36, 0.14, 0.22]} />
				<meshStandardMaterial color="#5a4630" roughness={0.8} />
			</mesh>
			{pesas.map((w) => {
				const p0: [number, number, number] = [caja[0] - 0.11 + w.i * 0.11, caja[1] + 0.1, caja[2]];
				const k = e.pesas[w.i];
				const pos = p0.map((v, j) => v + (w.dest[j] - v) * k) as [number, number, number];
				pos[1] += Math.sin(k * Math.PI) * 0.35;
				return (
					<mesh key={w.kg} position={pos}>
						<cylinderGeometry args={[w.r, w.r, w.h, 20]} />
						<meshStandardMaterial color="#9aa1aa" metalness={0.85} roughness={0.3} />
					</mesh>
				);
			})}
		</group>
	);
};

const Reloj: React.FC<{e: EstadoCap; T: ReturnType<typeof useTexCap>}> = ({e, T}) => {
	const m = e.relojMin;
	const aH = -((m / 720) * Math.PI * 2);
	const aM = -(((m % 60) / 60) * Math.PI * 2);
	return (
		<group position={RELOJ_POS}>
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.02]}>
				<cylinderGeometry args={[0.36, 0.38, 0.06, 40]} />
				<meshStandardMaterial color="#b08d57" metalness={0.85} roughness={0.3} {...halo(e.pista.reloj ?? 0)} />
			</mesh>
			<mesh position={[0, 0, 0.012]}>
				<circleGeometry args={[0.32, 48]} />
				<meshStandardMaterial map={T.esferaReloj} emissive="#ffffff" emissiveMap={T.esferaReloj} emissiveIntensity={0.12 + (e.pista.reloj ?? 0) * 0.2} />
			</mesh>
			<mesh position={[0, 0, 0.016]}>
				<planeGeometry args={[0.09, 0.09]} />
				<meshBasicMaterial map={T.cero} transparent color="#7b5cff" opacity={0.15 + e.violeta * 0.85} toneMapped={false} />
			</mesh>
			<group rotation={[0, 0, aH]} position={[0, 0, 0.022]}>
				<mesh position={[0, 0.08, 0]}>
					<boxGeometry args={[0.022, 0.17, 0.006]} />
					<meshStandardMaterial color="#141414" />
				</mesh>
			</group>
			<group rotation={[0, 0, aM]} position={[0, 0, 0.026]}>
				<mesh position={[0, 0.12, 0]}>
					<boxGeometry args={[0.014, 0.25, 0.006]} />
					<meshStandardMaterial color="#141414" />
				</mesh>
			</group>
			{e.violeta > 0.01 && <pointLight position={[0, 0, 0.3]} color="#7b5cff" intensity={2.5 * e.violeta} distance={1.5} decay={2} />}
		</group>
	);
};

const ArmarioYDial: React.FC<{e: EstadoCap; T: ReturnType<typeof useTexCap>}> = ({e, T}) => {
	const ang = Math.PI - (e.indicador / 12) * Math.PI;
	return (
		<group>
			<group position={ARMARIO_POS}>
				<mesh position={[0, 0, -0.1]}>
					<boxGeometry args={[0.55, 0.72, 0.22]} />
					<meshStandardMaterial color="#7a2a20" metalness={0.4} roughness={0.55} {...halo(e.pista.armario ?? 0)} />
				</mesh>
				<mesh position={[0, 0, 0.0]}>
					<planeGeometry args={[0.36, 0.18]} />
					<meshStandardMaterial map={T.placaVolante} metalness={0.5} roughness={0.4} />
				</mesh>
				<group position={[-0.27, 0, 0.02]} rotation={[0, -e.armario * 1.9, 0]}>
					<mesh position={[0.27, 0, 0]}>
						<boxGeometry args={[0.54, 0.7, 0.03]} />
						<meshStandardMaterial color="#8e3225" metalness={0.4} roughness={0.55} />
					</mesh>
					<mesh position={[0.48, 0, 0.03]}>
						<boxGeometry args={[0.05, 0.14, 0.03]} />
						<meshStandardMaterial color="#b8bec8" metalness={0.85} roughness={0.3} />
					</mesh>
				</group>
			</group>
			<group position={DIAL_POS}>
				<mesh>
					<planeGeometry args={[0.7, 0.394]} />
					<meshStandardMaterial map={T.dial} emissive="#ffffff" emissiveMap={T.dial} emissiveIntensity={0.1 + (e.pista.indicador ?? 0) * 0.25} />
				</mesh>
				<group position={[0, -0.16, 0.01]} rotation={[0, 0, ang]}>
					<mesh position={[0.13, 0, 0]}>
						<boxGeometry args={[0.26, 0.012, 0.005]} />
						<meshStandardMaterial color="#b3261e" />
					</mesh>
				</group>
			</group>
		</group>
	);
};

const Altavoces: React.FC<{v: number; t: number}> = ({v, t}) => {
	const i = v * (0.6 + 0.4 * Math.abs(Math.sin(t * 17)) * Math.abs(Math.sin(t * 5.3)));
	return (
		<>
			{[-1.25, 1.25].map((x) => (
				<group key={x} position={[x, 2.15, -5.2]} rotation={[0.3, 0, x > 0 ? 0.55 : -0.55]}>
					<mesh>
						<boxGeometry args={[0.42, 0.06, 0.26]} />
						<meshStandardMaterial color="#2c3336" metalness={0.5} roughness={0.5} />
					</mesh>
					{[-0.14, -0.07, 0, 0.07, 0.14].map((z) => (
						<mesh key={z} position={[0, -0.032, z * 0.8]}>
							<boxGeometry args={[0.36, 0.006, 0.02]} />
							<meshBasicMaterial color="#3fe0e6" transparent opacity={0.15 + i * 0.85} toneMapped={false} />
						</mesh>
					))}
				</group>
			))}
			{v > 0.01 && <pointLight position={[0, 1.9, -5.0]} color="#3fe0e6" intensity={5 * i} distance={4} decay={1.6} />}
		</>
	);
};

export const SalaCapitulo3D: React.FC<{e: EstadoCap; ancho?: number; alto?: number; escala?: number}> = ({e, ancho = W3D, alto = H3D, escala = 1920 / W3D}) => {
	const T = useTexturas();
	const C = useTexCap();
	const {t} = e;
	const hull = useMemo(() => {
		const g = new THREE.CylinderGeometry(HULL_R, HULL_R, 13, 64, 1, true);
		g.rotateX(Math.PI / 2);
		return g;
	}, []);
	const swing = Math.sin(t * 0.9) * 0.08;
	const lampPos: [number, number, number] = [0.45 + Math.sin(swing) * 0.6, 1.55, -0.6];
	const parpadeo = 1 - (hash(Math.floor(t * 12)) > 0.93 ? 0.55 : 0);
	const giro = t * 2.4;
	const alarmTarget = useMemo(() => new THREE.Object3D(), []);
	alarmTarget.position.set(Math.cos(giro) * 3, 1.2, -2.2 + Math.sin(giro) * 3);
	alarmTarget.updateMatrixWorld();
	const pistaTarget = useMemo(() => new THREE.Object3D(), []);
	const OBJ: Record<string, [number, number, number]> = {
		A: [GAUGE_X, GAUGE_Y, TANK_Z[0]], B: [GAUGE_X, GAUGE_Y, TANK_Z[1]], C: [GAUGE_X, GAUGE_Y, TANK_Z[2]], placa: [2.28, 0.1, -2.2],
		caja: [CAJA_POS[0], e.agua, CAJA_POS[2]], cuadro: CUADRO_POS, cajones: CAJONES_POS, bascula: BASCULA_POS, reloj: RELOJ_POS, armario: ARMARIO_POS, indicador: DIAL_POS,
	};
	let clave = 'A';
	let luzPista = 0;
	for (const [k, v] of Object.entries(e.pista)) if (v > luzPista && OBJ[k]) [clave, luzPista] = [k, v];
	const objetivo = OBJ[clave];
	pistaTarget.position.set(...objetivo);
	pistaTarget.updateMatrixWorld();
	const hingeX = -0.85;
	const energia = e.energia;

	return (
		<ThreeCanvas width={ancho} height={alto} style={{position: 'absolute', left: 0, top: 0, transform: `scale(${escala})`, transformOrigin: '0 0'}} camera={{fov: 50, position: [0, 0, 5]}} gl={{antialias: true}}>
			<Camara c={e.cam} />
			<color attach="background" args={['#0b0f12']} />
			<fogExp2 attach="fog" args={['#0a1316', 0.07]} />
			<hemisphereLight args={['#2b4a50', '#07090b', 0.55 + 0.2 * Math.max(e.linterna, energia)]} />
			{e.linterna > 0.01 && (
				<spotLight
					position={[e.cam.pos[0] + 0.15, e.cam.pos[1] - 0.1, e.cam.pos[2]]}
					target={pistaTarget}
					color="#e2f1ff"
					intensity={14 * e.linterna}
					angle={0.55}
					penumbra={0.8}
					distance={9}
					decay={1.4}
				/>
			)}
			<pointLight position={[e.cam.pos[0], e.cam.pos[1] + 0.15, e.cam.pos[2]]} color="#d6ecff" intensity={1.2 + 1.4 * e.linterna} distance={5} decay={1.6} />
			{energia > 0.01 && <pointLight position={lampPos} color="#ffcf8f" intensity={9 * parpadeo * energia} distance={9} decay={1.6} />}
			<mesh position={lampPos}>
				<sphereGeometry args={[0.07, 16, 12]} />
				<meshBasicMaterial color={energia > 0.5 ? '#fff1c9' : '#3a3428'} toneMapped={false} />
			</mesh>
			<Cable pts={[[0.45, 2.95, -0.6], [lampPos[0], 2.2, -0.6], [lampPos[0], lampPos[1] + 0.2, lampPos[2]]]} r={0.01} />
			{e.alarma > 0.01 && (
				<spotLight position={[0.2, 2.6, -2.2]} target={alarmTarget} color="#ff2a1a" intensity={22 * e.alarma} angle={0.5} penumbra={0.6} distance={10} decay={1.4} />
			)}
			<mesh position={[0.2, 2.72, -2.2]}>
				<sphereGeometry args={[0.13, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
				<meshStandardMaterial color="#5a0d08" emissive="#ff2a1a" emissiveIntensity={0.4 + 0.9 * e.alarma * (0.5 + 0.5 * Math.sin(giro * 2))} />
			</mesh>
			{energia > 0.01 && <pointLight position={[TANK_X + 0.9, 1.3, -2.6]} color="#ffae42" intensity={2.2 * energia} distance={4} decay={2} />}
			{luzPista > 0.01 && (
				<spotLight position={[objetivo[0] > 1 ? 0.6 : 0.9, 1.6, objetivo[2] + 1.4]} target={pistaTarget} color="#3fe0e6" intensity={18 * luzPista} angle={0.25} penumbra={0.5} distance={6} decay={1.5} />
			)}

			<group rotation={[e.inclinacion, 0, 0]}>
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
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, -0.5]}>
					<planeGeometry args={[5, 13]} />
					<meshStandardMaterial map={T.rejilla} metalness={0.5} roughness={0.55} />
				</mesh>
				<Agua t={t} y={e.agua} />
				{/* mamparo, escotilla y pasillo */}
				<mesh position={[0, 0.1, -6]}>
					<ringGeometry args={[0.82, HULL_R + 0.2, 64]} />
					<meshStandardMaterial map={T.acero} metalness={0.45} roughness={0.6} />
				</mesh>
				<mesh position={[0, 0.1, -5.97]}>
					<ringGeometry args={[0.82, 1.02, 64]} />
					<meshStandardMaterial color="#6f7a7c" metalness={0.7} roughness={0.35} />
				</mesh>
				<mesh position={[0, 0.1, -8.2]} rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.84, 0.84, 4.4, 40, 1, true]} />
					<meshStandardMaterial map={T.acero} side={THREE.BackSide} metalness={0.4} roughness={0.6} />
				</mesh>
				<mesh position={[0, 0.1, -10.35]}>
					<circleGeometry args={[0.84, 40]} />
					<meshStandardMaterial map={T.acero} metalness={0.5} roughness={0.5} />
				</mesh>
				<group position={[0, 0.1, -10.3]} rotation={[0, -Math.PI / 2, 0]}>
					<Volante rot={0} pos={[0, 0, 0]} brillo={0} />
				</group>
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, -8.2]}>
					<planeGeometry args={[1.7, 4.4]} />
					<meshStandardMaterial color="#0f3d42" metalness={0.2} roughness={0.08} transparent opacity={0.85} />
				</mesh>
				{e.escotilla > 0.01 && <pointLight position={[0, 0.5, -8.6]} color="#8fe8ff" intensity={5 * e.escotilla} distance={6} decay={1.4} />}
				<group position={[hingeX, 0.1, -5.94]} rotation={[0, e.escotilla * 1.7, 0]}>
					<mesh position={[-hingeX, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
						<cylinderGeometry args={[0.84, 0.84, 0.12, 56]} />
						<meshStandardMaterial map={T.acero} metalness={0.55} roughness={0.45} />
					</mesh>
					<group position={[-hingeX, 0, 0.1]}>
						<group rotation={[0, -Math.PI / 2, 0]}>
							<Volante rot={e.indicador * 0.9} pos={[0, 0, 0]} brillo={e.pista.indicador ?? 0} />
						</group>
					</group>
				</group>
				{/* tanques, manómetros y válvulas */}
				{TANK_Z.map((z, i) => (
					<group key={z}>
						<Tanque z={z} letra={[T.A, T.B, T.C][i]} pintura={T.pintura} />
						<Manometro z={z} valor={e.agujas[i]} luz={e.pista[['A', 'B', 'C'][i]] ?? 0} esfera={T.esfera} />
						<Volante rot={e.valvulas[i]} pos={[TANK_X + 0.72, -0.95, z]} brillo={e.pista[['A', 'B', 'C'][i]] ?? 0} />
					</group>
				))}
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
					<meshStandardMaterial map={T.placa} metalness={0.6} roughness={0.4} emissive="#3fe0e6" emissiveIntensity={(e.pista.placa ?? 0) * 0.2} />
				</mesh>
				{CABLES.map((p, i) => (
					<Cable key={i} pts={p} />
				))}
				<CajaHerramientas e={e} T={C} />
				<CuadroYCajones e={e} T={C} />
				{/* báscula retirada en v1 (20/11): su puzle repetía familia */}
				<Reloj e={e} T={C} />
				<ArmarioYDial e={e} T={C} />
				<Altavoces v={e.altavoz} t={t} />
				<Burbujas t={t} agua={e.agua} soplado={e.soplado} />
				<Polvo t={t} />
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
			</group>
			<Guante g={e.guante} />
		</ThreeCanvas>
	);
};
