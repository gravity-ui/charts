import {duration} from '@gravity-ui/date-utils';
import {extent} from 'd3';

import type {ChartScaleLinear, ChartScaleTime, PreparedSeries, PreparedXAxis} from '../hooks';
import type {ChartAxisRangeSlider} from '../types';
import {getDomainDataXBySeries, isTimeScale} from '../utils';

export function getInitialRangeSliderState(args: {
    preparedSeries: PreparedSeries[];
    preparedXAxis: PreparedXAxis;
    xScale: ChartScaleLinear | ChartScaleTime;
    defaultRange?: ChartAxisRangeSlider['defaultRange'];
}) {
    const {defaultRange, preparedSeries, preparedXAxis, xScale} = args;
    let minRange: number;
    let maxRange: number;

    if (isTimeScale(xScale)) {
        const domainData =
            preparedXAxis.timestamps ||
            (getDomainDataXBySeries(preparedSeries) as [number, number]);
        let [minDomainMs, maxDomainMs] = extent(domainData);

        if (typeof minDomainMs !== 'number' || typeof maxDomainMs !== 'number') {
            const scaleDomain = xScale.domain();
            minDomainMs = scaleDomain[0].valueOf();
            maxDomainMs = scaleDomain[1].valueOf();
        }

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
        const domainData = getDomainDataXBySeries(preparedSeries) as [number, number];
        let [minDomain, maxDomain] = extent(domainData);

        if (typeof minDomain !== 'number' || typeof maxDomain !== 'number') {
            const scaleDomain = xScale.domain();
            minDomain = scaleDomain[0];
            maxDomain = scaleDomain[1];
        }

        maxDomain += xScale.niceOffsetMax ?? 0;

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
