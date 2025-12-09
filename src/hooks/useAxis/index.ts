import React from 'react';

import isEqual from 'lodash/isEqual';

import type {ChartSeries, ChartXAxis, ChartYAxis} from '../../types';
import type {PreparedChart} from '../useChartOptions/types';
import type {PreparedLegend, PreparedSeries, PreparedSeriesOptions} from '../useSeries/types';

import type {PreparedXAxis, PreparedYAxis} from './types';
import {getPreparedXAxis} from './x-axis';
import {getPreparedYAxis} from './y-axis';

interface UseAxesProps {
    height: number;
    preparedChart: PreparedChart;
    preparedLegend: PreparedLegend | null;
    preparedSeries: PreparedSeries[];
    preparedSeriesOptions: PreparedSeriesOptions;
    width: number;
    boundsHeight?: number;
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis[];
}

export function useAxis(props: UseAxesProps) {
    const {
        boundsHeight,
        height,
        preparedChart,
        preparedLegend,
        preparedSeries,
        preparedSeriesOptions,
        width,
        xAxis,
        yAxis,
    } = props;
    const [axesState, setValue] = React.useState<{
        xAxis: PreparedXAxis | null;
        yAxis: PreparedYAxis[];
    }>({xAxis: null, yAxis: []});
    const axesStateRunRef = React.useRef(0);
    const prevAxesStateValue = React.useRef(axesState);
    const axesStateReady = React.useRef(false);

    React.useEffect(() => {
        axesStateRunRef.current++;
        axesStateReady.current = false;

        (async function () {
            const currentRun = axesStateRunRef.current;
            const seriesData = preparedSeries.filter((s) => s.visible) as ChartSeries[];

            const estimatedPreparedYAxis = await getPreparedYAxis({
                height,
                boundsHeight: height,
                width,
                seriesData,
                yAxis,
            });
            const axesWidth = estimatedPreparedYAxis.reduce(
                (acc, a) =>
                    acc + a.title.height + a.title.margin + a.labels.margin + a.labels.width,
                0,
            );
            const estimatedBoundsWidth =
                width - (axesWidth + preparedChart.margin.left + preparedChart.margin.right);
            const preparedXAxis = await getPreparedXAxis({
                xAxis,
                width,
                boundsWidth: estimatedBoundsWidth,
                seriesData,
            });

            let estimatedBoundsHeight = boundsHeight ?? height;

            if (preparedXAxis && typeof boundsHeight !== 'number') {
                estimatedBoundsHeight =
                    height -
                    (preparedXAxis.title.height +
                        preparedXAxis.title.margin +
                        preparedXAxis.labels.margin +
                        preparedXAxis.labels.height +
                        (preparedLegend ? preparedLegend.height + preparedLegend.margin : 0) +
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

            const newStateValue = {xAxis: preparedXAxis, yAxis: preparedYAxis};

            if (axesStateRunRef.current === currentRun) {
                if (!isEqual(prevAxesStateValue.current, newStateValue)) {
                    setValue(newStateValue);
                    prevAxesStateValue.current = newStateValue;
                }

                axesStateReady.current = true;
            }
        })();
    }, [
        boundsHeight,
        height,
        preparedChart.margin,
        preparedLegend,
        preparedSeries,
        preparedSeriesOptions,
        width,
        xAxis,
        yAxis,
    ]);

    return axesStateReady.current ? axesState : {xAxis: null, yAxis: []};
}
