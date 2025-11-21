import {path} from 'd3';

import {calculateNumericProperty, getFormattedValue, getTextSizeFn} from '../../../utils';
import type {PreparedFunnelSeries} from '../../useSeries/types';

import type {PreparedFunnelData} from './types';

type Args = {
    series: PreparedFunnelSeries[];
    boundsWidth: number;
    boundsHeight: number;
};

function getLineConnectorPaths(args: {points: [number, number][]}) {
    const {points} = args;

    const leftPath = path();
    leftPath.moveTo(...points[0]);
    leftPath.lineTo(...points[3]);

    const rightPath = path();
    rightPath.moveTo(...points[1]);
    rightPath.lineTo(...points[2]);

    return [leftPath, rightPath];
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

    const getSegmentY = (index: number) => {
        return index * (itemHeight + connectorHeight);
    };

    let segmentLeftOffset = 0;
    let segmentRightOffset = 0;
    for (let index = 0; index < series.length; index++) {
        const s = series[index];

        if (s.dataLabels.enabled) {
            const d = s.data;
            const labelContent =
                d.label ?? getFormattedValue({value: d.value, format: s.dataLabels.format});
            const labelSize = await getTextSize(labelContent);

            let x;
            switch (s.dataLabels.align) {
                case 'left': {
                    x = 0;
                    segmentLeftOffset = Math.max(segmentLeftOffset, labelSize.width);
                    break;
                }
                case 'right': {
                    x = boundsWidth - labelSize.width;
                    segmentRightOffset = Math.max(segmentRightOffset, labelSize.width);
                    break;
                }
                case 'center': {
                    x = boundsWidth / 2 - labelSize.width / 2;
                    break;
                }
            }

            svgLabels.push({
                x,
                y: getSegmentY(index) + itemHeight / 2 - labelSize.height / 2,
                text: labelContent,
                style: s.dataLabels.style,
                size: labelSize,
                textAnchor: 'start',
                series: s,
            });
        }
    }

    const segmentMaxWidth = boundsWidth - segmentLeftOffset - segmentRightOffset;
    for (let index = 0; index < series.length; index++) {
        const s = series[index];
        const d = s.data;
        const itemWidth = (segmentMaxWidth * d.value) / maxValue;
        const funnelSegment = {
            x: segmentLeftOffset + segmentMaxWidth / 2 - itemWidth / 2,
            y: getSegmentY(index),
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
                linePath: getLineConnectorPaths({points: connectorPoints}),
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
        connectors,
    };

    return data;
}
