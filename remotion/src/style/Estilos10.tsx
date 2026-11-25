import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BEBAS, HAND, MONO, OSWALD, SERIF, cargarFuentes} from './fonts';
import {gearPath} from './Estilos';
import {LowPolyScene} from './LowPoly3D';

cargarFuentes();

// Diez propuestas de estilo para ENIGMA 60. Todas cuentan el mismo puzle como historia:
// «Leo tiene hasta medianoche para arrancar el reloj de la torre…»
const H = {
	caso: 'CASO 01 · EL RELOJ DE LA TORRE',
	historia: 'Leo tiene hasta medianoche para arrancar el reloj de la torre.',
	q1: 'El pequeño da 12 vueltas.',
	q2: '¿Cuántas da el grande?',
	codigo: 'Esa cifra abre el campanario.',
};
const circ = (r: number, cx = 0, cy = 0) => `M${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy} Z`;
const Z = [10, 20, 40];
const gears = (k: number, x0: number, cy: number) => {
	const R = Z.map((z) => z * k);
	const c0 = x0 + R[0], c1 = c0 + R[0] + R[1] - k * 2, c2 = c1 + R[1] + R[2] - k * 2;
	return [c0, c1, c2].map((cx, i) => ({cx, cy: i === 2 ? cy : cy + R[2] - R[2] * 0.9, r: R[i], z: Z[i]}));
};
const Gears: React.FC<{k: number; x0: number; cy: number; fills: string[]; stroke?: string; sw?: number; depth?: number; hole?: number; children?: (g: ReturnType<typeof gears>[number], i: number) => React.ReactNode}> = ({k, x0, cy, fills, stroke = 'none', sw = 0, depth = 14, hole = 0.15, children}) => (
	<>
		{gears(k, x0, cy).map((g, i) => (
			<g key={i}>
				<g transform={`translate(${g.cx} ${g.cy}) rotate(${i * 9})`}>
					<path d={gearPath(g.z, g.r, depth, hole)} fill={fills[i]} stroke={stroke} strokeWidth={sw} fillRule="evenodd" />
				</g>
				{children?.(g, i)}
			</g>
		))}
	</>
);

