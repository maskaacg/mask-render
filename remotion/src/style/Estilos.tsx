import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BEBAS, HAND, MONO, OSWALD, SERIF, cargarFuentes} from './fonts';

cargarFuentes();

// Fotogramas de propuesta de estilo: mismo acertijo (taller de engranajes) en tres direcciones.
const Q1 = 'Si el pequeño da 12 vueltas…';
const Q2 = '¿cuántas da el grande?';
const TITULO = 'El taller de los engranajes';

// ---------- utilidades ----------
const circ = (r: number, cx = 0, cy = 0) => `M${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy} Z`;
export const gearPath = (teeth: number, r: number, depth = 16, hole = 0.18) => {
	const inner = r - depth;
	const pts: string[] = [];
	const p = (rad: number, a: number) => `${(Math.cos(a) * rad).toFixed(1)},${(Math.sin(a) * rad).toFixed(1)}`;
	for (let i = 0; i < teeth; i++) {
		const a0 = (i / teeth) * 2 * Math.PI;
		const s = (2 * Math.PI) / teeth;
		pts.push(`${i === 0 ? 'M' : 'L'}${p(inner, a0)} L${p(r, a0 + s * 0.12)} L${p(r, a0 + s * 0.42)} L${p(inner, a0 + s * 0.54)}`);
	}
	return pts.join(' ') + ' Z' + (hole > 0 ? ' ' + circ(Math.max(10, r * hole)) : '');
};
// Contorno "a mano": rectángulo con pequeñas ondulaciones deterministas.
const wobblyRect = (x: number, y: number, w: number, h: number, amp = 3, seed = 1) => {
	const n = (i: number) => Math.sin(i * 12.9898 + seed * 78.233) * amp;
	const seg = (x1: number, y1: number, x2: number, y2: number, k: number) => {
		const out: string[] = [];
		for (let i = 1; i <= 6; i++) {
			const f = i / 6;
			out.push(`L${(x1 + (x2 - x1) * f + n(k + i)).toFixed(1)},${(y1 + (y2 - y1) * f + n(k + i + 50)).toFixed(1)}`);
		}
		return out.join(' ');
	};
	return `M${x},${y} ${seg(x, y, x + w, y, 1)} ${seg(x + w, y, x + w, y + h, 10)} ${seg(x + w, y + h, x, y + h, 20)} ${seg(x, y + h, x, y, 30)} Z`;
};
const Grain: React.FC<{id: string; o: number; seed?: number; freq?: number; blend?: string}> = ({id, o, seed = 3, freq = 0.9, blend = 'overlay'}) => (
	<>
		<filter id={id} x="0" y="0" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={seed} />
			<feColorMatrix type="saturate" values="0" />
		</filter>
		<rect width={1080} height={1920} filter={`url(#${id})`} opacity={o} style={{mixBlendMode: blend as any}} />
	</>
);

// Engranajes: radios proporcionales a los dientes (r = 6.4·z).
const K = 6.4;
const Z = [10, 20, 40];
const R = Z.map((z) => z * K);
const layoutGears = (cy: number, startX: number) => {
	const cx0 = startX + R[0];
	const cx1 = cx0 + R[0] + R[1] - 12;
	const cx2 = cx1 + R[1] + R[2] - 12;
	return [cx0, cx1, cx2].map((cx, i) => ({cx, cy: i === 2 ? cy : cy + 40, r: R[i], z: Z[i]}));
};

