import {Delaunay} from 'd3-delaunay';

import type {GetTooltipDataArgs, GetTooltipDataResult} from '../../utils/tooltip-helpers';

import type {PreparedScatterData} from './types';

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedScatterData>,
): GetTooltipDataResult {
    const {data, position} = args;
    const [pointerX, pointerY] = position;

    const delaunay = Delaunay.from(
        data,
        (d) => d.point.x,
        (d) => d.point.y,
    );
    const closestPoint = data[delaunay.find(pointerX, pointerY)];

    if (!closestPoint) {
        return {chunks: []};
    }

    return {
        chunks: [
            {
                data: closestPoint.point.data,
                series: closestPoint.point.series,
                closest: true,
            },
        ],
    };
}
