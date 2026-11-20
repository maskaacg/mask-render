import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {MONO, OSWALD, SERIF} from '../style/fonts';
import {AnilloDe60, E60} from '../e60/nucleo';

// Interfaz E60 en 16:9 (1920x1080) para capítulos de serie.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const entra = (t: number, a: number, d = 0.4) => interpolate(t, [a, a + d], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.5))});
const ventana = (t: number, a: number, b: number, s = 0.4) => interpolate(t, [a - s, a, b, b + s], [0, 1, 1, 0], clamp);

export const BordeMaqueta16: React.FC = () => (
	<>
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 72% at 50% 48%, rgba(20,21,26,0) 58%, rgba(20,21,26,0.85) 100%)'}} />
		<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,21,26,0.85) 0%, rgba(20,21,26,0) 13%, rgba(20,21,26,0) 78%, rgba(20,21,26,0.85) 100%)'}} />
	</>
);

export const Cabecera16: React.FC<{t: number; temporada: string; capitulo: number; titulo: string; desde: number; unidad?: string}> = ({t, temporada, capitulo, titulo, desde, unidad = 'CAP.'}) => (
	<div style={{position: 'absolute', top: 44, left: 64, opacity: interpolate(t, [desde, desde + 1], [0, 1], clamp), fontFamily: MONO, fontWeight: 600, fontSize: 22, letterSpacing: 4, color: E60.plata}}>
		<span style={{color: E60.cian}}>E60</span> · {temporada.toUpperCase()} · {unidad} {String(capitulo).padStart(2, '0')} · {titulo.toUpperCase()}
	</div>
);

// Portada dentro del vídeo (decisión del Propietario 16/11/2026): el primer segundo de cada vídeo largo es la
// portada (título grande y legible), para poder elegirla como miniatura aunque el canal no permita subir una propia.
export const PortadaEnVideo: React.FC<{t: number; temporada: string; capitulo: number; titulo: string; unidad?: string; children?: React.ReactNode}> = ({children, ...p}) => {
	// Opaca y nítida durante 1,2 s (sin escena detrás que la ensucie); desaparece en 0,3 s.
	const o = interpolate(p.t, [1.2, 1.5], [1, 0], clamp);
	if (o <= 0) return null;
	return (
		<AbsoluteFill style={{opacity: o, background: '#0e0f13'}}>
			{children ? (
				<div style={{position: 'absolute', left: 0, top: 0, width: 1280, height: 720, transform: 'scale(1.5)', transformOrigin: '0 0'}}>{children}</div>
			) : (
				<TituloCapitulo {...p} inicio={-2} fin={10} portada />
			)}
		</AbsoluteFill>
	);
};

export const TituloCapitulo: React.FC<{t: number; inicio: number; fin: number; temporada: string; capitulo: number; titulo: string; unidad?: string; portada?: boolean}> = ({t, inicio, fin, temporada, capitulo, titulo, unidad = 'CAPÍTULO', portada = false}) => {
	const o = ventana(t, inicio, fin, 0.8);
	if (o <= 0) return null;
	const sub = interpolate(t, [inicio + 0.4, inicio + 1.4], [0, 1], clamp);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: o, background: `rgba(20,21,26,${(portada ? 0.82 : 0.55) * o})`, transform: portada ? undefined : `scale(${1 + 0.04 * interpolate(t, [inicio, fin], [0, 1], clamp)})`}}>
			<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 12, color: E60.cian}}>ENIGMA 60</div>
			<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 150, color: E60.blanco, lineHeight: 1.05, marginTop: 18}}>{temporada}</div>
			<div style={{width: 520 * sub, height: 3, background: E60.plata, margin: '28px 0'}} />
			<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, letterSpacing: 8, color: E60.plata, opacity: sub}}>{unidad} {capitulo}</div>
			<div style={{fontFamily: SERIF, fontWeight: portada ? 800 : 600, fontStyle: 'normal', fontSize: portada ? 104 : 64, lineHeight: 1.05, textAlign: 'center', maxWidth: 1600, color: E60.blanco, opacity: sub, marginTop: 10, textShadow: portada ? '0 6px 30px rgba(0,0,0,0.85)' : undefined}}>{titulo}</div>
		</AbsoluteFill>
	);
};