// =====================================================================
// A · PLANO DE INVENTOR (cianotipia)
// =====================================================================
export const EstiloPlano: React.FC = () => {
	const W = '#eaf3ff';
	const RED = '#ff7a5c';
	const g = layoutGears(1130, 70);
	const faint = {stroke: W, strokeWidth: 2, fill: 'none', opacity: 0.32};
	return (
		<AbsoluteFill>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920">
				<defs>
					<radialGradient id="bp" cx="50%" cy="45%" r="75%">
						<stop offset="0" stopColor="#1d4f86" />
						<stop offset="1" stopColor="#0b2340" />
					</radialGradient>
					<pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
						<path d="M40 0H0V40" fill="none" stroke={W} strokeOpacity={0.07} strokeWidth={1} />
					</pattern>
					<pattern id="grid5" width={200} height={200} patternUnits="userSpaceOnUse">
						<path d="M200 0H0V200" fill="none" stroke={W} strokeOpacity={0.13} strokeWidth={1.5} />
					</pattern>
					<marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
						<path d="M0 0L10 5L0 10z" fill={RED} />
					</marker>
					<marker id="arrw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
						<path d="M0 0L10 5L0 10z" fill={W} />
					</marker>
				</defs>
				<rect width={1080} height={1920} fill="url(#bp)" />
				<rect width={1080} height={1920} fill="url(#grid)" />
				<rect width={1080} height={1920} fill="url(#grid5)" />

				{/* cabecera */}
				<text x={60} y={104} fontFamily={MONO} fontWeight={600} fontSize={30} letterSpacing={8} fill={W}>ENIGMA 60</text>
				<text x={1020} y={104} textAnchor="end" fontFamily={MONO} fontSize={26} letterSpacing={4} fill={W} opacity={0.75}>PLANO Nº 001</text>
				<line x1={60} y1={130} x2={1020} y2={130} stroke={W} strokeWidth={2} opacity={0.6} />
				<text x={60} y={214} fontFamily={HAND} fontSize={62} fill={W}>{TITULO}</text>

				{/* pregunta en lápiz rojo */}
				<path d={wobblyRect(52, 262, 976, 196, 3, 4)} fill="rgba(255,122,92,0.08)" stroke={RED} strokeWidth={3.5} />
				<text x={90} y={346} fontFamily={HAND} fontSize={52} fill={W}>{Q1}</text>
				<text x={90} y={420} fontFamily={HAND} fontSize={52} fill={RED}>{Q2}</text>

				{/* alzado del taller (trazo tenue) */}
				<g {...faint}>
					<path d="M40 520 H1040 M40 1480 H1040" strokeDasharray="14 10" />
					{[200, 540, 880].map((x, i) => (
						<g key={i}>
							<circle cx={x} cy={640} r={70} />
							<circle cx={x} cy={640} r={5} fill={W} />
							<line x1={x} y1={640} x2={x + 38 * Math.cos(i * 1.7)} y2={640 + 38 * Math.sin(i * 1.7)} strokeWidth={4} />
							<line x1={x} y1={640} x2={x + 52 * Math.cos(i * 2.6 + 1)} y2={640 + 52 * Math.sin(i * 2.6 + 1)} />
							{Array.from({length: 12}).map((_, k) => (
								<line key={k} x1={x + 60 * Math.cos((k * Math.PI) / 6)} y1={640 + 60 * Math.sin((k * Math.PI) / 6)} x2={x + 68 * Math.cos((k * Math.PI) / 6)} y2={640 + 68 * Math.sin((k * Math.PI) / 6)} />
							))}
						</g>
					))}
					{/* banco de trabajo */}
					<path d="M30 1440 H1050 M30 1462 H1050 M90 1462 V1600 M990 1462 V1600 M60 1600 H1020" />
					<path d="M880 1440 v-50 h90 v50 M900 1390 v-24 h50 v24" />
				</g>

				{/* engranajes como dibujo técnico */}
				{g.map((G, i) => (
					<g key={i}>
						<g transform={`translate(${G.cx} ${G.cy}) rotate(${i * 7})`}>
							<path d={gearPath(G.z, G.r, 15)} fill="rgba(234,243,255,0.06)" stroke={W} strokeWidth={3} fillRule="evenodd" />
							<circle r={G.r - 8} fill="none" stroke={W} strokeWidth={1.5} strokeDasharray="10 8" opacity={0.6} />
						</g>
						<path d={`M${G.cx - 24} ${G.cy} H${G.cx + 24} M${G.cx} ${G.cy - 24} V${G.cy + 24}`} stroke={W} strokeWidth={2} />
					</g>
				))}
				{/* cotas */}
				<g fontFamily={HAND} fill={W}>
					<path d={`M${g[0].cx} ${g[0].cy + g[0].r + 10} L${g[0].cx + 30} ${g[0].cy + 150}`} stroke={W} strokeWidth={2} markerStart="url(#arrw)" fill="none" />
					<text x={g[0].cx - 10} y={g[0].cy + 196} fontSize={46}>Z = 10</text>
					<path d={`M${g[1].cx} ${g[1].cy - g[1].r - 10} L${g[1].cx - 30} ${g[1].cy - g[1].r - 100}`} stroke={W} strokeWidth={2} markerStart="url(#arrw)" fill="none" />
					<text x={g[1].cx - 110} y={g[1].cy - g[1].r - 112} fontSize={46}>Z = 20</text>
					<path d={`M${g[2].cx + g[2].r * 0.6} ${g[2].cy - g[2].r * 0.85} L${g[2].cx + 120} ${g[2].cy - g[2].r - 80}`} stroke={W} strokeWidth={2} markerStart="url(#arrw)" fill="none" />
					<text x={g[2].cx + 40} y={g[2].cy - g[2].r - 92} fontSize={46}>Z = 40</text>
				</g>
				{/* flecha de giro en rojo y la incógnita */}
				<path d={`M${g[0].cx - g[0].r - 26} ${g[0].cy + 20} A ${g[0].r + 26} ${g[0].r + 26} 0 1 1 ${g[0].cx + 10} ${g[0].cy + g[0].r + 26}`} fill="none" stroke={RED} strokeWidth={4} markerEnd="url(#arr)" />
				<text x={g[0].cx - 95} y={g[0].cy - g[0].r - 44} fontFamily={HAND} fontSize={40} fill={RED}>× 12</text>
				<circle cx={g[2].cx} cy={g[2].cy} r={78} fill="#0b2340" stroke={RED} strokeWidth={4} />
				<text x={g[2].cx} y={g[2].cy + 40} textAnchor="middle" fontFamily={HAND} fontSize={120} fill={RED}>?</text>

				{/* temporizador tipo compás */}
				<g transform="translate(160 1730)">
					<circle r={86} fill="none" stroke={W} strokeWidth={2} strokeDasharray="6 8" opacity={0.6} />
					<path d={`M0 -86 A86 86 0 1 1 ${86 * Math.sin((9 / 15) * 2 * Math.PI)} ${-86 * Math.cos((9 / 15) * 2 * Math.PI)}`} fill="none" stroke={RED} strokeWidth={6} />
					<text y={26} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={76} fill={W}>9</text>
					<text y={-104} textAnchor="middle" fontFamily={MONO} fontSize={20} letterSpacing={3} fill={W} opacity={0.75}>SEGUNDOS</text>
				</g>
				{/* cajetín */}
				<g transform="translate(330 1650)" fontFamily={MONO} fill={W}>
					<rect width={690} height={170} fill="none" stroke={W} strokeWidth={2.5} />
					<path d="M0 56 H690 M0 112 H690 M380 56 V170" stroke={W} strokeWidth={1.5} />
					<text x={20} y={38} fontSize={24} letterSpacing={3}>ENIGMA 60 · UN ACERTIJO AL DÍA</text>
					<text x={20} y={94} fontSize={22} opacity={0.8}>ESCALA 1:7</text>
					<text x={400} y={94} fontSize={22} opacity={0.8}>HOJA 1 / 1</text>
					<text x={20} y={150} fontSize={22} opacity={0.8}>SOLUCIÓN:</text>
					<path d="M170 152 H360" stroke={W} strokeDasharray="6 6" />
					<text x={400} y={150} fontSize={20} opacity={0.6}>Contenido creado con IA</text>
				</g>
				<Grain id="gA" o={0.18} freq={0.8} />
			</svg>
		</AbsoluteFill>
	);
};

