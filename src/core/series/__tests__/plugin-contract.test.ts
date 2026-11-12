/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleOrdinal} from 'd3-scale';

import {getShapes} from '../../../hooks/useShapes';
import type {ChartSeries} from '../../../types';
import {getChartClosest, getClosestPoints} from '../../utils/get-closest-data';
import type * as Options from '../prepare-options';
import {getPreparedOptions} from '../prepare-options';
import {prepareSeriesMetadata} from '../prepare-series-metadata';
import {getPreparedSeries} from '../prepareSeries';
import type * as Registry from '../seriesRegistry';
import {registerSeriesPlugin} from '../seriesRegistry';
import type {PreparedLegendOptions} from '../types';
import {getActiveLegendItems, getAllLegendItems, getVisibleSeries} from '../utils';

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
    expect(metadata).toMatchObject({
        id: 'explicit',
        name: 'Orders',
        color: 'black',
        visible: false,
        cursor: 'pointer',
        legend: {enabled: true, groupId: 'orders', itemText: 'All orders'},
    });
    expect(metadata.legend.source).toBe(source.legend);
    expect(metadata.tooltip).toBe(tooltip);
    expect(metadata.custom).toBe(custom);
});

test('custom series pass legend and visibility stages even with the legend disabled', async () => {
    const raw: SampleSeries = {type: 'sample', data: []};
    const series = await samplePlugin.prepareSeries({
        series: [raw],
        colorScale: colorScale(),
        colors: ['black'],
        legend,
    });
    expect(getAllLegendItems(series)).toEqual([]);
    expect(getActiveLegendItems(series)).toEqual([]);
    expect(getVisibleSeries({preparedSeries: series, activeLegendItems: []})).toEqual(series);
    expect(series[0]).toMatchObject({visible: true, cursor: null, legend: {enabled: false}});
    expect(raw).toEqual({type: 'sample', data: []});
});

