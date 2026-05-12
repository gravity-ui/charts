import type {HtmlItem, LabelData} from '../../types';
import type {BaseTextStyle, ValueFormat} from '../types/chart/base';

import {getFormattedValue} from './format';
import {getLabelsSize, getTextSizeFn} from './text';

type PointLabelSeries = {
    id: string;
    dataLabels: {
        style: BaseTextStyle;
        html: boolean;
        padding: number;
        format?: ValueFormat;
        enabled?: boolean;
    };
};

/**
 * Resolves the effective dataLabels visibility for a point: point-level setting wins
 * over series-level. Both default to `true` when unset.
 */
export function isPointDataLabelEnabled(args: {
    data?: {dataLabels?: {enabled?: boolean}} | null;
    series?: {dataLabels?: {enabled?: boolean}} | null;
}): boolean {
    const pointEnabled = args.data?.dataLabels?.enabled;
    if (pointEnabled !== undefined) {
        return pointEnabled;
    }
    return args.series?.dataLabels?.enabled ?? true;
}

/**
 * Returns `true` if the series should run its dataLabels prep pipeline:
 * either series-level is enabled, or at least one point opts in via override.
 */
export function shouldPrepareSeriesDataLabels(series: {
    dataLabels?: {enabled?: boolean};
    data?: ReadonlyArray<{dataLabels?: {enabled?: boolean}}>;
}): boolean {
    if (series.dataLabels?.enabled) {
        return true;
    }
    return Boolean(series.data?.some((d) => d.dataLabels?.enabled === true));
}

type LabelPoint = {
    x: number | null;
    y: number | null;
    data: {
        dataLabels?: {enabled?: boolean};
        label?: string | number | null;
        y?: string | number | null;
    };
};

/**
 * Shared "above-point" dataLabels algorithm used by line, area, and scatter series.
 *
 * For each visible point it:
 * 1. Formats the value via getFormattedValue
 * 2. Measures the label size (HTML → getLabelsSize, SVG → getTextSizeFn)
 * 3. Positions the label centered above the point, clamped to chart bounds
 *
 * `anchorYOffset` shifts the vertical anchor from the point center upward by the given
 * number of pixels (e.g. marker radius for scatter), so padding is measured from the
 * marker edge rather than its center. The top-boundary clamp also respects this offset
 * so the label never drops below the anchor.
 *
 * Overlap filtering is intentionally left to the caller.
 */
export async function preparePointDataLabels<S extends PointLabelSeries, P extends LabelPoint>({
    series,
    points,
    xMax,
    yAxisTop,
    isOutsideBounds,
    anchorYOffset = 0,
}: {
    series: S;
    points: P[];
    xMax: number;
    yAxisTop: number;
    isOutsideBounds: (x: number, y: number) => boolean;
    anchorYOffset?: number;
}): Promise<{svgLabels: LabelData[]; htmlLabels: HtmlItem[]}> {
    const svgLabels: LabelData[] = [];
    const htmlLabels: HtmlItem[] = [];

    const getTextSize = getTextSizeFn({style: series.dataLabels.style});

    for (let i = 0; i < points.length; i++) {
        const point = points[i];

        if (point.y === null || point.x === null || isOutsideBounds(point.x, point.y)) {
            continue;
        }

        if (!isPointDataLabelEnabled({data: point.data, series})) {
            continue;
        }

        const text = getFormattedValue({
            value: point.data.label ?? point.data.y,
            ...series.dataLabels,
        });

        const anchorY = point.y - anchorYOffset;

        if (series.dataLabels.html) {
            const size = await getLabelsSize({
                labels: [text],
                style: series.dataLabels.style,
                html: true,
            });
            const width = size.maxWidth;
            const height = size.maxHeight;
            htmlLabels.push({
                x: Math.min(xMax - width, Math.max(0, point.x - width / 2)),
                y: Math.max(yAxisTop, anchorY - series.dataLabels.padding - height),
                content: text,
                size: {width, height},
                style: series.dataLabels.style,
            });
        } else {
            const labelSize = await getTextSize(text);
            svgLabels.push({
                text,
                x: Math.min(xMax - labelSize.width, Math.max(0, point.x - labelSize.width / 2)),
                y: Math.max(
                    yAxisTop,
                    anchorY -
                        series.dataLabels.padding -
                        labelSize.height +
                        labelSize.hangingOffset,
                ),
                style: series.dataLabels.style,
                size: labelSize,
                textAnchor: 'start',
                series,
                active: true,
            });
        }
    }

    return {svgLabels, htmlLabels};
}
