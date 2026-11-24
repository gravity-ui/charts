import type {CurveFactory} from 'd3-shape';
import {
    curveCardinal,
    curveLinear,
    curveMonotoneX,
    curveStep,
    curveStepAfter,
    curveStepBefore,
} from 'd3-shape';

import type {SeriesInterpolation} from '../../types';

export function getCurveFactory(interpolation?: SeriesInterpolation): CurveFactory {
    switch (interpolation?.type) {
        case 'monotone':
            return curveMonotoneX;
        case 'cardinal':
            return curveCardinal.tension(interpolation.tension ?? 0);
        case 'step':
            switch (interpolation.position) {
                case 'before':
                    return curveStepBefore;
                case 'middle':
                    return curveStep;
                default:
                    return curveStepAfter;
            }
        default:
            return curveLinear;
    }
}
