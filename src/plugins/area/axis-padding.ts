import type {AxisPaddingPoint, PrepareAxisPaddingArgs} from '~core/scales/axis-padding';

import {collectMarkerPadding} from '../marker-axis-padding';

import {projectAreaData} from './prepare-data';
import type {PreparedAreaSeries} from './prepared-series';
import {createAreaCategoryXProjector} from './projection';

export function getAreaAxisPadding(
    args: PrepareAxisPaddingArgs<PreparedAreaSeries>,
): AxisPaddingPoint[] {
    const projected = projectAreaData({
        ...args,
        series: args.series,
        isOutsideBounds: () => false,
        projectX: createAreaCategoryXProjector(args),
    });
    return collectMarkerPadding(args, projected);
}
