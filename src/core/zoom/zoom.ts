import type {PreparedAxis, PreparedXAxis, PreparedYAxis} from '../axes/types';
import type {PreparedSeries, PreparedZoomableSeries} from '../series';
import type {ChartAxisType, ChartSeriesData, ChartXAxis, ChartYAxis} from '../types';

import type {ZoomState} from './types';

function isValueInRange(args: {
    axis?: ChartXAxis | ChartYAxis | PreparedAxis | null;
    value?: number | string;
    min: number | string;
    max: number | string;
}) {
    const {axis, max, min, value} = args;

    if (value === undefined) {
        return false;
    }

    const axisType: ChartAxisType = axis?.type || 'linear';

    switch (axisType) {
        case 'datetime':
        case 'linear':
        case 'logarithmic': {
            const numValue = typeof value === 'string' ? Number(value) : value;
            const numMin = typeof min === 'string' ? Number(min) : min;
            const numMax = typeof max === 'string' ? Number(max) : max;

            if (Number.isNaN(numValue) || Number.isNaN(numMin) || Number.isNaN(numMax)) {
                return false;
            }

            return numValue >= numMin && numValue <= numMax;
        }
        case 'category': {
            const categories = axis?.categories || [];

            if (typeof value === 'string' && typeof min === 'number' && typeof max === 'number') {
                const valueIndex = categories.indexOf(value);

                if (min === -1 || max === -1 || valueIndex === -1) {
                    return false;
                }

                return valueIndex >= Math.min(min, max) && valueIndex <= Math.max(min, max);
            }

            if (typeof value === 'number' && typeof min === 'number' && typeof max === 'number') {
                if (min === -1 || max === -1) {
                    return false;
                }

                return value >= Math.min(min, max) && value <= Math.max(min, max);
            }

            return false;
        }
        default: {
            return false;
        }
    }
}

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

    if (Object.keys(zoomState).length <= 0) {
        return {preparedSeries: seriesData};
    }

    const zoomedSeriesData: PreparedSeries[] = [];

    seriesData.forEach((seriesItem) => {
        if (!isPreparedZoomableSeries(seriesItem)) {
            return;
        }

        const filteredData: ChartSeriesData[] = [];

        seriesItem.data.forEach((point) => {
            let inXRange = true;
            let inYRange = true;

            if (zoomState.x) {
                const [xMin, xMax] = zoomState.x;
                if ('x0' in point && 'x1' in point) {
                    const isStartInRange = isValueInRange({
                        axis: xAxis,
                        value: point.x0,
                        min: xMin,
                        max: xMax,
                    });
                    const isEndInRange = isValueInRange({
                        axis: xAxis,
                        value: point.x1,
                        min: xMin,
                        max: xMax,
                    });
                    inXRange = isStartInRange || isEndInRange;
                } else {
                    const x = 'x' in point ? (point.x ?? undefined) : undefined;
                    inXRange = isValueInRange({
                        axis: xAxis,
                        value: x,
                        min: xMin,
                        max: xMax,
                    });
                }
            }

            if (zoomState.y) {
                const yAxisIndex =
                    'yAxis' in seriesItem && typeof seriesItem.yAxis === 'number'
                        ? seriesItem.yAxis
                        : 0;
                const zoomStateY = zoomState.y[yAxisIndex];

                if (zoomStateY) {
                    const [yMin, yMax] = zoomStateY;
                    const y = 'y' in point ? (point.y ?? undefined) : undefined;
                    inYRange = isValueInRange({
                        axis: yAxis?.[yAxisIndex],
                        value: y,
                        min: yMin,
                        max: yMax,
                    });
                } else {
                    inYRange = false;
                }
            }

            if (inXRange && inYRange) {
                filteredData.push(point);
            }
        });

        zoomedSeriesData.push({
            ...(seriesItem as Omit<PreparedSeries, 'data'>),
            data: filteredData,
        } as PreparedSeries);
    });

    return {preparedSeries: zoomedSeriesData};
}
