/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleLinear, scaleOrdinal} from 'd3-scale';

import type {ChartSeries, LineSeries} from '~core/types';

import type * as YTicks from '../../../components/AxisY/utils';
import {getTickValues} from '../../../components/AxisY/utils';
import type * as LinePlugin from '../../../plugins/line';
import type {PreparedYAxis} from '../../axes/types';
import {getPreparedXAxis} from '../../axes/x-axis';
import {getPreparedYAxis} from '../../axes/y-axis';
import {createXScale} from '../../scales/x-scale';
import {createYScale} from '../../scales/y-scale';
import type * as XTicks from '../../utils/axis/x-axis';
import {getXAxisTickValues} from '../../utils/axis/x-axis';
import type {SeriesAxes} from '../axis-contract';
import type * as AxisDomain from '../axis-domain';
import {
    collectAxisCoordinateValues,
    getAxisCoordinateValues,
    getAxisDomainValues,
} from '../axis-domain';
import {
    getAxisPaddingDefaults,
    getSeriesAxisRequirements,
    mergeAxisRequirements,
} from '../axis-policies';
import {getPreparedSeries} from '../prepareSeries';
import type * as Registry from '../seriesRegistry';
import type {PreparedLegendOptions} from '../types';

const axis = {
    type: 'linear',
    padding: {min: 0, max: 0},
    startOnTick: false,
    endOnTick: false,
    plotIndex: 0,
    ticks: {},
    labels: {enabled: false, lineHeight: 12, padding: 4},
} as PreparedYAxis;

function prepare(seriesData: ChartSeries[]) {
    return getPreparedSeries({
        seriesData,
        colors: ['black'],
        preparedLegend: {enabled: true} as PreparedLegendOptions,
        seriesOptions: undefined,
    });
}

test('accepts a standalone axis contract with custom data and no built-in series types', () => {
    interface CustomSeries {
        samples: readonly {start: number; end: number; lane: string}[];
        normalized?: boolean;
    }
    const axes: SeriesAxes<CustomSeries> = {
        x: {
            getData: ({series}) => ({
                values: series.flatMap((item) => item.samples.flatMap((p) => [p.start, p.end])),
            }),
            getFixedDomain: ({series}) =>
                series.some((item) => item.normalized) ? {min: 0, max: 100} : undefined,
            bandPadding: 0.5,
        },
        y: {
            getData: ({series}) => ({
                values: series.flatMap((item) => item.samples.map((p) => p.lane)),
            }),
        },
    };
    const series: CustomSeries[] = [{samples: [{start: 2, end: 8, lane: 'Ready'}]}];
    const groups = [{series, axis: axes.x}];
    expect(collectAxisCoordinateValues(groups, 'x')).toEqual([2, 8]);
    expect(collectAxisCoordinateValues([{series, axis: axes.y}], 'y', ['Ready', 'Done'])).toEqual([
        'Ready',
    ]);
    expect(mergeAxisRequirements(groups, 'x').fixedDomain).toBeUndefined();
    expect(mergeAxisRequirements(groups, 'x').bandPadding).toBe(0.5);
    series[0].normalized = true;
    expect(mergeAxisRequirements(groups, 'x').fixedDomain).toMatchObject({min: 0, max: 100});
});

test('combines band reservations by maximum and rejects incompatible fixed domains', () => {
    const groups = [
        {series: [], axis: {bandPadding: 0.25, getFixedDomain: () => ({min: 0, max: 100})}},
        {series: [], axis: {bandPadding: 0.5, getFixedDomain: () => ({min: 0, max: 100})}},
    ];
    expect(mergeAxisRequirements(groups, 'x')).toMatchObject({
        bandPadding: 0.5,
        fixedDomain: {min: 0, max: 100},
    });
    groups[1].axis.getFixedDomain = () => ({min: 0, max: 1});
    expect(() => mergeAxisRequirements(groups, 'x')).toThrow('Conflicting fixed x axis domains');
});

test('validates fixed bounds against an inherited logarithmic scale', () => {
    const groups = [{series: [], axis: {getFixedDomain: () => ({min: 0, max: 100})}}];
    expect(() => mergeAxisRequirements(groups, 'x', 'logarithmic')).toThrow(
        'Invalid fixed x axis domain',
    );
    expect(mergeAxisRequirements(groups, 'x', 'linear').fixedDomain).toMatchObject({
        min: 0,
        max: 100,
    });
    const normalized = {
        series: [],
        axis: {getFixedDomain: () => ({min: 0, max: 100, type: 'linear' as const})},
    };
    expect(
        mergeAxisRequirements([...groups, normalized], 'x', 'logarithmic').fixedDomain?.type,
    ).toBe('linear');
});

