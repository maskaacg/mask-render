import React from 'react';
import {Easing, interpolate} from 'remotion';
import {MONO, SERIF} from '../style/fonts';
import {E60} from '../e60/nucleo';

// Paneles de explicación del escape room 2 «El museo que miente» (16:9). Mismo estilo que uiER.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const entra = (t: number, a: number, d = 0.4) => interpolate(t, [a, a + d], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.5))});
const ventana = (t: number, a: number, b: number, s = 0.4) => interpolate(t, [a - s, a, b, b + s], [0, 1, 1, 0], clamp);
const Panel: React.FC<{o: number; children: React.ReactNode; ancho?: number}> = ({o, children, ancho = 980}) => (
	<div style={{position: 'absolute', top: 170, left: 64, width: ancho, background: 'rgba(16,17,21,0.96)', border: '2px solid rgba(184,190,200,0.35)', borderRadius: 18, padding: '28px 36px', opacity: o}}>
		{children}
	</div>
);
const titulo = (txt: string) => <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 22, letterSpacing: 6, color: E60.cian, marginBottom: 18}}>{txt}</div>;
const ORO = '#d4af37';
const PLATA = '#c8ccd2';
const MEZCLA = 'linear-gradient(90deg, #d4af37 50%, #c8ccd2 50%)';

/** P1 · todas las placas mienten; de «Oro y plata» sale plata. */
export const ExpVitrinas: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	const filas = [
		{placa: 'ORO Y PLATA', real: 'PLATA', fondo: PLATA, f: 0.08, nota: 'ha salido plata y la placa miente'},
		{placa: 'PLATA', real: 'ORO', fondo: ORO, f: 0.38, nota: 'no es plata; la plata ya está ocupada'},
		{placa: 'ORO', real: 'ORO Y PLATA', fondo: MEZCLA, f: 0.62, nota: 'la única que queda'},
	];
	return (
		<Panel o={o} ancho={1080}>
			{titulo('LA PLACA DICE…   →   DE VERDAD HAY')}
			{filas.map((r, i) => {
				const e = entra(t, a + r.f * d);
				return (
					<div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, minHeight: 96, opacity: e}}>
						<div style={{width: 270, padding: '10px 0', textAlign: 'center', fontFamily: SERIF, fontWeight: 800, fontSize: 30, color: '#2a1a08', background: '#c9a24a', borderRadius: 8, position: 'relative', flexShrink: 0}}>
							{r.placa}
							<div style={{position: 'absolute', left: 12, right: 12, top: '50%', height: 4, background: '#a01010', transform: `scaleX(${e}) rotate(-4deg)`, transformOrigin: 'left'}} />
						</div>
						<div style={{fontFamily: MONO, fontSize: 40, color: E60.plata}}>→</div>
						<div style={{width: 250, padding: '10px 0', textAlign: 'center', fontFamily: SERIF, fontWeight: 800, fontSize: 30, color: '#1a1206', background: r.fondo, borderRadius: 8, flexShrink: 0}}>{r.real}</div>
						<div style={{fontFamily: MONO, fontSize: 23, color: E60.plata, lineHeight: 1.3}}>{r.nota}</div>
					</div>
				);
			})}
		</Panel>
	);
};

/** P2 · MDCCCLXXXIX = 1889. */
export const ExpRomanos: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	const grupos = [
		{l: 'M', v: 1000},
		{l: 'D', v: 500},
		{l: 'CCC', v: 300},
		{l: 'L', v: 50},
		{l: 'XXX', v: 30},
		{l: 'IX', v: 9, resta: true},
	];
	const total = entra(t, a + 0.78 * d, 0.5);
	return (
		<Panel o={o} ancho={1140}>
			{titulo('NÚMEROS ROMANOS: SE SUMAN… Y I DELANTE DE X RESTA')}
			<div style={{display: 'flex', gap: 18, alignItems: 'flex-start'}}>
				{grupos.map((g, i) => {
					const e = entra(t, a + (0.05 + i * 0.11) * d, 0.35);
					return (
						<React.Fragment key={i}>
							{i > 0 && <div style={{fontFamily: MONO, fontSize: 36, color: E60.plata, paddingTop: 18, opacity: e}}>+</div>}
							<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: e, transform: `translateY(${(1 - e) * 12}px)`}}>
								<div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 52, color: g.resta ? E60.cian : E60.blanco, letterSpacing: 2}}>{g.l}</div>
								<div style={{fontFamily: MONO, fontWeight: 600, fontSize: 30, color: g.resta ? E60.cian : E60.plata}}>{g.v}</div>
								{g.resta && <div style={{fontFamily: MONO, fontSize: 20, color: E60.plata}}>10 − 1</div>}
							</div>
						</React.Fragment>
					);
				})}
			</div>
			<div style={{marginTop: 22, display: 'flex', alignItems: 'baseline', gap: 20, opacity: total}}>
				<span style={{fontFamily: MONO, fontSize: 26, color: E60.plata}}>Año verdadero =</span>
				<span style={{fontFamily: SERIF, fontWeight: 800, fontSize: 72, color: E60.cian, textShadow: '0 0 14px rgba(63,224,230,0.6)'}}>1889</span>
				<span style={{fontFamily: MONO, fontSize: 24, color: '#e07a6a', textDecoration: 'line-through'}}>1999</span>
			</div>
		</Panel>
	);
};

const Gatos: React.FC<{n: number; color?: string; ligero?: boolean}> = ({n, color = E60.plata, ligero}) => (
	<div style={{display: 'flex', gap: 6}}>
		{Array.from({length: n}, (_, i) => (
			<div key={i} style={{width: 22, height: 30, borderRadius: '11px 11px 6px 6px', border: `3px solid ${color}`, background: ligero ? 'transparent' : 'rgba(184,190,200,0.15)'}} />
		))}
	</div>
);

