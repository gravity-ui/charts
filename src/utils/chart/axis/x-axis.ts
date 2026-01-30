import {utcMillisecond} from 'd3';
import type {CountableTimeInterval, TimeInterval} from 'd3';

import type {ChartScale, ChartScaleTime, PreparedAxis} from '../../../hooks';
import {getMinSpaceBetween} from '../array';
import {TIME_INTERVALS} from '../time';

import {getTicksCount, isBandScale, isTimeScale, thinOut} from './common';

// Average character width as a fraction of font height (approximation for most fonts)
const AVG_CHAR_WIDTH_RATIO = 0.6;

/**
 * Determines the best time interval for datetime axis ticks based on:
 * - The total time range of the data
 * - The available pixel width
 * - The label width requirements (estimated from date format)
 * - Optional pixelInterval from axis configuration
 */
function getBestDatetimeInterval(args: {
    domain: [Date, Date];
    axisWidth: number;
    fontHeight: number;
    padding: number;
    pixelInterval?: number;
}): {interval: CountableTimeInterval; step: number} {
    const {domain, axisWidth, fontHeight, padding, pixelInterval} = args;
    const totalRange = domain[1].getTime() - domain[0].getTime();

    // Find the largest interval that produces at least 2 ticks and fits labels
    for (const {interval, duration, labelCharCount} of TIME_INTERVALS) {
        const estimatedTicks = Math.ceil(totalRange / duration);

        if (estimatedTicks < 2) {
            continue;
        }

        // Calculate label width based on format, use max of pixelInterval and estimated width
        const estimatedLabelWidth =
            labelCharCount * fontHeight * AVG_CHAR_WIDTH_RATIO + padding * 2;
        const minTickSpacing = pixelInterval ?? estimatedLabelWidth;
        const maxTicks = Math.max(2, Math.ceil(axisWidth / minTickSpacing));

        let step = 1;
        if (estimatedTicks > maxTicks) {
            step = Math.ceil(estimatedTicks / maxTicks);
        }

        const ticksWithStep = Math.floor(totalRange / (duration * step));

        if (ticksWithStep >= 2) {
            return {interval, step};
        }
    }

    return {interval: utcMillisecond, step: 1};
}

function getDatetimeAxisTimeInterval(args: {
    scale: ChartScaleTime;
    axis: PreparedAxis;
    axisWidth: number;
    labelLineHeight: number;
}): TimeInterval | null {
    const {scale, axis, axisWidth, labelLineHeight} = args;

    const domain = scale.domain();

    const {interval, step} = getBestDatetimeInterval({
        domain: domain as [Date, Date],
        axisWidth,
        fontHeight: labelLineHeight,
        padding: axis.labels.padding,
        pixelInterval: axis.ticks.pixelInterval,
    });

    // .every(step) creates an interval that skips values (e.g., every 2 years)
    return interval.every(step) ?? interval;
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

        let scaleTicks: Date[] | number[];

        if (isTimeScale(scale)) {
            const scaleTicksCount = getDatetimeAxisTimeInterval({
                scale: scale as ChartScaleTime,
                axis,
                axisWidth,
                labelLineHeight,
            });
            scaleTicks = scaleTicksCount ? scale.ticks(scaleTicksCount) : scale.ticks();
        } else {
            const scaleTicksCount = getTicksCount({axis, range: axisWidth});
            scaleTicks = scale.ticks(scaleTicksCount);
        }

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
