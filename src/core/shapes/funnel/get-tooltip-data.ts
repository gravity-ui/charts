import type {GetTooltipDataArgs, GetTooltipDataResult} from '../../utils/tooltip-helpers';

import type {PreparedFunnelData} from './types';

export function getTooltipData(args: GetTooltipDataArgs<PreparedFunnelData>): GetTooltipDataResult {
    const {data, position} = args;
    const [, pointerY] = position;
    const items = data[0]?.items;

    if (!items?.length) {
        return {chunks: []};
    }

    let nearest = items[0];
    let minDist = Infinity;

    for (const item of items) {
        const dist = Math.max(0, item.y - pointerY, pointerY - (item.y + item.height));
        if (dist < minDist) {
            minDist = dist;
            nearest = item;
        }
    }

    return {chunks: [{data: nearest.data, series: nearest.series, closest: true}]};
}
