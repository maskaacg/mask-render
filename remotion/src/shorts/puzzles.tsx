import React from 'react';
import {Easing, interpolate} from 'remotion';

// Cada puzle se dibuja en una caja local de 1080 x 900 apoyada sobre la mesa.
// Recibe el tiempo global y el inicio de las fases para animarse solo.
export type PuzzleProps = {
	datos: Record<string, any>;
	t: number; // segundos desde el inicio del vídeo
	enunciado: number; // inicio del enunciado
	solucion: number; // inicio de la solución (1e6 si es un avance)
};

const SERIF = 'DejaVu Serif, Georgia, serif';
const SANS = 'DejaVu Sans, Arial, sans-serif';
const BRASS = '#c9a25a';
const INK = '#f3e6c6';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.inOut(Easing.cubic);
const appear = (t: number, at: number, d = 0.6) => interpolate(t, [at, at + d], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});

const Plaque: React.FC<{x: number; y: number; w: number; text: string; o?: number; size?: number}> = ({x, y, w, text, o = 1, size = 34}) => (
	<g opacity={o}>
		<rect x={x - w / 2} y={y - 30} width={w} height={60} rx={10} fill="#2a1d10" stroke={BRASS} strokeWidth={3} />
		<text x={x} y={y + size / 3} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={size} fill={INK}>
			{text}
		</text>
	</g>
);

// ---------- 1. Engranajes ----------
const Gear: React.FC<{cx: number; cy: number; teeth: number; r: number; angle: number; color: string}> = ({cx, cy, teeth, r, angle, color}) => {
	const d: string[] = [];
	const inner = r - 14;
	for (let i = 0; i < teeth; i++) {
		const a0 = (i / teeth) * 2 * Math.PI;
		const a1 = a0 + (0.5 / teeth) * 2 * Math.PI;
		const p = (rad: number, a: number) => `${(Math.cos(a) * rad).toFixed(1)},${(Math.sin(a) * rad).toFixed(1)}`;
		d.push(`${i === 0 ? 'M' : 'L'}${p(inner, a0)} L${p(r, a0 + 0.08 / teeth)} L${p(r, a1 - 0.08 / teeth)} L${p(inner, a1)}`);
	}
	return (
		<g transform={`translate(${cx} ${cy}) rotate(${angle})`}>
			<path d={d.join(' ') + 'Z'} fill={color} stroke="#3a2a12" strokeWidth={3} />
			<circle r={inner * 0.55} fill="none" stroke="#3a2a12" strokeWidth={6} />
			<line x1={0} y1={-inner * 0.55} x2={0} y2={inner * 0.55} stroke="#3a2a12" strokeWidth={8} />
			<circle r={14} fill="#2a1d10" />
			<circle cx={inner * 0.78} cy={0} r={9} fill="#f6e3a8" />
		</g>
	);
};

