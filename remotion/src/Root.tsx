import React from 'react';
import {Composition} from 'remotion';
import spec from './episodes/e60_cinco_sellos_proto.json';
import {CincoSellosProto} from './episodes/CincoSellosProto';
import {ShortEpisode} from './shorts/ShortEpisode';
import {Props, planificar} from './shorts/timeline';
import fichaEjemplo from '../fichas/E60-2026-11-16-corto.json';

// Props de ejemplo para el Studio; en producción llegan con --props=out/props_<id>.json
const ejemplo: Props = {
	ficha: fichaEjemplo as unknown as Props['ficha'],
	duraciones: Object.fromEntries(fichaEjemplo.lineas.map((l) => [l.id, 3])),
};

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="E60CincoSellosProto"
			component={CincoSellosProto}
			durationInFrames={spec.duracion * spec.fps}
			fps={spec.fps}
			width={spec.ancho}
			height={spec.alto}
		/>
		<Composition
			id="E60Corto"
			component={ShortEpisode}
			defaultProps={ejemplo}
			fps={30}
			width={1080}
			height={1920}
			durationInFrames={30 * 60}
			calculateMetadata={({props}) => ({
				durationInFrames: Math.ceil(planificar(props).total * props.ficha.fps),
				fps: props.ficha.fps,
				width: props.ficha.ancho,
				height: props.ficha.alto,
			})}
		/>
	</>
);
