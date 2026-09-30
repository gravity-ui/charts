/** @jest-environment jsdom */

import {color} from 'd3-color';
import {scaleBand, scaleLinear, scaleLog, scaleOrdinal} from 'd3-scale';

import {getShapes} from '..';
import type {PreparedXAxis, PreparedYAxis} from '../../../core/axes/types';
import type {PreparedSplit} from '../../../core/layout/split-types';
import type {ChartScale} from '../../../core/scales/types';
import {getPreparedOptions} from '../../../core/series/prepare-options';
import {getSeriesPlugin, registerSeriesPlugin} from '../../../core/series/seriesRegistry';
import type {PreparedLegend, PreparedSeries} from '../../../core/series/types';
import {getTooltipData} from '../../../core/shapes/area/get-tooltip-data';
import type {PreparedAreaData} from '../../../core/shapes/area/types';
import type {PreparedLineData} from '../../../core/shapes/line/types';
import {createGradientColorResolver} from '../../../core/utils/gradient';
import {getZoomedSeriesData} from '../../../core/zoom/zoom';
import {prepareAreaSeries} from '../../../plugins/area/prepare-area-series';
import {prepareLineSeries} from '../../../plugins/line/prepare-line-series';
import type {AreaSeries, LineSeries, LinearGradient} from '../../../types';
import {createScales} from '../../useAxisScales';
import type {GradientReference} from '../types';

const gradient: LinearGradient = {
    type: 'linear-gradient',
    angle: 0,
    stops: [
        {offset: 0, color: '#000000'},
        {offset: 1, color: '#ffffff'},
    ],
};
const options = {
    colors: [],
    colorScale: scaleOrdinal<string, string>().range(['black']),
    legend: {enabled: false} as PreparedLegend,
};
const categories = ['A', 'B', 'C', 'D', 'E'];
const xAxis = {type: 'category', categories} as PreparedXAxis;
const yAxis = [{type: 'linear', plotIndex: 0, min: 0, max: 5, maxPadding: 0}] as PreparedYAxis[];

function reference(
    series: PreparedSeries[],
    xScale: ChartScale,
    yScale: ChartScale,
): GradientReference {
    return {
        boundsWidth: 400,
        boundsHeight: 200,
        series,
        xAxis,
        yAxis,
        xScale,
        yScale: [yScale],
        split: {plots: [{top: 0, height: 200}], gap: 0} as PreparedSplit,
    };
}
async function shapes(context: GradientReference, source = context) {
    return getShapes({
        ...context,
        gradientReference: source,
        seriesOptions: getPreparedOptions(),
        clipPathId: 'test',
        htmlLayout: null,
    });
}
function zoom(source: GradientReference, min = 2, max = 4): GradientReference {
    const zoomState = {x: [min, max] as [number, number]};
    const {preparedSeries, preparedShapesSeries} = getZoomedSeriesData({
        seriesData: source.series,
        xAxis: source.xAxis,
        yAxis: source.yAxis,
        zoomState,
    });
    const scales = createScales({
        ...source,
        xAxis: required(source.xAxis),
        series: preparedSeries,
        categorySeries: source.series,
        zoomState,
    });
    return {...source, ...scales, series: preparedShapesSeries};
}
function required<T>(value: T | null | undefined): T {
    if (value === null || value === undefined) {
        throw new Error('Missing prepared data');
    }
    return value;
}
function rgb(fill?: string) {
    return color(fill ?? '')?.formatRgb();
}

function areas(top: number[], bottom: (number | null)[], extra: Partial<AreaSeries> = {}) {
    return prepareAreaSeries({
        ...options,
        series: [
            {
                type: 'area',
                name: 'top',
                stacking: 'normal',
                color: gradient,
                marker: {enabled: true},
                data: top.map((y, x) => ({x, y})),
                ...extra,
            },
            {
                type: 'area',
                name: 'bottom',
                stacking: 'normal',
                data: bottom.map((y, x) => ({x, y})),
            },
        ],
    });
}

function getTop(data: Awaited<ReturnType<typeof shapes>>) {
    return required(
        (data.shapesData as PreparedAreaData[]).find((item) => item.series.name === 'top'),
    );
}

