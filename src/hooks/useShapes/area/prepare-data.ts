import {group, sort} from 'd3';

import type {AreaSeriesData, HtmlItem, LabelData} from '../../../types';
import {getDataCategoryValue, getLabelsSize, getLeftPosition} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import type {ChartScale} from '../../useAxisScales';
import type {PreparedAxis} from '../../useChartOptions/types';
import type {PreparedAreaSeries} from '../../useSeries/types';
import {getXValue, getYValue} from '../utils';

import type {MarkerData, PointData, PreparedAreaData} from './types';

function getLabelData(point: PointData, series: PreparedAreaSeries, xMax: number) {
    const text = getFormattedValue({
        value: point.data.label || point.data.y,
        ...series.dataLabels,
    });
    const style = series.dataLabels.style;
    const size = getLabelsSize({labels: [text], style, html: series.dataLabels.html});

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
                acc.set(key, getXValue({point: d, xAxis, xScale}));
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

    return sort(Array.from(xValues), ([_x, xValue]) => xValue);
}

export const prepareAreaData = (args: {
    series: PreparedAreaSeries[];
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxis: PreparedAxis[];
    yScale: ChartScale[];
    boundsHeight: number;
}): PreparedAreaData[] => {
    const {series, xAxis, xScale, yAxis, yScale, boundsHeight: plotHeight} = args;
    const [_xMin, xRangeMax] = xScale.range();
    const xMax = xRangeMax / (1 - xAxis.maxPadding);

    return Array.from(group(series, (s) => s.stackId)).reduce<PreparedAreaData[]>(
        (result, [_stackId, seriesStack]) => {
            const xValues = getXValues(seriesStack, xAxis, xScale);

            const accumulatedYValues = new Map<string, number>();
            xValues.forEach(([key]) => {
                accumulatedYValues.set(key, 0);
            });

            const seriesStackData = seriesStack.reduce<PreparedAreaData[]>((acc, s) => {
                const yAxisIndex = s.yAxis;
                const seriesYAxis = yAxis[yAxisIndex];
                const seriesYScale = yScale[yAxisIndex];
                const yMin = getYValue({point: {y: 0}, yAxis: seriesYAxis, yScale: seriesYScale});
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
                        seriesData.get(x) ||
                        ({
                            x,
                            // FIXME: think about how to break the series into separate areas(null Y values)
                            y: 0,
                        } as AreaSeriesData);
                    const yValue =
                        getYValue({point: d, yAxis: seriesYAxis, yScale: seriesYScale}) -
                        accumulatedYValue;
                    accumulatedYValues.set(x, yMin - yValue);

                    pointsAcc.push({
                        y0: yMin - accumulatedYValue,
                        x: xValue,
                        y: yValue,
                        data: d,
                        series: s,
                    });
                    return pointsAcc;
                }, []);

                let labels: LabelData[] = [];
                const htmlElements: HtmlItem[] = [];

                if (s.dataLabels.enabled) {
                    const labelItems = points.map<LabelData>((p) => getLabelData(p, s, xMax));
                    if (s.dataLabels.html) {
                        const htmlLabels = labelItems.map((l) => {
                            const style = l.style ?? s.dataLabels.style;
                            const labelSize = getLabelsSize({labels: [l.text], style, html: true});

                            return {
                                x: l.x - l.size.width / 2,
                                y: l.y,
                                content: l.text,
                                size: {width: labelSize.maxWidth, height: labelSize.maxHeight},
                                style,
                            };
                        });
                        htmlElements.push(...htmlLabels);
                    } else {
                        labels = labelItems;
                    }
                }

                let markers: MarkerData[] = [];
                if (s.marker.states.normal.enabled || s.marker.states.hover.enabled) {
                    markers = points.map<MarkerData>((p) => ({
                        point: p,
                        active: true,
                        hovered: false,
                    }));
                }

                acc.push({
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

                return acc;
            }, []);

            if (series.some((s) => s.stacking === 'percent')) {
                xValues.forEach(([x], index) => {
                    const stackHeight = accumulatedYValues.get(x) || 0;
                    let acc = 0;
                    const ratio = plotHeight / stackHeight;

                    seriesStackData.forEach((item) => {
                        const point = item.points[index];

                        if (point) {
                            const height = (point.y0 - point.y) * ratio;
                            point.y0 = plotHeight - height - acc;
                            point.y = point.y0 + height;

                            acc += height;
                        }
                    });
                });
            }

            return result.concat(seriesStackData);
        },
        [],
    );
};
