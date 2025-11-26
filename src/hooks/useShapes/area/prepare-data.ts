import {group} from 'd3';

import type {AreaSeriesData, HtmlItem, LabelData} from '../../../types';
import {getDataCategoryValue, getLabelsSize, getTextSizeFn} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import type {PreparedXAxis, PreparedYAxis} from '../../useAxis/types';
import type {ChartScale} from '../../useAxisScales';
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

    return Array.from(xValues);
}

export const prepareAreaData = async (args: {
    series: PreparedAreaSeries[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
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

            const yAxisTop = 0;
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
                const d =
                    seriesData.get(x) ??
                    ({
                        x,
                        y: 0,
                    } as AreaSeriesData);
                const yValue = getYValue({point: d, yAxis: seriesYAxis, yScale: seriesYScale});
                const yPointValue = yValue === null ? null : yValue - accumulatedYValue;
                if (yPointValue !== null) {
                    accumulatedYValues.set(x, yMin - yPointValue);
                }
                pointsAcc.push({
                    y0: yMin - accumulatedYValue,
                    x: xValue,
                    y: yPointValue,
                    data: d,
                    series: s,
                });
                return pointsAcc;
            }, []);

            const labels: LabelData[] = [];
            const htmlElements: HtmlItem[] = [];

            if (s.dataLabels.enabled) {
                const getTextSize = getTextSizeFn({style: s.dataLabels.style});

                for (let pointsIndex = 0; pointsIndex < points.length; pointsIndex++) {
                    const point = points[pointsIndex];

                    if (point.y === null) {
                        continue;
                    }

                    const text = getFormattedValue({
                        value: point.data.label || point.data.y,
                        ...s.dataLabels,
                    });

                    if (s.dataLabels.html) {
                        const size = await getLabelsSize({
                            labels: [text],
                            style: s.dataLabels.style,
                            html: s.dataLabels.html,
                        });
                        const labelSize = {width: size.maxWidth, height: size.maxHeight};
                        const x = Math.min(
                            xMax - labelSize.width,
                            Math.max(0, point.x - labelSize.width / 2),
                        );
                        const y = Math.max(
                            yAxisTop,
                            point.y - s.dataLabels.padding - labelSize.height,
                        );

                        htmlElements.push({
                            x,
                            y,
                            content: text,
                            size: labelSize,
                            style: s.dataLabels.style,
                        });
                    } else {
                        const labelSize = await getTextSize(text);
                        const x = Math.min(
                            xMax - labelSize.width,
                            Math.max(0, point.x - labelSize.width / 2),
                        );
                        const y = Math.max(
                            yAxisTop,
                            point.y - s.dataLabels.padding - labelSize.height,
                        );
                        labels.push({
                            text,
                            x,
                            y,
                            style: s.dataLabels.style,
                            size: labelSize,
                            textAnchor: 'start',
                            series: s,
                            active: true,
                        });
                    }
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

    return result;
};
