import React from 'react';

import type {PreparedAxis, PreparedLegend, PreparedRangeSlider, PreparedSeries} from '../../hooks';
import type {ChartMargin} from '../../types';
import {isAxisRelatedSeries} from '../../utils';

import {getBoundsWidth} from './utils';

export {getBoundsWidth} from './utils';

type Args = {
    height: number;
    margin: ChartMargin;
    preparedLegend: PreparedLegend | null;
    preparedRangeSlider: PreparedRangeSlider;
    preparedSeries: PreparedSeries[];
    preparedXAxis: PreparedAxis | null;
    preparedYAxis: PreparedAxis[];
    width: number;
};

const getBottomOffset = (args: {
    hasAxisRelatedSeries: boolean;
    preparedLegend: PreparedLegend | null;
    preparedRangeSlider: PreparedRangeSlider;
    preparedXAxis: PreparedAxis | null;
}) => {
    const {hasAxisRelatedSeries, preparedLegend, preparedRangeSlider, preparedXAxis} = args;
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

    if (preparedRangeSlider.enabled) {
        result += preparedRangeSlider.height + preparedRangeSlider.margin;
    }

    return result;
};

export const useChartDimensions = (args: Args) => {
    const {
        height,
        margin,
        preparedLegend,
        preparedRangeSlider,
        preparedSeries,
        preparedXAxis,
        preparedYAxis,
        width,
    } = args;

    return React.useMemo(() => {
        const hasAxisRelatedSeries = preparedSeries.some(isAxisRelatedSeries);
        const boundsWidth = getBoundsWidth({chartWidth: width, chartMargin: margin, preparedYAxis});
        const bottomOffset = getBottomOffset({
            hasAxisRelatedSeries,
            preparedLegend,
            preparedRangeSlider,
            preparedXAxis,
        });

        const boundsHeight = height - margin.top - margin.bottom - bottomOffset;

        return {boundsWidth, boundsHeight};
    }, [
        height,
        margin,
        preparedLegend,
        preparedRangeSlider,
        preparedSeries,
        preparedYAxis,
        preparedXAxis,
        width,
    ]);
};
