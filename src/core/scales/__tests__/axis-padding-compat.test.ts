/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleOrdinal} from 'd3-scale';

import {getTickValues} from '../../../components/AxisY/utils';
import type {PreparedAxis, PreparedXAxis, PreparedYAxis} from '../../../core/axes/types';
import {getSeriesPlugin} from '../../../core/series/seriesRegistry';
import type {PreparedLegend} from '../../../core/series/types';
import type {ChartAxisPadding, ChartSeries} from '../../../core/types';
import {getXAxisTickValues} from '../../../core/utils/axis/x-axis';
import {createScales} from '../../../hooks/useAxisScales';

interface Scenario {
    direction?: 'x' | 'y';
    axis?: Partial<PreparedAxis>;
    values?: number[];
    size?: number;
    zoom?: [number, number];
    padding?: ChartAxisPadding;
}

async function getGeometry(scenario: Scenario) {
    const {direction = 'y', values = [0, 100], size = 300} = scenario;
    const raw: ChartSeries = {
        type: 'line',
        name: 'Revenue',
        data: values.map((value) => ({x: value, y: value})),
    };
    const series = await getSeriesPlugin('line').prepareSeries({
        series: [raw],
        colors: [],
        colorScale: scaleOrdinal<string, string>().range(['black']),
        legend: {enabled: false} as PreparedLegend,
    });
    const axis = {
        type: 'linear',
        startOnTick: false,
        endOnTick: false,
        ticks: {},
        labels: {lineHeight: 12, padding: 4},
        ...scenario.axis,
        padding: scenario.padding ?? {max: '25%'},
    } as PreparedAxis;
    const other = {...axis, type: 'linear', padding: undefined};
    const xAxis = {...(direction === 'x' ? axis : other)} as PreparedXAxis;
    const yAxis = {...(direction === 'y' ? axis : other), plotIndex: 0} as PreparedYAxis;
    const scales = createScales({
        series,
        xAxis,
        yAxis: [yAxis],
        boundsWidth: size,
        boundsHeight: size,
        split: {plots: [], gap: 0},
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
}

test('percentage maximum extends the original domain', async () => {
    expect((await getGeometry({})).domain).toEqual([0, 125]);
});

test.each([
    {direction: 'y', values: [0.53], rounded: false, fraction: 0.05},
    {direction: 'y', values: [0.53, 0.53], rounded: false, fraction: 0.05},
    {direction: 'x', values: [0.53], rounded: false, fraction: 0.05},
    {direction: 'x', values: [0.53, 0.53], rounded: true, fraction: 0.05},
    {direction: 'x', values: [1.1], rounded: false, fraction: 0.01},
] as const)(
    'constant fractional $direction values $values stay centered (rounded: $rounded)',
    async ({direction, values, rounded, fraction}) => {
        const converted = await getGeometry({
            direction,
            values: [...values],
            axis: {startOnTick: rounded, endOnTick: rounded},
            padding: {min: '10%', max: `${fraction * 100}%`},
        });
        expect(converted.domain).toEqual([values[0], values[0]]);
        expect(converted.positions).toEqual(values.map(() => 150));
        expect(converted.ticks).toEqual([values[0]]);
    },
);

test.each(['x', 'y'] as const)(
    'both percentage ends use the same original %s scale',
    async (direction) => {
        for (const order of [undefined, 'reverse'] as const) {
            const result = await getGeometry({
                direction,
                axis: {order},
                padding: {min: '10%', max: '25%'},
            });
            expect(result.domain).toEqual([-10, 125]);
        }
    },
);

test.each(['x', 'y'] as const)(
    'percentage padding keeps zoomed %s boundaries fixed',
    async (direction) => {
        const converted = await getGeometry({
            direction,
            zoom: [20, 80],
            padding: {min: '10%', max: '25%'},
        });
        expect(converted.domain).toEqual([20, 80]);
    },
);

test.each([
    {direction: 'x', timestamps: undefined},
    {direction: 'y', timestamps: undefined},
    {direction: 'y', timestamps: [0, 100]},
] as const)(
    'datetime $direction padding preserves zoom with timestamps: $timestamps',
    async ({direction, timestamps}) => {
        const converted = await getGeometry({
            direction,
            zoom: [20, 80],
            axis: {type: 'datetime', timestamps: timestamps ? [...timestamps] : undefined},
            padding: {min: '10%', max: '25%'},
        });
        expect(converted.domain).toEqual([20, 80]);
    },
);

test.each([false, true])(
    'explicit datetime Y timestamps apply percentages before rounding (%s)',
    async (rounded) => {
        const min = 1704067200000;
        const max = min + 86400000;
        const result = await getGeometry({
            axis: {
                type: 'datetime',
                timestamps: [min, max],
                startOnTick: rounded,
                endOnTick: rounded,
            },
            values: [min, max],
            padding: {min: '10%', max: '25%'},
        });
        expect(result.domain).toEqual([min - (rounded ? 10800000 : 8640000), max + 21600000]);
    },
);

test('explicit limits override percentage padding with datetime Y timestamps', async () => {
    const min = 1704067200000;
    const max = min + 86400000;
    const converted = await getGeometry({
        axis: {type: 'datetime', timestamps: [min, max], min, max},
        values: [min, max],
        padding: {min: '10%', max: '25%'},
    });
    expect(converted.domain).toEqual([min, max]);
});

test.each([
    {direction: 'x', max: 30, rounded: false},
    {direction: 'x', max: 30, rounded: true},
    {direction: 'y', max: 'auto', rounded: false},
    {direction: 'y', max: 'auto', rounded: true},
] as const)(
    'mixed units preserve the percentage minimum on $direction (max: $max, rounded: $rounded)',
    async ({direction, max, rounded}) => {
        const converted = await getGeometry({
            direction,
            axis: {startOnTick: rounded, endOnTick: rounded},
            padding: {min: '7%', max},
        });
        expect(converted.domain[0]).toBeCloseTo(direction === 'y' && rounded ? -10 : -7, 8);
        expect(converted.domain[1]).toBeGreaterThan(100);
        if (rounded) {
            expect(converted.domain[1]).toBe(direction === 'x' ? 120 : 110);
        } else if (max === 30) {
            expect(converted.positions[1]).toBeCloseTo(270, 8);
        } else {
            expect(converted.positions[1]).toBeGreaterThan(0);
        }
    },
);

test.each(['x', 'y'] as const)(
    'logarithmic %s percentages expand the original log span',
    async (direction) => {
        for (const order of [undefined, 'reverse'] as const) {
            const result = await getGeometry({
                direction,
                values: [1, 100],
                axis: {type: 'logarithmic', order},
            });
            expect(result.domain[0]).toBe(1);
            expect(result.domain[1]).toBeCloseTo(Math.pow(100, 1.25), 8);
        }
    },
);

test.each(['x', 'y'] as const)(
    'logarithmic %s percentage minima and maxima are symmetric before rounding',
    async (direction) => {
        for (const order of [undefined, 'reverse'] as const) {
            const result = await getGeometry({
                direction,
                values: [1, 100],
                axis: {type: 'logarithmic', order},
                padding: {min: '25%', max: '25%'},
            });
            expect(result.domain[0]).toBeCloseTo(Math.pow(100, -0.25), 8);
            expect(result.domain[1]).toBeCloseTo(Math.pow(100, 1.25), 8);
            expect(result.positions.every(Number.isFinite)).toBe(true);
            const size = Math.abs(result.range[1] - result.range[0]);
            const [first, last] = result.positions;
            expect(Math.min(first, last) / size).toBeCloseTo(1 / 6, 8);
            expect(Math.max(first, last) / size).toBeCloseTo(5 / 6, 8);
        }
    },
);

test.each(['x', 'y'] as const)(
    'explicit limits override logarithmic %s percentages',
    async (direction) => {
        const result = await getGeometry({
            direction,
            values: [1, 100],
            axis: {type: 'logarithmic', min: 1, max: 100},
            padding: {min: '25%', max: '25%'},
        });
        expect(result.domain).toEqual([1, 100]);
    },
);

test.each([0, '0%', 'auto'] as const)('explicit maximum %j controls the domain', async (max) => {
    const result = await getGeometry({
        values: [1, 100],
        axis: {type: 'logarithmic'},
        padding: {max},
    });
    if (max !== 'auto') expect(result.domain).toEqual([1, 100]);
});

test.each([0, 1, -1, 300])(
    'logarithmic percentage padding remains usable at size %s',
    async (size) => {
        const result = await getGeometry({
            size,
            values: [1, 100],
            axis: {type: 'logarithmic'},
            padding: {min: '100000000%', max: '100000000%'},
        });
        expect(result.domain.every((value) => Number.isFinite(value) && value > 0)).toBe(true);
        expect(result.positions.every(Number.isFinite)).toBe(true);
    },
);

test.each(['x', 'y'] as const)(
    'logarithmic %s percentage padding stays representable after rounding both ends',
    async (direction) => {
        const converted = await getGeometry({
            direction,
            values: [1e-250, 1e250],
            axis: {type: 'logarithmic', startOnTick: true, endOnTick: true},
            padding: {min: '25%', max: '25%'},
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
        const converted = await getGeometry({
            values,
            axis: {startOnTick: true, endOnTick: true},
            padding: {[side]: '75%'},
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
        const converted = await getGeometry({
            direction,
            values,
            axis: {type},
            padding: {min: max, max},
        });
        expect(converted.domain.every(Number.isFinite)).toBe(true);
        expect(converted.positions.every(Number.isFinite)).toBe(true);
        expect(converted.domain[0]).toBeLessThanOrEqual(values[0]);
        expect(converted.domain[1]).toBeGreaterThanOrEqual(values[1]);
        expect(converted.positions[0]).not.toBe(converted.positions[1]);
    },
);
