import type {AxisPaddingPoint, PrepareAxisPaddingArgs} from '~core/scales/axis-padding';
import type {PreparedAreaSeries} from '~core/series/types';
import {projectAreaData} from '~core/shapes/area/prepare-data';

import {collectMarkerPadding} from '../marker-axis-padding';

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
