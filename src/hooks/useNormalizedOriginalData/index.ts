import React from 'react';

import cloneDeep from 'lodash/cloneDeep';

import type {ChartData} from '../../types';
import {getSortedSeriesData} from '../../utils';
import {getAxisCategories} from '../useChartOptions/utils';

interface UseOriginalDataProps {
    seriesData: ChartData['series']['data'];
    xAxis: ChartData['xAxis'];
    yAxis: ChartData['yAxis'];
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
        let result = props.xAxis;

        if (props.xAxis && props.xAxis.categories) {
            result = cloneDeep(props.xAxis);
            result.categories = getAxisCategories(props.xAxis);
        }

        return result;
    }, [props.xAxis]);
    const normalizedYAxis = React.useMemo(() => {
        let result = props.yAxis;

        if (Array.isArray(props.yAxis) && props.yAxis.some((axis) => axis.categories)) {
            result = props.yAxis.map((axis) => {
                let resutAxis = axis;

                if (axis.categories) {
                    resutAxis = cloneDeep(axis);
                    resutAxis.categories = getAxisCategories(axis);
                }

                return resutAxis;
            });
        }

        return result;
    }, [props.yAxis]);

    return {normalizedSeriesData, normalizedXAxis, normalizedYAxis};
}