test('hidden stacked series do not affect colors before zoom or after visibility changes during zoom', async () => {
    const series = areas([1, 2, 3, 4, 5], [100, 100, 100, 100, 100], {
        color: {...gradient, angle: 90},
    });
    series[1].visible = false;
    const source = reference(
        series,
        scaleBand().domain(categories).range([0, 400]),
        scaleLinear().domain([0, 5]).range([200, 0]),
    );
    const before = getTop(await shapes(source));
    expect(before.points.map((p) => rgb(p.fill))).toEqual([
        'rgb(0, 0, 0)',
        'rgb(64, 64, 64)',
        'rgb(128, 128, 128)',
        'rgb(191, 191, 191)',
        'rgb(255, 255, 255)',
    ]);
    const after = getTop(await shapes(zoom(source), source));
    expect(after.points.map((p) => rgb(p.fill))).toEqual(
        before.points.slice(2).map((p) => rgb(p.fill)),
    );
    expect(after.markers.map((m) => rgb(m.fill))).toEqual(after.points.map((p) => rgb(p.fill)));
    // A fresh reference after hiding the lower series must also use the full top series.
    const hiddenDuringZoom = getTop(await shapes(zoom(source), {...source}));
    expect(hiddenDuringZoom.points.map((p) => rgb(p.fill))).toEqual(
        after.points.map((p) => rgb(p.fill)),
    );
});

test.each(['normal', 'percent'] as const)(
    'stack sections keep full-series null neighbors at category zoom edges (%s)',
    async (stacking) => {
        const series = areas([2, 2, 2, 2, 2], [null, 3, null, 3, 3]);
        series.forEach((item) => {
            item.stacking = stacking;
        });
        const source = reference(
            series,
            scaleBand().domain(categories).range([0, 400]),
            scaleLinear()
                .domain(stacking === 'normal' ? [0, 5] : [0, 100])
                .range([200, 0]),
        );
        const before = getTop(await shapes(source)).points.filter((p) => Number(p.data.x) >= 1);
        const after = getTop(await shapes(zoom(source, 1), source)).points;
        expect(after.map(({data, y, y0, fill}) => ({data, y, y0, fill: rgb(fill)}))).toEqual(
            before.map(({data, y, y0, fill}) => ({data, y, y0, fill: rgb(fill)})),
        );
    },
);

test('logarithmic stacks add values before projecting and preserve colors when the axis minimum changes', async () => {
    const series = areas([2, 3, 4], [2, 3, 4]);
    const source = {
        ...reference(
            series,
            scaleLinear().domain([0, 2]).range([0, 400]),
            scaleLog().domain([1, 100]).range([200, 0]),
        ),
        xAxis: {type: 'linear'} as PreparedXAxis,
        yAxis: [{type: 'logarithmic', plotIndex: 0}] as PreparedYAxis[],
    };
    const before = getTop(await shapes(source));
    const after = getTop(
        await shapes({...source, yScale: [scaleLog().domain([2, 10]).range([200, 0])]}, source),
    );
    expect(before.points.map((p) => p.y)).toEqual([139.79, 122.18, 109.69]);
    expect(after.points.map((p) => rgb(p.fill))).toEqual(before.points.map((p) => rgb(p.fill)));
});

test('category axes retain interior categories when the other axis filters points', async () => {
    const series = prepareLineSeries({
        ...options,
        series: [
            {
                type: 'line',
                name: 'line',
                color: gradient,
                marker: {enabled: true},
                data: ['B', 'D', 'A', 'C', 'E'].map((y, x) => ({x, y})),
            },
        ],
    });
    const source = {
        ...reference(
            series,
            scaleBand().domain(categories).range([0, 400]),
            scaleBand().domain(categories).range([200, 0]),
        ),
        yAxis: [{type: 'category', plotIndex: 0, categories: xAxis.categories}] as PreparedYAxis[],
    };
    const before = (await shapes(source)).shapesData[0] as PreparedLineData;
    const target = zoom(source);
    expect(required(target.yScale?.[0]).domain()).toEqual(xAxis.categories);
    const after = (await shapes(target, source)).shapesData[0] as PreparedLineData;
    expect(after.points.map((p) => rgb(p.fill))).toEqual(
        before.points.slice(2).map((p) => rgb(p.fill)),
    );
});

