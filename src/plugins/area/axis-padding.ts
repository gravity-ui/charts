import type {AxisPaddingPoint, PrepareAxisPaddingArgs} from '~core/scales/axis-padding';

import {collectMarkerPadding} from '../marker-axis-padding';

import {projectAreaData} from './prepare-data';
import type {PreparedAreaSeries} from './prepared-series';
import {createAreaCategoryXProjector} from './projection';

export function getAreaAxisPadding(args: PrepareAxisPaddingArgs): AxisPaddingPoint[] {
    const series = args.series as PreparedAreaSeries[];
    const projected = projectAreaData({
        ...args,
        series,
        isOutsideBounds: () => false,
        projectX: createAreaCategoryXProjector({...args, series}),
    });
    return collectMarkerPadding(args, projected);
}
