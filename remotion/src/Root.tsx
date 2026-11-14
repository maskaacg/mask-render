import React from 'react';
import {Composition} from 'remotion';
import spec from './episodes/e60_cinco_sellos_proto.json';
import {CincoSellosProto} from './episodes/CincoSellosProto';
import {ShortEpisode} from './shorts/ShortEpisode';
import {Props, planificar} from './shorts/timeline';
import {CortoPlano} from './plano/CortoPlano';
import {Historia} from './historia/Historia';
import {PropsH, planificarH} from './historia/plan';
import fichaProto from '../fichas/E60-PROTO-historia-01.json';
import {E60Estilo10} from './style/Estilos10';
import {E60Estilo} from './style/Estilos';
import fichaEjemplo from '../fichas/E60-2026-11-16-corto.json';
import {Diorama} from './diorama/Diorama';
import {PropsD, planificarD} from './diorama/plan';
import fichaDiorama from '../fichas/E60-PROTO-diorama-01.json';

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
		<Composition
			id="E60CortoPlano"
			component={CortoPlano}
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
		<Composition
			id="E60Historia"
			component={Historia}
			defaultProps={{ficha: fichaProto as unknown as PropsH['ficha'], duraciones: {}} as PropsH}
			fps={30}
			width={1080}
			height={1920}
			durationInFrames={30 * 90}
			calculateMetadata={({props}) => ({
				durationInFrames: Math.ceil(planificarH(props).total * props.ficha.fps),
				fps: props.ficha.fps,
				width: props.ficha.ancho,
				height: props.ficha.alto,
			})}
		/>
		<Composition
			id="E60Diorama"
			component={Diorama}
			defaultProps={{ficha: fichaDiorama as unknown as PropsD['ficha'], duraciones: {}} as PropsD}
			fps={30}
			width={1080}
			height={1920}
			durationInFrames={30 * 90}
			calculateMetadata={({props}) => ({
				durationInFrames: Math.ceil(planificarD(props).total * props.ficha.fps),
				fps: props.ficha.fps,
				width: props.ficha.ancho,
				height: props.ficha.alto,
			})}
		/>
		<Composition id="E60Estilo10" component={E60Estilo10} defaultProps={{estilo: 'isla3d' as const}} fps={30} width={1080} height={1920} durationInFrames={30} />
		<Composition id="E60Estilo" component={E60Estilo} defaultProps={{estilo: 'plano' as const}} fps={30} width={1080} height={1920} durationInFrames={30} />
	</>
);
