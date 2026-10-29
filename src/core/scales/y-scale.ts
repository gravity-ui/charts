import {extent, tickStep, ticks} from 'd3-array';
import type {AxisDomain, AxisScale} from 'd3-axis';
import {scaleBand, scaleLinear, scaleLog, scaleUtc} from 'd3-scale';
import get from 'lodash/get';

import {getAutomaticTickValues} from '../../components/AxisY/utils';
import type {PreparedAxis} from '../axes/types';
import {SERIES_TYPE} from '../constants';
import type {PreparedSeries} from '../series';
import {hasAxisBaseline} from '../series/axis-domain';
import {getDomainDataYBySeries, shouldSyncAxisWithPrimary} from '../utils';
import {getBandSize} from '../utils/band-size';
import {sumDecimals} from '../utils/math';

import {getDomainPadding, getPaddedDomain} from './axis-padding-options';
import type {ChartScaleLinear} from './types';
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

function isSeriesWithYAxisOffset(series: PreparedSeries[]) {
    const types = [SERIES_TYPE.BarY, SERIES_TYPE.Heatmap] as string[];
    return series.some((s) => types.includes(s.type));
}

export function getDomainSyncedToPrimaryTicks(args: {
    scale: ChartScaleLinear;
    primaryTicksCount: number;
    yMin: number;
    yMax: number;
}) {
    const {primaryTicksCount, scale, yMin, yMax} = args;
    const [dMin, dMax] = scale.domain();
    let secondaryTicks = ticks(dMin, dMax, primaryTicksCount);
    let i = 1;

    // Need to reduce the number of ticks to primaryTicksCount - 2, so that we can later
    // add one tick each at the top and bottom edges of the chart
    while (secondaryTicks.length > primaryTicksCount - 2) {
        secondaryTicks = ticks(dMin, dMax, primaryTicksCount - i);

        if (secondaryTicks.length === 0) {
            secondaryTicks = ticks(dMin, dMax, primaryTicksCount - i + 1);
            break;
        }

        i += 1;
    }

    const step = tickStep(dMin, dMax, secondaryTicks.length);
    let ticksCountDiff = primaryTicksCount - secondaryTicks.length;
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

    if (secondaryTicks[secondaryTicks.length - 1] < yMax) {
        secondaryTicks[secondaryTicks.length - 1] += step;
    }

    if (secondaryTicks[0] > yMin) {
        secondaryTicks[0] -= step;
    }

    const syncedDomain = [secondaryTicks[0], secondaryTicks[secondaryTicks.length - 1]];
    return syncedDomain.every(Number.isFinite) && Number.isFinite(syncedDomain[1] - syncedDomain[0])
        ? syncedDomain
        : [dMin, dMax];
}

function getLogarithmicYMin(args: {
    axis: PreparedAxis;
    domain: unknown[];
    yMinDomain: number;
    hasBaseline: boolean;
}): number {
    const {axis, domain, yMinDomain, hasBaseline} = args;

    // scaleLog cannot represent values <= 0. Pick the smallest positive value
    // present in the domain, falling back to 1 if there is none.
    const smallestPositive =
        yMinDomain > 0
            ? yMinDomain
            : (domain.reduce<number | null>((min, v) => {
                  if (typeof v === 'number' && v > 0) {
                      return min === null ? v : Math.min(min, v);
                  }
                  return min;
              }, null) ?? 1);

    if (!hasBaseline) {
        return smallestPositive;
    }

    // Series requiring a baseline draw from yMin up to the
    // value, so a bar whose value equals yMin collapses to zero height. Drop
    // the baseline one decade below to give it visible space — but only when
    // the later `nice()` pass (triggered by startOnTick) won't supply that
    // headroom on its own. nice() rounds down to the previous decade, which
    // covers any value strictly between two decades; it has nothing to round
    // when the smallest value already sits on a decade (e.g. 1, 10, 100).
    const startOnTick = get(axis, 'startOnTick', false);
    const isOnDecade = Number.isInteger(Math.log10(smallestPositive));
    const needsHeadroom = !startOnTick || isOnDecade;

    return needsHeadroom ? smallestPositive / 10 : smallestPositive;
}

