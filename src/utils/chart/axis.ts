import type {AxisDomain, AxisScale, ScaleBand} from 'd3';

import type {PreparedAxis, PreparedSplit} from '../../hooks';

import type {TextRow} from './text';
import {wrapText} from './text';

export function getTicksCount({axis, range}: {axis: PreparedAxis; range: number}) {
    let ticksCount: number | undefined;

    if (axis.ticks.pixelInterval) {
        ticksCount = Math.ceil(range / axis.ticks.pixelInterval);
    }

    return ticksCount;
}

export function isBandScale(scale: AxisScale<AxisDomain>): scale is ScaleBand<AxisDomain> {
    return 'bandwidth' in scale && typeof scale.bandwidth === 'function';
}

export function getScaleTicks(scale: AxisScale<AxisDomain>, ticksCount?: number) {
    return 'ticks' in scale && typeof scale.ticks === 'function'
        ? scale.ticks(ticksCount)
        : scale.domain();
}

export function getXAxisOffset() {
    return typeof window !== 'undefined' && window.devicePixelRatio > 1 ? 0 : 0.5;
}

function number(scale: AxisScale<AxisDomain>) {
    return (d: AxisDomain) => Number(scale(d));
}

function center(scale: ScaleBand<AxisDomain>, offset: number) {
    offset = Math.max(0, scale.bandwidth() - offset * 2) / 2;
    if (scale.round()) {
        offset = Math.round(offset);
    }
    return (d: AxisDomain) => Number(scale(d)) + offset;
}

export function getXTickPosition({scale, offset}: {scale: AxisScale<AxisDomain>; offset: number}) {
    return isBandScale(scale) ? center(scale.copy(), offset) : number(scale.copy());
}

export function getXAxisItems({
    scale,
    count,
    maxCount,
}: {
    scale: AxisScale<AxisDomain>;
    count?: number;
    maxCount?: number;
}) {
    let values = getScaleTicks(scale, count);

    if (maxCount && values.length > maxCount) {
        const step = Math.ceil(values.length / maxCount);
        values = values.filter((_: AxisDomain, i: number) => i % step === 0);
    }

    return values;
}

export function getMaxTickCount({axis, width}: {axis: PreparedAxis; width: number}) {
    const minTickWidth = parseInt(axis.labels.style.fontSize) + axis.labels.padding;
    return Math.floor(width / minTickWidth);
}

export function getAxisHeight(args: {split: PreparedSplit; boundsHeight: number}) {
    const {split, boundsHeight} = args;

    if (split.plots.length > 1) {
        return split.plots[0].height;
    }

    return boundsHeight;
}

export function getAxisTitleRows(args: {axis: PreparedAxis; textMaxWidth: number}) {
    const {axis, textMaxWidth} = args;
    if (axis.title.maxRowCount < 1) {
        return [];
    }

    const textRows = wrapText({
        text: axis.title.text,
        style: axis.title.style,
        width: textMaxWidth,
    });

    return textRows.reduce<TextRow[]>((acc, row, index) => {
        if (index < axis.title.maxRowCount) {
            acc.push(row);
        } else {
            acc[axis.title.maxRowCount - 1].text += row.text;
        }
        return acc;
    }, []);
}
