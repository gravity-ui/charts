/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleOrdinal} from 'd3-scale';

import {getTickValues} from '../../../components/AxisY/utils';
import type {PreparedAxis, PreparedXAxis, PreparedYAxis} from '../../../core/axes/types';
import {getSeriesPlugin} from '../../../core/series/seriesRegistry';
import type {PreparedLegend} from '../../../core/series/types';
import type {ChartSeries} from '../../../core/types';
import {getXAxisTickValues} from '../../../core/utils/axis/x-axis';
import {createScales} from '../../../hooks/useAxisScales';

interface Scenario {
    name: string;
    direction?: 'x' | 'y';
    axis?: Partial<PreparedAxis>;
    values?: number[];
    type?: 'line' | 'bar-x' | 'bar-y';
    size?: number;
    zoom?: [number, number];
    split?: boolean;
    labelPadding?: number;
    replacement?: Partial<PreparedAxis>;
}

async function compare(scenario: Scenario) {
    const {direction = 'y', values = [0, 100], type = 'line', size = 300} = scenario;
    const raw: ChartSeries = {
        type,
        name: 'Revenue',
        data: values.map((value) => ({x: value, y: value})),
        dataLabels:
            scenario.labelPadding === undefined
                ? undefined
                : {enabled: true, padding: scenario.labelPadding},
    };
    const series = await getSeriesPlugin(type).prepareSeries({
        series: [raw],
        colors: [],
        colorScale: scaleOrdinal<string, string>().range(['black']),
        legend: {enabled: false} as PreparedLegend,
    });
    const original = {
        type: 'linear',
        maxPadding: 0.25,
        startOnTick: false,
        endOnTick: false,
        ticks: {},
        labels: {lineHeight: 12, padding: 4},
        ...scenario.axis,
    } as PreparedAxis;
    const converted = {
        ...original,
        maxPadding: 0,
        padding: {max: `${100 * original.maxPadding}%`},
        ...scenario.replacement,
    };
    const run = (axis: PreparedAxis) => {
        const other = {...original, type: 'linear', maxPadding: 0, padding: undefined};
        const xAxis = {...(direction === 'x' ? axis : other)} as PreparedXAxis;
        const yAxis = {...(direction === 'y' ? axis : other), plotIndex: 0} as PreparedYAxis;
        const scales = createScales({
            series,
            xAxis,
            yAxis: [yAxis],
            boundsWidth: size,
            boundsHeight: size,
            split: {
                plots: scenario.split
                    ? [0, 1].map((index) => ({
                          top: (index * size) / 2,
                          height: size / 2,
                          title: {text: '', x: 0, y: 0, height: 0},
                      }))
                    : [],
                gap: 0,
            },
            zoomState: direction === 'x' ? {x: scenario.zoom} : {y: [scenario.zoom]},
        });
        const scale = direction === 'x' ? scales.xScale : scales.yScale[0];
        if (!scale) throw new Error('Missing scale');
        return {
            domain: scale.domain().map(Number),
            range: scale.range(),
            ticks:
                direction === 'y'
                    ? getTickValues({axis, scale, series, labelLineHeight: 12}).map((t) =>
                          Number(t.value),
                      )
                    : getXAxisTickValues({axis, scale, series, labelLineHeight: 12}).map((t) =>
                          Number(t.value),
                      ),
            positions: values.map((value) => (scale as (value: number) => number)(value)),
        };
    };
    return {
        name: scenario.name,
        original: run(original),
        converted: run(converted as PreparedAxis),
    };
}

