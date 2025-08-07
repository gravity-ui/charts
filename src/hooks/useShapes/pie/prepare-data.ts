import type {PieArcDatum} from 'd3';
import {arc, group, line as lineGenerator} from 'd3';

import type {HtmlItem, PieSeries} from '../../../types';
import {
    calculateNumericProperty,
    getLabelsSize,
    getLeftPosition,
    isLabelsOverlapping,
} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import type {PreparedPieSeries} from '../../useSeries/types';

import type {PieConnectorData, PieLabelData, PreparedPieData, SegmentData} from './types';
import {getCurveFactory, pieGenerator} from './utils';

const FULL_CIRCLE = Math.PI * 2;

type Args = {
    series: PreparedPieSeries[];
    boundsWidth: number;
    boundsHeight: number;
};

const getCenter = (
    boundsWidth: number,
    boundsHeight: number,
    center?: PieSeries['center'],
): [number, number] => {
    const defaultX = boundsWidth * 0.5;
    const defaultY = boundsHeight * 0.5;

    if (!center) {
        return [defaultX, defaultY];
    }

    const [x, y] = center;
    const resultX = calculateNumericProperty({value: x, base: boundsWidth}) ?? defaultX;
    const resultY = calculateNumericProperty({value: y, base: boundsHeight}) ?? defaultY;

    return [resultX, resultY];
};

