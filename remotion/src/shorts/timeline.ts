// Línea de tiempo de un corto ENIGMA 60 calculada a partir de la ficha y de la
// duración real de cada pista de voz. Así ningún texto se corta ni se solapa.
export type Linea = {id: string; fase: 'intro' | 'enunciado' | 'solucion' | 'cta'; texto: string};
export type Ficha = {
	id: string;
	titulo: string;
	modo: 'puzle' | 'avance';
	pensar_s: number;
	tinte: string;
	fps: number;
	ancho: number;
	alto: number;
	aviso_ia: string;
	puzle: Record<string, unknown> & {tipo: string};
	lineas: Linea[];
};
export type Props = {ficha: Ficha; duraciones: Record<string, number>};

export type Tramo = {id: string; fase: Linea['fase']; texto: string; inicio: number; fin: number};
export type Plan = {
	lineas: Tramo[];
	fases: Record<'intro' | 'enunciado' | 'pensar' | 'solucion' | 'cta', {inicio: number; fin: number}>;
	total: number;
};

export const planificar = ({ficha, duraciones}: Props): Plan => {
	let t = 1.0; // título y golpe de aire
	const lineas: Tramo[] = [];
	const fases = {} as Plan['fases'];
	const bloque = (fase: Linea['fase'], gap: number) => {
		const ls = ficha.lineas.filter((l) => l.fase === fase);
		if (!ls.length) return;
		const ini = t;
		ls.forEach((l, i) => {
			const d = duraciones[l.id] ?? 2;
			lineas.push({id: l.id, fase, texto: l.texto, inicio: t, fin: t + d});
			t += d + (i < ls.length - 1 ? (fase === 'solucion' && i === 0 ? 0.9 : gap) : 0);
		});
		fases[fase] = {inicio: ini, fin: t};
	};
	bloque('intro', 0.45);
	t += 0.6;
	bloque('enunciado', 0.55);
	t += 0.4;
	fases.pensar = {inicio: t, fin: t + ficha.pensar_s};
	t += ficha.pensar_s + 0.3;
	if (ficha.modo === 'puzle') {
		bloque('solucion', 0.5);
		t += 1.2; // la animación de la solución respira antes de la despedida
	}
	bloque('cta', 0.5);
	if (!fases.solucion) fases.solucion = {inicio: 1e6, fin: 1e6}; // avance: sin solución en este vídeo
	t += 1.6; // cola con el aviso de IA
	return {lineas, fases, total: t};
};
