import React from 'react';

import isEqual from 'lodash/isEqual';

import type {ChartSeries, ChartXAxis, ChartYAxis, LegendConfig} from '../../types';
import {getWidthOccupiedByYAxis} from '../../utils';
import type {PreparedChart} from '../types';
import type {PreparedLegend, PreparedSeries, PreparedSeriesOptions} from '../useSeries/types';

import type {AxesState} from './types';
import {getPreparedXAxis} from './x-axis';
import {getPreparedYAxis} from './y-axis';

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
    const seriesData = preparedSeries.filter((s) => s.visible) as ChartSeries[];

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

export function useAxis(props: UseAxesProps) {
    const {
        boundsHeight,
        height,
        preparedChart,
        legendConfig,
        preparedLegend,
        preparedSeries,
        preparedSeriesOptions,
        width,
        xAxis,
        yAxis,
    } = props;
    const [axesState, setAxes] = React.useState<AxesState>({xAxis: null, yAxis: []});
    const axesStateRunRef = React.useRef(0);
    const prevAxesStateValue = React.useRef(axesState);
    const axesStateReady = React.useRef(false);

    React.useEffect(() => {
        axesStateRunRef.current++;
        axesStateReady.current = false;

        if (!preparedLegend || !legendConfig) {
            return;
        }

        (async function () {
            const currentRun = axesStateRunRef.current;

            const newStateValue = await getAxes({
                boundsHeight,
                height,
                preparedChart,
                legendConfig,
                preparedLegend,
                preparedSeries,
                preparedSeriesOptions,
                width,
                xAxis,
                yAxis,
            });

            if (axesStateRunRef.current === currentRun) {
                if (!isEqual(prevAxesStateValue.current, newStateValue)) {
                    setAxes(newStateValue);
                    prevAxesStateValue.current = newStateValue;
                }

                axesStateReady.current = true;
            }
        })();
    }, [
        boundsHeight,
        height,
        preparedChart,
        legendConfig,
        preparedLegend,
        preparedSeries,
        preparedSeriesOptions,
        width,
        xAxis,
        yAxis,
    ]);

    const isAxesReady = axesStateReady.current;
    const result = React.useMemo(() => {
        if (isAxesReady) {
            return axesState;
        }

        prevAxesStateValue.current = {xAxis: null, yAxis: []};
        return prevAxesStateValue.current;
    }, [isAxesReady, axesState]);

    return result;
}
