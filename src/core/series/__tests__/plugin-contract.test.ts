/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleOrdinal} from 'd3-scale';

import {getShapes} from '../../../hooks/useShapes';
import type {ChartSeries, ChartSeriesOptions} from '../../../types';
import {getClosestPoints} from '../../utils/get-closest-data';
import type * as Options from '../prepare-options';
import {getPreparedOptions} from '../prepare-options';
import {prepareSeriesMetadata} from '../prepare-series-metadata';
import {getPreparedSeries} from '../prepareSeries';
import type * as Registry from '../seriesRegistry';
import {registerSeriesPlugin} from '../seriesRegistry';
import type {PreparedLegendOptions} from '../types';

import {samplePlugin} from './fixtures/custom-plugin';
import type {SampleSeries} from './fixtures/custom-plugin';

const legend = {enabled: false} as PreparedLegendOptions;
const bounds = {boundsWidth: 100, boundsHeight: 100};
const colorScale = () => scaleOrdinal<string, string>().range(['black']);

beforeAll(() => registerSeriesPlugin(samplePlugin));
afterEach(() => jest.restoreAllMocks());

// The host's public input is still a closed built-in union. Keep this test bridge at its boundary.
function prepare(series: SampleSeries[]) {
    return getPreparedSeries({
        seriesData: series as unknown as ChartSeries[],
        colors: ['black'],
        preparedLegend: legend,
        seriesOptions: {},
    });
}

test('common metadata honors explicit configuration without changing its source', () => {
    const tooltip = Object.freeze({enabled: false});
    const custom = Object.freeze({owner: 'client'});
    const source = Object.freeze({
        id: 'explicit',
        name: 'Orders',
        visible: false,
        cursor: 'pointer',
        tooltip,
        custom,
        legend: Object.freeze({enabled: true, groupId: 'orders', itemText: 'All orders'}),
    });
    const metadata = prepareSeriesMetadata({series: source, color: 'black', legend});
    expect(metadata).toMatchObject({...source, color: 'black'});
    expect(metadata.legend.source).toBe(source.legend);
    expect(metadata.tooltip).toBe(tooltip);
    expect(metadata.custom).toBe(custom);
});

test('layer IDs remain distinct with repeated randomness and preserve explicit IDs', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const series = await prepare([
        {type: 'sample', data: []},
        {type: 'sample', data: []},
        {type: 'sample', id: 'client-id', data: []},
    ]);
    expect(new Set(series.map((item) => item.id)).size).toBe(3);
    expect(series[2].id).toBe('client-id');
});

test('duplicate prepared IDs are rejected across layers instead of merging them', async () => {
    await expect(
        prepare([
            {type: 'sample', id: 'duplicate', data: []},
            {type: 'sample', id: 'duplicate', data: []},
        ]),
    ).rejects.toThrow('Duplicate prepared series ID: "duplicate"');
});

test.each([undefined, 8])(
    'preparation retains raw options and geometry receives merged defaults: %s',
    async (offset) => {
        const point = {at: 10, amount: 20, caption: 'Orders'};
        const options =
            offset === undefined ? undefined : Object.freeze({sample: Object.freeze({offset})});
        const prepareSeries = jest.spyOn(samplePlugin, 'prepareSeries');
        const prepareShapeData = jest.spyOn(samplePlugin, 'prepareShapeData');
        const series = await getPreparedSeries({
            seriesData: [{type: 'sample', data: [point]}] as unknown as ChartSeries[],
            seriesOptions: options as unknown as ChartSeriesOptions,
            colors: ['black'],
            preparedLegend: legend,
        });
        await getShapes({
            ...bounds,
            series,
            seriesOptions: getPreparedOptions(options as unknown as ChartSeriesOptions),
            clipPathId: 'plot',
            htmlLayout: null,
            split: {plots: [], gap: 0},
            xAxis: null,
            yAxis: [],
        });
        expect(prepareSeries.mock.calls[0][0].seriesOptions).toBe(options);
        expect(prepareShapeData.mock.calls[0][0].seriesOptions).toEqual(
            expect.objectContaining({sample: {offset: offset ?? 4}}),
        );
        expect(samplePlugin.defaults).toEqual({offset: 4});
    },
);

test.each(['chunks', 'xLookupPoints'] as const)(
    '%s selection preserves custom fields and original points',
    async (strategy) => {
        const point = {at: 10, amount: 20, caption: 'Orders'};
        const [series] = await samplePlugin.prepareSeries({
            series: [{type: 'sample', data: [point]}],
            colorScale: colorScale(),
            colors: ['black'],
            legend,
        });
        const chunk = {series, data: point, caption: 'Value'};
        jest.spyOn(samplePlugin.tooltip, 'prepareData').mockReturnValue(
            strategy === 'chunks'
                ? {
                      chunks: [
                          {...chunk, closest: true},
                          {...chunk, caption: 'Details'},
                      ],
                  }
                : {xLookupPoints: [{...chunk, x: 10, y0: 20, y1: 20}]},
        );
        const chunks = getClosestPoints({
            ...bounds,
            position: [10, 20],
            shapesData: [{type: 'sample', data: {}}],
        });
        expect(chunks).toMatchObject(
            strategy === 'chunks'
                ? [{caption: 'Value', closest: true}, {caption: 'Details'}]
                : [{caption: 'Value', closest: true}],
        );
        expect(chunks.every((item) => item.data === point)).toBe(true);
    },
);

test('an isolated registry resolves only registered defaults and never mutates them', () => {
    jest.isolateModules(() => {
        const registry = jest.requireActual<typeof Registry>('../seriesRegistry');
        const options = jest.requireActual<typeof Options>('../prepare-options');
        expect(registry.getRegisteredSeriesTypes()).toEqual([]);
        expect(options.getPreparedOptions()).toEqual({});
        expect(() => registry.getSeriesPlugin('sample')).toThrow('Unknown series type');
        registry.registerSeriesPlugin(samplePlugin);
        expect(registry.getRegisteredSeriesTypes()).toEqual(['sample']);
        expect(options.getPreparedOptions()).toEqual({sample: {offset: 4}});
        // Replace a declaration without importing or registering any built-in plugin.
        registry.registerSeriesPlugin({...samplePlugin, defaults: {offset: 9}});
        expect(options.getPreparedOptions()).toEqual({sample: {offset: 9}});
        expect(registry.hasSeriesPlugin('line')).toBe(false);
    });
});
