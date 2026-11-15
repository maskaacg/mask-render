import React from 'react';
import {Composition} from 'remotion';
import spec from './episodes/e60_cinco_sellos_proto.json';
import {CincoSellosProto} from './episodes/CincoSellosProto';
import {ShortEpisode} from './shorts/ShortEpisode';
import {Props, planificar} from './shorts/timeline';
import {CortoPlano} from './plano/CortoPlano';
import {CortoTorre} from './escape/CortoTorre';
import {Historia} from './historia/Historia';
import {PropsH, planificarH} from './historia/plan';
import fichaProto from '../fichas/E60-PROTO-historia-01.json';
import {E60Estilo10} from './style/Estilos10';
import {E60Estilo} from './style/Estilos';
import fichaEjemplo from '../fichas/E60-2026-11-16-corto.json';
import {Diorama} from './diorama/Diorama';
import {PropsD, planificarD} from './diorama/plan';
import fichaDiorama from '../fichas/E60-PROTO-diorama-01.json';
import {Capitulo, CapituloAudio} from './capitulo/Capitulo';
import {PropsC, planificarC} from './capitulo/plan';
import fichaC01 from '../fichas/E60-S01-C01.json';
import {EscapeRoom, EscapeRoomAudio} from './escape/EscapeRoom';
import fichaER01 from '../fichas/E60-ER-001.json';
import {AvanceTorre, AvanceTorreAudio, PropsT, planificarT} from './escape/AvanceTorre';
import fichaER01T from '../fichas/E60-ER-001-T.json';
import {MiniaturaTorre} from './escape/MiniaturaTorre';
import {MuseoEscape, MuseoEscapeAudio} from './escape/MuseoEscape';
import fichaER02 from '../fichas/E60-ER-002.json';
import {AvanceMuseo, AvanceMuseoAudio} from './escape/AvanceMuseo';
import fichaER02T from '../fichas/E60-ER-002-T.json';
import {MiniaturaMuseo} from './escape/MiniaturaMuseo';

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
			id="E60CortoTorre"
			component={CortoTorre}
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
		<Composition
			id="E60Capitulo"
			component={Capitulo}
			defaultProps={{ficha: fichaC01 as unknown as PropsC['ficha'], duraciones: {}} as PropsC}
			fps={24}
			width={1920}
			height={1080}
			durationInFrames={24 * 600}
			calculateMetadata={({props}) => ({
				durationInFrames: Math.ceil(planificarC(props).total * props.ficha.fps),
				fps: props.ficha.fps,
				width: props.ficha.ancho,
				height: props.ficha.alto,
			})}
		/>
		<Composition
			id="E60CapituloAudio"
			component={CapituloAudio}
			defaultProps={{ficha: fichaC01 as unknown as PropsC['ficha'], duraciones: {}} as PropsC}
			fps={24}
			width={1920}
			height={1080}
			durationInFrames={24 * 600}
			calculateMetadata={({props}) => ({
				durationInFrames: Math.ceil(planificarC(props).total * props.ficha.fps),
				fps: props.ficha.fps,
				width: props.ficha.ancho,
				height: props.ficha.alto,
			})}
		/>
		<Composition
			id="E60EscapeRoom"
			component={EscapeRoom}
			defaultProps={{ficha: fichaER01 as unknown as PropsC['ficha'], duraciones: {}} as PropsC}
			fps={24}
			width={1920}
			height={1080}
			durationInFrames={24 * 600}
			calculateMetadata={({props}) => ({
				durationInFrames: Math.ceil(planificarC(props).total * props.ficha.fps),
				fps: props.ficha.fps,
				width: props.ficha.ancho,
				height: props.ficha.alto,
			})}
		/>
		<Composition
			id="E60EscapeRoomAudio"
			component={EscapeRoomAudio}
			defaultProps={{ficha: fichaER01 as unknown as PropsC['ficha'], duraciones: {}} as PropsC}
			fps={24}
			width={1920}
			height={1080}
			durationInFrames={24 * 600}
			calculateMetadata={({props}) => ({
				durationInFrames: Math.ceil(planificarC(props).total * props.ficha.fps),
				fps: props.ficha.fps,
				width: props.ficha.ancho,
				height: props.ficha.alto,
			})}
		/>
		<Composition
			id="E60AvanceTorre"
			component={AvanceTorre}
			defaultProps={{ficha: fichaER01T as unknown as PropsT['ficha'], duraciones: {}} as PropsT}
			fps={24}
			width={1080}
			height={1920}
			durationInFrames={24 * 90}
			calculateMetadata={({props}) => ({
				durationInFrames: Math.ceil(planificarT(props).total * props.ficha.fps),
				fps: props.ficha.fps,
				width: props.ficha.ancho,
				height: props.ficha.alto,
			})}
		/>
		<Composition
			id="E60AvanceTorreAudio"
			component={AvanceTorreAudio}
			defaultProps={{ficha: fichaER01T as unknown as PropsT['ficha'], duraciones: {}} as PropsT}
			fps={24}
			width={1080}
			height={1920}
			durationInFrames={24 * 90}
			calculateMetadata={({props}) => ({
				durationInFrames: Math.ceil(planificarT(props).total * props.ficha.fps),
				fps: props.ficha.fps,
				width: props.ficha.ancho,
				height: props.ficha.alto,
			})}
		/>
		<Composition
			id="E60EscapeMuseo"
			component={MuseoEscape}
			defaultProps={{ficha: fichaER02 as unknown as PropsC['ficha'], duraciones: {}} as PropsC}
			fps={24}
			width={1920}
			height={1080}
			durationInFrames={24 * 600}
			calculateMetadata={({props}) => ({
				durationInFrames: Math.ceil(planificarC(props).total * props.ficha.fps),
				fps: props.ficha.fps,
				width: props.ficha.ancho,
				height: props.ficha.alto,
			})}
		/>
		<Composition
			id="E60EscapeMuseoAudio"
			component={MuseoEscapeAudio}
			defaultProps={{ficha: fichaER02 as unknown as PropsC['ficha'], duraciones: {}} as PropsC}
			fps={24}
			width={1920}
			height={1080}
			durationInFrames={24 * 600}
			calculateMetadata={({props}) => ({
				durationInFrames: Math.ceil(planificarC(props).total * props.ficha.fps),
				fps: props.ficha.fps,
				width: props.ficha.ancho,
				height: props.ficha.alto,
			})}
		/>
		<Composition
			id="E60AvanceMuseo"
			component={AvanceMuseo}
			defaultProps={{ficha: fichaER02T as unknown as PropsT['ficha'], duraciones: {}} as PropsT}
			fps={24}
			width={1080}
			height={1920}
			durationInFrames={24 * 90}
			calculateMetadata={({props}) => ({
				durationInFrames: Math.ceil(planificarT(props).total * props.ficha.fps),
				fps: props.ficha.fps,
				width: props.ficha.ancho,
				height: props.ficha.alto,
			})}
		/>
		<Composition
			id="E60AvanceMuseoAudio"
			component={AvanceMuseoAudio}
			defaultProps={{ficha: fichaER02T as unknown as PropsT['ficha'], duraciones: {}} as PropsT}
			fps={24}
			width={1080}
			height={1920}
			durationInFrames={24 * 90}
			calculateMetadata={({props}) => ({
				durationInFrames: Math.ceil(planificarT(props).total * props.ficha.fps),
				fps: props.ficha.fps,
				width: props.ficha.ancho,
				height: props.ficha.alto,
			})}
		/>
		<Composition id="E60MiniaturaMuseo" component={MiniaturaMuseo} fps={24} width={1280} height={720} durationInFrames={1} defaultProps={{vertical: false}} />
		<Composition id="E60PortadaMuseo" component={MiniaturaMuseo} fps={24} width={1080} height={1920} durationInFrames={1} defaultProps={{vertical: true}} />
		<Composition id="E60Estilo10" component={E60Estilo10} defaultProps={{estilo: 'isla3d' as const}} fps={30} width={1080} height={1920} durationInFrames={30} />
		<Composition id="E60Estilo" component={E60Estilo} defaultProps={{estilo: 'plano' as const}} fps={30} width={1080} height={1920} durationInFrames={30} />
			<Composition id="E60MiniaturaTorre" component={MiniaturaTorre} fps={24} width={1280} height={720} durationInFrames={1} defaultProps={{vertical: false}} />
		<Composition id="E60PortadaTorre" component={MiniaturaTorre} fps={24} width={1080} height={1920} durationInFrames={1} defaultProps={{vertical: true}} />
	</>
);
