import type {AxisPaddingPoint, PrepareAxisPaddingArgs} from '~core/scales/axis-padding';

import {collectMarkerPadding} from '../marker-axis-padding';

import {projectLineData} from './prepare-data';
import type {PreparedLineSeries} from './prepared-series';

export function getLineAxisPadding(
    args: PrepareAxisPaddingArgs<PreparedLineSeries>,
): AxisPaddingPoint[] {
    const projected = projectLineData({
        ...args,
        series: args.series,
        isOutsideBounds: () => false,
    });
    return collectMarkerPadding(args, projected);
}
