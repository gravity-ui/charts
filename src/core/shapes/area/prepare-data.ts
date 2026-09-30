import {group, min, sort} from 'd3-array';
import type {ScaleLogarithmic} from 'd3-scale';
import round from 'lodash/round';

import type {AreaSeriesData} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import type {ChartScale} from '../../scales/types';
import {prepareAnnotation} from '../../series/prepare-annotation';
import type {AnnotationAnchor, PreparedAreaSeries, PreparedSeriesOptions} from '../../series/types';
import {buildHoverMarkerGetter, getMarkerFill} from '../../shapes/marker';
import type {MarkerItem} from '../../shapes/types';
import {getXValue, getYValue, markHiddenPointsOutOfYRange} from '../../shapes/utils';
import {
    getDataCategoryValue,
    preparePointDataLabels,
    shouldPrepareSeriesDataLabels,
} from '../../utils';
import {getGradientBBox, setGradientPointFills} from '../../utils/gradient';
import {prepareGradientCoords} from '../../utils/gradient-reference';
import {getPositiveShare} from '../../utils/percentage';

import type {PointData, PreparedAreaData} from './types';
import {getAreaBBox} from './utils';

// Round after projecting cumulative values so small errors cannot push the
// top of a percent stack outside the plot.
const roundCoordinate = (value: number) => {
    const rounded = round(value, 2);
    // `round` keeps the sign of a negative zero; normalize it so that a coordinate
    // does not depend on the side the accumulated noise came from.
    return rounded === 0 ? 0 : rounded;
};

const SYNTHETIC_POINT: AreaSeriesData = {
    x: 0,
    y: 0,
    tooltip: {enabled: false},
    dataLabels: {enabled: false},
};

const syntheticPoints = new WeakMap<AreaSeriesData[], Map<string, AreaSeriesData>>();

function getSyntheticPoint(series: PreparedAreaSeries, key: string): AreaSeriesData {
    const data = series.fullData ?? series.data;
    let points = syntheticPoints.get(data);
    if (!points) {
        points = new Map();
        syntheticPoints.set(data, points);
    }
    let point = points.get(key);
    if (!point) {
        // Each missing position needs an identity shared by full and filtered geometry.
        point = {...SYNTHETIC_POINT};
        points.set(key, point);
    }
    return point;
}

function getXValues(series: PreparedAreaSeries[], xAxis: PreparedXAxis, xScale: ChartScale) {
    const categories = xAxis.categories || [];
    const xValues = series.reduce<Map<string, number>>((acc, s) => {
        s.data.forEach((d) => {
            const key = String(
                xAxis.type === 'category'
                    ? getDataCategoryValue({axisDirection: 'x', categories, data: d})
                    : d.x,
            );
            const xValue = getXValue({point: d, points: s.data, xAxis, xScale});
            if (!acc.has(key) && xValue !== null) {
                acc.set(key, xValue);
            }
        });
        return acc;
    }, new Map());

    if (xAxis.type === 'category') {
        return categories.reduce<[string, number][]>((acc, category) => {
            const xValue = xValues.get(category);
            if (typeof xValue === 'number') {
                acc.push([category, xValue]);
            }

            return acc;
        }, []);
    }

    return sort(Array.from(xValues), (d) => d[1]);
}

function getNeighborPoint(data: Map<string, AreaSeriesData> | undefined, key: string | undefined) {
    return key === undefined ? undefined : data?.get(key);
}

