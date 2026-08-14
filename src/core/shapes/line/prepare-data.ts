import type {CurveFactory} from 'd3-shape';

import type {ShapeDataWithLabels} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import type {ChartScale} from '../../scales/types';
import {prepareAnnotation} from '../../series/prepare-annotation';
import type {
    AnnotationAnchor,
    PreparedLineSeries,
    PreparedSeries,
    PreparedSeriesOptions,
} from '../../series/types';
import {setGradientPointFills} from '../../utils/gradient';
import {buildHoverMarkerGetter, getMarkerFill} from '../marker';
import type {MarkerItem} from '../types';
import {getXValue, getYValue, markHiddenPointsOutOfYRange} from '../utils';

import type {PlacementRect, PlacementSegment} from './auto-placement';
import {
    getLineSegments,
    getObstacleRectsFromLayers,
    needsPlacementChecks,
    placeLineDataLabels,
} from './auto-placement';
import type {PointData, PreparedLineData} from './types';

function isLabeledLineLayer(layer: ShapeDataWithLabels): boolean {
    const layerSeries = (layer as Partial<PreparedLineData>).series;
    return layerSeries?.type === 'line' && layerSeries.dataLabels.enabled;
}

export const prepareLineData = async (args: {
    series: PreparedLineSeries[];
    seriesOptions?: PreparedSeriesOptions;
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    split: PreparedSplit;
    isOutsideBounds: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
    otherLayers?: ShapeDataWithLabels[];
    allSeries?: PreparedSeries[];
    getCurveFactory?: (interpolation?: PreparedLineSeries['interpolation']) => CurveFactory;
}): Promise<PreparedLineData[]> => {
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

    const acc: PreparedLineData[] = [];
    for (let i = 0; i < series.length; i++) {
        const s = series[i];
        const yAxisIndex = s.yAxis;
        const seriesYAxis = yAxis[yAxisIndex];
        const yAxisTop = split.plots[seriesYAxis.plotIndex]?.top || 0;
        const seriesYScale = yScale[s.yAxis];

        if (!seriesYScale) {
            continue;
        }
        const annotationOpts = seriesOptions?.line?.annotation;
        const points: PointData[] = [];
        for (let j = 0; j < s.data.length; j++) {
            const d = s.data[j];
            const yValue = getYValue({
                point: d,
                points: s.data,
                yAxis: seriesYAxis,
                yScale: seriesYScale,
            });
            points.push({
                x: getXValue({point: d, points: s.data, xAxis, xScale}),
                y: yValue === null ? null : yAxisTop + yValue,
                color: d.marker?.color ?? d.color,
                data: d,
                series: s,
                annotation:
                    d.annotation && !isRangeSlider
                        ? await prepareAnnotation({
                              annotation: d.annotation,
                              optionsLabel: annotationOpts?.label,
                              optionsPopup: annotationOpts?.popup,
                          })
                        : undefined,
            });
        }

        markHiddenPointsOutOfYRange({
            points,
            yScale: seriesYScale,
            yAxisTop,
            axisMin: seriesYAxis.min,
            axisMax: seriesYAxis.max,
            getDataY: (p) => p.data.y,
        });

        const normalState = s.marker.states.normal;
        const hasPerPointNormalMarkers = s.data.some((d) => d.marker?.states?.normal?.enabled);

        setGradientPointFills(points, s.gradient);

        const markers =
            s.marker.states.normal.enabled || hasPerPointNormalMarkers
                ? points.reduce<MarkerItem[]>((result, p) => {
                      if (p.y === null || p.x === null || p.hiddenInLine) {
                          return result;
                      }
                      const pointNormalEnabled = p.data.marker?.states?.normal?.enabled ?? false;
                      if (s.marker.states.normal.enabled || pointNormalEnabled) {
                          result.push({
                              cx: p.x,
                              cy: p.y,
                              radius: normalState.radius,
                              symbolType: normalState.symbol,
                              fill: getMarkerFill(p, s.color),
                              stroke: normalState.borderColor,
                              strokeWidth: normalState.borderWidth,
                              opacity: 1,
                              active: true,
                              clipped: isOutsideBounds(p.x, p.y),
                              series: {id: s.id},
                              data: p.data,
                          });
                      }
                      return result;
                  }, [])
                : [];

        const annotations = points.reduce<AnnotationAnchor[]>((result, p) => {
            if (p.annotation && p.x !== null && p.y !== null) {
                result.push({annotation: p.annotation, x: p.x, y: p.y});
            }
            return result;
        }, []);

        const result: PreparedLineData = {
            annotations,
            points,
            markers,
            getHoverMarkers: buildHoverMarkerGetter(points, s),
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
        };

        acc.push(result);
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
