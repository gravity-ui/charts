import {duration} from '@gravity-ui/date-utils';

import type {ChartScaleLinear, ChartScaleTime} from '../hooks';
import type {ChartAxisRangeSlider} from '../types';
import {isTimeScale} from '../utils';

export function getInitialRangeSliderState(args: {
    xScale: ChartScaleLinear | ChartScaleTime;
    defaultRange?: ChartAxisRangeSlider['defaultRange'];
}) {
    const {defaultRange, xScale} = args;
    let minRange: number;
    let maxRange: number;

    if (isTimeScale(xScale)) {
        const [minDomainMs, maxDomainMs] = xScale.domain().map(Number);
        minRange = minDomainMs;
        maxRange = maxDomainMs;

        try {
            if (defaultRange?.size) {
                const durationMs = duration(defaultRange.size).asMilliseconds();
                const minDefaultRangeMs = maxDomainMs - durationMs;

                if (minDefaultRangeMs < maxDomainMs) {
                    minRange = minDefaultRangeMs;
                }
            }
        } catch {}
    } else {
        const [minDomain, maxDomain] = xScale.domain();
        minRange = minDomain;
        maxRange = maxDomain;

        if (typeof defaultRange?.size === 'number') {
            const minDefaultRange = maxDomain - defaultRange.size;
            if (minDefaultRange < maxDomain) {
                minRange = minDefaultRange;
            }
        }
    }

    return {min: minRange, max: maxRange};
}
