import type * as LinePlugin from '../../../plugins/line';
import type {ChartSeries, LineSeries} from '../../../types';
import type * as Registry from '../../series/seriesRegistry';
import {TIME_UNITS} from '../../utils/time';
import {getDefaultTooltipHeaderFormat} from '../../utils/tooltip';
import type * as TooltipUtils from '../../utils/tooltip';
import {prepareTooltipHeaderFormat} from '../header';
import {getTooltipYValue} from '../utils';

const line: LineSeries = {
    type: 'line',
    name: 'Dates',
    data: [
        {x: 0, y: 10},
        {x: TIME_UNITS.day, y: 11},
    ],
};
const horizontal: ChartSeries = {
    type: 'bar-y',
    name: 'Horizontal',
    data: [
        {x: 10, y: 0},
        {x: 20, y: TIME_UNITS.day},
    ],
};

it.each([{tooltip: {enabled: false}}, {visible: false}])(
    'ignores a higher-priority series that cannot contribute a tooltip (%j)',
    (overrides) => {
        expect(
            getDefaultTooltipHeaderFormat({
                seriesData: [line, {...horizontal, ...overrides}],
                xAxis: {type: 'datetime'},
                yAxes: [{type: 'linear'}],
            }),
        ).toEqual({type: 'date', format: 'DD.MM.YY'});
    },
);

it('preserves the exported helper default for a header series with no points', () => {
    expect(
        getDefaultTooltipHeaderFormat({
            seriesData: [{...line, data: []}],
            xAxis: {type: 'linear'},
        }),
    ).toEqual({type: 'number'});
});

it('honors point-level enabling over a disabled series', () => {
    expect(
        getDefaultTooltipHeaderFormat({
            seriesData: [
                line,
                {
                    ...horizontal,
                    tooltip: {enabled: false},
                    data: [{x: 10, y: 0, tooltip: {enabled: true}}],
                },
            ],
            xAxis: {type: 'datetime'},
            yAxes: [{type: 'linear'}],
        }),
    ).toEqual({type: 'number'});
});

it.each([0, 1])('excludes non-header Y values on axis %s from date precision', (yAxis) => {
    expect(
        getDefaultTooltipHeaderFormat({
            seriesData: [horizontal, {...line, yAxis}],
            xAxis: {type: 'linear'},
            yAxes: [{type: 'datetime'}, {type: 'linear'}],
        }),
    ).toEqual({type: 'date', format: 'DD.MM.YY'});
});

it('sorts and deduplicates dates, preserving zero and excluding disabled or missing values', () => {
    expect(
        getDefaultTooltipHeaderFormat({
            seriesData: [
                {
                    ...line,
                    data: [
                        {x: TIME_UNITS.day, y: 1},
                        {x: 0, y: 2},
                        {x: TIME_UNITS.day, y: 3},
                        {x: 1, y: 4, tooltip: {enabled: false}},
                        {x: undefined, y: 5},
                        {x: NaN, y: 6},
                    ],
                },
            ],
            xAxis: {type: 'datetime'},
        }),
    ).toEqual({type: 'date', format: 'DD.MM.YY'});
});

it('selects each hovered header format without rescanning data', () => {
    const readX = jest.fn(() => 0);
    const series = {
        ...line,
        data: [
            {
                get x() {
                    return readX();
                },
                y: 10,
            },
        ],
    };
    const getFormat = prepareTooltipHeaderFormat({
        seriesData: [series, horizontal],
        xAxis: {type: 'datetime'},
        yAxes: [{type: 'linear'}],
    });
    expect(readX).toHaveBeenCalledTimes(1);
    expect(getFormat([{series}])).toEqual({type: 'date', format: 'DD.MM.YY'});
    expect(getFormat([{series}, {series: horizontal}])).toEqual({type: 'number'});
    expect(getFormat([{series}])).toEqual({type: 'date', format: 'DD.MM.YY'});
    expect(getFormat([])).toBeUndefined();
    expect(readX).toHaveBeenCalledTimes(1);
});

it('does not give headerless or explicitly formatted headers an implicit X format', () => {
    const radar: ChartSeries = {type: 'radar', name: 'Radar', data: [{value: 10}]};
    const pie: ChartSeries = {type: 'pie', data: [{name: 'Pie', value: 20}]};
    const getFormat = prepareTooltipHeaderFormat({
        seriesData: [line, radar, pie],
        xAxis: {type: 'datetime'},
    });
    expect(getFormat([{series: pie}])).toBeUndefined();
    expect(getFormat([{series: line}, {series: radar}])).toBeUndefined();
    expect(getFormat([{series: line}, {series: pie}])).toEqual({type: 'date', format: 'DD.MM.YY'});
});

it('resolves default formatting from an independently registered plugin', () => {
    jest.isolateModules(() => {
        const isolatedRegistry = jest.requireActual<typeof Registry>('../../series/seriesRegistry');
        const {linePlugin} = jest.requireActual<typeof LinePlugin>('../../../plugins/line');
        const {getDefaultTooltipHeaderFormat: getFormat} =
            jest.requireActual<typeof TooltipUtils>('../../utils/tooltip');
        expect(isolatedRegistry.getRegisteredSeriesTypes()).toEqual([]);
        isolatedRegistry.registerSeriesPlugin({
            ...linePlugin,
            tooltip: {
                ...linePlugin.tooltip,
                header: {getValue: getTooltipYValue, axis: 'y'},
            },
        });
        expect(
            getFormat({
                seriesData: [{...line, yAxis: 1}],
                xAxis: {type: 'linear'},
                yAxes: [{type: 'linear'}, {type: 'datetime'}],
            }),
        ).toEqual({type: 'date', format: 'DD.MM.YY HH:mm:ss.SSS'});
        expect(isolatedRegistry.getRegisteredSeriesTypes()).toEqual(['line']);
    });
});
