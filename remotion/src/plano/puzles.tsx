import React from 'react';
import {Easing, interpolate} from 'remotion';
import {BEBAS, HAND} from '../style/fonts';
import {LINEA} from './escenas';

// Los 7 acertijos en estilo «plano»: líneas claras, tinta de acento del episodio y
// anotaciones de la solución en lápiz rojo. Caja local de 1080 x 900 (origen en y = 840).
export type PuzleProps = {
	datos: Record<string, any>;
	t: number;
	enunciado: number;
	solucion: number;
	acento: string;
};

export const ROJO = '#ff6f55';
const W = LINEA;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.inOut(Easing.cubic);
const ap = (t: number, at: number, d = 0.6) => interpolate(t, [at, at + d], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
const draw = (t: number, at: number, d = 0.9) => {
	const q = interpolate(t, [at, at + d], [0, 1], {...clamp, easing: ease});
	return {pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - q};
};
const circ = (r: number, cx = 0, cy = 0) => `M${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy} Z`;

/** Nota manuscrita; con `caja` dibuja un recuadro a lápiz. */
export const Nota: React.FC<{x: number; y: number; text: string; o?: number; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end'; caja?: boolean}> = ({x, y, text, o = 1, color = W, size = 44, anchor = 'middle', caja}) => {
	const w = text.length * size * 0.6 + 40;
	const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w + 18 : x - 18;
	return (
		<g opacity={o}>
			{caja && <rect x={x0} y={y - size * 0.95} width={w} height={size * 1.45} rx={8} fill="rgba(5,10,20,0.55)" stroke={color} strokeWidth={2.5} />}
			<text x={x} y={y} textAnchor={anchor} fontFamily={HAND} fontSize={size} fill={color}>
				{text}
			</text>
		</g>
	);
};
/** Círculo rojo a mano alrededor de la respuesta. */
const Rodeo: React.FC<{cx: number; cy: number; rx: number; ry: number; t: number; at: number}> = ({cx, cy, rx, ry, t, at}) => (
	<path d={`M${cx - rx} ${cy + 6} C${cx - rx} ${cy - ry * 1.3} ${cx + rx * 1.1} ${cy - ry * 1.2} ${cx + rx} ${cy} C${cx + rx * 0.95} ${cy + ry * 1.25} ${cx - rx * 1.05} ${cy + ry * 1.2} ${cx - rx * 0.9} ${cy - ry * 0.4}`} fill="none" stroke={ROJO} strokeWidth={5} strokeLinecap="round" {...draw(t, at, 0.7)} />
);
const Tachar: React.FC<{x: number; y: number; s: number; t: number; at: number}> = ({x, y, s, t, at}) => (
	<g stroke={ROJO} strokeWidth={6} strokeLinecap="round">
		<path d={`M${x - s} ${y - s} L${x + s} ${y + s}`} {...draw(t, at, 0.35)} />
		<path d={`M${x + s} ${y - s} L${x - s} ${y + s}`} {...draw(t, at + 0.25, 0.35)} />
	</g>
);

// ---------- 1. Engranajes ----------
const gearPath = (teeth: number, r: number, depth = 15) => {
	const inner = r - depth;
	const p = (rad: number, a: number) => `${(Math.cos(a) * rad).toFixed(1)},${(Math.sin(a) * rad).toFixed(1)}`;
	const s = (2 * Math.PI) / teeth;
	const pts: string[] = [];
	for (let i = 0; i < teeth; i++) {
		const a0 = i * s;
		pts.push(`${i === 0 ? 'M' : 'L'}${p(inner, a0)} L${p(r, a0 + s * 0.12)} L${p(r, a0 + s * 0.42)} L${p(inner, a0 + s * 0.54)}`);
	}
	return pts.join(' ') + ' Z';
};
export const Engranajes: React.FC<PuzleProps> = ({datos, t, enunciado, solucion, acento}) => {
	const z = datos.dientes as number[];
	const K = 6.4;
	const R = z.map((n) => n * K);
	const cx0 = 70 + R[0];
	const cx1 = cx0 + R[0] + R[1] - 12;
	const cx2 = cx1 + R[1] + R[2] - 12;
	const G = [cx0, cx1, cx2].map((cx, i) => ({cx, cy: i === 2 ? 400 : 440, r: R[i], z: z[i]}));
	const solT = Math.max(0, t - solucion - 0.6);
	const turns = interpolate(solT, [0, 7], [0, datos.vueltas], {...clamp, easing: ease});
	const a0 = t * 14 + turns * 360;
	const ang = [a0, -(a0 * z[0]) / z[1] + 180 / z[1], (a0 * z[0]) / z[2]];
	const big = (turns * z[0]) / z[2];
	const sol = t > solucion;
	return (
		<g>
			{G.map((g, i) => (
				<g key={i}>
					<g transform={`translate(${g.cx} ${g.cy}) rotate(${ang[i]})`}>
						<path d={gearPath(g.z, g.r)} fill={acento} fillOpacity={0.1} stroke={i === 2 && sol ? acento : W} strokeWidth={3} {...draw(t, enunciado + i * 0.5, 1.2)} />
						<circle r={g.r - 26} fill="none" stroke={W} strokeWidth={1.5} strokeDasharray="10 8" opacity={0.55 * ap(t, enunciado + 1 + i * 0.4)} />
						<circle cx={g.r * 0.6} r={8} fill={acento} opacity={ap(t, enunciado + 1 + i * 0.4)} />
					</g>
					<path d={`M${g.cx - 22} ${g.cy} H${g.cx + 22} M${g.cx} ${g.cy - 22} V${g.cy + 22}`} stroke={W} strokeWidth={2} opacity={ap(t, enunciado + i * 0.5)} />
				</g>
			))}
			<Nota x={G[0].cx} y={G[0].cy + G[0].r + 70} text={`Z = ${z[0]}`} o={ap(t, enunciado + 0.6)} />
			<Nota x={G[1].cx - 20} y={G[1].cy - G[1].r - 40} text={`Z = ${z[1]}`} o={ap(t, enunciado + 1.0)} />
			<Nota x={G[2].cx + 60} y={G[2].cy - G[2].r - 30} text={`Z = ${z[2]}`} o={ap(t, enunciado + 1.4)} />
			<Nota x={G[0].cx - 30} y={G[0].cy - G[0].r - 30} text={sol ? `${Math.floor(turns)} v.` : `× ${datos.vueltas}`} color={ROJO} o={ap(t, enunciado + 2)} />
			{!sol && <Nota x={G[2].cx} y={G[2].cy + 45} text="?" size={130} color={ROJO} o={ap(t, enunciado + 2.4)} />}
			{sol && (
				<g>
					<Nota x={G[2].cx} y={G[2].cy + 40} text={`${Math.floor(big + 1e-6)}`} size={130} color={ROJO} />
					<Nota x={G[2].cx} y={G[2].cy + G[2].r + 70} text={`${datos.vueltas} × ${z[0]} = ${datos.vueltas * z[0]}  ·  ${datos.vueltas * z[0]} ÷ ${z[2]} = ${datos.respuesta}`} size={36} color={ROJO} o={ap(t, solucion + 3)} />
				</g>
			)}
		</g>
	);
};

// ---------- 2. Cajas fuertes ----------
const TINTA: Record<string, string> = {roja: '#ff6b6b', azul: '#6fb6ff', verde: '#6fe39a'};
export const Cajas: React.FC<PuzleProps> = ({datos, t, enunciado, solucion, acento}) => {
	const cols = datos.colores as string[];
	const labels = datos.etiquetas as string[];
	const win = datos.respuesta as number;
	// etiqueta que dice la verdad (no tiene por qué ser la de la caja ganadora)
	const verdad = (datos.verdadera ?? win) as number;
	const open = interpolate(t, [solucion + 0.4, solucion + 1.6], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<g>
			{cols.map((c, i) => {
				const cx = 200 + i * 340;
				const at = enunciado + i * 0.5;
				const isWin = i === win;
				const doorW = 200 * (isWin ? Math.cos((open * 80 * Math.PI) / 180) : 1);
				return (
					<g key={c}>
						<rect x={cx - 130} y={180} width={260} height={320} rx={10} fill="rgba(5,10,20,0.4)" stroke={W} strokeWidth={3} {...draw(t, at)} />
						{isWin && open > 0 && (
							<g opacity={open}>
								<rect x={cx - 40} y={300} width={80} height={56} rx={6} fill="none" stroke={acento} strokeWidth={4} style={{filter: `drop-shadow(0 0 14px ${acento})`}} />
								<path d={`M${cx - 26} 316 h52 M${cx - 26} 330 h52 M${cx - 26} 344 h52`} stroke={acento} strokeWidth={3} />
							</g>
						)}
						<rect x={cx - 100} y={210} width={doorW} height={260} rx={6} fill={TINTA[c]} fillOpacity={0.14} stroke={TINTA[c]} strokeWidth={3} {...draw(t, at + 0.3)} />
						{doorW > 80 && (
							<g opacity={ap(t, at + 0.6)}>
								<circle cx={cx - 100 + doorW * 0.55} cy={340} r={34} fill="none" stroke={W} strokeWidth={3} />
								{Array.from({length: 12}, (_, k) => (
									<path key={k} d={`M${cx - 100 + doorW * 0.55 + 34 * Math.cos((k * Math.PI) / 6)} ${340 + 34 * Math.sin((k * Math.PI) / 6)} l${6 * Math.cos((k * Math.PI) / 6)} ${6 * Math.sin((k * Math.PI) / 6)}`} stroke={W} strokeWidth={2} />
								))}
							</g>
						)}
						<text x={cx} y={150} textAnchor="middle" fontFamily={BEBAS} fontSize={56} letterSpacing={4} fill={TINTA[c]} opacity={ap(t, at)}>{c.toUpperCase()}</text>
						<foreignObject x={cx - 160} y={530} width={320} height={150} opacity={ap(t, at + 0.8)}>
							<div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: HAND, fontSize: 40, lineHeight: 1.1, color: W, border: `2.5px solid ${W}`, borderRadius: 10, padding: 8, boxSizing: 'border-box', background: 'rgba(5,10,20,0.5)'}}>
								«{labels[i]}»
							</div>
						</foreignObject>
						{!isWin && <Tachar x={cx} y={340} s={70} t={t} at={solucion + 1.2 + i * 0.3} />}
						{i === verdad && t > solucion && <Rodeo cx={cx} cy={605} rx={175} ry={90} t={t} at={solucion + 2.4} />}
					</g>
				);
			})}
			<Nota x={540} y={770} text="Solo UNA dice la verdad" size={44} color={ROJO} o={ap(t, enunciado + 3)} />
		</g>
	);
};

