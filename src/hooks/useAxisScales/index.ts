import React from 'react';

import {extent, scaleBand, scaleLinear, scaleLog, scaleUtc} from 'd3';
import type {AxisDomain, AxisScale, ScaleBand, ScaleLinear, ScaleTime} from 'd3';
import get from 'lodash/get';

import {DEFAULT_AXIS_TYPE, SERIES_TYPE} from '../../constants';
import type {
    PreparedAxis,
    PreparedSeries,
    PreparedSeriesOptions,
    PreparedSplit,
    PreparedXAxis,
    RangeSliderState,
    ZoomState,
} from '../../hooks';
import type {ChartAxis, ChartAxisType, ChartSeries} from '../../types';
import {
    CHART_SERIES_WITH_VOLUME_ON_Y_AXIS,
    getAxisCategories,
    getAxisHeight,
    getDataCategoryValue,
    getDefaultMaxXAxisValue,
    getDefaultMinXAxisValue,
    getDomainDataXBySeries,
    getDomainDataYBySeries,
    getOnlyVisibleSeries,
    isAxisRelatedSeries,
    isSeriesWithCategoryValues,
} from '../../utils';
import type {AxisDirection} from '../../utils';
import {getBarXLayoutForNumericScale, groupBarXDataByXValue} from '../utils/bar-x';
import {getBandSize} from '../utils/get-band-size';

import {getMinMaxPropsOrState, hasOnlyMarkerSeries, isZeroDomain} from './utils';

export type ChartScale =
    | ScaleLinear<number, number>
    | ScaleBand<string>
    | ScaleTime<number, number>;

type Args = {
    boundsWidth: number;
    boundsHeight: number;
    series: PreparedSeries[];
    seriesOptions: PreparedSeriesOptions;
    xAxis: PreparedAxis | null;
    yAxis: PreparedAxis[];
    split: PreparedSplit;
    rangeSliderState?: RangeSliderState;
    zoomState?: Partial<ZoomState>;
};

type ReturnValue = {
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
};

const X_AXIS_ZOOM_PADDING = 0.02;

function validateArrayData(data: unknown[]) {
    let hasNumberAndNullValues: boolean | undefined;
    let hasOnlyNullValues: boolean | undefined;

    for (const d of data) {
        const isNumber = typeof d === 'number';
        const isNull = d === null;
        hasNumberAndNullValues =
            typeof hasNumberAndNullValues === 'undefined'
                ? isNumber || isNull
                : hasNumberAndNullValues && (isNumber || isNull);
        hasOnlyNullValues =
            typeof hasOnlyNullValues === 'undefined' ? isNull : hasOnlyNullValues && isNull;

        if (!hasNumberAndNullValues) {
            break;
        }
    }

    return {hasNumberAndNullValues, hasOnlyNullValues};
}

function filterCategoriesByVisibleSeries(args: {
    axisDirection: AxisDirection;
    categories: string[];
    series: (PreparedSeries | ChartSeries)[];
}) {
    const {axisDirection, categories, series} = args;

    const visibleCategories = new Set();
    series.forEach((s) => {
        if (isSeriesWithCategoryValues(s)) {
            s.data.forEach((d) => {
                visibleCategories.add(getDataCategoryValue({axisDirection, categories, data: d}));
            });
        }
    });
    const filteredCategories = categories.filter((c) => visibleCategories.has(c));

    return filteredCategories.length > 0 ? filteredCategories : categories;
}

// axis is validated in `validation/index.ts`, so the value of `axis.type` is definitely valid.
// eslint-disable-next-line consistent-return
function getYScaleRange(args: {axis: PreparedAxis; boundsHeight: number}): [number, number] {
    const {axis, boundsHeight} = args;
    switch (axis.type) {
        case 'datetime':
        case 'linear':
        case 'logarithmic': {
            const range: [number, number] = [boundsHeight, 0];

            switch (axis.order) {
                case 'sortDesc':
                case 'reverse': {
                    range.reverse();
                }
            }

            return range;
        }
        case 'category': {
            return [boundsHeight, 0];
        }
    }
}

function isSeriesWithYAxisOffset(series: (PreparedSeries | ChartSeries)[]) {
    const types = [SERIES_TYPE.BarY, SERIES_TYPE.Heatmap] as string[];
    return series.some((s) => types.includes(s.type));
}

