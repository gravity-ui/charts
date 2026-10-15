import React from 'react';

import {getChartTargets, registerInteractionLayer} from '../../core/utils/chart-interaction';

/** Rectangular user-space clips, as used by the built-in shape layers. */
export function InteractionClippingTestStory() {
    const plot = React.useRef<SVGGElement>(null);
    const rect = React.useRef<SVGRectElement>(null);
    const [targets, setTargets] = React.useState<string[]>([]);
    React.useEffect(() => {
        const element = rect.current;
        const layer = plot.current;
        if (!element || !layer) return undefined;
        return registerInteractionLayer(layer, () => [
            {
                element,
                item: {
                    point: {x: 0, y: 1},
                    series: {type: 'bar-x', id: 'bar', name: 'Bar'},
                },
            },
        ]);
    }, []);
    return (
        <React.Fragment>
            <svg
                width={220}
                height={160}
                onClick={(event) =>
                    setTargets(
                        getChartTargets(event.currentTarget, [event.clientX, event.clientY]).map(
                            (item) => item.series.name,
                        ),
                    )
                }
            >
                <defs>
                    <clipPath id="interaction-clip">
                        <rect width={60} height={60} />
                    </clipPath>
                </defs>
                <g transform="translate(40, 30)" clipPath="url(#interaction-clip)">
                    <g ref={plot} transform="scale(2)">
                        <rect ref={rect} width={50} height={50} fill="steelblue" />
                    </g>
                </g>
            </svg>
            <output data-qa="clipped-targets">{JSON.stringify(targets)}</output>
        </React.Fragment>
    );
}
