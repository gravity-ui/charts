import {
    utcDay,
    utcHour,
    utcMillisecond,
    utcMinute,
    utcMonth,
    utcSecond,
    utcWeek,
    utcYear,
} from 'd3';
import type {CountableTimeInterval} from 'd3';

import type {ChartScale, ChartScaleTime, PreparedAxis} from '../../../hooks';
import {getMinSpaceBetween} from '../array';
import {TIME_UNITS} from '../time';

import {getTicksCount, isBandScale, isTimeScale, thinOut} from './common';

/**
 * Time intervals ordered from largest to smallest.
 * Each entry contains the D3 interval and its approximate duration in milliseconds.
 */
const TIME_INTERVALS: Array<{
    interval: CountableTimeInterval;
    unit: keyof typeof TIME_UNITS;
    duration: number;
}> = [
    {interval: utcYear, unit: 'year', duration: TIME_UNITS.year},
    {interval: utcMonth, unit: 'month', duration: TIME_UNITS.month},
    {interval: utcWeek, unit: 'week', duration: TIME_UNITS.week},
    {interval: utcDay, unit: 'day', duration: TIME_UNITS.day},
    {interval: utcHour, unit: 'hour', duration: TIME_UNITS.hour},
    {interval: utcMinute, unit: 'minute', duration: TIME_UNITS.minute},
    {interval: utcSecond, unit: 'second', duration: TIME_UNITS.second},
    {interval: utcMillisecond, unit: 'millisecond', duration: TIME_UNITS.millisecond},
];

// Minimum desired number of ticks for good visual density
const MIN_DESIRED_TICKS = 4;

/**
 * Determines the best time interval for datetime axis ticks based on:
 * - The total time range of the data
 * - The available pixel width
 * - The label width requirements
 */
function getBestDatetimeInterval(args: {
    domain: [Date, Date];
    axisWidth: number;
    labelWidth: number;
    padding: number;
}): {interval: CountableTimeInterval; step: number} {
    const {domain, axisWidth, labelWidth, padding} = args;
    const totalRange = domain[1].getTime() - domain[0].getTime();

    // Minimum space needed between ticks to fit labels
    const minTickSpacing = labelWidth + padding * 2;
    // Maximum number of ticks that can fit
    const maxTicks = Math.max(MIN_DESIRED_TICKS, Math.floor(axisWidth / minTickSpacing));

    // Find the best interval - we want the smallest interval that:
    // 1. Produces ticks that fit within maxTicks (with step if needed)
    // 2. Produces at least MIN_DESIRED_TICKS ticks for good visual density
    let bestResult: {interval: CountableTimeInterval; step: number; ticks: number} | null = null;

    for (const {interval, duration} of TIME_INTERVALS) {
        const estimatedTicks = Math.ceil(totalRange / duration);

        // Skip if this interval produces no meaningful ticks
        if (estimatedTicks < 2) {
            continue;
        }

        // Calculate step needed to fit within maxTicks
        let step = 1;
        if (estimatedTicks > maxTicks) {
            step = Math.ceil(estimatedTicks / maxTicks);
        }

        const ticksWithStep = Math.ceil(totalRange / (duration * step));

        // Skip if we can't get at least 2 ticks
        if (ticksWithStep < 2) {
            continue;
        }

        // Prefer this interval if:
        // 1. We don't have a result yet, or
        // 2. This produces more ticks (better density) while still fitting
        if (!bestResult || ticksWithStep > bestResult.ticks) {
            bestResult = {interval, step, ticks: ticksWithStep};
        }

        // If we've reached or exceeded our desired tick count, we can stop
        // (since we're iterating from largest to smallest intervals)
        if (ticksWithStep >= MIN_DESIRED_TICKS) {
            break;
        }
    }

    if (bestResult) {
        return {interval: bestResult.interval, step: bestResult.step};
    }

    // Ultimate fallback to milliseconds
    return {interval: utcMillisecond, step: 1};
}

/**
 * Generates tick values for datetime axes using intelligent time interval selection.
 * This produces "nice" ticks aligned to calendar boundaries (start of year, month, etc.)
 */
