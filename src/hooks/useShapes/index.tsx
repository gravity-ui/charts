import React from 'react';

import {group} from 'd3-array';
import type {Dispatch} from 'd3-dispatch';

import type {SeriesType} from '~core/constants';
import type {PreparedSplit} from '~core/layout/split-types';
import {pluginRegistry} from '~core/plugins';
import type {PreparedSeriesDataItem} from '~core/plugins/series/shared/types';
import type {ChartScale} from '~core/scales/types';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getOnlyVisibleSeries} from '~core/utils';
import type {ZoomState} from '~core/zoom/types';

import {ChartError} from '../../libs';
import type {ShapeDataWithLabels} from '../../types';
import type {PreparedXAxis, PreparedYAxis} from '../useAxis/types';

import {SeriesShape} from './SeriesShape';

import './styles.scss';

export type ShapeData = PreparedSeriesDataItem;

export type ClipPathBySeriesType = Partial<Record<SeriesType, boolean>>;

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

function shouldUseClipPathId(seriesType: SeriesType, clipPathBySeriesType?: ClipPathBySeriesType) {
    return clipPathBySeriesType?.[seriesType] ?? true;
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
    const shapesData: ShapeData[] = [];
    const shapes: React.ReactElement[] = [];
    const layers: ShapeDataWithLabels[] = [];

    const groupedSeriesItems = Array.from(groupedSeries);
    for (let index = groupedSeriesItems.length - 1; index >= 0; index--) {
        const [groupId, chartSeries] = groupedSeriesItems[index];
        const seriesType = chartSeries[0].type;

        const plugin = pluginRegistry.get(seriesType);
        if (!plugin) {
            throw new ChartError({
                message: `The display method is not defined for a series with type "${seriesType}"`,
            });
        }

        const effectiveClipPathId = shouldUseClipPathId(seriesType, clipPathBySeriesType)
            ? clipPathId
            : '';

        const result = await plugin.prepareShapeData({
            chartSeries,
            seriesOptions,
            boundsWidth,
            boundsHeight,
            clipPathId: effectiveClipPathId,
            split,
            xAxis,
            yAxis,
            xScale,
            yScale,
            isOutsideBounds,
            isRangeSlider,
            zoomState,
            otherLayers: layers,
        });

        if (result) {
            shapes[index] = (
                <SeriesShape
                    key={groupId}
                    config={plugin.shape}
                    preparedData={result.data}
                    seriesOptions={seriesOptions}
                    boundsWidth={boundsWidth}
                    boundsHeight={boundsHeight}
                    clipPathId={result.clipPathId ?? effectiveClipPathId}
                    htmlLayout={htmlLayout}
                    dispatcher={dispatcher}
                />
            );
            shapesData.splice(index, 0, ...(result.shapesData as ShapeData[]));
            if (result.layers) {
                layers.push(...result.layers);
            }
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
    } = args;

    const [shapesElements, setShapesElements] = React.useState<React.ReactElement[]>([]);
    const [shapesElementsData, setShapesElementsData] = React.useState<ShapeData[]>([]);
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
