import get from 'lodash/get';

import type {PreparedYAxis} from '../../../hooks';
import {getYAxisLabelMaxWidth} from '../../../hooks/useAxis/y-axis';
import type {ChartScale} from '../../../hooks/useAxisScales/types';
import type {PreparedSeries} from '../../../hooks/useSeries/types';

export async function recalculateYAxisLabelsWidth(props: {
    seriesData: PreparedSeries[];
    yAxis: PreparedYAxis[];
    yScale?: (ChartScale | undefined)[];
}) {
    const {seriesData, yAxis, yScale} = props;
    const axisIndexesToRecalculateMap: Map<number, number> = new Map();

    for (let i = 0; i < yAxis.length; i++) {
        const axis = yAxis[i];
        const scale = yScale?.[i];

        if (!scale) {
            continue;
        }

        if (axis.startOnTick || axis.endOnTick) {
            const axisSeriesData = seriesData.filter((s) => get(s, 'yAxis', 0) === i && s.visible);

            if (axisSeriesData.length === 0) {
                continue;
            }

            const res = await getYAxisLabelMaxWidth({
                axis,
                seriesData: axisSeriesData,
                scale,
            });

            if (res.width > axis.labels.width) {
                axisIndexesToRecalculateMap.set(i, res.width);
            }
        }
    }

    return yAxis.map((axis, i) => {
        const width = axisIndexesToRecalculateMap.get(i);

        if (width) {
            const axisWithRecalculatedLabels = {
                ...axis,
                labels: {...axis.labels, width},
            };

            return axisWithRecalculatedLabels;
        }

        return axis;
    });
}
