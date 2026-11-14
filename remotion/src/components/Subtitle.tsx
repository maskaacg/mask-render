import React from 'react';

/**
 * Subtítulo dentro de una zona fija [x0,y0,x1,y1].
 * El navegador ajusta las líneas; nunca se recorta texto: si no cabe en la zona,
 * el control de calidad (tools/qa_proto.py) lo detecta en la captura.
 */
export const Subtitle: React.FC<{
	text: string;
	opacity: number;
	zone: [number, number, number, number];
}> = ({text, opacity, zone}) => {
	const [x0, y0, x1, y1] = zone;
	return (
		<div
			style={{
				position: 'absolute',
				left: x0,
				top: y0,
				width: x1 - x0,
				height: y1 - y0,
				display: 'flex',
				alignItems: 'flex-start',
				justifyContent: 'center',
				opacity,
			}}
		>
			<div
				data-subtitle
				style={{
					maxWidth: '100%',
					padding: '22px 34px',
					borderRadius: 22,
					background: 'rgba(6,12,13,0.72)',
					color: '#f5ead2',
					fontFamily: 'DejaVu Sans, Arial, sans-serif',
					fontSize: 52,
					fontWeight: 700,
					lineHeight: 1.18,
					textAlign: 'center',
					overflowWrap: 'break-word',
					transform: `translateY(${(1 - opacity) * 12}px)`,
				}}
			>
				{text}
			</div>
		</div>
	);
};
