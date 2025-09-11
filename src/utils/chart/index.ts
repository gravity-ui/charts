import {dateTime} from '@gravity-ui/date-utils';
import type {AxisDomain} from 'd3';
import {group, select} from 'd3';
import get from 'lodash/get';
import isNil from 'lodash/isNil';
import sortBy from 'lodash/sortBy';

import {DEFAULT_AXIS_LABEL_FONT_SIZE} from '../../constants';
import type {
    PreparedAxis,
    PreparedWaterfallSeries,
    PreparedWaterfallSeriesData,
    StackedSeries,
} from '../../hooks';
import {getSeriesStackId} from '../../hooks/useSeries/utils';
import {formatNumber, getNumberUnitRate} from '../../libs/format-number';
import type {BaseTextStyle, ChartSeries, ChartSeriesData} from '../../types';

import {getWaterfallPointSubtotal} from './series/waterfall';
import {getDefaultDateFormat} from './time';
import type {AxisDirection} from './types';

export * from './math';
export * from './text';
export * from './time';
export * from './axis';
export * from './labels';
export * from './legend';
export * from './symbol';
export * from './series';
export * from './color';

const CHARTS_WITHOUT_AXIS: ChartSeries['type'][] = ['pie', 'treemap', 'sankey', 'radar'];
export const CHART_SERIES_WITH_VOLUME_ON_Y_AXIS: ChartSeries['type'][] = [
    'bar-x',
    'area',
    'waterfall',
];

export const CHART_SERIES_WITH_VOLUME_ON_X_AXIS: ChartSeries['type'][] = ['bar-y'];

type UnknownSeries = {type: ChartSeries['type']; data: unknown};

/**
 * Checks whether the series should be drawn with axes.
 *
 * @param series - The series object to check.
 * @returns `true` if the series should be drawn with axes, `false` otherwise.
 */
export function isAxisRelatedSeries(series: UnknownSeries) {
    return !CHARTS_WITHOUT_AXIS.includes(series.type);
}

export function isSeriesWithNumericalXValues(series: UnknownSeries): series is {
    type: ChartSeries['type'];
    data: {x: number}[];
} {
    return isAxisRelatedSeries(series);
}

export function isSeriesWithNumericalYValues(series: UnknownSeries): series is {
    type: ChartSeries['type'];
    data: {y: number}[];
} {
    return isAxisRelatedSeries(series);
}

export function isSeriesWithCategoryValues(series: UnknownSeries): series is {
    type: ChartSeries['type'];
    data: {category: string}[];
} {
    return isAxisRelatedSeries(series);
}

function getDomainDataForStackedSeries(
    seriesList: StackedSeries[],
    keyAttr: 'x' | 'y' = 'x',
    valueAttr: 'x' | 'y' = 'y',
) {
    const acc: number[] = [];
    const stackedSeries = group(seriesList, getSeriesStackId);
    Array.from(stackedSeries).forEach(([_stackId, seriesStack]) => {
        const values: Record<string, number> = {};

        seriesStack.forEach((singleSeries) => {
            const data = new Map();
            singleSeries.data.forEach((point) => {
                const key = String(point[keyAttr]);
                let value = 0;

                if (valueAttr in point && typeof point[valueAttr] === 'number') {
                    value = point[valueAttr] as number;
                }

                if (data.has(key)) {
                    value = Math.max(value, data.get(key));
                }

                data.set(key, value);
            });

            Array.from(data).forEach(([key, value]) => {
                values[key] = (values[key] || 0) + value;
            });
        });

        acc.push(...Object.values(values));
    });

    return acc;
}

export const getDomainDataXBySeries = (series: UnknownSeries[]) => {
    const groupedSeries = group(series, (item) => item.type);

    return Array.from(groupedSeries).reduce<unknown[]>((acc, [type, seriesList]) => {
        switch (type) {
            case 'bar-y': {
                acc.push(...getDomainDataForStackedSeries(seriesList as StackedSeries[], 'y', 'x'));
                break;
            }
            default: {
                seriesList.filter(isSeriesWithNumericalXValues).forEach((s) => {
                    acc.push(...s.data.map((d) => d.x));
                });
            }
        }

        return acc;
    }, []);
};

export function getDefaultMaxXAxisValue(series: UnknownSeries[]) {
    if (series.some((s) => s.type === 'bar-y')) {
        return 0;
    }

    return undefined;
}

export function getDefaultMinXAxisValue(series: UnknownSeries[]) {
    if (series?.some((s) => CHART_SERIES_WITH_VOLUME_ON_X_AXIS.includes(s.type))) {
        return series.reduce((minValue, s) => {
            // @ts-expect-error
            const minYValue = s.data.reduce((res, d) => Math.min(res, get(d, 'x', 0)), 0);
            return Math.min(minValue, minYValue);
        }, 0);
    }

    return undefined;
}

