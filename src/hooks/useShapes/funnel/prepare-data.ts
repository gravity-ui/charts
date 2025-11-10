import {path} from 'd3';

import {calculateNumericProperty, getTextSizeFn} from '../../../utils';
import type {PreparedFunnelSeries} from '../../useSeries/types';

import type {PreparedFunnelData} from './types';

type Args = {
    series: PreparedFunnelSeries[];
    boundsWidth: number;
    boundsHeight: number;
};

function getLineConnectorPath(args: {points: [number, number][]}) {
    const {points} = args;

    const p = path();

    p.moveTo(...points[1]);
    p.lineTo(...points[2]);
    p.moveTo(...points[3]);
    p.lineTo(...points[0]);
    p.closePath();

    return p;
}

function getAreaConnectorPath(args: {points: [number, number][]}) {
    const {points} = args;

    const p = path();

    p.moveTo(...points[points.length - 1]);
    points.forEach((point) => p.lineTo(...point));
    p.closePath();

    return p;
}

export async function prepareFunnelData(args: Args): Promise<PreparedFunnelData> {
    const {series, boundsWidth, boundsHeight} = args;

    const items: PreparedFunnelData['items'] = [];
    const svgLabels: PreparedFunnelData['svgLabels'] = [];
    const connectors: PreparedFunnelData['connectors'] = [];

    const maxValue = Math.max(...series.map((s) => s.data.value));
    const itemBandSpace = boundsHeight / series.length;
    const connectorHeight =
        calculateNumericProperty({
            value: series[0].connectors?.height,
            base: itemBandSpace,
        }) ?? 0;
    const itemHeight = (boundsHeight - connectorHeight * (series.length - 1)) / series.length;
    const getTextSize = getTextSizeFn({style: series[0].dataLabels.style});

    for (let index = 0; index < series.length; index++) {
        const s = series[index];
        const d = s.data;
        const itemWidth = (boundsWidth * d.value) / maxValue;
        const funnelSegment = {
            x: boundsWidth / 2 - itemWidth / 2,
            y: index * (itemHeight + connectorHeight),
            width: itemWidth,
            height: itemHeight,
            color: s.color,
            series: s,
            data: d,
            borderColor: '',
            borderWidth: 0,
            cursor: s.cursor,
        };
        items.push(funnelSegment);

        if (s.dataLabels.enabled) {
            const labelSize = await getTextSize(d.name);
            svgLabels.push({
                x: funnelSegment.x + funnelSegment.width / 2 - labelSize.width / 2,
                y: funnelSegment.y + funnelSegment.height / 2 - labelSize.height / 2,
                text: d.name,
                style: s.dataLabels.style,
                size: labelSize,
                textAnchor: 'start',
                series: s,
            });
        }

        const prevSeries = series[index - 1];
        const prevItem = items[index - 1];
        if (prevSeries && prevItem && prevSeries.connectors?.enabled) {
            const connectorPoints: [number, number][] = [
                [prevItem.x, prevItem.y + prevItem.height],
                [prevItem.x + prevItem.width, prevItem.y + prevItem.height],
                [funnelSegment.x + funnelSegment.width, funnelSegment.y],
                [funnelSegment.x, funnelSegment.y],
            ];
            connectors.push({
                linePath: getLineConnectorPath({points: connectorPoints}),
                areaPath: getAreaConnectorPath({points: connectorPoints}),
                lineWidth: prevSeries.connectors.lineWidth,
                lineColor: prevSeries.connectors.lineColor,
                lineOpacity: prevSeries.connectors.lineOpacity,
                areaColor: prevSeries.connectors.areaColor,
                areaOpacity: prevSeries.connectors.areaOpacity,
                dashStyle: prevSeries.connectors.lineDashStyle,
            });
        }
    }

    const data: PreparedFunnelData = {
        type: 'funnel',
        items,
        svgLabels,
        htmlElements: [],
        connectors,
    };

    return data;
}
