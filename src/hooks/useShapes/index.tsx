import React from 'react';

import {group} from 'd3-array';
import type {Dispatch} from 'd3-dispatch';

import type {PreparedSplit} from '~core/layout/split-types';
import type {ChartScale} from '~core/scales/types';
import {getSeriesLayers} from '~core/series/layers';
import type {SeriesPlugin} from '~core/series/plugin';
import {getSeriesPlugin} from '~core/series/seriesRegistry';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import type {ShapeLabels, TooltipItemData} from '~core/shapes/types';
import {getClipPathIdByBounds} from '~core/shapes/utils';
import {getOnlyVisibleSeries} from '~core/utils';
import {hasGradient} from '~core/utils/gradient';
import type {GradientGeometry, SeriesGradientState} from '~core/utils/gradient-reference';
import {captureGradient} from '~core/utils/gradient-reference';
import type {ZoomState} from '~core/zoom/types';

import type {PreparedXAxis, PreparedYAxis} from '../useAxis/types';

import {SeriesShapes} from './SeriesShapes';
import type {GradientLayoutReference} from './types';

import './styles.scss';

export type {TooltipItemData};

interface Args {
    boundsWidth: number;
    boundsHeight: number;
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    series: PreparedSeries[];
    seriesOptions: PreparedSeriesOptions;
    split: PreparedSplit;
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
    dispatcher?: Dispatch<object>;
    isOutsideBounds?: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
    zoomState?: Partial<ZoomState>;
    getGradientReference?: () => GradientLayoutReference | Promise<GradientLayoutReference>;
    gradientReference?: GradientLayoutReference;
}

const gradientStates = new WeakMap<
    GradientLayoutReference,
    Promise<Map<string, SeriesGradientState>>
>();

function captureGradientStates(reference: GradientLayoutReference, geometry: GradientGeometry[]) {
    const states = new Map<string, SeriesGradientState>();
    const geometryById = new Map(geometry.map((shape) => [shape.id, shape]));
    for (const item of getOnlyVisibleSeries(reference.series)) {
        if (
            !hasGradient(item) ||
            !getSeriesPlugin(item.type).prepareGradientGeometry ||
            !('yAxis' in item) ||
            !reference.xScale
        )
            continue;
        const yScale = reference.yScale?.[item.yAxis];
        if (!yScale) continue;
        const shape = geometryById.get(item.id);
        const context = {
            points: shape?.points ?? [],
            xScale: reference.xScale,
            yScale,
            yAxisTop: reference.split.plots[reference.yAxis[item.yAxis].plotIndex]?.top ?? 0,
        };
        const stroke = captureGradient({
            ...context,
            gradient: 'gradient' in item ? item.gradient : undefined,
            bbox: shape?.strokeBBox ?? null,
        });
        const fill = captureGradient({
            ...context,
            gradient: 'fillGradient' in item ? item.fillGradient : undefined,
            bbox: shape?.fillBBox ?? null,
        });
        states.set(item.id, {stroke, fill});
    }
    return states;
}

function getGradientStates(
    reference: GradientLayoutReference,
    seriesOptions: PreparedSeriesOptions,
) {
    let result = gradientStates.get(reference);
    if (!result) {
        result = (async () => {
            const geometry: GradientGeometry[] = [];
            const series = getOnlyVisibleSeries(reference.series);
            for (const [type, items] of group(series, (item) => item.type)) {
                const plugin = getSeriesPlugin(type);
                if (!items.some(hasGradient) || !plugin.prepareGradientGeometry) continue;
                geometry.push(
                    ...(await plugin.prepareGradientGeometry({
                        ...reference,
                        series: items,
                        allSeries: series,
                        seriesOptions,
                    })),
                );
            }
            return captureGradientStates(reference, geometry);
        })();
        gradientStates.set(reference, result);
    }
    return result;
}

function IS_OUTSIDE_BOUNDS() {
    return false;
}

function resolveClipPathId(args: {
    plugin: SeriesPlugin;
    clipPathId: string;
    isRangeSlider?: boolean;
    yAxis: PreparedYAxis[];
    zoomState?: Partial<ZoomState>;
}) {
    const {plugin, clipPathId, isRangeSlider, yAxis, zoomState} = args;
    const clip =
        plugin.getClipPath?.({isRangeSlider: Boolean(isRangeSlider), yAxis, zoomState}) ?? 'bounds';
    return clip === false
        ? undefined
        : getClipPathIdByBounds({clipPathId, bounds: clip === 'horizontal' ? clip : undefined});
}

