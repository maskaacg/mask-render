import React from 'react';

// Escenarios de ENIGMA 60 en estilo «plano de inventor»: dibujo de líneas que se traza
// solo (draw-on) y que la linterna va descubriendo. Zona útil: pared del fondo y 820 px
// superiores; los laterales bajan hasta el borde. La mesa del puzle empieza en y = 840.

export const LINEA = '#dfeaff';

export type EscenaId = 'taller' | 'camara' | 'observatorio' | 'sotano' | 'capilla' | 'archivo' | 'espejos';

export const TEMAS: Record<EscenaId, {acento: string; nombre: string}> = {
	taller: {acento: '#ffb347', nombre: 'Taller'},
	camara: {acento: '#7fd4ff', nombre: 'Cámara acorazada'},
	observatorio: {acento: '#b69cff', nombre: 'Observatorio'},
	sotano: {acento: '#9be38a', nombre: 'Sótano'},
	capilla: {acento: '#ffd36b', nombre: 'Capilla'},
	archivo: {acento: '#ff8fb1', nombre: 'Archivo'},
	espejos: {acento: '#8ff0d4', nombre: 'Sala de espejos'},
};

export const ESCENA_POR_PUZLE: Record<string, EscenaId> = {
	engranajes: 'taller',
	cajas: 'camara',
	lentes: 'observatorio',
	balanza: 'sotano',
	velas: 'capilla',
	gemas: 'archivo',
	espejos: 'espejos',
};

// Trazo progresivo: cada elemento i de n se dibuja en su propio tramo de p ∈ [0,1].
type Draw = (i: number) => {pathLength: number; strokeDasharray: number; strokeDashoffset: number};
const mkDraw = (p: number, n: number): Draw => (i) => {
	const s = (i / n) * 0.6;
	const q = Math.min(1, Math.max(0, (p - s) / 0.4));
	return {pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - q};
};

const circ = (cx: number, cy: number, r: number) => `M${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy}`;
const reloj = (cx: number, cy: number, r: number, a: number) => {
	const ticks = Array.from({length: 12}, (_, k) => {
		const t = (k * Math.PI) / 6;
		return `M${cx + (r - 10) * Math.cos(t)},${cy + (r - 10) * Math.sin(t)} L${cx + (r - 2) * Math.cos(t)},${cy + (r - 2) * Math.sin(t)}`;
	}).join(' ');
	return [circ(cx, cy, r), ticks, `M${cx},${cy} L${cx + r * 0.5 * Math.cos(a)},${cy + r * 0.5 * Math.sin(a)} M${cx},${cy} L${cx + r * 0.75 * Math.cos(a * 2.3 + 1)},${cy + r * 0.75 * Math.sin(a * 2.3 + 1)}`];
};
const ladrillos = (x: number, y: number, w: number, h: number, bw = 70, bh = 34) => {
	const out: string[] = [];
	for (let r = 0; r * bh < h; r++) {
		out.push(`M${x},${y + r * bh} H${x + w}`);
		for (let c = (r % 2) * (bw / 2); c < w; c += bw) out.push(`M${x + c},${y + r * bh} V${y + Math.min(h, (r + 1) * bh)}`);
	}
	return out.join(' ');
};
const gotica = (cx: number, base: number, w: number, h: number) =>
	`M${cx - w / 2},${base} V${base - h} Q${cx - w / 2},${base - h - w * 0.75} ${cx},${base - h - w} Q${cx + w / 2},${base - h - w * 0.75} ${cx + w / 2},${base - h} V${base}`;

