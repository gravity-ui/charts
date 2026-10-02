import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import type {ChartScale} from '../../scales/types';
import type {PreparedAreaRangeSeries} from '../../series/types';
import {getXValue, getYValue} from '../../shapes/utils';
import {preparePointDataLabels, shouldPrepareSeriesDataLabels} from '../../utils';
import {createGradientColorResolver} from '../../utils/gradient';
import type {ProjectedGradientPoint} from '../../utils/gradient-reference';
import {applyCapturedPointColors, prepareGradientCoords} from '../../utils/gradient-reference';

import {formatAreaRangeDataLabel} from './format';
import {prepareAreaRangeMarkers} from './markers';
import type {AreaRangePointData, PreparedAreaRangeData} from './types';
import {getRangeBBox, markHiddenRangePoints} from './utils';

const boundaryPoints = new WeakMap<
    ProjectedGradientPoint[],
    Partial<Record<'y0' | 'y1', ProjectedGradientPoint[]>>
>();

function getBoundaryPoints(points: ProjectedGradientPoint[], boundary: 'y0' | 'y1') {
    let cached = boundaryPoints.get(points);
    if (!cached) {
        cached = {};
        boundaryPoints.set(points, cached);
    }
    if (!cached[boundary]) {
        cached[boundary] = (points as AreaRangePointData[]).map((point) => ({
            data: point.data,
            x: point.x,
            y: point[boundary],
        }));
    }
    return cached[boundary];
}

export function projectAreaRangeData(args: {
    series: PreparedAreaRangeSeries[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    split: PreparedSplit;
    isOutsideBounds: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
}): PreparedAreaRangeData[] {
    const {series, xAxis, xScale, yAxis, yScale, split} = args;
    const result: PreparedAreaRangeData[] = [];

    for (const item of series) {
        const seriesYAxis = yAxis[item.yAxis];
        const seriesYScale = yScale[item.yAxis];

        if (!seriesYAxis || !seriesYScale) {
            continue;
        }

        const plot = split.plots[seriesYAxis.plotIndex];
        if (plot && plot.height <= 0) {
            continue;
        }
        const yAxisTop = plot?.top || 0;
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

        const bbox = item.gradient || item.fillGradient ? getRangeBBox(points) : null;
        result.push({
            active: true,
            annotations: [],
            color: item.color,
            gradientBBox: item.gradient ? bbox : null,
            fillGradientBBox: item.fillGradient ? bbox : null,
            markers: [],
            getHoverMarkers: () => [],
            hovered: false,
            htmlLabels: [],
            id: item.id,
            opacity: item.opacity,
            points,
            series: item,
            svgLabels: [],
            width: item.lineWidth,
        });
    }

    return result;
}

export async function prepareAreaRangeData(
    args: Parameters<typeof projectAreaRangeData>[0],
): Promise<PreparedAreaRangeData[]> {
    const {xScale, yAxis, yScale, split, isOutsideBounds, isRangeSlider} = args;
    const xMax = Math.max(...xScale.range());
    const result = projectAreaRangeData(args);
    for (const prepared of result) {
        const item = prepared.series;
        const seriesYAxis = yAxis[item.yAxis];
        const seriesYScale = yScale[item.yAxis];
        if (!seriesYScale) continue;
        const yAxisTop = split.plots[seriesYAxis.plotIndex]?.top || 0;
        const {points, gradientBBox, fillGradientBBox} = prepared;
        prepared.gradientCoords = prepareGradientCoords({
            bbox: gradientBBox,
            gradient: item.gradient,
            state: item.gradientState,
            paint: 'stroke',
            points,
            xScale,
            yScale: seriesYScale,
            yAxisTop,
        });
        prepared.fillGradientCoords = prepareGradientCoords({
            bbox: fillGradientBBox,
            gradient: item.fillGradient,
            state: item.gradientState,
            paint: 'fill',
            points,
            xScale,
            yScale: seriesYScale,
            yAxisTop,
        });
        const getGradientColor =
            item.gradient && gradientBBox && prepared.gradientCoords !== null
                ? createGradientColorResolver(item.gradient, gradientBBox, prepared.gradientCoords)
                : undefined;
        if (getGradientColor) {
            for (const point of points) {
                if (point.color === undefined && point.y !== null) {
                    point.fill = getGradientColor(point.x, point.y);
                }
            }
        }
        applyCapturedPointColors(points, item.gradientState, item.gradient, xScale, seriesYScale);
        Object.assign(
            prepared,
            prepareAreaRangeMarkers({
                points,
                series: item,
                yAxis: seriesYAxis,
                yScale: seriesYScale,
                yAxisTop,
                isOutsideBounds,
                getGradientColor,
                preparePointFills: (markerPoints, boundary) =>
                    applyCapturedPointColors(
                        markerPoints,
                        item.gradientState,
                        item.gradient,
                        xScale,
                        seriesYScale,
                        (sourcePoints) => getBoundaryPoints(sourcePoints, boundary),
                    ),
            }),
        );
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
    }
    return result;
}
