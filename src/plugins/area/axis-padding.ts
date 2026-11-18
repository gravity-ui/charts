import type {AxisPaddingPoint, PrepareAxisPaddingArgs} from '~core/scales/axis-padding';
import type {PreparedAreaSeries} from '~core/series/types';
import {projectAreaData} from '~core/shapes/area/prepare-data';

import {collectMarkerPadding} from '../marker-axis-padding';

import {createAreaXProjector} from './projection';

export function getAreaAxisPadding(args: PrepareAxisPaddingArgs): AxisPaddingPoint[] {
    const projected = projectAreaData({
        ...args,
        series: args.series as PreparedAreaSeries[],
        isOutsideBounds: () => false,
        projectX: createAreaXProjector(args),
    });
    return collectMarkerPadding(args, projected);
}
