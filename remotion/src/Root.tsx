import React from 'react';
import {Composition} from 'remotion';
import spec from './episodes/e60_cinco_sellos_proto.json';
import {CincoSellosProto} from './episodes/CincoSellosProto';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="E60CincoSellosProto"
		component={CincoSellosProto}
		durationInFrames={spec.duracion * spec.fps}
		fps={spec.fps}
		width={spec.ancho}
		height={spec.alto}
	/>
);
