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

export function getAxisCategories({
    categories,
    order,
}: {categories?: string[]; order?: ChartAxis['order']} = {}) {
    if (categories) {
        switch (order) {
            case 'reverse': {
                return reverse(categories);
            }
            case 'sortAsc': {
                return sort(categories, (a, b) => ascending(a, b));
            }
            case 'sortDesc': {
                return sort(categories, (a, b) => descending(a, b));
            }
        }
    }

    return categories;
}
