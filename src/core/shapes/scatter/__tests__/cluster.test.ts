import {scaleLinear} from 'd3-scale';

import type {PreparedXAxis, PreparedYAxis} from '../../../axes/types';
import type {PreparedSplit} from '../../../layout/split-types';
import type {ChartScale} from '../../../scales/types';
import type {PreparedScatterSeries} from '../../../series/types';
import {clusterSeriesData} from '../cluster';
import {prepareScatterData} from '../prepare-data';
import type {PreparedScatterData} from '../types';

function makeSeries(
    clusterOptions: Partial<PreparedScatterSeries['cluster']> = {},
): PreparedScatterSeries {
    const normal = {
        enabled: true,
        symbol: 'circle' as const,
        radius: 4,
        borderColor: '',
        borderWidth: 0,
    };
    return {
        id: 'scatter',
        type: 'scatter',
        color: '#3072f3',
        data: [],
        dataLabels: {
            enabled: false,
            style: {fontSize: '10px'},
            padding: 5,
            allowOverlap: false,
            html: false,
        },
        yAxis: 0,
        marker: {
            states: {
                normal,
                hover: {...normal, halo: {enabled: true, size: 6, opacity: 0.25}},
            },
        },
        cluster: {
            enabled: true,
            layoutAlgorithm: {type: 'grid', gridSize: 50},
            overlapMode: 'allow',
            minimumClusterSize: 2,
            marker: {...normal, radius: 8},
            dataLabels: {enabled: true, allowOverlap: true, style: {fontSize: '10px'}},
            ...clusterOptions,
        },
    } as unknown as PreparedScatterSeries;
}

function makePoint(
    x: number,
    y: number,
    series: PreparedScatterSeries,
    clipped = false,
): PreparedScatterData {
    return {
        point: {
            x,
            y,
            data: {x, y, custom: {id: `${x}:${y}`}},
            series,
            color: series.color,
            opacity: null,
        },
        clipped,
        hovered: false,
        active: true,
        htmlElements: [],
    };
}

function group(data: PreparedScatterData[], series: PreparedScatterSeries, boundsWidth = 200) {
    return clusterSeriesData({
        data,
        series,
        boundsWidth,
        boundsHeight: 100,
        isOutsideBounds: (x, y) => x < 0 || x > boundsWidth || y < 0 || y > 100,
    });
}

