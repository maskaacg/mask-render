// Línea de tiempo de un capítulo de serie ENIGMA 60 a partir de la duración real de cada voz.
export type FaseC = 'narra' | 'pista' | 'repaso' | 'pregunta' | 'solucion' | 'comprobacion' | 'accion' | 'custodio' | 'archivera';
export type LineaC = {id: string; bloque: string; fase: FaseC; texto: string; voz?: string};
export type FichaC = {
	id: string;
	titulo: string;
	temporada: string;
	capitulo: number;
	siguiente: string;
	pensar_s: number;
	fps: number;
	ancho: number;
	alto: number;
	aviso_ia: string;
	puzles: {id: string; titulo: string; respuesta: string}[];
	lineas: LineaC[];
};
export type PropsC = {ficha: FichaC; duraciones: Record<string, number>; desde?: number};
export type Tramo = {inicio: number; fin: number};
export type PlanC = {
	lineas: (LineaC & Tramo)[];
	t: Record<string, Tramo>;
	bloques: Record<string, Tramo>;
	pensar: Record<string, Tramo>;
	mecanismo: Record<string, Tramo>;
	titulo: Tramo;
	transiciones: (Tramo & {a: string})[];
	total: number;
};

export const planificarC = ({ficha, duraciones}: PropsC): PlanC => {
	let t = 8.0; // apertura en frío: oscuridad, goteo y golpe metálico
	const lineas: PlanC['lineas'] = [];
	const map: PlanC['t'] = {};
	const bloques: PlanC['bloques'] = {};
	const pensar: PlanC['pensar'] = {};
	const mecanismo: PlanC['mecanismo'] = {};
	const transiciones: PlanC['transiciones'] = [];
	let titulo: Tramo = {inicio: 0, fin: 0};
	let prev: LineaC | null = null;
	for (const l of ficha.lineas) {
		if (prev) {
			if (prev.bloque !== l.bloque) {
				bloques[prev.bloque].fin = t;
				if (prev.bloque === 'gancho') {
					titulo = {inicio: t + 0.6, fin: t + 10.0};
					t += 10.8;
				} else {
					transiciones.push({inicio: t, fin: t + 13, a: l.bloque});
					t += 13;
				}
			} else if (prev.fase === 'pregunta') {
				pensar[l.bloque] = {inicio: t + 0.4, fin: t + 0.4 + ficha.pensar_s};
				t += ficha.pensar_s + 1.0;
			} else if (l.fase === 'accion') {
				mecanismo[l.bloque] = {inicio: t + 0.3, fin: t + 4.5};
				t += 4.5;
			} else if (prev.fase === 'accion') t += 3.5;
			else if (prev.fase === 'comprobacion') t += 1.5;
			else if (l.fase === 'repaso') t += 0.9;
			else if ((l.fase === 'custodio' || l.fase === 'archivera') && prev.fase !== l.fase) t += 2.2;
			else if (l.fase === 'custodio' || l.fase === 'archivera') t += 0.8;
			else t += 0.5;
		}
		if (!bloques[l.bloque]) bloques[l.bloque] = {inicio: t, fin: t};
		const d = duraciones[l.id] ?? 3;
		lineas.push({...l, inicio: t, fin: t + d});
		map[l.id] = {inicio: t, fin: t + d};
		if (l.fase === 'accion') mecanismo[l.bloque].fin = Math.max(mecanismo[l.bloque].fin, t + d);
		t += d;
		prev = l;
	}
	if (prev) bloques[prev.bloque].fin = t;
	t += 5;
	return {lineas, t: map, bloques, pensar, mecanismo, titulo, transiciones, total: t};
};
