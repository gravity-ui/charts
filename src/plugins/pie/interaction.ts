import type {PieArcDatum} from 'd3-shape';

import type {PreparedPieData, SegmentData} from '~core/shapes/pie/types';
import {getInteractionElements} from '~core/utils/chart-interaction';
import type {
    InteractionElementsArgs,
    NearestCandidate,
    PrepareNearestDataArgs,
} from '~core/utils/chart-interaction';

export function getTargetElements({plot}: InteractionElementsArgs) {
    return getInteractionElements<PieArcDatum<SegmentData>>(
        plot,
        '.gcharts-pie__segment',
        (datum) => ({
            point: datum.data.series.data,
            series: datum.data.series,
        }),
    );
}

export function prepareNearestData({
    data,
}: PrepareNearestDataArgs<PreparedPieData>): NearestCandidate[] {
    return data.flatMap((pie) =>
        pie.segments.flatMap((segment): NearestCandidate[] => {
            if (segment.endAngle <= segment.startAngle || segment.data.radius <= pie.innerRadius)
                return [];
            const angle = (segment.startAngle + segment.endAngle) / 2 - Math.PI / 2;
            const radius = (pie.innerRadius + segment.data.radius) / 2;
            return [
                {
                    position: [
                        pie.center[0] + Math.cos(angle) * radius,
                        pie.center[1] + Math.sin(angle) * radius,
                    ],
                    item: {point: segment.data.series.data, series: segment.data.series},
                },
            ];
        }),
    );
}
