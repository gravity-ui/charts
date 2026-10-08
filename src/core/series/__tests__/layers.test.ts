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

it.each([
    {
        name: 'distinct objects',
        input: raw,
        sharedLineKeys: new Map<string, string>(),
        expected: [[raw[0]], [raw[1], raw[3]], [raw[2]]],
    },
    {
        name: 'repeated objects',
        input: [raw[0], raw[1], raw[2], raw[0]],
        sharedLineKeys: new Map([['line_3', 'line_2']]),
        expected: [[raw[0]], [raw[1]], [raw[2], raw[0]]],
    },
])('groups plugin keys in source order with $name', ({input, sharedLineKeys, expected}) => {
    jest.isolateModules(() => {
        const registry = jest.requireActual<typeof Registry>('../seriesRegistry');
        const {getSeriesLayers: resolveLayers} = jest.requireActual<typeof Layers>('../layers');
        expect(registry.getRegisteredSeriesTypes()).toEqual([]);
        const line: SeriesPlugin = {
            type: 'line',
            getLayerKey: ({seriesKey}) => sharedLineKeys.get(seriesKey) ?? seriesKey,
            prepareSeries: () => [],
            prepareShapeData: () => ({renderData: [], tooltipItems: []}),
            renderShapes: () => {},
            tooltip: {prepareData: () => ({chunks: []}), rows: []},
        };
        registry.registerSeriesPlugin(line);
        registry.registerSeriesPlugin({
            ...line,
            type: 'bar-x',
            getLayerKey: ({series}) => series.type,
        });
        const getKey = jest.fn((series: ChartSeries, index: number) => `${series.type}_${index}`);
        const layers = resolveLayers(input, getKey);
        expect(layers.map((layer) => layer.key)).toEqual(['line_0', 'bar-x', 'line_2']);
        expect(layers.map((layer) => layer.series)).toEqual(expected);
        expect(getKey.mock.calls.map(([, index]) => index)).toEqual([0, 1, 2, 3]);
        layers.forEach((layer, index) => {
            layer.series.forEach((series, member) => expect(series).toBe(expected[index][member]));
        });
    });
});
