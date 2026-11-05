import {scaleOrdinal} from 'd3-scale';

import {createScales} from '../../hooks/useAxisScales';
import {prepareLineSeries} from '../../plugins/line/prepare-line-series';
import {prepareWaterfallSeries} from '../../plugins/waterfall/prepare-waterfall-series';
import type {PreparedAxis, PreparedYAxis} from '../axes/types';
import type {PreparedLegend, PreparedSeries, PreparedWaterfallSeries} from '../series/types';

import {createYScale} from './y-scale';

interface AxisOptions {
    max?: number;
    padding: PreparedAxis['padding'];
    min?: number;
    order?: PreparedAxis['order'];
    values?: number[];
}

const SERIES = prepareLineSeries({
    series: [
        {
            data: [
                {x: 0, y: 0},
                {x: 1, y: 100},
            ],
            name: 'Series',
            type: 'line',
        },
    ],
    colorScale: scaleOrdinal<string, string>().range(['#000']),
    colors: [],
    legend: {enabled: false} as PreparedLegend,
});

function getAxis(options: AxisOptions): PreparedAxis {
    return {
        endOnTick: true,
        labels: {
            lineHeight: 16,
            padding: 4,
        },
        max: options.max,
        padding: options.padding,
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

test('keeps a percentage-padded secondary axis finite when tick synchronization overflows', () => {
    const axis = {...getAxis({padding: {max: 0}}), padding: {max: '75%'}};
    const series = SERIES.map((item) => ({
        ...item,
        data: item.data.map((point, index) => ({...point, y: index * 1e308})),
    }));
    const scale = createYScale({
        axis,
        primaryAxis: getAxis({padding: {max: 0}}),
        primaryTicksCount: 3,
        boundsHeight: 300,
        series,
    });
    if (!scale || !('invert' in scale)) throw new Error('Missing continuous secondary scale');
    expect(scale.domain().map(Number).every(Number.isFinite)).toBe(true);
    expect(Number.isFinite(scale(1e308))).toBe(true);
});

describe('createYScale with explicit tick values', () => {
    test('keeps a reversed domain identical to automatic ticks', () => {
        const options = {
            max: 100,
            padding: {max: 0},
            min: 0,
            order: 'reverse' as const,
        };

        expect(getDomain({...options, values: [0, 40, 100]})).toEqual(getDomain(options));
    });

    test('keeps start/end alignment and padding identical to automatic ticks', () => {
        const options = {
            padding: {max: '5%'},
            min: 0,
        };

        expect(getDomain({...options, values: [20, 40]})).toEqual(getDomain(options));
    });
});

test('waterfall Y domain includes running totals in the original point order', () => {
    const series = prepareWaterfallSeries({
        series: [
            {
                type: 'waterfall',
                name: 'Balance',
                data: [
                    {x: 0, y: -10},
                    {x: 1, total: true},
                    {x: 2, y: 15},
                    {x: 3, total: true},
                    {x: 4, y: -5},
                    {x: 5, total: true},
                ],
            },
        ],
        colorScale: scaleOrdinal<string, string>().range(['#000']),
        colors: [],
        legend: {enabled: false} as PreparedLegend,
    }) as PreparedWaterfallSeries[];
    const axis = {...getAxis({padding: {max: 0}}), startOnTick: false, endOnTick: false};

    expect(series.map((s) => s.data.map((d) => d.x))).toEqual([[2], [0, 4], [1, 3, 5]]);
    expect(createYScale({axis, boundsHeight: 100, series})?.domain()).toEqual([-10, 5]);
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
            ...getAxis({min: 0, max: 100, padding: {max: 0}, values}),
            plotIndex: 0,
            position: 'left',
        } as PreparedYAxis;
        const secondaryAxis = {
            ...getAxis({min: -10, max: 90, padding: {max: 0}}),
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
