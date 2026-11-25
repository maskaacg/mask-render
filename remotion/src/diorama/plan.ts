// Línea de tiempo del corto «Diorama E60» a partir de la duración real de cada voz.
export type Fase = 'gancho' | 'escena' | 'pista' | 'pregunta' | 'solucion' | 'giro' | 'cta';
export type LineaD = {id: string; fase: Fase; texto: string};
export type FichaD = {
	id: string;
	titulo: string;
	aventura: string;
	sala: number;
	pensar_s: number;
	fps: number;
	ancho: number;
	alto: number;
	aviso_ia: string;
	puzle: {tipo: string; enunciado: string; respuesta: number[]};
	lineas: LineaD[];
	pistas: {id: string; texto: string; objetivo: string}[];
};
export type PropsD = {ficha: FichaD; duraciones: Record<string, number>};
export type Tramo = {inicio: number; fin: number};
export type PlanD = {
	lineas: (LineaD & Tramo)[];
	t: Record<string, Tramo>;
	pensar: Tramo;
	clac: Tramo; // válvulas girando + soplado de lastre
	total: number;
};

export const planificarD = ({ficha, duraciones}: PropsD): PlanD => {
	let t = 0.8;
	const lineas: PlanD['lineas'] = [];
	const map: PlanD['t'] = {};
	let pensar: Tramo = {inicio: 0, fin: 0};
	let clac: Tramo = {inicio: 0, fin: 0};
	let prev = '';
	for (const l of ficha.lineas) {
		if (prev && prev !== l.fase) t += 0.7;
		else if (prev) t += 0.4;
		if (l.fase === 'escena') t += 1.6; // el barrido de sala respira antes de hablar
		if (l.fase === 'solucion' && prev === 'pregunta') {
			pensar = {inicio: t, fin: t + ficha.pensar_s};
			t += ficha.pensar_s + 0.5;
		}
		if (l.fase === 'giro') {
			clac = {inicio: t, fin: t + 4.2};
			t += 4.6;
		}
		const d = duraciones[l.id] ?? 3;
		lineas.push({...l, inicio: t, fin: t + d});
		map[l.id] = {inicio: t, fin: t + d};
		t += d;
		prev = l.fase;
	}
	t += 2.4;
	return {lineas, t: map, pensar, clac, total: t};
};
