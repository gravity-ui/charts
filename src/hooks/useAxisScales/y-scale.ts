import {extent, scaleBand, scaleLinear, scaleLog, scaleUtc, ticks} from 'd3';
import type {AxisDomain, AxisScale} from 'd3';
import get from 'lodash/get';

import {SERIES_TYPE} from '../../constants';
import type {PreparedAxis, PreparedSeries} from '../../hooks';
import type {ChartSeries} from '../../types';
import {CHART_SERIES_WITH_VOLUME_ON_Y_AXIS, getDomainDataYBySeries} from '../../utils';
import {getBandSize} from '../utils/get-band-size';

import {
    checkIsPointDomain,
    filterCategoriesByVisibleSeries,
    getMinMaxPropsOrState,
    hasOnlyMarkerSeries,
    validateArrayData,
} from './utils';

// axis is validated in `validation/index.ts`, so the value of `axis.type` is definitely valid.
// eslint-disable-next-line consistent-return
function getYScaleRange(args: {axis: PreparedAxis; boundsHeight: number}): [number, number] {
    const {axis, boundsHeight} = args;
    switch (axis.type) {
        case 'datetime':
        case 'linear':
        case 'logarithmic': {
            const range: [number, number] = [boundsHeight, 0];

            switch (axis.order) {
                case 'sortDesc':
                case 'reverse': {
                    range.reverse();
                }
            }

            return range;
        }
        case 'category': {
            return [boundsHeight, 0];
        }
    }
}

function isSeriesWithYAxisOffset(series: (PreparedSeries | ChartSeries)[]) {
    const types = [SERIES_TYPE.BarY, SERIES_TYPE.Heatmap] as string[];
    return series.some((s) => types.includes(s.type));
}