// Cada escena devuelve una lista de trazados (d). Así se dibujan de forma uniforme.
const ESCENAS: Record<EscenaId, () => string[]> = {
	taller: () => [
		'M0 820 H1080',
		'M380 520 H700 V770 H380 Z',
		Array.from({length: 7 * 5}, (_, k) => circ(410 + (k % 7) * 43, 545 + Math.floor(k / 7) * 48, 3)).join(' '),
		'M420 560 l40 0 l10 10 l-10 10 l-40 0 M470 570 h60 M560 545 v120 M545 545 h30 M600 560 h70 l-6 30 h-58 z M630 590 v120',
		...reloj(170, 610, 78, 1.1),
		...reloj(910, 610, 78, 2.4),
		'M0 860 L120 820 M1080 860 L960 820',
		'M860 820 v-60 h110 v60 M880 760 v-26 h70 v26 M915 734 v-30',
		'M40 900 V1900 M1040 900 V1900',
	],
	camara: () => [
		'M0 820 H1080',
		circ(540, 640, 165),
		circ(540, 640, 132),
		Array.from({length: 6}, (_, k) => {
			const a = (k * Math.PI) / 3;
			return `M540,640 L${540 + 112 * Math.cos(a)},${640 + 112 * Math.sin(a)}`;
		}).join(' ') + ' ' + circ(540, 640, 22),
		Array.from({length: 16}, (_, k) => circ(540 + 150 * Math.cos((k * Math.PI) / 8), 640 + 150 * Math.sin((k * Math.PI) / 8), 4)).join(' '),
		...[0, 1].map((side) => {
			const x0 = side ? 760 : 40;
			const out: string[] = [];
			for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
				const x = x0 + c * 70, y = 500 + r * 62;
				out.push(`M${x},${y} h62 v54 h-62 z M${x + 31},${y + 22} v10`);
			}
			return out.join(' ');
		}),
		'M30 900 V1900 M1050 900 V1900 M30 1000 H70 M1010 1000 H1050',
	],
	observatorio: () => [
		'M40 820 Q540 300 1040 820',
		'M150 820 Q540 380 930 820',
		'M490 470 V820 M590 470 V820',
		Array.from({length: 22}, (_, k) => {
			const x = 498 + ((k * 37) % 86), y = 480 + ((k * 71) % 300);
			return `M${x - 5},${y} h10 M${x},${y - 5} v10`;
		}).join(' '),
		circ(200, 680, 95) + ' ' + circ(200, 680, 60),
		'M150 640 L190 700 L240 660 L260 720 M170 735 L230 735',
		'M700 790 L880 560 M720 805 L900 575 M690 800 L740 820 M800 680 L770 820 M800 680 L860 820',
		circ(950, 520, 26),
	],
	sotano: () => [
		'M0 820 H1080',
		'M60 820 V640 A170 170 0 0 1 400 640 V820',
		'M680 820 V640 A170 170 0 0 1 1020 640 V820',
		ladrillos(420, 500, 240, 320),
		'M0 520 H1080 M0 540 H1080',
		circ(820, 530, 26) + ' M794 530 h52 M820 504 v52',
		'M540 480 V560 M520 560 h40 l-6 30 h-28 z',
		circ(540, 610, 26),
		'M100 820 l60 -50 h60 l60 -50 h60 l60 -50',
		'M780 820 v-110 a60 18 0 0 1 120 0 v110 M780 740 h120 M780 790 h120',
	],
	capilla: () => [
		'M0 820 H1080',
		gotica(200, 800, 150, 160),
		gotica(880, 800, 150, 160),
		'M200 800 V560 M880 800 V560 M125 680 H275 M805 680 H955',
		circ(540, 610, 120) + ' ' + circ(540, 610, 40),
		Array.from({length: 8}, (_, k) => {
			const a = (k * Math.PI) / 4;
			return `M${540 + 40 * Math.cos(a)},${610 + 40 * Math.sin(a)} L${540 + 120 * Math.cos(a)},${610 + 120 * Math.sin(a)}`;
		}).join(' '),
		'M30 900 V1900 M80 900 V1900 M1000 900 V1900 M1050 900 V1900 M20 900 H90 M990 900 H1060',
		'M540 760 V820 M480 790 Q540 840 600 790',
	],
	archivo: () => [
		'M0 820 H1080',
		...[0, 1].map((side) => {
			const x0 = side ? 790 : 40;
			const out: string[] = [`M${x0},480 h250 v340 h-250 z`];
			for (let r = 0; r < 4; r++) {
				const y = 480 + (r + 1) * 85;
				out.push(`M${x0},${y} h250`);
				let x = x0 + 8;
				let k = r * 3 + side;
				while (x < x0 + 236) {
					const w = 12 + ((k * 7) % 14);
					const h = 50 + ((k * 13) % 28);
					out.push(`M${x},${y} v${-h} h${w} v${h}`);
					x += w + 3;
					k++;
				}
			}
			return out.join(' ');
		}),
		'M330 820 L420 500 M380 820 L470 500 M345 770 h50 M362 710 h50 M380 650 h50 M398 590 h50',
		'M470 600 h260 v220 h-260 z' + Array.from({length: 6}, (_, k) => ` M${470 + (k % 3) * 87},${600 + Math.floor(k / 3) * 110 + 110} h87 M${513 + (k % 3) * 87},${650 + Math.floor(k / 3) * 110} h12`).join(''),
		'M470 600 l40 -60 h180 l40 60',
		'M30 900 V1900 M1050 900 V1900',
	],
	espejos: () => [
		'M0 820 H1080',
		'M540 470 a120 160 0 1 0 0.1 0 M540 490 a100 140 0 1 0 0.1 0',
		'M120 520 h170 v260 h-170 z M135 535 h140 v230 h-140 z',
		'M790 520 h170 v260 h-170 z M805 535 h140 v230 h-140 z',
		'M150 560 l40 40 M820 560 l40 40 M500 520 l40 40',
		'M40 900 V1900 M70 900 V1900 M1010 900 V1900 M1040 900 V1900',
		'M540 470 V490',
	],
};

export const Escena: React.FC<{id: EscenaId; p: number; o?: number}> = ({id, p, o = 0.6}) => {
	const paths = ESCENAS[id]();
	const d = mkDraw(p, paths.length);
	return (
		<g fill="none" stroke={LINEA} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={o}>
			{paths.map((path, i) => (
				<path key={i} d={path} {...d(i)} />
			))}
		</g>
	);
};
