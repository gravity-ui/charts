import type {Selection} from 'd3-selection';

import {PERCENTAGE_SIZE_REGEXP, PIXEL_SIZE_REGEXP} from '../constants/dimensions';

interface ParsedLegendWidth {
    value: number;
    isPercentage: boolean;
}

export function parseLegendWidth(width: unknown): ParsedLegendWidth | undefined {
    if (typeof width === 'number') {
        return Number.isFinite(width) && width >= 0
            ? {value: width, isPercentage: false}
            : undefined;
    }

    if (typeof width !== 'string') {
        return undefined;
    }

    // Match the pixel/percentage units used by calculateNumericProperty, while preserving
    // legend validation: only finite, nonnegative decimal strings are accepted.
    const isPercentage = PERCENTAGE_SIZE_REGEXP.test(width);
    if (!isPercentage && !PIXEL_SIZE_REGEXP.test(width)) {
        return undefined;
    }

    const value = Number(width.slice(0, isPercentage ? -1 : -2));
    return Number.isFinite(value) ? {value, isPercentage} : undefined;
}

export function createGradientRect(
    container: Selection<SVGGElement, unknown, null, undefined>,
    args: {
        x?: number;
        y?: number;
        width: number;
        height: number;
        interpolator: (value: number) => string;
    },
) {
    const {x = 0, y = 0, width, height, interpolator} = args;

    const n = 256;
    const canvas = document.createElement('canvas');
    canvas.width = n;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) {
        throw Error("Couldn't get canvas context");
    }

    for (let i = 0, j = n - 1; i < n; ++i) {
        context.fillStyle = interpolator(i / j);
        context.fillRect(i, 0, 1, height);
    }

    return container
        .append('image')
        .attr('preserveAspectRatio', 'none')
        .attr('height', height)
        .attr('width', width)
        .attr('x', x)
        .attr('y', y)
        .attr('xlink:href', canvas.toDataURL());
}
