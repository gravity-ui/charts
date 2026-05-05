import type {GetTooltipDataArgs, GetTooltipDataResult} from '../../utils/tooltip-helpers';
import {getRadius} from '../../utils/tooltip-helpers';

import type {PreparedPieData} from './types';

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

        return angle >= p.startAngle && angle <= p.endAngle && polarRadius < p.data.radius;
    });

    if (!closestPoint) {
        return {chunks: []};
    }

    return {
        chunks: [
            {
                data: closestPoint.data.series.data,
                series: closestPoint.data.series,
                closest: true,
            },
        ],
    };
}
