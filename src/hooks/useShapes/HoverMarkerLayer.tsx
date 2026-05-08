import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';

import {renderHoverMarkers} from '~core/shapes/marker';
import type {SeriesShapeData} from '~core/shapes/types';

interface Props {
    preparedData: SeriesShapeData[];
    dispatcher?: Dispatch<object>;
    namespace: string;
}

export const HoverMarkerLayer = ({preparedData, dispatcher, namespace}: Props) => {
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) return () => {};

        const container = select(ref.current);

        function handleHover(data?: {data: unknown}[]) {
            const hoveredData = data?.map((d) => d.data) ?? [];
            const items = preparedData.flatMap((d) => d.getHoverMarkers(hoveredData));
            renderHoverMarkers(container, items);
        }

        dispatcher?.on(`hover-shape.${namespace}`, handleHover);

        return () => {
            dispatcher?.on(`hover-shape.${namespace}`, null);
        };
    }, [preparedData, dispatcher, namespace]);

    return <g ref={ref} />;
};