// ---------- 3. Lentes ----------
export const Lentes: React.FC<PuzleProps> = ({datos, t, enunciado, solucion, acento}) => {
	const rel = datos.relaciones as string[];
	const vals = [6, 3, 1];
	const sizes = [150, 115, 85];
	return (
		<g>
			{['A', 'B', 'C'].map((n, i) => {
				const cx = 200 + i * 340;
				const at = enunciado + i * 0.5;
				const glow = 0.5 + 0.5 * Math.sin(t * 2 + i);
				return (
					<g key={n}>
						<path d={`M${cx} ${330 + sizes[i]} V560 M${cx - 60} 560 h120`} stroke={W} strokeWidth={3} fill="none" {...draw(t, at + 0.3)} />
						<path d={circ(sizes[i] + 14, cx, 330)} fill="none" stroke={W} strokeWidth={3} {...draw(t, at)} />
						<circle cx={cx} cy={330} r={sizes[i]} fill={acento} fillOpacity={0.08 + 0.08 * glow} stroke={acento} strokeWidth={2} opacity={ap(t, at + 0.4)} />
						<path d={`M${cx - sizes[i] * 0.6} ${330 - sizes[i] * 0.2} A${sizes[i]} ${sizes[i]} 0 0 1 ${cx - sizes[i] * 0.1} ${330 - sizes[i] * 0.65}`} fill="none" stroke={W} strokeWidth={3} opacity={0.6 * ap(t, at + 0.6)} />
						<text x={cx} y={355} textAnchor="middle" fontFamily={BEBAS} fontSize={80} fill={W} opacity={ap(t, at + 0.5)}>{n}</text>
						{t > solucion && <Nota x={cx} y={150} text={`× ${vals[i]}`} color={ROJO} o={ap(t, solucion + 1 + i * 0.5)} />}
					</g>
				);
			})}
			{rel.map((r, i) => (
				<Nota key={r} x={540} y={660 + i * 72} text={r} caja o={ap(t, enunciado + 1.5 + i * 0.5)} size={46} />
			))}
		</g>
	);
};