test('independent oblique fill and vertical stroke share their colors with computed markers after zoom', async () => {
    const series = areas([1, 4, 2, 5, 3], [0, 0, 0, 0, 0], {
        stacking: undefined,
        fillColor: {...gradient, angle: 45},
    }).slice(0, 1);
    const source = reference(
        series,
        scaleBand().domain(categories).range([0, 400]),
        scaleLinear().domain([0, 5]).range([200, 0]),
    );
    const before = getTop(await shapes(source));
    const after = getTop(await shapes(zoom(source), source));
    const fillColor = (data: PreparedAreaData, index: number) => {
        const p = data.points[index];
        return createGradientColorResolver(
            required(series[0].fillGradient),
            required(data.fillGradientBBox),
            required(data.fillGradientCoords),
        )(p.x, required(p.y));
    };
    expect(after.points.map((p) => rgb(p.fill))).toEqual(
        before.points.slice(2).map((p) => rgb(p.fill)),
    );
    expect(after.markers.map((m) => rgb(m.fill))).toEqual(after.points.map((p) => rgb(p.fill)));
    expect(after.points.map((_, i) => rgb(fillColor(after, i)))).toEqual(
        before.points.slice(2).map((_, i) => rgb(fillColor(before, i + 2))),
    );
    expect(
        required(
            getTooltipData({data: [after]} as Parameters<typeof getTooltipData>[0]).xLookupPoints,
        ).map((p) => rgb(p.color)),
    ).toEqual(after.points.map((p) => rgb(p.fill)));
    series[0].marker.states.normal.enabled = false;
    const hoverData = getTop(await shapes(zoom(source), source));
    expect(
        hoverData
            .getHoverMarkers([{data: hoverData.points[1].data, series: {id: series[0].id}}])
            .map((m) => rgb(m.fill)),
    ).toEqual([rgb(hoverData.points[1].fill)]);
});

test('a single-value X zoom uses the actual clipping-neighbor geometry', async () => {
    const raw: LineSeries = {
        type: 'line',
        name: 'line',
        color: {...gradient, angle: 45},
        data: [
            {x: 0, y: 1},
            {x: 2, y: 2},
            {x: 9, y: 4},
        ],
    };
    const series = prepareLineSeries({...options, series: [raw]});
    const source = {
        ...reference(
            series,
            scaleLinear().domain([0, 9]).range([0, 400]),
            scaleLinear().domain([0, 5]).range([200, 0]),
        ),
        xAxis: {type: 'linear'} as PreparedXAxis,
    };
    const before = (await shapes(source)).shapesData[0] as PreparedLineData;
    const target = zoom(source, 2, 2);
    const after = (await shapes(target, source)).shapesData[0] as PreparedLineData;
    expect(after.points.map((p) => rgb(p.fill))).toEqual(before.points.map((p) => rgb(p.fill)));
});

test('custom plugins keep one prepareShapeData call per render', async () => {
    const plugin = getSeriesPlugin('line');
    const prepareShapeData = jest.fn(plugin.prepareShapeData);
    registerSeriesPlugin({...plugin, prepareShapeData, prepareGradientGeometry: undefined});
    try {
        const series = prepareLineSeries({
            ...options,
            series: [
                {
                    type: 'line',
                    name: 'line',
                    color: gradient,
                    data: [
                        {x: 0, y: 1},
                        {x: 1, y: 2},
                    ],
                },
            ],
        });
        const source = reference(
            series,
            scaleBand().domain(categories).range([0, 400]),
            scaleLinear().domain([0, 5]).range([200, 0]),
        );
        await shapes(source);
        expect(prepareShapeData).toHaveBeenCalledTimes(1);
        expect(prepareShapeData.mock.calls[0][0].isRangeSlider).toBeUndefined();
    } finally {
        registerSeriesPlugin(plugin);
    }
});

test.each([0, -10])(
    'plots without drawable height do not capture an invalid gradient (%s)',
    async (height) => {
        const series = areas([1, 2, 3, 4, 5], [0, 0, 0, 0, 0]).slice(0, 1);
        const source = reference(
            series,
            scaleBand().domain(categories).range([0, 400]),
            scaleLinear().domain([0, 5]).range([height, 0]),
        );
        source.split.plots[0].height = height;
        expect((await shapes(source)).shapesData).toEqual([]);
        const resized = {
            ...source,
            yScale: [scaleLinear().domain([0, 5]).range([200, 0])],
            split: {...source.split, plots: [{...source.split.plots[0], height: 200}]},
        };
        expect(getTop(await shapes(resized)).points.map((p) => rgb(p.fill))).toEqual([
            'rgb(0, 0, 0)',
            'rgb(64, 64, 64)',
            'rgb(128, 128, 128)',
            'rgb(191, 191, 191)',
            'rgb(255, 255, 255)',
        ]);
    },
);