// eslint-disable-next-line complexity
export function createYScale(args: {
    axis: PreparedAxis;
    boundsHeight: number;
    series: (PreparedSeries | ChartSeries)[];
    zoomStateY?: [number, number];
}) {
    const {axis, boundsHeight, series, zoomStateY} = args;
    const [yMinPropsOrState, yMaxPropsOrState] = getMinMaxPropsOrState({
        axis,
        maxValues: [zoomStateY?.[1]],
        minValues: [zoomStateY?.[0]],
    });

    const yCategories = get(axis, 'categories');
    const yTimestamps = get(axis, 'timestamps');
    const range = getYScaleRange({axis, boundsHeight});

    switch (axis.type) {
        case 'linear':
        case 'logarithmic': {
            const domain = getDomainDataYBySeries(series);
            const {hasNumberAndNullValues, hasOnlyNullValues} = validateArrayData(domain);

            if (hasOnlyNullValues || domain.length === 0) {
                return undefined;
            }

            if (
                series.some(
                    (s) => (s.type === 'bar-x' || s.type === 'area') && s.stacking === 'percent',
                )
            ) {
                return scaleLinear().domain([0, 100]).range(range);
            }

            if (hasNumberAndNullValues) {
                const [yMinDomain, yMaxDomain] = extent(domain as [number, number]) as [
                    number,
                    number,
                ];
                const zeroDomain = hasOnlyMarkerSeries(series)
                    ? isZeroDomain([yMinDomain, yMaxDomain])
                    : false;

                const yMin =
                    typeof yMinPropsOrState === 'number' && !zeroDomain
                        ? yMinPropsOrState
                        : yMinDomain;
                let yMax: number;

                if (typeof yMaxPropsOrState === 'number' && !zeroDomain) {
                    yMax = yMaxPropsOrState;
                } else {
                    const hasSeriesWithVolumeOnYAxis = series.some((s) =>
                        CHART_SERIES_WITH_VOLUME_ON_Y_AXIS.includes(s.type),
                    );
                    yMax = hasSeriesWithVolumeOnYAxis ? Math.max(yMaxDomain, 0) : yMaxDomain;
                }

                const scaleFn = axis.type === 'logarithmic' ? scaleLog : scaleLinear;
                const scale = scaleFn().domain([yMin, yMax]).range(range);

                let offsetMin = 0;
                // We should ignore padding if we are drawing only one point on the plot.
                let offsetMax = yMin === yMax ? 0 : boundsHeight * axis.maxPadding;
                if (isSeriesWithYAxisOffset(series)) {
                    if (domain.length > 1) {
                        const bandWidth = getBandSize({
                            scale: scale as AxisScale<AxisDomain>,
                            domain: domain as AxisDomain[],
                        });

                        offsetMin += bandWidth / 2;
                        offsetMax += bandWidth / 2;
                    }
                }

                const domainOffsetMin = Math.abs(scale.invert(offsetMin) - scale.invert(0));
                const domainOffsetMax = Math.abs(scale.invert(offsetMax) - scale.invert(0));

                return scale.domain([yMin - domainOffsetMin, yMax + domainOffsetMax]);
            }

            break;
        }
        case 'category': {
            if (yCategories) {
                const filteredCategories = filterCategoriesByVisibleSeries({
                    axisDirection: 'y',
                    categories: yCategories,
                    series: series,
                });
                return scaleBand().domain(filteredCategories).range(range);
            }

            break;
        }
        case 'datetime': {
            if (yTimestamps) {
                const [yMinTimestamp, yMaxTimestamp] = extent(yTimestamps) as [number, number];
                const zeroDomain = hasOnlyMarkerSeries(series)
                    ? isZeroDomain([yMinTimestamp, yMaxTimestamp])
                    : false;
                const yMin =
                    typeof yMinPropsOrState === 'number' &&
                    !zeroDomain &&
                    yMinPropsOrState > yMinTimestamp
                        ? yMinPropsOrState
                        : yMinTimestamp;
                const yMax =
                    typeof yMaxPropsOrState === 'number' &&
                    !zeroDomain &&
                    yMaxPropsOrState < yMaxTimestamp
                        ? yMaxPropsOrState
                        : yMaxTimestamp;
                return scaleUtc().domain([yMin, yMax]).range(range).nice();
            } else {
                const domain = getDomainDataYBySeries(series);
                const {hasNumberAndNullValues, hasOnlyNullValues} = validateArrayData(domain);

                if (hasOnlyNullValues || domain.length === 0) {
                    return undefined;
                }

                if (hasNumberAndNullValues) {
                    const [yMinTimestamp, yMaxTimestamp] = extent(domain as [number, number]) as [
                        number,
                        number,
                    ];
                    const zeroDomain = hasOnlyMarkerSeries(series)
                        ? isZeroDomain([yMinTimestamp, yMaxTimestamp])
                        : false;
                    const yMin =
                        typeof yMinPropsOrState === 'number' &&
                        !zeroDomain &&
                        yMinPropsOrState > yMinTimestamp
                            ? yMinPropsOrState
                            : yMinTimestamp;
                    const yMax =
                        typeof yMaxPropsOrState === 'number' &&
                        !zeroDomain &&
                        yMaxPropsOrState < yMaxTimestamp
                            ? yMaxPropsOrState
                            : yMaxTimestamp;
                    const scale = scaleUtc().domain([yMin, yMax]).range(range);

                    let offsetMin = 0;
                    let offsetMax = boundsHeight * axis.maxPadding;
                    if (isSeriesWithYAxisOffset(series)) {
                        if (Object.keys(domain).length > 1) {
                            const bandWidth = getBandSize({
                                scale: scale as AxisScale<AxisDomain>,
                                domain: domain as AxisDomain[],
                            });

                            offsetMin += bandWidth / 2;
                            offsetMax += bandWidth / 2;
                        }
                    }

                    const domainOffsetMin = Math.abs(
                        scale.invert(offsetMin).getTime() - scale.invert(0).getTime(),
                    );
                    const domainOffsetMax = Math.abs(
                        scale.invert(offsetMax).getTime() - scale.invert(0).getTime(),
                    );

                    return scale.domain([yMin - domainOffsetMin, yMax + domainOffsetMax]);
                }
            }
        }
    }

    throw new Error('Failed to create yScale');
}

