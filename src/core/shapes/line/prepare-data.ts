import type {CurveFactory} from 'd3-shape';

import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import type {ChartScale} from '../../scales/types';
import {prepareAnnotation} from '../../series/prepare-annotation';
import type {PreparedLineSeries, PreparedSeries, PreparedSeriesOptions} from '../../series/types';
import {getGradientBBox, setGradientPointFills} from '../../utils/gradient';
import {applyCapturedPointColors, prepareGradientCoords} from '../../utils/gradient-reference';
import {getMarkerFill} from '../marker';
import type {HoveredShapeData, MarkerItem, ShapeLabels} from '../types';
import {getXValue, getYValue, markHiddenPointsOutOfYRange} from '../utils';

import type {PlacementRect, PlacementSegment} from './auto-placement';
import {
    getLineSegments,
    getObstacleRectsFromLayers,
    needsPlacementChecks,
    placeLineDataLabels,
} from './auto-placement';
import type {PointData, PreparedLineData} from './types';

export function buildLineHoverMarkerGetter(
    points: PointData[],
    series: PreparedLineSeries,
): (hoveredData: HoveredShapeData[]) => MarkerItem[] {
    const {normal: normalState, hover: hoverState} = series.marker.states;

    if (!hoverState.enabled) return () => [];

    const haloEnabled = Boolean(hoverState.halo?.enabled);

    const pointsByData = new Map<unknown, PointData[]>();
    for (const p of points) {
        if (p.x !== null && p.y !== null && !p.hiddenInLine) {
            const dataPoints = pointsByData.get(p.data) ?? [];
            dataPoints.push(p);
            pointsByData.set(p.data, dataPoints);
        }
    }

    return (hoveredData: HoveredShapeData[]) => {
        const items: MarkerItem[] = [];
        for (const hovered of hoveredData) {
            if (hovered.series?.id !== undefined && hovered.series.id !== series.id) {
                continue;
            }

            const dataPoints = pointsByData.get(hovered.data);
            const hasGeometry = hovered.x !== undefined && hovered.y1 !== undefined;
            const point = hasGeometry
                ? dataPoints?.find((p) => p.x === hovered.x && p.y === hovered.y1)
                : dataPoints?.[dataPoints.length - 1];
            if (!point || point.x === null || point.y === null) continue;

            const isNormalMarkerVisible =
                point.data.marker?.states?.normal?.enabled ?? normalState.enabled;

            if (isNormalMarkerVisible && !haloEnabled) {
                continue;
            }

            const markerState = isNormalMarkerVisible ? normalState : hoverState;

            items.push({
                cx: point.x,
                cy: point.y,
                radius: markerState.radius,
                symbolType: normalState.symbol,
                fill: getMarkerFill(point, series.color),
                stroke: markerState.borderColor,
                strokeWidth: markerState.borderWidth,
                opacity: 1,
                active: true,
                clipped: false,
                series: {id: series.id},
                data: hovered.data,
                halo: haloEnabled ? hoverState.halo : undefined,
            });
        }
        return items;
    };
}

function isLabeledLineLayer(layer: ShapeLabels): boolean {
    const layerSeries = (layer as Partial<PreparedLineData>).series;
    return layerSeries?.type === 'line' && layerSeries.dataLabels.enabled;
}

interface Args {
    series: PreparedLineSeries[];
    seriesOptions?: PreparedSeriesOptions;
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    split: PreparedSplit;
    isOutsideBounds: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
    otherLayers?: ShapeLabels[];
    allSeries?: PreparedSeries[];
    getCurveFactory?: (interpolation?: PreparedLineSeries['interpolation']) => CurveFactory;
}

