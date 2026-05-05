import type {SankeySeries, SankeySeriesData} from '../../../types';
import {isInsidePath} from '../../utils/tooltip-helpers';
import type {GetTooltipDataArgs, GetTooltipDataResult} from '../../utils/tooltip-helpers';

import type {PreparedSankeyData} from './types';

export function getTooltipData(args: GetTooltipDataArgs<PreparedSankeyData>): GetTooltipDataResult {
    const {data, position, boundsWidth, boundsHeight} = args;
    const [pointerX, pointerY] = position;

    const [sankeyData] = data;
    if (!sankeyData) {
        return {chunks: []};
    }

    const closestLink = sankeyData.links.find((d) =>
        isInsidePath({
            path: d.path ?? '',
            strokeWidth: d.strokeWidth,
            point: [pointerX, pointerY],
            width: boundsWidth,
            height: boundsHeight,
        }),
    );

    if (!closestLink) {
        return {chunks: []};
    }

    return {
        chunks: [
            {
                data: closestLink.source as SankeySeriesData,
                target: closestLink.target,
                series: sankeyData.series as SankeySeries,
                closest: true,
            },
        ],
    };
}
