import type {
    GetTooltipDataArgs,
    GetTooltipDataResult,
    ShapePoint,
} from '../../utils/tooltip-helpers';
import {getDistanceToMarkers, getMarkerFill} from '../marker';

import {getDistanceToLineStroke} from './geometry';
import type {PreparedLineData} from './types';

function getDistanceToLine(item: PreparedLineData, point: [number, number]) {
    return Math.min(
        getDistanceToLineStroke(item.getGeometry(), point, item),
        getDistanceToMarkers(item.markers, point),
    );
}

export function getTooltipData(args: GetTooltipDataArgs<PreparedLineData>): GetTooltipDataResult {
    const {data, position, measureDistance} = args;

    const xLookupPoints = data.reduce<ShapePoint[]>((acc, d) => {
        const distance = measureDistance ? getDistanceToLine(d, position) : undefined;
        for (const p of d.points) {
            if (p.y !== null && p.x !== null && !p.hiddenInLine) {
                acc.push({
                    color: getMarkerFill(p, p.series.color),
                    data: p.data,
                    distance,
                    series: p.series,
                    x: p.x,
                    y0: p.y,
                    y1: p.y,
                });
            }
        }
        return acc;
    }, []);

    return {chunks: [], xLookupPoints};
}
