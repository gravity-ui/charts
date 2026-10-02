import type {PreparedScatterSeries} from '../../../series/types';
import {clusterSeriesData} from '../cluster';
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
    });

    test.each(['50px', '25%'] as const)('resolves grid size %s in pixels', (gridSize) => {
        const series = makeSeries({layoutAlgorithm: {type: 'grid', gridSize}});
        const points = [10, 30, 70, 90].map((x) => makePoint(x, 20, series));
        expect(group(points, series).map((point) => point.point.data.cluster?.size)).toEqual([
            2, 2,
        ]);
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
});
