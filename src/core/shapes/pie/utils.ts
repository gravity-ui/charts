import type {CurveFactory, PieArcDatum} from 'd3-shape';
import {arc, curveBasis, curveLinear, pie} from 'd3-shape';

import type {PointPosition} from '../../../types';

import type {PreparedPieData, SegmentData} from './types';

export const pieGenerator = pie<SegmentData>()
    .value((d) => d.value)
    .sort(null);

export function getCurveFactory(data: PreparedPieData): CurveFactory | undefined {
    switch (data.connectorCurve) {
        case 'basic': {
            return curveBasis;
        }
        case 'linear': {
            return curveLinear;
        }
        default:
            return undefined;
    }
}

/**
 * Inscribed angle at vertex A (opposite side/chord BC): the angle between rays AB and AC.
 *
 * The order of B and C does not affect the result.
 * @see: https://en.wikipedia.org/wiki/Inscribed_angle
 * @returns The angle in degrees, in the range [0, 180].
 */
export function getInscribedAngle(a: PointPosition, b: PointPosition, c: PointPosition): number {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const dot = ux * vx + uy * vy;
    const cross = ux * vy - uy * vx;
    const radians = Math.atan2(Math.abs(cross), dot);

    return (radians * 180) / Math.PI;
}

// D3's default 3-digit rounding can make near-full arc endpoints identical.
// Six digits keeps them distinct for all visually meaningful chart radii.
const ARC_PATH_DIGITS = 6;

interface ArcGeneratorWithDigits {
    digits(digits: number): unknown;
}

/** The slice path as the renderer draws it, relative to the pie center. */
export function getPieArcPath(d: PieArcDatum<SegmentData>, outerRadius: number) {
    const arcGenerator = arc<PieArcDatum<SegmentData>>()
        .innerRadius(d.data.pie.innerRadius)
        .outerRadius(outerRadius)
        .cornerRadius(d.data.pie.borderRadius);
    (arcGenerator as typeof arcGenerator & ArcGeneratorWithDigits).digits(ARC_PATH_DIGITS);

    return arcGenerator(d);
}
