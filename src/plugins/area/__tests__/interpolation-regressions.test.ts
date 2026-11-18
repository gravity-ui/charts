import {scaleBand, scaleLinear, scaleLog, scaleOrdinal} from 'd3-scale';

import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {PreparedSplit} from '~core/layout/split-types';
import type {PreparedLegend} from '~core/series/types';
import {getTooltipData} from '~core/shapes/area/get-tooltip-data';
import type {AreaGeometry} from '~core/shapes/area/types';

import type {AreaSeries} from '../../../types';
import {evaluateAtX} from '../../interpolation/curves';
import {collectSections} from '../curves';
import {getAreaAxisData} from '../domain';
import {buildAreaGeometry} from '../geometry';
import {prepareAreaSeries} from '../prepare-area-series';
import {projectInterpolatedAreaData} from '../projection';
import {filterAreaData} from '../zoom';

type ProjectionArgs = Parameters<typeof projectInterpolatedAreaData>[0];
function area(values: (number | null)[], extra: Partial<AreaSeries> = {}): AreaSeries {
    return {
        type: 'area',
        name: 'Area',
        data: values.map((y, x) => ({x, y})),
        interpolation: {type: 'monotone'},
        ...extra,
    };
}
function prepareArgs(
    series: AreaSeries[],
    extra: Partial<Omit<ProjectionArgs, 'series'>> = {},
): ProjectionArgs {
    return {
        series: prepareAreaSeries({
            series,
            colors: [],
            legend: {enabled: false} as PreparedLegend,
            colorScale: scaleOrdinal([] as string[], ['black']),
        }),
        xAxis: {type: 'linear'} as PreparedXAxis,
        xScale: scaleLinear().domain([0, 2]).range([0, 400]),
        yAxis: [{type: 'linear', plotIndex: 0}] as PreparedYAxis[],
        yScale: [scaleLinear().domain([0, 100]).range([400, 0])],
        split: {plots: [{top: 0, height: 400}]} as PreparedSplit,
        isOutsideBounds: () => false,
        ...extra,
    };
}
function project(series: AreaSeries[], extra: Partial<Omit<ProjectionArgs, 'series'>> = {}) {
    return projectInterpolatedAreaData(prepareArgs(series, extra));
}
function geometry(item: ReturnType<typeof project>[number]) {
    if (!item.geometry) throw new Error('Expected area geometry');
    return item.geometry;
}
function columns(shape: AreaGeometry) {
    return shape.columns.filter((column): column is NonNullable<typeof column> => column !== null);
}
function atX(shape: AreaGeometry, x: number) {
    for (let i = 1; i < shape.columns.length; i++) {
        const a = shape.columns[i - 1],
            b = shape.columns[i];
        if (a && b && a.x <= x && b.x >= x && a.x !== b.x) {
            return a.y1 + ((x - a.x) / (b.x - a.x)) * (b.y1 - a.y1);
        }
    }
    throw new Error('Missing area interval');
}

test('percent gaps preserve the 100% contour', () => {
    const result = project([
        area([10, 10, 10], {stacking: 'percent'}),
        area([10, 10, 10], {stacking: 'percent'}),
        area([null, 10, 10], {stacking: 'percent'}),
    ]);
    for (const item of result)
        for (const p of columns(geometry(item))) {
            expect(p.y0).toBeGreaterThanOrEqual(0);
            expect(p.y1).toBeGreaterThanOrEqual(0);
            expect(p.y0).toBeLessThanOrEqual(400);
            expect(p.y1).toBeLessThanOrEqual(400);
        }
    expect(columns(geometry(result[2])).every((p) => p.y1 === 0)).toBe(true);
});

test('a raw zero layer stays empty beside a percent gap', () => {
    const result = project([
        area([10, 10, 10], {stacking: 'percent'}),
        area([0, 0, 0], {stacking: 'percent'}),
        area([null, 10, 10], {stacking: 'percent'}),
    ]);
    expect(columns(geometry(result[1])).every((p) => p.y0 === p.y1)).toBe(true);
    expect(result[1].points.every((p) => p.percentage === 0)).toBe(true);
});

