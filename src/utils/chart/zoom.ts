import {SeriesType} from '../../constants';
import {getAxisCategories} from '../../hooks/useChartOptions/utils';
import type {ZoomState} from '../../hooks/useZoom/types';
import type {
    ChartAxisType,
    ChartSeries,
    ChartSeriesData,
    ChartXAxis,
    ChartYAxis,
} from '../../types';

const SERIES_TYPE_WITH_HIDDEN_POINTS: ChartSeries['type'][] = [SeriesType.Area, SeriesType.Line];

// eslint-disable-next-line complexity
function isValueInRange(args: {
    axis?: ChartXAxis | ChartYAxis;
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
            const categories = getAxisCategories(axis) || [];

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

export function getZoomedSeriesData(args: {
    seriesData: ChartSeries[];
    zoomState: Partial<ZoomState>;
    xAxis?: ChartXAxis;
    yAxes?: ChartYAxis[];
}) {
    const {seriesData, xAxis, yAxes, zoomState} = args;

    if (Object.keys(zoomState).length <= 0) {
        return {zoomedSeriesData: seriesData, zoomedShapesSeriesData: seriesData};
    }

    const zoomedSeriesData: ChartSeries[] = [];
    const zoomedShapesSeriesData: ChartSeries[] = [];
    let prevPointInRange = false;
    let currentPointInRange = false;

    seriesData.forEach((seriesItem) => {
        const filteredData: ChartSeriesData[] = [];
        const filteredShapesData: ChartSeriesData[] | undefined =
            SERIES_TYPE_WITH_HIDDEN_POINTS.includes(seriesItem.type) && xAxis?.type !== 'category'
                ? []
                : undefined;

        seriesItem.data.forEach((point, i) => {
            const prevPoint = seriesItem.data[i - 1];
            const isFirstPoint = i === 0;
            let inXRange = true;
            let inYRange = true;

            prevPointInRange = currentPointInRange;

            if (zoomState.x) {
                const [xMin, xMax] = zoomState.x;
                const x = 'x' in point ? point.x : undefined;
                inXRange = isValueInRange({
                    axis: xAxis,
                    value: x,
                    min: xMin,
                    max: xMax,
                });
            }

            if (zoomState.y) {
                const yAxisIndex =
                    'yAxis' in seriesItem && typeof seriesItem.yAxis === 'number'
                        ? seriesItem.yAxis
                        : 0;
                const [yMin, yMax] = zoomState.y[yAxisIndex];
                const y = 'y' in point ? point.y : undefined;
                inYRange = isValueInRange({
                    axis: yAxes?.[yAxisIndex],
                    value: y,
                    min: yMin,
                    max: yMax,
                });
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
            ...(seriesItem as Omit<ChartSeries, 'data'>),
            data: filteredData,
        } as ChartSeries);
        zoomedShapesSeriesData.push({
            ...(seriesItem as Omit<ChartSeries, 'data'>),
            data: filteredShapesData || filteredData,
        } as ChartSeries);
    });

    return {zoomedSeriesData, zoomedShapesSeriesData};
}
