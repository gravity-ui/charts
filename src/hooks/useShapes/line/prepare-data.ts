import type {HtmlItem, LabelData} from '../../../types';
import {getLabelsSize, getLeftPosition} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import type {PreparedXAxis, PreparedYAxis} from '../../useAxis/types';
import type {ChartScale} from '../../useAxisScales';
import type {PreparedLineSeries} from '../../useSeries/types';
import type {PreparedSplit} from '../../useSplit/types';
import {getXValue, getYValue} from '../utils';

import type {MarkerData, MarkerPointData, PreparedLineData} from './types';

async function getLabelData(point: MarkerPointData, series: PreparedLineSeries, xMax: number) {
    const text = getFormattedValue({
        value: point.data.label || point.data.y,
        ...series.dataLabels,
    });
    const style = series.dataLabels.style;
    const size = await getLabelsSize({labels: [text], style});

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
            labelData.x = labelData.x - xMax - right;
        }
    }

    return labelData;
}

async function getHtmlLabel(
    point: MarkerPointData,
    series: PreparedLineSeries,
    xMax: number,
): Promise<HtmlItem> {
    const content = String(point.data.label || point.data.y);
    const size = await getLabelsSize({labels: [content], html: true});

    return {
        x: Math.min(xMax - size.maxWidth, Math.max(0, point.x)),
        y: Math.max(0, point.y - series.dataLabels.padding - size.maxHeight),
        content,
        size: {width: size.maxWidth, height: size.maxHeight},
        style: series.dataLabels.style,
    };
}

export const prepareLineData = async (args: {
    series: PreparedLineSeries[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    split: PreparedSplit;
    isOutsideBounds: (x: number, y: number) => boolean;
}): Promise<PreparedLineData[]> => {
    const {series, xAxis, yAxis, xScale, yScale, split, isOutsideBounds} = args;
    const [_xMin, xRangeMax] = xScale.range();
    const xMax = xRangeMax / (1 - xAxis.maxPadding);

    const acc: PreparedLineData[] = [];
    for (let i = 0; i < series.length; i++) {
        const s = series[i];
        const yAxisIndex = s.yAxis;
        const seriesYAxis = yAxis[yAxisIndex];
        const yAxisTop = split.plots[seriesYAxis.plotIndex]?.top || 0;
        const seriesYScale = yScale[s.yAxis];

        if (!seriesYScale) {
            continue;
        }
        const points = s.data.map((d) => {
            const yValue = getYValue({
                point: d,
                points: s.data,
                yAxis: seriesYAxis,
                yScale: seriesYScale,
            });
            return {
                x: getXValue({point: d, points: s.data, xAxis, xScale}),
                y: yValue === null ? null : yAxisTop + yValue,
                active: true,
                data: d,
                series: s,
            };
        });

        const htmlElements: HtmlItem[] = [];
        let labels: LabelData[] = [];
        if (s.dataLabels.enabled) {
            if (s.dataLabels.html) {
                const list = await Promise.all(
                    points.reduce<Promise<HtmlItem>[]>((result, p) => {
                        if (p.y === null) {
                            return result;
                        }
                        result.push(getHtmlLabel(p as MarkerPointData, s, xMax));
                        return result;
                    }, []),
                );
                htmlElements.push(...list);
            } else {
                labels = await Promise.all(
                    points.reduce<Promise<LabelData>[]>((result, p) => {
                        if (p.y === null) {
                            return result;
                        }
                        result.push(getLabelData(p as MarkerPointData, s, xMax));
                        return result;
                    }, []),
                );
            }
        }

        let markers: MarkerData[] = [];
        if (s.marker.states.normal.enabled || s.marker.states.hover.enabled) {
            markers = points.reduce<MarkerData[]>((result, p) => {
                if (p.y === null || p.x === null) {
                    return result;
                }
                result.push({
                    point: p as MarkerPointData,
                    active: true,
                    hovered: false,
                    clipped: isOutsideBounds(p.x, p.y),
                });
                return result;
            }, []);
        }
        const result: PreparedLineData = {
            points,
            markers,
            labels,
            color: s.color,
            width: s.lineWidth,
            series: s,
            hovered: false,
            active: true,
            id: s.id,
            dashStyle: s.dashStyle,
            linecap: s.linecap,
            opacity: s.opacity,
            htmlElements,
        };

        acc.push(result);
    }

    return acc;
};