// ---------- 4. Balanza ----------
export const Balanza: React.FC<PuzleProps> = ({datos, t, enunciado, solucion, acento}) => {
	const nL = datos.izquierda.n as number;
	const nR = datos.derecha.n as number;
	const ang = Math.sin(t * 1.6) * 2.2 * Math.exp(-Math.max(0, t - enunciado) * 0.15);
	const piv = {x: 540, y: 200};
	const arm = 330;
	const rad = (ang * Math.PI) / 180;
	const L = {x: piv.x - arm * Math.cos(rad), y: piv.y - arm * Math.sin(rad)};
	const R = {x: piv.x + arm * Math.cos(rad), y: piv.y + arm * Math.sin(rad)};
	const pan = (p: {x: number; y: number}) => `M${p.x} ${p.y} L${p.x - 110} ${p.y + 220} M${p.x} ${p.y} L${p.x + 110} ${p.y + 220} M${p.x - 130} ${p.y + 220} Q${p.x} ${p.y + 290} ${p.x + 130} ${p.y + 220} Z`;
	const o = ap(t, enunciado);
	return (
		<g>
			<path d="M540 200 V640 M420 660 h240 M440 640 h200" stroke={W} strokeWidth={3} fill="none" {...draw(t, enunciado, 1)} />
			<path d={`M${L.x} ${L.y} L${R.x} ${R.y}`} stroke={W} strokeWidth={5} strokeLinecap="round" {...draw(t, enunciado + 0.4)} />
			<circle cx={piv.x} cy={piv.y} r={14} fill={acento} opacity={o} />
			<path d={pan(L)} stroke={W} strokeWidth={3} fill="rgba(5,10,20,0.35)" {...draw(t, enunciado + 0.7)} />
			<path d={pan(R)} stroke={W} strokeWidth={3} fill="rgba(5,10,20,0.35)" {...draw(t, enunciado + 0.9)} />
			{Array.from({length: nL}, (_, i) => (
				<g key={i} transform={`translate(${L.x - 40 + i * 80} ${L.y + 205})`} fill="none" stroke={acento} strokeWidth={6} strokeLinecap="round" opacity={ap(t, enunciado + 1.4 + i * 0.2)}>
					<circle cx={-22} cy={0} r={16} />
					<path d="M-6 0 H38 M24 0 V13 M34 0 V11" />
				</g>
			))}
			{Array.from({length: nR}, (_, i) => (
				<g key={i} opacity={ap(t, enunciado + 2 + i * 0.2)}>
					<ellipse cx={R.x - 70 + i * 70} cy={R.y + 206} rx={30} ry={12} fill="none" stroke={acento} strokeWidth={4} />
					<ellipse cx={R.x - 70 + i * 70} cy={R.y + 214} rx={30} ry={12} fill="none" stroke={acento} strokeWidth={2} opacity={0.6} />
				</g>
			))}
			<Nota x={L.x} y={L.y + 340} text={`${datos.izquierda.peso} g c/u`} o={ap(t, enunciado + 3)} />
			<Nota x={R.x} y={R.y + 340} text={t > solucion ? `${datos.respuesta} g c/u` : '? g'} color={t > solucion ? ROJO : W} o={t > solucion ? ap(t, solucion + 2.2) : ap(t, enunciado + 3.4)} />
			{t > solucion && <Nota x={L.x} y={110} text={`${nL} × ${datos.izquierda.peso} = ${nL * datos.izquierda.peso} g`} color={ROJO} o={ap(t, solucion + 0.9)} />}
			{t > solucion && <Nota x={R.x} y={110} text={`${nL * datos.izquierda.peso} ÷ ${nR} = ${datos.respuesta} g`} color={ROJO} o={ap(t, solucion + 1.6)} />}
		</g>
	);
};