export const RotuloPuzle: React.FC<{t: number; inicio: number; n: number; total: number; titulo: string}> = ({t, inicio, n, total, titulo}) => {
	const o = ventana(t, inicio + 0.3, inicio + 5.5, 0.5);
	if (o <= 0) return null;
	return (
		<div style={{position: 'absolute', top: 110, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o}}>
			<div style={{background: 'rgba(16,17,21,0.94)', border: `2px solid ${E60.cian}`, borderRadius: 12, padding: '14px 34px', display: 'flex', gap: 22, alignItems: 'baseline', transform: `translateY(${(1 - o) * -16}px)`}}>
				<span style={{fontFamily: MONO, fontWeight: 600, fontSize: 26, letterSpacing: 6, color: E60.cian}}>
					PUZLE {n}/{total}
				</span>
				<span style={{fontFamily: SERIF, fontWeight: 600, fontSize: 44, color: E60.blanco}}>{titulo}</span>
			</div>
		</div>
	);
};

export const Fichas16: React.FC<{t: number; pistas: {texto: string; desde: number; activa: number}[]; visible: number}> = ({t, pistas, visible}) => {
	if (visible <= 0) return null;
	return (
		<div style={{position: 'absolute', top: 180, left: 64, display: 'flex', flexDirection: 'column', gap: 14, opacity: visible}}>
			{pistas.map((p, i) => {
				const e = entra(t, p.desde, 0.45);
				if (e <= 0) return null;
				return (
					<div
						key={i}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 16,
							maxWidth: 640,
							background: 'rgba(16,17,21,0.94)',
							border: `2px solid ${p.activa > 0.5 ? E60.cian : 'rgba(184,190,200,0.45)'}`,
							boxShadow: p.activa > 0.5 ? `0 0 ${18 * p.activa}px rgba(63,224,230,0.5)` : 'none',
							borderRadius: 10,
							padding: '10px 20px',
							transform: `translateX(${(1 - e) * -50}px)`,
							opacity: e,
						}}
					>
						<span style={{fontFamily: MONO, fontWeight: 600, fontSize: 24, color: E60.cian}}>{String(i + 1).padStart(2, '0')}</span>
						<span style={{fontFamily: MONO, fontWeight: 600, fontSize: 28, color: E60.blanco}}>{p.texto}</span>
					</div>
				);
			})}
		</div>
	);
};

export const Anillo16: React.FC<{t: number; inicio: number; fin: number}> = ({t, inicio, fin}) => (
	<div style={{position: 'absolute', left: 1530 - 540, top: 520 - 760, width: 1080, height: 1920, transform: 'scale(0.78)', transformOrigin: '540px 760px'}}>
		<AnilloDe60 t={t} inicio={inicio} fin={fin} />
	</div>
);

export const Subtitulo16: React.FC<{texto: string; inicio: number; fin: number; t: number; custodio?: boolean; quien?: string; color?: string}> = ({texto, inicio, fin, t, custodio, quien = 'EL CUSTODIO', color = E60.cian}) => {
	const palabras = texto.split(/\s+/);
	const bloques: string[][] = [];
	let cur: string[] = [];
	for (const p of palabras) {
		if (cur.length && [...cur, p].join(' ').length > 74) {
			bloques.push(cur);
			cur = [];
		}
		cur.push(p);
		if (/[.:?!…]$/.test(p) && cur.join(' ').length > 28) {
			bloques.push(cur);
			cur = [];
		}
	}
	if (cur.length) bloques.push(cur);
	const pesos = bloques.map((b) => b.join(' ').length + 6);
	const total = pesos.reduce((a, b) => a + b, 0);
	let acc = 0, k = 0;
	for (let i = 0; i < bloques.length; i++) {
		if (t >= inicio + (acc / total) * (fin - inicio)) k = i;
		acc += pesos[i];
	}
	const o = interpolate(t, [inicio - 0.1, inicio + 0.12, fin + 0.15, fin + 0.35], [0, 1, 1, 0], clamp);
	return (
		<div style={{position: 'absolute', top: 902, left: 160, right: 160, display: 'flex', justifyContent: 'center', opacity: o}}>
			<div
				style={{
					background: 'rgba(16,17,21,0.88)',
					border: custodio ? `2px solid ${color}` : 'none',
					borderRadius: 12,
					padding: '12px 28px',
					fontFamily: OSWALD,
					fontWeight: 500,
					fontSize: 46,
					lineHeight: 1.2,
					color: custodio ? color : E60.blanco,
					textAlign: 'center',
					maxWidth: 1500,
				}}
			>
				{custodio && <span style={{fontFamily: MONO, fontSize: 22, letterSpacing: 4, display: 'block', color: E60.plata}}>{quien}</span>}
				{bloques[k].join(' ')}
			</div>
		</div>
	);
};