test('log stacks accumulate data values when a layer is below the axis minimum', () => {
    const result = project(
        [area([9.9, 9.9], {stacking: 'normal'}), area([0.1, 0.1], {stacking: 'normal'})],
        {
            yAxis: [{type: 'logarithmic', plotIndex: 0, min: 1, max: 100}] as PreparedYAxis[],
            yScale: [scaleLog().domain([1, 100]).range([400, 0])],
        },
    );
    expect(atX(geometry(result[1]), 100)).toBeCloseTo(200, 6);
    expect(geometry(result[0]).linePath).toBeNull();
});

test('X zoom uses the visible smooth boundary for Y bounds', () => {
    const series = area([100, 1, 100]);
    series.data = series.data.map((p, i) => ({...p, x: i * 5}));
    const result = getAreaAxisData({
        series: [series],
        axis: 'y',
        viewport: {
            x: {type: 'linear', range: [4, 6]},
            y: {type: 'linear'},
        },
    });
    expect(Math.max(...result.domainValues.map(Number))).toBeCloseTo(6.544, 3);
});

test('smooth Y bounds preserve an interior extremum across data scales and timestamps', () => {
    for (const [scale, offset] of [
        [1, 0],
        [1e-8, 1.7e12],
        [1e8, 0],
    ]) {
        const series = area(
            [0, 10, 10, 0].map((y) => y * scale),
            {
                interpolation: {type: 'cardinal'},
            },
        );
        series.data = series.data.map((point, i) => ({...point, x: offset + i * 1000}));
        const result = getAreaAxisData({
            series: [series],
            axis: 'y',
            viewport: {
                x: {type: 'datetime', range: [offset + 1000, offset + 2000]},
                y: {type: 'linear'},
            },
        });
        expect(Math.max(...result.domainValues.map(Number)) / scale).toBeCloseTo(11.25, 5);
    }
});

test('category zoom preserves the cardinal curve with offscreen tangent anchors', () => {
    const categories = ['A', 'B', 'C', 'D', 'E'];
    const series = area([10, 80, 20, 60, 30], {interpolation: {type: 'cardinal'}});
    series.data = series.data.map((p, i) => ({...p, x: categories[i]}));
    const full = project([series], {
        xAxis: {type: 'category', categories} as PreparedXAxis,
        xScale: scaleBand().domain(categories).range([0, 500]),
    });
    const selection = filterAreaData({
        series,
        viewport: {
            x: {type: 'category', categories, range: [1, 3]},
            y: {type: 'linear'},
        },
    });
    const zoom = project([{...series, data: [...(selection.shapeData ?? selection.data)]}], {
        xAxis: {type: 'category', categories} as PreparedXAxis,
        xScale: scaleBand().domain(categories.slice(1, 4)).range([0, 500]),
    });
    expect(Math.abs(atX(geometry(full[0]), 200) - atX(geometry(zoom[0]), 500 / 3))).toBeLessThan(
        0.2,
    );
});

test('flat offscreen series and isolated offscreen points produce no painted or hit geometry', () => {
    for (const values of [[200, 200], [200]]) {
        const result = project([area(values, {interpolation: {type: 'step'}})]);
        expect(geometry(result[0]).areaPath).toBeNull();
        expect(geometry(result[0]).linePath).toBeNull();
        expect(
            getTooltipData({
                data: result,
                position: [0, 200],
                measureDistance: true,
                boundsWidth: 400,
                boundsHeight: 400,
            }).xLookupPoints,
        ).toHaveLength(0);
    }
});

test('a cardinal curve entering Y bounds retains original tooltip anchors', () => {
    const result = project([area([200, 110, 110, 200], {interpolation: {type: 'cardinal'}})], {
        xScale: scaleLinear().domain([0, 3]).range([0, 400]),
    });
    expect(geometry(result[0]).linePath).not.toBeNull();
    const tooltip = getTooltipData({
        data: result,
        position: [200, 200],
        measureDistance: true,
        boundsWidth: 400,
        boundsHeight: 400,
    });
    expect(tooltip.xLookupPoints?.some((point) => 'y' in point.data && point.data.y === 110)).toBe(
        true,
    );
});

