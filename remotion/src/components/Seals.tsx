import React from 'react';
import {W, pts} from './geometry';

const INK = '#1a120a';

// Iconos propios dibujados en SVG (sin recursos de terceros), centrados en 0,0.
const Icon: React.FC<{name: string}> = ({name}) => {
	switch (name) {
		case 'luna':
			return <path d="M10 -30 A32 32 0 1 0 10 30 A24 24 0 1 1 10 -30 Z" fill={INK} />;
		case 'ojo':
			return (
				<g>
					<path d="M-34 0 Q0 -30 34 0 Q0 30 -34 0 Z" fill="none" stroke={INK} strokeWidth={6} />
					<circle r={10} fill={INK} />
				</g>
			);
		case 'llave':
			return (
				<g fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round">
					<circle cx={-14} cy={-12} r={13} />
					<path d="M-4 -2 L24 26 M12 14 L20 6 M18 20 L26 12" />
				</g>
			);
		case 'estrella':
			return <path d="M0 -32 L9 -10 L32 -10 L14 4 L21 28 L0 14 L-21 28 L-14 4 L-32 -10 L-9 -10 Z" fill={INK} />;
		default:
			return <path d="M0 -32 C14 -10 22 2 22 12 A22 22 0 0 1 -22 12 C-22 2 -14 -10 0 -32 Z" fill={INK} />;
	}
};

const SEALS = [
	{name: 'luna', label: 'LUNA'},
	{name: 'ojo', label: 'OJO'},
	{name: 'llave', label: 'LLAVE'},
	{name: 'estrella', label: 'ESTRELLA'},
	{name: 'gota', label: 'GOTA'},
];

/**
 * Mesa en primer término con los cinco sellos.
 * enter: 0..1 entrada de la mesa; glint: brillo que recorre los sellos (0..1).
 */
export const SealsTable: React.FC<{enter: number; glint: number}> = ({enter, glint}) => {
	const top = [
		{x: 40, y: 1380},
		{x: 1040, y: 1380},
		{x: 1160, y: 1700},
		{x: -80, y: 1700},
	];
	return (
		<svg
			width={W}
			height={1920}
			style={{position: 'absolute', inset: 0, transform: `translateY(${(1 - enter) * 640}px)`}}
		>
			<defs>
				<linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#4b3220" />
					<stop offset="1" stopColor="#2b1c11" />
				</linearGradient>
				<radialGradient id="seal" cx="0.4" cy="0.35" r="0.7">
					<stop offset="0" stopColor="#f2d38a" />
					<stop offset="1" stopColor="#9a7234" />
				</radialGradient>
			</defs>
			<polygon points={pts(top)} fill="url(#wood)" />
			<rect x={-80} y={1700} width={W + 160} height={220} fill="#170f09" />
			{SEALS.map((s, i) => {
				const cx = 150 + i * 195;
				const cy = 1515;
				const shine = Math.max(0, 1 - Math.abs(glint * 6 - i - 0.5));
				return (
					<g key={s.name}>
						<ellipse cx={cx + 8} cy={cy + 74} rx={78} ry={18} fill="#000" opacity={0.45} />
						<circle cx={cx} cy={cy} r={78} fill="url(#seal)" stroke="#5a3f1c" strokeWidth={5} />
						<circle cx={cx} cy={cy} r={62} fill="none" stroke="#6b4c22" strokeWidth={3} />
						<g transform={`translate(${cx} ${cy})`}>
							<Icon name={s.name} />
						</g>
						<circle cx={cx - 26} cy={cy - 30} r={20} fill="#fff6dc" opacity={0.15 + 0.55 * shine} />
						<text
							x={cx}
							y={cy + 128}
							textAnchor="middle"
							fontFamily="DejaVu Sans, Arial, sans-serif"
							fontWeight={700}
							fontSize={30}
							letterSpacing={2}
							fill="#e9d6ad"
						>
							{s.label}
						</text>
					</g>
				);
			})}
		</svg>
	);
};
