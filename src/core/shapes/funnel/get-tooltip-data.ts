import type {GetTooltipDataArgs, GetTooltipDataResult} from '../../utils/tooltip-helpers';

import type {PreparedFunnelData} from './types';

export function getTooltipData(args: GetTooltipDataArgs<PreparedFunnelData>): GetTooltipDataResult {
    const {data, position} = args;
    const [pointerX, pointerY] = position;
    const items = data[0]?.items;

    if (!items?.length) {
        return {chunks: []};
    }

    const exactMatch = items.find(
        (item) =>
            pointerX >= item.x &&
            pointerX <= item.x + item.width &&
            pointerY >= item.y &&
            pointerY <= item.y + item.height,
    );

    if (exactMatch) {
        return {
            chunks: [{data: exactMatch.data, series: exactMatch.series, closest: true}],
        };
    }

    for (let i = 1; i < items.length; i++) {
        const prev = items[i - 1];
        const curr = items[i];
        const connectorTop = prev.y + prev.height;
        const connectorBottom = curr.y;

        if (pointerY >= connectorTop && pointerY <= connectorBottom) {
            const connectorLeft = Math.min(prev.x, curr.x);
            const connectorRight = Math.max(prev.x + prev.width, curr.x + curr.width);

            if (pointerX < connectorLeft || pointerX > connectorRight) {
                continue;
            }

            const nearest = pointerY - connectorTop <= connectorBottom - pointerY ? prev : curr;
            return {chunks: [{data: nearest.data, series: nearest.series, closest: true}]};
        }
    }

    return {chunks: []};
}
