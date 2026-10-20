import {bisector} from 'd3-array';
import type {AxisDomain, AxisScale} from 'd3-axis';

import type {AxisLabelLevel, AxisLabelRange} from '../../types';
import type {ChartScale} from '../scales/types';
import {getAxisCategories, isBandScale} from '../utils/axis/common';
import {getFormattedValue} from '../utils/format';

import type {NormalizedAxis, PreparedAxisLabelLevel} from './types';

export function prepareAxisLabelLevels(levels?: AxisLabelLevel[]): PreparedAxisLabelLevel[] {
    return (levels ?? [])
        .filter((level) => level.ranges.length)
        .map((level) => ({
            ranges: level.ranges.map((range) => ({
                ...range,
                text: getFormattedValue({value: range.value, format: level.format}),
            })),
        }));
}

interface CategoryBand {
    index: number;
    start: number;
    end: number;
}

/** Resolve against the final scale, keeping category indexes independent of filtering and zoom. */
export function createLabelRangeProjector(axis: NormalizedAxis, scale: ChartScale, length: number) {
    const axisScale = scale as AxisScale<AxisDomain>;
    const scaleRange = scale.range();
    const lower = Math.max(0, Math.min(...scaleRange));
    const upper = Math.min(Math.max(0, length), Math.max(...scaleRange));
    const clip = (start: number, end: number) => {
        const from = Math.max(lower, Math.min(start, end));
        const to = Math.min(upper, Math.max(start, end));
        return Number.isFinite(from) && Number.isFinite(to) && to > from ? {from, to} : undefined;
    };

    if (isBandScale(scale)) {
        const categories =
            axis.orderedCategories ??
            getAxisCategories({categories: axis.categories, order: axis.order}) ??
            [];
        const indexes = new Map(categories.map((category, index) => [category, index]));
        const bands: CategoryBand[] = scale.domain().flatMap((category) => {
            const index = indexes.get(category);
            const start = scale(category);
            return index === undefined || start === undefined
                ? []
                : [{index, start, end: start + scale.bandwidth()}];
        });
        bands.sort((a, b) => a.index - b.index);
        const search = bisector((band: CategoryBand) => band.index);

        return (range: Pick<AxisLabelRange, 'from' | 'to'>) => {
            const first = search.left(bands, range.from);
            const last = search.right(bands, range.to) - 1;
            if (first > last) {
                return undefined;
            }
            return clip(
                Math.min(bands[first].start, bands[last].start),
                Math.max(bands[first].end, bands[last].end),
            );
        };
    }

    const domain = scale.domain().map(Number);
    const min = Math.min(...domain);
    const max = Math.max(...domain);
    return (range: Pick<AxisLabelRange, 'from' | 'to'>) => {
        const from = Math.max(min, range.from);
        const to = Math.min(max, range.to);
        if (to <= from) {
            return undefined;
        }
        return clip(Number(axisScale(from)), Number(axisScale(to)));
    };
}
