import {group, min, sort} from 'd3-array';
import type {ScaleLogarithmic} from 'd3-scale';
import isNil from 'lodash/isNil';
import round from 'lodash/round';

import type {PreparedSplit} from '~core/layout/split-types';
import type {ChartScale} from '~core/scales/types';
import {getDataCategoryValue, getLabelsSize, getTextSizeFn} from '~core/utils';
import {getFormattedValue} from '~core/utils/format';

import type {AreaSeriesData, HtmlItem, LabelData} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../useAxis/types';
import type {PreparedAreaSeries} from '../../useSeries/types';
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

    return sort(Array.from(xValues), (d) => d[1]);
}

async function prepareDataLabels({
    series,
    points,
    xMax,
    yAxisTop,
    isOutsideBounds,
}: {
    series: PreparedAreaSeries;
    points: PointData[];
    xMax: number;
    yAxisTop: number;
    isOutsideBounds: (x: number, y: number) => boolean;
}) {
    const svgLabels: LabelData[] = [];
    const htmlLabels: HtmlItem[] = [];

    const getTextSize = getTextSizeFn({style: series.dataLabels.style});
    for (let pointsIndex = 0; pointsIndex < points.length; pointsIndex++) {
        const point = points[pointsIndex];

        if (point.y === null || isOutsideBounds(point.x, point.y)) {
            continue;
        }

        const text = getFormattedValue({
            value: point.data.label ?? point.data.y,
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
            const y = Math.max(
                yAxisTop,
                point.y - series.dataLabels.padding - labelSize.height + labelSize.hangingOffset,
            );
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
    split: PreparedSplit;
    isOutsideBounds: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
}): Promise<PreparedAreaData[]> => {
    const {series, xAxis, xScale, yAxis, yScale, split, isOutsideBounds, isRangeSlider} = args;
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

            const isPercentStacking = seriesStack.some((s) => s.stacking === 'percent');
            const stackValues = Object.fromEntries(xValues.map(([key]) => [key, 0]));
            const ratio = Object.fromEntries(xValues.map(([key]) => [key, 1]));

            if (isPercentStacking) {
                seriesStack.forEach((s) => {
                    const yAxisIndex = s.yAxis;
                    const seriesYScale = yScale[yAxisIndex];

                    if (!seriesYScale) {
                        return;
                    }

                    s.data.forEach((d, index) => {
                        const yDataValue = d.y ?? null;
                        if (
                            yDataValue &&
                            !(isNil(s.data[index - 1]?.y) && isNil(s.data[index + 1]?.y))
                        ) {
                            const x = String(
                                xAxis.type === 'category'
                                    ? getDataCategoryValue({
                                          axisDirection: 'x',
                                          categories: xAxis.categories || [],
                                          data: d,
                                      })
                                    : d.x,
                            );
                            stackValues[x] += Number(yDataValue);
                        }
                    });
                });

                xValues.forEach(([x]) => {
                    if (stackValues[x]) {
                        ratio[x] = 100 / stackValues[x];
                    }
                });
            }

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

                let base = 0;
                if (seriesYAxis.type === 'logarithmic') {
                    const domainData = (seriesYScale as ScaleLogarithmic<number, number>).domain();
                    base = min(domainData) ?? 0;
                }

                const yMin =
                    getYValue({
                        point: {y: base},
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
                    const rawData = seriesData.get(x);
                    const d =
                        rawData ??
                        ({
                            x,
                            y: 0,
                        } as AreaSeriesData);
                    let yDataValue = d.y ?? null;

                    if (s.nullMode === 'connect' && (yDataValue === null || !rawData)) {
                        return pointsAcc;
                    }

                    if (yDataValue && isPercentStacking) {
                        yDataValue = Number(yDataValue) * ratio[x];
                    }

                    let yValue = getYValue({
                        point: {
                            y: yDataValue,
                        },
                        yAxis: seriesYAxis,
                        yScale: seriesYScale,
                    });

                    if (typeof yDataValue === 'number' && yValue !== null) {
                        yValue = round(yValue, 2);
                        const prevPoint = seriesData.get(xValues[index - 1]?.[0]);
                        const nextPoint = seriesData.get(xValues[index + 1]?.[0]);
                        const currentPointStackHeight = Math.abs(yMin - yValue);

                        if (yDataValue >= 0) {
                            const positiveStackHeights = positiveStackValues.get(x);
                            let prevSectionStackHeight = positiveStackHeights?.prev ?? 0;
                            let nextSectionStackHeight = positiveStackHeights?.next ?? 0;

                            const point = {
                                y0: yAxisTop + yMin - prevSectionStackHeight,
                                x: xValue,
                                y: yAxisTop + yValue - prevSectionStackHeight,
                                data: d,
                                series: s,
                            };

                            pointsAcc.push(point);

                            if (prevSectionStackHeight !== nextSectionStackHeight) {
                                const point2 = {
                                    y0: yAxisTop + yMin - nextSectionStackHeight,
                                    x: xValue,
                                    y: yAxisTop + yValue - nextSectionStackHeight,
                                    data: d,
                                    series: s,
                                };
                                pointsAcc.push(point2);

                                if (isPercentStacking) {
                                    const newYValue =
                                        yAxisTop +
                                        yValue -
                                        Math.max(prevSectionStackHeight, nextSectionStackHeight);
                                    point.y = newYValue;
                                    point2.y = newYValue;
                                }
                            }

                            if (prevPoint?.y !== null || s.nullMode === 'zero') {
                                prevSectionStackHeight =
                                    prevSectionStackHeight + currentPointStackHeight;
                            }

                            if (nextPoint?.y !== null || s.nullMode === 'zero') {
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

                let markers: MarkerData[] = [];
                const hasPerPointNormalMarkers = s.data.some(
                    (d) => d.marker?.states?.normal?.enabled,
                );

                if (s.marker.states.normal.enabled || hasPerPointNormalMarkers) {
                    markers = points.reduce<MarkerData[]>((markersAcc, p) => {
                        if (p.y === null) {
                            return markersAcc;
                        }
                        const pointNormalEnabled = p.data.marker?.states?.normal?.enabled ?? false;

                        if (s.marker.states.normal.enabled || pointNormalEnabled) {
                            markersAcc.push({
                                point: p as MarkerPointData,
                                active: true,
                                hovered: false,
                                clipped: isOutsideBounds(p.x, p.y),
                            });
                        }

                        return markersAcc;
                    }, []);
                }

                seriesStackData.push({
                    points,
                    markers,
                    svgLabels: [],
                    color: s.color,
                    opacity: s.opacity,
                    width: s.lineWidth,
                    series: s,
                    hovered: false,
                    active: true,
                    id: s.id,
                    htmlLabels: [],
                });
            }

            for (let itemIndex = 0; itemIndex < seriesStackData.length; itemIndex++) {
                const item = seriesStackData[itemIndex];
                const currentYAxis = yAxis[item.series.yAxis];
                const itemYAxisTop = split.plots[currentYAxis.plotIndex]?.top || 0;

                if (item.series.dataLabels.enabled && !isRangeSlider) {
                    const labelsData = await prepareDataLabels({
                        series: item.series,
                        points: item.points,
                        xMax,
                        yAxisTop: itemYAxisTop,
                        isOutsideBounds,
                    });
                    item.svgLabels.push(...labelsData.svgLabels);
                    item.htmlLabels.push(...labelsData.htmlLabels);
                }
            }

            result.push(...seriesStackData);
        }
    }

    return result;
};