// ---------- 5. Velas ----------
export const Velas: React.FC<PuzleProps> = ({datos, t, enunciado, solucion, acento}) => {
	const horas = datos.horas as number[];
	const apagadas = datos.apagadas as number[];
	const noche = datos.noche as number;
	const h = t > solucion ? interpolate(t - solucion - 0.6, [0, 7], [0, noche], clamp) : 0;
	const unit = 62;
	const base = 640;
	return (
		<g>
			<path d="M100 650 H980" stroke={W} strokeWidth={3} {...draw(t, enunciado, 0.8)} />
			{horas.map((hr, i) => {
				const cx = 210 + i * 220;
				const at = enunciado + 0.3 + i * 0.35;
				const off = apagadas.includes(i);
				const burned = off ? Math.min(h, 1) : Math.min(h, hr);
				const height = (hr - burned) * unit;
				const lit = h === 0 || (off ? h < 1 : h < hr);
				const flick = 1 + 0.12 * Math.sin(t * 13 + i * 2) + 0.06 * Math.sin(t * 29 + i);
				const survivor = t > solucion + 7.6 && height > 0;
				return (
					<g key={i}>
						<path d={`M${cx - 60} ${base + 10} h120`} stroke={W} strokeWidth={3} opacity={ap(t, at)} />
						{height > 0 && <rect x={cx - 34} y={base - height} width={68} height={height} rx={6} fill="rgba(5,10,20,0.35)" stroke={W} strokeWidth={3} {...draw(t, at, 0.7)} />}
						{height > 0 && <path d={`M${cx} ${base - height} v-18`} stroke={W} strokeWidth={3} opacity={ap(t, at + 0.4)} />}
						{lit && height > 0 && (
							<path d={`M${cx} ${base - height - 70 * flick} Q${cx + 20} ${base - height - 30} ${cx} ${base - height - 14} Q${cx - 20} ${base - height - 30} ${cx} ${base - height - 70 * flick}Z`} fill={acento} opacity={ap(t, at + 0.5)} style={{filter: `drop-shadow(0 0 18px ${acento})`}} />
						)}
						{!lit && off && height > 0 && <path d={`M${cx} ${base - height - 22} q12 -30 -4 -60 q-14 -24 6 -50`} fill="none" stroke={W} strokeWidth={3} opacity={Math.max(0, 1 - (h - 1) / 2) * 0.7} />}
						<Nota x={cx} y={base + 80} text={`${hr} h`} o={ap(t, at + 0.3)} />
						{off && <Nota x={cx} y={base + 135} text="viento" size={34} color={acento} o={ap(t, enunciado + 4.5)} />}
						{survivor && <Rodeo cx={cx} cy={base - height / 2} rx={70} ry={height / 2 + 30} t={t} at={solucion + 7.6} />}
					</g>
				);
			})}
			{t > solucion && <Nota x={540} y={110} text={`hora ${Math.floor(h)} de ${noche}`} color={ROJO} size={48} />}
		</g>
	);
};