test('narrow zoom retains local tangent context without projecting all samples', () => {
    const series = area(
        Array.from({length: 10000}, (_, i) => 10 + (i % 10)),
        {interpolation: {type: 'cardinal'}},
    );
    const selection = filterAreaData({
        series,
        viewport: {
            x: {type: 'linear', range: [5000, 5010]},
            y: {type: 'linear'},
        },
    });
    const retained = selection.shapeData ?? [];
    expect(selection.data).toHaveLength(11);
    expect(retained.length).toBeLessThan(20);
    expect(retained).toContain(series.data[4998]);
    expect(retained).toContain(series.data[5012]);
    expect(retained.every((point) => series.data.includes(point))).toBe(true);
});

test('local zoom context preserves a sparse stack on the full X grid', () => {
    const source = [
        area(
            Array.from({length: 11}, (_, i) => 10 + (i % 3) * 20),
            {
                name: 'Dense',
                stacking: 'normal',
                interpolation: {type: 'cardinal'},
            },
        ),
        area([20, 20], {name: 'Sparse', stacking: 'normal', interpolation: {type: 'cardinal'}}),
    ];
    source[1].data[1].x = 10;
    const args = prepareArgs(source, {xScale: scaleLinear().domain([0, 10]).range([0, 1000])});
    const full = projectInterpolatedAreaData(args);
    const viewport = {x: {type: 'linear', range: [4, 6] as const}, y: {type: 'linear'}} as const;
    const selected = args.series.map((series) => ({
        ...series,
        data: [...(filterAreaData({series, viewport}).shapeData ?? [])],
    }));
    const zoom = projectInterpolatedAreaData({
        ...args,
        series: selected,
        xScale: scaleLinear().domain([4, 6]).range([0, 1000]),
    });
    for (let i = 0; i < full.length; i++) {
        for (const x of [4.1, 4.5, 5, 5.5, 5.9]) {
            expect(
                Math.abs(atX(geometry(full[i]), x * 100) - atX(geometry(zoom[i]), (x - 4) * 500)),
            ).toBeLessThan(0.2);
        }
    }
});

test('inverting a deeply zoomed cubic X preserves the sign near its endpoint', () => {
    const values = [4.9999999955e23, -10000, 4.9999999985e23, 3.9999999991000003e24];
    const section = collectSections(
        values.map((y, i) => ({x: (i - 1) * 1e12, y})),
        {type: 'cardinal'},
        true,
    ).get('0:1000000000000');
    if (!section) throw new Error('Missing cubic interval');
    expect(evaluateAtX(section, 1e-12)).toBeCloseTo(-9850.5, 1);
});

test('nearby signed roots cannot create a bridge through another layer', () => {
    const r1 = 1e-8,
        r2 = 2e-8,
        r3 = 0.5,
        scale = 1e20,
        width = 1e12,
        shift = 1e4;
    const first = -r1 * r2 * r3 * scale,
        last = (1 - r1) * (1 - r2) * (1 - r3) * scale;
    const derivative = (t: number) =>
        ((t - r2) * (t - r3) + (t - r1) * (t - r3) + (t - r1) * (t - r2)) * scale;
    const values = [last - 2 * derivative(0), first, last, first + 2 * derivative(1)];
    const xs = [-width - shift, -shift, width - shift, 2 * width - shift];
    const interpolation = {type: 'cardinal'} as const;
    const result = buildAreaGeometry(
        [
            {
                series: {stacking: 'normal', interpolation},
                points: xs.map((x) => ({x, y0: 0, y: 100})),
            },
            {
                series: {stacking: 'normal', interpolation},
                points: xs.map((x, i) => ({
                    x,
                    y0: values[i] > 0 ? 100 : 0,
                    y: (values[i] > 0 ? 100 : 0) + values[i],
                })),
            },
        ],
        0,
        -1,
        false,
        {xRange: [0, 640]},
    );
    for (let i = 1; i < result[1].columns.length; i++) {
        const a = result[1].columns[i - 1],
            b = result[1].columns[i];
        if (!a || !b || a.x === b.x) continue;
        const low = Math.min((a.y0 + b.y0) / 2, (a.y1 + b.y1) / 2);
        const high = Math.max((a.y0 + b.y0) / 2, (a.y1 + b.y1) / 2);
        expect(Math.min(high, 100) - Math.max(low, 0)).toBeLessThanOrEqual(1e-7);
    }
});
