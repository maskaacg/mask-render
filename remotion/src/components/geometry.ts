// Geometría de la sala en perspectiva de un punto de fuga (vertical 1080x1920).
// Toda la escena se dibuja a partir de estas constantes, así que suelo, paredes,
// estanterías, puerta y luz comparten el mismo espacio.
export const W = 1080;
export const H = 1920;
export const VP = { x: 540, y: 860 }; // punto de fuga (altura de los ojos)

// Pared del fondo
export const BACK = { x0: 250, x1: 830, y0: 470, y1: 1180 };

// Puerta en la pared del fondo (bisagra a la izquierda)
export const DOOR = { x: 390, y: 620, w: 300, h: 560 };
export const LOCK = { cx: 540, cy: 900, r: 96 };

/**
 * Punto sobre una pared lateral.
 * t >= 1: profundidad (1 = arista de la pared del fondo; mayor = más cerca de cámara)
 * h in [0,1]: 0 = línea del techo, 1 = línea del suelo
 * side: -1 izquierda, +1 derecha
 */
export const wallPoint = (t: number, h: number, side: -1 | 1) => {
	const halfW = (BACK.x1 - BACK.x0) / 2; // 290
	const up = VP.y - BACK.y0; // 390
	const down = BACK.y1 - VP.y; // 320
	return {
		x: VP.x + side * halfW * t,
		y: VP.y + t * (-up + h * (up + down)),
	};
};

export const pts = (p: {x: number; y: number}[]) =>
	p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
