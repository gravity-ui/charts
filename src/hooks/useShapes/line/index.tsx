import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderLine} from '~core/shapes/line/renderer';
import type {PreparedLineData} from '~core/shapes/line/types';

import {block} from '../../../utils';
import {AnnotationLayer} from '../AnnotationLayer';
import {HoverMarkerLayer} from '../HoverMarkerLayer';
import {HtmlLayer} from '../HtmlLayer';
import {MarkerLayer} from '../MarkerLayer';

const b = block('line');

type Args = {
    boundsHeight: number;
    boundsWidth: number;
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    preparedData: PreparedLineData[];
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export const LineSeriesShapes = (args: Args) => {
    const {
        boundsHeight,
        boundsWidth,
        dispatcher,
        preparedData,
        seriesOptions,
        htmlLayout,
        clipPathId,
    } = args;
    const plotRef = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!plotRef.current) {
            return () => {};
        }

        return renderLine({plot: plotRef.current}, preparedData, seriesOptions, dispatcher);
    }, [dispatcher, preparedData, seriesOptions]);

    const htmlLayerData = React.useMemo(() => {
        return {htmlElements: preparedData.flatMap((d) => d.htmlLabels)};
    }, [preparedData]);

    const allMarkers = React.useMemo(() => preparedData.flatMap((d) => d.markers), [preparedData]);
    const allHoverMarkers = React.useMemo(
        () => preparedData.flatMap((d) => d.hoverMarkers),
        [preparedData],
    );
    const allAnnotations = React.useMemo(
        () => preparedData.flatMap((d) => d.annotations),
        [preparedData],
    );

    const lineId = preparedData[0]?.id ?? 'unknown';

    return (
        <React.Fragment>
            <g ref={plotRef} className={b()} clipPath={`url(#${clipPathId})`} />
            <MarkerLayer markers={allMarkers} />
            <HoverMarkerLayer
                hoverMarkers={allHoverMarkers}
                dispatcher={dispatcher}
                namespace={`hover-markers-line-${lineId}`}
            />
            <AnnotationLayer
                annotations={allAnnotations}
                boundsWidth={boundsWidth}
                boundsHeight={boundsHeight}
            />
            <HtmlLayer preparedData={htmlLayerData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