// ---------- 6. Gemas ----------
export const Gemas: React.FC<PuzleProps> = ({datos, t, enunciado, solucion, acento}) => {
	const eq = datos.ecuaciones as string[];
	const gems = [
		{c: '#ff6b7a', n: 'ROJA'},
		{c: '#6fb6ff', n: 'AZUL'},
		{c: '#6fe39a', n: 'VERDE'},
	];
	return (
		<g>
			<rect x={90} y={100} width={900} height={330} rx={18} fill="rgba(5,10,20,0.35)" stroke={W} strokeWidth={3} {...draw(t, enunciado, 1)} />
			{gems.map((g, i) => {
				const cx = 250 + i * 290;
				const at = enunciado + 0.4 + i * 0.4;
				const tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 2);
				return (
					<g key={g.n}>
						<polygon points={`${cx},150 ${cx + 70},210 ${cx + 45},300 ${cx - 45},300 ${cx - 70},210`} fill={g.c} fillOpacity={0.12 + 0.1 * tw} stroke={g.c} strokeWidth={3} {...draw(t, at)} />
						<path d={`M${cx - 70} 210 H${cx + 70} M${cx} 150 L${cx - 30} 210 L${cx} 300 L${cx + 30} 210 Z`} fill="none" stroke={g.c} strokeWidth={1.5} opacity={0.7 * ap(t, at + 0.4)} />
						<text x={cx} y={370} textAnchor="middle" fontFamily={BEBAS} fontSize={44} letterSpacing={3} fill={g.c} opacity={ap(t, at)}>{g.n}</text>
						{t > solucion && <Nota x={cx} y={130} text={`${i === 2 ? 3 : 5}`} color={ROJO} o={ap(t, solucion + 1 + (2 - i) * 0.6)} />}
					</g>
				);
			})}
			{eq.map((e, i) => (
				<Nota key={e} x={540} y={540 + i * 90} text={e} caja size={54} color={i === 2 ? acento : W} o={ap(t, enunciado + 1.4 + i * 0.6)} />
			))}
		</g>
	);
};