export const Engranajes: React.FC<PuzzleProps> = ({datos, t, enunciado, solucion}) => {
	const [a, b, c] = datos.dientes as number[];
	const k = 7.0;
	const ra = a * k, rb = b * k, rc = c * k;
	const ca = {x: ra, y: 430};
	const cb = {x: ca.x + ra + rb - 8, y: 430};
	const cc = {x: cb.x + rb + rc - 8, y: 430};
	// giro lento de ambiente; en la solución el pequeño da sus 12 vueltas en 7 s
	const slow = t * 20;
	const solT = Math.max(0, t - solucion - 0.6);
	const turns = interpolate(solT, [0, 7], [0, datos.vueltas], {...clamp, easing: ease});
	const angA = slow + turns * 360;
	const angB = -(angA * a) / b;
	const angC = (angA * a) / c;
	const bigTurns = (turns * a) / c;
	const o = appear(t, enunciado);
	const scale = 960 / (cc.x + rc);
	return (
		<g transform={`translate(60 ${430 * (1 - scale)}) scale(${scale})`} opacity={o}>
			<Gear cx={ca.x} cy={ca.y} teeth={a} r={ra} angle={angA} color="#d9b25e" />
			<Gear cx={cb.x} cy={cb.y} teeth={b} r={rb} angle={angB + 180 / b} color="#b88d3e" />
			<Gear cx={cc.x} cy={cc.y} teeth={c} r={rc} angle={angC} color="#9b7330" />
			<Plaque x={ca.x + 70} y={ca.y + rb + 80} w={170} text={`${a} dientes`} o={appear(t, enunciado + 0.3)} size={30} />
			<Plaque x={cb.x + 40} y={cb.y + rc + 60} w={170} text={`${b} dientes`} o={appear(t, enunciado + 0.6)} size={30} />
			<Plaque x={cc.x} y={cc.y + rc + 60} w={190} text={`${c} dientes`} o={appear(t, enunciado + 0.9)} size={30} />
			{t > solucion && (
				<g>
					<Plaque x={ca.x + 40} y={ca.y - rb - 70} w={260} text={`${Math.floor(turns)} ${Math.floor(turns) === 1 ? 'vuelta' : 'vueltas'}`} size={34} />
					<Plaque x={cc.x} y={cc.y - rc - 60} w={260} text={`${Math.floor(bigTurns + 1e-6)} ${Math.floor(bigTurns + 1e-6) === 1 ? 'vuelta' : 'vueltas'}`} size={34} />
				</g>
			)}
		</g>
	);
};

// ---------- 2. Cajas fuertes ----------
const BOX_COL: Record<string, string> = {roja: '#a33b32', azul: '#2f5f9a', verde: '#3a7f4a'};
export const Cajas: React.FC<PuzzleProps> = ({datos, t, enunciado, solucion}) => {
	const cols = datos.colores as string[];
	const labels = datos.etiquetas as string[];
	const win = datos.respuesta as number;
	const open = interpolate(t, [solucion + 0.4, solucion + 1.6], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<g>
			{cols.map((c, i) => {
				const cx = 200 + i * 340;
				const o = appear(t, enunciado + i * 0.35);
				const isWin = i === win;
				const dim = t > solucion + 1.6 && !isWin ? 0.45 : 1;
				const lidW = 220 * (isWin ? Math.cos((open * 75 * Math.PI) / 180) : 1);
				return (
					<g key={c} opacity={o * dim} transform={`translate(0 ${(1 - o) * 60})`}>
						<rect x={cx - 130} y={280} width={260} height={300} rx={14} fill="#1b1410" stroke="#000" strokeWidth={4} />
						{isWin && open > 0 && (
							<g opacity={open}>
								<rect x={cx - 110} y={300} width={220} height={260} fill="#0d1a24" />
								<rect x={cx - 40} y={400} width={80} height={60} rx={6} fill="#7fe0ff" style={{filter: 'drop-shadow(0 0 22px #7fe0ff)'}} />
							</g>
						)}
						<rect x={cx - 110} y={300} width={lidW} height={260} rx={10} fill={BOX_COL[c]} stroke="#000" strokeWidth={3} />
						<circle cx={cx - 110 + lidW * 0.75} cy={430} r={26} fill="none" stroke="#d8d8d8" strokeWidth={6} opacity={lidW > 60 ? 1 : 0} />
						<rect x={cx - 150} y={620} width={300} height={110} rx={10} fill="#2a1d10" stroke={BRASS} strokeWidth={3} />
						<foreignObject x={cx - 145} y={625} width={290} height={100}>
							<div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 32, lineHeight: 1.1, color: INK}}>
								«{labels[i]}»
							</div>
						</foreignObject>
					</g>
				);
			})}
		</g>
	);
};

