import type {CurveFactory} from 'd3';
import {curveBasis, curveLinear, pie} from 'd3';

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
 *
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