test('scalar defaults preserve coordinates independently from stacked domain contributions', () => {
    const series: ChartSeries[] = [
        {
            type: 'bar-x',
            name: 'First',
            stacking: 'normal',
            stackId: 'shared',
            data: [{x: 1, y: 20}],
        },
        {
            type: 'bar-x',
            name: 'Second',
            stacking: 'normal',
            stackId: 'shared',
            data: [{x: 1, y: 30}],
        },
        {type: 'pie', data: [{name: 'Slice', value: 1000}]},
    ];
    expect(getAxisCoordinateValues(series, 'y')).toEqual([20, 30]);
    expect(getAxisDomainValues(series, 'y')).toEqual([50]);
    expect(getSeriesAxisRequirements(series, 'y').fixedDomain).toBeUndefined();
});

test('padding defaults compare resolved sizes and preserve original units', () => {
    const requirements = mergeAxisRequirements(
        [
            {series: [], axis: {padding: {max: 20}}},
            {series: [], axis: {padding: {max: '5%'}}},
        ],
        'x',
    );
    expect(getAxisPaddingDefaults(requirements, 200)).toEqual({max: 20});
    expect(getAxisPaddingDefaults(requirements, 800)).toEqual({max: '5%'});
    expect(getAxisPaddingDefaults(requirements, 0)).toEqual({max: 20});
});

test.each([-1, NaN, Infinity])('rejects invalid band padding %s', (bandPadding) => {
    expect(() => mergeAxisRequirements([{series: [], axis: {bandPadding}}], 'x')).toThrow(
        'Invalid x axis band padding',
    );
});

test('axis opt-in and tick hooks work with an isolated registry', () => {
    jest.isolateModules(() => {
        const registry = jest.requireActual<typeof Registry>('../seriesRegistry');
        const domain = jest.requireActual<typeof AxisDomain>('../axis-domain');
        const {linePlugin} = jest.requireActual<typeof LinePlugin>('../../../plugins/line');
        const xTicks = jest.requireActual<typeof XTicks>('../../utils/axis/x-axis');
        const yTicks = jest.requireActual<typeof YTicks>('../../../components/AxisY/utils');
        expect(registry.getRegisteredSeriesTypes()).toEqual([]);
        const series: LineSeries[] = [
            {
                type: 'line',
                name: 'Line',
                data: [
                    {x: 0, y: 10},
                    {x: 10, y: 30},
                ],
            },
        ];
        registry.registerSeriesPlugin({...linePlugin, axes: undefined});
        expect(domain.getAxisDomainValues(series, 'x')).toEqual([]);
        registry.registerSeriesPlugin({...linePlugin, axes: false});
        expect(domain.getAxisDomainValues(series, 'y')).toEqual([]);
        registry.registerSeriesPlugin({...linePlugin, axes: {}});
        expect(domain.getAxisDomainValues(series, 'x')).toEqual([0, 10]);
        expect(domain.getAxisDomainValues(series, 'y')).toEqual([10, 30]);

        registry.registerSeriesPlugin({
            ...linePlugin,
            axes: {
                x: {getTicks: () => ({values: [2, 8]})},
                y: {getTicks: () => ({values: [15, 25]})},
            },
        });
        const prepared = linePlugin.prepareSeries({
            series,
            colors: ['black'],
            colorScale: scaleOrdinal<string, string>().range(['black']),
            legend: {enabled: true} as PreparedLegendOptions,
        });
        if (prepared instanceof Promise) throw new Error('Fixture preparation must be synchronous');
        const args = {
            axis,
            scale: scaleLinear().domain([0, 10]).range([0, 400]),
            series: prepared,
            labelLineHeight: 12,
        };
        expect(xTicks.getXAxisTickValues(args).map((tick) => tick.value)).toEqual([2, 8]);
        expect(
            xTicks
                .getXAxisTickValues({...args, axis: {...axis, ticks: {values: [4]}}})
                .map((tick) => tick.value),
        ).toEqual([4]);
        const yArgs = {...args, scale: scaleLinear().domain([10, 30]).range([300, 0])};
        expect(yTicks.getTickValues(yArgs).map((tick) => tick.value)).toEqual([15, 25]);
        expect(
            yTicks
                .getTickValues({...yArgs, axis: {...axis, ticks: {values: [22]}}})
                .map((tick) => tick.value),
        ).toEqual([22]);
    });
});

