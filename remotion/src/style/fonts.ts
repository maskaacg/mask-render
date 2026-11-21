import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fuentes OFL-1.1 (Fontsource 5.3.0), incluidas en public/fonts. Ver public/fonts/LICENCIAS.md.
const F = [
	['Architects Daughter', 'architects-daughter-latin-400-normal.woff2', '400', 'normal'],
	['Bebas Neue', 'bebas-neue-latin-400-normal.woff2', '400', 'normal'],
	['Fraunces', 'fraunces-latin-600-normal.woff2', '600', 'normal'],
	['Fraunces', 'fraunces-latin-800-normal.woff2', '800', 'normal'],
	['Fraunces', 'fraunces-latin-500-italic.woff2', '500', 'italic'],
	['IBM Plex Mono', 'ibm-plex-mono-latin-400-normal.woff2', '400', 'normal'],
	['IBM Plex Mono', 'ibm-plex-mono-latin-600-normal.woff2', '600', 'normal'],
	['Oswald', 'oswald-latin-300-normal.woff2', '300', 'normal'],
	['Oswald', 'oswald-latin-500-normal.woff2', '500', 'normal'],
] as const;

let cargadas = false;
export const cargarFuentes = () => {
	if (cargadas) return;
	cargadas = true;
	for (const [family, file, weight, style] of F) {
		loadFont({family, url: staticFile(`fonts/${file}`), weight, style, format: 'woff2'});
	}
};

export const HAND = "'Architects Daughter', cursive";
export const MONO = "'IBM Plex Mono', monospace";
export const SERIF = "'Fraunces', serif";
export const BEBAS = "'Bebas Neue', sans-serif";
export const OSWALD = "'Oswald', sans-serif";
