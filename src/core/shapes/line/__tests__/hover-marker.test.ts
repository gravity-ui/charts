import {SymbolType} from '../../../constants';
import type {PreparedLineSeries} from '../../../series/types';
import type {LineSeriesData} from '../../../types';
import {buildLineHoverMarkerGetter} from '../prepare-data';
import type {PointData} from '../types';

function createSeries(overrides: {
    normalEnabled?: boolean;
    hoverEnabled?: boolean;
    symbol?: `${SymbolType}`;
    halo?: {enabled: boolean; size?: number; opacity?: number};
    color?: string;
    pointsData?: LineSeriesData[];
}): {points: PointData[]; series: PreparedLineSeries} {
    const normalEnabled = overrides.normalEnabled ?? false;
    const hoverEnabled = overrides.hoverEnabled ?? true;
    const symbol = overrides.symbol ?? SymbolType.Circle;
    const color = overrides.color ?? 'blue';

    const pointsData: LineSeriesData[] = overrides.pointsData ?? [
        {x: 1, y: 10},
        {x: 2, y: 20},
    ];

    const haloOptions = {
        enabled: overrides.halo ? overrides.halo.enabled : false,
        size: overrides.halo?.size ?? 6,
        opacity: overrides.halo?.opacity ?? 0.25,
    };

    const series = {
        id: 'line-1',
        type: 'line',
        color,
        data: pointsData,
        marker: {
            states: {
                normal: {
                    enabled: normalEnabled,
                    symbol,
                    radius: 4,
                    borderColor: '#111111',
                    borderWidth: 2,
                },
                hover: {
                    enabled: hoverEnabled,
                    radius: 6,
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    halo: haloOptions,
                },
            },
        },
    } as PreparedLineSeries;

    const points: PointData[] = pointsData.map((d, index) => ({
        x: index * 10,
        y: index * 20,
        color: d.marker?.color ?? d.color,
        data: d,
        series,
    }));

    return {points, series};
}