function calculateXAxisPadding(series: (PreparedSeries | ChartSeries)[]) {
    let result = 0;

    series.forEach((s) => {
        switch (s.type) {
            case 'bar-y': {
                // Since labels can be located to the right of the bar, need to add an additional space
                const inside = get(s, 'dataLabels.inside');
                if (!inside) {
                    const labelsMaxWidth =
                        get(s, 'dataLabels.maxWidth', 0) + (s.dataLabels?.padding ?? 0);
                    result = Math.max(result, labelsMaxWidth);
                }

                break;
            }
        }
    });

    return result;
}

function isSeriesWithXAxisOffset(series: (PreparedSeries | ChartSeries)[]) {
    const types = [SERIES_TYPE.Heatmap] as string[];
    return series.some((s) => types.includes(s.type));
}

function getXScaleRange({
    boundsWidth,
    series,
    seriesOptions,
    hasZoomX,
    axis,
    maxPadding,
}: {
    axis: PreparedAxis | ChartAxis;
    boundsWidth: number;
    series: (PreparedSeries | ChartSeries)[];
    seriesOptions: PreparedSeriesOptions;
    hasZoomX?: boolean;
    maxPadding: number;
}) {
    const xAxisZoomPadding = boundsWidth * X_AXIS_ZOOM_PADDING;
    const xRange = [0, boundsWidth - maxPadding];
    const xRangeZoom = [0 + xAxisZoomPadding, boundsWidth - xAxisZoomPadding];
    const range = hasZoomX ? xRangeZoom : xRange;

    const barXSeries = series.filter((s) => s.type === SERIES_TYPE.BarX);
    if (barXSeries.length) {
        const groupedData = groupBarXDataByXValue(barXSeries, axis as PreparedXAxis);
        if (Object.keys(groupedData).length > 1) {
            const {bandSize} = getBarXLayoutForNumericScale({
                plotWidth: boundsWidth - maxPadding,
                groupedData,
                seriesOptions,
            });

            const offset = bandSize / 2;
            return [range[0] + offset, range[1] - offset];
        }
    }

    return range;
}

