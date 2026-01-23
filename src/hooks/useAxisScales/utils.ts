import type {scaleLinear} from 'd3';
import {ticks} from 'd3';
import get from 'lodash/get';

import {SERIES_TYPE} from '../../constants';
import type {SeriesType} from '../../constants';
import type {PreparedAxis, PreparedSeries, PreparedYAxis} from '../../hooks';
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

export function clusterYAxes(yAxes: PreparedYAxis[]): [PreparedYAxis, PreparedYAxis?][] {
    if (yAxes.length <= 1) {
        return yAxes.map((axis) => [axis]);
    }

    const clusters: Record<number, PreparedYAxis[]> = {};
    yAxes.forEach((axis) => {
        const plotIndex = axis.plotIndex ?? 0;
        if (!clusters[plotIndex]) {
            clusters[plotIndex] = [];
        }
        clusters[plotIndex].push(axis);
    });

    return Object.values(clusters).map((cluster) => {
        if (cluster.length <= 1) {
            return [cluster[0]];
        }

        const leftAxis = cluster.find((a) => a.position === 'left');
        const secondaryAxis = cluster.find((a) => a !== leftAxis);

        if (leftAxis) {
            return [leftAxis, secondaryAxis];
        }

        return [cluster[0], cluster[1]];
    });
}

export function getDomainSyncedToPrimaryTicks(args: {
    primaryTickPositions: number[];
    range: [number, number];
    // Don't type this as `typeof scaleLinear | typeof scaleLog`.
    // In this helper we don't care about the linear vs log differences — we only need
    // the common API (`domain`/`range`/`invert`). To avoid the "union of overloaded functions
    // is not callable" issue, we keep the factory type concrete (`typeof scaleLinear`) here.
    // See: https://github.com/microsoft/TypeScript/issues/57400
    scaleFn: typeof scaleLinear;
    secondaryDomain: number[];
}): [number, number] {
    const {primaryTickPositions, range, scaleFn, secondaryDomain} = args;
    const [dMin, dMax] = secondaryDomain;
    const primaryPosBottom = primaryTickPositions[0];
    const primaryPosTop = primaryTickPositions[primaryTickPositions.length - 1];
    let secondaryTicks = ticks(dMin, dMax, primaryTickPositions.length);
    let originalStep = 0;

    if (typeof secondaryTicks[0] === 'number' && typeof secondaryTicks[1] === 'number') {
        originalStep = secondaryTicks[1] - secondaryTicks[0];
    }

    let i = 1;

    while (secondaryTicks.length > primaryTickPositions.length) {
        secondaryTicks = ticks(dMin, dMax, primaryTickPositions.length - i);
        i += 1;
    }

    let step = originalStep;

    if (typeof secondaryTicks[0] === 'number' && typeof secondaryTicks[1] === 'number') {
        step = secondaryTicks[1] - secondaryTicks[0];
    }

    let ticksCountDiff = primaryTickPositions.length - secondaryTicks.length;
    let deltaMin = Math.abs(dMin - secondaryTicks[0]);
    let deltaMax = Math.abs(dMax - secondaryTicks[secondaryTicks.length - 1]);

    while (ticksCountDiff > 0) {
        if (deltaMin > deltaMax) {
            secondaryTicks.unshift(secondaryTicks[0] - step);
            deltaMin -= step;
        } else {
            secondaryTicks.push(secondaryTicks[secondaryTicks.length - 1] + step);
            deltaMax -= step;
        }

        ticksCountDiff -= 1;
    }

    let tmpScale = scaleFn()
        .domain([secondaryTicks[0], secondaryTicks[secondaryTicks.length - 1]])
        .range([primaryPosBottom, primaryPosTop]);
    let dNewMin = tmpScale.invert(range[0]);
    let dNewMax = tmpScale.invert(range[1]);

    if (dNewMin < dMin) {
        secondaryTicks = secondaryTicks.map((st) => st + step);
        tmpScale = scaleFn()
            .domain([secondaryTicks[0], secondaryTicks[secondaryTicks.length - 1]])
            .range([primaryPosBottom, primaryPosTop]);
        dNewMin = tmpScale.invert(range[0]);
        dNewMax = tmpScale.invert(range[1]);
    }

    return [dNewMin, dNewMax];
}