export function getDefaultMinYAxisValue(series?: UnknownSeries[]) {
    if (series?.some((s) => CHART_SERIES_WITH_VOLUME_ON_Y_AXIS.includes(s.type))) {
        return series.reduce((minValue, s) => {
            switch (s.type) {
                case 'waterfall': {
                    const minSubTotal = (s.data as PreparedWaterfallSeriesData[]).reduce(
                        (res, d) =>
                            Math.min(
                                res,
                                getWaterfallPointSubtotal(d, s as PreparedWaterfallSeries) || 0,
                            ),
                        0,
                    );
                    return Math.min(minValue, minSubTotal);
                }
                default: {
                    // @ts-expect-error
                    const minYValue = s.data.reduce((res, d) => Math.min(res, get(d, 'y', 0)), 0);
                    return Math.min(minValue, minYValue);
                }
            }
        }, 0);
    }

    return undefined;
}

export const getDomainDataYBySeries = (series: UnknownSeries[]) => {
    const groupedSeries = group(series, (item) => item.type);

    return Array.from(groupedSeries).reduce<unknown[]>((acc, [type, seriesList]) => {
        switch (type) {
            case 'area':
            case 'bar-x': {
                acc.push(...getDomainDataForStackedSeries(seriesList as StackedSeries[]));

                break;
            }
            case 'waterfall': {
                let yValue = 0;
                const points = (seriesList as PreparedWaterfallSeries[]).map((s) => s.data).flat();
                sortBy(points, (p) => p.index).forEach((d) => {
                    yValue += Number(d.y) || 0;
                    acc.push(yValue);
                });

                break;
            }
            default: {
                seriesList.filter(isSeriesWithNumericalYValues).forEach((s) => {
                    acc.push(...s.data.map((d) => d.y));
                });
            }
        }

        return acc;
    }, []);
};

// Uses to get all series names array (except `pie` charts)
export const getSeriesNames = (series: ChartSeries[]) => {
    return series.reduce<string[]>((acc, s) => {
        if ('name' in s && typeof s.name === 'string') {
            acc.push(s.name);
        }

        return acc;
    }, []);
};

export const getOnlyVisibleSeries = <T extends {visible: boolean}>(series: T[]) => {
    return series.filter((s) => s.visible);
};

export const parseTransformStyle = (style: string | null): {x?: number; y?: number} => {
    if (!style) {
        return {};
    }

    const stringifiedValue = style.match(/\((.*?)\)/)?.[1] || '';
    const [xString, yString] = stringifiedValue.split(',');
    const x = Number.isNaN(Number(xString)) ? undefined : Number(xString);
    const y = Number.isNaN(Number(yString)) ? undefined : Number(yString);

    return {x, y};
};

export const formatAxisTickLabel = (args: {
    axis: PreparedAxis;
    value: AxisDomain;
    step?: number;
}) => {
    const {axis, value, step} = args;

    switch (axis.type) {
        case 'category': {
            return value as string;
        }
        case 'datetime': {
            const date = value as number;
            const format = axis.labels.dateFormat || getDefaultDateFormat(step);

            return dateTime({input: date}).format(format);
        }
        case 'linear':
        default: {
            const numberFormat = {
                unitRate: value && step ? getNumberUnitRate(step) : undefined,
                ...axis.labels.numberFormat,
            };
            return formatNumber(value as number | string, numberFormat);
        }
    }
};

/**
 * Calculates the height of a text element in a horizontal SVG layout.
 *
 * @param {Object} args - The arguments for the function.
 * @param {string} args.text - The text to be measured.
 * @param {Partial<BaseTextStyle>} args.style - Optional style properties for the text element.
 * @return {number} The height of the text element.
 */
export const getHorisontalSvgTextHeight = (args: {
    text: string;
    style?: Partial<BaseTextStyle>;
}) => {
    const {text, style} = args;
    const container = select(document.body).append('svg');
    const textSelection = container.append('text').text(text);
    const fontSize = get(style, 'fontSize', DEFAULT_AXIS_LABEL_FONT_SIZE);

    if (fontSize) {
        textSelection.style('font-size', fontSize).style('dominant-baseline', 'text-after-edge');
    }

    const height = textSelection.node()?.getBoundingClientRect().height || 0;
    container.remove();

    return height;
};

const extractCategoryValue = (args: {
    axisDirection: AxisDirection;
    categories: string[];
    data: ChartSeriesData;
}) => {
    const {axisDirection, categories, data} = args;
    const dataCategory = get(data, axisDirection);
    let categoryValue: string | undefined;

    if ('category' in data && data.category) {
        categoryValue = data.category;
    }

    if (typeof dataCategory === 'string') {
        categoryValue = dataCategory;
    }

    if (typeof dataCategory === 'number') {
        categoryValue = categories[dataCategory];
    }

    if (isNil(categoryValue)) {
        throw new Error('It seems you are trying to get non-existing category value');
    }

    return categoryValue;
};

export const getDataCategoryValue = (args: {
    axisDirection: AxisDirection;
    categories: string[];
    data: ChartSeriesData;
}) => {
    const {axisDirection, categories, data} = args;
    const categoryValue = extractCategoryValue({axisDirection, categories, data});

    return categoryValue;
};

export function getClosestPointsRange(axis: PreparedAxis, points: AxisDomain[]) {
    if (axis.type === 'category') {
        return undefined;
    }

    return (points[1] as number) - (points[0] as number);
}

export {AxisDirection};
