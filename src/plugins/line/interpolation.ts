import type {CurveFactory} from 'd3-shape';
import {curveCardinal, curveLinear, curveMonotoneX} from 'd3-shape';

import type {LineSeriesInterpolation} from '../../types';

export function getCurveFactory(interpolation?: LineSeriesInterpolation): CurveFactory {
    switch (interpolation?.type) {
        case 'monotone':
            return curveMonotoneX;
        case 'cardinal':
            return curveCardinal.tension(interpolation.tension ?? 0);
        default:
            return curveLinear;
    }
}
