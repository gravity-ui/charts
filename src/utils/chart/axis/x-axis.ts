import type {
    ChartScale,
    ChartScaleLinear,
    ChartScaleTime,
    PreparedAxis,
    PreparedSeries,
} from '../../../hooks';
import {getMinSpaceBetween} from '../array';
import {isSeriesWithNumericalXValues} from '../series-type-guards';

import {getTicksCountByPixelInterval, isBandScale, thinOut} from './common';

const DEFAULT_TICKS_COUNT = 10;
const MAX_RECENTER_ATTEMPTS = 5;

type TickValue = {x: number; value: number | string | Date};

/**
 * When D3's scale.ticks() returns only one tick, it may be positioned far from center.
 * This function attempts to get more ticks by incrementally increasing the requested count,
 * then picks the tick closest to the axis center.
 */
function recenterSingleTick(args: {
    originalTick: TickValue;
    scale: ChartScaleLinear | ChartScaleTime;
    scaleTicksCount: number;
    axisWidth: number;
}): TickValue[] {
    const {originalTick, scale, scaleTicksCount, axisWidth} = args;
    const center = axisWidth / 2;
    const originalDistance = Math.abs(originalTick.x - center);

    // Already close enough to center — no need to search
    if (originalDistance <= axisWidth * 0.1) {
        return [originalTick];
    }

    let closestTick = originalTick;
    let closestDistance = originalDistance;

    for (let i = 1; i <= MAX_RECENTER_ATTEMPTS; i++) {
        const ticks = scale.ticks(scaleTicksCount + i);

        if (ticks.length <= 2) {
            continue;
        }

        for (const t of ticks) {
            const x = Number(scale(t));
            const distance = Math.abs(x - center);

            if (distance < closestDistance) {
                closestTick = {x, value: t};
                closestDistance = distance;
            }
        }

        break;
    }

    return [closestTick];
}

function getTicksCount(args: {axis: PreparedAxis; axisWidth: number; series?: PreparedSeries[]}) {
    const {axis, axisWidth, series} = args;
    const result = getTicksCountByPixelInterval({axis, axisWidth});

    if (typeof result === 'number') {
        return result;
    }

    if (series) {
        const xDataSet = new Set<number | string>();
        series?.forEach((item) => {
            if (isSeriesWithNumericalXValues(item)) {
                item.data.forEach((data) => {
                    xDataSet.add(data.x);
                });
            }
        });

        return xDataSet.size < DEFAULT_TICKS_COUNT ? xDataSet.size : DEFAULT_TICKS_COUNT;
    }

    return DEFAULT_TICKS_COUNT;
}

export function getXAxisTickValues({
    axis,
    labelLineHeight,
    scale,
    series,
}: {
    axis: PreparedAxis;
    labelLineHeight: number;
    scale: ChartScale;
    series?: PreparedSeries[];
}): TickValue[] {
    if ('ticks' in scale && typeof scale.ticks === 'function') {
        const range = scale.range();
        const axisWidth = Math.abs(range[0] - range[1]);
        if (!axisWidth) {
            return [];
        }

        const scaleTicksCount = getTicksCount({axis, axisWidth, series});
        const scaleTicks = scale.ticks(scaleTicksCount);

        const originalTickValues = scaleTicks.map((t) => ({
            x: scale(t),
            value: t,
        }));

        if (originalTickValues.length <= 1) {
            if (originalTickValues.length === 1) {
                return recenterSingleTick({
                    originalTick: originalTickValues[0],
                    scale,
                    scaleTicksCount,
                    axisWidth,
                });
            }

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
