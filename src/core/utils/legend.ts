import type {Selection} from 'd3-selection';

import {PERCENTAGE_SIZE_REGEXP, PIXEL_SIZE_REGEXP} from '../constants/dimensions';

import {parseNumericProperty} from './math';

/** Validates legend widths before using the shared numeric-property parser. */
export function parseLegendWidth(width: unknown): ReturnType<typeof parseNumericProperty> {
    if (typeof width !== 'number' && typeof width !== 'string') {
        return undefined;
    }

    if (
        typeof width === 'string' &&
        !PERCENTAGE_SIZE_REGEXP.test(width) &&
        !PIXEL_SIZE_REGEXP.test(width)
    ) {
        return undefined;
    }

    const parsed = parseNumericProperty(width);
    return parsed && Number.isFinite(parsed.value) && parsed.value >= 0 ? parsed : undefined;
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