// ---------- 7. Espejos ----------
const Simbolo: React.FC<{d: number | string; x: number; y: number; split: number; color: string; o: number}> = ({d, x, y, split, color, o}) => (
	<g opacity={o}>
		<g transform={`translate(${x - 3 - split} 0) scale(-1 1)`}>
			<text x={0} y={y} fontFamily={BEBAS} fontSize={190} fill="none" stroke={color} strokeWidth={3}>{d}</text>
		</g>
		{split > 4 && <line x1={x} y1={y - 170} x2={x} y2={y + 20} stroke={ROJO} strokeWidth={3} strokeDasharray="8 8" />}
		<text x={x + 3 + split} y={y} fontFamily={BEBAS} fontSize={190} fill="none" stroke={split > 4 ? ROJO : color} strokeWidth={3}>{d}</text>
	</g>
);
export const Espejos: React.FC<PuzleProps> = ({datos, t, enunciado, solucion, acento}) => {
	const digs = datos.digitos as number[];
	const split = t > solucion ? interpolate(t - solucion, [0.4, 1.6], [0, 10], {...clamp, easing: ease}) : 0;
	return (
		<g>
			<rect x={60} y={150} width={960} height={460} rx={14} fill="rgba(5,10,20,0.35)" stroke={W} strokeWidth={3} {...draw(t, enunciado, 1)} />
			{Array.from({length: 9}, (_, k) => (
				<path key={k} d={`M${70 + k * 110} 600 l40 -40`} stroke={W} strokeWidth={1.5} opacity={0.3 * ap(t, enunciado + 0.6)} />
			))}
			{digs.map((d, i) => (
				<Simbolo key={d} d={d} x={190 + i * 230} y={470} split={split} color={W} o={ap(t, enunciado + 0.4 + i * 0.5)} />
			))}
			{t <= solucion + 2.6 ? (
				<Nota x={880} y={470} text="?" size={190} color={acento} o={ap(t, enunciado + 2) * (t > solucion + 2.2 ? 0 : 1)} />
			) : (
				<Simbolo d={datos.respuesta} x={880} y={470} split={split} color={ROJO} o={ap(t, solucion + 2.6)} />
			)}
			{t > solucion && <Nota x={540} y={720} text="número + su reflejo" color={ROJO} o={ap(t, solucion + 1.2)} size={50} />}
		</g>
	);
};

