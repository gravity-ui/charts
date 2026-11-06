import type {PreparedXAxis, PreparedYAxis} from '../axes/types';
import type {RangeSliderState} from '../range-slider/types';
import type {PreparedSeries, PreparedZoomableSeries} from '../series';
import type {DomainViewport} from '../series/axis-contract';
import {getSeriesPlugin} from '../series/seriesRegistry';
import type {ChartXAxis, ChartYAxis} from '../types';

import {filterPoints} from './filter-data';
import type {ZoomState} from './types';

function isPreparedZoomableSeries(series: PreparedSeries): series is PreparedZoomableSeries {
    return Array.isArray(series.data);
}

export function getZoomedSeriesData(args: {
    seriesData: PreparedSeries[];
    zoomState: Partial<ZoomState>;
    xAxis?: ChartXAxis | PreparedXAxis | null;
    yAxis?: ChartYAxis[] | PreparedYAxis[] | null;
}) {
    const {seriesData, xAxis, yAxis, zoomState} = args;
    if (Object.keys(zoomState).length === 0) {
        return {preparedSeries: seriesData, preparedShapesSeries: seriesData};
    }
    const preparedSeries: PreparedSeries[] = [];
    const preparedShapesSeries: PreparedSeries[] = [];
    for (const series of seriesData) {
        if (!isPreparedZoomableSeries(series)) continue;
        const yAxisIndex = 'yAxis' in series ? (series.yAxis ?? 0) : 0;
        const axis = yAxis?.[yAxisIndex];
        const viewport: DomainViewport = {
            x: {type: xAxis?.type ?? 'linear', categories: xAxis?.categories, range: zoomState.x},
            y: {
                type: axis?.type ?? 'linear',
                categories: axis?.categories,
                range: zoomState.y?.[yAxisIndex],
                excluded: Boolean(zoomState.y && !zoomState.y[yAxisIndex]),
            },
        };
        const selection =
            getSeriesPlugin(series.type).zoom?.filterData?.({series, viewport}) ??
            filterPoints<unknown>(series.data, viewport);
        preparedSeries.push({...series, data: selection.data} as PreparedSeries);
        preparedShapesSeries.push({
            ...series,
            data: selection.shapeData ?? selection.data,
        } as PreparedSeries);
    }
    return {preparedSeries, preparedShapesSeries};
}

export function getEffectiveXRange(
    zoomStateX: [number, number] | undefined,
    rangeSliderState: RangeSliderState | undefined,
): [number, number] | undefined {
    if (zoomStateX && rangeSliderState) {
        return [
            Math.max(zoomStateX[0], rangeSliderState.min),
            Math.min(zoomStateX[1], rangeSliderState.max),
        ];
    }
    return (
        zoomStateX ?? (rangeSliderState ? [rangeSliderState.min, rangeSliderState.max] : undefined)
    );
}
