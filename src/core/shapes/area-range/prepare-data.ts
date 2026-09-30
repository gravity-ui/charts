import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import type {ChartScale} from '../../scales/types';
import type {PreparedAreaRangeSeries} from '../../series/types';
import {getXValue, getYValue} from '../../shapes/utils';
import {preparePointDataLabels, shouldPrepareSeriesDataLabels} from '../../utils';
import {createGradientColorResolver} from '../../utils/gradient';
import {prepareGradientCoords} from '../../utils/gradient-reference';

import {formatAreaRangeDataLabel} from './format';
import {prepareAreaRangeMarkers} from './markers';
import type {AreaRangePointData, PreparedAreaRangeData} from './types';
import {getRangeBBox, markHiddenRangePoints} from './utils';

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
            if (item.nullMode === 'connect' && (data.y0 === null || data.y1 === null)) {
                continue;
            }

            const x = getXValue({point: data, points: item.data, xAxis, xScale});
            if (x === null) {
                continue;
            }

            const y0 =
                data.y0 === null
                    ? null
                    : getYValue({point: {y: data.y0}, yAxis: seriesYAxis, yScale: seriesYScale});
            const y1 =
                data.y1 === null
                    ? null
                    : getYValue({point: {y: data.y1}, yAxis: seriesYAxis, yScale: seriesYScale});
            const absoluteY0 = y0 === null ? null : yAxisTop + y0;
            const absoluteY1 = y1 === null ? null : yAxisTop + y1;
            const y =
                absoluteY0 === null || absoluteY1 === null
                    ? null
                    : absoluteY1 + (absoluteY0 - absoluteY1) / 2;

            points.push({
                x,
                y0: absoluteY0,
                y1: absoluteY1,
                y,
                color: data.color,
                data,
                series: item,
            });
        }

        points.sort((a, b) => a.x - b.x);
        markHiddenRangePoints({points, yScale: seriesYScale, yAxis: seriesYAxis, yAxisTop});

        const gradientPoints =
            item.gradient || item.fillGradient
                ? points.flatMap((point) =>
                      point.y0 === null || point.y1 === null || point.hiddenInLine
                          ? []
                          : [
                                {...point, y: point.y0},
                                {...point, y: point.y1},
                            ],
                  )
                : [];
        const gradientCoords = prepareGradientCoords({
            gradient: item.gradient,
            state: item.gradientState,
            paint: 'stroke',
            points: gradientPoints,
            xScale,
            yScale: seriesYScale,
            yAxisTop,
        });
        const fillGradientCoords = prepareGradientCoords({
            gradient: item.fillGradient,
            state: item.gradientState,
            paint: 'fill',
            points: gradientPoints,
            xScale,
            yScale: seriesYScale,
            yAxisTop,
        });

        if (item.gradient) {
            const bbox = getRangeBBox(points);
            if (bbox) {
                const getColor = createGradientColorResolver(item.gradient, bbox, gradientCoords);
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
            gradientCoords,
            fillGradientCoords,
            ...prepareAreaRangeMarkers({
                points,
                series: item,
                yAxis: seriesYAxis,
                yScale: seriesYScale,
                yAxisTop,
                isOutsideBounds,
                gradientCoords,
            }),
            hovered: false,
            htmlLabels: [],
            id: item.id,
            opacity: item.opacity,
            points,
            series: item,
            svgLabels: [],
            width: item.lineWidth,
        };

        if (!isRangeSlider && shouldPrepareSeriesDataLabels(item)) {
            const labels = await preparePointDataLabels({
                series: item,
                points: points.filter((point) => !point.hiddenInTooltip),
                getFormatContext: () => ({}),
                getLabelText: (point) =>
                    formatAreaRangeDataLabel({
                        data: point.data,
                        format: item.dataLabels.format,
                    }),
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
