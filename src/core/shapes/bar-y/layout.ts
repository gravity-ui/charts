import {max} from 'd3-array';
import type {AxisDomain, AxisScale} from 'd3-axis';
import get from 'lodash/get';

import type {BarYSeriesData} from '../../../types';
import type {PreparedYAxis} from '../../axes/types';
import type {ChartScale} from '../../scales/types';
import type {PreparedBarYSeries, PreparedSeriesOptions} from '../../series/types';
import {getSeriesStackId} from '../../series/utils';
import {getDataCategoryValue} from '../../utils';
import {getBandSize} from '../../utils/band-size';
import {MIN_BAR_GAP, MIN_BAR_GROUP_GAP, MIN_BAR_WIDTH} from '../bar-constants';

/**
 * BarY always filters out data with null or replace null by zero.
 */
type PreparedBarYSeriesData = BarYSeriesData & {x?: number | string};

const isSeriesDataValid = (
    d: BarYSeriesData | PreparedBarYSeriesData,
): d is PreparedBarYSeriesData => d.x !== null;

export function groupBarYDataByYValue(series: PreparedBarYSeries[], yAxis: PreparedYAxis[]) {
    const data: Record<
        string | number,
        Record<string, {data: PreparedBarYSeriesData; series: PreparedBarYSeries}[]>
    > = {};
    series.forEach((s) => {
        const axisIndex = get(s, 'yAxis', 0);
        const seriesYAxis = yAxis[axisIndex];
        const categories = get(seriesYAxis, 'categories', [] as string[]);

        const stackId = getSeriesStackId(s);
        s.data.forEach((d) => {
            if (!isSeriesDataValid(d)) {
                return;
            }

            const key =
                seriesYAxis.type === 'category'
                    ? getDataCategoryValue({axisDirection: 'y', categories, data: d})
                    : d.y;

            if (key !== undefined) {
                if (!data[key]) {
                    data[key] = {};
                }

                if (!data[key][stackId]) {
                    data[key][stackId] = [];
                }

                data[key][stackId].push({data: d, series: s});
            }
        });
    });

    return data;
}

export function getBarYLayout(args: {
    seriesOptions: PreparedSeriesOptions;
    groupedData: ReturnType<typeof groupBarYDataByYValue>;
    scale: ChartScale | undefined;
}) {
    const {groupedData, seriesOptions, scale} = args;
    const barMaxWidth = get(seriesOptions, 'bar-y.barMaxWidth');
    const barPadding = get(seriesOptions, 'bar-y.barPadding');
    const groupPadding = get(seriesOptions, 'bar-y.groupPadding');
    const domain = Object.keys(groupedData);
    const bandSize = getBandSize({domain, scale: scale as AxisScale<AxisDomain>});
    const groupGap = Math.max(bandSize * groupPadding, MIN_BAR_GROUP_GAP);
    const maxGroupSize =
        max(
            Object.values(groupedData),
            (d) =>
                Object.values(d).filter((items) =>
                    items.some((item) => item.series.grouping !== false),
                ).length,
        ) || 1;
    const groupSize = Math.max(0, bandSize - groupGap);
    const barSlotSize = groupSize / maxGroupSize;
    const barGap = Math.max(barSlotSize * barPadding, MIN_BAR_GAP);
    const barSize = Math.max(MIN_BAR_WIDTH, Math.min(barSlotSize - barGap, barMaxWidth));

    const overlayGap = Math.max(groupSize * barPadding, MIN_BAR_GAP);
    const overlaySize = Math.max(MIN_BAR_WIDTH, Math.min(groupSize - overlayGap, barMaxWidth));
    return {bandSize, barGap, barSize, overlaySize};
}
