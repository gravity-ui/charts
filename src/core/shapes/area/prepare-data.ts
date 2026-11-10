import {group, min, sort} from 'd3-array';
import type {ScaleLogarithmic} from 'd3-scale';
import round from 'es-toolkit/compat/round';

import type {AreaSeriesData} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import type {ChartScale} from '../../scales/types';
import {prepareAnnotation} from '../../series/prepare-annotation';
import type {PreparedAreaSeries, PreparedSeriesOptions} from '../../series/types';
import {buildHoverMarkerGetter, getMarkerFill} from '../../shapes/marker';
import {getXValue, getYValue, markHiddenPointsOutOfYRange} from '../../shapes/utils';
import {
    getDataCategoryValue,
    preparePointDataLabels,
    shouldPrepareSeriesDataLabels,
} from '../../utils';
import {getGradientBBox, setGradientPointFills} from '../../utils/gradient';
import {applyCapturedPointColors, prepareGradientCoords} from '../../utils/gradient-reference';
import {getPositiveShare} from '../../utils/percentage';

import {createAreaStackAccumulator, getAreaNeighborPoint, getAreaStackContext} from './stack';
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

export const projectAreaData = (args: {
    series: PreparedAreaSeries[];
    seriesOptions?: PreparedSeriesOptions;
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    split: PreparedSplit;
    isOutsideBounds: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
}): PreparedAreaData[] => {
    const {series, xAxis, xScale, yAxis, yScale, split} = args;

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
            const stackContext = hasFilteredData
                ? getAreaStackContext(
                      seriesStack,
                      xAxis,
                      xAxis.type !== 'category' && xScale.range()[1] < xScale.range()[0],
                  )
                : undefined;
            const neighbors =
                stackContext?.neighbors ??
                new Map(
                    xValues.map(([key], index) => [
                        key,
                        {prev: xValues[index - 1]?.[0], next: xValues[index + 1]?.[0]},
                    ]),
                );
            const contextMaps = stackContext
                ? new Map(seriesStack.map((s, index) => [s, stackContext.dataMaps[index]]))
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
                        const prev = getAreaNeighborPoint(context, neighbors.get(x)?.prev);
                        const next = getAreaNeighborPoint(context, neighbors.get(x)?.next);
                        if (s.nullMode === 'zero' || prev?.y !== null || next?.y !== null) {
                            stackTotal += value;
                        }
                    });
                    stackValues[x] = percentageTotal;
                    ratio[x] = stackTotal ? 100 / stackTotal : 1;
                });
            }

            const getStackOffsets = createAreaStackAccumulator();

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

                    if (typeof yDataValue !== 'number' || yValue === null) {
                        points.push({
                            y0: roundCoordinate(yAxisTop + yMin),
                            x: xValue,
                            y: null,
                            color: d.marker?.color ?? d.color,
                            data: d,
                            percentage,
                            series: s,
                        });
                        continue;
                    }
                    const context = contextMaps.get(s);
                    const offsets = getStackOffsets({
                        key: x,
                        value: yDataValue,
                        prev: getAreaNeighborPoint(context, neighbors.get(x)?.prev),
                        next: getAreaNeighborPoint(context, neighbors.get(x)?.next),
                        nullMode: s.nullMode,
                    });
                    // Collapse section steps that project to the same rounded coordinate.
                    const hasStep =
                        roundCoordinate(getStackY(null, offsets.prev)) !==
                        roundCoordinate(getStackY(null, offsets.next));
                    const equalizeTop = hasStep && isPercentStacking && yDataValue >= 0;
                    const topOffset = equalizeTop
                        ? Math.max(offsets.prev, offsets.next)
                        : offsets.prev;
                    const point = {
                        y0: roundCoordinate(getStackY(null, offsets.prev)),
                        x: xValue,
                        y: roundCoordinate(getStackY(yDataValue, topOffset)),
                        color: d.marker?.color ?? d.color,
                        data: d,
                        percentage,
                        series: s,
                    };
                    points.push(point);
                    if (hasStep) {
                        points.push({
                            ...point,
                            y0: roundCoordinate(getStackY(null, offsets.next)),
                            y: equalizeTop
                                ? point.y
                                : roundCoordinate(getStackY(yDataValue, offsets.next)),
                        });
                    }
                }

                markHiddenPointsOutOfYRange({
                    points,
                    yScale: seriesYScale,
                    yAxisTop,
                });

                const lineBBox = s.gradient || s.fillGradient ? getGradientBBox(points) : null;
                seriesStackData.push({
                    annotations: [],
                    points,
                    gradientBBox: s.gradient ? lineBBox : null,
                    fillGradientBBox: s.fillGradient ? getAreaBBox(points, lineBBox) : null,
                    markers: [],
                    getHoverMarkers: () => [],
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

            result.push(...seriesStackData);
        }
    }

    return result;
};

export async function prepareAreaData(
    args: Parameters<typeof projectAreaData>[0],
): Promise<PreparedAreaData[]> {
    const {seriesOptions, xScale, yAxis, yScale, split, isOutsideBounds, isRangeSlider} = args;
    const xMax = Math.max(...xScale.range());
    const result = projectAreaData(args);
    for (const item of result) {
        const s = item.series;
        const seriesYAxis = yAxis[s.yAxis];
        const seriesYScale = yScale[s.yAxis];
        if (!seriesYScale) continue;
        const yAxisTop = split.plots[seriesYAxis.plotIndex]?.top || 0;
        const {points, gradientBBox, fillGradientBBox} = item;
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
        item.fillGradientCoords = prepareGradientCoords({
            bbox: fillGradientBBox,
            gradient: s.fillGradient,
            state: s.gradientState,
            paint: 'fill',
            points,
            xScale,
            yScale: seriesYScale,
            yAxisTop,
        });
        setGradientPointFills(points, s.gradient, item.gradientCoords, gradientBBox);
        applyCapturedPointColors(points, s.gradientState, s.gradient, xScale, seriesYScale);
        const annotationOpts = seriesOptions?.area?.annotation;
        const normal = s.marker.states.normal;
        const annotated = new Set<AreaSeriesData>();
        for (const point of points) {
            if (point.data.annotation && !isRangeSlider && !annotated.has(point.data)) {
                annotated.add(point.data);
                point.annotation = await prepareAnnotation({
                    annotation: point.data.annotation,
                    optionsLabel: annotationOpts?.label,
                    optionsPopup: annotationOpts?.popup,
                });
                if (point.y !== null) {
                    item.annotations.push({annotation: point.annotation, x: point.x, y: point.y});
                }
            }
            if (
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
        item.getHoverMarkers = buildHoverMarkerGetter(points, s, isOutsideBounds);
        if (!isRangeSlider && shouldPrepareSeriesDataLabels(s)) {
            const labels = await preparePointDataLabels({
                series: s,
                points,
                xMax,
                yAxisTop,
                isOutsideBounds,
                getFormatContext: (point) => ({data: point.data, percentage: point.percentage}),
            });
            item.svgLabels.push(...labels.svgLabels);
            item.htmlLabels.push(...labels.htmlLabels);
        }
    }
    return result;
}