export function projectLineData(args: Args): PreparedLineData[] {
    const {series, xAxis, yAxis, xScale, yScale, split, isRangeSlider} = args;
    const result: PreparedLineData[] = [];
    for (const s of series) {
        const seriesYAxis = yAxis[s.yAxis];
        const plot = split.plots[seriesYAxis.plotIndex];
        const seriesYScale = yScale[s.yAxis];
        if (!seriesYScale || (plot && plot.height <= 0)) {
            continue;
        }
        const yAxisTop = plot?.top || 0;
        const points = s.data.map<PointData>((data) => {
            const y = getYValue({
                point: data,
                points: s.data,
                yAxis: seriesYAxis,
                yScale: seriesYScale,
            });
            return {
                x: getXValue({point: data, points: s.data, xAxis, xScale}),
                y: y === null ? null : yAxisTop + y,
                color: data.marker?.color ?? data.color,
                data,
                series: s,
            };
        });
        markHiddenPointsOutOfYRange({
            points,
            yScale: seriesYScale,
            yAxisTop,
            axisMin: seriesYAxis.min,
            axisMax: seriesYAxis.max,
            getDataY: (point) => point.data.y,
        });
        result.push({
            points,
            gradientBBox: s.gradient ? getGradientBBox(points) : null,
            markers: [],
            annotations: [],
            getHoverMarkers: () => [],
            svgLabels: [],
            series: s,
            hovered: false,
            active: true,
            id: s.id,
            htmlLabels: [],
            color: s.color,
            lineWidth: (isRangeSlider ? s.rangeSlider.lineWidth : undefined) ?? s.lineWidth,
            dashStyle: s.dashStyle,
            linecap: s.linecap,
            linejoin: s.linejoin,
            interpolation: s.interpolation,
            opacity: (isRangeSlider ? s.rangeSlider.opacity : undefined) ?? s.opacity,
        });
    }
    return result;
}