describe('scatter grid clustering', () => {
    test('groups by cells without chaining across the plot', () => {
        const series = makeSeries();
        const points = [10, 40, 70, 100, 130].map((x) => makePoint(x, 20, series));
        const result = group(points, series);

        expect(result.map((point) => point.point.data.cluster?.size ?? 1)).toEqual([2, 1, 2]);
        expect(result[0].point.data.cluster?.points).toEqual([
            points[0].point.data,
            points[1].point.data,
        ]);
        expect(result[0].point.data.cluster?.points[0]).toBe(points[0].point.data);
        expect(result[0].point.data.x).toBe(25);
        expect(result[0].point.data.cluster?.size).toBe(
            result[0].point.data.cluster?.points.length,
        );
        expect(result[0].point.series).toBe(result[2].point.series);
        expect(result[0].point.series).not.toBe(series);
    });

    test.each(['50px', '25%'] as const)('resolves grid size %s in pixels', (gridSize) => {
        const series = makeSeries({layoutAlgorithm: {type: 'grid', gridSize}});
        const points = [10, 30, 70, 90].map((x) => makePoint(x, 20, series));
        expect(group(points, series).map((point) => point.point.data.cluster?.size)).toEqual([
            2, 2,
        ]);
    });

    test.each([
        {value: 1e308, count: 2},
        {value: Number.MAX_VALUE, count: 3},
        {value: Number.MAX_VALUE, count: 100},
    ])('keeps the centroid finite for $count large finite data values', ({value, count}) => {
        const series = makeSeries();
        const points = Array.from({length: count}, () => makePoint(10, 20, series));
        for (const point of points) {
            point.point.data.x = value;
            point.point.data.y = value;
        }
        const [cluster] = group(points, series);

        expect(cluster.point.data.x).toBe(value);
        expect(cluster.point.data.y).toBe(value);
        expect(cluster.point.x).toBe(10);
        expect(cluster.point.y).toBe(20);
    });

    test('keeps a finite centroid when large opposite data values cancel after overflow', () => {
        const series = makeSeries();
        const points = [1, 1, -1, -1].map((sign) => {
            const point = makePoint(10, 20, series);
            point.point.data.x = sign * Number.MAX_VALUE;
            point.point.data.y = sign * Number.MAX_VALUE;
            return point;
        });
        const [cluster] = group(points, series);

        expect(cluster.point.data.x).toBe(0);
        expect(cluster.point.data.y).toBe(0);
    });

    test.each(['allow', 'shift'] as const)(
        'keeps grid cells and shifts relative to the split plot in %s mode',
        (overlapMode) => {
            const series = makeSeries({overlapMode});
            const local = [45, 46, 51, 52].map((y) => makePoint(20, y, series));
            const offset = [45, 46, 51, 52].map((y) => {
                const point = makePoint(20, y, series);
                point.point.y += 125;
                return point;
            });
            const expected = group(local, series);
            const shifted = clusterSeriesData({
                data: offset,
                series,
                boundsWidth: 200,
                boundsHeight: 100,
                boundsTop: 125,
                isOutsideBounds: (x, y) => x < 0 || x > 200 || y < 125 || y > 225,
            });

            expect(shifted.map((point) => point.point.data.cluster?.size)).toEqual([2, 2]);
            shifted.forEach((point, index) => {
                expect(point.point.x).toBeCloseTo(expected[index].point.x);
                expect(point.point.y).toBeCloseTo(expected[index].point.y + 125);
                expect(point.point.y).toBeGreaterThanOrEqual(125);
                expect(point.point.y).toBeLessThanOrEqual(225);
                expect(point.point.data.y).toBe(expected[index].point.data.y);
            });
        },
    );

    test('positions scatter markers in their split plot and clips points outside that plot', async () => {
        const series = makeSeries({enabled: false});
        series.yAxis = 1;
        series.data = [
            {x: 5, y: 50},
            {x: 5, y: 150},
        ];
        const prepared = await prepareScatterData({
            series: [series],
            xAxis: {type: 'linear'} as PreparedXAxis,
            xScale: scaleLinear().domain([0, 10]).range([0, 200]) as ChartScale,
            yAxis: [
                {type: 'linear', plotIndex: 0},
                {type: 'linear', plotIndex: 1},
            ] as PreparedYAxis[],
            yScale: [
                scaleLinear().domain([0, 100]).range([100, 0]),
                scaleLinear().domain([0, 100]).range([100, 0]),
            ] as ChartScale[],
            split: {
                plots: [
                    {top: 0, height: 100},
                    {top: 125, height: 100},
                ],
            } as PreparedSplit,
            isOutsideBounds: (x, y) => x < 0 || x > 200 || y < 0 || y > 225,
            boundsWidth: 200,
            boundsHeight: 225,
        });

        expect(prepared.scatterData.map((point) => point.point.y)).toEqual([175, 75]);
        expect(prepared.scatterData.map((point) => point.clipped)).toEqual([false, true]);
    });

    test('rebuilds membership when the plot width changes', () => {
        const series = makeSeries({layoutAlgorithm: {type: 'grid', gridSize: '25%'}});
        const wide = [10, 30, 70, 90].map((x) => makePoint(x, 20, series));
        const narrow = [10, 30, 70, 90].map((x) => makePoint(x, 20, series));

        expect(group(wide, series, 200).map((point) => point.point.data.cluster?.size)).toEqual([
            2, 2,
        ]);
        expect(
            group(narrow, series, 120).map((point) => point.point.data.cluster?.size ?? 1),
        ).toEqual([1, 1, 1, 1]);
    });

    test('keeps clipped points and disabled clustering untouched', () => {
        const series = makeSeries();
        const data = [makePoint(10, 20, series), makePoint(11, 20, series, true)];
        expect(group(data, series)).toEqual(data);

        const disabled = makeSeries({enabled: false});
        const plain = [makePoint(10, 20, disabled), makePoint(11, 20, disabled)];
        expect(group(plain, disabled)).toBe(plain);
    });

    test('groups dense data within its grid cells', () => {
        const series = makeSeries();
        const points = Array.from({length: 10_000}, (_, index) =>
            makePoint(index % 100, Math.floor(index / 100), series),
        );
        const result = group(points, series);

        expect(result.map((point) => point.point.data.cluster?.size)).toEqual([
            2500, 2500, 2500, 2500,
        ]);
        expect(result.flatMap((point) => point.point.data.cluster?.points ?? [])).toHaveLength(
            10_000,
        );
    });

    test('shifts cluster markers away from neighbors without changing the source data', () => {
        const series = makeSeries({
            overlapMode: 'shift',
            marker: {
                enabled: true,
                symbol: 'circle',
                radius: 12,
                borderWidth: 1,
                borderColor: '#fff',
            },
        });
        const points = [47, 48, 52, 53].map((x) => makePoint(x, 20, series));
        const result = group(points, series);
        const distance = Math.hypot(
            result[0].point.x - result[1].point.x,
            result[0].point.y - result[1].point.y,
        );

        expect(result.map((item) => item.point.data.cluster?.size)).toEqual([2, 2]);
        expect(distance).toBeGreaterThanOrEqual(26);
        expect(result[0].point.x).toBeGreaterThanOrEqual(13);
        expect(result[0].point.x).toBeLessThanOrEqual(37);
        expect(result[1].point.x).toBeGreaterThanOrEqual(50);
        expect(result[1].point.x).toBeLessThanOrEqual(100);
        expect(result[0].point.data.x).toBe(47.5);
        expect(result[1].point.data.x).toBe(52.5);
        expect(points.map((point) => point.point.x)).toEqual([47, 48, 52, 53]);
    });

    test('separates bordered circle markers using their rendered outer radius', () => {
        const series = makeSeries({
            overlapMode: 'shift',
            marker: {
                enabled: true,
                symbol: 'circle',
                radius: 8,
                borderWidth: 4,
                borderColor: '#fff',
            },
        });
        const points = [38.5, 39.5, 64.5, 65.5].map((x) => makePoint(x, 20, series));
        const result = group(points, series);

        expect(result.map((point) => point.point.data.cluster?.size)).toEqual([2, 2]);
        expect(result[1].point.x - result[0].point.x).toBeGreaterThanOrEqual(28);
        expect(points.map((point) => point.point.x)).toEqual([38.5, 39.5, 64.5, 65.5]);
    });

    test('separates bordered square markers that overlap at diagonal centers', () => {
        const series = makeSeries({
            overlapMode: 'shift',
            marker: {
                enabled: true,
                symbol: 'square',
                radius: 8,
                borderWidth: 4,
                borderColor: '#fff',
            },
        });
        const points = [
            [37.5, 37.5],
            [38.5, 38.5],
            [60.5, 60.5],
            [61.5, 61.5],
        ].map(([x, y]) => makePoint(x, y, series));
        const result = group(points, series);
        const sideLength = Math.sqrt(Math.PI) * (8 + 4) + 4;
        const dx = Math.abs(result[1].point.x - result[0].point.x);
        const dy = Math.abs(result[1].point.y - result[0].point.y);

        expect(result.map((point) => point.point.data.cluster?.size)).toEqual([2, 2]);
        expect(dx >= sideLength || dy >= sideLength).toBe(true);
        expect(result.map((point) => point.point.data.x)).toEqual([38, 61]);
    });

    test('separates a bordered square cluster from a single circle point', () => {
        const series = makeSeries({
            overlapMode: 'shift',
            marker: {
                enabled: true,
                symbol: 'square',
                radius: 8,
                borderWidth: 4,
                borderColor: '#fff',
            },
        });
        const points = [37.5, 38.5, 51].map((x) => makePoint(x, 20, series));
        const result = group(points, series);
        const squareHalfWidth = (Math.sqrt(Math.PI) * (8 + 4) + 4) / 2;

        expect(result.map((point) => point.point.data.cluster?.size ?? 1)).toEqual([2, 1]);
        expect(points[2].point.x - result[0].point.x).toBeGreaterThanOrEqual(squareHalfWidth + 4);
        expect(result[1]).toBe(points[2]);
        expect(result[0].point.data.x).toBe(38);
    });

    test('leaves a marker at its centroid when its cell cannot contain it', () => {
        const series = makeSeries({
            overlapMode: 'shift',
            layoutAlgorithm: {type: 'grid', gridSize: 20},
            marker: {
                enabled: true,
                symbol: 'circle',
                radius: 12,
                borderColor: '',
                borderWidth: 0,
            },
        });
        const result = group(
            [18, 19, 21, 22].map((x) => makePoint(x, 20, series)),
            series,
        );
        expect(result.map((point) => point.point.x)).toEqual([18.5, 21.5]);
    });

    test('shifts a cluster away from a single point without moving the point', () => {
        const series = makeSeries({overlapMode: 'shift'});
        const points = [45, 46, 51].map((x) => makePoint(x, 20, series));
        const result = group(points, series);

        expect(result.map((point) => point.point.data.cluster?.size ?? 1)).toEqual([2, 1]);
        expect(result[0].point.x).toBeLessThan(45.5);
        expect(result[0].point.data.x).toBe(45.5);
        expect(result[1]).toBe(points[2]);
        expect(result[1].point.x).toBe(51);
    });

    test('does not rescan all points for each series when clustering is disabled', async () => {
        let idReads = 0;
        const preparedSeries = Array.from({length: 30}, (_seriesValue, seriesIndex) => {
            const id = `series-${seriesIndex}`;
            const item = {
                id,
                type: 'scatter',
                data: Array.from({length: 30}, (_pointValue, pointIndex) => ({
                    x: pointIndex,
                    y: pointIndex,
                })),
                cluster: {enabled: false},
                dataLabels: {enabled: false},
                yAxis: 0,
            } as unknown as PreparedScatterSeries;
            Object.defineProperty(item, 'id', {
                get: () => {
                    idReads++;
                    return id;
                },
            });
            return item;
        });
        const prepared = await prepareScatterData({
            series: preparedSeries,
            xAxis: {type: 'linear'} as PreparedXAxis,
            xScale: scaleLinear().domain([0, 30]).range([0, 200]) as ChartScale,
            yAxis: [{type: 'linear'} as PreparedYAxis],
            yScale: [scaleLinear().domain([0, 30]).range([100, 0]) as ChartScale],
            split: {} as PreparedSplit,
            isOutsideBounds: () => false,
            boundsWidth: 200,
            boundsHeight: 100,
        });

        expect(prepared.scatterData).toHaveLength(900);
        expect(idReads).toBeLessThan(100);
    });
});
