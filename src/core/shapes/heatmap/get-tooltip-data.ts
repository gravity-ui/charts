import type {HeatmapSeries} from '../../../types';
import type {GetTooltipDataArgs, GetTooltipDataResult} from '../../utils/tooltip-helpers';

import type {PreparedHeatmapData} from './types';

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedHeatmapData>,
): GetTooltipDataResult {
    const {data, position} = args;
    const [pointerX, pointerY] = position;

    const closestPoint = data[0]?.items.find(
        (cell) =>
            pointerX >= cell.x &&
            pointerX <= cell.x + cell.width &&
            pointerY >= cell.y &&
            pointerY <= cell.y + cell.height,
    );

    if (!closestPoint) {
        return {chunks: []};
    }

    return {
        chunks: [
            {
                data: closestPoint.data,
                series: data[0].series as unknown as HeatmapSeries,
                closest: true,
            },
        ],
    };
}
