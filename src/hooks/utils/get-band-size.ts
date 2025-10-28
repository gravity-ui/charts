import type {AxisDomain, AxisScale} from 'd3';

import {isBandScale} from '../../utils';

export function getBandSize({
    domain,
    scale,
}: {
    domain: AxisDomain[];
    scale: AxisScale<AxisDomain> | undefined;
}) {
    if (!scale || !domain.length) {
        return 0;
    }

    if (isBandScale(scale)) {
        return scale.bandwidth();
    }

    const range = scale.range();
    const plotHeight = Math.abs(range[0] - range[1]);

    if (domain.length === 1) {
        return plotHeight;
    }

    // for the numeric or datetime axes, you first need to count domain.length + 1,
    // since the extreme points are located not in the center of the bar, but along the edges of the axes
    let bandWidth = plotHeight / (domain.length - 1);
    domain.forEach((current, index) => {
        if (index > 0) {
            const prev = domain[index - 1];
            const prevY = scale(prev);
            const currentY = scale(current);
            if (typeof prevY === 'number' && typeof currentY === 'number') {
                const distance = Math.abs(prevY - currentY);
                bandWidth = Math.min(bandWidth, distance);
            }
        }
    });

    return bandWidth;
}
