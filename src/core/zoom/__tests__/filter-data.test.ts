import type {DomainViewport} from '../../series/axis-contract';
import {getPreparedSeries} from '../../series/prepareSeries';
import type {PreparedLegendOptions} from '../../series/types';
import type {ChartSeries, ChartXAxis, ChartYAxis, LineSeries} from '../../types';
import {filterPoints} from '../filter-data';
import type {ZoomState} from '../types';
import {getZoomedSeriesData} from '../zoom';

const viewport: DomainViewport = {x: {type: 'linear', range: [2, 4]}, y: {type: 'linear'}};

interface LineSelectionCase {
    title: string;
    series: LineSeries;
    zoomState: Partial<ZoomState>;
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis[];
    visible: boolean;
}

test.each<LineSelectionCase>([
    {
        title: 'a null gap crossing X',
        series: {
            type: 'line',
            name: 'Gap',
            data: [
                {x: 0, y: 20},
                {x: 10, y: null},
                {x: 20, y: 80},
            ],
        },
        zoomState: {x: [2, 4]},
        visible: false,
    },
    {
        title: 'a segment crossing X outside the selected Y range',
        series: {
            type: 'line',
            name: 'Line',
            data: [
                {x: 0, y: 20},
                {x: 10, y: 80},
            ],
        },
        zoomState: {x: [2, 4], y: [[65, 75]]},
        visible: false,
    },
    {
        title: 'a curve missing the selected rectangle',
        series: {
            type: 'line',
            name: 'Curve',
            interpolation: {type: 'cardinal'},
            data: [
                {x: 0, y: 20},
                {x: 10, y: 80},
                {x: 0, y: 90},
            ],
        },
        zoomState: {x: [2, 4], y: [[65, 75]]},
        visible: false,
    },
    {
        title: 'a segment entering adjacent rectangle edges',
        series: {
            type: 'line',
            name: 'Line',
            data: [
                {x: 0, y: 60},
                {x: 60, y: 0},
            ],
        },
        zoomState: {x: [20, 80], y: [[20, 80]]},
        visible: true,
    },
    {
        title: 'a corner crossing beside a separate segment outside the selected rectangle',
        series: {
            type: 'line',
            name: 'Line',
            data: [
                {x: 0, y: 60},
                {x: 60, y: 0},
                {x: 90, y: null},
                {x: 0, y: 90},
                {x: 100, y: 90},
            ],
        },
        zoomState: {x: [20, 80], y: [[20, 80]]},
        visible: true,
    },
    {
        title: 'an excluded plot',
        series: {
            type: 'line',
            name: 'Other plot',
            yAxis: 1,
            data: [
                {x: 0, y: 20},
                {x: 10, y: 80},
            ],
        },
        zoomState: {x: [2, 4], y: [[30, 40], undefined]},
        yAxis: [{type: 'linear'}, {type: 'linear', plotIndex: 1}],
        visible: false,
    },
    {
        title: 'a segment crossing the selected rectangle',
        series: {
            type: 'line',
            name: 'Line',
            data: [
                {x: 0, y: 20},
                {x: 10, y: 80},
            ],
        },
        zoomState: {x: [2, 4], y: [[35, 40]]},
        visible: true,
    },
    {
        title: 'a segment crossing the rectangle on logarithmic X',
        series: {
            type: 'line',
            name: 'Line',
            data: [
                {x: 1, y: 20},
                {x: 100, y: 80},
            ],
        },
        zoomState: {x: [10, 20], y: [[45, 65]]},
        xAxis: {type: 'logarithmic'},
        visible: true,
    },
    {
        title: 'a segment crossing X with category names on Y',
        series: {
            type: 'line',
            name: 'Line',
            data: [
                {x: 0, y: 'Low'},
                {x: 10, y: 'High'},
            ],
        },
        zoomState: {x: [2, 4]},
        yAxis: [{type: 'category', categories: ['Low', 'Middle', 'High']}],
        visible: true,
    },
])('line selection retains geometry only for a visible path: $title', async (args) => {
    const series = await getPreparedSeries({
        seriesData: [args.series],
        seriesOptions: undefined,
        colors: ['black'],
        preparedLegend: {enabled: false} as PreparedLegendOptions,
    });
    const selection = getZoomedSeriesData({
        seriesData: series,
        zoomState: args.zoomState,
        xAxis: args.xAxis,
        yAxis: args.yAxis,
    });
    expect(selection.preparedSeries[0].data).toEqual([]);
    expect(selection.preparedShapesSeries[0].data).toEqual(args.visible ? args.series.data : []);
});

test.each(['area', 'area-range'] as const)(
    '%s retains crossing geometry only when missing points are connected',
    async (type) => {
        for (const nullMode of ['skip', 'connect'] as const) {
            const source: ChartSeries =
                type === 'area'
                    ? {
                          type,
                          name: 'Gap',
                          nullMode,
                          data: [
                              {x: 0, y: 20},
                              {x: 10, y: null},
                              {x: 20, y: 80},
                          ],
                      }
                    : {
                          type,
                          name: 'Gap',
                          nullMode,
                          data: [
                              {x: 0, y0: 10, y1: 20},
                              {x: 10, y0: null, y1: 30},
                              {x: 20, y0: 40, y1: 80},
                          ],
                      };
            const series = await getPreparedSeries({
                seriesData: [source],
                seriesOptions: undefined,
                colors: ['black'],
                preparedLegend: {enabled: false} as PreparedLegendOptions,
            });
            const selection = getZoomedSeriesData({seriesData: series, zoomState: {x: [2, 4]}});
            expect(selection.preparedSeries[0].data).toEqual([]);
            const anchors = selection.preparedShapesSeries[0].data;
            if (!Array.isArray(anchors)) throw new Error('Expected point data');
            expect(anchors).toEqual(nullMode === 'connect' ? [source.data[0], source.data[2]] : []);
            if (nullMode === 'connect') {
                expect(anchors[0]).toBe(source.data[0]);
                expect(anchors[1]).toBe(source.data[2]);
            }
            expect(source.data).toHaveLength(3);
        }
    },
);

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
