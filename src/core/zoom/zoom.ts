import type {PreparedAxis, PreparedXAxis, PreparedYAxis} from '../axes/types';
import {SERIES_TYPE} from '../constants';
import type {RangeSliderState} from '../range-slider/types';
import type {PreparedSeries, PreparedZoomableSeries} from '../series';
import type {ChartAxisType, ChartSeries, ChartSeriesData, ChartXAxis, ChartYAxis} from '../types';

import type {ZoomState} from './types';

const SERIES_TYPE_WITH_HIDDEN_POINTS: ChartSeries['type'][] = [SERIES_TYPE.Area, SERIES_TYPE.Line];

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
    return 'data' in series && Array.isArray((series as {data?: unknown}).data);
}

export function getZoomedSeriesData(args: {
    seriesData: PreparedSeries[];
    zoomState: Partial<ZoomState>;
    xAxis?: ChartXAxis | PreparedXAxis | null;
    yAxis?: ChartYAxis[] | PreparedYAxis[] | null;
}) {
    const {seriesData, xAxis, yAxis, zoomState} = args;

    if (Object.keys(zoomState).length <= 0) {
        return {preparedSeries: seriesData, preparedShapesSeries: seriesData};
    }

    const zoomedSeriesData: PreparedSeries[] = [];
    const zoomedShapesSeriesData: PreparedSeries[] = [];

    seriesData.forEach((seriesItem) => {
        let prevPointInRange = false;
        let currentPointInRange = false;

        const filteredData: ChartSeriesData[] = [];
        const filteredShapesData: ChartSeriesData[] | undefined =
            SERIES_TYPE_WITH_HIDDEN_POINTS.includes(seriesItem.type) && xAxis?.type !== 'category'
                ? []
                : undefined;

        if (!isPreparedZoomableSeries(seriesItem)) {
            return;
        }

        // For stacked series the chart-space position of each point is the
        // cumulative stack sum, not its individual value, so the value-axis
        // filter would drop segments that still need to participate in the
        // stack. Skip it and let the axis range / clip handle visibility.
        const isStacked = 'stacking' in seriesItem && Boolean(seriesItem.stacking);
        const stackedValueAxis =
            isStacked && 'valueAxis' in seriesItem ? seriesItem.valueAxis : undefined;
        const skipXFilter = stackedValueAxis === 'x';
        const skipYFilter = stackedValueAxis === 'y';

        seriesItem.data.forEach((point, i) => {
            const prevPoint = seriesItem.data[i - 1];
            const isFirstPoint = i === 0;
            let inXRange = true;
            let inYRange = true;

            prevPointInRange = currentPointInRange;

            if (zoomState.x && !skipXFilter) {
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

            if (zoomState.y && !skipYFilter) {
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

            currentPointInRange = inXRange && inYRange;

            if (currentPointInRange) {
                filteredData.push(point);
            }

            if (filteredShapesData) {
                if (prevPointInRange && !currentPointInRange) {
                    filteredShapesData.push(point);
                } else if (!isFirstPoint && !prevPointInRange && currentPointInRange) {
                    filteredShapesData.push(prevPoint, point);
                } else if (
                    (isFirstPoint || (!isFirstPoint && prevPointInRange)) &&
                    currentPointInRange
                ) {
                    filteredShapesData.push(point);
                }
            }
        });

        zoomedSeriesData.push({
            ...(seriesItem as Omit<PreparedSeries, 'data'>),
            data: filteredData,
        } as PreparedSeries);
        zoomedShapesSeriesData.push({
            ...(seriesItem as Omit<PreparedSeries, 'data'>),
            data: filteredShapesData || filteredData,
        } as PreparedSeries);
    });

    return {
        preparedSeries: zoomedSeriesData,
        preparedShapesSeries: zoomedShapesSeriesData,
    };
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
