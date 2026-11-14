import React from 'react';
import {random} from 'remotion';
import {BACK, DOOR, H, VP, W, pts, wallPoint} from './geometry';

const SHELF_ROWS = [0.2, 0.37, 0.54, 0.71, 0.88];
const UPRIGHTS = [1.05, 1.32, 1.62, 1.95, 2.3, 2.75, 3.25];
const BOX_COLORS = ['#3b2a1c', '#4a3422', '#2f2418', '#5a4129', '#3f3a2a', '#26323a'];

/** Estantería del archivo en una pared lateral, dibujada en perspectiva. */
const Shelves: React.FC<{side: -1 | 1}> = ({side}) => {
	const boxes: React.ReactNode[] = [];
	SHELF_ROWS.forEach((h, row) => {
		let t = 1.02;
		let i = 0;
		while (t < 3.3) {
			const seed = `${side}-${row}-${i}`;
			const depth = 0.05 + random(seed) * 0.09;
			const height = 0.09 + random(seed + 'h') * 0.05;
			const quad = [
				wallPoint(t, h - height, side),
				wallPoint(t + depth, h - height, side),
				wallPoint(t + depth, h, side),
				wallPoint(t, h, side),
			];
			boxes.push(
				<polygon
					key={seed}
					points={pts(quad)}
					fill={BOX_COLORS[Math.floor(random(seed + 'c') * BOX_COLORS.length)]}
					stroke="#120c08"
					strokeWidth={1.5}
				/>,
			);
			t += depth + 0.012;
			i++;
		}
	});
	return (
		<g>
			{SHELF_ROWS.map((h) => {
				const a = wallPoint(1, h, side);
				const b = wallPoint(3.4, h, side);
				return <line key={h} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#6b5233" strokeWidth={5} />;
			})}
			{boxes}
			{UPRIGHTS.map((t) => {
				const a = wallPoint(t, 0.04, side);
				const b = wallPoint(t, 0.98, side);
				return <line key={t} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#24180f" strokeWidth={8 * t} />;
			})}
		</g>
	);
};

/** Sala completa: techo, suelo con baldosas en perspectiva, paredes y estanterías. */
export const Room: React.FC<{lamp: number}> = ({lamp}) => {
	const floor = [
		{x: BACK.x0, y: BACK.y1},
		{x: BACK.x1, y: BACK.y1},
		wallPoint(3.4, 1, 1),
		wallPoint(3.4, 1, -1),
	];
	const ceiling = [
		{x: BACK.x0, y: BACK.y0},
		{x: BACK.x1, y: BACK.y0},
		wallPoint(3.4, 0, 1),
		wallPoint(3.4, 0, -1),
	];
	// líneas de baldosa que fugan al punto de fuga
	const tiles = [-3, -2, -1, 0, 1, 2, 3].map((k) => {
		const x = VP.x + k * 82;
		const far = {x, y: BACK.y1};
		const t = 3.4;
		const near = {x: VP.x + (x - VP.x) * t, y: VP.y + (BACK.y1 - VP.y) * t};
		return <line key={k} x1={far.x} y1={far.y} x2={near.x} y2={near.y} stroke="#0d1416" strokeWidth={2} />;
	});
	const rows = [1.12, 1.3, 1.55, 1.9, 2.4, 3.1].map((t) => {
		const a = wallPoint(t, 1, -1);
		const b = wallPoint(t, 1, 1);
		return <line key={t} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#0d1416" strokeWidth={2} />;
	});

	return (
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
			<defs>
				<linearGradient id="sideWall" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#13221f" />
					<stop offset="1" stopColor="#0a1312" />
				</linearGradient>
				<linearGradient id="backWall" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#1d3430" />
					<stop offset="1" stopColor="#142624" />
				</linearGradient>
				<linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#1a2423" />
					<stop offset="1" stopColor="#0b1010" />
				</linearGradient>
				<radialGradient id="lampGlow" cx="0.5" cy="0.5" r="0.5">
					<stop offset="0" stopColor="#ffd9a0" stopOpacity={0.55 * lamp} />
					<stop offset="1" stopColor="#ffd9a0" stopOpacity={0} />
				</radialGradient>
			</defs>
			<rect width={W} height={H} fill="url(#sideWall)" />
			<polygon points={pts(ceiling)} fill="#0c1615" />
			<polygon points={pts(floor)} fill="url(#floorGrad)" />
			{tiles}
			{rows}
			<Shelves side={-1} />
			<Shelves side={1} />
			<rect x={BACK.x0} y={BACK.y0} width={BACK.x1 - BACK.x0} height={BACK.y1 - BACK.y0} fill="url(#backWall)" />
			{/* zócalo de la pared del fondo */}
			<rect x={BACK.x0} y={BACK.y1 - 26} width={BACK.x1 - BACK.x0} height={26} fill="#0f1b1a" />
			{/* marco de latón de la puerta */}
			<rect x={DOOR.x - 22} y={DOOR.y - 22} width={DOOR.w + 44} height={DOOR.h + 22} rx={6} fill="#8a6a35" />
			<rect x={DOOR.x - 10} y={DOOR.y - 10} width={DOOR.w + 20} height={DOOR.h + 10} fill="#3a2c18" />
			{/* lámpara de techo */}
			<line x1={540} y1={0} x2={540} y2={210} stroke="#2a2a26" strokeWidth={4} />
			<path d="M495 210 L585 210 L565 250 L515 250 Z" fill="#6b5a3a" />
			<circle cx={540} cy={258} r={420} fill="url(#lampGlow)" />
			<ellipse cx={540} cy={256} rx={22} ry={10} fill="#fff1d2" opacity={0.6 + 0.4 * lamp} />
		</svg>
	);
};