// Linear and datetime replacements preserve limits, ticks and point positions.
const scenarios: Scenario[] = [
    {name: 'linear Y'},
    {name: 'linear X', direction: 'x'},
    {name: 'reversed Y', axis: {order: 'reverse'}},
    {name: 'reversed X', direction: 'x', axis: {order: 'reverse'}},
    {name: 'zero fraction', axis: {maxPadding: 0}},
    {name: 'default fraction', axis: {maxPadding: 0.05}},
    {name: 'large fraction', axis: {maxPadding: 2}},
    {name: 'negative data', values: [-100, -10]},
    {name: 'explicit maximum', axis: {max: 120}},
    {
        name: 'rounded X',
        direction: 'x',
        axis: {startOnTick: true, endOnTick: true},
        values: [3, 97],
    },
    {name: 'rounded Y', axis: {startOnTick: true, endOnTick: true}, values: [3, 97]},
    {
        name: 'rounded short Y',
        size: 80,
        axis: {startOnTick: true, endOnTick: true},
        values: [3, 97],
    },
    {
        name: 'datetime X',
        direction: 'x',
        axis: {type: 'datetime'},
        values: [1704067200000, 1704153600000],
    },
    {name: 'datetime Y', axis: {type: 'datetime'}, values: [1704067200000, 1704153600000]},
    {
        name: 'explicit datetime Y timestamps',
        axis: {type: 'datetime', timestamps: [1704067200000, 1704153600000]},
        values: [1704067200000, 1704153600000],
    },
    {name: 'millisecond domain', axis: {type: 'datetime'}, values: [1704067200000, 1704067200001]},
    {name: 'Bar-X band offsets', direction: 'x', type: 'bar-x'},
    {name: 'Bar-Y band offsets', type: 'bar-y'},
    {name: 'Bar-Y labels at 300px', direction: 'x', type: 'bar-y', labelPadding: 30},
    {name: 'Bar-Y labels at 600px', direction: 'x', type: 'bar-y', labelPadding: 30, size: 600},
    {name: 'zoom X', direction: 'x', zoom: [20, 80]},
    {name: 'zoom Y', zoom: [20, 80]},
    {name: 'split plot', split: true},
    {name: 'zero size', size: 0},
    {name: 'one pixel', size: 1},
    {name: 'negative computed size', size: -1},
    {name: 'single point', values: [10]},
];

test.each(scenarios)('percentage maximum preserves maxPadding: $name', async (scenario) => {
    const {original, converted} = await compare(scenario);
    expect(converted.range).toEqual(original.range);
    expect(converted.ticks).toEqual(original.ticks);
    for (const field of ['domain', 'positions'] as const) {
        expect(converted[field]).toHaveLength(original[field].length);
        original[field].forEach((value, index) =>
            expect(converted[field][index]).toBeCloseTo(value, 8),
        );
    }
});

test('percentage maximum retains the legacy upper bound for the motivating example', async () => {
    expect((await compare({name: '0 to 100'})).converted.domain).toEqual([0, 125]);
});

test.each([{values: [0.53]}, {values: [0.53, 0.53]}])(
    'constant fractional Y values $values stay centered with proportional padding',
    async ({values}) => {
        const {original, converted} = await compare({
            name: 'constant fractional Y',
            values,
            axis: {maxPadding: 0.05},
            replacement: {padding: {min: '10%', max: '5%'}},
        });
        for (const result of [original, converted]) {
            expect(result.domain).toEqual([0.53, 0.53]);
            expect(result.positions).toEqual(values.map(() => 150));
            expect(result.ticks).toEqual([0.53]);
        }
    },
);

test.each(['x', 'y'] as const)(
    'both percentage ends use the same original %s scale',
    async (direction) => {
        for (const order of [undefined, 'reverse'] as const) {
            const result = await compare({
                name: 'both ends',
                direction,
                axis: {order},
                replacement: {padding: {min: '10%', max: '25%'}},
            });
            expect(result.converted.domain).toEqual([-10, 125]);
        }
    },
);

test('explicit datetime Y timestamps retain the existing padding exclusion', async () => {
    const min = 1704067200000;
    const max = min + 86400000;
    const result = await compare({
        name: 'timestamp ends',
        axis: {type: 'datetime', timestamps: [min, max]},
        values: [min, max],
        replacement: {padding: {min: '10%', max: '25%'}},
    });
    expect(result.converted.domain).toEqual([min, max]);
    expect(result.original.domain).toEqual([min, max]);
});

test.each(['x', 'y'] as const)(
    'logarithmic %s percentages expand the original log span while maxPadding stays unchanged',
    async (direction) => {
        for (const order of [undefined, 'reverse'] as const) {
            const result = await compare({
                name: 'logarithmic maximum',
                direction,
                values: [1, 100],
                axis: {type: 'logarithmic', order},
            });
            const startsAtZero = (direction === 'x') !== (order === 'reverse');
            const offset = startsAtZero ? Math.pow(100, 0.25) - 1 : 100 - Math.pow(100, 0.75);
            expect(result.original.domain[1]).toBeCloseTo(100 + offset, 8);
            expect(result.converted.domain[0]).toBe(1);
            expect(result.converted.domain[1]).toBeCloseTo(Math.pow(100, 1.25), 8);
        }
    },
);

test.each(['x', 'y'] as const)(
    'logarithmic %s percentage minima and maxima are symmetric before rounding',
    async (direction) => {
        for (const order of [undefined, 'reverse'] as const) {
            const result = await compare({
                name: 'log both ends',
                direction,
                values: [1, 100],
                axis: {type: 'logarithmic', order},
                replacement: {padding: {min: '25%', max: '25%'}},
            });
            expect(result.converted.domain[0]).toBeCloseTo(Math.pow(100, -0.25), 8);
            expect(result.converted.domain[1]).toBeCloseTo(Math.pow(100, 1.25), 8);
            expect(result.converted.positions.every(Number.isFinite)).toBe(true);
            const size = Math.abs(result.converted.range[1] - result.converted.range[0]);
            const [first, last] = result.converted.positions;
            expect(Math.min(first, last) / size).toBeCloseTo(1 / 6, 8);
            expect(Math.max(first, last) / size).toBeCloseTo(5 / 6, 8);
        }
    },
);