export function getDomainMinAlignedToStartTick(args: {
    axis: PreparedAxis;
    range: [number, number];
    scale: ChartScaleLinear;
    series: PreparedSeries[];
}) {
    const {axis, range, scale, series} = args;
    const [dMin, dMax] = scale.domain();
    const tickValues = getAutomaticTickValues({
        axis,
        scale,
        labelLineHeight: axis.labels.lineHeight,
        series,
    }) as {y: number; value: number}[];

    if (tickValues.length === 0) {
        return dMin;
    }

    const isStartOnTick = tickValues[0].y === range[0];
    let dNewMin = dMin;

    if (!isStartOnTick) {
        if (axis.type === 'logarithmic') {
            const [nicedMin, _nicedMax] = scale.copy().nice().domain();
            dNewMin = nicedMin;
        } else {
            let step: number;

            if (
                typeof tickValues[0]?.value === 'number' &&
                typeof tickValues[1]?.value === 'number'
            ) {
                step = sumDecimals([tickValues[1].value, -tickValues[0].value]);
            } else {
                step = tickStep(dMin, dMax, 1);
            }

            if (step === 0) {
                return dMin;
            }

            dNewMin = sumDecimals([tickValues[0].value, -step]);
        }
    }

    return Number.isFinite(dNewMin) && (axis.type !== 'logarithmic' || dNewMin > 0)
        ? dNewMin
        : dMin;
}

export function getDomainMaxAlignedToEndTick(args: {
    axis: PreparedAxis;
    range: [number, number];
    scale: ChartScaleLinear;
    series: PreparedSeries[];
}) {
    const {axis, range, scale, series} = args;
    const [dMin, dMax] = scale.domain();
    const tickValues = getAutomaticTickValues({
        axis,
        scale,
        labelLineHeight: axis.labels.lineHeight,
        series,
    }) as {y: number; value: number}[];

    if (tickValues.length === 0) {
        return dMax;
    }

    let dNewMax = dMax;
    const isEndOnTick = tickValues[tickValues.length - 1].y === range[1];
    if (!isEndOnTick) {
        if (axis.type === 'logarithmic') {
            const [_nicedMin, nicedMax] = scale.copy().nice().domain();
            dNewMax = nicedMax;
        } else {
            let step: number;
            if (
                typeof tickValues[0]?.value === 'number' &&
                typeof tickValues[1]?.value === 'number'
            ) {
                step = sumDecimals([tickValues[1].value, -tickValues[0].value]);
            } else {
                step = tickStep(dMin, dMax, 1);
            }

            if (step === 0) {
                return dMax;
            }

            dNewMax =
                tickValues.length === 1
                    ? Math.floor(dMax / step + 1) * step
                    : Math.max(dMax, sumDecimals([tickValues[tickValues.length - 1].value, step]));
        }
    }

    return Number.isFinite(dNewMax) ? dNewMax : dMax;
}

