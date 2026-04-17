import type {AxisDomain, AxisScale} from 'd3-axis';

import type {ChartScale, ChartScaleLinear} from '../../../hooks';

import {getDateTimeTicks} from './datetime';

export function getScaleTicks({
    scale,
    ticksCount,
    dateTimeLabelFormats,
}: {
    scale: ChartScale | AxisScale<AxisDomain>;
    ticksCount?: number;
    dateTimeLabelFormats?: Parameters<typeof getDateTimeTicks>[3];
}): string[] | number[] | Date[] {
    const scaleDomain = scale.domain();

    switch (typeof scaleDomain[0]) {
        case 'number': {
            return (scale as ChartScaleLinear).ticks(ticksCount);
        }
        // datetime scale
        case 'object': {
            return getDateTimeTicks(
                scaleDomain[0] as Date,
                scaleDomain[scaleDomain.length - 1] as Date,
                ticksCount,
                dateTimeLabelFormats,
            );
        }
        case 'string': {
            return scaleDomain as string[];
        }
    }

    return [];
}
