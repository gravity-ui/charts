import type {CurveFactory} from 'd3';
import {curveBasis, curveLinear, pie} from 'd3';

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
    }
    return undefined;
}
