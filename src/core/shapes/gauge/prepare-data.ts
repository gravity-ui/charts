import {DEFAULT_PALETTE} from '../../constants/palette';

import type {PreparedGaugeData, PreparedGaugeSeries} from './types';
import {buildThresholdArcs, resolveThickness, valueToAngle} from './utils';

export function prepareGaugeData({
    series,
    boundsWidth,
    boundsHeight,
}: {
    series: PreparedGaugeSeries[];
    boundsWidth: number;
    boundsHeight: number;
}): PreparedGaugeData[] {
    return series.map((s) => prepareOneSeries(s, boundsWidth, boundsHeight));
}

function prepareOneSeries(
    series: PreparedGaugeSeries,
    width: number,
    height: number,
): PreparedGaugeData {
    const {arc, pointer, value, min, max, thresholds, target, color} = series;
    const sweepAngle = arc.sweepAngle;

    const cx = width / 2;
    // For sweepAngle=180 (D-shape) the arc occupies only the top half, so push
    // the center low to maximise arc size while leaving room for text below.
    // Interpolate between 0.70 (180°) and 0.50 (360°) linearly.
    const cy = height * Math.max(0.5, 0.7 - (sweepAngle - 180) / 900);

    const outerRadius = Math.min(cx, cy) * 0.9;
    const thickness = resolveThickness(arc.thickness, outerRadius);
    const innerRadius = outerRadius - thickness;

    const startAngleDeg = -(sweepAngle / 2);
    const endAngleDeg = sweepAngle / 2;

    const clampedValue = series.overflow === 'clamp' ? Math.min(Math.max(value, min), max) : value;
    const valueAngleDeg = valueToAngle(clampedValue, min, max, startAngleDeg, endAngleDeg);

    const targetAngleDeg =
        target !== undefined
            ? valueToAngle(target, min, max, startAngleDeg, endAngleDeg)
            : undefined;

    const fallbackColor = thresholds.length > 0 ? (DEFAULT_PALETTE[0] ?? '#4DA2F1') : color;

    const thresholdArcs =
        thresholds.length > 0
            ? buildThresholdArcs(thresholds, min, max, startAngleDeg, endAngleDeg, fallbackColor)
            : [
                  {
                      startDeg: startAngleDeg,
                      endDeg: endAngleDeg,
                      color,
                      label: undefined,
                      zoneMin: min,
                      zoneMax: max,
                  },
              ];

    const needleLength =
        pointer.type === 'needle'
            ? innerRadius *
              (typeof pointer.size === 'number' && pointer.size <= 1 && pointer.size > 0
                  ? pointer.size
                  : 0.85)
            : innerRadius;

    const tbWidth = innerRadius * 2 * 0.78;
    const tbHeight = innerRadius * 0.6;
    const tbCx = cx;
    // Text sits at the center of the inner circle (works for all sweep angles).
    const tbCy = cy;

    return {
        id: series.id,
        series,
        cx,
        cy,
        outerRadius,
        innerRadius,
        startAngleDeg,
        endAngleDeg,
        valueAngleDeg,
        targetAngleDeg,
        thresholdArcs,
        needleLength,
        textBox: {
            x: tbCx - tbWidth / 2,
            y: tbCy - tbHeight / 2,
            width: tbWidth,
            height: tbHeight,
            cx: tbCx,
            cy: tbCy,
        },
    };
}
