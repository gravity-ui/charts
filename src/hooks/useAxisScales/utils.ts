import get from 'lodash/get';

import {SERIES_TYPE} from '../../constants';
import type {SeriesType} from '../../constants';
import type {PreparedAxis, PreparedSeries} from '../../hooks';
import type {ChartAxis, ChartSeries} from '../../types';

const MARKER_SERIES_TYPES: SeriesType[] = [SERIES_TYPE.Area, SERIES_TYPE.Line, SERIES_TYPE.Scatter];

type OptionalNumber = number | undefined;

function getNormilizedMinMax(args: {
    maxValues: OptionalNumber[];
    minValues: OptionalNumber[];
}): OptionalNumber[] {
    const {maxValues, minValues} = args;
    const filteredMaxValues = maxValues.filter((v) => typeof v === 'number');
    const filteredMinValues = minValues.filter((v) => typeof v === 'number');
    const max = filteredMaxValues.length ? Math.max(...filteredMaxValues) : undefined;
    const min = filteredMinValues.length ? Math.min(...filteredMinValues) : undefined;

    return [min, max];
}

export function getMinMaxPropsOrState(args: {
    axis: PreparedAxis | ChartAxis;
    maxValues: OptionalNumber[];
    minValues: OptionalNumber[];
}): [OptionalNumber, OptionalNumber] {
    const {axis, maxValues, minValues} = args;
    const minProps = get(axis, 'min');
    const maxProps = get(axis, 'max');
    const [minState, maxState] = getNormilizedMinMax({maxValues, minValues});
    const min = minState ?? minProps;
    const max = maxState ?? maxProps;

    return [min, max];
}

/**
 * Checks whether a domain represents a single point (when minimum and maximum values are equal).
 *
 * This is necessary for cases where exactly one marker needs to be rendered on an axis.
 * In such cases, it is not allowed to use axis extremums (min/max)
 * that differ from those in the domain, as this can lead to incorrect visualization
 * and scale stretching around a single point.
 */
export function checkIsPointDomain(domain: [number, number]) {
    return domain[0] === domain[1];
}

export function hasOnlyMarkerSeries(series: (PreparedSeries | ChartSeries)[]): boolean {
    return series.every((s) => MARKER_SERIES_TYPES.includes(s.type));
}

export function getXMaxDomainResult(args: {
    xMaxDomain: number;
    xMaxProps?: number;
    xMaxRangeSlider?: number;
    xMaxZoom?: number;
}) {
    const {xMaxDomain, xMaxProps, xMaxRangeSlider, xMaxZoom} = args;
    let xMaxDomainResult = xMaxDomain;

    // When xMaxRangeSlider is provided, we use it directly without considering xMaxDomain.
    // This is intentional: the range slider needs to display the chart's maxPadding area,
    // which would be clipped if we constrained it to xMaxDomain.
    if (typeof xMaxRangeSlider === 'number') {
        xMaxDomainResult = xMaxRangeSlider;
    } else if (typeof xMaxZoom === 'number' && xMaxZoom < xMaxDomain) {
        xMaxDomainResult = xMaxZoom;
    } else if (typeof xMaxProps === 'number' && xMaxProps < xMaxDomain) {
        xMaxDomainResult = xMaxProps;
    }

    return xMaxDomainResult;
}
