import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';

import {renderMarkers, setMarkerStyles} from '~core/shapes/marker';
import type {HoveredShapeData, MarkerItem} from '~core/shapes/types';

interface Props {
    markers: MarkerItem[];
    dispatcher?: Dispatch<object>;
    namespace: string;
}

export const MarkerLayer = ({markers, dispatcher, namespace}: Props) => {
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) return () => {};
        const container = select(ref.current);
        const selection = renderMarkers(container, markers);
        if (!markers.some((marker) => marker.hover)) return () => {};

        const elements = new Map<MarkerItem, SVGGElement>();
        const byData = new Map<unknown, MarkerItem[]>();
        selection.each(function (marker) {
            if (!marker.hover) return;
            elements.set(marker, this);
            const items = byData.get(marker.data) ?? [];
            items.push(marker);
            byData.set(marker.data, items);
        });
        let previous = new Set<MarkerItem>();
        const onHover = (hovered: HoveredShapeData[] = []) => {
            const selected = new Set(
                hovered.flatMap((item) =>
                    (byData.get(item.data) ?? []).filter(
                        (marker) =>
                            (item.series?.id === undefined ||
                                item.series.id === marker.series.id) &&
                            (item.x === undefined || item.x === marker.cx),
                    ),
                ),
            );
            for (const marker of new Set([...previous, ...selected])) {
                if (selected.has(marker) === previous.has(marker)) continue;
                const element = elements.get(marker);
                if (element) {
                    const style = selected.has(marker) ? {...marker, ...marker.hover} : marker;
                    setMarkerStyles(select(element).datum(style));
                }
            }
            previous = selected;
        };
        dispatcher?.on(`hover-shape.${namespace}-normal`, onHover);
        return () => {
            dispatcher?.on(`hover-shape.${namespace}-normal`, null);
        };
    }, [markers, dispatcher, namespace]);

    return <g ref={ref} />;
};
