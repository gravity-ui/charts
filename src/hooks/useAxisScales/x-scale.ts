import {extent, scaleBand, scaleLinear, scaleLog, scaleUtc} from 'd3';
import type {AxisDomain, AxisScale} from 'd3';
import get from 'lodash/get';

import {DEFAULT_AXIS_TYPE, SERIES_TYPE} from '../../constants';
import type {PreparedAxis, PreparedSeries, RangeSliderState} from '../../hooks';
import type {ChartAxis, ChartAxisType, ChartSeries} from '../../types';
import {
    getAxisCategories,
    getDefaultMaxXAxisValue,
    getDefaultMinXAxisValue,
    getDomainDataXBySeries,
} from '../../utils';
import {getBandSize} from '../utils/get-band-size';

import {
    checkIsPointDomain,
    filterCategoriesByVisibleSeries,
    getMinMaxPropsOrState,
    hasOnlyMarkerSeries,
    validateArrayData,
} from './utils';

const X_AXIS_ZOOM_PADDING = 0.02;

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
    const types = [SERIES_TYPE.Heatmap, SERIES_TYPE.BarX] as string[];
    return series.some((s) => types.includes(s.type));
}

export function getXMaxDomainResult(args: {
    xMaxDomain: number;
    xMaxProps?: number;
    xMaxRangeSlider?: number;
    xMaxZoom?: number;
}) {
    const {xMaxDomain, xMaxProps, xMaxRangeSlider, xMaxZoom} = args;
    let xMaxDomainResult = xMaxDomain;

    // When xMaxRangeSlider is provided, we use it directly without considering xMaxDomain.
    // This is intentional: the range slider needs to display the chart's maxPadding area,
    // which would be clipped if we constrained it to xMaxDomain.
    if (typeof xMaxRangeSlider === 'number') {
        xMaxDomainResult = xMaxRangeSlider;
    } else if (typeof xMaxZoom === 'number' && xMaxZoom < xMaxDomain) {
        xMaxDomainResult = xMaxZoom;
    } else if (typeof xMaxProps === 'number' && xMaxProps < xMaxDomain) {
        xMaxDomainResult = xMaxProps;
    }

    return xMaxDomainResult;
}

function getXScaleRange({boundsWidth, hasZoomX}: {boundsWidth: number; hasZoomX?: boolean}) {
    const xAxisZoomPadding = boundsWidth * X_AXIS_ZOOM_PADDING;
    const xRange = [0, boundsWidth];
    const xRangeZoom = [0 + xAxisZoomPadding, boundsWidth - xAxisZoomPadding];
    const range = hasZoomX ? xRangeZoom : xRange;

    return range;
}

// eslint-disable-next-line complexity
export function createXScale(args: {
    axis: PreparedAxis | ChartAxis;
    boundsWidth: number;
    series: (PreparedSeries | ChartSeries)[];
    rangeSliderState?: RangeSliderState;
    zoomStateX?: [number, number];
}) {
    const {axis, boundsWidth, series, rangeSliderState, zoomStateX} = args;
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
    const maxPadding = get(axis, 'maxPadding', 0);
    const xAxisMaxPadding = boundsWidth * maxPadding + calculateXAxisPadding(series);

    const range = getXScaleRange({
        boundsWidth,
        hasZoomX,
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
                const isPointDomain = hasOnlyMarkerSeries(series)
                    ? checkIsPointDomain([xMinDomain, xMaxDomain])
                    : false;
                let xMin: number;
                let xMax: number;

                if (typeof xMinPropsOrState === 'number' && !isPointDomain) {
                    xMin = xMinPropsOrState;
                } else if (xType === 'logarithmic') {
                    xMin = xMinDomain;
                } else {
                    const xMinDefault = getDefaultMinXAxisValue(series);
                    xMin = xMinDefault ?? xMinDomain;
                }

                if (typeof xMaxPropsOrState === 'number' && !isPointDomain) {
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
                let offsetMax = xAxisMaxPadding;
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

                const isMinSpecified = typeof get(axis, 'min') === 'number' && !zoomStateX;
                const isMaxSpecified = typeof get(axis, 'max') === 'number' && !zoomStateX;

                const domainOffsetMin = isMinSpecified
                    ? 0
                    : Math.abs(scale.invert(offsetMin) - scale.invert(0));
                const domainOffsetMax = isMaxSpecified
                    ? 0
                    : Math.abs(scale.invert(offsetMax) - scale.invert(0));

                // 10 is the default value for the number of ticks. Here, to preserve the appearance of a series with a small number of points
                const nicedDomain = scale.copy().nice(Math.max(10, domainData.length)).domain();

                scale.domain([xMin - domainOffsetMin, xMax + domainOffsetMax]);

                const startOnTick = get(axis, 'startOnTick', true);
                const endOnTick = get(axis, 'endOnTick', true);

                if (!hasZoomX && !hasOffset && nicedDomain.length === 2) {
                    const domainWithOffset = scale.domain();
                    scale.domain([
                        startOnTick
                            ? Math.min(nicedDomain[0], domainWithOffset[0])
                            : domainWithOffset[0],
                        endOnTick
                            ? Math.max(nicedDomain[1], domainWithOffset[1])
                            : domainWithOffset[1],
                    ]);
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
                const isPointDomain = checkIsPointDomain([xMinTimestamp, xMaxTimestamp]);
                const xMin =
                    typeof xMinPropsOrState === 'number' &&
                    xMinPropsOrState > xMinTimestamp &&
                    !isPointDomain
                        ? xMinPropsOrState
                        : xMinTimestamp;
                const xMax = getXMaxDomainResult({
                    xMaxDomain: xMaxTimestamp,
                    xMaxProps: get(axis, 'max'),
                    xMaxRangeSlider: rangeSliderState?.max,
                    xMaxZoom: zoomStateX?.[1],
                });
                domain = [xMin, xMax];

                const scale = scaleUtc().domain(domain).range(range);

                let offsetMin = 0;
                let offsetMax = xAxisMaxPadding;
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

                const isMinSpecified = typeof get(axis, 'min') === 'number' && !zoomStateX;
                const isMaxSpecified = typeof get(axis, 'max') === 'number' && !zoomStateX;

                const domainOffsetMin = isMinSpecified
                    ? 0
                    : Math.abs(scale.invert(offsetMin).getTime() - scale.invert(0).getTime());
                const domainOffsetMax = isMaxSpecified
                    ? 0
                    : Math.abs(scale.invert(offsetMax).getTime() - scale.invert(0).getTime());
                // 10 is the default value for the number of ticks. Here, to preserve the appearance of a series with a small number of points
                const nicedDomain = scale.copy().nice(Math.max(10, domainData.length)).domain();

                scale.domain([xMin - domainOffsetMin, xMax + domainOffsetMax]);

                const startOnTick = get(axis, 'startOnTick', true);
                const endOnTick = get(axis, 'endOnTick', true);

                if (!hasZoomX && !hasOffset && nicedDomain.length === 2) {
                    const domainWithOffset = scale.domain();
                    scale.domain([
                        startOnTick
                            ? Math.min(Number(nicedDomain[0]), Number(domainWithOffset[0]))
                            : Number(domainWithOffset[0]),
                        endOnTick
                            ? Math.max(Number(nicedDomain[1]), Number(domainWithOffset[1]))
                            : Number(domainWithOffset[1]),
                    ]);
                }
                return scale;
            }

            break;
        }
    }

    throw new Error('Failed to create xScale');
}
