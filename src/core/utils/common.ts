import {select} from 'd3-selection';
import get from 'lodash/get';

import type {BaseTextStyle, ChartSeries, ChartSeriesData} from '../../types';
import {DEFAULT_AXIS_LABEL_FONT_SIZE} from '../constants';
import {getAxisDomainValues} from '../series/axis-domain';
import type {ChartAxis} from '../types';

import type {UnknownSeries} from './series-type-guards';
import type {AxisDirection} from './types';

export const getDomainDataXBySeries = (series: UnknownSeries[], axisOptions?: ChartAxis) =>
    getAxisDomainValues(series, 'x', axisOptions);

export const getDomainDataYBySeries = (series: UnknownSeries[], axisOptions?: ChartAxis) =>
    getAxisDomainValues(series, 'y', axisOptions);

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

interface DataCategoryValueArgs {
    axisDirection: AxisDirection;
    categories: string[];
    data: ChartSeriesData;
}

/** Resolve a category without throwing when a value or numeric index cannot be resolved. */
export const tryGetDataCategoryValue = (args: DataCategoryValueArgs): string | undefined => {
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

    return categoryValue ?? undefined;
};

/** Strict category resolution for data preparation, where invalid input must be reported. */
export const getDataCategoryValue = (args: DataCategoryValueArgs): string => {
    const categoryValue = tryGetDataCategoryValue(args);

    if (categoryValue === undefined) {
        throw new Error('It seems you are trying to get non-existing category value');
    }

    return categoryValue;
};

export {AxisDirection};
