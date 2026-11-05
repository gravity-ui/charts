import {inspectChartDataV1, migrateChartDataV1} from '..';
import type {PreparedAxis} from '../../../core/axes/types';
import {formatAxisTickLabel, getFormattedValue} from '../../../core/utils/format';
import {parseNonNegativeSize} from '../../../core/utils/math';
import {formatNumber} from '../../../libs/format-number';
import type {ChartData} from '../../../types';
import {migrateNumberFormatV1} from '../number-format';
import type {ChartDataV1, FormatNumberOptionsV1} from '../types';

import numberCases from './number-v1.json';

// Captured from release/v2 at 06d0703e, before removing the v1 formatter branch.
test.each(numberCases)('preserves v1 formatting: $options', ({values, options, expected}) => {
    const migrated = migrateNumberFormatV1(options as FormatNumberOptionsV1);
    expect(values.map((value) => formatNumber(value, migrated))).toEqual(expected);
});

test.each([null, undefined] as const)(
    'explicit unit %s disables automatic axis abbreviation',
    (unit) => {
        const {data} = migrateChartDataV1({
            yAxis: [{labels: {numberFormat: {unit, lang: 'en'}}}],
            series: {data: []},
        });
        const axis = {type: 'linear', labels: data.yAxis?.[0].labels} as PreparedAxis;
        expect(formatAxisTickLabel({axis, value: 1500, step: 1000})).toBe('1,500');
    },
);

test('preserves numeric tick hints and v1 precedence, including a zero modern interval', () => {
    const data: ChartDataV1 = {
        xAxis: {ticks: {pixelInterval: 120, interval: 0}},
        yAxis: [
            {ticks: {pixelInterval: 72, interval: '10%'}},
            {ticks: {pixelInterval: 0}},
            {ticks: {pixelInterval: undefined}},
        ],
        series: {data: []},
    };
    const result = migrateChartDataV1(data);
    expect(result.data.xAxis?.ticks).toEqual({interval: 120});
    expect(result.data.yAxis?.map((axis) => axis.ticks)).toEqual([
        {interval: '10%'},
        {interval: 0},
        {interval: undefined},
    ]);
    expect(result.warnings.map((warning) => warning.path)).toEqual([
        ['xAxis', 'ticks', 'pixelInterval'],
        ['yAxis', 0, 'ticks', 'pixelInterval'],
        ['yAxis', 1, 'ticks', 'pixelInterval'],
        ['yAxis', 2, 'ticks', 'pixelInterval'],
    ]);
    expect(data.xAxis?.ticks?.pixelInterval).toBe(120);
});

test.each([null, '60', -1, Infinity])(
    'reports invalid pixelInterval %j unless interval takes precedence',
    (pixelInterval) => {
        const input = {
            xAxis: {ticks: {pixelInterval}},
            series: {data: []},
        } as unknown as ChartDataV1;
        const {data, warnings} = migrateChartDataV1(input);
        expect(data).toBe(input);
        expect(warnings).toEqual([
            expect.objectContaining({
                code: 'invalid-axis-pixel-interval',
                path: ['xAxis', 'ticks', 'pixelInterval'],
                resolution: 'review',
                replacement: 'interval',
            }),
        ]);
        const overridden = migrateChartDataV1({
            ...input,
            xAxis: {ticks: {...input.xAxis?.ticks, interval: 60}},
        });
        expect(overridden.data.xAxis?.ticks).toEqual({interval: 60});
        expect(overridden.warnings[0].resolution).toBe('automatic');
    },
);

test('migrates nested formats, preserves input and opaque payload identity, and is idempotent', () => {
    const custom = {type: 'number', unit: 'auto', pixelInterval: 9};
    const point = {x: 0, y: 1500, custom};
    const click = jest.fn();
    const rowRenderer = jest.fn();
    const data: ChartDataV1 = {
        xAxis: {labels: {numberFormat: {unit: 'k'}}},
        chart: {events: {click}},
        tooltip: {
            rowRenderer,
            rows: [
                {cells: [{id: 'value', source: 'data.y', format: {type: 'number', unit: 'auto'}}]},
            ],
        },
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Revenue',
                    custom,
                    data: [point],
                    dataLabels: {format: {type: 'number', unit: 'k'}},
                },
            ],
        },
    };
    const result = migrateChartDataV1(data);
    expect(inspectChartDataV1(data)).toEqual(result.warnings);
    expect(result.data.series.data[0].data).toBe(data.series.data[0].data);
    expect(result.data.series.data[0].custom).toBe(custom);
    expect(result.data.chart).toBe(data.chart);
    expect(result.data.tooltip?.rowRenderer).toBe(rowRenderer);
    expect(data.xAxis?.labels?.numberFormat).toEqual({unit: 'k'});
    const series = result.data.series.data[0];
    if (series.type !== 'line') throw new Error('Expected line');
    expect(getFormattedValue({value: 1500, format: series.dataLabels?.format})).toBe('1,5K');
    expect(result.warnings.map(({code}) => code)).toEqual([
        'number-unit',
        'number-unit',
        'number-unit',
    ]);
    const again = migrateChartDataV1(result.data);
    expect(again.data).toBe(result.data);
    expect(again.warnings).toEqual([]);
    expect(click).not.toHaveBeenCalled();
    expect(rowRenderer).not.toHaveBeenCalled();
});

