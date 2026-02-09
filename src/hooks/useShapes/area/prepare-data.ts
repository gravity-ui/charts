import {group} from 'd3';

import type {AreaSeriesData, HtmlItem, LabelData} from '../../../types';
import {getDataCategoryValue, getLabelsSize, getTextSizeFn} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import type {PreparedXAxis, PreparedYAxis} from '../../useAxis/types';
import type {ChartScale} from '../../useAxisScales/types';
import type {PreparedAreaSeries} from '../../useSeries/types';
import type {PreparedSplit} from '../../useSplit/types';
import {getXValue, getYValue} from '../utils';

import type {MarkerData, MarkerPointData, PointData, PreparedAreaData} from './types';

function getXValues(series: PreparedAreaSeries[], xAxis: PreparedXAxis, xScale: ChartScale) {
    const categories = xAxis.categories || [];
    const xValues = series.reduce<Map<string, number>>((acc, s) => {
        s.data.forEach((d) => {
            const key = String(
                xAxis.type === 'category'
                    ? getDataCategoryValue({axisDirection: 'x', categories, data: d})
                    : d.x,
            );
            const xValue = getXValue({point: d, points: s.data, xAxis, xScale});
            if (!acc.has(key) && xValue !== null) {
                acc.set(key, xValue);
            }
        });
        return acc;
    }, new Map());

    if (xAxis.type === 'category') {
        return categories.reduce<[string, number][]>((acc, category) => {
            const xValue = xValues.get(category);
            if (typeof xValue === 'number') {
                acc.push([category, xValue]);
            }

            return acc;
        }, []);
    }

    return Array.from(xValues);
}

async function prepareDataLabels({
    series,
    points,
    xMax,
    yAxisTop,
}: {
    series: PreparedAreaSeries;
    points: PointData[];
    xMax: number;
    yAxisTop: number;
}) {
    const svgLabels: LabelData[] = [];
    const htmlLabels: HtmlItem[] = [];

    const getTextSize = getTextSizeFn({style: series.dataLabels.style});
    for (let pointsIndex = 0; pointsIndex < points.length; pointsIndex++) {
        const point = points[pointsIndex];

        if (point.y === null) {
            continue;
        }

        const text = getFormattedValue({
            value: point.data.label || point.data.y,
            ...series.dataLabels,
        });

        if (series.dataLabels.html) {
            const size = await getLabelsSize({
                labels: [text],
                style: series.dataLabels.style,
                html: series.dataLabels.html,
            });
            const labelSize = {width: size.maxWidth, height: size.maxHeight};
            const x = Math.min(xMax - labelSize.width, Math.max(0, point.x - labelSize.width / 2));
            const y = Math.max(yAxisTop, point.y - series.dataLabels.padding - labelSize.height);

            htmlLabels.push({
                x,
                y,
                content: text,
                size: labelSize,
                style: series.dataLabels.style,
            });
        } else {
            const labelSize = await getTextSize(text);
            const x = Math.min(xMax - labelSize.width, Math.max(0, point.x - labelSize.width / 2));
            const y = Math.max(yAxisTop, point.y - series.dataLabels.padding - labelSize.height);
            svgLabels.push({
                text,
                x,
                y,
                style: series.dataLabels.style,
                size: labelSize,
                textAnchor: 'start',
                series,
                active: true,
            });
        }
    }

    return {svgLabels, htmlLabels};
}

