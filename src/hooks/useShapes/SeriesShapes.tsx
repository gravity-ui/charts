import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {getSeriesPlugin} from '~core/series/seriesRegistry';
import type {PreparedSeriesOptions} from '~core/series/types';
import type {SeriesShapeData, SvgLabel} from '~core/shapes/types';
import {registerInteractionLayer} from '~core/utils/chart-interaction';

import {block} from '../../utils';

import {AnnotationLayer} from './AnnotationLayer';
import {HtmlLayer} from './HtmlLayer';
import {MarkerLayer} from './MarkerLayer';

interface Props extends SeriesShapeData {
    boundsHeight: number;
    boundsWidth: number;
    clipPathId?: string;
    dispatcher?: Dispatch<object>;
    htmlLayout: HTMLElement | null;
    namespace: string;
    plugin: ReturnType<typeof getSeriesPlugin>;
    preparedData: object[];
    labels?: SvgLabel[];
    seriesOptions: PreparedSeriesOptions;
    isRangeSlider?: boolean;
    signal?: AbortSignal;
    onRenderComplete?: () => void;
    onRenderError?: (error: unknown) => void;
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
    markers,
    annotations,
    htmlLabels,
    getHoverMarkers,
    labels,
    seriesOptions,
    isRangeSlider,
    signal,
    onRenderComplete,
    onRenderError,
}: Props) => {
    const b = block(plugin.type);
    const ref = React.useRef<SVGGElement>(null);
    const labelsRef = React.useRef<SVGGElement>(null);
    const markerRef = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current || !labelsRef.current) return () => {};
        let cancelled = false;
        const pending: Promise<void>[] = [];
        const plot = ref.current;
        const cleanup = plugin.renderShapes({
            plot: ref.current,
            labelsPlot: labelsRef.current,
            preparedData,
            labels,
            seriesOptions,
            boundsWidth,
            boundsHeight,
            dispatcher,
            registerCompletion: (completion) => pending.push(completion),
            signal,
        });
        Promise.all(pending).then(
            () => {
                if (!cancelled && !signal?.aborted) onRenderComplete?.();
            },
            (error: unknown) => {
                if (!cancelled && !signal?.aborted) onRenderError?.(error);
            },
        );
        const markerPlot = markerRef.current;
        const interaction = plugin.interaction;
        const unregister =
            !isRangeSlider && markerPlot && interaction
                ? registerInteractionLayer(plot, () =>
                      interaction.getTargetElements({plot, markers: markerPlot, preparedData}),
                  )
                : undefined;
        return () => {
            cancelled = true;
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
        onRenderComplete,
        onRenderError,
        signal,
    ]);

    const htmlLayerData = React.useMemo(() => ({htmlElements: htmlLabels}), [htmlLabels]);

    return (
        <React.Fragment>
            <g
                ref={ref}
                className={b()}
                clipPath={clipPathId ? `url(#${clipPathId})` : undefined}
            />
            <MarkerLayer
                markers={markers}
                getHoverMarkers={getHoverMarkers}
                dispatcher={dispatcher}
                namespace={namespace}
                elementRef={markerRef}
            />
            <g
                ref={labelsRef}
                className={b('labels')}
                clipPath={clipPathId ? `url(#${clipPathId})` : undefined}
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