test('checks plugin-specific fields without mistaking funnel inside or application data for deprecated options', () => {
    const data: ChartDataV1 = {
        xAxis: {maxPadding: 0.1},
        tooltip: {rowRenderer: () => '<tr />'},
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'A',
                    dataLabels: {inside: false},
                    data: [
                        {x: 'A', y: 0},
                        {category: 'A', y: 1},
                        {category: 'B', y: 2},
                    ],
                },
                {
                    type: 'funnel',
                    dataLabels: {inside: true},
                    data: [
                        {
                            name: 'A',
                            value: 1500,
                            tooltip: {valueFormat: {type: 'number', unit: 'k'}},
                        },
                    ],
                },
                {
                    type: 'scatter',
                    name: 'B',
                    cluster: {dataLabels: {format: {type: 'number', unit: 'auto'}}},
                    data: [{x: 0, y: 1, custom: {unit: 'k', category: 'C'}}],
                },
            ],
        },
    };
    const result = migrateChartDataV1(data);
    expect(result.warnings.map(({code}) => code)).toEqual([
        'axis-max-padding',
        'bar-label-inside',
        'point-category',
        'number-unit',
        'number-unit',
    ]);
    expect(result.data.xAxis).toEqual({padding: {max: '10%'}});
    expect(result.data.tooltip).toBe(data.tooltip);
    expect(result.data.series.data[0].data).toBe(data.series.data[0].data);
    expect(result.data.series.data[0].dataLabels).toEqual({});
    expect(result.warnings.find(({code}) => code === 'point-category')?.path).toEqual([
        'series',
        'data',
        0,
        'data',
        1,
        'category',
    ]);
    expect(result.data.series.data[1].data[0]).not.toBe(data.series.data[1].data[0]);
    expect(data.series.data[1].data[0]).toHaveProperty('tooltip.valueFormat.unit', 'k');
});

test('reports invalid legacy units without silently deleting them', () => {
    const warnings = inspectChartDataV1({xAxis: {labels: {numberFormat: {unit: 'bytes'}}}});
    expect(warnings).toEqual([
        expect.objectContaining({
            code: 'invalid-number-unit',
            resolution: 'review',
            replacement: 'units',
            message: expect.stringContaining('v1 abbreviated automatically'),
        }),
    ]);
});

test('converts maxPadding fractions while preserving explicit padding and nested migrations', () => {
    const data: ChartDataV1 = {
        xAxis: {
            maxPadding: 0.25,
            padding: {min: 'auto'},
            ticks: {pixelInterval: 80},
            labels: {numberFormat: {unit: 'k'}},
        },
        yAxis: [
            {maxPadding: 0.05},
            {maxPadding: 0},
            {maxPadding: 0.5, padding: {min: 12, max: 0}},
            {maxPadding: 0.5, padding: {max: 'auto'}},
            {maxPadding: undefined},
        ],
        series: {data: []},
    };
    const result = migrateChartDataV1(data);
    expect(result.data.xAxis?.padding).toEqual({min: 'auto', max: '25%'});
    expect(result.data.xAxis?.ticks).toEqual({interval: 80});
    expect(result.data.xAxis?.labels?.numberFormat).not.toHaveProperty('unit');
    expect(result.data.xAxis).not.toHaveProperty('maxPadding');
    expect(result.data.yAxis).toEqual([
        {padding: {max: '5%'}},
        {padding: {max: '0%'}},
        {padding: {min: 12, max: 0}},
        {padding: {max: 'auto'}},
        {},
    ]);
    expect(data.xAxis?.maxPadding).toBe(0.25);
    expect(inspectChartDataV1(data)).toEqual(result.warnings);
    expect(result.warnings.filter(({code}) => code === 'axis-max-padding')).toHaveLength(6);
    expect(migrateChartDataV1(result.data)).toEqual({data: result.data, warnings: []});
});