// ---------- 3. Lentes ----------
export const Lentes: React.FC<PuzzleProps> = ({datos, t, enunciado, solucion}) => {
	const rel = datos.relaciones as string[];
	const vals = [6, 3, 1];
	const names = ['A', 'B', 'C'];
	const sizes = [150, 115, 85];
	return (
		<g>
			{names.map((n, i) => {
				const cx = 200 + i * 340;
				const o = appear(t, enunciado + i * 0.4);
				const glow = 0.5 + 0.5 * Math.sin(t * 2 + i);
				const show = appear(t, solucion + 1 + i * 0.5);
				return (
					<g key={n} opacity={o}>
						<line x1={cx} y1={400 + sizes[i]} x2={cx} y2={640} stroke="#6b5233" strokeWidth={14} />
						<rect x={cx - 60} y={630} width={120} height={24} rx={6} fill="#4a3520" />
						<circle cx={cx} cy={400} r={sizes[i] + 14} fill="#8a6a35" />
						<circle cx={cx} cy={400} r={sizes[i]} fill="#9fd3ff" fillOpacity={0.25 + 0.15 * glow} stroke="#e3f3ff" strokeWidth={4} />
						<ellipse cx={cx - sizes[i] * 0.35} cy={400 - sizes[i] * 0.4} rx={sizes[i] * 0.25} ry={sizes[i] * 0.12} fill="#fff" opacity={0.5} />
						<text x={cx} y={415} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={64} fill={INK}>{n}</text>
						{t > solucion && <Plaque x={cx} y={180} w={130} text={`×${vals[i]}`} o={show} size={40} />}
					</g>
				);
			})}
			{rel.map((r, i) => (
				<Plaque key={r} x={540} y={730 + i * 70} w={420} text={r} o={appear(t, enunciado + 1.2 + i * 0.4)} size={32} />
			))}
		</g>
	);
};

// ---------- 4. Balanza ----------
const Key: React.FC<{x: number; y: number}> = ({x, y}) => (
	<g transform={`translate(${x} ${y})`} fill="none" stroke="#e2c27a" strokeWidth={9} strokeLinecap="round">
		<circle cx={-24} cy={0} r={18} />
		<path d="M-6 0 H40 M24 0 V14 M36 0 V12" />
	</g>
);
export const Balanza: React.FC<PuzzleProps> = ({datos, t, enunciado, solucion}) => {
	const nL = datos.izquierda.n as number;
	const nR = datos.derecha.n as number;
	const o = appear(t, enunciado);
	const wobble = Math.sin(t * 1.6) * 2.2 * Math.exp(-Math.max(0, t - enunciado) * 0.15);
	const ang = wobble;
	const pivot = {x: 540, y: 230};
	const arm = 330;
	const rad = (ang * Math.PI) / 180;
	const L = {x: pivot.x - arm * Math.cos(rad), y: pivot.y - arm * Math.sin(rad)};
	const R = {x: pivot.x + arm * Math.cos(rad), y: pivot.y + arm * Math.sin(rad)};
	const pan = (p: {x: number; y: number}, children: React.ReactNode) => (
		<g>
			<line x1={p.x} y1={p.y} x2={p.x - 110} y2={p.y + 220} stroke="#b89a5a" strokeWidth={3} />
			<line x1={p.x} y1={p.y} x2={p.x + 110} y2={p.y + 220} stroke="#b89a5a" strokeWidth={3} />
			<path d={`M${p.x - 130} ${p.y + 220} Q${p.x} ${p.y + 290} ${p.x + 130} ${p.y + 220} Z`} fill="#a8823e" stroke="#5a4320" strokeWidth={3} />
			{children}
		</g>
	);
	const s1 = appear(t, solucion + 0.9);
	const s2 = appear(t, solucion + 2.2);
	return (
		<g opacity={o}>
			<rect x={520} y={230} width={40} height={460} fill="#7a5c2c" />
			<rect x={420} y={680} width={240} height={36} rx={8} fill="#5a4320" />
			<line x1={L.x} y1={L.y} x2={R.x} y2={R.y} stroke="#c9a25a" strokeWidth={16} strokeLinecap="round" />
			<circle cx={pivot.x} cy={pivot.y} r={22} fill="#e2c27a" />
			{pan(L, Array.from({length: nL}, (_, i) => <Key key={i} x={L.x - 40 + i * 80} y={L.y + 210} />))}
			{pan(R, Array.from({length: nR}, (_, i) => (
				<g key={i}>
					<ellipse cx={R.x - 70 + i * 70} cy={R.y + 212} rx={30} ry={12} fill="#d8b45a" stroke="#6b4c22" strokeWidth={3} />
					<ellipse cx={R.x - 70 + i * 70} cy={R.y + 206} rx={30} ry={12} fill="#e9c66a" stroke="#6b4c22" strokeWidth={3} />
				</g>
			)))}
			<Plaque x={L.x} y={L.y + 340} w={240} text={`${datos.izquierda.peso} g cada una`} o={appear(t, enunciado + 3)} size={28} />
			{t > solucion && <Plaque x={L.x} y={120} w={220} text={`${nL * datos.izquierda.peso} g`} o={s1} size={36} />}
			{t > solucion && <Plaque x={R.x} y={R.y + 340} w={240} text={`${datos.respuesta} g cada una`} o={s2} size={28} />}
		</g>
	);
};