export function createYScale(args: {
    axis: PreparedAxis;
    boundsHeight: number;
    series: PreparedSeries[];
    primaryAxis?: PreparedAxis;
    primaryTicksCount?: number;
    zoomStateY?: [number, number];
}) {
    const {axis, boundsHeight, series, primaryAxis, primaryTicksCount, zoomStateY} = args;
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

                const hasBaseline = hasAxisBaseline(series, 'y');

                let yMin: number;
                if (typeof yMinPropsOrState === 'number') {
                    yMin = yMinPropsOrState;
                } else if (axis.type === 'logarithmic') {
                    yMin = getLogarithmicYMin({
                        axis,
                        domain,
                        yMinDomain,
                        hasBaseline,
                    });
                } else {
                    yMin = hasBaseline ? Math.min(yMinDomain, 0) : yMinDomain;
                }

                let yMax: number;
                if (typeof yMaxPropsOrState === 'number') {
                    yMax = yMaxPropsOrState;
                } else if (axis.type === 'logarithmic') {
                    // scaleLog cannot represent values <= 0; ensure yMax is strictly
                    // greater than yMin so the resulting domain stays valid.
                    yMax = yMaxDomain > yMin ? yMaxDomain : yMin * 10;
                } else {
                    yMax = hasBaseline ? Math.max(yMaxDomain, 0) : yMaxDomain;
                }

                // When the user pins only one of min/max on the wrong side of all data,
                // d3 produces either an inverted scale (yMax<yMin, silently flips the
                // axis) or a degenerate one (yMax===yMin, maps everything to the range
                // midpoint); both leave phantom hover targets inside an empty plot.
                // Expand the auto-computed side so the scale stays sane. Only applies
                // when the opposite bound is auto-derived — if the user supplied both
                // bounds, trust the explicit range and let point filtering hide the
                // rest. Comparison uses the raw data extent because upstream coercions
                // like baseline expansion `yMax = Math.max(yMaxDomain, 0)` can make the
                // post-coerced yMin/yMax lie about where data actually sits.
                // Logarithmic has its own guard.
                if (axis.type === 'linear') {
                    const minIsUserSet = typeof yMinPropsOrState === 'number';
                    const maxIsUserSet = typeof yMaxPropsOrState === 'number';
                    if (minIsUserSet && !maxIsUserSet && yMaxDomain < yMin) {
                        yMax = yMin + Math.max(Math.abs(yMin), 1);
                    } else if (maxIsUserSet && !minIsUserSet && yMinDomain > yMax) {
                        yMin = yMax - Math.max(Math.abs(yMax), 1);
                    }
                }

                const scaleFn = axis.type === 'logarithmic' ? scaleLog : scaleLinear;
                let scale = scaleFn().domain([yMin, yMax]).range(range);

                const domainPadding = getDomainPadding(axis, Boolean(zoomStateY));
                let offsetMin = 0;
                let offsetMax = 0;
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

                scale = scale.domain(
                    getPaddedDomain({
                        scale,
                        domain: [yMin, yMax],
                        type: axis.type,
                        padding: domainPadding,
                        size: boundsHeight,
                        offsetMin,
                        offsetMax,
                        isMinSpecified,
                        isMaxSpecified,
                    }),
                );

                const startOnTick = get(axis, 'startOnTick', false);
                const endOnTick = get(axis, 'endOnTick', false);
                const shouldBeSyncedWithPrimary = primaryAxis
                    ? shouldSyncAxisWithPrimary(axis, primaryAxis)
                    : false;

                if (
                    shouldBeSyncedWithPrimary &&
                    typeof primaryTicksCount === 'number' &&
                    primaryTicksCount >= 2
                ) {
                    const newDomain = getDomainSyncedToPrimaryTicks({
                        scale,
                        primaryTicksCount,
                        yMin,
                        yMax,
                    });
                    scale.domain(newDomain);
                }

                if (startOnTick && (!primaryAxis || !shouldBeSyncedWithPrimary)) {
                    const [_, dMax] = scale.domain();
                    const dNewMin = getDomainMinAlignedToStartTick({axis, range, scale, series});
                    scale.domain([dNewMin, dMax]);
                }

                if (endOnTick && (!primaryAxis || !shouldBeSyncedWithPrimary)) {
                    const [dMin, _] = scale.domain();
                    const dNewMax = getDomainMaxAlignedToEndTick({axis, range, scale, series});
                    scale.domain([dMin, dNewMax]);
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
                    series,
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
                const [paddedMin, paddedMax] = getPaddedDomain({
                    scale,
                    domain: [yMin, yMax],
                    type: axis.type,
                    // Explicit timestamps have never used the legacy maxPadding fallback.
                    padding: getDomainPadding(
                        {type: axis.type, padding: axis.padding},
                        Boolean(zoomStateY),
                    ),
                    size: boundsHeight,
                    offsetMin: 0,
                    offsetMax: 0,
                    isMinSpecified: typeof axis.min === 'number' && !zoomStateY,
                    isMaxSpecified: typeof axis.max === 'number' && !zoomStateY,
                });
                scale.domain([paddedMin, paddedMax]);
                const startOnTick = get(axis, 'startOnTick', true);
                const endOnTick = get(axis, 'endOnTick', true);

                if (startOnTick || endOnTick) {
                    const nicedDomain = scale.copy().nice().domain();
                    return scale.domain([
                        startOnTick ? Number(nicedDomain[0]) : paddedMin,
                        endOnTick ? Number(nicedDomain[1]) : paddedMax,
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

                    const domainPadding = getDomainPadding(axis, Boolean(zoomStateY));
                    let offsetMin = 0;
                    let offsetMax = 0;
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

                    return scale.domain(
                        getPaddedDomain({
                            scale,
                            domain: [yMin, yMax],
                            type: axis.type,
                            padding: domainPadding,
                            size: boundsHeight,
                            offsetMin,
                            offsetMax,
                            isMinSpecified,
                            isMaxSpecified,
                        }),
                    );
                }
            }
        }
    }

    throw new Error('Failed to create yScale');
}
