import get from 'lodash/get';

import {getYAxisLabelMaxWidth} from '~core/axes/y-axis';
import type {ChartScale} from '~core/scales/types';
import type {PreparedSeries} from '~core/series/types';

import type {PreparedYAxis} from '../../../hooks';

export async function recalculateYAxisLabelsWidth(props: {
    seriesData: PreparedSeries[];
    yAxis: PreparedYAxis[];
    yScale?: (ChartScale | undefined)[];
    // When the X axis is zoomed, the Y scale is rebuilt from X-filtered data, so its
    // ticks may differ from the ones measured at prepare time — re-check label widths.
    hasXZoom?: boolean;
}) {
    const {seriesData, yAxis, yScale, hasXZoom} = props;
    const axisIndexesToRecalculateMap: Map<number, number> = new Map();

    for (let i = 0; i < yAxis.length; i++) {
        const axis = yAxis[i];
        const scale = yScale?.[i];

        if (!scale) {
            continue;
        }

        if (axis.startOnTick || axis.endOnTick || hasXZoom) {
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
