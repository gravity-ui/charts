import type {AxisDomain, AxisScale} from 'd3-axis';

import {isBandScale} from '../utils';

interface BandSizeArgs {
    domain: AxisDomain[];
    scale: AxisScale<AxisDomain> | undefined;
}

export function getBandSize({domain, scale}: BandSizeArgs) {
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

/** Bars on continuous axes share the smallest spacing between distinct positions. */
export function getBarBandSize({domain, scale}: BandSizeArgs) {
    if (scale && !isBandScale(scale)) {
        const positions = [...new Set(domain.map(Number).filter(Number.isFinite))];
        positions.sort((a, b) => a - b);
        return getBandSize({domain: positions, scale});
    }
    return getBandSize({domain, scale});
}
