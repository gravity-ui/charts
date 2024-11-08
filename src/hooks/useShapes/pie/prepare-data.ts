import type {PieArcDatum} from 'd3';
import {arc, group, line as lineGenerator} from 'd3';

import type {PieSeries} from '../../../types';
import {
    calculateNumericProperty,
    getLabelsSize,
    getLeftPosition,
    isLabelsOverlapping,
} from '../../../utils';
import type {PreparedPieSeries} from '../../useSeries/types';

import type {PieLabelData, PreparedPieData, SegmentData} from './types';
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
    const maxRadius = Math.min(boundsWidth, boundsHeight) / 2;

    const groupedPieSeries = group(preparedSeries, (pieSeries) => pieSeries.stackId);
    return Array.from(groupedPieSeries).map<PreparedPieData>(([stackId, items]) => {
        const series = items[0];
        const {
            center,
            borderWidth,
            borderColor,
            borderRadius,
            radius: seriesRadius,
            innerRadius: seriesInnerRadius,
            dataLabels,
        } = series;
        const radius =
            calculateNumericProperty({value: seriesRadius, base: maxRadius}) ?? maxRadius;

        const data: PreparedPieData = {
            id: stackId,
            center: getCenter(boundsWidth, boundsHeight, center),
            innerRadius: calculateNumericProperty({value: seriesInnerRadius, base: radius}) ?? 0,
            radius,
            segments: [],
            labels: [],
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
            htmlElements: [],
        };

        const segments = items.map<SegmentData>((item) => {
            return {
                value: item.value,
                color: item.color,
                opacity: item.opacity,
                series: item,
                hovered: false,
                active: true,
                pie: data,
            };
        });
        data.segments = pieGenerator(segments);

        let line = lineGenerator();
        const curveFactory = getCurveFactory(data);
        if (curveFactory) {
            line = line.curve(curveFactory);
        }

        if (dataLabels.enabled) {
            const {style, connectorPadding, distance} = dataLabels;
            const {maxHeight: labelHeight} = getLabelsSize({labels: ['Some Label'], style});
            const minSegmentRadius = maxRadius - connectorPadding - distance - labelHeight;
            if (data.radius > minSegmentRadius) {
                data.radius = minSegmentRadius;
                data.innerRadius =
                    calculateNumericProperty({value: seriesInnerRadius, base: data.radius}) ?? 0;
            }
            const connectorStartPointGenerator = arc<PieArcDatum<SegmentData>>()
                .innerRadius(data.radius)
                .outerRadius(data.radius);
            const connectorMidPointRadius = data.radius + distance / 2;
            const connectorMidPointGenerator = arc<PieArcDatum<SegmentData>>()
                .innerRadius(connectorMidPointRadius)
                .outerRadius(connectorMidPointRadius);
            const connectorArcRadius = data.radius + distance;
            const connectorEndPointGenerator = arc<PieArcDatum<SegmentData>>()
                .innerRadius(connectorArcRadius)
                .outerRadius(connectorArcRadius);
            const labelArcRadius = connectorArcRadius + connectorPadding;
            const labelArcGenerator = arc<PieArcDatum<SegmentData>>()
                .innerRadius(labelArcRadius)
                .outerRadius(labelArcRadius);

            const labels: PieLabelData[] = [];
            items.forEach((d, index) => {
                const prevLabel = labels[labels.length - 1];
                const text = String(d.data.label || d.data.value);
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

                    y = y < 0 ? y - labelHeight : y;

                    if (shouldUseHtml) {
                        x = x < 0 ? x - labelWidth : x;
                    }

                    x = Math.max(-boundsWidth / 2, x);

                    return [x, y];
                };

                const getConnectorPoints = (angle: number) => {
                    const connectorStartPoint =
                        connectorStartPointGenerator.centroid(relatedSegment);
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

                let overlap = false;
                if (prevLabel) {
                    overlap = isLabelsOverlapping(prevLabel, label, dataLabels.padding);

                    if (overlap) {
                        let shouldAdjustAngle = true;

                        const step = Math.PI / 180;
                        while (shouldAdjustAngle) {
                            const newAngle = label.angle + step;
                            if (
                                newAngle > FULL_CIRCLE &&
                                newAngle % FULL_CIRCLE > labels[0].angle
                            ) {
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

                if (dataLabels.allowOverlap || !overlap) {
                    const left = getLeftPosition(label);

                    if (Math.abs(left) > boundsWidth / 2) {
                        label.maxWidth = label.size.width - (Math.abs(left) - boundsWidth / 2);
                    } else {
                        const right = left + label.size.width;
                        if (right > boundsWidth / 2) {
                            label.maxWidth = label.size.width - (right - boundsWidth / 2);
                        }
                    }

                    if (shouldUseHtml) {
                        data.htmlElements.push({
                            x: boundsWidth / 2 + label.x,
                            y: boundsHeight / 2 + label.y,
                            content: label.text,
                        });
                    } else {
                        labels.push(label);
                    }

                    const connector = {
                        path: line(getConnectorPoints(midAngle)),
                        color: relatedSegment.data.color,
                    };
                    data.connectors.push(connector);
                }
            });

            data.labels = labels;
        }

        return data;
    });
}
