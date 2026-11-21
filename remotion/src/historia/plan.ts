// Línea de tiempo de un corto-historia ENIGMA 60 (70–120 s) a partir de la duración real de cada voz.
export type LineaH = {id: string; fase: 'gancho' | 'escena' | 'pista' | 'pregunta' | 'solucion' | 'giro' | 'cta'; texto: string};
export type FichaH = {
	id: string;
	titulo: string;
	sala: number;
	pensar_s: number;
	fps: number;
	ancho: number;
	alto: number;
	aviso_ia: string;
	puzle: {tipo: string; dientes: number[]; vueltas: number; respuesta: number};
	lineas: LineaH[];
	pistas: {id: string; texto: string; color: string}[];
};
export type PropsH = {ficha: FichaH; duraciones: Record<string, number>};
export type TramoH = LineaH & {inicio: number; fin: number};
export type PlanH = {lineas: TramoH[]; t: Record<string, {inicio: number; fin: number}>; pensar: {inicio: number; fin: number}; total: number};

export const planificarH = ({ficha, duraciones}: PropsH): PlanH => {
	let t = 0.6;
	const lineas: TramoH[] = [];
	const map: PlanH['t'] = {};
	let pensar = {inicio: 0, fin: 0};
	let prev = '';
	for (const l of ficha.lineas) {
		if (prev && prev !== l.fase) t += 0.6;
		else if (prev) t += 0.35;
		if (l.fase === 'solucion' && prev === 'pregunta') {
			pensar = {inicio: t, fin: t + ficha.pensar_s};
			t += ficha.pensar_s + 0.4;
		}
		if (l.fase === 'giro') t += 2.2; // la solución respira (engranajes girando) antes del giro
		const d = duraciones[l.id] ?? 2.5;
		lineas.push({...l, inicio: t, fin: t + d});
		map[l.id] = {inicio: t, fin: t + d};
		t += d;
		prev = l.fase;
	}
	t += 2.0;
	return {lineas, t: map, pensar, total: t};
};
