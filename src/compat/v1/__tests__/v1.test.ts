import {inspectChartDataV1, migrateChartDataV1} from '..';
import {getFormattedValue} from '../../../core/utils/format';
import {formatNumber, getDefaultNumberUnits} from '../../../libs/format-number';
import type {ChartData} from '../../../types';
import {migrateNumberFormatV1} from '../number-format';
import type {ChartDataV1, FormatNumberOptionsV1} from '../types';

import numberCases from './number-v1.json';

// Captured from release/v2 at 06d0703e, before removing the v1 formatter branch.
test.each(
    numberCases.flatMap(({options, values, expected}) =>
        values.map((value, index) => ({options, value, expected: expected[index]})),
    ),
)('preserves v1 formatting: %j', ({value, options, expected}) => {
    expect(formatNumber(value, migrateNumberFormatV1(options as FormatNumberOptionsV1))).toBe(
        expected,
    );
});

test.each([null, undefined] as const)(
    'explicit unit %s disables automatic axis abbreviation',
    (unit) => {
        const options = migrateNumberFormatV1({unit});
        expect(formatNumber(1500, {units: getDefaultNumberUnits(1000), ...options})).toBe('1 500');
    },
);

test('preserves numeric tick hints and v1 precedence, including a zero modern interval', () => {
    const data: ChartDataV1 = {
        xAxis: {ticks: {pixelInterval: 120, interval: 0}},
        yAxis: [{ticks: {pixelInterval: 72, interval: '10%'}}, {ticks: {pixelInterval: 0}}],
        series: {data: []},
    };
    const result = migrateChartDataV1(data);
    expect(result.data.xAxis?.ticks).toEqual({interval: 120});
    expect(result.data.yAxis?.map((axis) => axis.ticks)).toEqual([
        {interval: '10%'},
        {interval: 0},
    ]);
    expect(result.warnings.map((warning) => warning.path)).toEqual([
        ['xAxis', 'ticks', 'pixelInterval'],
        ['yAxis', 0, 'ticks', 'pixelInterval'],
        ['yAxis', 1, 'ticks', 'pixelInterval'],
    ]);
    expect(data.xAxis?.ticks?.pixelInterval).toBe(120);
});

test('migrates nested formats, preserves input and opaque payload identity, and is idempotent', () => {
    const custom = {type: 'number', unit: 'auto', pixelInterval: 9};
    const point = {x: 0, y: 1500, custom};
    const click = jest.fn();
    const data: ChartDataV1 = {
        xAxis: {labels: {numberFormat: {unit: 'k'}}},
        chart: {events: {click}},
        tooltip: {
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
    expect(data.xAxis?.labels?.numberFormat).toEqual({unit: 'k'});
    const series = result.data.series.data[0];
    if (series.type !== 'line') throw new Error('Expected line');
    expect(getFormattedValue({value: 1500, format: series.dataLabels?.format})).toBe('1,5K');
    expect(result.warnings.map(({code}) => code)).toEqual([
        'number-unit',
        'number-unit',
        'click-handler-review',
        'number-unit',
    ]);
    const again = migrateChartDataV1(result.data);
    expect(again.data).toBe(result.data);
    expect(again.warnings.map(({code}) => code)).toEqual(['click-handler-review']);
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
                    data: [{category: 'A', y: 1}],
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
        'tooltip-row-renderer',
        'bar-label-inside',
        'point-category',
        'number-unit',
        'number-unit',
    ]);
    expect(result.data.xAxis).toEqual({padding: {max: '10%'}});
    expect(result.data.tooltip).toBe(data.tooltip);
    expect(result.data.series.data[0].data).toBe(data.series.data[0].data);
    expect(result.data.series.data[0].dataLabels).toEqual({placement: ['outside']});
    expect(result.data.series.data[1].data[0]).not.toBe(data.series.data[1].data[0]);
    expect(data.series.data[1].data[0]).toHaveProperty('tooltip.valueFormat.unit', 'k');
});

test('reports invalid legacy units without silently deleting them', () => {
    const warnings = inspectChartDataV1({xAxis: {labels: {numberFormat: {unit: 'bytes'}}}});
    expect(warnings).toEqual([
        expect.objectContaining({code: 'invalid-number-unit', resolution: 'review'}),
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

test('uses decimal percentage notation for a small maxPadding fraction', () => {
    const result = migrateChartDataV1({xAxis: {maxPadding: 1e-12}, series: {data: []}});
    expect(result.data.xAxis?.padding?.max).toBe('0.0000000001%');
});

test('reports the logarithmic behavior change while converting maxPadding', () => {
    const data: ChartDataV1 = {
        xAxis: {type: 'logarithmic', maxPadding: 0.25, padding: {min: '10%'}},
        yAxis: [{type: 'logarithmic', maxPadding: 0.25, order: 'reverse'}],
        series: {data: []},
    };
    const result = migrateChartDataV1(data);
    expect(result.data.xAxis?.padding).toEqual({min: '10%', max: '25%'});
    expect(result.data.yAxis?.[0].padding).toEqual({max: '25%'});
    expect(result.warnings).toEqual([
        expect.objectContaining({
            code: 'axis-max-padding-logarithmic',
            path: ['xAxis', 'maxPadding'],
            resolution: 'automatic',
        }),
        expect.objectContaining({
            code: 'axis-max-padding-logarithmic',
            path: ['yAxis', 0, 'maxPadding'],
            resolution: 'automatic',
        }),
    ]);
    expect(inspectChartDataV1(data)).toEqual(result.warnings);
    expect(data.xAxis?.maxPadding).toBe(0.25);
    expect(migrateChartDataV1(result.data).warnings).toEqual([]);
});

test.each([0, undefined, 'explicit'] as const)('does not report a log change for %s', (value) => {
    const result = migrateChartDataV1({
        xAxis: {
            type: 'logarithmic',
            maxPadding: value === 'explicit' ? 0.25 : value,
            padding: value === 'explicit' ? {max: 0} : undefined,
        },
        series: {data: []},
    });
    expect(result.warnings.map(({code}) => code)).toEqual(['axis-max-padding']);
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
            placement: ['inside-center'],
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
    },
);