export const prepareAreaData = async (args: {
    series: PreparedAreaSeries[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    boundsHeight: number;
    split: PreparedSplit;
    isOutsideBounds: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
}): Promise<PreparedAreaData[]> => {
    const {
        series,
        xAxis,
        xScale,
        yAxis,
        yScale,
        boundsHeight: plotHeight,
        split,
        isOutsideBounds,
        isRangeSlider,
    } = args;
    const [_xMin, xRangeMax] = xScale.range();
    const xMax = xRangeMax;

    const result: PreparedAreaData[] = [];
    const dataByPlots = Array.from(
        group(
            series,
            (s) => {
                const yAxisIndex = s.yAxis;
                const seriesYAxis = yAxis[yAxisIndex];
                const plotIndex = seriesYAxis.plotIndex;
                return plotIndex;
            },
            (s) => s.stackId,
        ),
    );

    const plotIndexes = Object.keys(dataByPlots);
    for (let plotDataIndex = 0; plotDataIndex < plotIndexes.length; plotDataIndex++) {
        const [plotIndex, stackItems] = dataByPlots[plotDataIndex];
        const list = Array.from(stackItems);
        for (let i = 0; i < list.length; i++) {
            const [_stackId, seriesStack] = list[i];

            const xValues = getXValues(seriesStack, xAxis, xScale);

            const positiveStackValues = new Map<string, {prev: number; next: number}>();
            const negativeStackValues = new Map<string, {prev: number; next: number}>();
            xValues.forEach(([key]) => {
                positiveStackValues.set(key, {prev: 0, next: 0});
                negativeStackValues.set(key, {prev: 0, next: 0});
            });

            const seriesStackData: PreparedAreaData[] = [];
            // Process series in reverse order so that the first series in input
            // appears at the top of the stack (furthest from baseline)
            for (let j = seriesStack.length - 1; j >= 0; j--) {
                const s = seriesStack[j];
                const yAxisIndex = s.yAxis;
                const seriesYAxis = yAxis[yAxisIndex];
                const seriesYScale = yScale[yAxisIndex];

                if (!seriesYScale) {
                    continue;
                }

                const yAxisTop = split.plots[plotIndex]?.top || 0;

                const yMin =
                    getYValue({
                        point: {y: 0},
                        points: s.data,
                        yAxis: seriesYAxis,
                        yScale: seriesYScale,
                    }) ?? 0;
                const seriesData = s.data.reduce<Map<string, AreaSeriesData>>((m, d) => {
                    const key = String(
                        xAxis.type === 'category'
                            ? getDataCategoryValue({
                                  axisDirection: 'x',
                                  categories: xAxis.categories || [],
                                  data: d,
                              })
                            : d.x,
                    );
                    return m.set(key, d);
                }, new Map());
                const points = xValues.reduce<PointData[]>((pointsAcc, [x, xValue], index) => {
                    const d =
                        seriesData.get(x) ??
                        ({
                            x,
                            y: 0,
                        } as AreaSeriesData);
                    const yDataValue = d.y ?? null;

                    if (s.nullMode === 'connect' && yDataValue === null) {
                        return pointsAcc;
                    }

                    const yValue = getYValue({point: d, yAxis: seriesYAxis, yScale: seriesYScale});
                    if (typeof yDataValue === 'number' && yValue !== null) {
                        const prevPoint = seriesData.get(xValues[index - 1]?.[0]);
                        const nextPoint = seriesData.get(xValues[index + 1]?.[0]);
                        const currentPointStackHeight = Math.abs(yMin - yValue);

                        if (yDataValue >= 0) {
                            const positiveStackHeights = positiveStackValues.get(x);
                            let prevSectionStackHeight = positiveStackHeights?.prev ?? 0;
                            let nextSectionStackHeight = positiveStackHeights?.next ?? 0;

                            pointsAcc.push({
                                y0: yAxisTop + yMin - prevSectionStackHeight,
                                x: xValue,
                                y: yAxisTop + yValue - prevSectionStackHeight,
                                data: d,
                                series: s,
                            });

                            if (prevSectionStackHeight !== nextSectionStackHeight) {
                                pointsAcc.push({
                                    y0: yAxisTop + yMin - nextSectionStackHeight,
                                    x: xValue,
                                    y: yAxisTop + yValue - nextSectionStackHeight,
                                    data: d,
                                    series: s,
                                });
                            }

                            if (prevPoint?.y !== null) {
                                prevSectionStackHeight =
                                    prevSectionStackHeight + currentPointStackHeight;
                            }

                            if (nextPoint?.y !== null) {
                                nextSectionStackHeight =
                                    nextSectionStackHeight + currentPointStackHeight;
                            }

                            positiveStackValues.set(x, {
                                prev: prevSectionStackHeight,
                                next: nextSectionStackHeight,
                            });
                        } else {
                            const negativeStackHeights = negativeStackValues.get(x);
                            let prevSectionStackHeight = negativeStackHeights?.prev ?? 0;
                            let nextSectionStackHeight = negativeStackHeights?.next ?? 0;

                            pointsAcc.push({
                                y0: yAxisTop + yMin + prevSectionStackHeight,
                                x: xValue,
                                y: yAxisTop + yValue + prevSectionStackHeight,
                                data: d,
                                series: s,
                            });

                            if (prevSectionStackHeight !== nextSectionStackHeight) {
                                pointsAcc.push({
                                    y0: yAxisTop + yMin + nextSectionStackHeight,
                                    x: xValue,
                                    y: yAxisTop + yValue + nextSectionStackHeight,
                                    data: d,
                                    series: s,
                                });
                            }

                            if (prevPoint?.y !== null) {
                                prevSectionStackHeight =
                                    prevSectionStackHeight + currentPointStackHeight;
                            }

                            if (nextPoint?.y !== null) {
                                nextSectionStackHeight =
                                    nextSectionStackHeight + currentPointStackHeight;
                            }

                            negativeStackValues.set(x, {
                                prev: prevSectionStackHeight,
                                next: nextSectionStackHeight,
                            });
                        }
                    } else {
                        pointsAcc.push({
                            y0: yAxisTop + yMin,
                            x: xValue,
                            y: null,
                            data: d,
                            series: s,
                        });
                    }

                    return pointsAcc;
                }, []);
                const labels: LabelData[] = [];
                const htmlElements: HtmlItem[] = [];

                if (s.dataLabels.enabled && !isRangeSlider) {
                    const labelsData = await prepareDataLabels({series: s, points, xMax, yAxisTop});
                    labels.push(...labelsData.svgLabels);
                    htmlElements.push(...labelsData.htmlLabels);
                }

                let markers: MarkerData[] = [];
                if (s.marker.states.normal.enabled || s.marker.states.hover.enabled) {
                    markers = points.reduce<MarkerData[]>((markersAcc, p) => {
                        if (p.y === null) {
                            return markersAcc;
                        }
                        markersAcc.push({
                            point: p as MarkerPointData,
                            active: true,
                            hovered: false,
                            clipped: isOutsideBounds(p.x, p.y),
                        });
                        return markersAcc;
                    }, []);
                }

                seriesStackData.push({
                    points,
                    markers,
                    labels,
                    color: s.color,
                    opacity: s.opacity,
                    width: s.lineWidth,
                    series: s,
                    hovered: false,
                    active: true,
                    id: s.id,
                    htmlElements,
                });
            }

            if (series.some((s) => s.stacking === 'percent')) {
                xValues.forEach(([x], index) => {
                    const stackHeight = positiveStackValues.get(x)?.prev || 0;
                    let acc = 0;
                    const ratio = plotHeight / stackHeight;

                    seriesStackData.forEach((item) => {
                        const point = item.points[index];

                        if (point.y !== null && point.y !== undefined) {
                            const height = (point.y0 - point.y) * ratio;
                            point.y0 = plotHeight - height - acc;
                            point.y = point.y0 + height;

                            acc += height;
                        }
                    });
                });
            }

            result.push(...seriesStackData);
        }
    }
    return result;
};