test.each(['x', 'y'] as const)(
    'explicit limits override logarithmic %s percentages',
    async (direction) => {
        const result = await compare({
            name: 'fixed log limits',
            direction,
            values: [1, 100],
            axis: {type: 'logarithmic', min: 1, max: 100},
            replacement: {padding: {min: '25%', max: '25%'}},
        });
        expect(result.converted.domain).toEqual([1, 100]);
    },
);

test('an omitted percentage maximum retains the existing maxPadding fallback', async () => {
    const result = await compare({
        name: 'log fallback',
        values: [1, 100],
        axis: {type: 'logarithmic'},
        replacement: {maxPadding: 0.25, padding: {min: '25%'}},
    });
    expect(result.converted.domain[0]).toBeCloseTo(Math.pow(100, -0.25), 8);
    expect(result.converted.domain[1]).toEqual(result.original.domain[1]);
});

test.each([0, '0%', 'auto'] as const)('explicit maximum %j overrides maxPadding', async (max) => {
    const result = await compare({
        name: 'log explicit max',
        values: [1, 100],
        axis: {type: 'logarithmic'},
        replacement: {maxPadding: 0.25, padding: {max}},
    });
    expect(result.converted.domain[1]).toBeLessThan(result.original.domain[1]);
    if (max !== 'auto') expect(result.converted.domain).toEqual([1, 100]);
});

test.each([0, 1, -1, 300])(
    'logarithmic percentage padding remains usable at size %s',
    async (size) => {
        const result = await compare({
            name: 'log boundary',
            size,
            values: [1, 100],
            axis: {type: 'logarithmic'},
            replacement: {padding: {min: '100000000%', max: '100000000%'}},
        });
        expect(result.converted.domain.every((value) => Number.isFinite(value) && value > 0)).toBe(
            true,
        );
        expect(result.converted.positions.every(Number.isFinite)).toBe(true);
    },
);

test.each(['x', 'y'] as const)(
    'logarithmic %s percentage padding stays representable after rounding both ends',
    async (direction) => {
        const {converted} = await compare({
            name: 'rounded log limits',
            direction,
            values: [1e-250, 1e250],
            axis: {type: 'logarithmic', startOnTick: true, endOnTick: true},
            replacement: {padding: {min: '25%', max: '25%'}},
        });
        expect(converted.domain.every((value) => Number.isFinite(value) && value > 0)).toBe(true);
        expect(converted.positions.every(Number.isFinite)).toBe(true);
        expect(converted.ticks.length).toBeGreaterThan(0);
    },
);

test.each(['min', 'max'] as const)(
    'linear percentage padding stays representable after rounding the %s boundary',
    async (side) => {
        const values = side === 'min' ? [-1e308, 0] : [0, 1e308];
        const {converted} = await compare({
            name: 'rounded linear limit',
            values,
            axis: {startOnTick: true, endOnTick: true},
            replacement: {padding: {[side]: '75%'}},
        });
        expect(converted.domain.every(Number.isFinite)).toBe(true);
        expect(converted.positions.every(Number.isFinite)).toBe(true);
        expect(converted.ticks.length).toBeGreaterThan(0);
    },
);

test.each([
    {direction: 'x', type: 'linear'},
    {direction: 'y', type: 'linear'},
    {direction: 'x', type: 'datetime'},
    {direction: 'y', type: 'datetime'},
] as const)(
    'oversized percentages keep the $type $direction scale usable',
    async ({direction, type}) => {
        const values = type === 'datetime' ? [1704067200000, 1704153600000] : [0, 100];
        const max = type === 'datetime' ? '100000000000%' : `1${'0'.repeat(308)}%`;
        const {converted} = await compare({
            name: 'oversized percentages',
            direction,
            values,
            axis: {type},
            replacement: {padding: {min: max, max}},
        });
        expect(converted.domain.every(Number.isFinite)).toBe(true);
        expect(converted.positions.every(Number.isFinite)).toBe(true);
        expect(converted.domain[0]).toBeLessThanOrEqual(values[0]);
        expect(converted.domain[1]).toBeGreaterThanOrEqual(values[1]);
        expect(converted.positions[0]).not.toBe(converted.positions[1]);
    },
);
