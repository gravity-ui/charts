import React from 'react';

import {select} from 'd3-selection';

import {renderMarkers} from '~core/shapes/marker';
import type {MarkerItem} from '~core/shapes/types';

interface Props {
    markers: MarkerItem[];
    elementRef?: React.RefObject<SVGGElement>;
}

export const MarkerLayer = ({markers, elementRef}: Props) => {
    const ownRef = React.useRef<SVGGElement>(null);
    const ref = elementRef ?? ownRef;

    React.useEffect(() => {
        if (ref.current) {
            renderMarkers(select(ref.current), markers);
        }
    }, [markers, ref]);

    return <g ref={ref} />;
};