test('new series data while zoomed gets a new full-series reference', async () => {
    const make = (values: number[]) =>
        reference(
            areas(values, [0, 0, 0, 0, 0]).slice(0, 1),
            scaleBand().domain(categories).range([0, 400]),
            scaleLinear().domain([0, 5]).range([200, 0]),
        );
    const source = make([1, 2, 3, 4, 5]);
    await shapes(zoom(source), source);
    const updated = make([5, 4, 3, 2, 1]);
    const before = getTop(await shapes(updated));
    const after = getTop(await shapes(zoom(updated), updated));
    expect(after.points.map((p) => rgb(p.fill))).toEqual(
        before.points.slice(2).map((p) => rgb(p.fill)),
    );
});

test.each([false, true])(
    'stacked colors stay consistent with a reversed Y scale (%s)',
    async (reversed) => {
        const series = areas([1, 2, 3, 4, 5], [1, 1, 1, 1, 1]);
        const source = reference(
            series,
            scaleBand().domain(categories).range([0, 400]),
            scaleLinear()
                .domain([0, 6])
                .range(reversed ? [0, 200] : [200, 0]),
        );
        const before = getTop(await shapes(source));
        const target = {...zoom(source), yScale: source.yScale};
        const after = getTop(await shapes(target, source));
        expect(after.points.map((p) => rgb(p.fill))).toEqual(
            before.points.slice(2).map((p) => rgb(p.fill)),
        );
        expect(before.points.every((p) => p.y !== null && p.y >= 0 && p.y <= 200)).toBe(true);
    },
);

test('full gradient geometry is cached across zoom and range-slider preview renders', async () => {
    const plugin = getSeriesPlugin('area');
    const prepareGradientGeometry = jest.fn(plugin.prepareGradientGeometry);
    registerSeriesPlugin({...plugin, prepareGradientGeometry});
    try {
        const series = areas([1, 2, 3, 4, 5], [0, 0, 0, 0, 0]);
        const source = reference(
            series,
            scaleBand().domain(categories).range([0, 400]),
            scaleLinear().domain([0, 5]).range([200, 0]),
        );
        await shapes(source);
        await shapes(zoom(source), source);
        await shapes(
            {...source, boundsHeight: 40, yScale: [scaleLinear().domain([0, 5]).range([40, 0])]},
            source,
        );
        expect(prepareGradientGeometry).toHaveBeenCalledTimes(1);
        expect(prepareGradientGeometry.mock.calls[0][0].series).toHaveLength(2);
        expect(prepareGradientGeometry.mock.calls[0][0].isRangeSlider).toBeUndefined();
    } finally {
        registerSeriesPlugin(plugin);
    }
});

test('single-value X zoom matches synthetic stack positions by identity', async () => {
    const series = prepareAreaSeries({
        ...options,
        series: [
            {
                type: 'area',
                name: 'top',
                stacking: 'normal',
                color: {...gradient, angle: 90},
                data: [0, 4, 6, 8, 10].map((x, index) => ({x, y: index + 1})),
            },
            {
                type: 'area',
                name: 'bottom',
                stacking: 'normal',
                data: Array.from({length: 11}, (_, x) => ({x, y: 1})),
            },
        ],
    });
    const source = {
        ...reference(
            series,
            scaleLinear().domain([0, 10]).range([0, 400]),
            scaleLinear().domain([0, 6]).range([200, 0]),
        ),
        xAxis: {type: 'linear'} as PreparedXAxis,
    };
    const before = getTop(await shapes(source));
    const target = {...zoom(source, 6, 6), yScale: source.yScale};
    const after = getTop(await shapes(target, source));
    const actual = after.points.filter((p) => p.data.tooltip?.enabled !== false);
    expect(actual.map((p) => rgb(p.fill))).toEqual(
        actual.map((p) => rgb(before.points.find((original) => original.data === p.data)?.fill)),
    );
});
