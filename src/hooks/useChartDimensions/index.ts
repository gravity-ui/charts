import React from 'react';

import type {PreparedLegend, PreparedSeries, PreparedXAxis, PreparedYAxis} from '../../hooks';
import type {ChartMargin, LegendConfig} from '../../types';
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
    legendConfig: LegendConfig | undefined;
};

const getBottomOffset = (args: {
    hasAxisRelatedSeries: boolean;
    preparedLegend: PreparedLegend | null;
    preparedXAxis: PreparedXAxis | null;
    legendConfig: LegendConfig | undefined;
}) => {
    const {hasAxisRelatedSeries, preparedLegend, legendConfig, preparedXAxis} = args;
    let result = 0;

    if (preparedLegend?.enabled && preparedLegend.position === 'bottom') {
        result += (legendConfig?.height ?? 0) + preparedLegend.margin;
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

const getTopOffset = ({
    preparedLegend,
    legendConfig,
}: {
    preparedLegend: PreparedLegend | null;
    legendConfig: LegendConfig | undefined;
}) => {
    if (preparedLegend?.enabled && preparedLegend.position === 'top') {
        return (legendConfig?.height ?? 0) + preparedLegend.margin;
    }

    return 0;
};

const getRightOffset = ({
    preparedLegend,
    legendConfig,
}: {
    preparedLegend: PreparedLegend | null;
    legendConfig: LegendConfig | undefined;
}) => {
    if (preparedLegend?.enabled && preparedLegend.position === 'right') {
        return (legendConfig?.width ?? 0) + preparedLegend.margin;
    }

    return 0;
};

const getLeftOffset = ({
    preparedLegend,
    legendConfig,
}: {
    preparedLegend: PreparedLegend | null;
    legendConfig: LegendConfig | undefined;
}) => {
    if (preparedLegend?.enabled && preparedLegend.position === 'left') {
        return (legendConfig?.width ?? 0) + preparedLegend.margin;
    }

    return 0;
};

export function getChartDimensions(args: Args) {
    const {
        height,
        margin,
        preparedLegend,
        preparedSeries,
        preparedXAxis,
        preparedYAxis,
        width,
        legendConfig,
    } = args;

    const hasAxisRelatedSeries = preparedSeries.some(isAxisRelatedSeries);
    const boundsWidth = getBoundsWidth({chartWidth: width, chartMargin: margin, preparedYAxis});
    const bottomOffset = getBottomOffset({
        hasAxisRelatedSeries,
        preparedLegend,
        preparedXAxis,
        legendConfig,
    });
    const topOffset = getTopOffset({preparedLegend, legendConfig});
    const rightOffset = getRightOffset({preparedLegend, legendConfig});
    const leftOffset = getLeftOffset({preparedLegend, legendConfig});

    const boundsHeight = height - margin.top - margin.bottom - bottomOffset - topOffset;
    const adjustedBoundsWidth = boundsWidth - rightOffset - leftOffset;

    return {boundsWidth: adjustedBoundsWidth, boundsHeight};
}

export const useChartDimensions = (args: Args) => {
    const {
        height,
        margin,
        preparedLegend,
        preparedSeries,
        preparedXAxis,
        preparedYAxis,
        width,
        legendConfig,
    } = args;

    return React.useMemo(() => {
        if (!preparedLegend || !legendConfig) {
            return {boundsWidth: 0, boundsHeight: 0};
        }

        return getChartDimensions(args);
    }, [
        height,
        margin,
        preparedLegend,
        legendConfig,
        preparedSeries,
        preparedXAxis,
        preparedYAxis,
        width,
    ]);
};
