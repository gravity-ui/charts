import type {ChartSeries} from '../../../types';
import {getSeriesLayers} from '../layers';
import {getSeriesPlugin} from '../seriesRegistry';

const raw: ChartSeries[] = [
    {type: 'line', name: 'A', data: []},
    {type: 'bar-x', name: 'B', data: []},
    {type: 'line', name: 'C', data: []},
    {type: 'bar-x', name: 'D', data: []},
];

afterEach(() => jest.restoreAllMocks());

it('handles empty input without requiring any registered plugins', () => {
    expect(getSeriesLayers([], () => 'unused')).toEqual([]);
});

it.each([
    {name: 'distinct objects', input: raw, expected: [[raw[0]], [raw[1], raw[3]], [raw[2]]]},
    {
        name: 'repeated objects',
        input: [raw[0], raw[1], raw[0]],
        expected: [[raw[0]], [raw[1]], [raw[0]]],
    },
])('groups layers in first-occurrence order with $name', ({input, expected}) => {
    const layers = getSeriesLayers(input, (series, index) => `${series.type}_${index}`);
    expect(layers.map((layer) => layer.key)).toEqual(['line_0', 'bar-x', 'line_2']);
    expect(layers.map((layer) => layer.series)).toEqual(expected);
    expect(layers[0].series[0]).toBe(input[0]);
});

it('groups equal plugin keys without changing first-occurrence order', () => {
    jest.spyOn(getSeriesPlugin('line'), 'getLayerKey').mockReturnValue('1');
    const layers = getSeriesLayers(raw, (series, index) => `${series.type}_${index}`);
    expect(layers).toEqual([
        {key: '1', series: [raw[0], raw[2]]},
        {key: 'bar-x', series: [raw[1], raw[3]]},
    ]);
});

it('rejects layer keys shared by different plugins before dispatching series', () => {
    jest.spyOn(getSeriesPlugin('line'), 'getLayerKey').mockReturnValue('bar-x');
    expect(() => getSeriesLayers(raw, (series, index) => `${series.type}_${index}`)).toThrow(
        'Layer key "bar-x" is shared by different series types',
    );
});