describe('buildLineHoverMarkerGetter', () => {
    describe('always-visible markers mode', () => {
        test('returns empty hover markers when halo is omitted or disabled', () => {
            const {points, series} = createSeries({
                normalEnabled: true,
                halo: {enabled: false},
            });
            const getHoverMarkers = buildLineHoverMarkerGetter(points, series);

            expect(getHoverMarkers([{data: points[0].data, series: {id: series.id}}])).toEqual([]);
        });

        test('returns marker preserving normal appearance with halo when halo is enabled', () => {
            const {points, series} = createSeries({
                normalEnabled: true,
                halo: {enabled: true, size: 8, opacity: 0.3},
            });
            const getHoverMarkers = buildLineHoverMarkerGetter(points, series);

            const result = getHoverMarkers([{data: points[0].data, series: {id: series.id}}]);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    cx: 0,
                    cy: 0,
                    radius: 4, // normal radius preserved
                    stroke: '#111111', // normal border color preserved
                    strokeWidth: 2, // normal border width preserved
                    symbolType: SymbolType.Circle,
                    fill: 'blue',
                    halo: {
                        enabled: true,
                        size: 8,
                        opacity: 0.3,
                    },
                }),
            );
        });

        test('preserves point color override on always-visible markers with halo', () => {
            const {points, series} = createSeries({
                normalEnabled: true,
                halo: {enabled: true},
                pointsData: [
                    {x: 1, y: 10, marker: {color: 'red'}},
                    {x: 2, y: 20},
                ],
            });
            const getHoverMarkers = buildLineHoverMarkerGetter(points, series);

            const result = getHoverMarkers([{data: points[0].data, series: {id: series.id}}]);
            expect(result[0].fill).toBe('red');
        });
    });

    describe('hover-only markers mode', () => {
        test('returns hover marker without halo when halo is disabled', () => {
            const {points, series} = createSeries({
                normalEnabled: false,
                halo: {enabled: false},
            });
            const getHoverMarkers = buildLineHoverMarkerGetter(points, series);

            const result = getHoverMarkers([{data: points[0].data, series: {id: series.id}}]);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    radius: 6, // hover radius
                    stroke: '#ffffff', // hover border
                    strokeWidth: 1,
                    halo: undefined,
                }),
            );
        });

        test('returns hover marker with halo when halo is enabled', () => {
            const {points, series} = createSeries({
                normalEnabled: false,
                halo: {enabled: true, size: 10, opacity: 0.5},
            });
            const getHoverMarkers = buildLineHoverMarkerGetter(points, series);

            const result = getHoverMarkers([{data: points[0].data, series: {id: series.id}}]);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    radius: 6,
                    stroke: '#ffffff',
                    strokeWidth: 1,
                    halo: {
                        enabled: true,
                        size: 10,
                        opacity: 0.5,
                    },
                }),
            );
        });

        test('preserves opacity: 0 on halo', () => {
            const {points, series} = createSeries({
                normalEnabled: false,
                halo: {enabled: true, size: 6, opacity: 0},
            });
            const getHoverMarkers = buildLineHoverMarkerGetter(points, series);

            const result = getHoverMarkers([{data: points[0].data, series: {id: series.id}}]);
            expect(result[0].halo).toEqual({
                enabled: true,
                size: 6,
                opacity: 0,
            });
        });
    });

    describe('hover controls and lifecycle', () => {
        test('returns empty when hover markers are disabled', () => {
            const {points, series} = createSeries({
                normalEnabled: true,
                hoverEnabled: false,
                halo: {enabled: true},
            });
            const getHoverMarkers = buildLineHoverMarkerGetter(points, series);

            expect(getHoverMarkers([{data: points[0].data, series: {id: series.id}}])).toEqual([]);
        });

        test('hover movement from point A to point B returns only the currently hovered point', () => {
            const {points, series} = createSeries({
                normalEnabled: true,
                halo: {enabled: true},
            });
            const getHoverMarkers = buildLineHoverMarkerGetter(points, series);

            // Hover on point 0
            const hoverA = getHoverMarkers([{data: points[0].data, series: {id: series.id}}]);
            expect(hoverA).toHaveLength(1);
            expect(hoverA[0].cx).toBe(0);

            // Move to point 1
            const hoverB = getHoverMarkers([{data: points[1].data, series: {id: series.id}}]);
            expect(hoverB).toHaveLength(1);
            expect(hoverB[0].cx).toBe(10);
        });

        test('hover cleanup returns empty array when hover ends', () => {
            const {points, series} = createSeries({
                normalEnabled: true,
                halo: {enabled: true},
            });
            const getHoverMarkers = buildLineHoverMarkerGetter(points, series);

            expect(getHoverMarkers([])).toEqual([]);
        });

        test('uses resolved non-circular symbol', () => {
            const {points, series} = createSeries({
                normalEnabled: true,
                symbol: SymbolType.Diamond,
                halo: {enabled: true},
            });
            const getHoverMarkers = buildLineHoverMarkerGetter(points, series);

            const result = getHoverMarkers([{data: points[0].data, series: {id: series.id}}]);
            expect(result[0].symbolType).toBe(SymbolType.Diamond);
        });

        test('respects per-point normal marker enabled override', () => {
            const {points, series} = createSeries({
                normalEnabled: false,
                halo: {enabled: true},
                pointsData: [
                    {x: 1, y: 10, marker: {states: {normal: {enabled: true}}}}, // always visible point
                    {x: 2, y: 20}, // hover-only point
                ],
            });
            const getHoverMarkers = buildLineHoverMarkerGetter(points, series);

            // Point 0 has normal enabled → normal appearance preserved
            const res0 = getHoverMarkers([{data: points[0].data, series: {id: series.id}}]);
            expect(res0[0].radius).toBe(4);
            expect(res0[0].stroke).toBe('#111111');

            // Point 1 is hover-only → hover appearance
            const res1 = getHoverMarkers([{data: points[1].data, series: {id: series.id}}]);
            expect(res1[0].radius).toBe(6);
            expect(res1[0].stroke).toBe('#ffffff');
        });
    });
});
