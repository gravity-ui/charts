import type {AxisPaddingPoint, PrepareAxisPaddingArgs} from '~core/scales/axis-padding';
import type {PreparedLineSeries} from '~core/series/types';
import {projectLineData} from '~core/shapes/line/prepare-data';

import {collectMarkerPadding} from '../marker-axis-padding';

export function getLineAxisPadding(args: PrepareAxisPaddingArgs): AxisPaddingPoint[] {
    const projected = projectLineData({
        ...args,
        series: args.series as PreparedLineSeries[],
        isOutsideBounds: () => false,
    });
    return collectMarkerPadding(args, projected);
}