function getDomainSyncedToPrimaryTicks(args: {
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

// eslint-disable-next-line complexity
export function createYScale(args: {
    axis: PreparedAxis;
    boundsHeight: number;
    series: PreparedSeries[] | ChartSeries[];
    primaryTickPositions?: number[];
    zoomStateY?: [number, number];
}) {
    const {axis, boundsHeight, series, primaryTickPositions, zoomStateY} = args;
    const [yMinPropsOrState, yMaxPropsOrState] = getMinMaxPropsOrState({
        axis,
        maxValues: [zoomStateY?.[1]],
        minValues: [zoomStateY?.[0]],
    });

    const yCategories = get(axis, 'categories');
    const yTimestamps = get(axis, 'timestamps');
    const range = getYScaleRange({axis, boundsHeight});

    switch (axis.type) {
        case 'linear':
        case 'logarithmic': {
            const domain = getDomainDataYBySeries(series);
            const {hasNumberAndNullValues, hasOnlyNullValues} = validateArrayData(domain);

            if (hasOnlyNullValues || domain.length === 0) {
                return undefined;
            }

            if (
                series.some(
                    (s) => (s.type === 'bar-x' || s.type === 'area') && s.stacking === 'percent',
                )
            ) {
                return scaleLinear().domain([0, 100]).range(range);
            }

            if (hasNumberAndNullValues) {
                const [yMinDomain, yMaxDomain] = extent(domain as [number, number]) as [
                    number,
                    number,
                ];
                const isPointDomain = hasOnlyMarkerSeries(series)
                    ? checkIsPointDomain([yMinDomain, yMaxDomain])
                    : false;

                const yMin =
                    typeof yMinPropsOrState === 'number' && !isPointDomain
                        ? yMinPropsOrState
                        : yMinDomain;
                let yMax: number;

                if (typeof yMaxPropsOrState === 'number' && !isPointDomain) {
                    yMax = yMaxPropsOrState;
                } else {
                    const hasSeriesWithVolumeOnYAxis = series.some((s) =>
                        CHART_SERIES_WITH_VOLUME_ON_Y_AXIS.includes(s.type),
                    );
                    yMax = hasSeriesWithVolumeOnYAxis ? Math.max(yMaxDomain, 0) : yMaxDomain;
                }

                const scaleFn = axis.type === 'logarithmic' ? scaleLog : scaleLinear;
                let scale = scaleFn().domain([yMin, yMax]).range(range);

                if (primaryTickPositions) {
                    const syncedDomain = getDomainSyncedToPrimaryTicks({
                        primaryTickPositions,
                        range,
                        scaleFn,
                        secondaryDomain: scale.domain(),
                    });

                    scale.domain(syncedDomain);
                } else {
                    let offsetMin = 0;
                    // We should ignore padding if we are drawing only one point on the plot.
                    let offsetMax = yMin === yMax ? 0 : boundsHeight * axis.maxPadding;
                    if (isSeriesWithYAxisOffset(series)) {
                        if (domain.length > 1) {
                            const bandWidth = getBandSize({
                                scale: scale as AxisScale<AxisDomain>,
                                domain: domain as AxisDomain[],
                            });

                            offsetMin += bandWidth / 2;
                            offsetMax += bandWidth / 2;
                        }
                    }

                    const isMinSpecified = typeof get(axis, 'min') === 'number' && !zoomStateY;
                    const isMaxSpecified = typeof get(axis, 'max') === 'number' && !zoomStateY;

                    const domainOffsetMin = isMinSpecified
                        ? 0
                        : Math.abs(scale.invert(offsetMin) - scale.invert(0));
                    const domainOffsetMax = isMaxSpecified
                        ? 0
                        : Math.abs(scale.invert(offsetMax) - scale.invert(0));

                    scale = scale.domain([yMin - domainOffsetMin, yMax + domainOffsetMax]);
                }

                // 10 is the default value for the number of ticks. Here, to preserve the appearance of a series with a small number of points
                const nicedDomain = scale.copy().nice(Math.max(10, domain.length)).domain();

                const startOnTick = get(axis, 'startOnTick', false);
                const endOnTick = get(axis, 'endOnTick', false);
                const hasOffset = isSeriesWithYAxisOffset(series);

                if (!zoomStateY && !hasOffset && nicedDomain.length === 2) {
                    const domainWithOffset = scale.domain();
                    scale.domain([
                        startOnTick
                            ? Math.min(nicedDomain[0], domainWithOffset[0])
                            : domainWithOffset[0],
                        endOnTick
                            ? Math.max(nicedDomain[1], domainWithOffset[1])
                            : domainWithOffset[1],
                    ]);
                }

                return scale;
            }

            break;
        }
        case 'category': {
            if (yCategories) {
                const filteredCategories = filterCategoriesByVisibleSeries({
                    axisDirection: 'y',
                    categories: yCategories,
                    series: series,
                });
                return scaleBand().domain(filteredCategories).range(range);
            }

            break;
        }
        case 'datetime': {
            if (yTimestamps) {
                const [yMinTimestamp, yMaxTimestamp] = extent(yTimestamps) as [number, number];
                const isPointDomain = hasOnlyMarkerSeries(series)
                    ? checkIsPointDomain([yMinTimestamp, yMaxTimestamp])
                    : false;
                const yMin =
                    typeof yMinPropsOrState === 'number' &&
                    !isPointDomain &&
                    yMinPropsOrState > yMinTimestamp
                        ? yMinPropsOrState
                        : yMinTimestamp;
                const yMax =
                    typeof yMaxPropsOrState === 'number' &&
                    !isPointDomain &&
                    yMaxPropsOrState < yMaxTimestamp
                        ? yMaxPropsOrState
                        : yMaxTimestamp;
                const scale = scaleUtc().domain([yMin, yMax]).range(range);
                const startOnTick = get(axis, 'startOnTick', true);
                const endOnTick = get(axis, 'endOnTick', true);

                if (startOnTick || endOnTick) {
                    const nicedDomain = scale.copy().nice().domain();
                    return scale.domain([
                        startOnTick ? Number(nicedDomain[0]) : yMin,
                        endOnTick ? Number(nicedDomain[1]) : yMax,
                    ]);
                }
                return scale;
            } else {
                const domain = getDomainDataYBySeries(series);
                const {hasNumberAndNullValues, hasOnlyNullValues} = validateArrayData(domain);

                if (hasOnlyNullValues || domain.length === 0) {
                    return undefined;
                }

                if (hasNumberAndNullValues) {
                    const [yMinTimestamp, yMaxTimestamp] = extent(domain as [number, number]) as [
                        number,
                        number,
                    ];
                    const isPointDomain = hasOnlyMarkerSeries(series)
                        ? checkIsPointDomain([yMinTimestamp, yMaxTimestamp])
                        : false;
                    const yMin =
                        typeof yMinPropsOrState === 'number' &&
                        !isPointDomain &&
                        yMinPropsOrState > yMinTimestamp
                            ? yMinPropsOrState
                            : yMinTimestamp;
                    const yMax =
                        typeof yMaxPropsOrState === 'number' &&
                        !isPointDomain &&
                        yMaxPropsOrState < yMaxTimestamp
                            ? yMaxPropsOrState
                            : yMaxTimestamp;
                    const scale = scaleUtc().domain([yMin, yMax]).range(range);

                    let offsetMin = 0;
                    let offsetMax = boundsHeight * axis.maxPadding;
                    if (isSeriesWithYAxisOffset(series)) {
                        if (Object.keys(domain).length > 1) {
                            const bandWidth = getBandSize({
                                scale: scale as AxisScale<AxisDomain>,
                                domain: domain as AxisDomain[],
                            });

                            offsetMin += bandWidth / 2;
                            offsetMax += bandWidth / 2;
                        }
                    }

                    const isMinSpecified = typeof get(axis, 'min') === 'number' && !zoomStateY;
                    const isMaxSpecified = typeof get(axis, 'max') === 'number' && !zoomStateY;

                    const domainOffsetMin = isMinSpecified
                        ? 0
                        : Math.abs(scale.invert(offsetMin).getTime() - scale.invert(0).getTime());
                    const domainOffsetMax = isMaxSpecified
                        ? 0
                        : Math.abs(scale.invert(offsetMax).getTime() - scale.invert(0).getTime());

                    return scale.domain([yMin - domainOffsetMin, yMax + domainOffsetMax]);
                }
            }
        }
    }

    throw new Error('Failed to create yScale');
}
