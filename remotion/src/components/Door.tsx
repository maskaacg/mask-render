import React from 'react';
import {BACK, DOOR, H, LOCK, VP, W, pts} from './geometry';

const Slot: React.FC<{x: number; on: number}> = ({x, on}) => (
	<g>
		<rect x={x - 17} y={-40} width={34} height={80} rx={9} fill="#0b0805" stroke="#c9a25a" strokeWidth={3} />
		<rect
			x={x - 11}
			y={-34}
			width={22}
			height={68}
			rx={6}
			fill="#ffcf6a"
			opacity={on}
			style={{filter: `drop-shadow(0 0 ${18 * on}px #ffb54a)`}}
		/>
	</g>
);

/**
 * Puerta con bisagra real: el panel gira en 3D sobre su borde izquierdo.
 * angle: grados de apertura (0 = cerrada; positivo = se abre hacia el pasillo).
 * slots: encendido de las tres ranuras (0..1 cada una).
 */
export const Door: React.FC<{angle: number; slots: [number, number, number]}> = ({angle, slots}) => {
	const open = Math.max(0, angle);
	const rad = (open * Math.PI) / 180;
	// borde libre proyectado (aprox.) y hueco iluminado entre ese borde y el marco derecho
	const freeEdge = DOOR.x + DOOR.w * Math.cos(rad);
	const gap = Math.max(0, DOOR.x + DOOR.w - freeEdge);
	const light = Math.min(1, gap / 90);
	// cuña de luz sobre el suelo: rayos desde una fuente al fondo del pasillo
	const src = {x: 610, y: 760};
	const project = (x: number) => {
		const k = (H - BACK.y1) / (BACK.y1 - src.y);
		return {x: x + (x - src.x) * k, y: H};
	};
	const wedge = [
		{x: freeEdge, y: BACK.y1},
		{x: DOOR.x + DOOR.w, y: BACK.y1},
		project(DOOR.x + DOOR.w),
		project(freeEdge),
	];

	return (
		<>
			{/* pasillo iluminado detrás de la puerta */}
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<defs>
					<linearGradient id="corridor" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#f6d49a" />
						<stop offset="1" stopColor="#b8864a" />
					</linearGradient>
					<linearGradient id="wedge" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#ffd890" stopOpacity={0.5 * light} />
						<stop offset="1" stopColor="#ffd890" stopOpacity={0} />
					</linearGradient>
				</defs>
				<rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={DOOR.h} fill="url(#corridor)" />
				<polygon points={pts(wedge)} fill="url(#wedge)" />
			</svg>
			{/* panel de la puerta en 3D */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: W,
					height: H,
					perspective: 1600,
					perspectiveOrigin: `${VP.x}px ${VP.y}px`,
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: DOOR.x,
						top: DOOR.y,
						width: DOOR.w,
						height: DOOR.h,
						transformOrigin: 'left center',
						transform: `rotateY(${open}deg)`,
						background: 'linear-gradient(90deg,#2b1d12 0%,#3e2a19 45%,#2f2014 100%)',
						boxShadow: `inset 0 0 0 6px #1a110a, ${-8 - open}px 0 30px rgba(0,0,0,0.55)`,
						// el panel se oscurece al girar hacia la luz del pasillo
						filter: `brightness(${1 - open / 120})`,
					}}
				>
					<svg width={DOOR.w} height={DOOR.h}>
						<rect x={28} y={30} width={DOOR.w - 56} height={170} rx={6} fill="none" stroke="#1d130b" strokeWidth={6} />
						<rect x={28} y={DOOR.h - 220} width={DOOR.w - 56} height={190} rx={6} fill="none" stroke="#1d130b" strokeWidth={6} />
						{/* bisagras */}
						<rect x={-2} y={70} width={14} height={60} fill="#8a6a35" />
						<rect x={-2} y={DOOR.h - 130} width={14} height={60} fill="#8a6a35" />
						{/* cerradura de tres ranuras */}
						<g transform={`translate(${LOCK.cx - DOOR.x} ${LOCK.cy - DOOR.y})`}>
							<circle r={LOCK.r} fill="#7a5a2b" stroke="#d2ad66" strokeWidth={6} />
							<circle r={LOCK.r - 16} fill="none" stroke="#4a3518" strokeWidth={3} />
							<Slot x={-48} on={slots[0]} />
							<Slot x={0} on={slots[1]} />
							<Slot x={48} on={slots[2]} />
						</g>
					</svg>
				</div>
			</div>
		</>
	);
};
