import type {HtmlItem, LabelData} from '../../../types';
import {getLabelsSize, getLeftPosition} from '../../../utils';
import type {ChartScale} from '../../useAxisScales';
import type {PreparedAxis} from '../../useChartOptions/types';
import type {PreparedLineSeries} from '../../useSeries/types';
import type {PreparedSplit} from '../../useSplit/types';
import {getXValue, getYValue} from '../utils';

import type {MarkerData, PointData, PreparedLineData} from './types';

function getLabelData(point: PointData, series: PreparedLineSeries, xMax: number) {
    const text = String(point.data.label || point.data.y);
    const style = series.dataLabels.style;
    const size = getLabelsSize({labels: [text], style});

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

function getHtmlLabel(point: PointData, series: PreparedLineSeries, xMax: number): HtmlItem {
    const content = String(point.data.label || point.data.y);
    const size = getLabelsSize({labels: [content], html: true});

    return {
        x: Math.min(xMax - size.maxWidth, Math.max(0, point.x)),
        y: Math.max(0, point.y - series.dataLabels.padding - size.maxHeight),
        content,
    };
}

export const prepareLineData = (args: {
    series: PreparedLineSeries[];
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxis: PreparedAxis[];
    yScale: ChartScale[];
    split: PreparedSplit;
}): PreparedLineData[] => {
    const {series, xAxis, yAxis, xScale, yScale, split} = args;
    const [_xMin, xRangeMax] = xScale.range();
    const xMax = xRangeMax / (1 - xAxis.maxPadding);

    return series.reduce<PreparedLineData[]>((acc, s) => {
        const yAxisIndex = s.yAxis;
        const seriesYAxis = yAxis[yAxisIndex];
        const yAxisTop = split.plots[seriesYAxis.plotIndex]?.top || 0;
        const seriesYScale = yScale[s.yAxis];
        const points = s.data.map((d) => ({
            x: getXValue({point: d, xAxis, xScale}),
            y: yAxisTop + getYValue({point: d, yAxis: seriesYAxis, yScale: seriesYScale}),
            active: true,
            data: d,
            series: s,
        }));

        const htmlElements: HtmlItem[] = [];
        let labels: LabelData[] = [];
        if (s.dataLabels.enabled) {
            if (s.dataLabels.html) {
                htmlElements.push(...points.map((p) => getHtmlLabel(p, s, xMax)));
            } else {
                labels = points.map<LabelData>((p) => getLabelData(p, s, xMax));
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

        return acc;
    }, []);
};
