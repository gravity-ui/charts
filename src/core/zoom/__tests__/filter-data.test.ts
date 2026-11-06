import type {DomainViewport} from '../../series/axis-contract';
import {getPreparedSeries} from '../../series/prepareSeries';
import type {PreparedLegendOptions} from '../../series/types';
import {filterPoints} from '../filter-data';
import {getZoomedSeriesData} from '../zoom';

const viewport: DomainViewport = {x: {type: 'linear', range: [2, 4]}, y: {type: 'linear'}};

test('custom coordinate readers preserve original samples without requiring core point types', () => {
    const points = [
        {at: 0, amount: 20},
        {at: 3, amount: 30},
        {at: 10, amount: 80},
    ];
    const result = filterPoints(points, viewport, {
        getX: (p) => p.at,
        getY: (p) => p.amount,
        mode: 'path',
    });
    expect(result.data).toEqual([points[1]]);
    expect(result.data[0]).toBe(points[1]);
    expect(result.shapeData).toEqual(points);
    expect(result.shapeData?.[0]).toBe(points[0]);
});

test('retains crossing X and Y segments without interior samples or duplicate anchors', () => {
    const points = [
        {x: 0, y: 20},
        {x: 10, y: 80},
    ];
    const x = filterPoints(points, viewport, {mode: 'path'});
    expect(x.data).toEqual([]);
    expect(x.shapeData).toEqual(points);
    const y = filterPoints(
        points,
        {x: {type: 'linear'}, y: {type: 'linear', range: [30, 40]}},
        {mode: 'path'},
    );
    expect(y.data).toEqual([]);
    expect(y.shapeData).toEqual(points);
    const data = Array.from({length: 6}, (_, index) => ({x: index, y: index}));
    const selected = filterPoints(
        data,
        {x: {type: 'linear', range: [1, 4]}, y: {type: 'linear'}},
        {mode: 'path'},
    );
    expect(selected.shapeData).toEqual(data);
});

test('coordinate dimensions determine stack filtering and excluded plots stay empty', () => {
    const points = [
        {x: 3, y: 1},
        {x: 10, y: 100},
    ];
    const view: DomainViewport = {...viewport, y: {type: 'linear', range: [50, 200]}};
    expect(filterPoints(points, view).data).toEqual([]);
    expect(filterPoints(points, view, {axes: 'x'}).data).toEqual([points[0]]);
    const excluded: DomainViewport = {...viewport, y: {type: 'linear', excluded: true}};
    expect(filterPoints(points, excluded).data).toEqual([]);
    const crossing = [
        {x: 0, y: 20},
        {x: 10, y: 80},
    ];
    expect(filterPoints(crossing, excluded, {mode: 'path'}).shapeData).toEqual([]);
    expect(filterPoints(points, excluded, {axes: 'x'}).data).toEqual([points[0]]);
});

test('connect preprocessing retains crossing geometry and leaves missing raw fields untouched', async () => {
    const data = [{x: -5, y: 20}, {x: 1}, {x: 20, y: 80}];
    const series = await getPreparedSeries({
        seriesData: [{type: 'line', name: 'Line', nullMode: 'connect', data}],
        seriesOptions: undefined,
        colors: ['black'],
        preparedLegend: {enabled: false} as PreparedLegendOptions,
    });
    const result = getZoomedSeriesData({seriesData: series, zoomState: {x: [2, 4]}});
    expect(result.preparedSeries[0].data).toEqual([]);
    expect(result.preparedShapesSeries[0].data).toEqual([data[0], data[2]]);
    expect(data[1]).toEqual({x: 1});
});

test('x-range keeps legacy endpoint selection rather than changing interval-overlap semantics', async () => {
    const data = [
        {x0: 0, x1: 10, y: 1},
        {x0: 0, x1: 2, y: 1},
    ];
    const series = await getPreparedSeries({
        seriesData: [{type: 'x-range', name: 'Intervals', data}],
        seriesOptions: undefined,
        colors: ['black'],
        preparedLegend: {enabled: false} as PreparedLegendOptions,
    });
    const result = getZoomedSeriesData({seriesData: series, zoomState: {x: [2, 4]}});
    expect(result.preparedSeries[0].data).toEqual([data[1]]);
});
