import type {GetTooltipDataArgs, GetTooltipDataResult} from '../../utils/tooltip-helpers';
import {getRadius, isPointInFill} from '../../utils/tooltip-helpers';

import type {PreparedPieData} from './types';
import {getPieArcPath} from './utils';

export function getTooltipData(args: GetTooltipDataArgs<PreparedPieData>): GetTooltipDataResult {
    const {data, position} = args;
    const [pointerX, pointerY] = position;

    const points = data.flatMap((d) => d.segments);
    const closestPoint = points.find((p) => {
        const {center} = p.data.pie;
        const x = pointerX - center[0];
        const y = pointerY - center[1];
        let angle = Math.atan2(y, x) + 0.5 * Math.PI;
        angle = angle < 0 ? Math.PI * 2 + angle : angle;
        const polarRadius = getRadius({center, pointer: [pointerX, pointerY]});

        if (
            angle < p.startAngle ||
            angle > p.endAngle ||
            polarRadius >= p.data.radius ||
            polarRadius < p.data.pie.innerRadius
        ) {
            return false;
        }

        // Rounded corners cut the slice inside its angular and radial bounds.
        if (p.data.pie.borderRadius > 0) {
            const path = getPieArcPath(p, p.data.radius);
            return !path || isPointInFill(path, [x, y]);
        }
        return true;
    });

    if (!closestPoint) {
        return {chunks: []};
    }

    return {
        chunks: [
            {
                data: closestPoint.data.series.data,
                percentage: closestPoint.data.percentage,
                series: closestPoint.data.series,
                closest: true,
                // The chunk is found only when the pointer is inside the shape.
                distance: 0,
            },
        ],
    };
}