// =====================================================================
// B · DIORAMA DE PAPEL RECORTADO
// =====================================================================
export const EstiloPapel: React.FC = () => {
	const g = layoutGears(1150, 75);
	const P = {wall: '#e2c497', wall2: '#d3ad78', night: '#2d2a44', rust: '#b5652c', ochre: '#d99a45', dark: '#3a2418', cream: '#f6ead2', wood: '#6b3b22'};
	const sh = 'url(#sh)';
	return (
		<AbsoluteFill>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920">
				<defs>
					<filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
						<feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#1d0f06" floodOpacity="0.45" />
					</filter>
					<filter id="shs" x="-20%" y="-20%" width="140%" height="140%">
						<feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#1d0f06" floodOpacity="0.5" />
					</filter>
					<radialGradient id="lamp" cx="50%" cy="38%" r="60%">
						<stop offset="0" stopColor="#fff3d6" stopOpacity="0.55" />
						<stop offset="1" stopColor="#3a1d0b" stopOpacity="0.55" />
					</radialGradient>
					<pattern id="dots" width={14} height={14} patternUnits="userSpaceOnUse">
						<circle cx={7} cy={7} r={1.6} fill="#000" opacity={0.12} />
					</pattern>
				</defs>
				{/* capa 0: pared */}
				<rect width={1080} height={1920} fill={P.wall} />
				{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
					<rect key={i} x={i * 140 - 20} y={480} width={70} height={1000} fill={P.wall2} opacity={0.55} />
				))}
				{/* capa 1: ventana con luna */}
				<g filter={sh}>
					<path d="M380 870 v-150 a160 160 0 0 1 320 0 v150z" fill={P.night} />
					<circle cx={620} cy={640} r={42} fill={P.cream} />
					<path d="M372 870 h336 v26 h-336z" fill={P.wood} />
				</g>
				{/* capa 2: relojes colgados */}
				{[170, 910].map((x, i) => (
					<g key={i} filter={sh}>
						<line x1={x} y1={470} x2={x} y2={560} stroke={P.dark} strokeWidth={3} />
						<circle cx={x} cy={640} r={88} fill={i ? P.rust : P.ochre} />
						<circle cx={x} cy={640} r={66} fill={P.cream} />
						<path d={`M${x} 640 l0 -46 M${x} 640 l34 18`} stroke={P.dark} strokeWidth={8} strokeLinecap="round" transform={`rotate(${i * 130} ${x} 640)`} />
					</g>
				))}
				{/* capa 3: estante con herramientas */}
				<g filter={sh}>
					<rect x={60} y={940} width={960} height={26} fill={P.wood} />
					<path d="M110 940 v-90 h40 v90z M180 940 v-60 a26 26 0 0 1 52 0 v60z M870 940 l30 -120 l20 0 l-10 120z M930 940 v-70 h60 v70z" fill={P.dark} />
				</g>
				{/* luz de lámpara */}
				<rect width={1080} height={1920} fill="url(#lamp)" style={{mixBlendMode: 'multiply'}} />
				{/* capa 4: engranajes de cartón con encuadernadores */}
				{g.map((G, i) => (
					<g key={i} filter={sh} transform={`translate(${G.cx} ${G.cy}) rotate(${i * 9})`}>
						<path d={gearPath(G.z, G.r, 18, 0.12)} fill={[P.ochre, P.rust, '#c47a36'][i]} fillRule="evenodd" />
						<path d={gearPath(G.z, G.r, 18, 0.12)} fill="url(#dots)" fillRule="evenodd" />
						<circle r={G.r * 0.55} fill="none" stroke="#000" strokeOpacity={0.15} strokeWidth={4} />
						<circle r={16} fill="#e8c46a" filter="url(#shs)" />
					</g>
				))}
				{/* etiquetas de papel con cuerda */}
				{g.map((G, i) => {
					const x = G.cx + (i === 2 ? 170 : 0);
					const y = i === 2 ? G.cy + G.r + 22 : G.cy - G.r - 90;
					return (
						<g key={i} filter={sh} transform={`rotate(${[-6, 4, -3][i]} ${x} ${y})`}>
							<path d={`M${x - 80} ${y - 34} h150 l20 34 l-20 34 h-150z`} fill={P.cream} />
							<circle cx={x + 66} cy={y} r={6} fill={P.wall} />
							<text x={x - 8} y={y + 14} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={40} fill={P.dark}>{G.z}</text>
						</g>
					);
				})}
				{/* capa 5: mesa delantera */}
				<g filter={sh}>
					<path d="M0 1480 H1080 V1920 H0z" fill={P.wood} />
					<path d="M0 1480 H1080 V1500 H0z" fill="#8a4f2c" />
				</g>
				{/* tarjeta de la pregunta */}
				<g filter={sh} transform="rotate(-1.5 540 360)">
					<rect x={70} y={250} width={940} height={220} fill={P.cream} />
					<rect x={70} y={250} width={940} height={220} fill="url(#dots)" opacity={0.4} />
					<text x={540} y={340} textAnchor="middle" fontFamily={SERIF} fontWeight={600} fontSize={50} fill={P.dark}>{Q1}</text>
					<text x={540} y={420} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={56} fill={P.rust}>{Q2}</text>
				</g>
				{/* banderín del título */}
				<g filter={sh}>
					<path d="M40 70 H1040 L1010 128 L1040 186 H40 L70 128z" fill={P.rust} />
					<text x={540} y={122} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontWeight={500} fontSize={28} fill={P.cream} letterSpacing={4}>ENIGMA 60 · Nº 1</text>
					<text x={540} y={168} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={40} fill={P.cream}>{TITULO}</text>
				</g>
				{/* temporizador: esfera de papel por segmentos */}
				<g transform="translate(540 1700)" filter={sh}>
					<circle r={120} fill={P.cream} />
					{Array.from({length: 15}).map((_, k) => {
						const a0 = (k / 15) * 2 * Math.PI - Math.PI / 2;
						const a1 = ((k + 0.86) / 15) * 2 * Math.PI - Math.PI / 2;
						const r0 = 70, r1 = 108;
						const d = `M${r0 * Math.cos(a0)} ${r0 * Math.sin(a0)} L${r1 * Math.cos(a0)} ${r1 * Math.sin(a0)} A${r1} ${r1} 0 0 1 ${r1 * Math.cos(a1)} ${r1 * Math.sin(a1)} L${r0 * Math.cos(a1)} ${r0 * Math.sin(a1)} A${r0} ${r0} 0 0 0 ${r0 * Math.cos(a0)} ${r0 * Math.sin(a0)}z`;
						return <path key={k} d={d} fill={k < 9 ? P.rust : '#e7d5b3'} />;
					})}
					<text y={22} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={64} fill={P.dark}>9</text>
				</g>
				<text x={1040} y={1890} textAnchor="end" fontFamily={SERIF} fontStyle="italic" fontWeight={500} fontSize={22} fill={P.cream} opacity={0.75}>Contenido creado con IA</text>
				<Grain id="gB" o={0.22} freq={0.65} blend="multiply" />
			</svg>
		</AbsoluteFill>
	);
};

