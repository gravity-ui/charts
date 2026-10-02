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
import type {PreparedAreaRangeData} from '../../../core/shapes/area-range/types';
import type {PreparedLineData} from '../../../core/shapes/line/types';
import {createGradientColorResolver} from '../../../core/utils/gradient';
import type {ZoomState} from '../../../core/zoom/types';
import {getZoomedSeriesData} from '../../../core/zoom/zoom';
import {prepareAreaSeries} from '../../../plugins/area/prepare-area-series';
import {prepareAreaRangeSeries} from '../../../plugins/area-range/prepare-area-range-series';
import {prepareLineSeries} from '../../../plugins/line/prepare-line-series';
import type {AreaSeries, LineSeries, LinearGradient} from '../../../types';
import {createScales} from '../../useAxisScales';
import type {GradientLayoutReference} from '../types';

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
    xScale: ChartScale = scaleBand().domain(categories).range([0, 400]),
    yScale: ChartScale = scaleLinear().domain([0, 5]).range([200, 0]),
): GradientLayoutReference {
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
async function shapes(context: GradientLayoutReference, source = context) {
    return getShapes({
        ...context,
        gradientReference: source,
        seriesOptions: getPreparedOptions(),
        clipPathId: 'test',
        htmlLayout: null,
    });
}
function zoom(
    source: GradientLayoutReference,
    view: Partial<ZoomState> = {x: [2, 4]},
): GradientLayoutReference {
    const zoomState = view;
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

function fills(points: Array<{fill?: string}>) {
    return points.map((point) => rgb(point.fill));
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

function independentAreaSource(markersEnabled = true) {
    return reference(
        areas([1, 4, 2, 5, 3], [0, 0, 0, 0, 0], {
            stacking: undefined,
            fillColor: {...gradient, angle: 45},
            marker: {enabled: markersEnabled},
        }).slice(0, 1),
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
    expect(fills(before.points)).toEqual([
        'rgb(0, 0, 0)',
        'rgb(64, 64, 64)',
        'rgb(128, 128, 128)',
        'rgb(191, 191, 191)',
        'rgb(255, 255, 255)',
    ]);
    const after = getTop(await shapes(zoom(source), source));
    expect(fills(after.points)).toEqual(fills(before.points.slice(2)));
    expect(after.markers.map((m) => rgb(m.fill))).toEqual(fills(after.points));
    // A fresh reference after hiding the lower series must also use the full top series.
    const hiddenDuringZoom = getTop(await shapes(zoom(source), {...source}));
    expect(fills(hiddenDuringZoom.points)).toEqual(fills(after.points));
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
        const after = getTop(await shapes(zoom(source, {x: [1, 4]}), source)).points;
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
    expect(fills(after.points)).toEqual(fills(before.points));
});

test('category axes keep their existing filtered domain when the other axis is zoomed', async () => {
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
    expect(required(target.yScale?.[0]).domain()).toEqual(['A', 'C', 'E']);
    const after = (await shapes(target, source)).shapesData[0] as PreparedLineData;
    after.points.forEach((point, index) => {
        const actual = required(color(point.fill ?? '')).rgb();
        const expected = required(color(before.points[index + 2].fill ?? '')).rgb();
        for (const channel of ['r', 'g', 'b'] as const) {
            expect(Math.abs(actual[channel] - expected[channel])).toBeLessThanOrEqual(1);
        }
    });
});

test.each(['line', 'area-range'] as const)(
    '%s point colors match when chart and range-slider category domains have different gaps',
    async (type) => {
        const config = {
            name: 'sparse',
            color: {...gradient, angle: 90},
            marker: {enabled: true},
        };
        const series =
            type === 'line'
                ? prepareLineSeries({
                      ...options,
                      series: [{...config, type, data: ['A', 'D', 'E'].map((x) => ({x, y: 2}))}],
                  })
                : prepareAreaRangeSeries({
                      ...options,
                      series: [
                          {...config, type, data: ['A', 'D', 'E'].map((x) => ({x, y0: 1, y1: 2}))},
                      ],
                  });
        const source = reference(
            series,
            scaleBand().domain(['A', 'D', 'E']).range([0, 400]),
            scaleLinear().domain([0, 5]).range([200, 0]),
        );
        const chart = (await shapes(source)).shapesData[0] as
            | PreparedLineData
            | PreparedAreaRangeData;
        const slider = (
            await shapes(
                {...source, xScale: scaleBand().domain(categories).range([0, 400])},
                source,
            )
        ).shapesData[0] as PreparedLineData | PreparedAreaRangeData;
        expect(chart.markers).toHaveLength(type === 'line' ? 3 : 6);
        expect(slider.markers.map((marker) => rgb(marker.fill))).toEqual(
            chart.markers.map((marker) => rgb(marker.fill)),
        );
    },
);

test.each([
    {name: 'Y', view: {y: [[2, 4]]} as Partial<ZoomState>},
    {name: 'XY', view: {x: [1, 4], y: [[2, 4]]} as Partial<ZoomState>},
])('line colors survive $name zoom', async ({view}) => {
    const series = prepareLineSeries({
        ...options,
        series: [
            {
                type: 'line',
                name: 'line',
                color: {...gradient, angle: 45},
                data: [1, 4, 2, 5, 3].map((y, x) => ({x, y})),
            },
        ],
    });
    const source = reference(series);
    const before = (await shapes(source)).shapesData[0] as PreparedLineData;
    const target = zoom(source, view);
    const after = (await shapes(target, source)).shapesData[0] as PreparedLineData;
    expect(after.points.length).toBeGreaterThan(0);
    expect(fills(after.points)).toEqual(
        after.points.map((point) =>
            rgb(before.points.find((original) => original.data === point.data)?.fill),
        ),
    );
});

test('area-range stroke, fill and boundary markers retain their colors after XY zoom', async () => {
    const series = prepareAreaRangeSeries({
        ...options,
        series: [
            {
                type: 'area-range',
                name: 'range',
                color: {...gradient, angle: 45},
                fillColor: {...gradient, angle: 0},
                marker: {enabled: true},
                data: [1, 2, 3, 4, 5].map((y, x) => ({x, y0: y - 1, y1: y + 1})),
            },
        ],
    });
    const source = reference(series);
    const before = (await shapes(source)).shapesData[0] as PreparedAreaRangeData;
    const after = (await shapes(zoom(source, {x: [2, 4], y: [[1, 6]]}), source))
        .shapesData[0] as PreparedAreaRangeData;
    expect(fills(after.points)).toEqual(fills(before.points.slice(2)));
    expect(fills(after.markers)).toEqual(
        fills(
            before.markers.filter((marker) =>
                after.points.some((point) => point.data === marker.data),
            ),
        ),
    );
    const fillAt = (data: PreparedAreaRangeData, point: PreparedAreaRangeData['points'][number]) =>
        rgb(
            createGradientColorResolver(
                required(series[0].fillGradient),
                required(data.fillGradientBBox),
                required(data.fillGradientCoords),
            )(point.x, required(point.y)),
        );
    expect(after.points.map((point) => fillAt(after, point))).toEqual(
        before.points.slice(2).map((point) => fillAt(before, point)),
    );
});

test('independent oblique fill and vertical stroke retain their colors after zoom', async () => {
    const source = independentAreaSource();
    const before = getTop(await shapes(source));
    const after = getTop(await shapes(zoom(source), source));
    const fillColor = (data: PreparedAreaData, index: number) => {
        const p = data.points[index];
        return createGradientColorResolver(
            required(data.series.fillGradient),
            required(data.fillGradientBBox),
            required(data.fillGradientCoords),
        )(p.x, required(p.y));
    };
    expect(fills(after.points)).toEqual(fills(before.points.slice(2)));
    expect(after.points.map((_, i) => rgb(fillColor(after, i)))).toEqual(
        before.points.slice(2).map((_, i) => rgb(fillColor(before, i + 2))),
    );
});

test.each([true, false])(
    'computed marker and tooltip colors use the retained stroke color (normal markers: %s)',
    async (normalMarkers) => {
        const source = independentAreaSource(normalMarkers);
        const after = getTop(await shapes(zoom(source), source));
        const markers = normalMarkers
            ? after.markers
            : after.getHoverMarkers(
                  after.points.map((point) => ({data: point.data, series: {id: after.series.id}})),
              );
        expect(fills(markers)).toEqual(fills(after.points));
        const tooltipPoints = required(
            getTooltipData({data: [after]} as Parameters<typeof getTooltipData>[0]).xLookupPoints,
        );
        expect(tooltipPoints.map((point) => rgb(point.color))).toEqual(fills(after.points));
    },
);

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
    const target = zoom(source, {x: [2, 2]});
    const after = (await shapes(target, source)).shapesData[0] as PreparedLineData;
    expect(fills(after.points)).toEqual(fills(before.points));
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
        expect(fills(after.points)).toEqual(fills(before.points.slice(2)));
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
    const target = {...zoom(source, {x: [6, 6]}), yScale: source.yScale};
    const after = getTop(await shapes(target, source));
    const actual = after.points.filter((p) => p.data.tooltip?.enabled !== false);
    expect(actual.map((p) => rgb(p.fill))).toEqual(
        actual.map((p) => rgb(before.points.find((original) => original.data === p.data)?.fill)),
    );
});

test('an unzoomed main pass supplies the gradient reference without projecting points again', async () => {
    const series = prepareLineSeries({
        ...options,
        series: [
            {
                type: 'line',
                name: 'Line',
                color: {...gradient, angle: 90},
                marker: {enabled: true},
                data: [1, 2, 3, 4, 5].map((y, x) => ({x, y})),
            },
        ],
    });
    const source = reference(series);
    const geometry = jest.spyOn(getSeriesPlugin('line'), 'prepareGradientGeometry');
    try {
        const before = await getShapes({
            ...source,
            getGradientReference: () => source,
            seriesOptions: getPreparedOptions(),
            clipPathId: 'test',
            htmlLayout: null,
        });
        const after = await shapes(zoom(source), source);
        expect(fills((after.shapesData[0] as PreparedLineData).points)).toEqual(
            fills((before.shapesData[0] as PreparedLineData).points.slice(2)),
        );
        expect(geometry).not.toHaveBeenCalled();
    } finally {
        geometry.mockRestore();
    }
});
