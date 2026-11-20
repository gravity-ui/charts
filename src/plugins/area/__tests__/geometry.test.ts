import {scaleLinear, scaleOrdinal} from 'd3-scale';

import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {PreparedSplit} from '~core/layout/split-types';
import type {PreparedLegend} from '~core/series/types';
import {getDistanceToBand} from '~core/shapes/area/band';
import type {BandColumn} from '~core/shapes/area/band';
import {projectAreaData} from '~core/shapes/area/prepare-data';

import type {AreaSeries, SeriesInterpolation} from '../../../types';
import {buildAreaGeometry} from '../geometry';
import {prepareAreaSeries} from '../prepare-area-series';
import {getAreaProjectionArgs} from '../projection';

type Column = NonNullable<BandColumn>;

function geometryOptions(baseline: number) {
    const projectY = (value: number) => baseline - value;
    return {baseline, projection: {project: projectY, invert: projectY}};
}

function project(
    values: (number | null)[][],
    options: {
        interpolation?: SeriesInterpolation;
        stacking?: AreaSeries['stacking'];
        reversed?: boolean;
        width?: number;
    } = {},
) {
    const series = values.map<AreaSeries>((data, index) => ({
        type: 'area',
        name: `Series ${index}`,
        stacking: options.stacking ?? 'normal',
        interpolation: options.interpolation ?? {type: 'cardinal'},
        data: data.map((y, x) => ({x, y})),
    }));
    return projectAreaData(
        getAreaProjectionArgs({
            series: prepareAreaSeries({
                series,
                colors: [],
                colorScale: scaleOrdinal([] as string[], ['black']),
                legend: {enabled: false} as PreparedLegend,
            }),
            xAxis: {type: 'linear'} as PreparedXAxis,
            xScale: scaleLinear()
                .domain([0, values[0].length - 1])
                .range([0, options.width ?? 600]),
            yAxis: [{type: 'linear', plotIndex: 0}] as PreparedYAxis[],
            yScale: [
                scaleLinear()
                    .domain([-100, 100])
                    .range(options.reversed ? [0, 400] : [400, 0]),
            ],
            split: {plots: [{top: 0, height: 400}]} as PreparedSplit,
            isOutsideBounds: () => false,
        }),
    );
}

function getGeometry(data: ReturnType<typeof project>[number]) {
    if (!data.geometry) {
        throw new Error('Expected interpolated area geometry');
    }
    return data.geometry;
}

function columns(data: ReturnType<typeof project>[number]) {
    return getGeometry(data).columns.filter((column): column is Column => column !== null);
}

test('cardinal percent stack preserves the 100% envelope and original shares', () => {
    const result = project(
        [
            [1, 200, 0, 80],
            [90, 0, 15, 2],
        ],
        {
            interpolation: {type: 'cardinal'},
            stacking: 'percent',
        },
    );
    expect(columns(result[1]).every((column) => column.y1 === 0)).toBe(true);
    for (const item of result) {
        for (const column of columns(item)) {
            expect(column.y1).toBeGreaterThanOrEqual(0);
            expect(column.y0).toBeLessThanOrEqual(200);
            expect(column.y1).toBeLessThanOrEqual(column.y0);
        }
    }
    const top = result[1].points;
    expect(top.map((point) => point.data.y)).toEqual([1, 200, 0, 80]);
    expect(top.map((point) => point.percentage)).toEqual([1 / 91, 1, 0, 80 / 82]);
});

test('percent cardinal does not invent shares inside a zero-total interval', () => {
    const result = project(
        [
            [80, 0, 0, 20],
            [20, 0, 0, 80],
        ],
        {stacking: 'percent'},
    );
    for (const item of result) {
        const empty = columns(item).filter((column) => column.x >= 200 && column.x <= 400);
        expect(empty.length).toBeGreaterThan(1);
        expect(empty.every((column) => column.y0 === 200 && column.y1 === 200)).toBe(true);
    }
});

test.each([false, true])('signed cardinal layers never overlap (reversed=%s)', (reversed) => {
    const result = project(
        [
            [30, -50, 25, -20],
            [-10, 40, -30, 35],
            [5, 15, 10, 20],
        ],
        {reversed},
    );
    let checked = 0;
    for (const [index, item] of result.entries()) {
        const band = getGeometry(item).columns;
        for (let i = 1; i < band.length; i++) {
            const left = band[i - 1];
            const right = band[i];
            if (!left || !right || left.x === right.x) {
                continue;
            }
            const x = (left.x + right.x) / 2;
            const y0 = (left.y0 + right.y0) / 2;
            const y1 = (left.y1 + right.y1) / 2;
            if (Math.abs(y1 - y0) < 0.01) {
                continue;
            }
            for (const [otherIndex, other] of result.entries()) {
                if (otherIndex === index) {
                    continue;
                }
                expect(
                    getDistanceToBand({
                        point: [x, (y0 + y1) / 2],
                        columns: getGeometry(other).columns,
                    }),
                ).toBeGreaterThan(0);
                checked++;
            }
        }
    }
    expect(checked).toBeGreaterThan(10);
});

