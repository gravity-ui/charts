import type {Selection} from 'd3-selection';

import {SIZE_REGEXP} from '../constants';

import type {parseNumericProperty} from './math';

export function parseLegendWidth(width: unknown): ReturnType<typeof parseNumericProperty> {
    if (typeof width === 'number') {
        return Number.isFinite(width) && width >= 0 ? {value: width, unit: 'px'} : undefined;
    }
    if (typeof width !== 'string') {
        return undefined;
    }

    const match = SIZE_REGEXP.exec(width);
    // `$` can match before a final newline; require the entire input to match.
    if (!match || match[0] !== width) {
        return undefined;
    }

    const value = Number(match[1]);
    const unit = match[2];
    return Number.isFinite(value) && (unit === 'px' || unit === '%') ? {value, unit} : undefined;
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
