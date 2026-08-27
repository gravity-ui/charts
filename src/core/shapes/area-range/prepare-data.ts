import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import type {ChartScale} from '../../scales/types';
import type {PreparedAreaRangeSeries} from '../../series/types';
import {getXValue, getYValue} from '../../shapes/utils';
import {preparePointDataLabels, shouldPrepareSeriesDataLabels} from '../../utils';
import {createGradientColorResolver, getGradientBBox} from '../../utils/gradient';

import type {AreaRangePointData, PreparedAreaRangeData} from './types';

function getRangeBBox(points: AreaRangePointData[]) {
    return getGradientBBox(
        points.flatMap((point) => [
            {x: point.x, y: point.low},
            {x: point.x, y: point.high},
        ]),
    );
}

export async function prepareAreaRangeData(args: {
    series: PreparedAreaRangeSeries[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    split: PreparedSplit;
    isOutsideBounds: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
}): Promise<PreparedAreaRangeData[]> {
    const {series, xAxis, xScale, yAxis, yScale, split, isOutsideBounds, isRangeSlider} = args;
    const xMax = Math.max(...xScale.range());
    const result: PreparedAreaRangeData[] = [];

    for (const item of series) {
        const seriesYAxis = yAxis[item.yAxis];
        const seriesYScale = yScale[item.yAxis];

        if (!seriesYAxis || !seriesYScale) {
            continue;
        }

        const yAxisTop = split.plots[seriesYAxis.plotIndex]?.top || 0;
        const points: AreaRangePointData[] = [];

        for (const data of item.data) {
            if (item.nullMode === 'connect' && (data.low === null || data.high === null)) {
                continue;
            }

            const x = getXValue({point: data, points: item.data, xAxis, xScale});
            if (x === null) {
                continue;
            }

            const low =
                data.low === null
                    ? null
                    : getYValue({point: {y: data.low}, yAxis: seriesYAxis, yScale: seriesYScale});
            const high =
                data.high === null
                    ? null
                    : getYValue({point: {y: data.high}, yAxis: seriesYAxis, yScale: seriesYScale});
            const absoluteLow = low === null ? null : yAxisTop + low;
            const absoluteHigh = high === null ? null : yAxisTop + high;
            const y =
                absoluteLow === null || absoluteHigh === null
                    ? null
                    : absoluteHigh + (absoluteLow - absoluteHigh) / 2;

            points.push({
                x,
                low: absoluteLow,
                high: absoluteHigh,
                y,
                color: data.color,
                data,
                series: item,
            });
        }

        if (item.gradient) {
            const bbox = getRangeBBox(points);
            if (bbox) {
                const getColor = createGradientColorResolver(item.gradient, bbox);
                points.forEach((point) => {
                    if (point.color === undefined && point.y !== null) {
                        point.fill = getColor(point.x, point.y);
                    }
                });
            }
        }

        const prepared: PreparedAreaRangeData = {
            active: true,
            annotations: [],
            color: item.color,
            getHoverMarkers: () => [],
            hovered: false,
            htmlLabels: [],
            id: item.id,
            markers: [],
            opacity: item.opacity,
            points,
            series: item,
            svgLabels: [],
            width: item.lineWidth,
        };

        if (!isRangeSlider && shouldPrepareSeriesDataLabels(item)) {
            const labelPoints = points.map((point) => ({
                ...point,
                data: {
                    ...point.data,
                    y: point.data.label ?? `${point.data.low} – ${point.data.high}`,
                },
            }));
            const labels = await preparePointDataLabels({
                series: item,
                points: labelPoints,
                xMax,
                yAxisTop,
                isOutsideBounds,
            });
            prepared.svgLabels.push(...labels.svgLabels);
            prepared.htmlLabels.push(...labels.htmlLabels);
        }

        result.push(prepared);
    }

    return result;
}
