import {linePlugin} from '../../../plugins/line';
import {scatterPlugin} from '../../../plugins/scatter';
import type {ChartInteractionItem} from '../../../types';
import {registerSeriesPlugin} from '../../series/seriesRegistry';
import type {PreparedLineData} from '../../shapes/line/types';
import type {PreparedScatterData} from '../../shapes/scatter/types';
import {getChartClosest} from '../get-closest-data';
import {getNearestItem} from '../nearest-point';

beforeAll(() => {
    registerSeriesPlugin(linePlugin);
    registerSeriesPlugin(scatterPlugin);
});

const lineSeries = {type: 'line', id: 'line', name: 'Line', color: 'red'} as const;
const scatterSeries = {
    type: 'scatter',
    id: 'scatter',
    name: 'Scatter',
    marker: {states: {normal: {symbol: 'circle', radius: 3, borderWidth: 0}}},
} as const;
const near: ChartInteractionItem = {series: lineSeries, point: {x: 6, y: 1}};
const far: ChartInteractionItem = {series: scatterSeries, point: {x: 5, y: 9}};

const line = {
    series: lineSeries,
    linecap: 'round',
    lineWidth: 2,
    markers: [],
    getSegments: () => [{x1: 49, y1: 90, x2: 60, y2: 10, halfWidth: 1}],
    points: [
        {x: 49, y: 90, data: {x: 4.9, y: 9}, series: lineSeries},
        {x: 60, y: 10, data: near.point, series: lineSeries},
    ],
} as unknown as PreparedLineData;

test('chart lookup compares both axes before discarding any line vertices', () => {
    const args = {
        position: [50, 10] as [number, number],
        boundsWidth: 100,
        boundsHeight: 100,
        shapesData: [line],
        seriesOrder: ['line'],
    };
    expect(getChartClosest({...args, mode: 'chart'})).toEqual({
        point: near.point,
        series: {type: 'line', id: 'line', name: 'Line'},
    });
    expect(getChartClosest({...args, mode: 'tooltip'})?.point).toEqual({x: 4.9, y: 9});
});

test.each([false, true])(
    'mixed-series lookup is independent of plugin order (reverse: %s)',
    (reverse) => {
        const scatter = {
            point: {x: 50, y: 90, data: far.point, series: scatterSeries},
            clipped: false,
        } as PreparedScatterData;
        const shapesData = reverse ? [scatter, line] : [line, scatter];
        const args = {
            position: [60, 10] as [number, number],
            boundsWidth: 100,
            boundsHeight: 100,
            shapesData,
            seriesOrder: reverse ? ['scatter', 'line'] : ['line', 'scatter'],
        };
        expect(getChartClosest({...args, mode: 'chart'})).toEqual({
            point: near.point,
            series: {type: 'line', id: 'line', name: 'Line'},
        });
        expect(getChartClosest({...args, mode: 'tooltip'})).toEqual({
            point: near.point,
            series: {type: 'line', id: 'line', name: 'Line'},
        });
    },
);

test('equal pixel distances follow series order rather than plugin order', () => {
    const candidates = [
        {position: [0, 5] as [number, number], item: far},
        {position: [5, 0] as [number, number], item: near},
    ];
    expect(getNearestItem([0, 0], candidates, ['line', 'scatter'])).toBe(near);
    expect(getNearestItem([0, 0], candidates, ['scatter', 'line'])).toBe(far);
});

test('equal distances within one series keep the first candidate', () => {
    const second: ChartInteractionItem = {series: lineSeries, point: {x: 0, y: 5}};
    expect(
        getNearestItem(
            [0, 0],
            [
                {position: [5, 0], item: near},
                {position: [0, 5], item: second},
            ],
            ['line'],
        ),
    ).toBe(near);
});

test('empty and non-finite candidate positions have no nearest item', () => {
    expect(getNearestItem([0, 0], [], [])).toBeNull();
    expect(
        getNearestItem(
            [0, 0],
            [
                {position: [NaN, 0], item: near},
                {position: [0, Infinity], item: far},
            ],
            [],
        ),
    ).toBeNull();
});

test.each(['chart', 'tooltip'] as const)('ignores unregistered shapes in %s queries', (mode) => {
    const args = {
        mode,
        position: [60, 10] as [number, number],
        boundsWidth: 100,
        boundsHeight: 100,
        seriesOrder: ['line'],
    };
    const unknown = {series: {type: 'unregistered'}};
    expect(getChartClosest({...args, shapesData: [unknown]})).toBeNull();
    expect(getChartClosest({...args, shapesData: [unknown, line]})).toEqual(
        getChartClosest({...args, shapesData: [line]}),
    );
});
