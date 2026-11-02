import {getPreparedXAxis} from '~core/axes/x-axis';
import {getPreparedYAxis} from '~core/axes/y-axis';
import {getHorizontalAxisOffsets} from '~core/layout/chart-dimensions';
import type {PreparedLegend, PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import {getWidthOccupiedByYAxis} from '~core/utils';

import type {ChartXAxis, ChartYAxis, LegendConfig} from '../../types';
import type {PreparedChart} from '../types';

interface UseAxesProps {
    height: number;
    preparedChart: PreparedChart;
    legendConfig: LegendConfig | undefined;
    preparedLegend: PreparedLegend | null;
    preparedSeries: PreparedSeries[];
    preparedSeriesOptions: PreparedSeriesOptions;
    width: number;
    boundsHeight?: number;
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis[];
}

export async function getAxes(props: UseAxesProps) {
    const {
        boundsHeight,
        height,
        preparedChart,
        legendConfig,
        preparedLegend,
        preparedSeries,
        width,
        xAxis,
        yAxis,
    } = props;
    const seriesData = preparedSeries.filter((s) => s.visible);

    const estimatedPreparedYAxis = await getPreparedYAxis({
        height,
        boundsHeight: height,
        width,
        seriesData,
        yAxis,
    });
    const axesWidth = getWidthOccupiedByYAxis({preparedAxis: estimatedPreparedYAxis});
    const estimatedBoundsWidth =
        width - (axesWidth + preparedChart.margin.left + preparedChart.margin.right);
    const axisOffsets = getHorizontalAxisOffsets({
        preparedYAxis: estimatedPreparedYAxis,
        preparedLegend,
        legendConfig,
    });
    const preparedXAxis = await getPreparedXAxis({
        xAxis,
        width,
        boundsWidth: estimatedBoundsWidth,
        seriesData,
        labelBounds: {leftOverflow: axisOffsets.left, rightOverflow: axisOffsets.right},
    });

    let estimatedBoundsHeight = boundsHeight ?? height;

    if (preparedXAxis && typeof boundsHeight !== 'number') {
        estimatedBoundsHeight =
            height -
            (preparedXAxis.title.height +
                preparedXAxis.title.margin +
                preparedXAxis.labels.margin +
                preparedXAxis.labels.height +
                (preparedXAxis.rangeSlider.enabled
                    ? preparedXAxis.rangeSlider.height + preparedXAxis.rangeSlider.margin
                    : 0) +
                (legendConfig?.height ?? 0) +
                (preparedLegend?.margin ?? 0) +
                preparedChart.margin.top +
                preparedChart.margin.bottom);
    }

    const preparedYAxis = await getPreparedYAxis({
        height,
        boundsHeight: estimatedBoundsHeight,
        width,
        seriesData,
        yAxis,
    });

    return {xAxis: preparedXAxis, yAxis: preparedYAxis};
}
