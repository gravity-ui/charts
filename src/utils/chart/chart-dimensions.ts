import type {
    PreparedChart,
    PreparedLegend,
    PreparedSeries,
    PreparedXAxis,
    PreparedYAxis,
} from '../../hooks';
import type {ChartMargin, LegendConfig} from '../../types';

import {isAxisRelatedSeries} from './series-type-guards';

export const getBoundsWidth = (args: {
    chartWidth: number;
    chartMargin: PreparedChart['margin'];
    preparedYAxis: PreparedYAxis[] | null;
}) => {
    const {chartWidth, chartMargin, preparedYAxis} = args;

    return (
        chartWidth -
        chartMargin.right -
        chartMargin.left -
        getWidthOccupiedByYAxis({preparedAxis: preparedYAxis})
    );
};

export function getYAxisWidth(axis: PreparedYAxis | undefined) {
    if (!axis?.visible) {
        return 0;
    }

    let result = 0;
    if (axis?.title.text) {
        result += axis.title.margin;

        if (axis.title.rotation === 0) {
            result += axis.title.width;
        } else {
            result += axis.title.height;
        }
    }

    if (axis?.labels.enabled) {
        result += axis.labels.margin + axis.labels.width;
    }

    return result;
}

export function getWidthOccupiedByYAxis(args: {preparedAxis: PreparedYAxis[] | null}) {
    const {preparedAxis} = args;
    let leftAxisWidth = 0;
    let rightAxisWidth = 0;

    preparedAxis?.forEach((axis) => {
        const axisWidth = getYAxisWidth(axis);
        if (axis.position === 'right') {
            rightAxisWidth = Math.max(rightAxisWidth, axisWidth);
        } else {
            leftAxisWidth = Math.max(leftAxisWidth, axisWidth);
        }
    });

    return leftAxisWidth + rightAxisWidth;
}

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

export function getChartDimensions({
    height,
    margin,
    preparedLegend,
    preparedSeries,
    preparedXAxis,
    preparedYAxis,
    width,
    legendConfig,
}: {
    height: number;
    margin: ChartMargin;
    preparedLegend: PreparedLegend | null;
    preparedSeries: PreparedSeries[];
    preparedXAxis: PreparedXAxis | null;
    preparedYAxis: PreparedYAxis[] | null;
    width: number;
    legendConfig: LegendConfig | undefined;
}) {
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