test.each(['bar-x', 'bar-y', 'area'] as const)(
    '%s keeps percent bounds fixed ahead of log settings, explicit bounds and zoom',
    async (type) => {
        const series = await prepare([
            {
                type,
                name: 'Share',
                stacking: 'percent',
                data: [
                    {x: 1, y: 20},
                    {x: 2, y: 40},
                ],
            },
        ]);
        const options = {...axis, type: 'logarithmic' as const, min: 10, max: 50};
        const scale =
            type === 'bar-y'
                ? createXScale({axis: options, series, boundsWidth: 400, zoomStateX: [20, 30]})
                : createYScale({axis: options, series, boundsHeight: 300, zoomStateY: [20, 30]});
        expect(scale?.domain()).toEqual([0, 100]);
        expect(scale && 'invert' in scale && scale(50)).toBeCloseTo(type === 'bar-y' ? 200 : 150);
    },
);

test.each([0, -1, 1, 400])(
    'band padding preserves finite domains at plot width %s',
    async (width) => {
        const series = await prepare([
            {
                type: 'bar-x',
                name: 'Bars',
                data: [
                    {x: 0, y: 10},
                    {x: 10, y: 20},
                ],
            },
        ]);
        const scale = createXScale({axis, series, boundsWidth: width});
        expect(scale?.domain().every(Number.isFinite)).toBe(true);
        const [min, max] = scale?.domain().map(Number) ?? [];
        expect(min).toBeLessThanOrEqual(0);
        expect(max).toBeGreaterThanOrEqual(10);
    },
);

test('single-coordinate policy requires every series to request centering', async () => {
    const series = await prepare([
        {type: 'line', name: 'Line', data: [{x: 100, y: 1000}]},
        {type: 'scatter', name: 'Point', data: [{x: 100, y: 1000}]},
    ]);
    expect(
        createXScale({axis: {...axis, min: 0, max: 10}, series, boundsWidth: 400})?.domain(),
    ).toEqual([100, 100]);
    expect(
        createYScale({
            axis: {...axis, type: 'datetime', min: 2000, max: 3000},
            series,
            boundsHeight: 300,
        })
            ?.domain()
            .map(Number),
    ).toEqual([1000, 1000]);
    const bars = await prepare([{type: 'bar-x', name: 'Bar', data: [{x: 100, y: 10}]}]);
    expect(getSeriesAxisRequirements([...series, ...bars], 'x').centerSingleValue).toBe(false);
});

test('heatmap grid constraints are local to its Y axis and explicit padding still wins', async () => {
    const series = await prepare([
        {type: 'line', name: 'Line', yAxis: 1, data: [{x: 0, y: 10}]},
        {type: 'heatmap', name: 'Cells', data: [{x: 0, y: 1, value: 5}]},
    ]);
    const xAxis = await getPreparedXAxis({
        seriesData: series,
        width: 400,
        boundsWidth: 350,
        xAxis: {grid: {enabled: true}, padding: {max: '10%'}},
    });
    const yAxes = await getPreparedYAxis({
        seriesData: series,
        width: 400,
        height: 300,
        boundsHeight: 250,
        yAxis: [
            {grid: {enabled: true}, padding: {max: '10%'}},
            {grid: {enabled: true}, plotIndex: 1},
        ],
    });
    expect(xAxis?.grid.enabled).toBe(false);
    expect(xAxis?.padding?.max).toBe('10%');
    expect(yAxes.map((item) => item.grid.enabled)).toEqual([false, true]);
    expect(yAxes.map((item) => item.padding?.max)).toEqual(['10%', '5%']);
});

test('x-range ticks use complete interval endpoints instead of scalar X', async () => {
    const series = await prepare([
        {
            type: 'x-range',
            name: 'Tasks',
            data: [
                {x0: 0, x1: 10, y: 1},
                {x0: 20, x1: 30, y: 1},
            ],
        },
    ]);
    const ticks = getXAxisTickValues({
        axis,
        scale: scaleLinear().domain([0, 30]).range([0, 600]),
        series,
        labelLineHeight: 12,
    });
    expect(ticks.map((tick) => tick.value)).toEqual([0, 10, 20, 30]);
});

test('bar-y tick candidates preserve data positions and explicit ticks override them', async () => {
    const series = await prepare([
        {
            type: 'bar-y',
            name: 'Bars',
            data: [
                {x: 10, y: 1},
                {x: 20, y: 4},
            ],
        },
    ]);
    const args = {
        axis,
        scale: scaleLinear().domain([0, 5]).range([300, 0]),
        series,
        labelLineHeight: 12,
    };
    expect(getTickValues(args).map((tick) => tick.value)).toEqual([1, 4]);
    expect(
        getTickValues({...args, axis: {...axis, domainValues: [2, 4]}}).map((tick) => tick.value),
    ).toEqual([2, 4]);
    expect(
        getTickValues({...args, axis: {...axis, ticks: {values: [2]}}}).map((tick) => tick.value),
    ).toEqual([2]);
});