test('explicit gaps remain gaps and isolated points do not lift other layers', () => {
    const result = project(
        [
            [10, 10, 10, 10, 10],
            [null, null, 50, null, null],
        ],
        {
            interpolation: {type: 'monotone'},
        },
    );
    expect(columns(result[1]).every((column) => column.y0 === 200 && column.y1 === 180)).toBe(true);
    // An isolated observation has an outline point, not a vertical filled hit band.
    expect(columns(result[0])).toEqual([{x: 300, y0: 100, y1: 100}]);
});

test.each(['before', 'middle', 'after'] as const)(
    'step %s starts at the first observation',
    (position) => {
        const result = buildAreaGeometry(
            [
                {
                    series: {interpolation: {type: 'step', position}},
                    points: [
                        {x: 10, y: 20, y0: 100},
                        {x: 50, y: 60, y0: 100},
                    ],
                },
            ],
            geometryOptions(100),
        )[0];
        let transition = 30;
        if (position === 'before') {
            transition = 10;
        } else if (position === 'after') {
            transition = 50;
        }
        expect(result.columns).toEqual([
            {x: 10, y0: 100, y1: 20},
            ...(transition === 10 ? [] : [{x: transition, y0: 100, y1: 20}]),
            {x: transition, y0: 100, y1: 60},
            ...(transition === 50 ? [] : [{x: 50, y0: 100, y1: 60}]),
        ]);
    },
);

test.each([0, 1, 10000])('finite geometry at width %s without mutating source points', (width) => {
    const points = Object.freeze([
        Object.freeze({x: -width, y: -20, y0: -100}),
        Object.freeze({x: width, y: -40, y0: -100}),
    ]);
    const geometry = buildAreaGeometry(
        [
            {
                series: {interpolation: {type: 'cardinal'}},
                points: [...points],
            },
        ],
        geometryOptions(-100),
    )[0];
    expect(geometry.linePath).not.toMatch(/NaN|Infinity/);
    expect(geometry.areaPath).not.toMatch(/NaN|Infinity/);
    expect(points[0]).toEqual({x: -width, y: -20, y0: -100});
});

test('after steps follow observation order on a reversed X axis', () => {
    const result = buildAreaGeometry(
        [
            {
                series: {interpolation: {type: 'step'}},
                points: [
                    {x: 50, y: 20, y0: 100},
                    {x: 10, y: 60, y0: 100},
                ],
            },
        ],
        {...geometryOptions(100), reversedX: true},
    )[0];
    expect(result.columns).toEqual([
        {x: 10, y0: 100, y1: 60},
        {x: 10, y0: 100, y1: 20},
        {x: 50, y0: 100, y1: 20},
    ]);
});

test('a stationary cardinal zero crossing separates the two signed lobes', () => {
    const result = project([
        [-11, -1, 1, 11],
        [5, 5, 5, 5],
    ]);
    const band = getGeometry(result[1]).columns;
    const before = band.findIndex((column) => column?.x === 300);
    expect(before).toBeGreaterThan(0);
    expect(band.slice(before, before + 3)).toEqual([
        {x: 300, y0: 200, y1: 200},
        null,
        {x: 300, y0: 190, y1: 190},
    ]);
});

test('cardinal remains ordered on an uneven grid with a missing stack sample', () => {
    const interpolation: SeriesInterpolation = {type: 'cardinal'};
    const result = buildAreaGeometry(
        [
            {
                series: {stacking: 'normal', interpolation},
                points: [
                    {x: 0, y0: 200, y: 100, stackValue: 100},
                    {x: 1, y0: 200, y: 200, stackValue: 0},
                    {x: 200, y0: 200, y: 190, stackValue: 10},
                    {x: 201, y0: 200, y: 50, stackValue: 150},
                ],
            },
            {
                series: {stacking: 'normal', interpolation},
                points: [
                    {x: 0, y0: 100, y: 80, stackValue: 20},
                    {x: 1, y0: 200, y: 170, stackValue: 30},
                    {x: 200, y0: 190, y: 150, stackValue: 40},
                    {x: 201, y0: 50, y: 40, stackValue: 10},
                ],
            },
        ],
        geometryOptions(200),
    );
    const bottom = result[0].columns.filter((column): column is Column => column !== null);
    const top = result[1].columns.filter((column): column is Column => column !== null);
    expect(bottom.length).toBe(top.length);
    for (let i = 0; i < bottom.length; i++) {
        expect(bottom[i].y1).toBe(top[i].y0);
        expect(top[i].y1).toBeLessThanOrEqual(top[i].y0);
        expect(bottom[i].y1).toBeLessThanOrEqual(bottom[i].y0);
        if (i) {
            expect(bottom[i].x).toBeGreaterThanOrEqual(bottom[i - 1].x);
        }
    }
});
