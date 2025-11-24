import React from 'react';

import type {PreparedLegend, PreparedSeries, PreparedXAxis, PreparedYAxis} from '../../hooks';
import type {ChartMargin} from '../../types';
import {isAxisRelatedSeries} from '../../utils';

import {getBoundsWidth} from './utils';

export {getBoundsWidth} from './utils';

type Args = {
    height: number;
    margin: ChartMargin;
    preparedLegend: PreparedLegend | null;
    preparedSeries: PreparedSeries[];
    preparedXAxis: PreparedXAxis | null;
    preparedYAxis: PreparedYAxis[] | null;
    width: number;
};

const getBottomOffset = (args: {
    hasAxisRelatedSeries: boolean;
    preparedLegend: PreparedLegend | null;
    preparedXAxis: PreparedXAxis | null;
}) => {
    const {hasAxisRelatedSeries, preparedLegend, preparedXAxis} = args;
    let result = 0;

    if (preparedLegend?.enabled && preparedLegend.position === 'bottom') {
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

    if (preparedXAxis.rangeSlider.enabled) {
        result += preparedXAxis.rangeSlider.height + preparedXAxis.rangeSlider.margin;
    }

    return result;
};

const getTopOffset = ({preparedLegend}: {preparedLegend: PreparedLegend | null}) => {
    if (preparedLegend?.enabled && preparedLegend.position === 'top') {
        return preparedLegend.height + preparedLegend.margin;
    }

    return 0;
};

const getRightOffset = ({preparedLegend}: {preparedLegend: PreparedLegend | null}) => {
    if (preparedLegend?.enabled && preparedLegend.position === 'right') {
        return preparedLegend.width + preparedLegend.margin;
    }

    return 0;
};

const getLeftOffset = ({preparedLegend}: {preparedLegend: PreparedLegend | null}) => {
    if (preparedLegend?.enabled && preparedLegend.position === 'left') {
        return preparedLegend.width + preparedLegend.margin;
    }

    return 0;
};

export const useChartDimensions = (args: Args) => {
    const {height, margin, preparedLegend, preparedSeries, preparedXAxis, preparedYAxis, width} =
        args;

    return React.useMemo(() => {
        const hasAxisRelatedSeries = preparedSeries.some(isAxisRelatedSeries);
        const boundsWidth = getBoundsWidth({chartWidth: width, chartMargin: margin, preparedYAxis});
        const bottomOffset = getBottomOffset({
            hasAxisRelatedSeries,
            preparedLegend,
            preparedXAxis,
        });
        const topOffset = getTopOffset({preparedLegend});
        const rightOffset = getRightOffset({preparedLegend});
        const leftOffset = getLeftOffset({preparedLegend});

        const boundsHeight = height - margin.top - margin.bottom - bottomOffset - topOffset;
        const adjustedBoundsWidth = boundsWidth - rightOffset - leftOffset;

        return {boundsWidth: adjustedBoundsWidth, boundsHeight};
    }, [height, margin, preparedLegend, preparedSeries, preparedXAxis, preparedYAxis, width]);
};
