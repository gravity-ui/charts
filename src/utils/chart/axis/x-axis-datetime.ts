import type {TimeInterval} from 'd3';

import type {ChartScaleTime, PreparedAxis} from '../../../hooks';
import {TIME_INTERVALS} from '../time';

const MIN_TICKS = 2;

type StepResult = {step: number; tickCount: number} | null;

function findNiceStep(estimatedTicks: number, maxTicks: number, niceSteps: number[]): StepResult {
    for (const step of niceSteps) {
        const tickCount = Math.floor(estimatedTicks / step);
        if (tickCount >= MIN_TICKS && tickCount <= maxTicks) {
            return {step, tickCount};
        }
    }
    return null;
}

function calculateStep(estimatedTicks: number, maxTicks: number): StepResult {
    const minStepForMaxTicks = Math.max(1, Math.ceil(estimatedTicks / maxTicks));
    const maxStepForMinTicks = Math.floor(estimatedTicks / MIN_TICKS);
    if (maxStepForMinTicks < minStepForMaxTicks) {
        return null;
    }
    const step = minStepForMaxTicks;
    const tickCount = Math.floor(estimatedTicks / step);
    return tickCount >= MIN_TICKS && tickCount <= maxTicks ? {step, tickCount} : null;
}

/**
 * Find the best step for tick generation.
 * Uses nice steps if provided, otherwise calculates mathematically.
 */
function findStep(estimatedTicks: number, maxTicks: number, niceSteps?: number[]): StepResult {
    return niceSteps
        ? findNiceStep(estimatedTicks, maxTicks, niceSteps)
        : calculateStep(estimatedTicks, maxTicks);
}

function getMaxTicks(args: {
    axisWidth: number;
    maxLabelWidth: number;
    padding: number;
    pixelInterval?: number;
    dateCount: number;
}) {
    const {axisWidth, maxLabelWidth, padding, pixelInterval, dateCount} = args;
    console.log('getMaxTicks', {axisWidth, maxLabelWidth, padding, pixelInterval});

    const rawTickSpacing = (pixelInterval ?? maxLabelWidth) + padding * 2;
    const minTickSpacing =
        Number.isFinite(rawTickSpacing) && rawTickSpacing > 0 ? rawTickSpacing : 1;

    const maxTicksBySpacing = Math.ceil(axisWidth / minTickSpacing);
    const maxTicksByData =
        dateCount > 0 ? Math.min(maxTicksBySpacing, dateCount) : maxTicksBySpacing;

    return Math.max(MIN_TICKS, maxTicksByData);
}

type DatetimeIntervalArgs = {
    domain: [Date, Date];
    axisWidth: number;
    padding: number;
    pixelInterval?: number;
    maxLabelWidth: number;
    dateCount: number;
};

function getBestDatetimeInterval(args: DatetimeIntervalArgs) {
    const {domain, axisWidth, padding, pixelInterval, maxLabelWidth, dateCount} = args;
    const totalRange = domain[1].getTime() - domain[0].getTime();

    if (!Number.isFinite(totalRange) || totalRange <= 0) {
        return null;
    }

    const maxTicks = getMaxTicks({
        axisWidth,
        padding,
        pixelInterval,
        maxLabelWidth,
        dateCount,
    });

    if (dateCount <= maxTicks) {
        return dateCount;
    }

    for (const {interval, duration, niceSteps} of TIME_INTERVALS) {
        const estimatedTicks = Math.ceil(totalRange / duration);

        if (estimatedTicks < 1) {
            continue;
        }

        const result = findStep(estimatedTicks, maxTicks, niceSteps);

        if (result) {
            return {interval, step: result.step};
        }
    }

    return null;
}

type DatetimeAxisIntervalArgs = {
    scale: ChartScaleTime;
    axis: PreparedAxis;
    axisWidth: number;
    dateCount: number;
};

export function getDatetimeAxisTimeInterval(
    args: DatetimeAxisIntervalArgs,
): TimeInterval | number | null {
    const {scale, axis, axisWidth, dateCount} = args;
    const domain = scale.domain() as [Date, Date];

    const result = getBestDatetimeInterval({
        domain,
        axisWidth,
        padding: axis.labels.padding,
        pixelInterval: axis.ticks.pixelInterval,
        maxLabelWidth: axis.labels.maxWidth,
        dateCount,
    });

    if (!result) {
        return null;
    }

    if (typeof result === 'number') {
        return result;
    }

    const {interval, step} = result;
    return step > 1 ? interval.every(step) : interval;
}
