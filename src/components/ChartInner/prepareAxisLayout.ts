import isEqual from 'lodash/isEqual';

import {getSplit} from '~core/layout/split';
import {getChartDimensions, isAxisRelatedSeries} from '~core/utils';

import type {RangeSliderState, ZoomState} from '../../hooks';
import {getAxes} from '../../hooks/useAxis';
import {createScales} from '../../hooks/useAxisScales';
import type {ChartData} from '../../types';

import {recalculateYAxisLabelsWidth} from './utils';

type AxisArgs = Parameters<typeof getAxes>[0];

interface Args extends AxisArgs {
    split?: ChartData['split'];
    rangeSliderState?: RangeSliderState;
    zoomState?: Partial<ZoomState>;
}

/** Use the same axis and plot layout for the visible chart and its full-series paint reference. */
export async function prepareAxisLayout(args: Args) {
    const {xAxis, yAxis: initialYAxis} = await getAxes(args);
    let yAxis = initialYAxis;

    const calculate = async () => {
        const {boundsWidth, boundsHeight} = getChartDimensions({
            height: args.height,
            width: args.width,
            margin: args.preparedChart.margin,
            preparedLegend: args.preparedLegend,
            preparedSeries: args.preparedSeries,
            preparedYAxis: yAxis,
            preparedXAxis: xAxis,
            legendConfig: args.legendConfig,
        });
        const split = await getSplit({
            split: args.split,
            boundsHeight,
            chartWidth: args.width,
        });
        const scales = args.preparedSeries.some(isAxisRelatedSeries)
            ? createScales({
                  boundsWidth,
                  boundsHeight,
                  series: args.preparedSeries,
                  split,
                  xAxis,
                  yAxis,
                  rangeSliderState: args.rangeSliderState,
                  zoomState: args.zoomState,
              })
            : {xScale: undefined, yScale: undefined};
        return {boundsWidth, boundsHeight, split, xAxis, yAxis, ...scales};
    };

    const layout = await calculate();
    const adjustedYAxis = await recalculateYAxisLabelsWidth({
        seriesData: args.preparedSeries,
        yAxis,
        yScale: layout.yScale,
    });
    if (isEqual(yAxis, adjustedYAxis)) {
        return layout;
    }
    yAxis = adjustedYAxis;
    return calculate();
}