export const prepareAreaData = async (args: {
    series: PreparedAreaSeries[];
    seriesOptions?: PreparedSeriesOptions;
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    split: PreparedSplit;
    isOutsideBounds: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
    geometryOnly?: boolean;
}): Promise<PreparedAreaData[]> => {
    const {
        series,
        seriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
        split,
        isOutsideBounds,
        isRangeSlider,
        geometryOnly,
    } = args;
    const xMax = Math.max(...xScale.range());

    const result: PreparedAreaData[] = [];
    const dataByPlots = Array.from(
        group(
            series,
            (s) => {
                const yAxisIndex = s.yAxis;
                const seriesYAxis = yAxis[yAxisIndex];
                const plotIndex = seriesYAxis.plotIndex;
                return plotIndex;
            },
            (s) => JSON.stringify([s.yAxis, s.stackId]),
        ),
    );

    const plotIndexes = Object.keys(dataByPlots);
    for (let plotDataIndex = 0; plotDataIndex < plotIndexes.length; plotDataIndex++) {
        const [plotIndex, stackItems] = dataByPlots[plotDataIndex];
        const list = Array.from(stackItems);
        for (let i = 0; i < list.length; i++) {
            const [_stackId, seriesStack] = list[i];

            const xValues = getXValues(seriesStack, xAxis, xScale);

            const seriesDataMaps = new Map(
                seriesStack.map((s) => [
                    s,
                    new Map(
                        s.data.map((d) => [
                            String(
                                xAxis.type === 'category'
                                    ? getDataCategoryValue({
                                          axisDirection: 'x',
                                          categories: xAxis.categories || [],
                                          data: d,
                                      })
                                    : d.x,
                            ),
                            d,
                        ]),
                    ),
                ]),
            );
            const hasFilteredData = seriesStack.some((s) => s.fullData && s.fullData !== s.data);
            const contextSeries = hasFilteredData
                ? seriesStack.map((s) => ({...s, data: s.fullData ?? s.data}))
                : seriesStack;
            const contextXValues = (
                hasFilteredData ? getXValues(contextSeries, xAxis, xScale) : xValues
            ).map(([key]) => key);
            const neighbors = new Map(
                contextXValues.map((key, index) => [
                    key,
                    {
                        prev: contextXValues[index - 1],
                        next: contextXValues[index + 1],
                    },
                ]),
            );
            const contextMaps = hasFilteredData
                ? new Map(
                      seriesStack.map((s) => [
                          s,
                          new Map(
                              (s.fullData ?? s.data).map((d) => [
                                  String(
                                      xAxis.type === 'category'
                                          ? getDataCategoryValue({
                                                axisDirection: 'x',
                                                categories: xAxis.categories || [],
                                                data: d,
                                            })
                                          : d.x,
                                  ),
                                  d,
                              ]),
                          ),
                      ]),
                  )
                : seriesDataMaps;
            const isPercentStacking = seriesStack.some((s) => s.stacking === 'percent');
            const stackValues: Record<string, number> = {};
            const ratio: Record<string, number> = {};
            if (isPercentStacking) {
                xValues.forEach(([x]) => {
                    let stackTotal = 0;
                    let percentageTotal = 0;
                    seriesStack.forEach((s) => {
                        if (!yScale[s.yAxis]) {
                            return;
                        }
                        const data = seriesDataMaps.get(s);
                        if (!data) {
                            return;
                        }
                        const value = Number(data.get(x)?.y ?? 0);
                        if (!Number.isFinite(value)) {
                            return;
                        }
                        percentageTotal += Math.max(0, value);
                        // An isolated point between explicit nulls contributes no
                        // height to either section. Missing points are synthetic zeros.
                        const context = contextMaps.get(s);
                        const prev = getNeighborPoint(context, neighbors.get(x)?.prev);
                        const next = getNeighborPoint(context, neighbors.get(x)?.next);
                        if (s.nullMode === 'zero' || prev?.y !== null || next?.y !== null) {
                            stackTotal += value;
                        }
                    });
                    stackValues[x] = percentageTotal;
                    ratio[x] = stackTotal ? 100 / stackTotal : 1;
                });
            }

            const positiveStackValues = new Map<string, {prev: number; next: number}>();
            const negativeStackValues = new Map<string, {prev: number; next: number}>();
            xValues.forEach(([key]) => {
                positiveStackValues.set(key, {prev: 0, next: 0});
                negativeStackValues.set(key, {prev: 0, next: 0});
            });

            const seriesStackData: PreparedAreaData[] = [];
            // Process series in reverse order so that the first series in input
            // appears at the top of the stack (furthest from baseline)
            for (let j = seriesStack.length - 1; j >= 0; j--) {
                const s = seriesStack[j];
                const yAxisIndex = s.yAxis;
                const seriesYAxis = yAxis[yAxisIndex];
                const seriesYScale = yScale[yAxisIndex];

                if (!seriesYScale) {
                    continue;
                }

                const plot = split.plots[plotIndex];
                if (plot && plot.height <= 0) {
                    continue;
                }
                const yAxisTop = plot?.top || 0;

                let base = 0;
                if (seriesYAxis.type === 'logarithmic') {
                    const domainData = (seriesYScale as ScaleLogarithmic<number, number>).domain();
                    base = min(domainData) ?? 0;
                }

                const yMin =
                    getYValue({
                        point: {y: base},
                        points: s.data,
                        yAxis: seriesYAxis,
                        yScale: seriesYScale,
                    }) ?? 0;
                const seriesData = seriesDataMaps.get(s);
                if (!seriesData) {
                    continue;
                }
                // Stack data values before projecting them. Pixel-height sums depend
                // on the axis minimum on log scales and on its direction when reversed.
                const getStackY = (value: number | null, offset: number) => {
                    const total = value === null ? offset || base : value + offset;
                    return (
                        yAxisTop +
                        (getYValue({
                            point: {y: total},
                            yAxis: seriesYAxis,
                            yScale: seriesYScale,
                        }) ?? yMin)
                    );
                };
                const annotationOpts = seriesOptions?.area?.annotation;
                const points: PointData[] = [];

                for (let xIdx = 0; xIdx < xValues.length; xIdx++) {
                    const [x, xValue] = xValues[xIdx];
                    const rawData = seriesData.get(x);
                    const d = rawData ?? getSyntheticPoint(s, x);
                    let yDataValue = d.y ?? null;
                    const percentage =
                        s.stacking === 'percent'
                            ? getPositiveShare(Number(yDataValue), stackValues[x])
                            : undefined;
                    const pointAnnotation =
                        d.annotation && !isRangeSlider && !geometryOnly
                            ? await prepareAnnotation({
                                  annotation: d.annotation,
                                  optionsLabel: annotationOpts?.label,
                                  optionsPopup: annotationOpts?.popup,
                              })
                            : undefined;

                    if (s.nullMode === 'connect' && (yDataValue === null || !rawData)) {
                        continue;
                    }

                    if (yDataValue && isPercentStacking) {
                        yDataValue = Number(yDataValue) * ratio[x];
                    }

                    const yValue = getYValue({
                        point: {
                            y: yDataValue,
                        },
                        yAxis: seriesYAxis,
                        yScale: seriesYScale,
                    });

                    if (typeof yDataValue === 'number' && yValue !== null) {
                        const context = contextMaps.get(s);
                        const prevPoint = getNeighborPoint(context, neighbors.get(x)?.prev);
                        const nextPoint = getNeighborPoint(context, neighbors.get(x)?.next);
                        const currentPointStackHeight = Math.abs(yDataValue);

                        if (yDataValue >= 0) {
                            const positiveStackHeights = positiveStackValues.get(x);
                            let prevSectionStackHeight = positiveStackHeights?.prev ?? 0;
                            let nextSectionStackHeight = positiveStackHeights?.next ?? 0;

                            const point = {
                                y0: roundCoordinate(getStackY(null, prevSectionStackHeight)),
                                x: xValue,
                                y: roundCoordinate(getStackY(yDataValue, prevSectionStackHeight)),
                                color: d.marker?.color ?? d.color,
                                data: d,
                                percentage,
                                series: s,
                                annotation: pointAnnotation,
                            };

                            points.push(point);

                            // Sections are compared at the precision the coordinates are
                            // rounded to: a thinner step collapses into the same point
                            // anyway, and a second one would only duplicate the point
                            // together with its marker and its data label.
                            if (
                                roundCoordinate(getStackY(null, prevSectionStackHeight)) !==
                                roundCoordinate(getStackY(null, nextSectionStackHeight))
                            ) {
                                const point2 = {
                                    y0: roundCoordinate(getStackY(null, nextSectionStackHeight)),
                                    x: xValue,
                                    y: roundCoordinate(
                                        getStackY(yDataValue, nextSectionStackHeight),
                                    ),
                                    color: d.marker?.color ?? d.color,
                                    data: d,
                                    percentage,
                                    series: s,
                                };
                                points.push(point2);

                                if (isPercentStacking) {
                                    const newYValue = roundCoordinate(
                                        getStackY(
                                            yDataValue,
                                            Math.max(
                                                prevSectionStackHeight,
                                                nextSectionStackHeight,
                                            ),
                                        ),
                                    );
                                    point.y = newYValue;
                                    point2.y = newYValue;
                                }
                            }

                            if (prevPoint?.y !== null || s.nullMode === 'zero') {
                                prevSectionStackHeight =
                                    prevSectionStackHeight + currentPointStackHeight;
                            }

                            if (nextPoint?.y !== null || s.nullMode === 'zero') {
                                nextSectionStackHeight =
                                    nextSectionStackHeight + currentPointStackHeight;
                            }

                            positiveStackValues.set(x, {
                                prev: prevSectionStackHeight,
                                next: nextSectionStackHeight,
                            });
                        } else {
                            const negativeStackHeights = negativeStackValues.get(x);
                            let prevSectionStackHeight = negativeStackHeights?.prev ?? 0;
                            let nextSectionStackHeight = negativeStackHeights?.next ?? 0;

                            points.push({
                                y0: roundCoordinate(getStackY(null, -prevSectionStackHeight)),
                                x: xValue,
                                y: roundCoordinate(getStackY(yDataValue, -prevSectionStackHeight)),
                                color: d.marker?.color ?? d.color,
                                data: d,
                                percentage,
                                series: s,
                            });

                            if (
                                roundCoordinate(getStackY(null, -prevSectionStackHeight)) !==
                                roundCoordinate(getStackY(null, -nextSectionStackHeight))
                            ) {
                                points.push({
                                    y0: roundCoordinate(getStackY(null, -nextSectionStackHeight)),
                                    x: xValue,
                                    y: roundCoordinate(
                                        getStackY(yDataValue, -nextSectionStackHeight),
                                    ),
                                    color: d.marker?.color ?? d.color,
                                    data: d,
                                    percentage,
                                    series: s,
                                });
                            }

                            if (prevPoint?.y !== null) {
                                prevSectionStackHeight =
                                    prevSectionStackHeight + currentPointStackHeight;
                            }

                            if (nextPoint?.y !== null) {
                                nextSectionStackHeight =
                                    nextSectionStackHeight + currentPointStackHeight;
                            }

                            negativeStackValues.set(x, {
                                prev: prevSectionStackHeight,
                                next: nextSectionStackHeight,
                            });
                        }
                    } else {
                        points.push({
                            y0: roundCoordinate(yAxisTop + yMin),
                            x: xValue,
                            y: null,
                            color: d.marker?.color ?? d.color,
                            data: d,
                            percentage,
                            series: s,
                        });
                    }
                }

                markHiddenPointsOutOfYRange({
                    points,
                    yScale: seriesYScale,
                    yAxisTop,
                });

                const normalState = s.marker.states.normal;
                const hasPerPointNormalMarkers =
                    !geometryOnly && s.data.some((d) => d.marker?.states?.normal?.enabled);

                const lineBBox = s.gradient || s.fillGradient ? getGradientBBox(points) : null;
                const gradientBBox = s.gradient ? lineBBox : null;
                const fillGradientBBox = s.fillGradient ? getAreaBBox(points, lineBBox) : null;
                const gradientCoords = geometryOnly
                    ? undefined
                    : prepareGradientCoords({
                          bbox: gradientBBox,
                          gradient: s.gradient,
                          state: s.gradientState,
                          paint: 'stroke',
                          points,
                          xScale,
                          yScale: seriesYScale,
                          yAxisTop,
                      });
                const fillGradientCoords = geometryOnly
                    ? undefined
                    : prepareGradientCoords({
                          bbox: fillGradientBBox,
                          gradient: s.fillGradient,
                          state: s.gradientState,
                          paint: 'fill',
                          points,
                          xScale,
                          yScale: seriesYScale,
                          yAxisTop,
                      });
                if (!geometryOnly) {
                    setGradientPointFills(points, s.gradient, gradientCoords, gradientBBox);
                }

                const markers =
                    !geometryOnly && (s.marker.states.normal.enabled || hasPerPointNormalMarkers)
                        ? points.reduce<MarkerItem[]>((acc, p) => {
                              if (p.y === null || p.hiddenInLine) {
                                  return acc;
                              }
                              const pointNormalEnabled =
                                  p.data.marker?.states?.normal?.enabled ?? false;
                              if (s.marker.states.normal.enabled || pointNormalEnabled) {
                                  acc.push({
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
                              return acc;
                          }, [])
                        : [];

                const annotations = points.reduce<AnnotationAnchor[]>((result, p) => {
                    if (p.annotation && p.y !== null) {
                        result.push({annotation: p.annotation, x: p.x, y: p.y});
                    }
                    return result;
                }, []);

                seriesStackData.push({
                    annotations,
                    points,
                    gradientCoords,
                    fillGradientCoords,
                    gradientBBox,
                    fillGradientBBox,
                    markers,
                    getHoverMarkers: geometryOnly ? () => [] : buildHoverMarkerGetter(points, s),
                    svgLabels: [],
                    color: s.color,
                    opacity: s.opacity,
                    width: s.lineWidth,
                    series: s,
                    hovered: false,
                    active: true,
                    id: s.id,
                    htmlLabels: [],
                });
            }

            for (let itemIndex = 0; itemIndex < seriesStackData.length; itemIndex++) {
                const item = seriesStackData[itemIndex];
                const currentYAxis = yAxis[item.series.yAxis];
                const itemYAxisTop = split.plots[currentYAxis.plotIndex]?.top || 0;

                if (!isRangeSlider && !geometryOnly && shouldPrepareSeriesDataLabels(item.series)) {
                    const labelsData = await preparePointDataLabels({
                        series: item.series,
                        points: item.points,
                        xMax,
                        yAxisTop: itemYAxisTop,
                        isOutsideBounds,
                        getFormatContext: (point) => ({
                            data: point.data,
                            percentage: point.percentage,
                        }),
                    });
                    item.svgLabels.push(...labelsData.svgLabels);
                    item.htmlLabels.push(...labelsData.htmlLabels);
                }
            }

            result.push(...seriesStackData);
        }
    }

    return result;
};
