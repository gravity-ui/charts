import {path} from 'd3-path';

import type {PreparedFunnelSeries} from '../../series/types';
import {
    calculateNumericProperty,
    getFormattedValue,
    getLabelsSize,
    getTextSizeFn,
} from '../../utils';

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
    const htmlLabels: PreparedFunnelData['htmlLabels'] = [];
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

            const {width, height, hangingOffset} = s.dataLabels.html
                ? await getLabelsSize({
                      labels: [labelContent],
                      style: s.dataLabels.style,
                      html: true,
                  }).then((size) => ({
                      width: size.maxWidth,
                      height: size.maxHeight,
                      hangingOffset: 0,
                  }))
                : await getTextSize(labelContent);

            let x;
            switch (s.dataLabels.align) {
                case 'left': {
                    x = 0;
                    segmentLeftOffset = Math.max(segmentLeftOffset, width);
                    break;
                }
                case 'right': {
                    x = boundsWidth - width;
                    segmentRightOffset = Math.max(segmentRightOffset, width);
                    break;
                }
                case 'center': {
                    x = boundsWidth / 2 - width / 2;
                    break;
                }
            }

            const y = getSegmentY(index) + itemHeight / 2 - height / 2 + hangingOffset;

            if (s.dataLabels.html) {
                htmlLabels.push({
                    x,
                    y,
                    content: labelContent,
                    size: {width, height},
                    style: s.dataLabels.style,
                });
            } else {
                svgLabels.push({
                    x,
                    y,
                    text: labelContent,
                    style: s.dataLabels.style,
                    size: {width, height, hangingOffset},
                    textAnchor: 'start',
                    series: s,
                });
            }
        }
    }

    const segmentMaxWidth = boundsWidth - segmentLeftOffset - segmentRightOffset;
    const isTrapezoid = series[0]?.shape === 'trapezoid';

    const getItemWidth = (index: number) => (segmentMaxWidth * series[index].data.value) / maxValue;

    for (let index = 0; index < series.length; index++) {
        const s = series[index];
        const d = s.data;
        const itemWidth = getItemWidth(index);
        const centerX = segmentLeftOffset + segmentMaxWidth / 2;
        const segmentY = getSegmentY(index);

        const isLastSegment = index === series.length - 1;
        const bottomWidth = isTrapezoid && !isLastSegment ? getItemWidth(index + 1) : itemWidth;
        const points: [number, number][] = [
            [centerX - itemWidth / 2, segmentY],
            [centerX + itemWidth / 2, segmentY],
            [centerX + bottomWidth / 2, segmentY + itemHeight],
            [centerX - bottomWidth / 2, segmentY + itemHeight],
        ];

        const funnelSegment = {
            x: centerX - itemWidth / 2,
            y: segmentY,
            width: itemWidth,
            height: itemHeight,
            points,
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
        htmlLabels,
        connectors,
    };

    return data;
}