// =====================================================================
// C · LINTERNA (claroscuro, un color por episodio)
// =====================================================================
export const EstiloLinterna: React.FC = () => {
	const frame = useCurrentFrame();
	const A = '#ffb347';
	const g = layoutGears(1180, 70);
	const motes = Array.from({length: 70}).map((_, i) => {
		const r = (k: number) => (Math.sin(i * 91.7 + k * 13.1) * 0.5 + 0.5);
		return {x: 260 + r(1) * 700, y: 900 + r(2) * 900, s: 1 + r(3) * 3, o: 0.2 + r(4) * 0.6};
	});
	const scene = (
		<g>
			{/* pared con herramientas y relojes en silueta */}
			<rect x={0} y={520} width={1080} height={1000} fill="#140d06" />
			{[180, 900].map((x, i) => (
				<g key={i}>
					<circle cx={x} cy={680} r={80} fill="none" stroke={A} strokeWidth={5} />
					<path d={`M${x} 680 l0 -50 M${x} 680 l36 20`} stroke={A} strokeWidth={6} strokeLinecap="round" transform={`rotate(${i * 120 + 40} ${x} 680)`} />
				</g>
			))}
			<path d="M60 1510 H1020 V1540 H60z" fill="#2a1a0b" stroke={A} strokeWidth={2} />
			{g.map((G, i) => (
				<g key={i} transform={`translate(${G.cx} ${G.cy}) rotate(${i * 8})`}>
					<path d={gearPath(G.z, G.r, 18, 0)} fill="url(#metal)" stroke="#1a0f04" strokeWidth={3} fillRule="evenodd" />
					<circle r={G.r * 0.62} fill="none" stroke="#1a0f04" strokeWidth={5} opacity={0.6} />
				</g>
			))}
			{g.map((G, i) => (
				<text key={i} x={G.cx} y={G.cy + [17, 30, 50][i]} textAnchor="middle" fontFamily={BEBAS} fontSize={[48, 84, 140][i]} fill="#1a0f04" opacity={0.85}>{G.z}</text>
			))}
		</g>
	);
	return (
		<AbsoluteFill style={{background: '#050403'}}>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920">
				<defs>
					<radialGradient id="beam" cx="560" cy="1120" r="560" gradientUnits="userSpaceOnUse">
						<stop offset="0" stopColor="#fff" />
						<stop offset="0.55" stopColor="#fff" stopOpacity={0.85} />
						<stop offset="1" stopColor="#fff" stopOpacity={0} />
					</radialGradient>
					<mask id="m">
						<rect width={1080} height={1920} fill="#111" />
						<rect width={1080} height={1920} fill="url(#beam)" />
					</mask>
					<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#ffd28a" />
						<stop offset="0.45" stopColor={A} />
						<stop offset="1" stopColor="#7a4210" />
					</linearGradient>
					<linearGradient id="cone" x1="1" y1="1" x2="0.4" y2="0.4">
						<stop offset="0" stopColor={A} stopOpacity={0.22} />
						<stop offset="1" stopColor={A} stopOpacity={0} />
					</linearGradient>
					<radialGradient id="vig" cx="50%" cy="55%" r="70%">
						<stop offset="0.6" stopColor="#000" stopOpacity={0} />
						<stop offset="1" stopColor="#000" stopOpacity={0.85} />
					</radialGradient>
				</defs>
				<g mask="url(#m)">{scene}</g>
				<path d="M1080 1920 L1080 1700 L220 900 L620 640 L1080 1500z" fill="url(#cone)" style={{mixBlendMode: 'screen'}} />
				{motes.map((m, i) => (
					<circle key={i} cx={m.x} cy={m.y + Math.sin(frame / 20 + i) * 4} r={m.s} fill="#ffe2b0" opacity={m.o * 0.6} />
				))}
				<rect width={1080} height={1920} fill="url(#vig)" />

				{/* tipografía */}
				<text x={60} y={110} fontFamily={OSWALD} fontWeight={500} fontSize={28} letterSpacing={10} fill={A}>ENIGMA 60 · CASO 01</text>
				<text x={56} y={250} fontFamily={BEBAS} fontSize={150} fill="#f4ede2" letterSpacing={2}>EL TALLER</text>
				<text x={62} y={310} fontFamily={OSWALD} fontWeight={300} fontSize={46} letterSpacing={12} fill="#f4ede2" opacity={0.85}>DE LOS ENGRANAJES</text>
				<rect x={60} y={360} width={8} height={130} fill={A} />
				<text x={96} y={412} fontFamily={OSWALD} fontWeight={300} fontSize={48} fill="#f4ede2">El pequeño da 12 vueltas.</text>
				<text x={96} y={478} fontFamily={OSWALD} fontWeight={500} fontSize={54} fill={A}>¿CUÁNTAS DA EL GRANDE?</text>

				<text x={1020} y={1850} textAnchor="end" fontFamily={BEBAS} fontSize={260} fill="none" stroke={A} strokeWidth={3}>09</text>
				<text x={64} y={1850} fontFamily={OSWALD} fontWeight={300} fontSize={22} letterSpacing={4} fill="#f4ede2" opacity={0.55}>CONTENIDO CREADO CON IA</text>
				<Grain id="gC" o={0.16} freq={1.1} blend="screen" />
			</svg>
		</AbsoluteFill>
	);
};

export const E60Estilo: React.FC<{estilo: 'plano' | 'papel' | 'linterna'}> = ({estilo}) =>
	estilo === 'plano' ? <EstiloPlano /> : estilo === 'papel' ? <EstiloPapel /> : <EstiloLinterna />;
