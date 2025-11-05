import {group} from 'd3';

import type {AreaSeriesData, HtmlItem, LabelData} from '../../../types';
import {getDataCategoryValue, getLabelsSize, getLeftPosition} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import type {ChartScale} from '../../useAxisScales';
import type {PreparedAxis} from '../../useChartOptions/types';
import type {PreparedAreaSeries} from '../../useSeries/types';
import {getXValue, getYValue} from '../utils';

import type {MarkerData, MarkerPointData, PointData, PreparedAreaData} from './types';

async function getLabelData(point: MarkerPointData, series: PreparedAreaSeries, xMax: number) {
    const text = getFormattedValue({
        value: point.data.label || point.data.y,
        ...series.dataLabels,
    });
    const style = series.dataLabels.style;
    const size = await getLabelsSize({labels: [text], style, html: series.dataLabels.html});

    const labelData: LabelData = {
        text,
        x: point.x,
        y: point.y - series.dataLabels.padding,
        style,
        size: {width: size.maxWidth, height: size.maxHeight},
        textAnchor: 'middle',
        series: series,
        active: true,
    };

    const left = getLeftPosition(labelData);
    if (left < 0) {
        labelData.x = labelData.x + Math.abs(left);
    } else {
        const right = left + labelData.size.width;
        if (right > xMax) {
            labelData.x = labelData.x - (right - xMax);
        }
    }

    return labelData;
}

function getXValues(series: PreparedAreaSeries[], xAxis: PreparedAxis, xScale: ChartScale) {
    const categories = xAxis.categories || [];
    const xValues = series.reduce<Map<string, number>>((acc, s) => {
        s.data.forEach((d) => {
            const key = String(
                xAxis.type === 'category'
                    ? getDataCategoryValue({axisDirection: 'x', categories, data: d})
                    : d.x,
            );
            if (!acc.has(key)) {
                acc.set(key, getXValue({point: d, points: s.data, xAxis, xScale}));
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

export const prepareAreaData = async (args: {
    series: PreparedAreaSeries[];
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxis: PreparedAxis[];
    yScale: (ChartScale | undefined)[];
    boundsHeight: number;
    isOutsideBounds: (x: number, y: number) => boolean;
}): Promise<PreparedAreaData[]> => {
    const {series, xAxis, xScale, yAxis, yScale, boundsHeight: plotHeight, isOutsideBounds} = args;
    const [_xMin, xRangeMax] = xScale.range();
    const xMax = xRangeMax / (1 - xAxis.maxPadding);

    const result: PreparedAreaData[] = [];
    const list = Array.from(group(series, (s) => s.stackId));
    for (let i = 0; i < list.length; i++) {
        const [_stackId, seriesStack] = list[i];

        const xValues = getXValues(seriesStack, xAxis, xScale);

        const accumulatedYValues = new Map<string, number>();
        xValues.forEach(([key]) => {
            accumulatedYValues.set(key, 0);
        });

        const seriesStackData: PreparedAreaData[] = [];

        for (let j = 0; j < seriesStack.length; j++) {
            const s = seriesStack[j];
            const yAxisIndex = s.yAxis;
            const seriesYAxis = yAxis[yAxisIndex];
            const seriesYScale = yScale[yAxisIndex];

            if (!seriesYScale) {
                continue;
            }

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
            const points = xValues.reduce<PointData[]>((pointsAcc, [x, xValue]) => {
                const accumulatedYValue = accumulatedYValues.get(x) || 0;
                const d = seriesData.get(x) ?? ({x, y: null} as AreaSeriesData);

                const yValue = getYValue({point: d, yAxis: seriesYAxis, yScale: seriesYScale});

                if (yValue !== null) {
                    accumulatedYValues.set(x, yMin - yValue);
                }
                const yPointValue = yValue === null ? null : yValue - accumulatedYValue;

                pointsAcc.push({
                    y0: yMin - accumulatedYValue,
                    x: xValue,
                    y: yPointValue,
                    data: d,
                    series: s,
                });
                return pointsAcc;
            }, []);

            let labels: LabelData[] = [];
            const htmlElements: HtmlItem[] = [];

            if (s.dataLabels.enabled) {
                const labelItems = await Promise.all(
                    points.reduce<Promise<LabelData>[]>((labelItemsAcc, p) => {
                        if (p.y === null) {
                            return labelItemsAcc;
                        }
                        labelItemsAcc.push(getLabelData(p as MarkerPointData, s, xMax));
                        return labelItemsAcc;
                    }, []),
                );

                if (s.dataLabels.html) {
                    const htmlLabels = await Promise.all(
                        labelItems.map(async (l) => {
                            const style = l.style ?? s.dataLabels.style;
                            const labelSize = await getLabelsSize({
                                labels: [l.text],
                                style,
                                html: true,
                            });

                            return {
                                x: l.x - l.size.width / 2,
                                y: l.y,
                                content: l.text,
                                size: {
                                    width: labelSize.maxWidth,
                                    height: labelSize.maxHeight,
                                },
                                style,
                            };
                        }),
                    );
                    htmlElements.push(...htmlLabels);
                } else {
                    labels = labelItems;
                }
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
                const stackHeight = accumulatedYValues.get(x) || 0;
                let acc = 0;
                const ratio = plotHeight / stackHeight;

                seriesStackData.forEach((item) => {
                    const point = item.points[index];

                    if (point.y !== null) {
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

    return result;
};
