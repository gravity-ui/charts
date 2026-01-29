import {extent, scaleBand, scaleLinear, scaleLog, scaleUtc, tickStep, ticks} from 'd3';
import type {AxisDomain, AxisScale} from 'd3';
import get from 'lodash/get';

import {getTickValues} from '../../components/AxisY/utils';
import {SERIES_TYPE} from '../../constants';
import type {PreparedAxis, PreparedSeries} from '../../hooks';
import type {ChartSeries} from '../../types';
import {
    CHART_SERIES_WITH_VOLUME_ON_Y_AXIS,
    getDomainDataYBySeries,
    shouldSyncAxisWithPrimary,
} from '../../utils';
import {getBandSize} from '../utils/get-band-size';

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

function isSeriesWithYAxisOffset(series: (PreparedSeries | ChartSeries)[]) {
    const types = [SERIES_TYPE.BarY, SERIES_TYPE.Heatmap] as string[];
    return series.some((s) => types.includes(s.type));
}

function getDomainSyncedToPrimaryTicks(args: {
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

    return [secondaryTicks[0], secondaryTicks[secondaryTicks.length - 1]];
}

function getDomainMinAlignedToStartTick(args: {
    axis: PreparedAxis;
    range: [number, number];
    scale: ChartScaleLinear;
    series: PreparedSeries[] | ChartSeries[];
}) {
    const {axis, range, scale, series} = args;
    const [dMin, dMax] = scale.domain();
    const tickValues = getTickValues({
        axis,
        scale,
        labelLineHeight: axis.labels.lineHeight,
        series,
    }) as {y: number; value: number}[];
    const isStartOnTick = tickValues[0].y === range[0];
    let dNewMin = dMin;

    if (!isStartOnTick) {
        let step: number;

        if (typeof tickValues[0]?.value === 'number' && typeof tickValues[1]?.value === 'number') {
            step = tickValues[1].value - tickValues[0].value;
        } else {
            step = tickStep(dMin, dMax, 1);
        }

        dNewMin = tickValues[0].value - step;
    }

    return dNewMin;
}

function getDomainMaxAlignedToEndTick(args: {
    axis: PreparedAxis;
    range: [number, number];
    scale: ChartScaleLinear;
    series: PreparedSeries[] | ChartSeries[];
}) {
    const {axis, range, scale, series} = args;
    const [dMin, dMax] = scale.domain();
    const tickValues = getTickValues({
        axis,
        scale,
        labelLineHeight: axis.labels.lineHeight,
        series,
    }) as {y: number; value: number}[];
    const isEndOnTick = tickValues[tickValues.length - 1].y === range[1];
    let dNewMax = dMax;

    if (!isEndOnTick) {
        let step: number;
        if (typeof tickValues[0]?.value === 'number' && typeof tickValues[1]?.value === 'number') {
            step = tickValues[1].value - tickValues[0].value;
        } else {
            step = tickStep(dMin, dMax, 1);
        }

        dNewMax = tickValues[tickValues.length - 1].value + step;
    }

    return dNewMax;
}

// eslint-disable-next-line complexity
export function createYScale(args: {
    axis: PreparedAxis;
    boundsHeight: number;
    series: PreparedSeries[] | ChartSeries[];
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