// eslint-disable-next-line complexity
export function createXScale(args: {
    axis: PreparedAxis | ChartAxis;
    boundsWidth: number;
    series: (PreparedSeries | ChartSeries)[];
    seriesOptions: PreparedSeriesOptions;
    rangeSliderState?: RangeSliderState;
    zoomStateX?: [number, number];
}) {
    const {axis, boundsWidth, series, seriesOptions, rangeSliderState, zoomStateX} = args;
    const [xMinPropsOrState, xMaxPropsOrState] = getMinMaxPropsOrState({
        axis,
        maxValues: [zoomStateX?.[1], rangeSliderState?.max],
        minValues: [zoomStateX?.[0], rangeSliderState?.min],
    });
    const xType: ChartAxisType = get(axis, 'type', DEFAULT_AXIS_TYPE);
    const hasZoomX = Boolean(zoomStateX);
    let xCategories = get(axis, 'categories');
    if (rangeSliderState && xCategories) {
        xCategories = getAxisCategories({
            categories: xCategories,
            min: rangeSliderState.min,
            max: rangeSliderState.max,
            order: axis.order,
        });
    }
    const maxPadding = rangeSliderState ? 0 : get(axis, 'maxPadding', 0);
    const xAxisMaxPadding = boundsWidth * maxPadding + calculateXAxisPadding(series);

    const range = getXScaleRange({
        boundsWidth,
        series,
        seriesOptions,
        hasZoomX,
        axis,
        maxPadding: xAxisMaxPadding,
    });

    switch (axis.order) {
        case 'sortDesc':
        case 'reverse': {
            range.reverse();
        }
    }

    switch (xType) {
        case 'linear':
        case 'logarithmic': {
            const domainData = getDomainDataXBySeries(series);
            const {hasNumberAndNullValues, hasOnlyNullValues} = validateArrayData(domainData);

            if (hasOnlyNullValues || domainData.length === 0) {
                return undefined;
            }

            if (series.some((s) => s.type === 'bar-y' && s.stacking === 'percent')) {
                return scaleLinear().domain([0, 100]).range(range);
            }

            if (hasNumberAndNullValues) {
                const [xMinDomain, xMaxDomain] = extent(domainData as [number, number]) as [
                    number,
                    number,
                ];
                const zeroDomain = hasOnlyMarkerSeries(series)
                    ? isZeroDomain([xMinDomain, xMaxDomain])
                    : false;
                let xMin: number;
                let xMax: number;

                if (typeof xMinPropsOrState === 'number' && !zeroDomain) {
                    xMin = xMinPropsOrState;
                } else {
                    const xMinDefault = getDefaultMinXAxisValue(series);
                    xMin = xMinDefault ?? xMinDomain;
                }

                if (typeof xMaxPropsOrState === 'number' && !zeroDomain) {
                    xMax = xMaxPropsOrState;
                } else {
                    const xMaxDefault = getDefaultMaxXAxisValue(series);
                    xMax =
                        typeof xMaxDefault === 'number'
                            ? Math.max(xMaxDefault, xMaxDomain)
                            : xMaxDomain;
                }

                const scaleFn = xType === 'logarithmic' ? scaleLog : scaleLinear;
                const scale = scaleFn().domain([xMin, xMax]).range(range);

                let offsetMin = 0;
                let offsetMax = 0;
                const hasOffset = isSeriesWithXAxisOffset(series);
                if (hasOffset) {
                    if (domainData.length > 1) {
                        const bandWidth = getBandSize({
                            scale: scale as AxisScale<AxisDomain>,
                            domain: domainData as AxisDomain[],
                        });

                        offsetMin += bandWidth / 2;
                        offsetMax += bandWidth / 2;
                    }
                }

                const domainOffsetMin = Math.abs(scale.invert(offsetMin) - scale.invert(0));
                const domainOffsetMax = Math.abs(scale.invert(offsetMax) - scale.invert(0));

                scale.domain([xMin - domainOffsetMin, xMax + domainOffsetMax]);

                if (!hasZoomX && !hasOffset) {
                    // 10 is the default value for the number of ticks. Here, to preserve the appearance of a series with a small number of points
                    scale.nice(Math.max(10, domainData.length));
                }

                return scale;
            }

            break;
        }
        case 'category': {
            if (xCategories) {
                const filteredCategories = filterCategoriesByVisibleSeries({
                    axisDirection: 'x',
                    categories: xCategories,
                    series: series,
                });
                const xScale = scaleBand().domain(filteredCategories).range([0, boundsWidth]);

                if (xScale.step() / 2 < xAxisMaxPadding) {
                    xScale.range(range);
                }

                return xScale;
            }

            break;
        }
        case 'datetime': {
            let domain: [number, number] | null = null;
            const domainData = get(axis, 'timestamps') || getDomainDataXBySeries(series);
            const {hasNumberAndNullValues, hasOnlyNullValues} = validateArrayData(domainData);

            if (hasOnlyNullValues || domainData.length === 0) {
                return undefined;
            }

            if (hasNumberAndNullValues) {
                const [xMinTimestamp, xMaxTimestamp] = extent(domainData as [number, number]) as [
                    number,
                    number,
                ];
                const zeroDomain = isZeroDomain([xMinTimestamp, xMaxTimestamp]);
                const xMin =
                    typeof xMinPropsOrState === 'number' &&
                    xMinPropsOrState > xMinTimestamp &&
                    !zeroDomain
                        ? xMinPropsOrState
                        : xMinTimestamp;
                const xMax =
                    typeof xMaxPropsOrState === 'number' &&
                    xMaxPropsOrState < xMaxTimestamp &&
                    !zeroDomain
                        ? xMaxPropsOrState
                        : xMaxTimestamp;
                domain = [xMin, xMax];

                const scale = scaleUtc().domain(domain).range(range);

                let offsetMin = 0;
                let offsetMax = 0;
                const hasOffset = isSeriesWithXAxisOffset(series);
                if (hasOffset) {
                    if (domainData.length > 1) {
                        const bandWidth = getBandSize({
                            scale: scale as AxisScale<AxisDomain>,
                            domain: domainData as AxisDomain[],
                        });

                        offsetMin += bandWidth / 2;
                        offsetMax += bandWidth / 2;
                    }
                }

                const domainOffsetMin = Math.abs(
                    scale.invert(offsetMin).getTime() - scale.invert(0).getTime(),
                );
                const domainOffsetMax = Math.abs(
                    scale.invert(offsetMax).getTime() - scale.invert(0).getTime(),
                );

                scale.domain([xMin - domainOffsetMin, xMax + domainOffsetMax]);

                if (!hasZoomX && !hasOffset) {
                    // 10 is the default value for the number of ticks. Here, to preserve the appearance of a series with a small number of points
                    scale.nice(Math.max(10, domainData.length));
                }
                return scale;
            }

            break;
        }
    }

    throw new Error('Failed to create xScale');
}

