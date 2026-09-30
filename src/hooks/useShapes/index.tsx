import React from 'react';

import {group} from 'd3-array';
import type {Dispatch} from 'd3-dispatch';

import type {PreparedSplit} from '~core/layout/split-types';
import type {ChartScale} from '~core/scales/types';
import type {SeriesPlugin} from '~core/series/plugin';
import {getSeriesPlugin} from '~core/series/seriesRegistry';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import type {ShapeLabels, TooltipItemData} from '~core/shapes/types';
import {getSeriesClipPathId} from '~core/shapes/utils';
import {getOnlyVisibleSeries} from '~core/utils';
import {hasGradient} from '~core/utils/gradient';
import type {SeriesGradientState} from '~core/utils/gradient-reference';
import {captureGradient} from '~core/utils/gradient-reference';
import type {ZoomState} from '~core/zoom/types';

import type {PreparedXAxis, PreparedYAxis} from '../useAxis/types';

import {SeriesShapes} from './SeriesShapes';
import type {GradientReference} from './types';

import './styles.scss';

export type {TooltipItemData};
export type ClipPathBySeriesType = Partial<Record<string, boolean>>;

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
    clipPathBySeriesType?: ClipPathBySeriesType;
    dispatcher?: Dispatch<object>;
    isOutsideBounds?: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
    zoomState?: Partial<ZoomState>;
    getGradientReference?: () => GradientReference | Promise<GradientReference>;
    gradientReference?: GradientReference;
}

const gradientStates = new WeakMap<GradientReference, Promise<Map<string, SeriesGradientState>>>();

function getGradientStates(reference: GradientReference, seriesOptions: PreparedSeriesOptions) {
    let result = gradientStates.get(reference);
    if (!result) {
        result = (async () => {
            const states = new Map<string, SeriesGradientState>();
            const series = getOnlyVisibleSeries(reference.series);
            for (const [type, items] of group(series, (item) => item.type)) {
                const plugin = getSeriesPlugin(type);
                if (!items.some(hasGradient) || !plugin.prepareGradientGeometry) {
                    continue;
                }
                const geometry = await plugin.prepareGradientGeometry({
                    ...reference,
                    series: items,
                    allSeries: series,
                    seriesOptions,
                });
                const geometryById = new Map(geometry.map((shape) => [shape.id, shape]));
                for (const item of items) {
                    if (!hasGradient(item) || !('yAxis' in item) || !reference.xScale) {
                        continue;
                    }
                    const shape = geometryById.get(item.id);
                    const yScale = reference.yScale?.[item.yAxis];
                    if (!yScale) {
                        continue;
                    }
                    const context = {
                        points: shape?.points ?? [],
                        xScale: reference.xScale,
                        yScale,
                        yAxisTop:
                            reference.split.plots[reference.yAxis[item.yAxis].plotIndex]?.top ?? 0,
                    };
                    const stroke = captureGradient({
                        ...context,
                        gradient: 'gradient' in item ? item.gradient : undefined,
                        bbox: shape?.bbox ?? null,
                    });
                    const fill = captureGradient({
                        ...context,
                        gradient: 'fillGradient' in item ? item.fillGradient : undefined,
                        bbox: shape?.fillBBox ?? null,
                        locations: stroke?.points,
                    });
                    states.set(item.id, {stroke, fill});
                }
            }
            return states;
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
    clipPathBySeriesType?: ClipPathBySeriesType;
    yAxis: PreparedYAxis[];
    zoomState?: Partial<ZoomState>;
}) {
    const {plugin, clipPathId, clipPathBySeriesType, yAxis, zoomState} = args;

    if (plugin.type === 'line') {
        return getSeriesClipPathId({clipPathId, yAxis, zoomState});
    }

    const useClip = clipPathBySeriesType?.[plugin.type] ?? plugin.useClipPath ?? true;
    return useClip ? clipPathId : undefined;
}

export async function getShapes(args: Args) {
    const {
        boundsWidth,
        boundsHeight,
        clipPathId,
        clipPathBySeriesType,
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
        (visibleSeries.some(hasGradient) ? await getGradientReference?.() : undefined);
    if (reference && visibleSeries.some(hasGradient)) {
        const states = await getGradientStates(reference, seriesOptions);
        visibleSeries = visibleSeries.map((item) => {
            const gradientState = states.get(item.id);
            return gradientState ? {...item, gradientState} : item;
        });
    }
    const groupedSeries = group(visibleSeries, (item) => {
        if (item.type === 'line') {
            return item.id;
        }
        return item.type;
    });

    const shapesData: TooltipItemData[] = [];
    const shapes: React.ReactElement[] = [];
    const layers: ShapeLabels[] = [];

    const groupedSeriesItems = Array.from(groupedSeries);
    for (let index = groupedSeriesItems.length - 1; index >= 0; index--) {
        const [groupKey, chartSeries] = groupedSeriesItems[index];
        const seriesType = chartSeries[0].type;
        const plugin = getSeriesPlugin(seriesType);

        const {renderData, tooltipItems, labels} = await plugin.prepareShapeData({
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

        if (renderData.length === 0) {
            continue;
        }

        const resolvedClipPathId = resolveClipPathId({
            plugin,
            clipPathId,
            clipPathBySeriesType,
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

    return {shapes, shapesData};
}

export const useShapes = (args: Args) => {
    const {
        boundsWidth,
        boundsHeight,
        clipPathId,
        clipPathBySeriesType,
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
                clipPathBySeriesType,
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
        clipPathBySeriesType,
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
