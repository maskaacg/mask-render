import React from 'react';
import {Easing, interpolate} from 'remotion';
import {MONO, SERIF} from '../style/fonts';
import {E60} from '../e60/nucleo';

// Paneles de explicación del escape room «La torre del archivero» (16:9).
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const entra = (t: number, a: number, d = 0.4) => interpolate(t, [a, a + d], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.5))});
const ventana = (t: number, a: number, b: number, s = 0.4) => interpolate(t, [a - s, a, b, b + s], [0, 1, 1, 0], clamp);
const Panel: React.FC<{o: number; children: React.ReactNode; ancho?: number}> = ({o, children, ancho = 980}) => (
	<div style={{position: 'absolute', top: 170, left: 64, width: ancho, background: 'rgba(20,21,26,0.86)', border: '2px solid rgba(184,190,200,0.35)', borderRadius: 18, padding: '28px 36px', opacity: o}}>
		{children}
	</div>
);
const titulo = (txt: string) => <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 22, letterSpacing: 6, color: E60.cian, marginBottom: 18}}>{txt}</div>;
const COLOR: Record<string, string> = {rojo: '#d8473e', azul: '#4f7fe0', verde: '#4fb062'};

/** P1 · tres escudos: el rojo no va en el 1 y el azul va a su derecha → rojo 2, azul 3, verde 1. */
export const ExpEscudos: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	const pasos = [
		{gancho: 2, c: 'rojo', f: 0.22, nota: 'no en el 1, y con hueco a su derecha'},
		{gancho: 3, c: 'azul', f: 0.4, nota: 'a la derecha del rojo'},
		{gancho: 1, c: 'verde', f: 0.58, nota: 'el único sitio libre'},
	];
	return (
		<Panel o={o} ancho={900}>
			{titulo('GANCHOS 1 · 2 · 3')}
			<div style={{display: 'flex', gap: 30, justifyContent: 'center', marginBottom: 18}}>
				{[1, 2, 3].map((g) => {
					const p = pasos.find((x) => x.gancho === g)!;
					const e = entra(t, a + p.f * d);
					return (
						<div key={g} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
							<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, color: E60.plata}}>{g}</div>
							<div style={{width: 150, height: 170, borderRadius: '14px 14px 75px 75px', border: `4px solid ${e > 0.5 ? COLOR[p.c] : 'rgba(184,190,200,0.4)'}`, background: e > 0.5 ? `${COLOR[p.c]}55` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.85 + 0.15 * e})`}}>
								<span style={{fontFamily: SERIF, fontWeight: 800, fontSize: 38, color: E60.blanco, opacity: e}}>{p.c.toUpperCase()}</span>
							</div>
						</div>
					);
				})}
			</div>
			{pasos.map((p, i) => (
				<div key={i} style={{display: 'flex', gap: 18, alignItems: 'baseline', height: 44, opacity: entra(t, a + p.f * d)}}>
					<span style={{fontFamily: MONO, fontWeight: 600, fontSize: 28, color: COLOR[p.c], width: 110}}>{p.c}</span>
					<span style={{fontFamily: MONO, fontSize: 26, color: E60.plata}}>→ gancho {p.gancho}: {p.nota}</span>
				</div>
			))}
		</Panel>
	);
};

/** P2 · César −3: cada letra cifrada retrocede tres posiciones. */
export const ExpCifrado: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	const cif = 'HO WLHPSR QR SHUGRQD'.split(' ');
	const cla = 'EL TIEMPO NO PERDONA'.split(' ');
	const tiempos = [0.08, 0.22, 0.66, 0.78];
	return (
		<Panel o={o} ancho={1180}>
			{titulo('CADA LETRA, TRES POSICIONES ATRÁS')}
			<div style={{display: 'flex', gap: 34, flexWrap: 'wrap'}}>
				{cif.map((w, i) => {
					const e = entra(t, a + tiempos[i] * d, 0.5);
					const clave = i === 1;
					return (
						<div key={i} style={{display: 'flex', gap: 6}}>
							{w.split('').map((ch, j) => {
								const ej = entra(t, a + tiempos[i] * d + j * 0.12, 0.3);
								return (
									<div key={j} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 46}}>
										<span style={{fontFamily: MONO, fontWeight: 600, fontSize: 34, color: E60.plata}}>{ch}</span>
										<span style={{fontFamily: MONO, fontSize: 18, color: 'rgba(184,190,200,0.6)', opacity: ej}}>−3</span>
										<span style={{fontFamily: MONO, fontWeight: 600, fontSize: 40, color: clave ? E60.cian : E60.blanco, opacity: ej, transform: `scale(${0.7 + 0.3 * ej})`, textShadow: clave && e > 0.9 ? '0 0 14px rgba(63,224,230,0.7)' : 'none'}}>{cla[i][j]}</span>
									</div>
								);
							})}
						</div>
					);
				})}
			</div>
			<div style={{marginTop: 18, fontFamily: MONO, fontSize: 24, color: E60.plata, opacity: entra(t, a + 0.9 * d)}}>
				Segunda palabra → <span style={{color: E60.cian, fontWeight: 600}}>TIEMPO</span> abre el criptex
			</div>
		</Panel>
	);
};

/** P3 · serie: cada número es la suma de los dos anteriores → 13. */
export const ExpFibonacci: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	const v = [1, 1, 2, 3, 5, 8, 13];
	return (
		<Panel o={o} ancho={1060}>
			{titulo('CADA PELDAÑO = LOS DOS ANTERIORES')}
			<div style={{display: 'flex', alignItems: 'flex-end', gap: 16}}>
				{v.map((x, i) => {
					const e = entra(t, a + (i < 2 ? 0.05 : 0.08 + (i - 1) * 0.11) * d, 0.35);
					const ult = i === 6;
					return (
						<div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: e}}>
							{i > 1 && <div style={{fontFamily: MONO, fontSize: 22, color: ult ? E60.cian : E60.plata}}>{v[i - 2]}+{v[i - 1]}</div>}
							<div style={{width: 110, height: 40 + i * 30, background: ult ? 'rgba(63,224,230,0.32)' : 'rgba(184,190,200,0.2)', border: `3px solid ${ult ? E60.cian : E60.plata}`, borderRadius: 6, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 6}}>
								<span style={{fontFamily: SERIF, fontWeight: 800, fontSize: 44, color: ult ? E60.cian : E60.blanco}}>{x}</span>
							</div>
						</div>
					);
				})}
			</div>
		</Panel>
	);
};

/** P4 · tres armaduras, solo una dice la verdad: tabla de verdad por llave. */
export const ExpGuardias: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	// verdad[llave][armadura]: I «oro abre», II «plata no abre», III «oro no abre»
	const filas = [
		{llave: 'ORO', v: [true, true, false], f: 0.12},
		{llave: 'HIERRO', v: [false, true, true], f: 0.42},
		{llave: 'PLATA', v: [false, false, true], f: 0.66},
	];
	return (
		<Panel o={o} ancho={980}>
			{titulo('SI ABRE LA LLAVE DE…   ¿QUIÉN DICE LA VERDAD?')}
			<div style={{display: 'flex', gap: 20, paddingLeft: 200, marginBottom: 6}}>
				{['I', 'II', 'III'].map((g) => (
					<div key={g} style={{width: 120, textAlign: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 26, color: E60.plata}}>{g}</div>
				))}
				<div style={{width: 160, textAlign: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 22, color: E60.plata}}>VERDADES</div>
			</div>
			{filas.map((f, i) => {
				const e = entra(t, a + f.f * d);
				const n = f.v.filter(Boolean).length;
				const ok = n === 1;
				return (
					<div key={i} style={{display: 'flex', gap: 20, alignItems: 'center', height: 84, opacity: e, background: ok && e > 0.9 ? 'rgba(63,224,230,0.12)' : 'transparent', borderRadius: 10}}>
						<div style={{width: 180, fontFamily: MONO, fontWeight: 600, fontSize: 32, color: ok ? E60.cian : E60.blanco, paddingLeft: 14}}>{f.llave}</div>
						{f.v.map((x, j) => (
							<div key={j} style={{width: 120, textAlign: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 40, color: x ? '#7fe08a' : '#e07a6a'}}>{x ? '✓' : '✗'}</div>
						))}
						<div style={{width: 160, textAlign: 'center', fontFamily: SERIF, fontWeight: 800, fontSize: 50, color: ok ? E60.cian : '#e07a6a'}}>{n}</div>
					</div>
				);
			})}
		</Panel>
	);
};