export function preparePieData(args: Args): PreparedPieData[] {
    const {series: preparedSeries, boundsWidth, boundsHeight} = args;
    const haloSize = preparedSeries[0].states.hover.halo.enabled
        ? preparedSeries[0].states.hover.halo.size
        : 0;
    const maxRadius = Math.min(boundsWidth, boundsHeight) / 2 - haloSize;
    const minRadius = maxRadius * 0.3;
    const groupedPieSeries = group(preparedSeries, (pieSeries) => pieSeries.stackId);

    const prepareItem = (stackId: string, items: PreparedPieSeries[]) => {
        const series = items[0];
        const {
            center,
            borderWidth,
            borderColor,
            borderRadius,
            innerRadius: seriesInnerRadius,
            dataLabels,
        } = series;

        const data: PreparedPieData = {
            id: stackId,
            center: getCenter(boundsWidth, boundsHeight, center),
            innerRadius: 0,
            segments: [],
            labels: [],
            htmlLabels: [],
            connectors: [],
            borderColor,
            borderWidth,
            borderRadius,
            series: items[0],
            connectorCurve: dataLabels.connectorCurve,
            halo: {
                enabled: series.states.hover.halo.enabled,
                opacity: series.states.hover.halo.opacity,
                size: series.states.hover.halo.size,
            },
        };

        const {maxHeight: labelHeight} = getLabelsSize({
            labels: ['Some Label'],
            style: dataLabels.style,
        });
        let segmentMaxRadius = 0;
        const segments = items.map<SegmentData>((item) => {
            let maxSegmentRadius = maxRadius;
            if (dataLabels.enabled) {
                maxSegmentRadius -= dataLabels.distance + dataLabels.connectorPadding + labelHeight;
            }

            const segmentRadius =
                calculateNumericProperty({value: item.radius, base: maxSegmentRadius}) ??
                maxSegmentRadius;
            segmentMaxRadius = Math.max(segmentMaxRadius, segmentRadius);
            return {
                value: item.value,
                color: item.color,
                opacity: item.opacity,
                series: item,
                hovered: false,
                active: true,
                pie: data,
                radius: segmentRadius,
            };
        });

        data.segments = pieGenerator(segments);
        data.innerRadius =
            calculateNumericProperty({value: seriesInnerRadius, base: segmentMaxRadius}) ?? 0;

        return data;
    };

    const prepareLabels = (prepareLabelsArgs: {
        data: PreparedPieData;
        series: PreparedPieSeries[];
        allowOverlow?: boolean;
    }) => {
        const {data, series, allowOverlow = true} = prepareLabelsArgs;
        const {dataLabels} = series[0];

        const labels: PieLabelData[] = [];
        const htmlLabels: HtmlItem[] = [];
        const connectors: PieConnectorData[] = [];

        if (!dataLabels.enabled) {
            return {labels, htmlLabels, connectors};
        }

        let line = lineGenerator();
        const curveFactory = getCurveFactory(data);
        if (curveFactory) {
            line = line.curve(curveFactory);
        }

        const {style, connectorPadding, distance} = dataLabels;
        const {maxHeight: labelHeight} = getLabelsSize({labels: ['Some Label'], style});
        const connectorStartPointGenerator = arc<PieArcDatum<SegmentData>>()
            .innerRadius((d) => d.data.radius)
            .outerRadius((d) => d.data.radius);
        const connectorMidPointGenerator = arc<PieArcDatum<SegmentData>>()
            .innerRadius((d) => d.data.radius + distance / 2)
            .outerRadius((d) => d.data.radius + distance / 2);
        const connectorEndPointGenerator = arc<PieArcDatum<SegmentData>>()
            .innerRadius((d) => d.data.radius + distance)
            .outerRadius((d) => d.data.radius + distance);
        const labelArcGenerator = arc<PieArcDatum<SegmentData>>()
            .innerRadius((d) => d.data.radius + distance + connectorPadding)
            .outerRadius((d) => d.data.radius + distance + connectorPadding);

        series.forEach((d, index) => {
            const prevLabel = labels[labels.length - 1];
            const text = getFormattedValue({
                value: d.data.label || d.data.value,
                ...d.dataLabels,
            });
            const shouldUseHtml = dataLabels.html;
            const labelSize = getLabelsSize({labels: [text], style, html: shouldUseHtml});
            const labelWidth = labelSize.maxWidth;
            const relatedSegment = data.segments[index];

            const getLabelPosition = (angle: number) => {
                let [x, y] = labelArcGenerator.centroid({
                    ...relatedSegment,
                    startAngle: angle,
                    endAngle: angle,
                });

                if (shouldUseHtml) {
                    x = x < 0 ? x - labelWidth : x;
                    y = y - labelSize.maxHeight;
                } else {
                    y = y < 0 ? y - labelHeight : y;
                }

                return [x, y];
            };

            const getConnectorPoints = (angle: number) => {
                const connectorStartPoint = connectorStartPointGenerator.centroid(relatedSegment);
                const connectorEndPoint = connectorEndPointGenerator.centroid({
                    ...relatedSegment,
                    startAngle: angle,
                    endAngle: angle,
                });

                if (dataLabels.connectorShape === 'straight-line') {
                    return [connectorStartPoint, connectorEndPoint];
                }

                const connectorMidPoint = connectorMidPointGenerator.centroid(relatedSegment);
                return [connectorStartPoint, connectorMidPoint, connectorEndPoint];
            };

            const midAngle = Math.max(
                prevLabel?.angle || 0,
                relatedSegment.startAngle +
                    (relatedSegment.endAngle - relatedSegment.startAngle) / 2,
            );
            const [x, y] = getLabelPosition(midAngle);
            const label: PieLabelData = {
                text,
                x,
                y,
                style,
                size: {width: labelWidth, height: labelHeight},
                maxWidth: labelWidth,
                textAnchor: midAngle < Math.PI ? 'start' : 'end',
                series: {id: d.id},
                active: true,
                segment: relatedSegment.data,
                angle: midAngle,
            };

            if (!allowOverlow) {
                const labelLeftPosition = getLeftPosition(label);
                const newMaxWidth =
                    labelLeftPosition > 0
                        ? Math.min(boundsWidth / 2 - labelLeftPosition, labelWidth)
                        : Math.min(labelWidth - (-labelLeftPosition - boundsWidth / 2), labelWidth);
                if (newMaxWidth !== label.maxWidth) {
                    label.maxWidth = Math.max(0, newMaxWidth);
                }
            }

            let overlap = false;
            if (prevLabel) {
                overlap = isLabelsOverlapping(prevLabel, label, dataLabels.padding);

                if (overlap) {
                    let shouldAdjustAngle = true;

                    const step = Math.PI / 180;
                    while (shouldAdjustAngle) {
                        const newAngle = label.angle + step;
                        if (newAngle > FULL_CIRCLE && newAngle % FULL_CIRCLE > labels[0].angle) {
                            shouldAdjustAngle = false;
                        } else {
                            label.angle = newAngle;
                            const [newX, newY] = getLabelPosition(newAngle);

                            label.x = newX;
                            label.y = newY;

                            if (!isLabelsOverlapping(prevLabel, label, dataLabels.padding)) {
                                shouldAdjustAngle = false;
                                overlap = false;
                            }
                        }
                    }
                }
            }

            const isLabelOverlapped = !dataLabels.allowOverlap && overlap;
            if (!isLabelOverlapped && label.maxWidth > 0) {
                if (shouldUseHtml) {
                    htmlLabels.push({
                        x: data.center[0] + label.x,
                        y: Math.max(0, data.center[1] + label.y),
                        content: label.text,
                        size: label.size,
                        style: label.style,
                    });
                } else {
                    labels.push(label);
                }

                const connector = {
                    path: line(getConnectorPoints(midAngle)),
                    color: relatedSegment.data.color,
                };
                connectors.push(connector);
            }
        });

        return {
            labels,
            htmlLabels,
            connectors,
        };
    };

    return Array.from(groupedPieSeries).map<PreparedPieData>(([stackId, items]) => {
        const data = prepareItem(stackId, items);
        const preparedLabels = prepareLabels({
            data,
            series: items,
        });

        let maxLeftRightFreeSpace = Infinity;
        let labelsOverflow = 0;
        preparedLabels.labels.forEach((label) => {
            const left = getLeftPosition(label);

            let freeSpace = 0;
            if (left < 0) {
                freeSpace = boundsWidth / 2 - Math.abs(left);
            } else {
                freeSpace = boundsWidth / 2 - (left + label.size.width);
            }

            maxLeftRightFreeSpace = Math.max(0, Math.min(maxLeftRightFreeSpace, freeSpace));
            labelsOverflow = freeSpace < 0 ? Math.max(labelsOverflow, -freeSpace) : labelsOverflow;
        });

        const segmentMaxRadius = Math.max(...data.segments.map((s) => s.data.radius));
        if (labelsOverflow) {
            data.segments.forEach((s) => {
                const neeSegmentRadius = Math.max(minRadius, s.data.radius - labelsOverflow);
                s.data.radius = neeSegmentRadius;
            });
        } else {
            const topAdjustment = Math.min(
                data.center[1] - segmentMaxRadius,
                ...preparedLabels.labels.map((l) => l.y + data.center[1]),
                ...preparedLabels.htmlLabels.map((l) => l.y),
                maxLeftRightFreeSpace,
            );
            const bottom = Math.max(
                data.center[1] + segmentMaxRadius,
                ...preparedLabels.labels.map((l) => l.y + data.center[1] + l.size.height),
                ...preparedLabels.htmlLabels.map((l) => l.y + l.size.height),
                maxLeftRightFreeSpace,
            );

            if (topAdjustment > 0) {
                data.segments.forEach((s) => {
                    const nextPossibleRadius = s.data.radius + topAdjustment / 2;
                    s.data.radius = Math.min(nextPossibleRadius, maxRadius);
                });
                data.center[1] -= topAdjustment / 2;
            }

            const bottomAdjustment = Math.floor(boundsHeight - bottom);
            if (bottomAdjustment > 0) {
                data.segments.forEach((s) => {
                    const nextPossibleRadius = s.data.radius + bottomAdjustment / 2;
                    s.data.radius = Math.min(nextPossibleRadius, maxRadius);
                });
                data.center[1] += bottomAdjustment / 2;
            }
        }

        const {labels, htmlLabels, connectors} = prepareLabels({
            data,
            series: items,
            allowOverlow: false,
        });

        data.labels = labels;
        data.htmlLabels = htmlLabels;
        data.connectors = connectors;

        return data;
    });
}
