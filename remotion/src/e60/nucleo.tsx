import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {MONO, OSWALD, SERIF} from '../style/fonts';

// Núcleo de identidad E60 (propuesta «Diorama E60»): componentes que no cambian entre escenarios.
export const E60 = {
	grafito: '#14151A',
	plata: '#B8BEC8',
	blanco: '#EAF2FF',
	violeta: '#7B5CFF',
	cian: '#3FE0E6',
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Borde de maqueta: la sala se funde en grafito por los bordes. */
export const BordeMaqueta: React.FC = () => (
	<>
		<AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 46%, rgba(20,21,26,0) 55%, rgba(20,21,26,0.82) 100%)`}} />
		<AbsoluteFill style={{background: `linear-gradient(180deg, rgba(20,21,26,0.92) 0%, rgba(20,21,26,0) 14%, rgba(20,21,26,0) 80%, rgba(20,21,26,0.9) 100%)`}} />
	</>
);

export const Cabecera: React.FC<{t: number; aventura: string; titulo: string; sala: number; tituloHasta: number}> = ({t, aventura, titulo, sala, tituloHasta}) => {
	const o = interpolate(t, [0.3, 1.0], [0, 1], clamp);
	const ot = interpolate(t, [0.8, 1.6, tituloHasta, tituloHasta + 0.8], [0, 1, 1, 0], clamp);
	return (
		<div style={{position: 'absolute', top: 92, left: 70, right: 70, opacity: o}}>
			<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 24, letterSpacing: 4, color: E60.plata}}>
				<span style={{color: E60.cian}}>E60</span> · {aventura.toUpperCase()} · SALA {String(sala).padStart(2, '0')}
			</div>
			<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 76, color: E60.blanco, opacity: ot, marginTop: 10, lineHeight: 1, transform: `translateY(${(1 - ot) * 14}px)`}}>
				{titulo}
			</div>
		</div>
	);
};

/** Fichas de pista numeradas que se apilan como inventario. */
export const FichasPista: React.FC<{t: number; pistas: {texto: string; desde: number; activa: number}[]; hasta: number}> = ({t, pistas, hasta}) => {
	const salida = interpolate(t, [hasta, hasta + 0.6], [1, 0], clamp);
	return (
		<div style={{position: 'absolute', top: 228, left: 70, display: 'flex', flexDirection: 'column', gap: 14, opacity: salida}}>
			{pistas.map((p, i) => {
				const e = interpolate(t, [p.desde, p.desde + 0.45], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
				if (e <= 0) return null;
				return (
					<div
						key={i}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 18,
							background: 'rgba(20,21,26,0.78)',
							border: `2px solid ${p.activa > 0.5 ? E60.cian : 'rgba(184,190,200,0.45)'}`,
							boxShadow: p.activa > 0.5 ? `0 0 ${18 * p.activa}px rgba(63,224,230,0.55)` : 'none',
							borderRadius: 10,
							padding: '12px 22px',
							transform: `translateX(${(1 - e) * -60}px)`,
							opacity: e,
						}}
					>
						<span style={{fontFamily: MONO, fontWeight: 600, fontSize: 28, color: E60.cian}}>{String(i + 1).padStart(2, '0')}</span>
						<span style={{fontFamily: MONO, fontWeight: 600, fontSize: 34, color: E60.blanco}}>{p.texto}</span>
					</div>
				);
			})}
		</div>
	);
};

/** Subtítulo en bloques de hasta dos líneas, sincronizado por peso de palabras. */
export const Subtitulo: React.FC<{texto: string; inicio: number; fin: number; t: number}> = ({texto, inicio, fin, t}) => {
	const palabras = texto.split(/\s+/);
	const bloques: string[][] = [];
	let cur: string[] = [];
	for (const p of palabras) {
		const largo = [...cur, p].join(' ').length;
		if (cur.length && largo > 46) {
			bloques.push(cur);
			cur = [];
		}
		cur.push(p);
		if (/[.:?!…]$/.test(p) && cur.join(' ').length > 18) {
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
		<div style={{position: 'absolute', top: 1180, left: 80, right: 80, display: 'flex', justifyContent: 'center', opacity: o}}>
			<div style={{background: 'rgba(20,21,26,0.72)', borderRadius: 14, padding: '16px 30px', fontFamily: OSWALD, fontWeight: 500, fontSize: 60, lineHeight: 1.18, color: E60.blanco, textAlign: 'center', maxWidth: 900}}>
				{bloques[k].join(' ')}
			</div>
		</div>
	);
};

/** Anillo de 60 marcas: el tiempo para pensar se apaga marca a marca. */
export const AnilloDe60: React.FC<{t: number; inicio: number; fin: number}> = ({t, inicio, fin}) => {
	if (t < inicio - 0.5 || t > fin + 0.6) return null;
	const o = interpolate(t, [inicio - 0.5, inicio, fin, fin + 0.6], [0, 1, 1, 0], clamp);
	const frac = interpolate(t, [inicio, fin], [1, 0], clamp);
	const vivas = Math.ceil(frac * 60);
	const seg = Math.max(0, Math.ceil(fin - t));
	const R = 230;
	return (
		<div style={{position: 'absolute', top: 470, left: 540 - 290, width: 580, height: 580, opacity: o}}>
			<svg width={580} height={580} viewBox="-290 -290 580 580">
				<circle r={R - 40} fill="rgba(20,21,26,0.55)" />
				{Array.from({length: 60}, (_, i) => {
					const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
					const on = i < vivas;
					const ultima = i === vivas - 1;
					const l = i % 5 === 0 ? 34 : 22;
					return (
						<line
							key={i}
							x1={Math.cos(a) * R}
							y1={Math.sin(a) * R}
							x2={Math.cos(a) * (R - l)}
							y2={Math.sin(a) * (R - l)}
							stroke={on ? (ultima ? E60.cian : E60.plata) : 'rgba(184,190,200,0.12)'}
							strokeWidth={i % 5 === 0 ? 7 : 4}
							strokeLinecap="round"
						/>
					);
				})}
			</svg>
			<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
				<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 190, color: E60.blanco, lineHeight: 1}}>{seg}</div>
				<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 26, letterSpacing: 8, color: E60.cian, marginTop: 6}}>PIENSA</div>
			</div>
		</div>
	);
};

/** Cortina de dientes de engranaje plateados: firma del «clac». */
export const CortinaEngranajes: React.FC<{t: number; en: number}> = ({t, en}) => {
	const p = interpolate(t, [en, en + 0.5], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	if (p <= 0 || p >= 1) return null;
	const x = -400 + p * 1880;
	const dientes = Array.from({length: 26}, (_, i) => i * 80);
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<defs>
				<linearGradient id="plata" x1="0" x2="1">
					<stop offset="0" stopColor="#7d838c" />
					<stop offset="0.5" stopColor="#e3e7ee" />
					<stop offset="1" stopColor="#8a9099" />
				</linearGradient>
			</defs>
			<g transform={`translate(${x},0)`}>
				<rect x={-260} y={0} width={260} height={1920} fill="url(#plata)" />
				{dientes.map((y) => (
					<path key={y} d={`M0 ${y + 10} L46 ${y + 22} L46 ${y + 58} L0 ${y + 70} Z`} fill="url(#plata)" />
				))}
				{dientes.map((y) => (
					<path key={'b' + y} d={`M-260 ${y + 10} L-306 ${y + 22} L-306 ${y + 58} L-260 ${y + 70} Z`} fill="url(#plata)" />
				))}
			</g>
		</svg>
	);
};

/** Explicación visual (concepto 11): cada caja vale lo mismo. */
export const ExplicacionCajas: React.FC<{t: number; inicio: number; fin: number; valor: number}> = ({t, inicio, fin, valor}) => {
	if (t < inicio - 0.3 || t > fin + 0.8) return null;
	const o = interpolate(t, [inicio - 0.3, inicio + 0.2, fin + 0.3, fin + 0.8], [0, 1, 1, 0], clamp);
	const d = fin - inicio;
	const at = (f: number) => inicio + f * d;
	const rev = interpolate(t, [at(0.78), at(0.9)], [0, 1], clamp);
	const caja = (k: string, desde: number) => {
		const e = interpolate(t, [desde, desde + 0.3], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.8))});
		return (
			<div key={k} style={{width: 82, height: 82, borderRadius: 10, border: `4px solid ${E60.plata}`, background: rev > 0 ? `rgba(63,224,230,${0.25 * rev})` : 'rgba(184,190,200,0.12)', transform: `scale(${e})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 40, color: E60.cian}}>
				{rev > 0.5 ? valor : ''}
			</div>
		);
	};
	const fila = (letra: string, cajas: number, desde: number, extra?: string) => (
		<div style={{display: 'flex', alignItems: 'center', gap: 16, height: 96}}>
			<div style={{width: 70, fontFamily: MONO, fontWeight: 600, fontSize: 56, color: E60.blanco}}>{letra}</div>
			{Array.from({length: cajas}, (_, i) => caja(letra + i, desde + i * 0.15))}
			{extra && <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 52, color: E60.plata, opacity: interpolate(t, [desde + 0.3, desde + 0.6], [0, 1], clamp)}}>{extra}</div>}
			<div style={{flex: 1}} />
			<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 70, color: E60.cian, opacity: rev}}>{letra === 'A' ? 2 * valor : letra === 'B' ? valor : valor + 3}</div>
		</div>
	);
	const suma = interpolate(t, [at(0.55), at(0.65)], [0, 1], clamp);
	return (
		<div style={{position: 'absolute', top: 540, left: 90, right: 90, background: 'rgba(20,21,26,0.8)', border: `2px solid rgba(184,190,200,0.35)`, borderRadius: 18, padding: '30px 40px', opacity: o}}>
			{fila('A', 2, at(0.18))}
			{fila('B', 1, at(0.05))}
			{fila('C', 1, at(0.32), '+ 3')}
			<div style={{height: 2, background: 'rgba(184,190,200,0.35)', margin: '18px 0'}} />
			<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 46, color: E60.blanco, opacity: suma, textAlign: 'center'}}>
				4 cajas + 3 = 19 → 1 caja = <span style={{color: E60.cian}}>{valor}</span>
			</div>
		</div>
	);
};

/** Sello final E60 con aviso de IA. */
export const SelloE60: React.FC<{t: number; desde: number; aviso: string}> = ({t, desde, aviso}) => {
	const o = interpolate(t, [desde, desde + 0.6], [0, 1], clamp);
	if (o <= 0) return null;
	return (
		<div style={{position: 'absolute', top: 1400, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: o}}>
			<div style={{width: 120, height: 120, borderRadius: 60, border: `5px solid ${E60.plata}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 40, color: E60.blanco, boxShadow: `0 0 24px rgba(63,224,230,0.4)`}}>
				E<span style={{color: E60.cian}}>60</span>
			</div>
			<div style={{fontFamily: MONO, fontSize: 20, color: 'rgba(184,190,200,0.75)', letterSpacing: 2}}>{aviso}</div>
		</div>
	);
};