// ---------- 8. Cerillas (mover una sola cerilla para arreglar la igualdad) ----------
type P2 = [number, number];
const SEGS: Record<number, string> = {0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg'};
const CW = 118, CH = 236, CY = 190; // caja de cada dígito
const CX = [80, 300, 450, 680, 870]; // dígito · operador · dígito · igual · dígito
const segmento = (celda: number, s: string): [P2, P2] => {
	const x = CX[celda], y = CY, w = CW, h = CH, m = y + h / 2;
	if (celda === 1 || celda === 3) {
		const cx = x + 60;
		if (s === 'h') return [[cx - 58, m], [cx + 58, m]];
		if (s === 'v') return [[cx, m - 58], [cx, m + 58]];
		if (s === 'i1') return [[cx - 58, m - 26], [cx + 58, m - 26]];
		return [[cx - 58, m + 26], [cx + 58, m + 26]];
	}
	const T: Record<string, [P2, P2]> = {
		a: [[x, y], [x + w, y]], b: [[x + w, y], [x + w, m]], c: [[x + w, m], [x + w, y + h]], d: [[x, y + h], [x + w, y + h]],
		e: [[x, m], [x, y + h]], f: [[x, y], [x, m]], g: [[x, m], [x + w, m]],
	};
	return T[s];
};
const Cerilla: React.FC<{p: [P2, P2]; color: string; cabeza: string; o: number}> = ({p, color, cabeza, o}) => {
	const [[x1, y1], [x2, y2]] = p;
	const k = 0.1; // las cerillas no llegan a tocarse en las esquinas
	const a: P2 = [x1 + (x2 - x1) * k, y1 + (y2 - y1) * k];
	const b: P2 = [x2 - (x2 - x1) * k, y2 - (y2 - y1) * k];
	return (
		<g opacity={o}>
			<line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={13} strokeLinecap="round" />
			<circle cx={b[0]} cy={b[1]} r={11} fill={cabeza} />
		</g>
	);
};
export const Cerillas: React.FC<PuzleProps> = ({datos, t, enunciado, solucion, acento}) => {
	const [d1, op, d2, d3] = datos.inicial as [number, string, number, number];
	const de = datos.mueve.de as [number, string];
	const a = datos.mueve.a as [number, string];
	const lista: {celda: number; s: string}[] = [];
	SEGS[d1].split('').forEach((s) => lista.push({celda: 0, s}));
	lista.push({celda: 1, s: 'h'});
	if (op === '+') lista.push({celda: 1, s: 'v'});
	SEGS[d2].split('').forEach((s) => lista.push({celda: 2, s}));
	lista.push({celda: 3, s: 'i1'}, {celda: 3, s: 'i2'});
	SEGS[d3].split('').forEach((s) => lista.push({celda: 4, s}));
	const mov = interpolate(t, [solucion + 0.8, solucion + 2.4], [0, 1], {...clamp, easing: ease});
	const pA = segmento(de[0], de[1]);
	const pB = segmento(a[0], a[1]);
	const mezcla = (u: P2, v: P2): P2 => [u[0] + (v[0] - u[0]) * mov, u[1] + (v[1] - u[1]) * mov - Math.sin(mov * Math.PI) * 120];
	const madera = '#e9d6a6';
	return (
		<g>
			<rect x={40} y={130} width={1000} height={360} rx={14} fill="rgba(5,10,20,0.35)" stroke={W} strokeWidth={3} {...draw(t, enunciado, 1)} />
			{lista.map((c, i) => {
				const esLaQueSeMueve = c.celda === de[0] && c.s === de[1];
				if (esLaQueSeMueve && t > solucion + 0.8) return null;
				return <Cerilla key={i} p={segmento(c.celda, c.s)} color={madera} cabeza={acento} o={ap(t, enunciado + 0.3 + i * 0.08)} />;
			})}
			{t > solucion + 0.8 && <Cerilla p={[mezcla(pA[0], pB[0]), mezcla(pA[1], pB[1])]} color={ROJO} cabeza={ROJO} o={1} />}
			{t <= solucion && <Nota x={540} y={600} text="Mueve UNA sola cerilla" size={48} color={acento} o={ap(t, enunciado + 2.4)} />}
			{t > solucion && <Nota x={540} y={600} text={String(datos.respuesta)} size={64} color={ROJO} o={ap(t, solucion + 2.6)} caja />}
		</g>
	);
};

export const PUZLES: Record<string, React.FC<PuzleProps>> = {
	engranajes: Engranajes,
	cajas: Cajas,
	lentes: Lentes,
	balanza: Balanza,
	velas: Velas,
	gemas: Gemas,
	espejos: Espejos,
	cerillas: Cerillas,
};
