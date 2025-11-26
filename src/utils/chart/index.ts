import {group, select} from 'd3';
import get from 'lodash/get';
import isNil from 'lodash/isNil';
import sortBy from 'lodash/sortBy';

import {DEFAULT_AXIS_LABEL_FONT_SIZE, SERIES_TYPE} from '../../constants';
import type {PreparedWaterfallSeries, StackedSeries} from '../../hooks';
import {getSeriesStackId} from '../../hooks/useSeries/utils';
import type {BaseTextStyle, ChartSeries, ChartSeriesData} from '../../types';

import {getWaterfallPointSubtotal} from './series/waterfall';
import type {AxisDirection} from './types';

export * from './axis';
export * from './array';
export * from './color';
export * from './format';
export * from './labels';
export * from './legend';
export * from './math';
export * from './series';
export * from './symbol';
export * from './text';
export * from './time';
export * from './zoom';

const CHARTS_WITHOUT_AXIS: ChartSeries['type'][] = ['pie', 'treemap', 'sankey', 'radar', 'funnel'];
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
                const keyValue = point[keyAttr];
                if (keyValue === null) {
                    return;
                }

                const key = String(keyValue);
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

    const values = Array.from(groupedSeries).reduce<unknown[]>((acc, [type, seriesList]) => {
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

    return Array.from(new Set(values.filter((v) => v !== null)));
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
            // https://github.com/gravity-ui/charts/issues/160
            // @ts-expect-error
            const minXValue = s.data.reduce((res, d) => Math.min(res, get(d, 'x', 0)), 0);
            return Math.min(minValue, minXValue);
        }, 0);
    }

    return undefined;
}

export function getDefaultMinYAxisValue(series?: UnknownSeries[]) {
    if (series?.some((s) => CHART_SERIES_WITH_VOLUME_ON_Y_AXIS.includes(s.type))) {
        if (series.some((s) => s.type === SERIES_TYPE.Waterfall)) {
            const seriesData = (series as PreparedWaterfallSeries[]).map((s) => s.data).flat();
            const minSubTotal = seriesData.reduce(
                (res, d) => Math.min(res, getWaterfallPointSubtotal(d, seriesData) || 0),
                0,
            );
            return Math.min(0, minSubTotal);
        }

        return series.reduce((minValue, s) => {
            // https://github.com/gravity-ui/charts/issues/160
            // @ts-expect-error
            const minYValue = s.data.reduce((res, d) => Math.min(res, get(d, 'y', 0)), 0);
            return Math.min(minValue, minYValue);
        }, 0);
    }

    return undefined;
}

export const getDomainDataYBySeries = (series: UnknownSeries[]) => {
    const groupedSeries = group(series, (item) => item.type);

    const items = Array.from(groupedSeries).reduce<unknown[]>((acc, [type, seriesList]) => {
        switch (type) {
            case 'area':
            case 'bar-x': {
                acc.push(0, ...getDomainDataForStackedSeries(seriesList as StackedSeries[]));

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

    return Array.from(new Set(items));
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

export const getHorizontalHtmlTextHeight = (args: {
    text: string;
    style?: Partial<BaseTextStyle>;
}) => {
    const {text, style} = args;
    const container = select(document.body).append('div');
    const fontSize = get(style, 'fontSize', DEFAULT_AXIS_LABEL_FONT_SIZE);

    container
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('white-space', 'nowrap')
        .html(text);

    if (fontSize) {
        container.style('font-size', fontSize);
    }

    const height = container.node()?.getBoundingClientRect().height || 0;
    container.remove();

    return height;
};

export const getHorizontalSvgTextHeight = (args: {
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

export {AxisDirection};
