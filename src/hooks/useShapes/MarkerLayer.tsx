import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';

import {renderHoverMarkers, renderMarkers} from '~core/shapes/marker';
import type {HoveredShapeData, MarkerItem, SeriesShapeData} from '~core/shapes/types';

interface Props {
    preparedData: SeriesShapeData[];
    dispatcher?: Dispatch<object>;
    namespace: string;
    elementRef?: React.RefObject<SVGGElement>;
}

export const MarkerLayer = ({preparedData, dispatcher, namespace, elementRef}: Props) => {
    const ref = React.useRef<SVGGElement>(null);
    const hoverRef = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current || !hoverRef.current) return () => {};

        const hoverContainer = select(hoverRef.current);
        const normalMarkers = renderMarkers(
            select(ref.current),
            preparedData.flatMap((d) => d.markers),
        );
        const markersByData = new Map<unknown, {marker: MarkerItem; element: SVGGElement}[]>();
        normalMarkers.each(function (marker) {
            const entries = markersByData.get(marker.data) ?? [];
            entries.push({marker, element: this});
            markersByData.set(marker.data, entries);
        });
        let hidden: SVGGElement[] = [];

        function handleHover(data?: HoveredShapeData[]) {
            for (const element of hidden) {
                select(element).attr('visibility', null);
            }
            hidden = [];
            const items = preparedData.flatMap((d) => d.getHoverMarkers(data ?? []));
            for (const item of items) {
                // One raw point can back several series or boundary markers.
                for (const {marker, element} of markersByData.get(item.data) ?? []) {
                    if (
                        marker.series.id === item.series.id &&
                        marker.cx === item.cx &&
                        marker.cy === item.cy
                    ) {
                        select(element).attr('visibility', 'hidden');
                        hidden.push(element);
                    }
                }
            }
            renderHoverMarkers(hoverContainer, items);
        }

        handleHover();
        dispatcher?.on(`hover-shape.${namespace}`, handleHover);

        return () => {
            dispatcher?.on(`hover-shape.${namespace}`, null);
        };
    }, [preparedData, dispatcher, namespace]);

    return (
        <g ref={elementRef}>
            <g ref={ref} />
            <g ref={hoverRef} />
        </g>
    );
};
