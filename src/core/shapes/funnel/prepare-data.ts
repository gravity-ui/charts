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

type LabelInfo = {
    text: string;
    width: number;
    height: number;
    hangingOffset: number;
    series: PreparedFunnelSeries;
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

    const getSegmentY = (index: number) => index * (itemHeight + connectorHeight);

    // measure labels and accumulate max outside-label widths per side.
    let rawLeftOffset = 0;
    let rawRightOffset = 0;
    const labelInfos: (LabelInfo | null)[] = [];

    for (let index = 0; index < series.length; index++) {
        const s = series[index];

        if (!s.dataLabels.enabled) {
            labelInfos.push(null);
            continue;
        }

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

        labelInfos.push({text: labelContent, width, height, hangingOffset, series: s});

        const {inside, align, padding} = s.dataLabels;
        if (!inside) {
            // Minimum offset so this label stays within the plot boundary.
            // Accounts for the fact that narrower segments are already indented from the edge.
            const ratio = s.data.value / maxValue;
            const minOffset = (2 * (width + padding) - boundsWidth * (1 - ratio)) / (1 + ratio);
            if (align === 'left') {
                rawLeftOffset = Math.max(rawLeftOffset, minOffset);
            } else if (align === 'right') {
                rawRightOffset = Math.max(rawRightOffset, minOffset);
            }
        }
    }

    // reserveSpace=true → inset only the labelled side so labels don't overlap segments.
    // reserveSpace=false → no inset; labels overlap segments.
    const {reserveSpace} = series[0].dataLabels;
    const segmentLeftOffset = reserveSpace ? rawLeftOffset : 0;
    const segmentRightOffset = reserveSpace ? rawRightOffset : 0;

    // compute shapes and label positions in a single pass.
    // centerX is constant across all segments — hoist it out of the loop.
    const segmentMaxWidth = boundsWidth - segmentLeftOffset - segmentRightOffset;
    const isTrapezoid = series[0].shape === 'trapezoid';
    const centerX = segmentLeftOffset + segmentMaxWidth / 2;

    const getItemWidth = (index: number) => (segmentMaxWidth * series[index].data.value) / maxValue;

    for (let index = 0; index < series.length; index++) {
        const s = series[index];
        const itemWidth = getItemWidth(index);
        const segmentY = getSegmentY(index);

        const isLastSegment = index === series.length - 1;
        const bottomWidth = isTrapezoid && !isLastSegment ? getItemWidth(index + 1) : itemWidth;
        const points: [number, number][] = [
            [centerX - itemWidth / 2, segmentY],
            [centerX + itemWidth / 2, segmentY],
            [centerX + bottomWidth / 2, segmentY + itemHeight],
            [centerX - bottomWidth / 2, segmentY + itemHeight],
        ];

        const item = {
            x: centerX - itemWidth / 2,
            y: segmentY,
            width: itemWidth,
            height: itemHeight,
            points,
            color: s.color,
            series: s,
            data: s.data,
            borderColor: '',
            borderWidth: 0,
            cursor: s.cursor,
        };
        items.push(item);

        const prevSeries = series[index - 1];
        const prevItem = items[index - 1];
        if (prevSeries && prevItem && prevSeries.connectors?.enabled) {
            // Use the actual bottom corners of the previous segment (points[3]/[2]) so that
            // trapezoid segments (whose bottom edge differs from the top edge) are handled correctly.
            const connectorPoints: [number, number][] = [
                prevItem.points[3],
                prevItem.points[2],
                item.points[1],
                item.points[0],
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

        const info = labelInfos[index];
        if (!info) continue;

        const {text, width, height, hangingOffset} = info;
        const {inside, padding} = s.dataLabels;
        const y = segmentY + itemHeight / 2 - height / 2 + hangingOffset;

        let x: number;
        if (inside) {
            switch (s.dataLabels.align) {
                case 'left':
                    x = item.x + padding;
                    break;
                case 'right':
                    x = item.x + item.width - width - padding;
                    break;
                default:
                    x = item.x + item.width / 2 - width / 2;
                    break;
            }
        } else {
            // Outside label snaps to the segment edge.
            // Clamp to bounds when space is not reserved.
            const clamp = !reserveSpace;
            switch (s.dataLabels.align) {
                case 'left':
                    x = clamp ? Math.max(0, item.x - width - padding) : item.x - width - padding;
                    break;
                case 'right':
                    x = clamp
                        ? Math.min(boundsWidth - width, item.x + item.width + padding)
                        : item.x + item.width + padding;
                    break;
                default:
                    x = boundsWidth / 2 - width / 2;
                    break;
            }
        }

        if (s.dataLabels.html) {
            htmlLabels.push({
                x,
                y,
                content: text,
                size: {width, height},
                style: s.dataLabels.style,
            });
        } else {
            svgLabels.push({
                x,
                y,
                text,
                style: s.dataLabels.style,
                size: {width, height, hangingOffset},
                textAnchor: 'start',
                series: s,
            });
        }
    }

    return {
        type: 'funnel',
        items,
        svgLabels,
        htmlLabels,
        connectors,
        markers: [],
        getHoverMarkers: () => [],
        annotations: [],
    };
}
