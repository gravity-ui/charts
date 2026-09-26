import type {ChartSeries} from '../../types';
import type {PreparedAxis} from '../axes/types';

import {createYScale} from './y-scale';

interface AxisOptions {
    max?: number;
    maxPadding: number;
    min?: number;
    order?: PreparedAxis['order'];
    values?: number[];
}

const SERIES: ChartSeries[] = [
    {
        data: [
            {x: 0, y: 0},
            {x: 1, y: 100},
        ],
        name: 'Series',
        type: 'line',
    },
];

function getAxis(options: AxisOptions): PreparedAxis {
    return {
        endOnTick: true,
        labels: {
            lineHeight: 16,
            padding: 4,
        },
        max: options.max,
        maxPadding: options.maxPadding,
        min: options.min,
        order: options.order,
        startOnTick: true,
        ticks: {
            pixelInterval: 40,
            values: options.values,
        },
        type: 'linear',
    } as PreparedAxis;
}

function getDomain(options: AxisOptions) {
    return createYScale({
        axis: getAxis(options),
        boundsHeight: 100,
        series: SERIES,
    })?.domain();
}

describe('createYScale with explicit tick values', () => {
    test('keeps a reversed domain identical to automatic ticks', () => {
        const options = {
            max: 100,
            maxPadding: 0,
            min: 0,
            order: 'reverse' as const,
        };

        expect(getDomain({...options, values: [0, 40, 100]})).toEqual(getDomain(options));
    });

    test('keeps start/end alignment and padding identical to automatic ticks', () => {
        const options = {
            maxPadding: 0.05,
            min: 0,
        };

        expect(getDomain({...options, values: [20, 40]})).toEqual(getDomain(options));
    });
});
