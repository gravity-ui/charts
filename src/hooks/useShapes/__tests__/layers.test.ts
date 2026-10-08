/** @jest-environment jsdom */
import type React from 'react';

import type {PreparedYAxis} from '~core/axes/types';
import type {SeriesPlugin} from '~core/series/plugin';
import {getPreparedOptions} from '~core/series/prepare-options';
import {getPreparedSeries} from '~core/series/prepareSeries';
import {getSeriesPlugin} from '~core/series/seriesRegistry';
import type {PreparedLegendOptions, PreparedSeries} from '~core/series/types';
import type {SeriesShapeData, ShapeLabels} from '~core/shapes/types';
import type {BarXSeries, ChartSeries} from '~core/types';
import type {ZoomState} from '~core/zoom/types';

import {getShapes} from '..';
import type {SeriesShapes} from '../SeriesShapes';

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

it('lets a plugin read its own fields from raw and prepared series when grouping layers', async () => {
    const plugin: Pick<SeriesPlugin<BarXSeries>, 'getLayerKey'> = {
        getLayerKey: ({series}) => series.stackId ?? 'default',
    };
    const raw: BarXSeries = {type: 'bar-x', name: 'bar', stackId: 'stack', data: []};
    const prepared = await prepare([raw]);
    const bars = prepared.filter((series) => series.type === 'bar-x');
    expect(bars).toHaveLength(1);
    expect(plugin.getLayerKey({series: raw, seriesKey: 'raw'})).toBe('stack');
    expect(plugin.getLayerKey({series: bars[0], seriesKey: bars[0].id})).toBe('stack');
});

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

it.each<{
    name: string;
    yAxis: PreparedYAxis[];
    zoomState?: Partial<ZoomState>;
    isRangeSlider?: boolean;
    clip: string;
}>([
    {name: 'no bounds', yAxis: [], clip: 'plot-horizontal'},
    {name: 'empty zoom', yAxis: [], zoomState: {}, clip: 'plot-horizontal'},
    {name: 'zero min', yAxis: [{min: 0} as PreparedYAxis], clip: 'plot'},
    {
        name: 'max on another axis',
        yAxis: [{} as PreparedYAxis, {max: 10} as PreparedYAxis],
        clip: 'plot',
    },
    {name: 'X zoom', yAxis: [], zoomState: {x: [0, 1]}, clip: 'plot'},
    {name: 'Y zoom', yAxis: [], zoomState: {y: [[0, 1]]}, clip: 'plot'},
    {name: 'slider without Y bounds', yAxis: [], isRangeSlider: true, clip: 'plot'},
])('selects line clipping with $name', async ({yAxis, zoomState, isRangeSlider, clip}) => {
    const series = await prepare(rawSeries.slice(0, 1));
    jest.spyOn(getSeriesPlugin('line'), 'prepareShapeData').mockResolvedValue({
        renderData: [createShape()],
        tooltipItems: [],
    });
    const {shapes} = await getShapes({
        ...getShapeArgs(series),
        yAxis,
        zoomState,
        isRangeSlider,
    });
    const layer = shapes[0] as React.ReactElement<React.ComponentProps<typeof SeriesShapes>>;
    expect(layer.props.clipPathId).toBe(clip);
});

it.each([
    {type: 'scatter' as const, slider: false, clip: undefined},
    {type: 'scatter' as const, slider: true, clip: 'plot'},
    {type: 'bar-x' as const, slider: false, clip: 'plot'},
    {type: 'pie' as const, slider: false, clip: undefined},
])('selects $type clipping for slider=$slider', async ({type, slider, clip}) => {
    const series = await prepare([
        type === 'pie'
            ? {type, data: [{name: 'slice', value: 1}]}
            : {type, name: 'series', data: [{x: 0, y: 1}]},
    ]);
    jest.spyOn(getSeriesPlugin(type), 'prepareShapeData').mockResolvedValue({
        renderData: [createShape()],
        tooltipItems: [],
    });
    const clipPolicy = getSeriesPlugin(type).getClipPath;
    const policy = clipPolicy && jest.spyOn(getSeriesPlugin(type), 'getClipPath');
    const {shapes} = await getShapes({
        ...getShapeArgs(series),
        isRangeSlider: slider,
    });
    expect(shapes[0].props.clipPathId).toBe(clip);
    if (policy) {
        expect(policy).toHaveBeenCalledTimes(1);
        expect(policy).toHaveBeenCalledWith({
            isRangeSlider: slider,
            yAxis: [],
            zoomState: undefined,
        });
    }
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