export const prepareLineData = async (args: Args): Promise<PreparedLineData[]> => {
    const {
        series,
        seriesOptions,
        xAxis,
        yAxis,
        xScale,
        yScale,
        split,
        isOutsideBounds,
        isRangeSlider,
        otherLayers,
        allSeries,
        getCurveFactory,
    } = args;
    const xMax = Math.max(...xScale.range());
    const acc = projectLineData(args);
    for (const item of acc) {
        const s = item.series;
        const seriesYAxis = yAxis[s.yAxis];
        const seriesYScale = yScale[s.yAxis];
        if (!seriesYScale) continue;
        const yAxisTop = split.plots[seriesYAxis.plotIndex]?.top || 0;
        const {points, gradientBBox} = item;
        item.gradientCoords = prepareGradientCoords({
            bbox: gradientBBox,
            gradient: s.gradient,
            state: s.gradientState,
            paint: 'stroke',
            points,
            xScale,
            yScale: seriesYScale,
            yAxisTop,
        });
        setGradientPointFills(points, s.gradient, item.gradientCoords, gradientBBox);
        applyCapturedPointColors(points, s.gradientState, s.gradient, xScale, seriesYScale);
        const annotationOpts = seriesOptions?.line?.annotation;
        const normal = s.marker.states.normal;
        for (const point of points) {
            if (point.data.annotation && !isRangeSlider) {
                point.annotation = await prepareAnnotation({
                    annotation: point.data.annotation,
                    optionsLabel: annotationOpts?.label,
                    optionsPopup: annotationOpts?.popup,
                });
                if (point.x !== null && point.y !== null) {
                    item.annotations.push({annotation: point.annotation, x: point.x, y: point.y});
                }
            }
            if (
                point.x === null ||
                point.y === null ||
                point.hiddenInLine ||
                !(normal.enabled || point.data.marker?.states?.normal?.enabled)
            ) {
                continue;
            }
            item.markers.push({
                cx: point.x,
                cy: point.y,
                radius: normal.radius,
                symbolType: normal.symbol,
                fill: getMarkerFill(point, s.color),
                stroke: normal.borderColor,
                strokeWidth: normal.borderWidth,
                opacity: 1,
                active: true,
                clipped: isOutsideBounds(point.x, point.y),
                series: {id: s.id},
                data: point.data,
            });
        }
        item.getHoverMarkers = buildLineHoverMarkerGetter(points, s);
    }

    const labeled = isRangeSlider ? [] : acc.filter((d) => d.series.dataLabels.enabled);

    if (labeled.length > 0) {
        const needSegments = labeled.some((d) => needsPlacementChecks(d.series));
        const needSimulation = labeled.some(
            (d) => needsPlacementChecks(d.series) && !d.series.dataLabels.allowOverlap,
        );

        const ownData = new Map(acc.map((d) => [d.series.id, d]));

        let segments: PlacementSegment[] = [];
        let obstacles: PlacementRect[] = [];
        let toPlace: Array<{points: PointData[]; series: PreparedLineSeries}> = labeled.map(
            (d) => ({points: d.points, series: d.series}),
        );

        if (needSegments || needSimulation) {
            const projectPoints = (s: PreparedLineSeries): PointData[] | null => {
                const seriesYAxis = yAxis[s.yAxis];
                const seriesYScale = yScale[s.yAxis];
                if (!seriesYScale) {
                    return null;
                }
                const yAxisTop = split.plots[seriesYAxis.plotIndex]?.top || 0;
                const points = s.data.map<PointData>((d) => {
                    const yValue = getYValue({
                        point: d,
                        points: s.data,
                        yAxis: seriesYAxis,
                        yScale: seriesYScale,
                    });
                    return {
                        x: getXValue({point: d, points: s.data, xAxis, xScale}),
                        y: yValue === null ? null : yAxisTop + yValue,
                        data: d,
                        series: s,
                    };
                });
                markHiddenPointsOutOfYRange({
                    points,
                    yScale: seriesYScale,
                    yAxisTop,
                    axisMin: seriesYAxis.min,
                    axisMax: seriesYAxis.max,
                    getDataY: (p) => p.data.y,
                });
                return points;
            };

            const allLineSeries = ((allSeries ?? series) as PreparedSeries[]).filter(
                (s): s is PreparedLineSeries => s.type === 'line',
            );
            const seriesWithPoints: Array<{points: PointData[]; series: PreparedLineSeries}> = [];
            for (const s of allLineSeries) {
                const points = ownData.get(s.id)?.points ?? projectPoints(s);
                if (points) {
                    seriesWithPoints.push({points, series: s});
                }
            }

            if (needSegments) {
                segments = getLineSegments(
                    seriesWithPoints.map((d) => ({
                        curveFactory:
                            d.series.interpolation && d.series.interpolation.type !== 'linear'
                                ? getCurveFactory?.(d.series.interpolation)
                                : undefined,
                        lineWidth: d.series.lineWidth,
                        points: d.points,
                    })),
                );
            }

            if (needSimulation) {
                obstacles = getObstacleRectsFromLayers(
                    (otherLayers ?? []).filter((l) => !isLabeledLineLayer(l)),
                );
                toPlace = seriesWithPoints.filter((d) => d.series.dataLabels.enabled);
            }
        }

        const pendingOwn = new Set(labeled.map((d) => d.series.id));
        for (const {points, series: s} of toPlace) {
            if (pendingOwn.size === 0) {
                break;
            }
            const seriesYScale = yScale[s.yAxis];
            if (!seriesYScale) {
                continue;
            }
            const yAxisTop = split.plots[yAxis[s.yAxis].plotIndex]?.top || 0;
            const yBottom = yAxisTop + Math.max(...(seriesYScale.range() as number[]));
            const labels = await placeLineDataLabels({
                bounds: {xMax, yBottom, yTop: yAxisTop},
                isOutsideBounds,
                obstacles,
                points,
                segments,
                series: s,
            });
            const own = ownData.get(s.id);
            if (own) {
                own.svgLabels = labels.svgLabels;
                own.htmlLabels = labels.htmlLabels;
                pendingOwn.delete(s.id);
            }
        }
    }

    return acc;
};