test('independently prepared layers have distinct IDs and preserve explicit IDs', async () => {
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

test('core routes opaque lookup payloads to their owner for tooltip and chart queries', async () => {
    const first = {at: 10, amount: 20, caption: 'Orders'};
    const second = {at: 60, amount: 70, caption: 'Returns'};
    const series = await prepare([
        {type: 'sample', data: [first]},
        {type: 'sample', data: [second]},
    ]);
    const result = await getShapes({
        ...bounds,
        series,
        seriesOptions: getPreparedOptions(),
        clipPathId: 'plot',
        htmlLayout: null,
        split: {plots: [], gap: 0},
        xAxis: null,
        yAxis: [],
    });
    expect(result.shapes).toHaveLength(2);
    expect(new Set(result.shapes.map((shape) => shape.key)).size).toBe(2);
    const args = {...bounds, shapesData: result.shapesData, layerIndexes: result.layerIndexes};
    const hovered = getClosestPoints({...args, position: [14, 20]});
    expect(hovered).toHaveLength(1);
    expect(hovered[0].data).toBe(first);
    expect(hovered[0].closest).toBe(true);
    expect(hovered[0]).not.toHaveProperty('distance');
    expect(
        getChartClosest({
            ...args,
            position: [64, 70],
            mode: 'chart',
            seriesOrder: series.map((item) => item.id),
        })?.point,
    ).toBe(second);
    expect(
        getChartClosest({
            ...args,
            position: [14, 20],
            mode: 'tooltip',
            seriesOrder: series.map((item) => item.id),
        })?.point,
    ).toBe(first);
});

test('multiple SVG targets retain their own series and original point', async () => {
    const first = {at: 10, amount: 20, caption: 'Orders'};
    const second = {at: 30, amount: 40, caption: 'Returns'};
    const series = await samplePlugin.prepareSeries({
        series: [
            {type: 'sample', data: [first]},
            {type: 'sample', data: [second]},
        ],
        colorScale: colorScale(),
        colors: ['black'],
        legend,
    });
    const {renderData} = await samplePlugin.prepareShapeData({
        ...bounds,
        series,
        seriesOptions: {},
    });
    const plot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    // eslint-disable-next-line testing-library/render-result-naming-convention -- Plugin returns a cleanup function.
    const cleanup = samplePlugin.renderShapes({
        ...bounds,
        plot,
        labelsPlot: plot,
        preparedData: renderData,
        seriesOptions: {},
    });
    const targets =
        samplePlugin.interaction?.getTargetElements({
            plot,
            markers: plot,
            preparedData: renderData,
        }) ?? [];
    expect(targets).toHaveLength(2);
    expect(new Set(targets.map((target) => target.element)).size).toBe(2);
    expect(targets[0].item.series).toBe(series[0]);
    expect(targets[0].item.point).toBe(first);
    expect(targets[1].item.series).toBe(series[1]);
    expect(targets[1].item.point).toBe(second);
    cleanup?.();
});

test('direct tooltip selection preserves intentionally distinct chunks for one sample', async () => {
    const point = {at: 10, amount: 20, caption: 'Orders'};
    const series = await samplePlugin.prepareSeries({
        series: [{type: 'sample', data: [point]}],
        colorScale: colorScale(),
        colors: ['black'],
        legend,
    });
    jest.spyOn(samplePlugin.tooltip, 'prepareData').mockReturnValue({
        chunks: [
            {series: series[0], data: point, caption: 'Value', closest: true},
            {series: series[0], data: point, caption: 'Details'},
        ],
    });
    const chunks = getClosestPoints({
        ...bounds,
        position: [10, 20],
        shapesData: [{type: 'sample', data: {}}],
    });
    expect(chunks).toHaveLength(2);
    expect(chunks.map((chunk) => chunk.data)).toEqual([point, point]);
});

test('X selection retains the custom chunk fields needed by formatters', async () => {
    const point = {at: 10, amount: 20, caption: 'Orders'};
    const series = await samplePlugin.prepareSeries({
        series: [{type: 'sample', data: [point]}],
        colorScale: colorScale(),
        colors: ['black'],
        legend,
    });
    jest.spyOn(samplePlugin.tooltip, 'prepareData').mockReturnValue({
        xLookupPoints: [{series: series[0], data: point, caption: 'Orders', x: 10, y0: 20, y1: 20}],
    });
    const chunks = getClosestPoints({
        ...bounds,
        position: [10, 20],
        shapesData: [{type: 'sample', data: {}}],
    });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({caption: 'Orders', closest: true});
    expect(chunks[0].data).toBe(point);
});

test('a standalone plugin keeps its data types through preparation, rendering and interaction', async () => {
    const sample = {at: 10, amount: 20, caption: 'Orders'};
    const raw: SampleSeries = {type: 'sample', data: [sample]};
    samplePlugin.validate?.({series: raw, allSeries: [raw]});
    const series = await samplePlugin.prepareSeries({
        series: [raw],
        colorScale: scaleOrdinal<string, string>().range(['black']),
        colors: ['black'],
        legend: {enabled: false} as PreparedLegendOptions,
    });
    const {renderData, tooltipItems} = await samplePlugin.prepareShapeData({
        series,
        allSeries: series,
        seriesOptions: {sample: {offset: 4}},
        boundsWidth: 100,
        boundsHeight: 100,
    });
    const plot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    // eslint-disable-next-line testing-library/render-result-naming-convention -- renderShapes returns a cleanup function.
    const cleanup = samplePlugin.renderShapes({
        plot,
        labelsPlot: plot,
        preparedData: renderData,
        seriesOptions: {},
        boundsWidth: 100,
        boundsHeight: 100,
    });
    expect(plot.querySelector('circle')?.getAttribute('cx')).toBe('14');
    expect(
        samplePlugin.interaction?.getTargetElements({
            plot,
            markers: plot,
            preparedData: renderData,
        })[0].item.point,
    ).toBe(sample);
    const lookupArgs = {
        data: tooltipItems,
        position: [14, 20] as [number, number],
        boundsWidth: 100,
        boundsHeight: 100,
    };
    expect(samplePlugin.interaction?.prepareNearestData(lookupArgs)[0]).toMatchObject({
        position: [14, 20],
        item: {point: sample},
    });
    const {chunks = []} = samplePlugin.tooltip.prepareData({
        ...lookupArgs,
        measureDistance: false,
    });
    expect(chunks[0].data).toBe(sample);
    expect(chunks).toHaveLength(1);
    expect(samplePlugin.tooltip.getValue?.({item: chunks[0]})).toBe(20);
    expect(samplePlugin.tooltip.getValueFormatContext?.(chunks[0])).toEqual({caption: 'Orders'});
    expect(samplePlugin.interaction?.getClosestItem?.(chunks[0]).point).toBe(sample);
    expect(raw.data).toEqual([sample]);
    cleanup?.();
    expect(plot.children).toHaveLength(0);
});

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
