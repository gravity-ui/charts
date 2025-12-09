import {ascending, descending, reverse, sort} from 'd3';
import type {AxisDomain, AxisScale, ScaleBand, ScaleTime} from 'd3';
import clamp from 'lodash/clamp';

import type {ChartScale, PreparedAxis, PreparedAxisPlotBand, PreparedSplit} from '../../hooks';
import type {ChartAxis} from '../../types';

import type {AxisDirection} from './types';

type Ticks = number[] | string[] | Date[];

export function getTicksCount({axis, range}: {axis: PreparedAxis; range: number}) {
    let ticksCount: number | undefined;

    if (axis.ticks.pixelInterval) {
        ticksCount = Math.ceil(range / axis.ticks.pixelInterval);
    }

    return ticksCount;
}

export function isBandScale(
    scale?: ChartScale | AxisScale<AxisDomain>,
): scale is ScaleBand<string> {
    return Boolean(scale && 'bandwidth' in scale && typeof scale.bandwidth === 'function');
}

export function isTimeScale(
    scale?: ChartScale | AxisScale<AxisDomain>,
): scale is ScaleTime<number, number> {
    if (!scale) {
        return false;
    }

    return scale.domain()[0] instanceof Date;
}

export function getScaleTicks(
    scale: ChartScale | AxisScale<AxisDomain>,
    ticksCount?: number,
): Ticks {
    if ('ticks' in scale && typeof scale.ticks === 'function') {
        return scale.ticks(ticksCount);
    }

    if (isBandScale(scale)) {
        return scale.domain();
    }

    return [];
}

export function getXAxisOffset() {
    return typeof window !== 'undefined' && window.devicePixelRatio > 1 ? 0 : 0.5;
}

function number(scale: AxisScale<AxisDomain>) {
    return (d: unknown) => Number(scale(d as number));
}

function center(scale: ScaleBand<string>, offset: number) {
    offset = Math.max(0, scale.bandwidth() - offset * 2) / 2;
    if (scale.round()) {
        offset = Math.round(offset);
    }
    return (d: unknown) => Number(scale(String(d))) + offset;
}

export function getXTickPosition({scale, offset}: {scale: AxisScale<AxisDomain>; offset: number}) {
    return isBandScale(scale) ? center(scale, offset) : number(scale);
}

export function getAxisItems({
    scale,
    count,
    maxCount,
}: {
    scale: ChartScale | AxisScale<AxisDomain>;
    count?: number;
    maxCount?: number;
}) {
    let values = getScaleTicks(scale, count);

    if (maxCount && values.length > maxCount) {
        const step = Math.ceil(values.length / maxCount);
        values = values.filter((_, i: number) => i % step === 0) as Ticks;
    }

    return values;
}

export function getAxisHeight(args: {split: PreparedSplit; boundsHeight: number}) {
    const {split, boundsHeight} = args;

    if (split.plots.length > 1) {
        return split.plots[0].height;
    }

    return boundsHeight;
}

interface GetBandsPositionArgs {
    band: PreparedAxisPlotBand;
    axisScale: AxisScale<AxisDomain>;
    axis: AxisDirection;
}

export const getAxisPlotsPosition = (axis: PreparedAxis, split: PreparedSplit, width = 0) => {
    const top = split.plots[axis.plotIndex]?.top || 0;
    if (axis.position === 'left') {
        return [0, top];
    }

    return [width, top];
};

export function getBandsPosition(args: GetBandsPositionArgs): {from: number; to: number} {
    const {band, axisScale} = args;
    const scalePosTo = axisScale(band.to);
    const scalePosFrom = axisScale(band.from);
    const isX = args.axis === 'x';

    if (scalePosTo !== undefined && scalePosFrom !== undefined) {
        return {
            from: Math.max(scalePosFrom, 0),
            to: Math.max(scalePosTo, 0),
        };
    }

    if (typeof band.from !== 'number' || typeof band.to !== 'number') {
        throw new Error('Filed to create plot band');
    }

    const category = axisScale.domain();
    const bandwidth = axisScale.bandwidth?.() ?? 1;
    const halfBandwidth = bandwidth / 2;

    const calcPosition = (value: number) => {
        if (value >= category.length) {
            return (axisScale(category[category.length - 1]) ?? 0) + halfBandwidth * (isX ? 1 : -1);
        }
        return (
            (axisScale(category[clamp(Math.floor(value), 0, category.length - 1)]) ?? 0) +
            bandwidth * (value - Math.floor(Math.abs(value))) * (isX ? 1 : -1)
        );
    };

    const to = calcPosition(band.to);
    const from = calcPosition(band.from);
    const maxPos = (axisScale(category[isX ? category.length - 1 : 0]) ?? 0) + halfBandwidth;

    return {
        from: clamp(from, -halfBandwidth, maxPos),
        to: clamp(to, -halfBandwidth, maxPos),
    };
}

export function getClosestPointsRange(axis: PreparedAxis, points: AxisDomain[]) {
    if (axis.type === 'category') {
        return undefined;
    }

    return Math.abs((points[1] as number) - (points[0] as number));
}

function getNormalizedIndexMinMax(args: {max?: number; min?: number}) {
    const {max, min} = args;

    if (typeof min === 'number' && typeof max === 'number') {
        return min > max ? [max, min] : [min, max];
    }

    return [min, max];
}

function getNormalizedStartEnd(args: {
    length: number;
    max?: number;
    min?: number;
}): [number, number] {
    const {length, max, min} = args;
    const [normalizedMin, normalizedMax] = getNormalizedIndexMinMax({max, min});
    const start = typeof normalizedMin === 'number' && normalizedMin >= 0 ? normalizedMin : 0;
    const end =
        typeof normalizedMax === 'number' && normalizedMax <= length ? normalizedMax + 1 : length;

    return [start, end];
}

export function getAxisCategories({
    categories: originalCategories,
    max,
    min,
    order,
}: Partial<ChartAxis> = {}) {
    if (originalCategories) {
        let categories = originalCategories;

        switch (order) {
            case 'reverse': {
                categories = reverse(originalCategories);
                break;
            }
            case 'sortAsc': {
                categories = sort(originalCategories, (a, b) => ascending(a, b));
                break;
            }
            case 'sortDesc': {
                categories = sort(originalCategories, (a, b) => descending(a, b));
                break;
            }
        }

        if (typeof min === 'number' || typeof max === 'number') {
            const [start, end] = getNormalizedStartEnd({length: categories.length, max, min});
            categories = categories.slice(start, end);
        }

        return categories;
    }

    return originalCategories;
}
