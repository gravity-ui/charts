import type {PreparedAxis, PreparedXAxis, PreparedYAxis} from '../axes/types';
import type {RangeSliderState} from '../range-slider/types';
import type {PreparedSeries, PreparedZoomableSeries} from '../series';
import {getSeriesPlugin} from '../series/seriesRegistry';
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

function spansRange(
    from: number | string | null | undefined,
    to: number | string | null | undefined,
    [min, max]: [number, number],
): boolean {
    if (from === null || from === undefined || to === null || to === undefined) {
        return false;
    }
    const start = Number(from);
    const end = Number(to);
    return (start < min && end > max) || (start > max && end < min);
}

export function getZoomedSeriesData(args: {
    seriesData: PreparedSeries[];
    zoomState: Partial<ZoomState>;
    xAxis?: ChartXAxis | PreparedXAxis | null;
    yAxis?: ChartYAxis[] | PreparedYAxis[] | null;
}) {
    const {seriesData, xAxis, yAxis, zoomState} = args;

    if (Object.keys(zoomState).length <= 0) {
        return {
            preparedSeries: seriesData,
            preparedShapesSeries: seriesData,
            preparedAxisSeries: seriesData,
        };
    }

    const zoomedSeriesData: PreparedSeries[] = [];
    const zoomedShapesSeriesData: PreparedSeries[] = [];
    const zoomedAxisSeriesData: PreparedSeries[] = [];

    seriesData.forEach((seriesItem) => {
        const zoomOptions = getSeriesPlugin(seriesItem.type).zoom;
        let prevPointInRange = false;
        let currentPointInRange = false;

        const filteredData: ChartSeriesData[] = [];
        const filteredShapesData: ChartSeriesData[] | undefined =
            zoomOptions?.preserveAdjacentPoints && xAxis?.type !== 'category' ? [] : undefined;

        if (!isPreparedZoomableSeries(seriesItem)) {
            return;
        }

        let lastShapePointIndex = -1;
        const appendShapePoint = (index: number) => {
            if (index > lastShapePointIndex) {
                filteredShapesData?.push(seriesItem.data[index]);
                lastShapePointIndex = index;
            }
        };

        // For stacked series the chart-space position of each point is the
        // cumulative stack sum, not its individual value, so the value-axis
        // filter would drop segments that still need to participate in the
        // stack. Skip it and let the axis range / clip handle visibility.
        const isStacked = 'stacking' in seriesItem && Boolean(seriesItem.stacking);
        const stackedValueAxis =
            isStacked && 'valueAxis' in seriesItem ? seriesItem.valueAxis : undefined;
        const skipXFilter = stackedValueAxis === 'x';
        const skipYFilter = stackedValueAxis === 'y';
        const yAxisIndex = 'yAxis' in seriesItem ? (seriesItem.yAxis ?? 0) : 0;
        const zoomStateY = zoomState.y?.[yAxisIndex];

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
                if (zoomStateY) {
                    const [yMin, yMax] = zoomStateY;
                    const y = 'y' in point ? (point.y ?? undefined) : undefined;
                    inYRange = zoomOptions?.isYInRange
                        ? zoomOptions.isYInRange(point, [yMin, yMax])
                        : isValueInRange({
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
                if (currentPointInRange) {
                    if (!isFirstPoint && !prevPointInRange) {
                        appendShapePoint(i - 1);
                    }
                    appendShapePoint(i);
                } else if (prevPointInRange) {
                    appendShapePoint(i);
                } else if (
                    prevPoint &&
                    ((zoomState.x &&
                        !skipXFilter &&
                        'x' in prevPoint &&
                        'x' in point &&
                        spansRange(prevPoint.x, point.x, zoomState.x)) ||
                        (zoomStateY &&
                            !skipYFilter &&
                            yAxis?.[yAxisIndex]?.type !== 'category' &&
                            'y' in prevPoint &&
                            'y' in point &&
                            spansRange(prevPoint.y, point.y, zoomStateY)))
                ) {
                    // Both anchors can be outside the viewport while their segment crosses it.
                    appendShapePoint(i - 1);
                    appendShapePoint(i);
                }
            }
        });

        const zoomedSeries = {
            ...(seriesItem as Omit<PreparedSeries, 'data'>),
            data: filteredData,
        } as PreparedSeries;
        const shapeSeries = {
            ...(seriesItem as Omit<PreparedSeries, 'data'>),
            data: filteredShapesData || filteredData,
        } as PreparedSeries;
        const axisSeries = filteredData.length ? zoomedSeries : shapeSeries;
        zoomedSeriesData.push(zoomedSeries);
        zoomedShapesSeriesData.push(shapeSeries);
        zoomedAxisSeriesData.push(
            (zoomState.x && filteredShapesData
                ? zoomOptions?.prepareAxisSeries?.({
                      series: axisSeries,
                      shapeSeries,
                      xRange: zoomState.x,
                      xAxis,
                      yAxis: yAxis?.[yAxisIndex],
                  })
                : undefined) ?? axisSeries,
        );
    });

    return {
        preparedSeries: zoomedSeriesData,
        preparedShapesSeries: zoomedShapesSeriesData,
        preparedAxisSeries: zoomedAxisSeriesData,
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
