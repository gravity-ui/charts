import type {CurveFactory} from 'd3-shape';
import {
    curveCardinal,
    curveLinear,
    curveMonotoneX,
    curveStep,
    curveStepAfter,
    curveStepBefore,
} from 'd3-shape';

import type {LineSeriesInterpolation} from '../../types';

export function getCurveFactory(interpolation?: LineSeriesInterpolation): CurveFactory {
    switch (interpolation?.type) {
        case 'monotone':
            return curveMonotoneX;
        case 'cardinal':
            return curveCardinal.tension(interpolation.tension ?? 0);
        case 'step':
            switch (interpolation.position) {
                case 'before':
                    return curveStepBefore;
                case 'after':
                    return curveStepAfter;
                default:
                    return curveStep;
            }
        default:
            return curveLinear;
    }
}
