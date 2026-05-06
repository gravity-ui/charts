import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';

import {renderHoverMarkers} from '~core/shapes/marker';
import type {MarkerItem} from '~core/shapes/types';

interface Props {
    hoverMarkers: MarkerItem[];
    dispatcher?: Dispatch<object>;
    namespace: string;
}

export const HoverMarkerLayer = ({hoverMarkers, dispatcher, namespace}: Props) => {
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (ref.current) {
            return renderHoverMarkers(select(ref.current), hoverMarkers, dispatcher, namespace);
        }
    }, [hoverMarkers, dispatcher, namespace]);

    return <g ref={ref} />;
};
