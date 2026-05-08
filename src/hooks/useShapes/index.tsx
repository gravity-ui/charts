import React from 'react';

import {group} from 'd3-array';
import type {Dispatch} from 'd3-dispatch';

import type {PreparedSplit} from '~core/layout/split-types';
import type {ChartScale} from '~core/scales/types';
import type {SeriesPlugin} from '~core/series/plugin';
import {getSeriesPlugin} from '~core/series/seriesRegistry';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import type {TooltipItemData} from '~core/shapes/types';
import {getSeriesClipPathId} from '~core/shapes/utils';
import {getOnlyVisibleSeries} from '~core/utils';
import type {ZoomState} from '~core/zoom/types';

import type {ShapeDataWithLabels} from '../../types';
import type {PreparedXAxis, PreparedYAxis} from '../useAxis/types';

import {SeriesShapes} from './SeriesShapes';

import './styles.scss';

export type {TooltipItemData};
export type ClipPathBySeriesType = Partial<Record<string, boolean>>;

type Args = {
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
};

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
    } = args;

    const visibleSeries = getOnlyVisibleSeries(series);
    const groupedSeries = group(visibleSeries, (item) => {
        if (item.type === 'line') {
            return item.id;
        }
        return item.type;
    });

    const shapesData: TooltipItemData[] = [];
    const shapes: React.ReactElement[] = [];
    const layers: ShapeDataWithLabels[] = [];

    const groupedSeriesItems = Array.from(groupedSeries);
    for (let index = groupedSeriesItems.length - 1; index >= 0; index--) {
        const [groupKey, chartSeries] = groupedSeriesItems[index];
        const seriesType = chartSeries[0].type;
        const plugin = getSeriesPlugin(seriesType);

        const {renderData, tooltipItems} = await plugin.prepareShapeData({
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
        layers.push(...(renderData as unknown as ShapeDataWithLabels[]));
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
    ]);

    return {
        shapes: shapesElements,
        shapesData: shapesElementsData,
        shapesReady: shapesReadyRef.current,
    };
};
