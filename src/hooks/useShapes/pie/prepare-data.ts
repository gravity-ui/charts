import type {PieArcDatum} from 'd3';
import {arc, group, line as lineGenerator, max} from 'd3';
import merge from 'lodash/merge';

import {DEFAULT_DATALABELS_STYLE} from '../../../constants';
import type {HtmlItem, PieSeries, PointPosition} from '../../../types';
import {
    calculateNumericProperty,
    getLabelsSize,
    getLeftPosition,
    getTextSizeFn,
    isLabelsOverlapping,
} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';
import type {PreparedPieSeries} from '../../useSeries/types';

import type {PieConnectorData, PieLabelData, PreparedPieData, SegmentData} from './types';
import {getCurveFactory, getInscribedAngle, pieGenerator} from './utils';

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

export function preparePieData(args: Args): Promise<PreparedPieData[]> {
    const {series: preparedSeries, boundsWidth, boundsHeight} = args;
    const haloSize = preparedSeries[0].states.hover.halo.enabled
        ? preparedSeries[0].states.hover.halo.size
        : 0;
    const maxRadius = Math.min(boundsWidth, boundsHeight) / 2 - haloSize;
    const propsMinRadius = calculateNumericProperty({
        value: preparedSeries[0].minRadius,
        base: maxRadius,
    });
    const minRadius = typeof propsMinRadius === 'number' ? propsMinRadius : maxRadius * 0.3;
    const groupedPieSeries = group(preparedSeries, (pieSeries) => pieSeries.stackId);
    const dataLabelsStyle = merge(
        {},
        DEFAULT_DATALABELS_STYLE,
        preparedSeries[0]?.dataLabels?.style,
    );

    const prepareItem = ({
        stackId,
        items,
        labels,
    }: {
        stackId: string;
        items: PreparedPieSeries[];
        labels: Record<string, Partial<PieLabelData>>;
    }) => {
        const series = items[0];
        const {center, borderWidth, borderColor, borderRadius, dataLabels} = series;
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

        const labelMaxHeight = max(Object.values(labels).map((l) => l.size?.height ?? 0)) ?? 0;
        const segments = items.reduce<SegmentData[]>((acc, item) => {
            if (item.value === null || item.value === undefined) {
                return acc;
            }

            let maxSegmentRadius = maxRadius;

            if (dataLabels.enabled) {
                maxSegmentRadius -=
                    dataLabels.distance + dataLabels.connectorPadding + labelMaxHeight;
            }

            const segmentRadius =
                calculateNumericProperty({value: item.radius, base: maxSegmentRadius}) ??
                maxSegmentRadius;

            acc.push({
                value: item.value,
                color: item.color,
                opacity: item.opacity,
                series: item,
                hovered: false,
                active: true,
                pie: data,
                radius: segmentRadius,
            });

            return acc;
        }, []);

        data.segments = pieGenerator(segments);

        return data;
    };

    const getLabels = async ({series}: {series: PreparedPieSeries[]}) => {
        const {dataLabels} = series[0];

        if (!dataLabels.enabled) {
            return {};
        }

        const getTextSize = getTextSizeFn({style: dataLabelsStyle});
        const acc: Record<string, Partial<PieLabelData>> = {};
        for (let i = 0; i < series.length; i++) {
            const d = series[i];

            const text = getFormattedValue({
                value: d.data.label || d.data.value,
                ...d.dataLabels,
            });

            let labelWidth = 0;
            let labelHeight = 0;
            if (dataLabels.html) {
                const size = await getLabelsSize({
                    labels: [text],
                    style: dataLabelsStyle,
                    html: true,
                });
                labelWidth = size.maxWidth;
                labelHeight = size.maxHeight;
            } else {
                const size = await getTextSize(text);
                labelWidth = size.width;
                labelHeight = size.height;
            }

            const label: Partial<PieLabelData> = {
                text,
                size: {width: labelWidth, height: labelHeight},
            };

            acc[d.id] = label;
        }

        return acc;
    };

    const prepareLabels = (prepareLabelsArgs: {
        data: PreparedPieData;
        series: PreparedPieSeries[];
        labels: Record<string, Partial<PieLabelData>>;
        allowOverlow?: boolean;
    }) => {
        const {data, series, labels: labelsData, allowOverlow = true} = prepareLabelsArgs;
        const {dataLabels} = series[0];

        const labels: PieLabelData[] = [];
        const htmlLabels: HtmlItem[] = [];
        const connectors: PieConnectorData[] = [];

        if (!dataLabels.enabled) {
            return {labels, htmlLabels, connectors};
        }

        const shouldUseHtml = dataLabels.html;
        let line = lineGenerator();
        const curveFactory = getCurveFactory(data);
        if (curveFactory) {
            line = line.curve(curveFactory);
        }

        const {connectorPadding, distance} = dataLabels;
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

        let shouldStopLabelPlacement = false;
        // eslint-disable-next-line complexity
        series.forEach((d, index) => {
            const prevLabel = labels[labels.length - 1];
            const {text = '', size: labelSize} = labelsData[d.id];
            const labelWidth = labelSize?.width ?? 0;
            const labelHeight = labelSize?.height ?? 0;

            const relatedSegment = data.segments[index];

            /**
             * Compute the label coordinates on the label arc for a given angle.
             *
             * For HTML labels, the function returns the top-left corner to account for
             * element box positioning. It shifts left by the label width when the point is
             * on the left side (x < 0) and shifts up by the label height when above the
             * horizontal center (y < 0). For SVG text, only the vertical shift is applied
             * to compensate for text baseline.
             *
             * @param {number} angle - Angle in radians at which the label should be placed.
             * @returns {[number, number]} A tuple [x, y] relative to the pie center.
             */
            const getLabelPosition = (angle: number) => {
                let [x, y] = labelArcGenerator.centroid({
                    ...relatedSegment,
                    startAngle: angle,
                    endAngle: angle,
                });

                if (shouldUseHtml) {
                    x = x < 0 ? x - labelWidth : x;
                }

                y = y < 0 ? y - labelHeight : y;

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
                style: dataLabelsStyle,
                size: {width: labelWidth, height: labelHeight},
                maxWidth: labelWidth,
                textAnchor: midAngle < Math.PI ? 'start' : 'end',
                series: {id: d.id},
                active: true,
                segment: relatedSegment.data,
                angle: midAngle,
            };

            if (!allowOverlow) {
                const labelLeftPosition = shouldUseHtml ? label.x : getLeftPosition(label);

                let newMaxWidth;
                if (label.x > 0) {
                    newMaxWidth = Math.min(
                        boundsWidth - data.center[0] - labelLeftPosition,
                        labelWidth,
                    );
                } else {
                    newMaxWidth = Math.min(
                        data.center[0] + labelLeftPosition + label.size.width,
                        labelWidth,
                    );
                }

                if (newMaxWidth !== label.maxWidth) {
                    label.maxWidth = Math.max(0, newMaxWidth);
                }
            }

            let overlap = false;
            if (prevLabel) {
                overlap = isLabelsOverlapping(prevLabel, label, dataLabels.padding);
                const startAngle =
                    relatedSegment.startAngle +
                    (relatedSegment.endAngle - relatedSegment.startAngle) / 2;

                if (overlap) {
                    let shouldAdjustAngle = !shouldStopLabelPlacement;
                    const connectorPoints = getConnectorPoints(startAngle);
                    const pointA = connectorPoints[0];
                    const pointB = connectorPoints[connectorPoints.length - 1];
                    const step = Math.PI / 180;

                    while (shouldAdjustAngle) {
                        const newAngle = label.angle + step;
                        if (newAngle > FULL_CIRCLE && newAngle % FULL_CIRCLE > labels[0].angle) {
                            shouldAdjustAngle = false;
                        } else {
                            const [newX, newY] = getLabelPosition(newAngle);

                            label.angle = newAngle;
                            label.textAnchor = newAngle < Math.PI ? 'start' : 'end';
                            label.x = newX;
                            label.y = newY;

                            // See `getLabelPosition`: for HTML labels we return top-left,
                            // so shift x by labelWidth when textAnchor is 'end'.
                            const pointC: PointPosition =
                                shouldUseHtml && label.textAnchor === 'end'
                                    ? [newX + labelWidth, newY]
                                    : [newX, newY];
                            const inscribedAngle = getInscribedAngle(pointA, pointB, pointC);

                            if (inscribedAngle > 90) {
                                shouldAdjustAngle = false;
                                shouldStopLabelPlacement = true;
                            }

                            if (!isLabelsOverlapping(prevLabel, label, dataLabels.padding)) {
                                shouldAdjustAngle = false;
                                overlap = false;
                            }
                        }
                    }
                }
            }

            const isLabelOverlapped = !dataLabels.allowOverlap && overlap;
            if (!isLabelOverlapped && label.maxWidth > 0 && !shouldStopLabelPlacement) {
                labels.push(label);

                if (shouldUseHtml) {
                    const htmlLabelX = data.center[0] + label.x;
                    htmlLabels.push({
                        x: Math.max(0, htmlLabelX),
                        y: Math.max(0, data.center[1] + label.y),
                        content: label.text,
                        size: label.size,
                        style: {
                            ...label.style,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            maxWidth: Math.min(
                                label.x > 0
                                    ? boundsWidth - htmlLabelX
                                    : htmlLabelX + label.size.width,
                                label.size.width,
                            ),
                        },
                    } as HtmlItem);
                }

                const connector = {
                    path: line(getConnectorPoints(label.angle)),
                    color: relatedSegment.data.color,
                };
                connectors.push(connector);
            }
        });

        return {
            labels: shouldUseHtml ? [] : labels,
            htmlLabels,
            connectors,
        };
    };

    return Promise.all(
        Array.from(groupedPieSeries).map(async ([stackId, items]) => {
            const seriesLabels = await getLabels({series: items});
            const data = prepareItem({stackId, items, labels: seriesLabels});
            const preparedLabels = prepareLabels({
                data,
                labels: seriesLabels,
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
                labelsOverflow =
                    freeSpace < 0 ? Math.max(labelsOverflow, -freeSpace) : labelsOverflow;
            });

            preparedLabels.htmlLabels.forEach((label) => {
                let freeSpace = 0;
                if (label.x < data.center[0]) {
                    freeSpace = Math.max(label.x, 0);
                } else {
                    freeSpace = boundsWidth - label.x - label.size.width;
                }

                maxLeftRightFreeSpace = Math.max(0, Math.min(maxLeftRightFreeSpace, freeSpace));
                labelsOverflow =
                    freeSpace < 0 ? Math.max(labelsOverflow, -freeSpace) : labelsOverflow;
            });

            const segmentMaxRadius = Math.max(...data.segments.map((s) => s.data.radius));
            if (labelsOverflow) {
                data.segments.forEach((s) => {
                    const neeSegmentRadius = Math.max(minRadius, s.data.radius - labelsOverflow);
                    s.data.radius = neeSegmentRadius;
                });
            } else {
                let topFreeSpace = data.center[1] - segmentMaxRadius - haloSize;
                if (preparedLabels.labels.length) {
                    const topSvgLabel = Math.max(0, ...preparedLabels.labels.map((l) => -l.y));
                    topFreeSpace = Math.min(topFreeSpace, data.center[1] - topSvgLabel);
                }

                if (preparedLabels.htmlLabels.length) {
                    const topHtmlLabel = Math.min(...preparedLabels.htmlLabels.map((l) => l.y));
                    topFreeSpace = Math.min(topFreeSpace, topHtmlLabel);
                }

                let bottomFreeSpace = data.center[1] - segmentMaxRadius - haloSize;
                if (preparedLabels.labels.length) {
                    const bottomSvgLabel = Math.max(
                        0,
                        ...preparedLabels.labels.map((l) => l.y + l.size.height),
                    );
                    bottomFreeSpace = Math.min(bottomFreeSpace, data.center[1] - bottomSvgLabel);
                }

                if (preparedLabels.htmlLabels.length) {
                    const bottomHtmlLabel = Math.max(
                        0,
                        ...preparedLabels.htmlLabels.map((l) => l.y + l.size.height),
                    );
                    bottomFreeSpace = Math.min(
                        bottomFreeSpace,
                        data.center[1] * 2 - bottomHtmlLabel,
                    );
                }

                const topAdjustment = Math.max(0, Math.min(topFreeSpace, maxLeftRightFreeSpace));
                const bottomAdjustment = Math.max(
                    0,
                    Math.min(bottomFreeSpace, maxLeftRightFreeSpace),
                );

                if (topAdjustment && topAdjustment >= bottomAdjustment) {
                    data.segments.forEach((s) => {
                        let nextPossibleRadius =
                            s.data.radius + (topAdjustment + bottomAdjustment) / 2;
                        nextPossibleRadius = Math.max(nextPossibleRadius, minRadius);
                        s.data.radius = Math.min(nextPossibleRadius, maxRadius);
                    });
                    data.center[1] -= (topAdjustment - bottomAdjustment) / 2;
                } else if (bottomAdjustment) {
                    data.segments.forEach((s) => {
                        let nextPossibleRadius =
                            s.data.radius + (topAdjustment + bottomAdjustment) / 2;
                        nextPossibleRadius = Math.max(nextPossibleRadius, minRadius);
                        s.data.radius = Math.min(nextPossibleRadius, maxRadius);
                    });
                    data.center[1] += (bottomAdjustment - topAdjustment) / 2;
                }
            }

            const {labels, htmlLabels, connectors} = prepareLabels({
                data,
                series: items,
                labels: seriesLabels,
                allowOverlow: false,
            });

            if (typeof items[0]?.innerRadius !== 'undefined') {
                const resultSegmentMaxRadius = Math.max(...data.segments.map((s) => s.data.radius));
                const resultInnerRadius =
                    calculateNumericProperty({
                        value: items[0].innerRadius,
                        base: resultSegmentMaxRadius,
                    }) || 0;
                data.innerRadius = resultInnerRadius;
            }

            data.labels = labels;
            data.htmlLabels = htmlLabels;
            data.connectors = connectors;

            return data;
        }),
    );
}
