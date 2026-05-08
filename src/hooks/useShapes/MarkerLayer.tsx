import React from 'react';

import {select} from 'd3-selection';

import {renderMarkers} from '~core/shapes/marker';
import type {MarkerItem} from '~core/shapes/types';

interface Props {
    markers: MarkerItem[];
}

export const MarkerLayer = ({markers}: Props) => {
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (ref.current) {
            renderMarkers(select(ref.current), markers);
        }
    }, [markers]);

    return <g ref={ref} />;
};
