import type {AxisPaddingPoint, PrepareAxisPaddingArgs} from '~core/scales/axis-padding';

import {collectMarkerPadding} from '../marker-axis-padding';

import {projectAreaData} from './prepare-data';
import type {PreparedAreaSeries} from './prepared-series';

export function getAreaAxisPadding(
    args: PrepareAxisPaddingArgs<PreparedAreaSeries>,
): AxisPaddingPoint[] {
    const projected = projectAreaData({
        ...args,
        series: args.series,
        isOutsideBounds: () => false,
    });
    return collectMarkerPadding(args, projected);
}
