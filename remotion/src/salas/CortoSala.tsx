import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {cargarFuentes, MONO, OSWALD, SERIF} from '../style/fonts';
import {BordeMaqueta, E60} from '../e60/nucleo';
import {V3} from '../escape/AvanceTorre';
import {Sala, SalaCorto3D, EstadoSalaCorto, planosSala} from './SalaCorto3D';
import {PUZLES} from '../plano/puzles';
import {Props, planificar} from '../shorts/timeline';
import {AGUA, estadoTrasvases} from './Jarras3D';
import {PlacaPista} from './CajaFuerte3D';
import {ACENTO, EstadoBalanza, Pesa} from './Balanza3D';

cargarFuentes();

// ENIGMA 60 · acertijo vertical en su PROPIA habitación 3D (orden del Propietario, 16/11/2026).
// La sala se describe en `ficha.sala`; el puzle es un objeto 3D dentro de ella (nunca un dibujo).
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
const AMBAR = '#F0B955';

type FichaCT = Props['ficha'] & {numero?: number; sala: Sala; gancho?: boolean; gancho_texto?: string};

export const CortoSala: React.FC<Props> = (props) => {
	const ficha = props.ficha as FichaCT;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const plan = planificar(props);
	const F = plan.fases;
	const enun = F.enunciado.inicio;
	const sol = F.solucion.inicio;
	const S = ficha.sala;
	const PL = planosSala(S);
	// caja fuerte: plano más cercano para que las placas se lean en vertical
	if (ficha.puzle.tipo === 'caja_fuerte') {
		const y0 = PL.puzle.mira[1];
		PL.puzle = {pos: [0, y0 + 1.7, PL.puzle.mira[2] + 1.95], mira: [0, y0 + 0.05, PL.puzle.mira[2] + 0.05], fov: 64};
	}
	// balanza: plano frontal a la altura de la barra, con los 10 ganchos y las pesas en cuadro
	if (ficha.puzle.tipo === 'balanza') {
		const y0 = PL.puzle.mira[1];
		PL.puzle = {pos: [0, y0 + 0.66, PL.puzle.mira[2] + 2.95], mira: [0, y0 + 0.36, PL.puzle.mira[2] + 0.1], fov: 52};
	}
	const LN = Object.fromEntries(plan.lineas.map((l) => [l.id, l]));
	const gancho = !!ficha.gancho;
	const finSol = ficha.puzle.tipo === 'balanza' ? (LN.l10?.fin ?? sol) + 0.4 : plan.total - 3.0;
	const l2 = plan.lineas[1]?.inicio ?? enun;
	const l3 = plan.lineas[2]?.inicio ?? enun;
	// cámara: entrada → detalle de la sala → el puzle → la puerta que se abre al final
	// con `gancho` el problema está en cuadro desde el fotograma 0 (auditoría 22/11: nada de 15-25 s de sala vacía)
	const ev: [number, keyof typeof PL][] = gancho
		? [[-10, 'puzle'], [0, 'puzle'], [finSol - 0.4, 'puerta']]
		: [[-10, 'entrada'], [0, 'entrada'], [Math.max(0.5, l2 - 0.6), 'detalle'], [Math.max(1, l3 - 0.8), 'puzle'], [plan.total - 3.4, 'puerta']];
	let k = 0;
	for (let i = 0; i < ev.length; i++) if (t >= ev[i][0]) k = i;
	const f = interpolate(t, [ev[k][0], ev[k][0] + 1.9], [0, 1], {...clamp, easing: io});
	const a = PL[ev[Math.max(0, k - 1)][1]];
	const b = PL[ev[k][1]];
	const mix = (x: V3, y: V3) => [0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * f) as V3;
	const pos = mix(a.pos, b.pos);
	const mira = mix(a.mira, b.mira);
	// avance lento de cámara dentro de cada plano (dolly), para que nunca haya segundos congelados
	const dentro = Math.max(0, t - ev[k][0]);
	const dir = [0, 1, 2].map((i) => mira[i] - pos[i]);
	const largo = Math.hypot(dir[0], dir[1], dir[2]) || 1;
	// caja fuerte: el avance se limita para que las cinco placas sigan en cuadro mientras se piensa
	const avance = Math.min(ficha.puzle.tipo === 'caja_fuerte' && ev[k][1] === 'puzle' ? 0.12 : ficha.puzle.tipo === 'balanza' && ev[k][1] === 'puzle' ? 0.3 : 0.9, dentro * 0.008 + (ficha.puzle.tipo === 'balanza' ? 0 : dentro * 0.037));
	for (let i = 0; i < 3; i++) pos[i] += (dir[i] / largo) * avance;
	pos[0] += Math.sin(t * 0.6) * 0.03 + Math.sin(t * 0.21) * 0.14;
	pos[1] += Math.sin(t * 0.47 + 1) * 0.015 + Math.sin(t * 0.13) * 0.06;
	const tipo = ficha.puzle.tipo;
	if (!['cerillas', 'engranajes', 'jarras', 'caja_fuerte', 'balanza'].includes(tipo)) throw new Error('PUZLE_SIN_VERSION_3D:' + tipo);
	const vueltas = tipo === 'engranajes' ? interpolate(t, [sol + 0.6, sol + 9], [0, Number(ficha.puzle.vueltas)], {...clamp, easing: io}) : 0;
	// el mecanismo sigue girando despacio después de la cuenta (no se queda congelado)
	const inercia = tipo === 'engranajes' ? Math.max(0, t - (sol + 9)) * 0.12 : 0;
	// jarras: cada trasvase se reparte dentro de la línea de voz que lo narra (`reparto` = trasvases por línea de solución, empezando en la 2.ª)
	let kJ = 0;
	if (tipo === 'jarras') {
		const reparto = ficha.puzle.reparto as number[];
		const solL = plan.lineas.filter((l) => l.fase === 'solucion');
		reparto.forEach((n, j) => {
			const L = solL[j + 1];
			if (!L) return;
			const d = (L.fin - L.inicio) / n;
			for (let m = 0; m < n; m++) {
				const a0 = L.inicio + d * m + 0.1;
				kJ += interpolate(t, [a0, a0 + Math.min(2.4, d * 0.92)], [0, 1], {...clamp, easing: io}); // trasvases secuenciales: la suma de progresos es el índice
			}
		});
	}
	const J = tipo === 'jarras' ? estadoTrasvases(ficha.puzle.capacidades as number[], ficha.puzle.inicial as number[], ficha.puzle.trasvases as [number, number][], kJ) : undefined;
	// caja fuerte: resalte de cada placa mientras la voz la nombra y ruedas que giran al resolver
	let cajaFuerte: EstadoSalaCorto['cajaFuerte'];
	if (tipo === 'caja_fuerte') {
		const L = Object.fromEntries(plan.lineas.map((l) => [l.id, l]));
		const luz = [0, 0, 0, 0, 0];
		const marca = (i: number, a: number, b: number) => (luz[i] = Math.max(luz[i], interpolate(t, [a - 0.2, a + 0.2, b, b + 0.4], [0, 1, 1, 0], clamp)));
		const trozos = (id: string, placas: number[]) => {
			const l = L[id];
			if (!l) return;
			const d = (l.fin - l.inicio) / placas.length;
			placas.forEach((pi, j) => marca(pi, l.inicio + j * d, l.inicio + (j + 1) * d));
		};
		trozos('l04', [0, 1, 2]);
		trozos('l05', [3, 4]);
		trozos('l08', [0, 1]);
		trozos('l09', [3, 4, 2]);
		trozos('l10', [3, 2]);
		const r = (L.l08?.fin ?? sol) - 1.6;
		const r2 = L.l10?.inicio ?? sol;
		const fin = L.l10?.fin ?? sol;
		const cod = String(ficha.puzle.respuesta).split('').map(Number);
		cajaFuerte = {
			placas: ficha.puzle.placas as PlacaPista[],
			ruedas: [
				interpolate(t, [r, r + 1.4], [0, cod[0]], {...clamp, easing: io}),
				interpolate(t, [r2 + 2.2, r2 + 3.4], [0, cod[1]], {...clamp, easing: io}),
				interpolate(t, [r2 + 0.6, r2 + 1.8], [0, cod[2]], {...clamp, easing: io}),
			],
			luz,
			puertaCaja: interpolate(t, [fin - 1.6, fin + 0.2], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}),
			aparece: interpolate(t, [l3 - 0.2, l3 + 1.0], [0, 1], clamp),
		};
	}
	// balanza: cada gancho se ilumina cuando la voz lo nombra y las pesas suben a su gancho al dar la solución
	let balanza: EstadoBalanza | undefined;
	if (tipo === 'balanza') {
		const P = ficha.puzle as unknown as {fijas: Pesa[]; sueltas: (Pesa & {reposo: [number, number]})[]; trampa: {lado: -1 | 1; gancho: number}};
		const luz: EstadoBalanza['luz'] = [];
		const seq = (id: string, items: [(-1 | 1), number, string?][]) => {
			const l = LN[id];
			if (!l) return;
			const d = (l.fin - l.inicio) / items.length;
			items.forEach(([lado, g, color], j) => {
				const a0 = l.inicio + j * d;
				luz.push({lado, gancho: g, color, v: interpolate(t, [a0 - 0.15, a0 + 0.2, a0 + d + 0.2, a0 + d + 0.6], [0, 1, 1, 0], clamp)});
			});
		};
		seq('l03', [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5]]);
		seq('l04', [[-1, 4], [-1, 1], [1, 2]]);
		seq('l05', [[1, 1, ACENTO], [1, 3, ACENTO], [1, 4, ACENTO], [1, 5, ACENTO]]);
		seq('l07', [[-1, 4], [-1, 1]]);
		seq('l08', [[1, 2]]);
		seq('l09', [[1, 2, '#ff6a55'], [1, 4]]);
		seq('l10', [[1, 1, '#ff6a55'], [1, 4, '#ff6a55'], [1, 3, ACENTO], [1, 1, ACENTO]]);
		const l6 = LN.l06 ?? {inicio: sol, fin: sol + 3};
		const mitad = (l6.inicio + l6.fin) / 2;
		balanza = {
			fijas: P.fijas,
			sueltas: P.sueltas.map((q, j) => ({...q, progreso: interpolate(t, j === 0 ? [l6.inicio + 0.2, mitad + 0.4] : [mitad, l6.fin + 0.6], [0, 1], {...clamp, easing: io})})),
			golpe: interpolate(t, [0, 1.6], [0, 1], clamp),
			luz,
			ocupado: interpolate(t, [(LN.l09?.inicio ?? 1e6) + 1.2, (LN.l09?.inicio ?? 1e6) + 1.6, (LN.l09?.fin ?? 1e6) + 0.2, (LN.l09?.fin ?? 1e6) + 0.6], [0, 1, 1, 0], clamp),
			ocupadoEn: P.trampa,
			aparece: 1,
		};
	}
	const e: EstadoSalaCorto = {
		balanza,
		cajaFuerte,
		t,
		cam: {pos, mira, fov: a.fov + (b.fov - a.fov) * f},
		puerta: interpolate(t, [finSol, finSol + 1.8], [0, 1], {...clamp, easing: io}),
		foco: gancho ? interpolate(t, [0, 0.4, finSol - 0.6, finSol], [0.6, 0.9, 0.9, 0], clamp) : interpolate(t, [l3 - 0.5, l3 + 0.5, plan.total - 3.6, plan.total - 3.0], [0, 0.8, 0.8, 0], clamp),
		engranajes: tipo === 'engranajes'
			? {
					dientes: ficha.puzle.dientes as number[],
					vueltasPequeno: vueltas + inercia + 0.03 * Math.sin(t * 0.9) * (t < sol ? 1 : 0),
					aparece: interpolate(t, [l3 - 0.2, l3 + 1.2], [0, 1], clamp),
					marca: interpolate(t, [sol, sol + 0.6], [0, 1], clamp),
				}
			: undefined,
		jarras: J && {capacidades: ficha.puzle.capacidades as number[], litros: J.litros, vierte: J.vierte, aparece: interpolate(t, [l3 - 0.2, l3 + 1.0], [0, 1], clamp)},
		cerillas: tipo !== 'cerillas' ? undefined : {
			inicial: ficha.puzle.inicial as [number, string, number, number],
			mueve: ficha.puzle.mueve as {de: [number, string]; a: [number, string]},
			aparece: interpolate(t, [l3 - 0.2, l3 + 2.2], [0, 1], clamp),
			mov: interpolate(t, [sol + 0.8, sol + 2.6], [0, 1], {...clamp, easing: io}),
			brillo: interpolate(t, [l3 - 0.5, l3 + 0.5], [0, 1], clamp),
		},
	};
	const rel = 0;

	const Puzle = null as null | React.FC<any>;
	// pergamino con el acertijo
	const perg = interpolate(t, [enun - 0.5, enun + 0.4], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	// temporizador y pregunta fija mientras se piensa
	const pz = interpolate(t, [F.pensar.inicio, F.pensar.fin], [0, 1], clamp);
	const tO = interpolate(t, [F.pensar.inicio - 0.4, F.pensar.inicio, F.pensar.fin + 0.2, F.pensar.fin + 0.8], [0, 1, 1, 0], clamp);
	const secs = Math.max(0, Math.ceil(ficha.pensar_s * (1 - pz) - 1e-6));
	const pregunta = [...ficha.lineas].reverse().find((l) => l.fase === 'enunciado')?.texto ?? '';
	const enPensar = t >= F.pensar.inicio - 0.1 && t < F.pensar.fin + 0.3;
	const linea = plan.lineas.find((l) => t >= l.inicio && t < l.fin + 0.3);
	const subO = linea ? Math.max(0, Math.min(1, (t - linea.inicio) / 0.15, (linea.fin + 0.3 - t) / 0.2)) : 0;
	const titO = gancho ? interpolate(t, [0, 0.15, enun - 0.4, enun + 0.2], [0, 1, 1, 0], clamp) : interpolate(t, [0.2, 0.9, enun - 0.4, enun + 0.2], [0, 1, 1, 0.85], clamp);
	const ticks = Array.from({length: Math.floor(ficha.pensar_s)}, (_, i) => F.pensar.inicio + i);
	const fundido = Math.max(gancho ? 0 : interpolate(t, [0, 0.8], [1, 0], clamp), interpolate(t, [plan.total - 0.8, plan.total], [0, 1], clamp));
	const esBal = tipo === 'balanza';
	const Pb = ficha.puzle as unknown as {fijas: Pesa[]; sueltas: Pesa[]};
	const pizO = esBal ? interpolate(t, [(LN.l04?.inicio ?? 1e6) - 0.3, (LN.l04?.inicio ?? 1e6) + 0.3, F.pensar.fin + 0.2, F.pensar.fin + 0.7], [0, 1, 1, 0], clamp) : 0;
	const cuentas = esBal ? (ficha.puzle as unknown as {cuentas: {linea: string; texto: string; ok?: boolean}[]}).cuentas : [];
	const cuenO = esBal ? interpolate(t, [(LN.l07?.inicio ?? 1e6) - 0.3, (LN.l07?.inicio ?? 1e6) + 0.2, finSol - 0.2, finSol + 0.3], [0, 1, 1, 0], clamp) : 0;
	const ctaO = interpolate(t, [(F.cta?.inicio ?? 1e6) - 0.2, (F.cta?.inicio ?? 1e6) + 0.4, plan.total - 1.0, plan.total - 0.6], [0, 1, 1, 0], clamp);
	const tail = plan.total - 1.8;

	return (
		<AbsoluteFill style={{background: '#0a0807', overflow: 'hidden'}}>
			<SalaCorto3D s={S} e={e} ancho={720} alto={1280} escala={1080 / 720} />
			<AbsoluteFill style={{background: '#e8eeff', opacity: rel * 0.12}} />
			<AbsoluteFill style={{background: `radial-gradient(ellipse 70% 40% at 50% 62%, rgba(240,185,85,${0.10 * perg}) 0%, rgba(0,0,0,0) 70%)`}} />
			<BordeMaqueta />

			{/* cabecera */}
			<div style={{position: 'absolute', top: 90, left: 64, right: 64, opacity: titO}}>
				<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 26, letterSpacing: 8, color: AMBAR}}>ENIGMA 60 · ACERTIJO {String(ficha.numero ?? 1).padStart(2, '0')}</div>
				<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 70, lineHeight: 1.05, color: E60.blanco, marginTop: 8, textShadow: '0 4px 18px rgba(0,0,0,0.8)'}}>{ficha.titulo}</div>
				{ficha.gancho_texto && (
					<div style={{display: 'inline-block', marginTop: 18, fontFamily: OSWALD, fontWeight: 600, fontSize: 56, lineHeight: 1.1, color: '#0b0806', background: AMBAR, padding: '8px 22px', borderRadius: 10, transform: `scale(${interpolate(t, [0, 0.25, 0.45], [0.9, 1.06, 1], clamp)})`, transformOrigin: 'left center'}}>
						{ficha.gancho_texto}
					</div>
				)}
			</div>

			{/* pizarra con los datos de la balanza (grande, una idea por fila) */}
			{esBal && pizO > 0.01 && (
				<div style={{position: 'absolute', left: 48, right: 220, top: 250, opacity: pizO, background: 'rgba(12,10,8,0.95)', borderLeft: `8px solid ${AMBAR}`, borderRadius: 10, padding: '16px 24px', fontFamily: OSWALD, fontWeight: 500, fontSize: 44, lineHeight: 1.25, color: E60.blanco}}>
					<div><b style={{color: AMBAR}}>IZQUIERDA</b> · {Pb.fijas.filter((p) => p.lado < 0).map((p) => `${p.kg} kg en el ${p.gancho}`).join(' · ')}</div>
					<div><b style={{color: AMBAR}}>DERECHA</b> · {Pb.fijas.filter((p) => p.lado > 0).map((p) => `${p.kg} kg en el ${p.gancho}`).join(' · ')}</div>
					<div style={{color: ACENTO}}>TUS PESAS · {Pb.sueltas.map((p) => `${p.kg} kg`).join(' y ')} → a la derecha</div>
					{enPensar && <div style={{marginTop: 8, color: '#ffe2b0', fontWeight: 600}}>¿En qué gancho va cada una?</div>}
				</div>
			)}

			{/* cuentas de la solución, paso a paso, sincronizadas con la voz */}
			{esBal && cuenO > 0.01 && (
				<div style={{position: 'absolute', left: 48, right: 48, top: 250, opacity: cuenO, background: 'rgba(12,10,8,0.95)', borderLeft: `8px solid ${ACENTO}`, borderRadius: 10, padding: '16px 24px', fontFamily: OSWALD, fontWeight: 500, fontSize: 46, lineHeight: 1.25, color: E60.blanco}}>
					{cuentas.map((c, i) => {
						const a0 = LN[c.linea]?.inicio ?? 1e6;
						const o = interpolate(t, [a0 + 0.1, a0 + 0.5], [0, 1], clamp);
						return o > 0.01 ? (
							<div key={i} style={{opacity: o, color: c.ok === true ? ACENTO : c.ok === false ? '#ff8a75' : E60.blanco}}>{c.texto}</div>
						) : null;
					})}
				</div>
			)}

			{/* llamada a suscribirse, natural y breve */}
			{ctaO > 0.01 && (
				<div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center', opacity: ctaO}}>
					<div style={{fontFamily: OSWALD, fontWeight: 600, fontSize: 52, color: '#0b0806', background: AMBAR, padding: '12px 30px', borderRadius: 12, transform: `scale(${interpolate(t, [(F.cta?.inicio ?? 0), (F.cta?.inicio ?? 0) + 0.3], [0.92, 1], clamp)})`}}>
						SUSCRÍBETE · un acertijo nuevo cada día
					</div>
				</div>
			)}

			{/* pergamino iluminado por la vela */}
			<div style={{position: 'absolute', left: 40, top: 640, width: 1000, height: 900, opacity: 0, transform: `translateY(${(1 - perg) * 40}px)`}}>
				<div style={{position: 'absolute', inset: 0, borderRadius: 26, background: 'linear-gradient(180deg, rgba(20,16,12,0.86), rgba(12,10,8,0.92))', border: `3px solid ${AMBAR}`, boxShadow: `0 0 50px rgba(240,185,85,0.22), inset 0 0 60px rgba(240,185,85,0.08)`}} />
				<svg width={1000} height={900} viewBox="0 0 1080 972" style={{position: 'absolute', inset: 0}}>
					<g transform="translate(0 -20)">{Puzle && <Puzle datos={ficha.puzle} t={t} enunciado={enun} solucion={sol} acento={AMBAR} />}</g>
				</svg>
			</div>

			{/* temporizador de vela */}
			<div style={{position: 'absolute', right: 56, top: 470, width: 150, height: 150, opacity: tO}}>
				<svg width={150} height={150} viewBox="-75 -75 150 150">
					<circle r={70} fill="rgba(12,10,8,0.85)" stroke={E60.plata} strokeOpacity={0.4} strokeWidth={2} />
					<circle r={60} fill="none" stroke={AMBAR} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={pz} transform="rotate(-90)" strokeLinecap="round" />
					<text y={22} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={64} fill={E60.blanco}>{secs}</text>
				</svg>
			</div>

			{/* pregunta fija mientras se piensa */}
			<div style={{position: 'absolute', left: 56, right: 230, top: 300, opacity: esBal ? 0 : tO, fontFamily: OSWALD, fontWeight: 500, fontSize: 46, lineHeight: 1.15, color: E60.blanco, background: 'rgba(12,10,8,0.82)', borderLeft: `8px solid ${AMBAR}`, padding: '14px 22px', borderRadius: 8}}>
				{pregunta}
			</div>

			{/* contador de vueltas (engranajes) */}
			{tipo === 'engranajes' && t > sol + 0.4 && (
				<div style={{position: 'absolute', left: 56, right: 56, top: 300, display: 'flex', justifyContent: 'space-around', opacity: interpolate(t, [sol + 0.4, sol + 1, plan.total - 3.6, plan.total - 3], [0, 1, 1, 0], clamp), background: 'rgba(12,10,8,0.82)', borderLeft: `8px solid ${AMBAR}`, padding: '14px 22px', borderRadius: 8, fontFamily: OSWALD, fontSize: 44, color: E60.blanco}}>
					<span>Pequeño: <b style={{color: AMBAR}}>{Math.floor(vueltas + 1e-6)}</b></span>
					<span>Grande: <b style={{color: '#ff6f55'}}>{Math.floor(vueltas * (Number((ficha.puzle.dientes as number[])[0]) / Number((ficha.puzle.dientes as number[]).slice(-1)[0])) + 1e-6)}</b></span>
				</div>
			)}

			{/* contador de litros (jarras): mismo orden que en la mesa y mismo color del agua */}
			{J && t > l3 + 0.6 && !enPensar && (
				<div style={{position: 'absolute', left: 56, right: 56, top: 300, display: 'flex', justifyContent: 'space-around', opacity: interpolate(t, [l3 + 0.6, l3 + 1.2, plan.total - 3.6, plan.total - 3], [0, 1, 1, 0], clamp), background: 'rgba(12,10,8,0.95)', borderLeft: `8px solid ${AGUA}`, padding: '14px 22px', borderRadius: 8, fontFamily: OSWALD, fontSize: 44, color: E60.blanco}}>
					{(ficha.puzle.capacidades as number[]).map((cap, i) => (
						<span key={i}>{cap} L: <b style={{color: AGUA}}>{Math.round(J.litros[i])}</b></span>
					))}
					{t > sol + 0.4 && <span style={{color: AMBAR}}>Trasvases: <b>{Math.min((ficha.puzle.trasvases as unknown[]).length, Math.floor(kJ + 0.2))}</b></span>}
				</div>
			)}

			{/* subtítulos */}
			{!enPensar && linea && (
				<div style={{position: 'absolute', left: 56, right: 56, top: 1572, display: 'flex', justifyContent: 'center', opacity: subO}}>
					<div style={{background: 'rgba(12,10,8,0.78)', borderLeft: `8px solid ${linea.fase === 'solucion' ? AMBAR : E60.violeta}`, padding: '12px 22px', borderRadius: 8, fontFamily: OSWALD, fontWeight: 500, fontSize: 42, lineHeight: 1.16, color: linea.fase === 'solucion' ? '#ffe2b0' : E60.blanco, transform: `translateY(${(1 - subO) * 10}px)`}}>
						{linea.texto}
					</div>
				</div>
			)}

			<div style={{position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, letterSpacing: 3, fontSize: 24, color: E60.plata, opacity: interpolate(t, [tail, tail + 0.3], [0, 0.9], clamp)}}>
				{ficha.aviso_ia.toUpperCase()}
			</div>
			<AbsoluteFill style={{background: '#0a0807', opacity: fundido}} />

			{/* audio (mismo esquema que el acertijo plano) */}
			<Audio src={staticFile('audio/sfx/ambiente.wav')} volume={0.4} />
			<Audio src={staticFile('audio/sfx/musica.wav')} volume={0.08} loop />
			{plan.lineas.map((l) => (
				<Sequence key={l.id} from={Math.round(l.inicio * fps)}>
					<Audio src={staticFile(`audio/${ficha.id}/${l.id}.wav`)} />
				</Sequence>
			))}
			{ticks.map((s) => (
				<Sequence key={s} from={Math.round(s * fps)} durationInFrames={Math.round(0.3 * fps)}>
					<Audio src={staticFile('audio/sfx/tic.wav')} volume={0.6} />
				</Sequence>
			))}
			<Sequence from={Math.round(sol * fps)}>
				<Audio src={staticFile('audio/sfx/campana.wav')} volume={0.55} />
			</Sequence>
		</AbsoluteFill>
	);
};
