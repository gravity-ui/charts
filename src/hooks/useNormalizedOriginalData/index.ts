import React from 'react';

import type {ChartData} from '../../types';
import {getAxisCategories, getSortedSeriesData} from '../../utils';

interface UseOriginalDataProps {
    seriesData: ChartData['series']['data'];
    xAxis: ChartData['xAxis'];
    yAxis: ChartData['yAxis'];
}

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

export function useNormalizedOriginalData(props: UseOriginalDataProps) {
    const normalizedSeriesData = React.useMemo(() => {
        return getSortedSeriesData({
            seriesData: props.seriesData,
            xAxis: props.xAxis,
            yAxis: props.yAxis,
        });
    }, [props.seriesData, props.xAxis, props.yAxis]);
    const normalizedXAxis = React.useMemo(() => {
        return getNormalizedXAxis({xAxis: props.xAxis});
    }, [props.xAxis]);
    const normalizedYAxis = React.useMemo(() => {
        return getNormalizedYAxis({yAxis: props.yAxis});
    }, [props.yAxis]);

    return {normalizedSeriesData, normalizedXAxis, normalizedYAxis};
}
