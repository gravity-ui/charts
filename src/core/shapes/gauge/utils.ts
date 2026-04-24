import {arc} from 'd3-shape';

import {getTextSizeFn} from '../../utils/text';

import type {ThresholdArc, ThresholdStop} from './types';

export function valueToAngle(
    value: number,
    min: number,
    max: number,
    startDeg: number,
    endDeg: number,
): number {
    const ratio = Math.min(Math.max((value - min) / (max - min), 0), 1);
    return startDeg + ratio * (endDeg - startDeg);
}

/** Returns [x, y] for a point on an arc at the given angle. angleDeg=0 is 12-o'clock. */
export function pointOnArc(
    cx: number,
    cy: number,
    radius: number,
    angleDeg: number,
): [number, number] {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
}

/** Builds an SVG arc path string centered at origin (0,0). Apply translate in the renderer. */
export function buildArcPath({
    innerRadius,
    outerRadius,
    startDeg,
    endDeg,
    cornerRadius,
}: {
    innerRadius: number;
    outerRadius: number;
    startDeg: number;
    endDeg: number;
    cornerRadius: number;
}): string {
    const arcGen = arc<null>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle((startDeg * Math.PI) / 180)
        .endAngle((endDeg * Math.PI) / 180)
        .cornerRadius(cornerRadius);
    return arcGen(null) ?? '';
}

/** Builds ThresholdArc objects from threshold stops. */
export function buildThresholdArcs(
    thresholds: ThresholdStop[],
    min: number,
    max: number,
    startDeg: number,
    endDeg: number,
    fallbackColor: string,
): ThresholdArc[] {
    const stops = [{value: min}, ...thresholds, {value: max}];
    const result: ThresholdArc[] = [];

    for (let i = 0; i < stops.length - 1; i++) {
        const from = stops[i];
        const to = stops[i + 1] as ThresholdStop & {value: number};
        const fromAngle = valueToAngle(from.value, min, max, startDeg, endDeg);
        const toAngle = valueToAngle(to.value, min, max, startDeg, endDeg);

        result.push({
            startDeg: fromAngle,
            endDeg: toAngle,
            color: to.color ?? fallbackColor,
            label: to.label,
            zoneMin: from.value,
            zoneMax: to.value,
        });
    }

    return result.filter((zone) => zone.startDeg !== zone.endDeg);
}

/** Binary-search the largest integer px font size that fits within maxWidth×maxHeight. */
export async function fitFontSize({
    text,
    maxWidth,
    maxHeight,
    maxFontSize,
    minFontSize = 10,
}: {
    text: string;
    maxWidth: number;
    maxHeight: number;
    maxFontSize: number;
    minFontSize?: number;
}): Promise<number> {
    let lo = minFontSize;
    let hi = maxFontSize;

    while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        const measure = getTextSizeFn({style: {fontSize: `${mid}px`}});
        const size = await measure(text);
        if (size.width <= maxWidth && size.height <= maxHeight) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }

    return lo;
}

/** Parses thickness: fractional (0–1) → fraction of outerRadius; ≥1 → absolute px; string with 'px' → absolute. */
export function resolveThickness(
    thickness: number | string | undefined,
    outerRadius: number,
): number {
    if (typeof thickness === 'string') {
        const match = thickness.match(/^(\d+(?:\.\d+)?)px$/);
        if (match) {
            return parseFloat(match[1]);
        }
        return outerRadius * 0.12;
    }

    if (typeof thickness === 'number') {
        if (thickness > 0 && thickness < 1) {
            return outerRadius * thickness;
        }
        return thickness;
    }

    return outerRadius * 0.12;
}