const Panel: React.FC<{o: number; children: React.ReactNode; ancho?: number}> = ({o, children, ancho = 980}) => (
	<div style={{position: 'absolute', top: 170, left: 64, width: ancho, background: 'rgba(16,17,21,0.96)', border: '2px solid rgba(184,190,200,0.35)', borderRadius: 18, padding: '28px 36px', opacity: o}}>
		{children}
	</div>
);
const titulo = (txt: string) => <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 22, letterSpacing: 6, color: E60.cian, marginBottom: 18}}>{txt}</div>;

/** P1 · escalones de la inmersión: 2, 6, 12, 20, 30 → 42. */
export const ExpEscalones: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const v = [2, 6, 12, 20, 30, 42];
	const d = b - a;
	return (
		<Panel o={o}>
			{titulo('BAJADA POR MINUTO')}
			<div style={{display: 'flex', alignItems: 'flex-end', gap: 26, height: 300}}>
				{v.map((x, i) => {
					const e = entra(t, a + 0.3 + i * (d * 0.1), 0.35);
					const ultimo = i === 5;
					return (
						<div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: e}}>
							{i > 0 && <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 26, color: ultimo ? E60.cian : E60.plata}}>+{v[i] - v[i - 1]}</div>}
							<div style={{width: 110, height: (x / 42) * 200 * e + 8, background: ultimo ? 'rgba(63,224,230,0.35)' : 'rgba(184,190,200,0.25)', border: `3px solid ${ultimo ? E60.cian : E60.plata}`, borderRadius: 6}} />
							<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 46, color: ultimo ? E60.cian : E60.blanco}}>{x}</div>
						</div>
					);
				})}
			</div>
		</Panel>
	);
};

/** P1 (v1 20/11) · el cuaderno boca abajo: «16» girado media vuelta es 91. */
export const ExpGiro: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	const giro = interpolate(t, [a + 0.22 * d, a + 0.42 * d], [180, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const col = giro < 90 ? E60.cian : E60.blanco;
	return (
		<Panel o={o} ancho={860}>
			{titulo('MEDIA VUELTA AL CUADERNO')}
			<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 330}}>
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
					<div style={{width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						{/* el mismo «91» a rotulador que el cuaderno: el 1 sin pie, para que girado se lea 16 */}
						<svg width={200} height={170} viewBox="0 0 200 170" style={{transform: `rotate(${giro}deg)`}}>
							<g fill="none" stroke={col} strokeWidth={16} strokeLinecap="round">
								<circle cx={62} cy={55} r={34} />
								<path d="M96 55 Q97 140 38 146" />
								<line x1={152} y1={20} x2={152} y2={145} />
							</g>
						</svg>
					</div>
					<div style={{fontFamily: MONO, fontSize: 26, color: E60.plata}}>{giro > 90 ? 'lo que ves: 16' : 'lo que escribió: 91'}</div>
				</div>
				<div style={{display: 'flex', flexDirection: 'column', gap: 14, opacity: entra(t, a + 0.5 * d)}}>
					<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, color: E60.blanco}}>6 cabeza abajo → 9</div>
					<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, color: E60.blanco}}>1 → 1</div>
					<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, color: E60.cian}}>y cambian de sitio</div>
				</div>
			</div>
		</Panel>
	);
};

/** P2 (v1 20/11) · los tres cajones: la palabra al revés; ROTOR queda fuera por estar en medio. */
export const ExpCajones: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	const filas = [
		{pos: 'ARRIBA', w: 'SONAR', rev: 'RANOS', vale: false, paso: 0.18},
		{pos: 'MEDIO', w: 'ROTOR', rev: 'ROTOR', vale: false, medio: true, paso: 0.32},
		{pos: 'ABAJO', w: 'RADAR', rev: 'RADAR', vale: true, paso: 0.44},
	];
	const tacharMedio = entra(t, a + 0.62 * d, 0.4);
	return (
		<Panel o={o} ancho={900}>
			{titulo('LA PALABRA, AL REVÉS')}
			{filas.map((f, i) => {
				const r = entra(t, a + f.paso * d, 0.4);
				const fuera = (!f.vale && !f.medio && r > 0.5) || (f.medio && tacharMedio > 0.5);
				const color = f.vale && tacharMedio > 0.5 ? E60.cian : E60.blanco;
				return (
					<div key={i} style={{display: 'flex', alignItems: 'center', gap: 24, height: 96}}>
						<div style={{width: 150, fontFamily: MONO, fontSize: 24, color: E60.plata}}>{f.pos}</div>
						<div style={{width: 200, fontFamily: MONO, fontWeight: 600, fontSize: 40, color, textDecoration: fuera ? 'line-through' : 'none', textDecorationColor: '#d9534f', textDecorationThickness: 4}}>{f.w}</div>
						<div style={{fontFamily: MONO, fontSize: 36, color: E60.plata, opacity: r}}>→</div>
						<div style={{width: 200, fontFamily: MONO, fontWeight: 600, fontSize: 40, color: f.rev === f.w ? color : E60.plata, opacity: r}}>{f.rev}</div>
						<div style={{fontFamily: MONO, fontSize: 26, color: f.medio && tacharMedio > 0.5 ? '#ff9d7a' : f.rev === f.w ? E60.cian : '#ff9d7a', opacity: r}}>
							{f.medio && tacharMedio > 0.5 ? 'está en medio' : f.rev === f.w ? 'igual' : 'distinta'}
						</div>
					</div>
				);
			})}
		</Panel>
	);
};