export async function getShapes(args: Args) {
    const {
        boundsWidth,
        boundsHeight,
        clipPathId,
        dispatcher,
        htmlLayout,
        isOutsideBounds = IS_OUTSIDE_BOUNDS,
        isRangeSlider,
        series,
        seriesOptions,
        split,
        xAxis,
        xScale,
        yAxis,
        yScale,
        zoomState,
        getGradientReference,
        gradientReference,
    } = args;

    if (boundsWidth <= 0 || boundsHeight <= 0) {
        return {shapes: [], shapesData: []};
    }

    let visibleSeries = getOnlyVisibleSeries(series);
    const reference =
        gradientReference ??
        (visibleSeries.some(hasGradient) && (zoomState?.x || zoomState?.y)
            ? await getGradientReference?.()
            : undefined);
    if (reference && visibleSeries.some(hasGradient)) {
        const states = await getGradientStates(reference, seriesOptions);
        visibleSeries = visibleSeries.map((item) => {
            const gradientState = states.get(item.id);
            return gradientState ? {...item, gradientState} : item;
        });
    }
    const seriesLayers = getSeriesLayers(visibleSeries, (item) => item.id);

    const shapesData: TooltipItemData[] = [];
    const shapes: React.ReactElement[] = [];
    const layers: ShapeLabels[] = [];
    const preparedGradientGeometry: GradientGeometry[] = [];

    for (let index = seriesLayers.length - 1; index >= 0; index--) {
        const {key: groupKey, series: layerSeries} = seriesLayers[index];
        const chartSeries = [...layerSeries];
        const seriesType = chartSeries[0].type;
        const plugin = getSeriesPlugin(seriesType);

        const {renderData, tooltipItems, labels, gradientGeometry} = await plugin.prepareShapeData({
            series: chartSeries,
            boundsWidth,
            boundsHeight,
            seriesOptions,
            xAxis,
            yAxis,
            xScale,
            yScale,
            split,
            isOutsideBounds,
            isRangeSlider,
            otherLayers: layers,
            allSeries: visibleSeries,
        });

        if (gradientGeometry) preparedGradientGeometry.push(...gradientGeometry);
        if (renderData.length === 0) {
            continue;
        }

        const resolvedClipPathId = resolveClipPathId({
            plugin,
            clipPathId,
            isRangeSlider,
            yAxis,
            zoomState,
        });

        shapes[index] = (
            <SeriesShapes
                key={groupKey}
                plugin={plugin}
                preparedData={renderData}
                labels={labels}
                boundsWidth={boundsWidth}
                boundsHeight={boundsHeight}
                clipPathId={resolvedClipPathId}
                seriesOptions={seriesOptions}
                dispatcher={dispatcher}
                htmlLayout={htmlLayout}
                namespace={`hover-markers-${groupKey}`}
            />
        );
        shapesData.splice(index, 0, ...tooltipItems);
        layers.push(...renderData);
        if (labels?.length) {
            layers.push({svgLabels: labels, htmlLabels: []});
        }
    }

    if (!reference && !isRangeSlider && getGradientReference && visibleSeries.some(hasGradient)) {
        const fullReference = await getGradientReference();
        const preparedIds = new Set(preparedGradientGeometry.map((item) => item.id));
        if (
            !gradientStates.has(fullReference) &&
            visibleSeries.filter(hasGradient).every((item) => preparedIds.has(item.id))
        ) {
            gradientStates.set(
                fullReference,
                Promise.resolve(captureGradientStates(fullReference, preparedGradientGeometry)),
            );
        }
    }
    return {shapes, shapesData};
}

export const useShapes = (args: Args) => {
    const {
        boundsWidth,
        boundsHeight,
        clipPathId,
        dispatcher,
        htmlLayout,
        isOutsideBounds = IS_OUTSIDE_BOUNDS,
        isRangeSlider,
        series,
        seriesOptions,
        split,
        xAxis,
        xScale,
        yAxis,
        yScale,
        zoomState,
        getGradientReference,
        gradientReference,
    } = args;

    const [shapesElements, setShapesElements] = React.useState<React.ReactElement[]>([]);
    const [shapesElementsData, setShapesElementsData] = React.useState<TooltipItemData[]>([]);
    const shapesReadyRef = React.useRef(false);

    const countedRef = React.useRef(0);

    React.useEffect(() => {
        countedRef.current++;

        if (!boundsHeight || !boundsWidth) {
            return;
        }

        (async () => {
            const currentRun = countedRef.current;

            const {shapes, shapesData} = await getShapes({
                boundsHeight,
                boundsWidth,
                clipPathId,
                dispatcher,
                htmlLayout,
                isOutsideBounds,
                isRangeSlider,
                series,
                seriesOptions,
                split,
                xAxis,
                xScale,
                yAxis,
                yScale,
                zoomState,
                getGradientReference,
                gradientReference,
            });

            if (countedRef.current === currentRun) {
                shapesReadyRef.current = true;
                setShapesElements(shapes);
                setShapesElementsData(shapesData);
            }
        })();
    }, [
        boundsHeight,
        boundsWidth,
        clipPathId,
        dispatcher,
        htmlLayout,
        isOutsideBounds,
        isRangeSlider,
        series,
        seriesOptions,
        split,
        xAxis,
        xScale,
        yAxis,
        yScale,
        zoomState,
        getGradientReference,
        gradientReference,
    ]);

    return {
        shapes: shapesElements,
        shapesData: shapesElementsData,
        shapesReady: shapesReadyRef.current,
    };
};
