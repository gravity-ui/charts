import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderLine} from '~core/shapes/line/renderer';
import type {PreparedLineData} from '~core/shapes/line/types';

import {block} from '../../../utils';
import {HtmlLayer} from '../HtmlLayer';

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
    const markersRef = React.useRef<SVGGElement>(null);
    const hoverMarkersRef = React.useRef<SVGGElement>(null);
    const annotationsRef = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (
            !plotRef.current ||
            !markersRef.current ||
            !hoverMarkersRef.current ||
            !annotationsRef.current
        ) {
            return () => {};
        }

        return renderLine(
            {
                plot: plotRef.current,
                markers: markersRef.current,
                hoverMarkers: hoverMarkersRef.current,
                annotations: annotationsRef.current,
                boundsWidth,
                boundsHeight,
            },
            preparedData,
            seriesOptions,
            dispatcher,
        );
    }, [boundsHeight, boundsWidth, dispatcher, preparedData, seriesOptions]);

    const htmlLayerData = React.useMemo(() => {
        const items = preparedData.flatMap((d) => d.htmlLabels);
        return {htmlElements: items};
    }, [preparedData]);

    return (
        <React.Fragment>
            <g ref={plotRef} className={b()} clipPath={`url(#${clipPathId})`} />
            <g ref={markersRef} />
            <g ref={hoverMarkersRef} />
            <g ref={annotationsRef} />
            <HtmlLayer preparedData={htmlLayerData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