/** P3 · cajas: cada caja vale lo mismo. */
export const ExpCajas16: React.FC<{t: number; a: number; b: number; valor: number}> = ({t, a, b, valor}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	const at = (f: number) => a + f * d;
	const rev = interpolate(t, [at(0.78), at(0.9)], [0, 1], clamp);
	const caja = (k: string, desde: number) => (
		<div key={k} style={{width: 78, height: 78, borderRadius: 10, border: `4px solid ${E60.plata}`, background: `rgba(63,224,230,${0.25 * rev})`, transform: `scale(${entra(t, desde, 0.3)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 38, color: E60.cian}}>
			{rev > 0.5 ? valor : ''}
		</div>
	);
	const fila = (letra: string, n: number, desde: number, extra: string, res: number) => (
		<div style={{display: 'flex', alignItems: 'center', gap: 16, height: 92}}>
			<div style={{width: 64, fontFamily: MONO, fontWeight: 600, fontSize: 50, color: E60.blanco}}>{letra}</div>
			{Array.from({length: n}, (_, i) => caja(letra + i, desde + i * 0.15))}
			{extra && <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 46, color: E60.plata, opacity: entra(t, desde + 0.3)}}>{extra}</div>}
			<div style={{flex: 1}} />
			<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 64, color: E60.cian, opacity: rev}}>{res}</div>
		</div>
	);
	return (
		<Panel o={o} ancho={760}>
			{titulo('SI B ES UNA CAJA…')}
			{fila('A', 2, at(0.18), '', 2 * valor)}
			{fila('B', 1, at(0.05), '', valor)}
			{fila('C', 1, at(0.32), '+ 3', valor + 3)}
			<div style={{height: 2, background: 'rgba(184,190,200,0.35)', margin: '14px 0'}} />
			<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 40, color: E60.blanco, opacity: interpolate(t, [at(0.55), at(0.65)], [0, 1], clamp), textAlign: 'center'}}>
				4 cajas + 3 = 19 → 1 caja = <span style={{color: E60.cian}}>{valor}</span>
			</div>
		</Panel>
	);
};

/** P4 · balanza: 7 + 3 = 9 + 1. */
export const ExpBalanza: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	const lado = (items: string[], desde: number, total: number) => (
		<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
			<div style={{display: 'flex', gap: 12}}>
				{items.map((x, i) => (
					<div key={i} style={{padding: '10px 18px', borderRadius: 10, border: `3px solid ${i === 0 && x === '7' ? E60.plata : E60.cian}`, fontFamily: MONO, fontWeight: 600, fontSize: 40, color: E60.blanco, transform: `scale(${entra(t, desde + i * 0.4)})`}}>
						{x} kg
					</div>
				))}
			</div>
			<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 70, color: E60.cian, opacity: entra(t, a + 0.7 * d)}}>{total}</div>
		</div>
	);
	return (
		<Panel o={o} ancho={860}>
			{titulo('PLATILLO IZQUIERDO = PLATILLO DERECHO')}
			<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-around'}}>
				{lado(['7', '3'], a + 0.1 * d, 10)}
				<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 90, color: E60.plata}}>=</div>
				{lado(['9', '1'], a + 0.35 * d, 10)}
			</div>
		</Panel>
	);
};

/** P5 · reloj: 3:10 − 45 min = 2:25; + 20 min = 2:45. */
export const ExpReloj: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	const pasos = [
		{txt: '3:10', nota: 'se para el reloj', f: 0.02},
		{txt: '− 45 min', nota: '', f: 0.2},
		{txt: '2:25', nota: 'empieza la inundación', f: 0.38},
		{txt: '+ 20 min', nota: '', f: 0.6},
		{txt: '2:45', nota: 'suena la alarma', f: 0.75},
	];
	return (
		<Panel o={o} ancho={760}>
			{titulo('LÍNEA DEL TIEMPO')}
			{pasos.map((p, i) => {
				const e = entra(t, a + p.f * d);
				const hora = i % 2 === 0;
				return (
					<div key={i} style={{display: 'flex', alignItems: 'baseline', gap: 22, height: hora ? 70 : 46, opacity: e, paddingLeft: hora ? 0 : 40}}>
						<span style={{fontFamily: hora ? SERIF : MONO, fontWeight: hora ? 800 : 600, fontSize: hora ? 56 : 32, color: i === 4 ? E60.cian : hora ? E60.blanco : E60.plata}}>{p.txt}</span>
						<span style={{fontFamily: MONO, fontSize: 24, color: E60.plata}}>{p.nota}</span>
					</div>
				);
			})}
		</Panel>
	);
};

/** P6 · indicador: 0 → 3 → 6 → 9 → 12 → 10. */
export const ExpIndicador: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	const pasos = [
		{v: '0', m: ''},
		{v: '3', m: 'D'},
		{v: '6', m: 'D'},
		{v: '9', m: 'D'},
		{v: '12', m: 'D'},
		{v: '10', m: 'I'},
	];
	return (
		<Panel o={o}>
			{titulo('DERECHA +3 · IZQUIERDA −2 · 5 VUELTAS')}
			<div style={{display: 'flex', alignItems: 'center', gap: 10}}>
				{pasos.map((p, i) => {
					const e = entra(t, a + 0.08 * d + i * 0.11 * d);
					return (
						<React.Fragment key={i}>
							{i > 0 && (
								<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: e}}>
									<span style={{fontFamily: MONO, fontWeight: 600, fontSize: 24, color: p.m === 'I' ? '#ff9d7a' : E60.cian}}>{p.m === 'I' ? '−2' : '+3'}</span>
									<span style={{fontFamily: MONO, fontSize: 30, color: E60.plata}}>→</span>
								</div>
							)}
							<div style={{width: 96, height: 96, borderRadius: 48, border: `4px solid ${i === 5 ? E60.cian : E60.plata}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 800, fontSize: 42, color: i === 5 ? E60.cian : E60.blanco, transform: `scale(${e})`}}>
								{p.v}
							</div>
						</React.Fragment>
					);
				})}
			</div>
		</Panel>
	);
};

