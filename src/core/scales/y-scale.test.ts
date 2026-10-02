import {createScales} from '../../hooks/useAxisScales';
import type {ChartSeries} from '../../types';
import type {PreparedAxis, PreparedYAxis} from '../axes/types';
import type {PreparedSeries} from '../series/types';

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

describe('createScales with a synchronized secondary Y axis', () => {
    const series = [
        {...SERIES[0], visible: true, yAxis: 0},
        {
            data: [
                {x: 0, y: 0},
                {x: 1, y: 73},
            ],
            name: 'Second series',
            type: 'line',
            visible: true,
            yAxis: 1,
        },
    ] as PreparedSeries[];

    function getDomains(values?: number[]) {
        const primaryAxis = {
            ...getAxis({min: 0, max: 100, maxPadding: 0, values}),
            plotIndex: 0,
            position: 'left',
        } as PreparedYAxis;
        const secondaryAxis = {
            ...getAxis({min: -10, max: 90, maxPadding: 0}),
            plotIndex: 0,
            position: 'right',
        } as PreparedYAxis;
        const {yScale} = createScales({
            boundsWidth: 600,
            boundsHeight: 350,
            series,
            xAxis: null,
            yAxis: [primaryAxis, secondaryAxis],
            split: {plots: [], gap: 0},
        });

        return yScale.map((scale) => scale?.domain());
    }

    test.each([{values: []}, {values: [0, 40, 100]}])(
        'explicit primary ticks $values preserve both axis domains',
        ({values}) => {
            const automaticDomains = getDomains();
            expect(automaticDomains).toHaveLength(2);
            expect(automaticDomains.every(Boolean)).toBe(true);
            expect(getDomains(values)).toEqual(automaticDomains);
        },
    );
});