const createScales = (args: Args) => {
    const {
        boundsWidth,
        boundsHeight,
        rangeSliderState,
        series,
        seriesOptions,
        split,
        xAxis,
        yAxis,
        zoomState,
    } = args;
    let visibleSeries = getOnlyVisibleSeries(series);
    // Reassign to all series in case of all series unselected,
    // otherwise we will get an empty space without grid
    visibleSeries = visibleSeries.length === 0 ? series : visibleSeries;

    return {
        xScale: xAxis
            ? createXScale({
                  axis: xAxis,
                  boundsWidth,
                  rangeSliderState,
                  series: visibleSeries,
                  seriesOptions,
                  zoomStateX: zoomState?.x,
              })
            : undefined,
        yScale: yAxis.map((axis, index) => {
            const axisSeries = series.filter((s) => {
                const seriesAxisIndex = get(s, 'yAxis', 0);
                return seriesAxisIndex === index;
            });
            const visibleAxisSeries = getOnlyVisibleSeries(axisSeries);
            const axisHeight = getAxisHeight({boundsHeight, split});
            const zoomStateY = zoomState?.y?.[index];
            return createYScale({
                axis,
                boundsHeight: axisHeight,
                series: visibleAxisSeries.length ? visibleAxisSeries : axisSeries,
                zoomStateY,
            });
        }),
    };
};

/**
 * Uses to create scales for axis related series
 */
export const useAxisScales = (args: Args): ReturnValue => {
    const {
        boundsWidth,
        boundsHeight,
        rangeSliderState,
        series,
        seriesOptions,
        split,
        xAxis,
        yAxis,
        zoomState,
    } = args;
    return React.useMemo(() => {
        let xScale: ChartScale | undefined;
        let yScale: (ChartScale | undefined)[] | undefined;
        const hasAxisRelatedSeries = series.some(isAxisRelatedSeries);

        if (hasAxisRelatedSeries) {
            ({xScale, yScale} = createScales({
                boundsWidth,
                boundsHeight,
                rangeSliderState,
                series,
                seriesOptions,
                split,
                xAxis,
                yAxis,
                zoomState,
            }));
        }

        return {xScale, yScale};
    }, [
        boundsWidth,
        boundsHeight,
        rangeSliderState,
        series,
        seriesOptions,
        split,
        xAxis,
        yAxis,
        zoomState,
    ]);
};
