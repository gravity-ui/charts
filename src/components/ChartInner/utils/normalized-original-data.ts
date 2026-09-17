import {getAxisCategories} from '~core/utils';

import type {ChartAxis, ChartData} from '../../../types';

function getNormalizedCategoryAxis<T extends ChartAxis>(axis: T): T {
    const categories = getAxisCategories(axis);
    const orderedCategories = getAxisCategories({
        categories: axis.categories,
        order: axis.order,
    });
    const tickValues = axis.ticks?.values;
    const values =
        tickValues && orderedCategories
            ? tickValues.flatMap((index) => {
                  const category = orderedCategories[index];
                  return category === undefined ? [] : [category];
              })
            : undefined;
    const ticks = axis.ticks && values !== undefined ? {...axis.ticks, values} : axis.ticks;

    return {...axis, categories, ticks} as T;
}

export function getNormalizedXAxis(props: {xAxis: ChartData['xAxis']}) {
    const {xAxis} = props;
    return xAxis?.categories ? getNormalizedCategoryAxis(xAxis) : xAxis;
}

export function getNormalizedYAxis(props: {yAxis: ChartData['yAxis']}) {
    if (Array.isArray(props.yAxis)) {
        return props.yAxis.map((axis) =>
            axis.categories ? getNormalizedCategoryAxis(axis) : axis,
        );
    }

    return props.yAxis;
}
