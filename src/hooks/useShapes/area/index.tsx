import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderArea} from '~core/shapes/area/renderer';
import type {PreparedAreaData} from '~core/shapes/area/types';
import {filterOverlappingLabels} from '~core/utils';

import {block} from '../../../utils';
import {AnnotationLayer} from '../AnnotationLayer';
import {HoverMarkerLayer} from '../HoverMarkerLayer';
import {HtmlLayer} from '../HtmlLayer';
import {MarkerLayer} from '../MarkerLayer';

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

    const allowOverlapDataLabels = React.useMemo(() => {
        return preparedData.some((d) => d?.series.dataLabels.allowOverlap);
    }, [preparedData]);

    React.useEffect(() => {
        if (!plotRef.current) {
            return () => {};
        }

        return renderArea(
            {plot: plotRef.current},
            preparedData,
            seriesOptions,
            allowOverlapDataLabels,
            dispatcher,
        );
    }, [allowOverlapDataLabels, dispatcher, preparedData, seriesOptions]);

    const htmlLayerData = React.useMemo(() => {
        const items = preparedData.map((d) => d?.htmlLabels).flat();
        if (allowOverlapDataLabels) {
            return {htmlElements: items};
        }

        return {htmlElements: filterOverlappingLabels(items)};
    }, [allowOverlapDataLabels, preparedData]);

    const allMarkers = React.useMemo(() => preparedData.flatMap((d) => d.markers), [preparedData]);
    const allHoverMarkers = React.useMemo(
        () => preparedData.flatMap((d) => d.hoverMarkers),
        [preparedData],
    );
    const allAnnotations = React.useMemo(
        () => preparedData.flatMap((d) => d.annotations),
        [preparedData],
    );

    const areaId = preparedData[0]?.id ?? 'unknown';

    return (
        <React.Fragment>
            <g ref={plotRef} className={b()} clipPath={`url(#${clipPathId})`} />
            <MarkerLayer markers={allMarkers} />
            <HoverMarkerLayer
                hoverMarkers={allHoverMarkers}
                dispatcher={dispatcher}
                namespace={`hover-markers-area-${areaId}`}
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
