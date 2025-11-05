import {ascending, descending, reverse, sort} from 'd3';

import {DEFAULT_AXIS_LABEL_FONT_SIZE} from '../../constants';
import type {AxisPlot, ChartAxis} from '../../types';

export function prepareAxisPlotLabel(d: AxisPlot) {
    return {
        text: d.label?.text ?? '',
        style: {
            fontSize: DEFAULT_AXIS_LABEL_FONT_SIZE,
            fontColor: 'var(--g-color-text-secondary)',
            ...d.label?.style,
        },
        padding: d.label?.padding ?? 5,
    };
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