function getDatetimeAxisTickValues(args: {
    scale: ChartScaleTime;
    axis: PreparedAxis;
    axisWidth: number;
    labelLineHeight: number;
}): Array<{x: number; value: Date}> {
    const {scale, axis, axisWidth, labelLineHeight} = args;

    const domain = scale.domain();
    if (!domain[0] || !domain[1]) {
        return [];
    }

    // Find the best time interval based on data range and available space
    const {interval, step} = getBestDatetimeInterval({
        domain: domain as [Date, Date],
        axisWidth,
        labelWidth: labelLineHeight,
        padding: axis.labels.padding,
    });

    // Generate ticks using D3's time interval
    // .every(step) creates an interval that skips values (e.g., every 2 years)
    const timeInterval = step > 1 ? interval.every(step) : interval;
    if (!timeInterval) {
        return [];
    }

    const scaleTicks = scale.ticks(timeInterval);

    const result = scaleTicks.map((t) => ({
        x: scale(t),
        value: t,
    }));

    // Additional check: if ticks still don't fit, thin them out
    if (result.length > 1) {
        let availableSpaceForLabel =
            getMinSpaceBetween(result, (d: {x: number; value: Date}) => d.x) -
            axis.labels.padding * 2;

        if (availableSpaceForLabel < labelLineHeight) {
            let thinnedResult = result;
            let delta = 2;
            while (availableSpaceForLabel < labelLineHeight && thinnedResult.length > 1) {
                thinnedResult = thinOut(result, delta);
                if (thinnedResult.length > 1) {
                    delta += 1;
                    availableSpaceForLabel =
                        getMinSpaceBetween(thinnedResult, (d: {x: number; value: Date}) => d.x) -
                        axis.labels.padding * 2;
                }
            }
            return thinnedResult;
        }
    }

    return result;
}

export function getXAxisTickValues({
    scale,
    axis,
    labelLineHeight,
}: {
    scale: ChartScale;
    axis: PreparedAxis;
    labelLineHeight: number;
}) {
    if ('ticks' in scale && typeof scale.ticks === 'function') {
        const range = scale.range();
        const axisWidth = Math.abs(range[0] - range[1]);
        if (!axisWidth) {
            return [];
        }

        // Special handling for datetime scales - use intelligent time interval selection
        if (isTimeScale(scale)) {
            return getDatetimeAxisTickValues({
                scale: scale as ChartScaleTime,
                axis,
                axisWidth,
                labelLineHeight,
            });
        }

        // For non-datetime continuous scales (linear, logarithmic)
        const scaleTicksCount = getTicksCount({axis, range: axisWidth});
        const scaleTicks = scale.ticks(scaleTicksCount);

        const originalTickValues = scaleTicks.map((t) => ({
            x: scale(t),
            value: t,
        }));

        if (originalTickValues.length <= 1) {
            return originalTickValues;
        }

        // first, we try to draw "beautiful" tick values
        let result = originalTickValues;
        let availableSpaceForLabel =
            getMinSpaceBetween(result, (d) => d.x) - axis.labels.padding * 2;
        let ticksCount = result.length - 1;
        while (availableSpaceForLabel < labelLineHeight && result.length > 1) {
            ticksCount = ticksCount ? ticksCount - 1 : result.length - 1;
            const newScaleTicks = scale.ticks(ticksCount);
            result = newScaleTicks.map((t) => ({
                x: scale(t),
                value: t,
            }));

            availableSpaceForLabel =
                getMinSpaceBetween(result, (d) => d.x) - axis.labels.padding * 2;
        }

        // when this is not possible (for example, such values cannot be selected for the logarithmic axis with a small range)
        // just thin out the originally proposed result
        if (!result.length) {
            result = originalTickValues;
            availableSpaceForLabel =
                getMinSpaceBetween(result, (d) => d.x) - axis.labels.padding * 2;
            let delta = 2;
            while (availableSpaceForLabel < labelLineHeight && result.length > 1) {
                result = thinOut(result, delta);
                if (result.length > 1) {
                    delta += 1;
                    availableSpaceForLabel =
                        getMinSpaceBetween(result, (d) => d.x) - axis.labels.padding * 2;
                }
            }
        }

        return result;
    }

    if (isBandScale(scale)) {
        const domain = scale.domain();
        const bandWidth = scale.bandwidth();
        const items = domain.map((d) => ({
            x: (scale(d) ?? 0) + bandWidth / 2,
            value: d,
        }));

        if (items.length <= 1) {
            return items;
        }

        let result = [...items];
        let availableSpaceForLabel = Math.abs(result[0].x - result[1].x) - axis.labels.padding * 2;
        let delta = 2;
        while (availableSpaceForLabel < labelLineHeight && result.length > 1) {
            result = thinOut(items, delta);
            if (result.length > 1) {
                delta += 1;
                availableSpaceForLabel =
                    Math.abs(result[0].x - result[1].x) - axis.labels.padding * 2;
            }
        }

        return result;
    }

    return [];
}
