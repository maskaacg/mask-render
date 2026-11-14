import React from 'react';
import {random} from 'remotion';
import {DOOR, H, W} from './geometry';

/** Motas de polvo en suspensión (siempre) y polvo que cae del marco tras el portazo. */
export const Dust: React.FC<{time: number; slamAt: number}> = ({time, slamAt}) => {
	const motes = Array.from({length: 46}, (_, i) => {
		const x0 = random(`mx${i}`) * W;
		const y0 = random(`my${i}`) * H;
		const sp = 6 + random(`ms${i}`) * 14;
		const x = (x0 + Math.sin(time * 0.6 + i) * 18 + W) % W;
		const y = (y0 - time * sp + H * 4) % H;
		const r = 1.5 + random(`mr${i}`) * 2.5;
		return <circle key={`m${i}`} cx={x} cy={y} r={r} fill="#ffe9c0" opacity={0.18 + 0.2 * random(`mo${i}`)} />;
	});
	const since = time - slamAt;
	const falling =
		since > 0 && since < 3.2
			? Array.from({length: 70}, (_, i) => {
					const x = DOOR.x - 20 + random(`fx${i}`) * (DOOR.w + 40);
					const delay = random(`fd${i}`) * 0.5;
					const s = Math.max(0, since - delay);
					const y = DOOR.y - 24 + 0.5 * 900 * s * s * (0.4 + random(`fg${i}`) * 0.6);
					const op = Math.max(0, 0.75 - s / 3) * (s > 0 ? 1 : 0);
					return <circle key={`f${i}`} cx={x + Math.sin(s * 3 + i) * 6} cy={y} r={1.6 + random(`fr${i}`) * 2.2} fill="#d9c7a3" opacity={op} />;
				})
			: null;
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
			{motes}
			{falling}
		</svg>
	);
};

export const Vignette: React.FC<{strength: number}> = ({strength}) => (
	<div
		style={{
			position: 'absolute',
			inset: 0,
			background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
		}}
	/>
);
