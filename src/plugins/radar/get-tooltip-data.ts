import {Delaunay} from 'd3-delaunay';

import type {GetTooltipDataArgs, GetTooltipDataResult} from '~core/utils/tooltip-helpers';
import {getRadius, isInsidePath} from '~core/utils/tooltip-helpers';

import type {PreparedRadarData, RadarTooltipChunk} from './types';

export function getTooltipData(
    args: GetTooltipDataArgs<PreparedRadarData>,
): GetTooltipDataResult<RadarTooltipChunk> {
    const {data, position, boundsWidth, boundsHeight} = args;
    const [pointerX, pointerY] = position;

    const [radarData] = data;
    if (!radarData) {
        return {chunks: []};
    }

    const radius = getRadius({center: radarData.center, pointer: [pointerX, pointerY]});
    if (radius > radarData.radius) {
        return {chunks: []};
    }

    const radarShapes = radarData.shapes.filter((shape) =>
        isInsidePath({
            path: shape.path,
            point: [pointerX, pointerY],
            width: boundsWidth,
            height: boundsHeight,
            strokeWidth: shape.borderWidth,
        }),
    );

    const points = radarShapes.flatMap((shape) => shape.points);
    const delaunay = Delaunay.from(
        points,
        (d) => d.position[0],
        (d) => d.position[1],
    );
    const closestPoint = points[delaunay.find(pointerX, pointerY)];

    if (!closestPoint) {
        return {chunks: []};
    }

    return {
        chunks: radarData.shapes.map((shape) => ({
            data: shape.points[closestPoint.index].data,
            series: shape.series,
            category: shape.series.categories[closestPoint.index],
            closest: shape.series === closestPoint.series,
            // The closest shape is one of those containing the pointer.
            distance: shape.series === closestPoint.series ? 0 : undefined,
        })),
    };
}