// ---------- 5. Velas ----------
export const Velas: React.FC<PuzzleProps> = ({datos, t, enunciado, solucion}) => {
	const horas = datos.horas as number[];
	const apagadas = datos.apagadas as number[];
	const noche = datos.noche as number;
	// Lapso de tiempo de la noche durante la solución: 0 → 8 h en 7 s
	const h = t > solucion ? interpolate(t - solucion - 0.6, [0, 7], [0, noche], clamp) : 0;
	const o = appear(t, enunciado);
	const unit = 62; // px por hora de vela
	return (
		<g opacity={o}>
			{horas.map((hr, i) => {
				const cx = 210 + i * 220;
				const off = apagadas.includes(i);
				const burned = off ? Math.min(h, 1) : Math.min(h, hr);
				const height = (hr - burned) * unit;
				const lit = h === 0 || (off ? h < 1 : h < hr);
				const base = 700;
				const flick = 1 + 0.12 * Math.sin(t * 13 + i * 2) + 0.06 * Math.sin(t * 29 + i);
				return (
					<g key={i}>
						<ellipse cx={cx} cy={base + 6} rx={70} ry={16} fill="#3a2a18" />
						{height > 0 && <rect x={cx - 34} y={base - height} width={68} height={height} rx={8} fill="#efe2c4" stroke="#bfae8a" strokeWidth={2} />}
						{height > 0 && <line x1={cx} y1={base - height} x2={cx} y2={base - height - 20} stroke="#222" strokeWidth={4} />}
						{lit && height > 0 && (
							<path d={`M${cx} ${base - height - 70 * flick} Q${cx + 20} ${base - height - 30} ${cx} ${base - height - 16} Q${cx - 20} ${base - height - 30} ${cx} ${base - height - 70 * flick}Z`} fill="#ffc760" style={{filter: 'drop-shadow(0 0 18px #ffb040)'}} />
						)}
						{!lit && off && height > 0 && <path d={`M${cx} ${base - height - 22} q12 -30 -4 -60 q-14 -24 6 -50`} fill="none" stroke="#9a9a9a" strokeWidth={4} opacity={Math.max(0, 1 - (h - 1) / 2)} />}
						<Plaque x={cx} y={base + 70} w={150} text={`${hr} h`} o={appear(t, enunciado + 0.4 + i * 0.3)} />
					</g>
				);
			})}
			{t > solucion && <Plaque x={540} y={110} w={300} text={`Hora ${Math.floor(h)} de ${noche}`} size={34} />}
		</g>
	);
};