// ---------------------------------------------------------------- 1 · Isla low-poly 3D
const IslaLowPoly: React.FC = () => (
	<AbsoluteFill>
		<LowPolyScene />
		<div style={{position: 'absolute', top: 60, left: 50, right: 50, background: '#fffaf0', borderRadius: 20, padding: '16px 24px', boxShadow: '0 8px 0 #c98b3a', display: 'flex', gap: 18, alignItems: 'center'}}>
			<div style={{width: 64, height: 64, borderRadius: 14, background: '#e05a47', color: '#fff', fontFamily: BEBAS, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>60</div>
			<div>
				<div style={{fontFamily: OSWALD, fontWeight: 500, fontSize: 22, color: '#a66b2c', letterSpacing: 3}}>ENIGMA 60 · CASO 01 · ●○○</div>
				<div style={{fontFamily: BEBAS, fontSize: 52, color: '#3a2a1f', lineHeight: 1}}>EL RELOJ DE LA TORRE</div>
			</div>
		</div>
		<div style={{position: 'absolute', top: 230, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
			<div style={{background: '#1f2a3a', color: '#fff', borderRadius: 40, padding: '10px 30px', fontFamily: BEBAS, fontSize: 60, letterSpacing: 2}}>⏱ 0:42</div>
		</div>
		<div style={{position: 'absolute', top: 1320, left: 60, right: 60, background: 'rgba(31,42,58,0.92)', border: '4px solid #f2c84b', borderRadius: 18, padding: 26, color: '#fff', fontFamily: OSWALD, fontWeight: 500, fontSize: 44, textAlign: 'center', lineHeight: 1.2}}>
			{H.q1} <span style={{color: '#f2c84b'}}>{H.q2}</span>
		</div>
		<div style={{position: 'absolute', top: 1600, left: 0, right: 0, textAlign: 'center', fontFamily: BEBAS, fontSize: 120, color: '#f2c84b', WebkitTextStroke: '6px #1f2a3a', paintOrder: 'stroke'}}>MEDIANOCHE</div>
		<div style={{position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center', fontFamily: OSWALD, fontSize: 24, color: '#1f2a3a', opacity: 0.7}}>CONTENIDO CREADO CON IA</div>
	</AbsoluteFill>
);

// ---------------------------------------------------------------- 2 · Sala isométrica (videojuego móvil)
const iso = (x: number, y: number, z: number) => [540 + (x - y) * 0.866 * 1, 980 + (x + y) * 0.5 - z];
const IsoBox: React.FC<{x: number; y: number; z: number; w: number; d: number; h: number; c: [string, string, string]}> = ({x, y, z, w, d, h, c}) => {
	const P = (a: number, b: number, e: number) => iso(a, b, e).join(',');
	return (
		<g>
			<polygon points={[P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)].join(' ')} fill={c[0]} />
			<polygon points={[P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)].join(' ')} fill={c[1]} />
			<polygon points={[P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)].join(' ')} fill={c[2]} />
		</g>
	);
};
const SalaIsometrica: React.FC = () => (
	<AbsoluteFill style={{background: 'linear-gradient(#2b2350, #4a2f6b)'}}>
		<svg width={1080} height={1920}>
			<IsoBox x={-400} y={-400} z={-40} w={800} d={800} h={40} c={['#f3d9b1', '#c9a77c', '#b08d64']} />
			{Array.from({length: 8}).map((_, i) => Array.from({length: 8}).map((__, j) => (i + j) % 2 ? null : <IsoBox key={i + '-' + j} x={-400 + i * 100} y={-400 + j * 100} z={0} w={100} d={100} h={0.1} c={['#e8c99c', '#e8c99c', '#e8c99c']} />))}
			<IsoBox x={-400} y={-420} z={0} w={800} d={20} h={420} c={['#7a5ca8', '#9b7cc9', '#6a4c98']} />
			<IsoBox x={-420} y={-420} z={0} w={20} d={820} h={420} c={['#7a5ca8', '#6a4c98', '#8a6cb8']} />
			{/* puerta del campanario con candado */}
			<polygon points={[iso(100, -400, 0), iso(260, -400, 0), iso(260, -400, 260), iso(100, -400, 260)].map((p) => p.join(',')).join(' ')} fill="#5a3a22" />
			<circle cx={iso(180, -400, 130)[0]} cy={iso(180, -400, 130)[1]} r={26} fill="#f2c84b" stroke="#3a2a1f" strokeWidth={5} />
			{/* reloj en la pared */}
			<circle cx={iso(-400, -100, 300)[0]} cy={iso(-400, -100, 300)[1]} r={70} fill="#fff8e6" stroke="#3a2a1f" strokeWidth={8} />
			<path d={`M${iso(-400, -100, 300)[0]} ${iso(-400, -100, 300)[1]} v-46 M${iso(-400, -100, 300)[0]} ${iso(-400, -100, 300)[1]} l30 6`} stroke="#3a2a1f" strokeWidth={8} strokeLinecap="round" />
			{/* mesa */}
			<IsoBox x={-160} y={60} z={0} w={360} d={160} h={110} c={['#c47a3a', '#9c5b2c', '#7a4520']} />
			<g transform={`translate(${iso(-120, 140, 110)[0] - 30} ${iso(-120, 140, 110)[1] - 180}) scale(0.9)`}>
				<Gears k={5.2} x0={0} cy={120} fills={['#f2c84b', '#f08c3a', '#4fa3e0']} stroke="#2b2350" sw={5} />
			</g>
			{/* personaje */}
			<g transform={`translate(${iso(260, 220, 0)[0]} ${iso(260, 220, 0)[1]})`}>
				<ellipse cy={0} rx={50} ry={18} fill="#000" opacity={0.2} />
				<rect x={-30} y={-120} width={60} height={90} rx={14} fill="#e05a47" />
				<rect x={-26} y={-34} width={20} height={34} fill="#2f4f8f" />
				<rect x={6} y={-34} width={20} height={34} fill="#2f4f8f" />
				<circle cy={-150} r={36} fill="#f1c7a0" />
				<path d="M-38 -160 q38 -50 76 0z" fill="#3a2a1f" />
				<circle cx={-12} cy={-150} r={5} fill="#222" /><circle cx={12} cy={-150} r={5} fill="#222" />
			</g>
		</svg>
		<div style={{position: 'absolute', top: 70, left: 60, right: 60, color: '#fff'}}>
			<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 24, letterSpacing: 6, color: '#f2c84b'}}>ENIGMA 60 · NIVEL 01</div>
			<div style={{fontFamily: BEBAS, fontSize: 84, lineHeight: 1}}>EL RELOJ DE LA TORRE</div>
			<div style={{fontFamily: OSWALD, fontWeight: 300, fontSize: 36, marginTop: 10, opacity: 0.9}}>{H.historia}</div>
		</div>
		<div style={{position: 'absolute', top: 1400, left: 60, right: 60, background: '#fff', borderRadius: 24, padding: 28, boxShadow: '0 10px 0 #1a1433', fontFamily: OSWALD, fontWeight: 500, fontSize: 46, color: '#2b2350', textAlign: 'center'}}>
			{H.q1}<br /><b style={{color: '#e05a47'}}>{H.q2}</b>
		</div>
		<div style={{position: 'absolute', top: 1640, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16}}>
			{['?', '·', '·'].map((c, i) => <div key={i} style={{width: 110, height: 130, borderRadius: 16, background: '#1a1433', border: '4px solid #f2c84b', color: '#f2c84b', fontFamily: BEBAS, fontSize: 96, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{c}</div>)}
		</div>
		<div style={{position: 'absolute', top: 340, right: 60, background: '#e05a47', color: '#fff', borderRadius: 18, padding: '6px 20px', fontFamily: BEBAS, fontSize: 56}}>0:42</div>
	</AbsoluteFill>
);

// ---------------------------------------------------------------- 3 · Plastilina (stop-motion)
const Plastilina: React.FC = () => (
	<AbsoluteFill style={{background: '#f6b26b'}}>
		<svg width={1080} height={1920}>
			<defs>
				<filter id="clay" x="-10%" y="-10%" width="120%" height="120%">
					<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={4} result="n" />
					<feDisplacementMap in="SourceGraphic" in2="n" scale={10} result="d" />
					<feGaussianBlur in="d" stdDeviation={1.2} result="b" />
					<feSpecularLighting in="b" surfaceScale={6} specularConstant={0.7} specularExponent={18} lightingColor="#fff" result="s">
						<fePointLight x={300} y={200} z={500} />
					</feSpecularLighting>
					<feComposite in="s" in2="b" operator="in" result="s2" />
					<feComposite in="b" in2="s2" operator="arithmetic" k1={0} k2={1} k3={0.35} k4={0} />
				</filter>
				<filter id="sombra"><feDropShadow dx="0" dy="14" stdDeviation="10" floodOpacity="0.35" /></filter>
			</defs>
			<g filter="url(#sombra)">
				<g filter="url(#clay)">
					<rect x={-20} y={1300} width={1120} height={700} rx={60} fill="#7cc36a" />
					<rect x={620} y={460} width={300} height={860} rx={40} fill="#e9d3a8" />
					<path d="M590 480 L770 300 L950 480 Z" fill="#d9534f" />
					<circle cx={770} cy={640} r={100} fill="#fffaf0" />
					<rect x={720} y={1080} width={100} height={240} rx={40} fill="#7a4b2a" />
					<rect x={70} y={1180} width={560} height={130} rx={40} fill="#c47a3a" />
					<circle cx={170} cy={640} r={130} fill="#5fb04a" />
					<rect x={155} y={740} width={30} height={460} rx={14} fill="#7a4b2a" />
				</g>
				<path d="M770 640 v-60 M770 640 l40 20" stroke="#3a2a1f" strokeWidth={14} strokeLinecap="round" />
				<g filter="url(#clay)">
					<Gears k={5.6} x0={90} cy={1080} fills={['#ffd34d', '#ff8a3d', '#4aa3ff']} depth={18} hole={0.16} />
				</g>
				{/* Leo de plastilina */}
				<g filter="url(#clay)" transform="translate(470 1500)">
					<ellipse cx={0} cy={-90} rx={70} ry={100} fill="#e05a47" />
					<circle cx={0} cy={-230} r={70} fill="#f6caa0" />
					<path d="M-74 -250 q74 -90 148 0 z" fill="#4a2d1c" />
				</g>
				<circle cx={448} cy={1268} r={10} fill="#222" /><circle cx={492} cy={1268} r={10} fill="#222" />
				<path d="M450 1300 q20 16 40 0" stroke="#7a2d1c" strokeWidth={7} fill="none" strokeLinecap="round" />
			</g>
		</svg>
		<div style={{position: 'absolute', top: 70, left: 60, right: 60, background: '#fffaf0', borderRadius: 40, padding: '22px 30px', boxShadow: '0 12px 0 #c9853a', fontFamily: SERIF, fontWeight: 800, fontSize: 52, color: '#4a2d1c', textAlign: 'center'}}>
			El reloj de la torre
			<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 30, color: '#c9853a'}}>ENIGMA 60 · caso 1</div>
		</div>
		<div style={{position: 'absolute', top: 1660, left: 60, width: 640, background: '#fffaf0', borderRadius: 30, padding: '18px 24px', boxShadow: '0 10px 0 #c9853a', fontFamily: SERIF, fontWeight: 600, fontSize: 40, color: '#4a2d1c', textAlign: 'center', lineHeight: 1.2}}>{H.q1} <span style={{color: '#b8322a'}}>{H.q2}</span></div>
		<div style={{position: 'absolute', top: 1620, right: 60, display: 'flex', justifyContent: 'center'}}>
			<div style={{width: 230, height: 230, borderRadius: '50%', background: '#fffaf0', border: '14px solid #e05a47', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 800, fontSize: 110, color: '#4a2d1c', boxShadow: '0 14px 0 #c9853a'}}>9</div>
		</div>
	</AbsoluteFill>
);

// ---------------------------------------------------------------- 4 · Cómic / novela gráfica
const Comic: React.FC = () => (
	<AbsoluteFill style={{background: '#f4ecd8'}}>
		<svg width={1080} height={1920}>
			<defs>
				<pattern id="dots" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx={6} cy={6} r={3} fill="#1a1a1a" /></pattern>
				<pattern id="dotsR" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx={6} cy={6} r={3.4} fill="#d23a2f" /></pattern>
			</defs>
			{/* viñeta 1: torre de noche */}
			<rect x={40} y={260} width={600} height={560} fill="#24305e" stroke="#111" strokeWidth={10} />
			<rect x={40} y={260} width={600} height={560} fill="url(#dots)" opacity={0.25} />
			<circle cx={520} cy={360} r={60} fill="#f6e7a8" />
			<path d="M230 820 V420 h160 V820 M210 430 l100 -110 l100 110 z" fill="#111" />
			<circle cx={310} cy={500} r={50} fill="#f6e7a8" stroke="#111" strokeWidth={8} />
			<path d="M310 500 v-38 M310 500 l26 12" stroke="#111" strokeWidth={8} />
			{/* viñeta 2: cara de Leo */}
			<rect x={670} y={260} width={370} height={560} fill="#f2c84b" stroke="#111" strokeWidth={10} />
			<rect x={670} y={260} width={370} height={560} fill="url(#dotsR)" opacity={0.25} />
			<circle cx={855} cy={590} r={130} fill="#f6caa0" stroke="#111" strokeWidth={8} />
			<path d="M720 560 q135 -190 270 0 q-60 -60 -135 -60 q-75 0 -135 60z" fill="#111" />
			<path d="M800 600 l30 -10 M880 590 l30 10" stroke="#111" strokeWidth={10} strokeLinecap="round" />
			<circle cx={815} cy={625} r={9} fill="#111" /><circle cx={895} cy={625} r={9} fill="#111" />
			<path d="M820 690 q35 -18 70 0" stroke="#111" strokeWidth={8} fill="none" />
			<path d="M840 470 l-10 -50 M870 465 l5 -55 M900 475 l20 -45" stroke="#111" strokeWidth={6} />
			{/* viñeta 3: engranajes */}
			<rect x={40} y={850} width={1000} height={760} fill="#fff" stroke="#111" strokeWidth={10} />
			<rect x={40} y={850} width={1000} height={760} fill="url(#dots)" opacity={0.08} />
			<Gears k={6.4} x0={90} cy={1250} fills={['#f2c84b', '#e8873a', '#d23a2f']} stroke="#111" sw={8} depth={16} />
			<text x={800} y={1290} textAnchor="middle" fontFamily={BEBAS} fontSize={160} fill="#fff" stroke="#111" strokeWidth={8} paintOrder="stroke">?</text>
			{/* onomatopeya */}
			<g transform="rotate(-12 260 960)">
				<path d="M120 960 l40 -60 l30 40 l50 -70 l20 60 l60 -40 l-10 70 l70 0 l-60 40 l60 40 l-80 10 l20 60 l-70 -30 l-30 60 l-30 -60 l-60 30 l20 -60 l-70 -20 z" fill="#f2c84b" stroke="#111" strokeWidth={6} />
				<text x={255} y={985} textAnchor="middle" fontFamily={BEBAS} fontSize={64} fill="#d23a2f" stroke="#111" strokeWidth={3}>¡CLAC!</text>
			</g>
		</svg>
		<div style={{position: 'absolute', top: 60, left: 40, right: 40, background: '#111', color: '#f2c84b', padding: '14px 24px', fontFamily: BEBAS, fontSize: 64, letterSpacing: 2}}>ENIGMA 60 · EL RELOJ DE LA TORRE</div>
		<div style={{position: 'absolute', top: 175, left: 40, width: 600, background: '#fff8d6', border: '6px solid #111', padding: '10px 16px', fontFamily: HAND, fontSize: 30, color: '#111'}}>MEDIANOCHE. LEO TIENE UNA SOLA OPORTUNIDAD…</div>
		<div style={{position: 'absolute', top: 880, left: 560, width: 440, background: '#fff', border: '6px solid #111', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', padding: '30px 34px', fontFamily: HAND, fontSize: 36, color: '#111', textAlign: 'center'}}>Si el pequeño da 12 vueltas… ¿cuántas da el grande?</div>
		<div style={{position: 'absolute', top: 1650, left: 40, right: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
			<div style={{background: '#d23a2f', color: '#fff', border: '6px solid #111', padding: '10px 26px', fontFamily: BEBAS, fontSize: 80}}>0:42</div>
			<div style={{fontFamily: HAND, fontSize: 34, color: '#111', maxWidth: 560, textAlign: 'right'}}>¿El código? Escríbelo en comentarios.</div>
		</div>
	</AbsoluteFill>
);

// ---------------------------------------------------------------- 5 · Pixel art de aventura gráfica
const PX = 12;
const Pixel: React.FC = () => {
	const rects: React.ReactNode[] = [];
	const R = (x: number, y: number, w: number, h: number, c: string, k = '') => rects.push(<rect key={k + x + '-' + y + '-' + w + c} x={x * PX} y={y * PX} width={w * PX} height={h * PX} fill={c} />);
	// cielo por bandas
	['#1b1e4b', '#25295e', '#323873', '#424a8a', '#5a5aa0'].forEach((c, i) => R(0, 20 + i * 14, 90, 14, c, 'sky'));
	for (let i = 0; i < 40; i++) R((i * 37) % 90, 22 + ((i * 53) % 50), 1, 1, '#fff', 'st');
	R(64, 26, 8, 8, '#f6e7a8'); R(66, 25, 4, 1, '#f6e7a8'); R(63, 28, 1, 4, '#f6e7a8');
	// torre
	R(52, 40, 22, 60, '#8c6a4f'); R(52, 40, 2, 60, '#6b4f3a'); R(50, 36, 26, 4, '#b5483a'); R(54, 32, 18, 4, '#b5483a'); R(58, 28, 10, 4, '#b5483a');
	R(57, 46, 12, 12, '#f2ecd0'); R(62, 48, 2, 6, '#222'); R(62, 52, 5, 2, '#222');
	R(59, 82, 8, 18, '#4a2d1c'); R(65, 90, 1, 2, '#f2c84b');
	// suelo
	R(0, 100, 90, 60, '#3f7a3a'); for (let i = 0; i < 90; i += 3) R(i, 100, 1, 1, '#5fa04a', 'g');
	// mesa y engranajes (pixelados con círculos)
	R(8, 110, 44, 4, '#a8703f'); R(10, 114, 3, 12, '#7a4b2a'); R(47, 114, 3, 12, '#7a4b2a');
	// Leo
	R(66, 108, 6, 6, '#f1c7a0'); R(66, 106, 6, 2, '#3a2a1f'); R(67, 110, 1, 1, '#222'); R(70, 110, 1, 1, '#222');
	R(65, 114, 8, 8, '#e05a47'); R(66, 122, 2, 6, '#2f4f8f'); R(70, 122, 2, 6, '#2f4f8f');
	return (
		<AbsoluteFill style={{background: '#141634'}}>
			<svg width={1080} height={1920} shapeRendering="crispEdges">
				{rects}
				<g transform="translate(110 1170)" shapeRendering="crispEdges">
					{gears(2.6, 0, 60).map((g, i) => (
						<g key={i}>
							{Array.from({length: Math.ceil((g.r * 2 + 12) / PX)}).map((_, a) => Array.from({length: Math.ceil((g.r * 2 + 12) / PX)}).map((__, b) => {
								const x = g.cx - g.r - 6 + a * PX, y = g.cy - g.r - 6 + b * PX;
								const dx = x + PX / 2 - g.cx, dy = y + PX / 2 - g.cy;
								const d = Math.hypot(dx, dy);
								const ang = Math.atan2(dy, dx);
								const tooth = Math.cos(ang * g.z) > 0.2 ? 6 : 0;
								if (d > g.r + tooth - 4 || d < g.r * 0.2) return null;
								return <rect key={a + '-' + b} x={x} y={y} width={PX} height={PX} fill={['#f2c84b', '#e8873a', '#4fa3e0'][i]} opacity={d > g.r - 10 ? 0.85 : 1} />;
							}))}
						</g>
					))}
				</g>
				{/* caja de diálogo */}
				<rect x={36} y={1560} width={1008} height={290} fill="#000" stroke="#fff" strokeWidth={6} />
			</svg>
			<div style={{position: 'absolute', top: 60, left: 40, right: 40, fontFamily: MONO, fontWeight: 600, color: '#f2c84b', fontSize: 30, letterSpacing: 2}}>ENIGMA 60 · CAPÍTULO 01</div>
			<div style={{position: 'absolute', top: 104, left: 40, right: 40, fontFamily: MONO, fontWeight: 600, color: '#fff', fontSize: 50}}>EL RELOJ DE LA TORRE</div>
			<div style={{position: 'absolute', top: 1590, left: 70, right: 70, fontFamily: MONO, color: '#fff', fontSize: 36, lineHeight: 1.35}}>
				<span style={{color: '#7fd4ff'}}>LEO:</span> «Si el pequeño da 12 vueltas… ¿cuántas da el grande?»<br />
				<span style={{color: '#f2c84b'}}>▶ 3 vueltas&nbsp;&nbsp;&nbsp;▷ 4 vueltas&nbsp;&nbsp;&nbsp;▷ 48</span>
			</div>
			<div style={{position: 'absolute', top: 1470, right: 40, fontFamily: MONO, fontWeight: 600, color: '#ff6f55', fontSize: 56}}>00:42</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 6 · Cuento ilustrado en acuarela
const Acuarela: React.FC = () => (
	<AbsoluteFill style={{background: '#f7f0e1'}}>
		<svg width={1080} height={1920}>
			<defs>
				<filter id="wc" x="-20%" y="-20%" width="140%" height="140%">
					<feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={4} seed={9} result="n" />
					<feDisplacementMap in="SourceGraphic" in2="n" scale={26} result="d" />
					<feGaussianBlur in="d" stdDeviation={2.2} />
				</filter>
				<filter id="papelA"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={3} seed={2} /><feColorMatrix type="saturate" values="0" /></filter>
			</defs>
			<g filter="url(#wc)" opacity={0.85}>
				<rect x={0} y={200} width={1080} height={900} fill="#9fc6e8" />
				<circle cx={820} cy={380} r={90} fill="#fbe7a6" />
				<rect x={600} y={480} width={240} height={800} fill="#d8b48a" />
				<path d="M570 500 L720 330 L870 500 Z" fill="#c75b4a" />
				<ellipse cx={540} cy={1400} rx={760} ry={300} fill="#8fbf7a" />
				<circle cx={200} cy={900} r={170} fill="#6aa86a" />
				<rect x={520} y={1180} width={520} height={110} fill="#b07a4a" />
			</g>
			<circle cx={720} cy={640} r={70} fill="#fffaf0" stroke="#5a4636" strokeWidth={3} />
			<path d="M720 640 v-46 M720 640 l32 16" stroke="#5a4636" strokeWidth={5} strokeLinecap="round" />
			<g opacity={0.92} filter="url(#wc)">
				<Gears k={4.6} x0={140} cy={1460} fills={['#f0c35a', '#e48b52', '#6aa3d8']} depth={14} hole={0.18} />
			</g>
			<g fill="none" stroke="#5a4636" strokeWidth={3} opacity={0.8}>
				<Gears k={4.6} x0={140} cy={1460} fills={['none', 'none', 'none']} stroke="#5a4636" sw={3} depth={14} hole={0.18} />
			</g>
			{/* Leo pequeño con farol */}
			<g transform="translate(330 1260)">
				<path d="M-30 0 q30 -110 60 0 z" fill="#c75b4a" />
				<circle cy={-110} r={30} fill="#f3d2b0" stroke="#5a4636" strokeWidth={3} />
				<path d="M-34 -118 q34 -50 68 0" fill="#5a4636" />
				<line x1={30} y1={-60} x2={70} y2={-80} stroke="#5a4636" strokeWidth={4} />
				<circle cx={76} cy={-70} r={16} fill="#fbe7a6" />
			</g>
			<rect width={1080} height={1920} filter="url(#papelA)" opacity={0.12} style={{mixBlendMode: 'multiply'}} />
		</svg>
		<div style={{position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 30, color: '#8a6a4a', letterSpacing: 4}}>ENIGMA 60 · Cuento nº 1</div>
		<div style={{position: 'absolute', top: 110, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontWeight: 800, fontSize: 64, color: '#4a3626'}}>El reloj de la torre</div>
		<div style={{position: 'absolute', top: 1080, left: 80, right: 80, fontFamily: SERIF, fontWeight: 600, fontSize: 42, color: '#4a3626', lineHeight: 1.25, textAlign: 'center'}}>
			<span style={{fontSize: 90, float: 'left', lineHeight: 0.9, marginRight: 10, color: '#c75b4a'}}>E</span>ra casi medianoche y el reloj seguía parado…
		</div>
		<div style={{position: 'absolute', top: 1700, left: 80, right: 80, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 44, color: '#4a3626', textAlign: 'center'}}>{H.q1} <b style={{fontStyle: 'normal', fontWeight: 800, color: '#c75b4a'}}>{H.q2}</b></div>
	</AbsoluteFill>
);

// ---------------------------------------------------------------- 7 · Collage de recortes (mixed media)
const Collage: React.FC = () => (
	<AbsoluteFill style={{background: '#ece4d4'}}>
		<svg width={1080} height={1920}>
			<defs>
				<filter id="rip"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={2} seed={5} result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale={14} /></filter>
				<filter id="sh2"><feDropShadow dx="4" dy="10" stdDeviation="6" floodOpacity="0.35" /></filter>
				<pattern id="kraft" width={6} height={6} patternUnits="userSpaceOnUse"><rect width={6} height={6} fill="#c9a06a" /><circle cx={2} cy={3} r={0.8} fill="#a77d4a" /></pattern>
				<pattern id="linea" width={1080} height={46} patternUnits="userSpaceOnUse"><rect width={1080} height={46} fill="#fbf8ee" /><line x1={0} y1={45} x2={1080} y2={45} stroke="#9ec1e0" strokeWidth={2} /></pattern>
			</defs>
			<g filter="url(#sh2)">
				<rect x={60} y={260} width={620} height={760} fill="url(#kraft)" filter="url(#rip)" transform="rotate(-3 370 640)" />
				<g transform="rotate(4 820 600)">
					<rect x={640} y={330} width={360} height={520} fill="#24305e" />
					<path d="M720 850 V520 h200 V850 M700 530 l120 -110 l120 110z" fill="#f1e3c3" />
					<circle cx={820} cy={600} r={60} fill="#fff" stroke="#24305e" strokeWidth={6} />
				</g>
				<rect x={40} y={1040} width={1000} height={620} fill="url(#linea)" filter="url(#rip)" transform="rotate(1.5 540 1350)" />
			</g>
			<g transform="translate(70 1180) scale(0.95)" filter="url(#sh2)">
				<Gears k={5.8} x0={20} cy={240} fills={['#e8c14a', '#d9653b', '#3b6fb5']} depth={16} />
			</g>
			{/* cinta adhesiva */}
			<rect x={300} y={230} width={180} height={50} fill="#f6e7a8" opacity={0.8} transform="rotate(-8 390 255)" />
			<rect x={860} y={310} width={150} height={44} fill="#f6e7a8" opacity={0.8} transform="rotate(14 935 332)" />
			{/* sello */}
			<g transform="rotate(-14 870 1100)" opacity={0.85}>
				<circle cx={870} cy={1100} r={110} fill="none" stroke="#c0392b" strokeWidth={8} />
				<circle cx={870} cy={1100} r={92} fill="none" stroke="#c0392b" strokeWidth={3} />
				<text x={870} y={1090} textAnchor="middle" fontFamily={BEBAS} fontSize={42} fill="#c0392b">CASO 01</text>
				<text x={870} y={1130} textAnchor="middle" fontFamily={BEBAS} fontSize={32} fill="#c0392b">SIN RESOLVER</text>
			</g>
		</svg>
		{/* letras recortadas de revista */}
		<div style={{position: 'absolute', top: 70, left: 50, right: 50, display: 'flex', flexWrap: 'wrap', gap: 8}}>
			{'EL RELOJ DE LA TORRE'.split('').map((c, i) => c === ' ' ? <div key={i} style={{width: 20}} /> : (
				<div key={i} style={{background: ['#111', '#c0392b', '#f6e7a8', '#3b6fb5', '#fff'][i % 5], color: ['#fff', '#fff', '#111', '#fff', '#111'][i % 5], fontFamily: [BEBAS, SERIF, OSWALD, MONO, SERIF][i % 5], fontWeight: 800, fontSize: 50, padding: '0 8px', transform: `rotate(${((i * 37) % 9) - 4}deg)`, boxShadow: '2px 4px 0 rgba(0,0,0,0.25)'}}>{c}</div>
			))}
		</div>
		<div style={{position: 'absolute', top: 330, left: 110, width: 520, fontFamily: HAND, fontSize: 40, color: '#2a1d10', transform: 'rotate(-3deg)', lineHeight: 1.25}}>{H.historia}</div>
		<div style={{position: 'absolute', top: 1700, left: 60, right: 60, background: '#111', color: '#f6e7a8', padding: '18px 26px', fontFamily: OSWALD, fontWeight: 500, fontSize: 44, transform: 'rotate(-1deg)'}}>{H.q1} {H.q2}</div>
	</AbsoluteFill>
);

// ---------------------------------------------------------------- 8 · Concurso de TV retro (años 70)
const ConcursoTV: React.FC = () => (
	<AbsoluteFill style={{background: '#2a1a12'}}>
		<svg width={1080} height={1920}>
			<defs>
				<radialGradient id="sol" cx="50%" cy="38%" r="70%"><stop offset="0" stopColor="#ffb347" /><stop offset="1" stopColor="#7a2d1c" /></radialGradient>
			</defs>
			<rect width={1080} height={1920} fill="url(#sol)" />
			{Array.from({length: 24}).map((_, i) => {
				const a = (i / 24) * Math.PI * 2;
				return <path key={i} d={`M540 760 L${540 + 1600 * Math.cos(a)} ${760 + 1600 * Math.sin(a)} L${540 + 1600 * Math.cos(a + 0.13)} ${760 + 1600 * Math.sin(a + 0.13)} Z`} fill={i % 2 ? '#e8873a' : '#f2c84b'} opacity={0.35} />;
			})}
			{/* marcador con bombillas */}
			<rect x={90} y={420} width={900} height={640} rx={60} fill="#2a1a12" stroke="#f2c84b" strokeWidth={14} />
			{Array.from({length: 30}).map((_, i) => {
				const t = i / 30;
				const per = 2 * (900 + 640);
				let d = t * per, x = 90, y = 420;
				if (d < 900) x += d; else if ((d -= 900) < 640) { x += 900; y += d; } else if ((d -= 640) < 900) { x += 900 - d; y += 640; } else { d -= 900; y += 640 - d; }
				return <circle key={i} cx={x} cy={y} r={14} fill={i % 3 ? '#fff6c8' : '#ff6f55'} />;
			})}
			<g transform="translate(150 560)">
				<Gears k={5.4} x0={0} cy={230} fills={['#fff6c8', '#ff6f55', '#5ec4d6']} stroke="#2a1a12" sw={6} />
			</g>
			{/* atril del concursante */}
			<path d="M300 1500 h480 l-60 300 h-360 z" fill="#5ec4d6" stroke="#2a1a12" strokeWidth={10} />
			<text x={540} y={1640} textAnchor="middle" fontFamily={BEBAS} fontSize={110} fill="#2a1a12">LEO</text>
			<circle cx={540} cy={1430} r={60} fill="#ff6f55" stroke="#2a1a12" strokeWidth={10} />
		</svg>
		<div style={{position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center', fontFamily: BEBAS, fontSize: 120, color: '#fff6c8', textShadow: '6px 6px 0 #7a2d1c', letterSpacing: 4}}>¡ENIGMA 60!</div>
		<div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', fontFamily: OSWALD, fontWeight: 500, fontSize: 40, color: '#2a1a12', letterSpacing: 6}}>PRUEBA 1 · EL RELOJ DE LA TORRE</div>
		<div style={{position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center', fontFamily: BEBAS, fontSize: 90, color: '#2a1a12'}}>⏱ 0:42</div>
		<div style={{position: 'absolute', top: 1110, left: 60, right: 60, background: '#fff6c8', border: '8px solid #2a1a12', borderRadius: 30, padding: 26, fontFamily: OSWALD, fontWeight: 500, fontSize: 46, textAlign: 'center', color: '#2a1a12'}}>
			{H.q1}<br /><b style={{color: '#c0392b'}}>{H.q2}</b>
			<div style={{display: 'flex', justifyContent: 'space-around', marginTop: 18, fontFamily: BEBAS, fontSize: 64}}>
				<span>A · 3</span><span>B · 4</span><span>C · 48</span>
			</div>
		</div>
	</AbsoluteFill>
);

// ---------------------------------------------------------------- 9 · Neón arcade (synthwave)
const Neon: React.FC = () => (
	<AbsoluteFill style={{background: '#0b0221'}}>
		<svg width={1080} height={1920}>
			<defs>
				<linearGradient id="solN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd319" /><stop offset="0.6" stopColor="#ff2975" /><stop offset="1" stopColor="#8c1eff" /></linearGradient>
				<filter id="glow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
			</defs>
			<circle cx={540} cy={820} r={300} fill="url(#solN)" />
			{Array.from({length: 7}).map((_, i) => <rect key={i} x={200} y={860 + i * 36} width={680} height={6 + i * 3} fill="#0b0221" />)}
			{/* silueta torre */}
			<path d="M420 1120 V640 h140 V1120 M400 650 l90 -100 l90 100z" fill="#0b0221" stroke="#f222ff" strokeWidth={4} filter="url(#glow)" />
			<circle cx={490} cy={720} r={40} fill="none" stroke="#00f0ff" strokeWidth={5} filter="url(#glow)" />
			{/* rejilla */}
			<g stroke="#f222ff" strokeWidth={3} opacity={0.8} filter="url(#glow)">
				{Array.from({length: 12}).map((_, i) => <line key={'h' + i} x1={0} x2={1080} y1={1120 + Math.pow(i, 1.7) * 9} y2={1120 + Math.pow(i, 1.7) * 9} />)}
				{Array.from({length: 17}).map((_, i) => <line key={'v' + i} x1={540} y1={1120} x2={540 + (i - 8) * 260} y2={1920} />)}
			</g>
			<g transform="translate(110 1260)" filter="url(#glow)">
				<Gears k={5.6} x0={0} cy={240} fills={['none', 'none', 'none']} stroke="#00f0ff" sw={5} depth={14} />
			</g>
		</svg>
		<div style={{position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 30, color: '#00f0ff', letterSpacing: 10, textShadow: '0 0 14px #00f0ff'}}>ENIGMA 60 · STAGE 01</div>
		<div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', fontFamily: BEBAS, fontSize: 110, color: '#fff', textShadow: '0 0 20px #f222ff, 0 0 40px #f222ff'}}>EL RELOJ DE LA TORRE</div>
		<div style={{position: 'absolute', top: 290, left: 80, right: 80, textAlign: 'center', fontFamily: OSWALD, fontWeight: 300, fontSize: 44, color: '#fff'}}>{H.q1} <span style={{color: '#ffd319', textShadow: '0 0 12px #ffd319'}}>{H.q2}</span></div>
		<div style={{position: 'absolute', top: 1720, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 90, color: '#ff2975', textShadow: '0 0 18px #ff2975'}}>00:42</div>
	</AbsoluteFill>
);

// ---------------------------------------------------------------- 10 · Tipografía cinética (suizo)
const Tipografica: React.FC = () => (
	<AbsoluteFill style={{background: '#f2efe8'}}>
		<svg width={1080} height={1920}>
			<rect x={0} y={0} width={1080} height={640} fill="#ff4a1c" />
			<g transform="translate(560 1160)">
				<path d={gearPath(40, 420, 34, 0.12)} fill="#111" fillRule="evenodd" />
			</g>
			<g transform="translate(150 1340)"><path d={gearPath(10, 110, 22, 0.2)} fill="#ff4a1c" fillRule="evenodd" /></g>
			<g transform="translate(250 1610)"><path d={gearPath(20, 190, 26, 0.16)} fill="#2d5bff" fillRule="evenodd" /></g>
			<text x={560} y={1225} textAnchor="middle" fontFamily={BEBAS} fontSize={220} fill="#f2efe8">?</text>
		</svg>
		<div style={{position: 'absolute', top: 70, left: 60, fontFamily: MONO, fontWeight: 600, fontSize: 26, color: '#111', letterSpacing: 3}}>ENIGMA 60 — 01 / RELOJ</div>
		<div style={{position: 'absolute', top: 120, left: 50, right: 40, fontFamily: BEBAS, fontSize: 230, lineHeight: 0.82, color: '#111'}}>12<br />VUELTAS</div>
		<div style={{position: 'absolute', top: 520, left: 60, fontFamily: OSWALD, fontWeight: 500, fontSize: 40, color: '#f2efe8'}}>da el pequeño. ¿Y el grande?</div>
		<div style={{position: 'absolute', top: 700, left: 60, right: 60, fontFamily: OSWALD, fontWeight: 300, fontSize: 40, color: '#111'}}>{H.historia}</div>
		<div style={{position: 'absolute', top: 1220, left: 760, fontFamily: MONO, fontWeight: 600, fontSize: 30, color: '#111'}}>Z=40</div>
		<div style={{position: 'absolute', top: 1180, left: 40, fontFamily: MONO, fontWeight: 600, fontSize: 30, color: '#111'}}>Z=10</div>
		<div style={{position: 'absolute', top: 1820, left: 460, fontFamily: MONO, fontWeight: 600, fontSize: 30, color: '#111'}}>Z=20</div>
		<div style={{position: 'absolute', top: 1720, right: 60, fontFamily: BEBAS, fontSize: 140, color: '#ff4a1c'}}>0:42</div>
	</AbsoluteFill>
);

export const ESTILOS10 = {
	isla3d: IslaLowPoly,
	isometrico: SalaIsometrica,
	plastilina: Plastilina,
	comic: Comic,
	pixel: Pixel,
	acuarela: Acuarela,
	collage: Collage,
	concurso: ConcursoTV,
	neon: Neon,
	tipografia: Tipografica,
} as const;

export const E60Estilo10: React.FC<{estilo: keyof typeof ESTILOS10}> = ({estilo}) => {
	const C = ESTILOS10[estilo];
	return <C />;
};