/** Recuento final de soluciones. */
export const Recuento: React.FC<{t: number; a: number; b: number; puzles: {titulo: string; respuesta: string}[]; rotulo?: string}> = ({t, a, b, puzles, rotulo = 'SOLUCIONES DEL CAPÍTULO'}) => {
	const o = ventana(t, a, b, 0.5);
	if (o <= 0) return null;
	const d = b - a;
	return (
		<Panel o={o} ancho={900}>
			{titulo(rotulo)}
			{puzles.map((p, i) => (
				<div key={i} style={{display: 'flex', gap: 20, alignItems: 'baseline', height: 54, opacity: entra(t, a + 0.08 * d + i * 0.1 * d)}}>
					<span style={{fontFamily: MONO, fontWeight: 600, fontSize: 24, color: E60.cian, width: 40}}>{i + 1}</span>
					<span style={{fontFamily: MONO, fontSize: 26, color: E60.plata, width: 400}}>{p.titulo}</span>
					<span style={{fontFamily: MONO, fontWeight: 600, fontSize: 28, color: E60.blanco}}>{p.respuesta}</span>
				</div>
			))}
		</Panel>
	);
};

export const Proximo: React.FC<{t: number; desde: number; siguiente: string; aviso: string; rotulo?: string}> = ({t, desde, siguiente, aviso, rotulo = 'PRÓXIMO CAPÍTULO'}) => {
	const o = interpolate(t, [desde, desde + 0.8], [0, 1], clamp);
	if (o <= 0) return null;
	return (
		<div style={{position: 'absolute', right: 80, top: 330, width: 620, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: o}}>
			<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 24, letterSpacing: 8, color: E60.cian}}>{rotulo}</div>
			<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 76, color: E60.blanco}}>{siguiente}</div>
			<div style={{width: 120, height: 120, borderRadius: 60, border: `5px solid ${E60.plata}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 40, color: E60.blanco, boxShadow: '0 0 24px rgba(63,224,230,0.4)', marginTop: 20}}>
				E<span style={{color: E60.cian}}>60</span>
			</div>
			<div style={{fontFamily: MONO, fontSize: 18, color: 'rgba(184,190,200,0.75)', letterSpacing: 2}}>{aviso}</div>
		</div>
	);
};
