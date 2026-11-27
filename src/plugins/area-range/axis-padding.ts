import type {AxisPaddingPoint, PrepareAxisPaddingArgs} from '~core/scales/axis-padding';
import type {PreparedAreaRangeSeries} from '~core/series/types';

import {collectMarkerPadding} from '../marker-axis-padding';

import {projectAreaRangeData} from './prepare-data';

export function getAreaRangeAxisPadding(args: PrepareAxisPaddingArgs): AxisPaddingPoint[] {
    const projected = projectAreaRangeData({
        ...args,
        series: args.series as PreparedAreaRangeSeries[],
        isOutsideBounds: () => false,
    });
    return collectMarkerPadding(
        args,
        projected.map((item) => ({
            series: item.series,
            points: item.points
                .filter((p) => !p.hiddenInTooltip)
                .flatMap((p) => [
                    {x: p.x, y: p.y0, data: p.data},
                    {x: p.x, y: p.y1, data: p.data},
                ]),
        })),
    );
}
