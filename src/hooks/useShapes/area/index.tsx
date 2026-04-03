import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderArea} from '~core/shapes/area/renderer';
import type {PreparedAreaData} from '~core/shapes/area/types';
import {filterOverlappingLabels} from '~core/utils';

import {block} from '../../../utils';
import {HtmlLayer} from '../HtmlLayer';

const b = block('area');

type Args = {
    boundsHeight: number;
    boundsWidth: number;
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    preparedData: PreparedAreaData[];
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export const AreaSeriesShapes = (args: Args) => {
    const {
        boundsHeight,
        boundsWidth,
        dispatcher,
        preparedData,
        seriesOptions,
        htmlLayout,
        clipPathId,
    } = args;
    const plotRef = React.useRef<SVGGElement | null>(null);
    const markersRef = React.useRef<SVGGElement>(null);
    const hoverMarkersRef = React.useRef<SVGGElement>(null);
    const annotationsRef = React.useRef<SVGGElement>(null);

    const allowOverlapDataLabels = React.useMemo(() => {
        return preparedData.some((d) => d?.series.dataLabels.allowOverlap);
    }, [preparedData]);

    React.useEffect(() => {
        if (
            !plotRef.current ||
            !markersRef.current ||
            !hoverMarkersRef.current ||
            !annotationsRef.current
        ) {
            return () => {};
        }

        return renderArea(
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
            allowOverlapDataLabels,
            dispatcher,
        );
    }, [
        allowOverlapDataLabels,
        boundsHeight,
        boundsWidth,
        dispatcher,
        preparedData,
        seriesOptions,
    ]);

    const htmlLayerData = React.useMemo(() => {
        const items = preparedData.map((d) => d?.htmlLabels).flat();
        if (allowOverlapDataLabels) {
            return {htmlElements: items};
        }

        return {htmlElements: filterOverlappingLabels(items)};
    }, [allowOverlapDataLabels, preparedData]);

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
