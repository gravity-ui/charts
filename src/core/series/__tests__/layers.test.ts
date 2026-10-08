import type {ChartSeries} from '../../../types';
import {getSeriesLayers} from '../layers';
import type * as Layers from '../layers';
import type {SeriesPlugin} from '../plugin';
import type * as Registry from '../seriesRegistry';

const raw: ChartSeries[] = [
    {type: 'line', name: 'A', data: []},
    {type: 'bar-x', name: 'B', data: []},
    {type: 'line', name: 'C', data: []},
    {type: 'bar-x', name: 'D', data: []},
];

it('handles empty input without requiring any registered plugins', () => {
    expect(getSeriesLayers([], () => 'unused')).toEqual([]);
});

it('preserves raw occurrence keys when one object appears twice', () => {
    const input = [raw[0], raw[1], raw[0]];
    const result = getSeriesLayers(input, (series, index) => `${series.type}_${index}`);
    expect(result.map((layer) => layer.key)).toEqual(['line_0', 'bar-x', 'line_2']);
    expect(result.map((layer) => layer.series)).toEqual([[raw[0]], [raw[1]], [raw[0]]]);
});

it('uses an isolated plugin registry and orders plugin layers by source position', () => {
    jest.isolateModules(() => {
        const registry = jest.requireActual<typeof Registry>('../seriesRegistry');
        const {getSeriesLayers: getLayers, getSingleSeriesLayer} =
            jest.requireActual<typeof Layers>('../layers');
        expect(registry.getRegisteredSeriesTypes()).toEqual([]);
        const line: SeriesPlugin = {
            type: 'line',
            getLayers: ({series, getSeriesKey}) =>
                series.map((item, index) => ({key: getSeriesKey(item, index), series: [item]})),
            prepareSeries: () => [],
            prepareShapeData: () => ({renderData: [], tooltipItems: []}),
            renderShapes: () => {},
            tooltip: {prepareData: () => ({chunks: []}), rows: []},
        };
        registry.registerSeriesPlugin(line);
        registry.registerSeriesPlugin({...line, type: 'bar-x', getLayers: getSingleSeriesLayer});
        const getKey = jest.fn((series: ChartSeries, index: number) => `${series.type}_${index}`);
        const layers = getLayers(raw, getKey);
        expect(layers.map((layer) => layer.key)).toEqual(['line_0', 'bar-x', 'line_2']);
        expect(layers.map((layer) => layer.series)).toEqual([[raw[0]], [raw[1], raw[3]], [raw[2]]]);
        expect(getKey.mock.calls.map(([, index]) => index)).toEqual([0, 2]);
        expect(layers[0].series[0]).toBe(raw[0]);
        expect(layers[1].series[1]).toBe(raw[3]);
    });
});
