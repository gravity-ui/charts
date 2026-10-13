import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {SeriesPlugin} from '~core/series/plugin';
import type {PreparedSeriesOptions} from '~core/series/types';
import type {SeriesShapeData, SvgLabel} from '~core/shapes/types';
import {registerInteractionLayer} from '~core/utils/chart-interaction';

import {block} from '../../utils';

import {AnnotationLayer} from './AnnotationLayer';
import {HoverMarkerLayer} from './HoverMarkerLayer';
import {HtmlLayer} from './HtmlLayer';
import {MarkerLayer} from './MarkerLayer';

interface Props {
    boundsHeight: number;
    boundsWidth: number;
    clipPathId?: string;
    dispatcher?: Dispatch<object>;
    htmlLayout: HTMLElement | null;
    namespace: string;
    plugin: SeriesPlugin;
    preparedData: SeriesShapeData[];
    labels?: SvgLabel[];
    seriesOptions: PreparedSeriesOptions;
    isRangeSlider?: boolean;
}

export const SeriesShapes = ({
    boundsHeight,
    boundsWidth,
    clipPathId,
    dispatcher,
    htmlLayout,
    namespace,
    plugin,
    preparedData,
    labels,
    seriesOptions,
    isRangeSlider,
}: Props) => {
    const b = block(plugin.type);
    const ref = React.useRef<SVGGElement>(null);
    const markerRef = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) return () => {};
        const plot = ref.current;
        const cleanup = plugin.renderShapes({
            plot: ref.current,
            preparedData,
            labels,
            seriesOptions,
            boundsWidth,
            boundsHeight,
            dispatcher,
        });
        const markers = markerRef.current;
        const interaction = plugin.interaction;
        const unregister =
            !isRangeSlider && markers && interaction
                ? registerInteractionLayer(plot, () =>
                      interaction.getTargetElements({plot, markers, preparedData}),
                  )
                : undefined;
        return () => {
            unregister?.();
            cleanup?.();
        };
    }, [
        boundsHeight,
        boundsWidth,
        dispatcher,
        plugin,
        preparedData,
        labels,
        seriesOptions,
        isRangeSlider,
    ]);

    const markers = React.useMemo(() => preparedData.flatMap((d) => d.markers), [preparedData]);
    const annotations = React.useMemo(
        () => preparedData.flatMap((d) => d.annotations),
        [preparedData],
    );
    const htmlLayerData = React.useMemo(
        () => ({htmlElements: preparedData.flatMap((d) => d.htmlLabels)}),
        [preparedData],
    );

    return (
        <React.Fragment>
            <g
                ref={ref}
                className={b()}
                clipPath={clipPathId ? `url(#${clipPathId})` : undefined}
            />
            <MarkerLayer markers={markers} elementRef={markerRef} />
            <HoverMarkerLayer
                preparedData={preparedData}
                dispatcher={dispatcher}
                namespace={namespace}
            />
            <AnnotationLayer
                annotations={annotations}
                boundsWidth={boundsWidth}
                boundsHeight={boundsHeight}
            />
            <HtmlLayer preparedData={htmlLayerData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
