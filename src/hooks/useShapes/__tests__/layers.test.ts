/** @jest-environment jsdom */
import type {PreparedYAxis} from '~core/axes/types';
import {getPreparedOptions} from '~core/series/prepare-options';
import {getPreparedSeries} from '~core/series/prepareSeries';
import {getSeriesPlugin} from '~core/series/seriesRegistry';
import type {PreparedLegendOptions, PreparedSeries} from '~core/series/types';
import type {SeriesShapeData, ShapeLabels} from '~core/shapes/types';
import type {ChartSeries} from '~core/types';
import type {ZoomState} from '~core/zoom/types';

import {getShapes} from '..';

const rawSeries: ChartSeries[] = [
    {type: 'line', name: 'line1', data: [{x: 0, y: 1}]},
    {type: 'bar-x', name: 'bar1.1', stacking: 'normal', stackId: 'stack', data: [{x: 0, y: 2}]},
    {type: 'bar-x', name: 'bar1.2', stacking: 'normal', stackId: 'stack', data: [{x: 0, y: 3}]},
    {type: 'line', name: 'line2', data: [{x: 0, y: 4}]},
    {type: 'bar-x', name: 'bar2', data: [{x: 0, y: 5}]},
];

function prepare(seriesData = rawSeries) {
    return getPreparedSeries({
        seriesData,
        colors: ['red', 'blue'],
        seriesOptions: {},
        preparedLegend: {enabled: false} as PreparedLegendOptions,
    });
}

function createShape(): SeriesShapeData {
    return {htmlLabels: [], markers: [], annotations: [], getHoverMarkers: () => []};
}

function getShapeArgs(series: PreparedSeries[]) {
    return {
        series,
        boundsWidth: 400,
        boundsHeight: 200,
        clipPathId: 'plot',
        htmlLayout: null,
        seriesOptions: getPreparedOptions(),
        split: {plots: [], gap: 0},
        xAxis: null,
        yAxis: [],
    };
}

afterEach(() => jest.restoreAllMocks());

it('preserves independent lines and one bar group across interleaved raw series', async () => {
    const original = JSON.parse(JSON.stringify(rawSeries));
    const line = jest.spyOn(getSeriesPlugin('line'), 'prepareSeries');
    const bars = jest.spyOn(getSeriesPlugin('bar-x'), 'prepareSeries');
    const prepared = await prepare();

    expect(line.mock.calls.map(([args]) => args.series.map((s) => 'name' in s && s.name))).toEqual([
        ['line1'],
        ['line2'],
    ]);
    expect(bars.mock.calls.map(([args]) => args.series.map((s) => 'name' in s && s.name))).toEqual([
        ['bar1.1', 'bar1.2', 'bar2'],
    ]);
    expect(prepared.map((s) => s.name)).toEqual(['line1', 'bar1.1', 'bar1.2', 'bar2', 'line2']);
    expect(rawSeries).toEqual(original);
});

it('prepares upper layers first and preserves rendered keys and tooltip order', async () => {
    const series = await prepare();
    const calls: {names: string[]; obstacles: string[]}[] = [];
    const shapeIds = new Map<ShapeLabels, string>();
    for (const type of ['line', 'bar-x']) {
        jest.spyOn(getSeriesPlugin(type), 'prepareShapeData').mockImplementation(async (args) => {
            calls.push({
                names: args.series.map((s) => s.name),
                obstacles: (args.otherLayers ?? []).map((layer) => shapeIds.get(layer)!),
            });
            const renderData = args.series.map((s) => {
                const data = createShape();
                shapeIds.set(data, s.id);
                return data;
            });
            return {
                renderData,
                tooltipItems: args.series.map((s) => ({series: s})),
            };
        });
    }
    const {shapes, shapesData} = await getShapes(getShapeArgs(series));
    expect(calls).toEqual([
        {names: ['line2'], obstacles: []},
        {names: ['bar1.1', 'bar1.2', 'bar2'], obstacles: [series[4].id]},
        {names: ['line1'], obstacles: [series[4].id, series[1].id, series[2].id, series[3].id]},
    ]);
    expect(shapes.map((shape) => shape.key)).toEqual([series[0].id, 'bar-x', series[4].id]);
    expect(shapes.map((shape) => shape.props.namespace)).toEqual([
        `hover-markers-${series[0].id}`,
        'hover-markers-bar-x',
        `hover-markers-${series[4].id}`,
    ]);
    expect(shapesData.map((item) => item.series)).toEqual([
        series[0],
        series[4],
        series[1],
        series[2],
        series[3],
    ]);
});

interface ClipCase {
    name: string;
    type: 'line' | 'scatter' | 'bar-x' | 'pie';
    yAxis?: PreparedYAxis[];
    zoomState?: Partial<ZoomState>;
    isRangeSlider?: boolean;
    clip?: string;
}

it.each<ClipCase>([
    {name: 'line without bounds', type: 'line', clip: 'plot-horizontal'},
    {name: 'line with empty zoom', type: 'line', zoomState: {}, clip: 'plot-horizontal'},
    {name: 'line with zero min', type: 'line', yAxis: [{min: 0} as PreparedYAxis], clip: 'plot'},
    {
        name: 'line with max on another axis',
        type: 'line',
        yAxis: [{} as PreparedYAxis, {max: 10} as PreparedYAxis],
        clip: 'plot',
    },
    {name: 'line with X zoom', type: 'line', zoomState: {x: [0, 1]}, clip: 'plot'},
    {name: 'line with Y zoom', type: 'line', zoomState: {y: [[0, 1]]}, clip: 'plot'},
    {name: 'line preview without Y bounds', type: 'line', isRangeSlider: true, clip: 'plot'},
    {name: 'scatter without clipping', type: 'scatter'},
    {name: 'scatter preview', type: 'scatter', isRangeSlider: true, clip: 'plot'},
    {name: 'bar with default clipping', type: 'bar-x', clip: 'plot'},
    {name: 'pie without clipping', type: 'pie'},
])('selects clipping for $name', async ({type, yAxis = [], zoomState, isRangeSlider, clip}) => {
    const series = await prepare([
        type === 'pie'
            ? {type, data: [{name: 'slice', value: 1}]}
            : {type, name: 'series', data: [{x: 0, y: 1}]},
    ]);
    jest.spyOn(getSeriesPlugin(type), 'prepareShapeData').mockResolvedValue({
        renderData: [createShape()],
        tooltipItems: [],
    });
    const {shapes} = await getShapes({
        ...getShapeArgs(series),
        yAxis,
        zoomState,
        isRangeSlider,
    });
    expect(shapes[0].props.clipPathId).toBe(clip);
});

it.each([
    [0, 200],
    [400, 0],
    [-1, 200],
    [400, -1],
])(
    'skips shape preparation without drawable space (%s × %s)',
    async (boundsWidth, boundsHeight) => {
        const series = await prepare();
        const line = jest.spyOn(getSeriesPlugin('line'), 'prepareShapeData');
        const bars = jest.spyOn(getSeriesPlugin('bar-x'), 'prepareShapeData');
        const result = await getShapes({
            ...getShapeArgs(series),
            boundsWidth,
            boundsHeight,
        });
        expect(result).toEqual({shapes: [], shapesData: []});
        expect(line).not.toHaveBeenCalled();
        expect(bars).not.toHaveBeenCalled();
    },
);
