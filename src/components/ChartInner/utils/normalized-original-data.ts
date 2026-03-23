import {getAxisCategories} from '~core/utils';

import type {ChartData} from '../../../types';

export function getNormalizedXAxis(props: {xAxis: ChartData['xAxis']}) {
    let categories = props.xAxis?.categories;

    if (props.xAxis && props.xAxis.categories) {
        categories = getAxisCategories(props.xAxis);
    }

    return {...props.xAxis, categories};
}

export function getNormalizedYAxis(props: {yAxis: ChartData['yAxis']}) {
    if (Array.isArray(props.yAxis) && props.yAxis.some((axis) => axis.categories)) {
        return props.yAxis.map((axis) => {
            let categories = axis.categories;

            if (axis.categories) {
                categories = getAxisCategories(axis);
            }

            return {...axis, categories};
        });
    }

    return props.yAxis;
}