/** P3 · 8 gatos, uno más ligero: 2 pesadas. */
export const ExpBalanza: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	const e1 = entra(t, a + 0.06 * d);
	const e2 = entra(t, a + 0.3 * d);
	const e3 = entra(t, a + 0.48 * d);
	const e4 = entra(t, a + 0.74 * d);
	const caja = (o2: number, children: React.ReactNode, color = 'rgba(184,190,200,0.35)') => (
		<div style={{opacity: o2, border: `2px solid ${color}`, borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10}}>{children}</div>
	);
	const txt = (s: string, c = E60.plata, size = 23) => <div style={{fontFamily: MONO, fontSize: size, color: c, lineHeight: 1.3}}>{s}</div>;
	return (
		<Panel o={o} ancho={1140}>
			{titulo('8 GATOS · 1 MÁS LIGERO · ¿CUÁNTAS PESADAS?')}
			{caja(
				e1,
				<>
					{txt('1.ª PESADA', E60.cian, 22)}
					<div style={{display: 'flex', alignItems: 'center', gap: 22}}>
						<Gatos n={3} />
						{txt('⚖', E60.blanco, 34)}
						<Gatos n={3} />
						{txt('fuera:', E60.plata, 22)}
						<Gatos n={2} />
					</div>
				</>,
			)}
			<div style={{display: 'flex', gap: 18, marginTop: 14}}>
				<div style={{flex: 1}}>
					{caja(
						e2,
						<>
							{txt('SI SE EQUILIBRA', E60.cian, 21)}
							{txt('El falso está fuera: 1 contra 1')}
						</>,
					)}
				</div>
				<div style={{flex: 1}}>
					{caja(
						e3,
						<>
							{txt('SI SE INCLINA', E60.cian, 21)}
							{txt('En el plato que sube: 1 contra 1. Si igualan, es el 3.º')}
						</>,
					)}
				</div>
			</div>
			<div style={{marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 26, opacity: e4}}>
				{txt('1 pesada → 3 resultados < 8', '#e07a6a', 24)}
				{txt('2 pesadas → 9 resultados ≥ 8', '#7fe08a', 24)}
				<span style={{fontFamily: SERIF, fontWeight: 800, fontSize: 60, color: E60.cian}}>2</span>
			</div>
		</Panel>
	);
};

/** P4 · uno siempre miente y otro nunca: «al menos uno miente» solo puede decirlo el sincero. */
export const ExpVigilantes: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
	const o = ventana(t, a, b, 0.4);
	if (o <= 0) return null;
	const d = b - a;
	const filas = [
		{sup: 'Vela derecha', r: 'la llama se tumba → entra aire de la calle', ok: true, f: 0.08},
		{sup: 'Vela izquierda', r: 'llama quieta → detrás, el sótano sellado', ok: false, f: 0.45},
		{sup: 'Cartel «SALIDA»', r: 'señala la izquierda… y aquí todo miente', ok: false, f: 0.75},
	];
	return (
		<Panel o={o} ancho={1100}>
			{titulo('¿POR QUÉ PUERTA ENTRA EL AIRE DE LA CALLE?')}
			{filas.map((r, i) => {
				const e = entra(t, a + r.f * d);
				return (
					<div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, minHeight: 92, opacity: e, background: r.ok && e > 0.9 ? 'rgba(63,224,230,0.10)' : 'transparent', borderRadius: 10, padding: '0 12px'}}>
						<div style={{width: 330, fontFamily: MONO, fontWeight: 600, fontSize: 27, color: E60.blanco, flexShrink: 0}}>{r.sup}</div>
						<div style={{flex: 1, fontFamily: MONO, fontSize: 24, color: E60.plata, lineHeight: 1.3}}>{r.r}</div>
						<div style={{width: 60, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 44, color: r.ok ? '#7fe08a' : '#e07a6a'}}>{r.ok ? '✓' : '✗'}</div>
					</div>
				);
			})}
			<div style={{marginTop: 12, fontFamily: MONO, fontSize: 26, color: E60.plata, opacity: entra(t, a + 0.4 * d)}}>
				Salida → <span style={{fontFamily: SERIF, fontWeight: 800, fontSize: 44, color: E60.cian}}>PUERTA DERECHA</span>
			</div>
		</Panel>
	);
};

/** Reloj de la alarma (sustituye a la vela de la torre): hora actual y hora de la alarma. */
export const RelojHUD: React.FC<{t: number; desde: number; hasta: number; minutos: number}> = ({t, desde, hasta, minutos}) => {
	const o = interpolate(t, [desde, desde + 0.8, hasta, hasta + 0.8], [0, 1, 1, 0], clamp);
	if (o <= 0) return null;
	const m = Math.min(30, Math.floor(minutos));
	const quedan = 30 - m;
	const urgente = quedan <= 10;
	const pulso = urgente ? 0.75 + 0.25 * Math.sin(t * 6) : 1;
	return (
		<div style={{position: 'absolute', right: 70, top: 150, opacity: o, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, padding: '12px 22px', borderRadius: 14, background: 'rgba(16,17,21,0.88)', border: `2px solid ${urgente ? `rgba(224,90,80,${pulso})` : 'rgba(184,190,200,0.35)'}`}}>
			<div style={{fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: E60.plata}}>ALARMA 00:30</div>
			<div style={{fontFamily: MONO, fontWeight: 700, fontSize: 46, color: urgente ? '#ff8a7a' : E60.blanco}}>00:{String(m).padStart(2, '0')}</div>
		</div>
	);
};