test.each([-1, NaN, Infinity, Number.MAX_VALUE])(
    'reports unsupported maxPadding %s without silently changing it',
    (maxPadding) => {
        const data: ChartDataV1 = {xAxis: {maxPadding}, series: {data: []}};
        const result = migrateChartDataV1(data);
        expect(result.data).toBe(data);
        expect(result.warnings).toEqual([
            expect.objectContaining({code: 'invalid-axis-max-padding', resolution: 'review'}),
        ]);
    },
);

test.each([
    [1e-12, '0.0000000001%'],
    [0.29, '29%'],
    [0.07, '7%'],
])('writes a decimal percentage without floating-point noise for %s', (maxPadding, expected) => {
    const result = migrateChartDataV1({
        xAxis: {maxPadding: maxPadding as number},
        series: {data: []},
    });
    expect(result.data.xAxis?.padding?.max).toBe(expected);
});

test('keeps a percentage near the numeric limit finite after rounding', () => {
    const {data} = migrateChartDataV1({
        xAxis: {maxPadding: Number.MAX_VALUE / 100},
        series: {data: []},
    });
    expect(parseNonNegativeSize(data.xAxis?.padding?.max)?.unit).toBe('%');
});

test.each([
    {maxPadding: 0.25, padding: undefined},
    {maxPadding: Number.MAX_VALUE, padding: undefined},
    {maxPadding: 0.25, padding: {min: '10%'}},
    {maxPadding: 0.25, padding: {max: '10%'}},
])('preserves datetime Y timestamps when maxPadding was ignored (%j)', ({maxPadding, padding}) => {
    const input: ChartDataV1 = {
        xAxis: {type: 'datetime', timestamps: [1704067200000, 1704153600000], maxPadding: 0.25},
        yAxis: [
            {
                type: 'datetime',
                timestamps: [1704067200000, 1704153600000],
                maxPadding,
                startOnTick: false,
                endOnTick: false,
                padding,
            },
        ],
        series: {data: []},
    };
    const {data, warnings} = migrateChartDataV1(input);
    expect(data.xAxis?.padding).toEqual({max: '25%'});
    expect(data.yAxis?.[0]).not.toHaveProperty('maxPadding');
    expect(data.yAxis?.[0].padding).toBe(padding);
    expect(input.yAxis?.[0].maxPadding).toBe(maxPadding);
    expect(warnings.map(({resolution}) => resolution)).toEqual(['automatic', 'automatic']);
    expect(inspectChartDataV1(input)).toEqual(warnings);
    expect(migrateChartDataV1(data).warnings).toEqual([]);
});

test('preserves valid current config references and leaves arbitrary custom data alone', () => {
    const data: ChartData = {series: {data: [{type: 'line', name: 'A', data: [{x: 1, y: 2}]}]}};
    expect(migrateChartDataV1(data)).toEqual({data, warnings: []});
    expect(migrateChartDataV1(data).data).toBe(data);
    expect(inspectChartDataV1(null)).toEqual([]);
});

test.each(['bar-x', 'bar-y'] as const)(
    'migrates %s labels and nested formats together, preserving percent and explicit placement precedence',
    (type) => {
        const input: ChartDataV1 = {
            series: {
                data: [
                    {
                        type,
                        name: 'A',
                        stacking: 'percent',
                        data: [],
                        dataLabels: {inside: false, format: {type: 'number', unit: 'k'}},
                    },
                ],
            },
        };
        const result = migrateChartDataV1(input);
        expect(result.data.series.data[0].dataLabels).toEqual({
            format: {type: 'number', units: {scale: [{factor: 1000, postfix: 'K'}], delimiter: ''}},
        });
        expect(input.series.data[0].dataLabels).toHaveProperty('inside', false);
        const explicit: ChartDataV1 = {
            series: {
                data: [
                    {type, name: 'A', data: [], dataLabels: {inside: true, placement: ['outside']}},
                ],
            },
        };
        expect(migrateChartDataV1(explicit).data.series.data[0].dataLabels).toEqual({
            placement: ['outside'],
        });
        const inside: ChartDataV1 = {
            series: {data: [{type, name: 'A', data: [], dataLabels: {inside: true}}]},
        };
        expect(migrateChartDataV1(inside).data.series.data[0].dataLabels).toEqual({
            placement: ['inside-center'],
        });
        const outside: ChartDataV1 = {
            series: {data: [{type, name: 'A', data: [], dataLabels: {inside: false}}]},
        };
        expect(migrateChartDataV1(outside).data.series.data[0].dataLabels).toEqual({});
    },
);
