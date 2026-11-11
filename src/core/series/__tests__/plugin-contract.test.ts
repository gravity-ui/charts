/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleOrdinal} from 'd3-scale';

import type * as Options from '../prepare-options';
import type * as Registry from '../seriesRegistry';
import type {PreparedLegendOptions} from '../types';

import {samplePlugin} from './fixtures/custom-plugin';
import type {SampleSeries} from './fixtures/custom-plugin';

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
    const {chunks, xLookupPoints} = samplePlugin.tooltip.prepareData({
        ...lookupArgs,
        measureDistance: false,
    });
    expect(chunks[0].data).toBe(sample);
    expect(xLookupPoints?.[0].data).toBe(sample);
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
