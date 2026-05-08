import React from 'react';

import {select} from 'd3-selection';

import type {AnnotationAnchor} from '~core/series/types';
import {renderAnnotations} from '~core/shapes/annotation';

interface Props {
    annotations: AnnotationAnchor[];
    boundsWidth: number;
    boundsHeight: number;
}

export const AnnotationLayer = ({annotations, boundsWidth, boundsHeight}: Props) => {
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) return;
        renderAnnotations({
            anchors: annotations,
            container: select(ref.current),
            plotWidth: boundsWidth,
            plotHeight: boundsHeight,
        });
    }, [annotations, boundsWidth, boundsHeight]);

    return <g ref={ref} />;
};