// ---------- 6. Gemas ----------
export const Gemas: React.FC<PuzzleProps> = ({datos, t, enunciado, solucion}) => {
	const eq = datos.ecuaciones as string[];
	const gems = [
		{c: '#d0404f', n: 'ROJA'},
		{c: '#3c6fd0', n: 'AZUL'},
		{c: '#3caa62', n: 'VERDE'},
	];
	return (
		<g>
			<rect x={90} y={150} width={900} height={640} rx={26} fill="#3a3a36" stroke="#1d1d1a" strokeWidth={6} opacity={appear(t, enunciado)} />
			{gems.map((g, i) => {
				const cx = 250 + i * 290;
				const o = appear(t, enunciado + 0.3 + i * 0.3);
				const tw = 0.6 + 0.4 * Math.sin(t * 3 + i * 2);
				return (
					<g key={g.n} opacity={o}>
						<polygon points={`${cx},230 ${cx + 70},290 ${cx + 45},380 ${cx - 45},380 ${cx - 70},290`} fill={g.c} stroke="#111" strokeWidth={4} />
						<polygon points={`${cx},230 ${cx + 30},290 ${cx},380 ${cx - 30},290`} fill="#fff" opacity={0.18 * tw} />
						{t > solucion && <Plaque x={cx} y={430} w={110} text={`${i === 2 ? 3 : 5}`} o={appear(t, solucion + 1 + (2 - i) * 0.6)} size={40} />}
					</g>
				);
			})}
			{eq.map((e, i) => (
				<text key={e} x={540} y={540 + i * 80} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={50} fill="#e8e0c8" opacity={appear(t, enunciado + 1 + i * 0.5)} letterSpacing={2}>
					{e}
				</text>
			))}
		</g>
	);
};

// ---------- 7. Espejos ----------
const Mirror: React.FC<{d: number | string; x: number; y: number; split: number; color: string; o: number}> = ({d, x, y, split, color, o}) => (
	<g opacity={o}>
		{/* reflejo: el mismo dígito volteado a la izquierda del eje */}
		<g transform={`translate(${x - 3 - split} 0) scale(-1 1)`}>
			<text x={0} y={y} textAnchor="start" fontFamily={SANS} fontWeight={700} fontSize={128} fill={color}>
				{d}
			</text>
		</g>
		{split > 4 && <line x1={x} y1={y - 120} x2={x} y2={y + 20} stroke="#ffd27a" strokeWidth={3} strokeDasharray="8 8" />}
		<text x={x + 3 + split} y={y} textAnchor="start" fontFamily={SANS} fontWeight={700} fontSize={128} fill={split > 4 ? '#ffd27a' : color}>
			{d}
		</text>
	</g>
);
export const Espejos: React.FC<PuzzleProps> = ({datos, t, enunciado, solucion}) => {
	const digs = datos.digitos as number[];
	const split = t > solucion ? interpolate(t - solucion, [0.4, 1.6], [0, 8], {...clamp, easing: ease}) : 0;
	const stone = '#cfc6b0';
	return (
		<g>
			<rect x={60} y={170} width={960} height={560} rx={20} fill="#4a463e" stroke="#2a2722" strokeWidth={6} opacity={appear(t, enunciado)} />
			{digs.map((d, i) => (
				<Mirror key={d} d={d} x={180 + i * 240} y={500} split={split} color={stone} o={appear(t, enunciado + 0.3 + i * 0.4)} />
			))}
			{t <= solucion + 3 ? (
				<text x={900} y={500} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={150} fill="#ffd27a" opacity={appear(t, enunciado + 1.6) * (t > solucion + 2.6 ? 0 : 1)}>?</text>
			) : null}
			{t > solucion + 2.6 && <Mirror d={datos.respuesta} x={900} y={500} split={split} color={stone} o={appear(t, solucion + 2.6)} />}
		</g>
	);
};

export const PUZZLES: Record<string, React.FC<PuzzleProps>> = {
	engranajes: Engranajes,
	cajas: Cajas,
	lentes: Lentes,
	balanza: Balanza,
	velas: Velas,
	gemas: Gemas,
	espejos: Espejos,
};
