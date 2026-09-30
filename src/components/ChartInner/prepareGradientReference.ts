import isEqual from 'lodash/isEqual';

import {getChartDimensions} from '~core/layout/chart-dimensions';
import {getSplit} from '~core/layout/split';

import {getAxes} from '../../hooks/useAxis';
import {createScales} from '../../hooks/useAxisScales';
import type {GradientReference} from '../../hooks/useShapes/types';
import type {ChartData} from '../../types';

import {recalculateYAxisLabelsWidth} from './utils';

type AxisArgs = Parameters<typeof getAxes>[0];
interface Args extends AxisArgs {
    split?: ChartData['split'];
}

/** Use the unfiltered layout even when a chart first opens with a selected range. */
export async function prepareGradientReference(args: Args): Promise<GradientReference> {
    const {xAxis, yAxis: initialYAxis} = await getAxes(args);
    let yAxis = initialYAxis;
    const calculate = async () => {
        const {boundsWidth, boundsHeight} = getChartDimensions({
            ...args,
            margin: args.preparedChart.margin,
            preparedXAxis: xAxis,
            preparedYAxis: yAxis,
        });
        const split = await getSplit({split: args.split, boundsHeight, chartWidth: args.width});
        const scales = createScales({
            boundsWidth,
            boundsHeight,
            series: args.preparedSeries,
            split,
            xAxis,
            yAxis,
        });
        return {
            boundsWidth,
            boundsHeight,
            series: args.preparedSeries,
            split,
            xAxis,
            yAxis,
            ...scales,
        };
    };
    const reference = await calculate();
    const adjustedYAxis = await recalculateYAxisLabelsWidth({
        seriesData: args.preparedSeries,
        yAxis,
        yScale: reference.yScale,
    });
    if (isEqual(yAxis, adjustedYAxis)) {
        return reference;
    }
    yAxis = adjustedYAxis;
    return calculate();
}
