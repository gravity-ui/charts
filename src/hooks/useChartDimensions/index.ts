import React from 'react';

import type {PreparedAxis, PreparedLegend, PreparedSeries} from '../../hooks';
import type {ChartMargin} from '../../types';
import {isAxisRelatedSeries} from '../../utils';

import {getBoundsWidth} from './utils';

export {getBoundsWidth} from './utils';

type Args = {
    width: number;
    height: number;
    margin: ChartMargin;
    preparedLegend: PreparedLegend | null;
    preparedXAxis: PreparedAxis | null;
    preparedYAxis: PreparedAxis[] | null;
    preparedSeries: PreparedSeries[];
};

const getBottomOffset = (args: {
    hasAxisRelatedSeries: boolean;
    preparedLegend: PreparedLegend | null;
    preparedXAxis: PreparedAxis | null;
}) => {
    const {hasAxisRelatedSeries, preparedLegend, preparedXAxis} = args;
    let result = 0;

    if (preparedLegend?.enabled) {
        result += preparedLegend.height + preparedLegend.margin;
    }

    if (!preparedXAxis?.visible) {
        return result;
    }

    if (hasAxisRelatedSeries) {
        if (preparedXAxis.title.text) {
            result += preparedXAxis.title.height + preparedXAxis.title.margin;
        }

        if (preparedXAxis.labels.enabled) {
            result += preparedXAxis.labels.margin + preparedXAxis.labels.height;
        }
    }

    return result;
};

export const useChartDimensions = (args: Args) => {
    const {margin, width, height, preparedLegend, preparedXAxis, preparedYAxis, preparedSeries} =
        args;

    return React.useMemo(() => {
        const hasAxisRelatedSeries = preparedSeries.some(isAxisRelatedSeries);
        const boundsWidth = getBoundsWidth({chartWidth: width, chartMargin: margin, preparedYAxis});
        const bottomOffset = getBottomOffset({
            hasAxisRelatedSeries,
            preparedLegend,
            preparedXAxis,
        });

        const boundsHeight = height - margin.top - margin.bottom - bottomOffset;

        return {boundsWidth, boundsHeight};
    }, [margin, width, height, preparedLegend, preparedXAxis, preparedYAxis, preparedSeries]);
};
