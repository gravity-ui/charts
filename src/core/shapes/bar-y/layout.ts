import type {AxisDomain, AxisScale} from 'd3-axis';
import {get} from 'es-toolkit/compat';

import type {BarYSeriesData} from '../../../types';
import type {PreparedYAxis} from '../../axes/types';
import type {ChartScale} from '../../scales/types';
import type {PreparedBarYSeries, PreparedSeriesOptions} from '../../series/types';
import {getSeriesStackId} from '../../series/utils';
import {getDataCategoryValue, isBandScale} from '../../utils';
import {getBandSize} from '../../utils/band-size';
import {MIN_BAR_GROUP_GAP} from '../bar-constants';
import {getBarLayout} from '../bar-width';

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
    const layoutSeries = new Set<PreparedBarYSeries>();
    const categoryDomain = isBandScale(scale) ? new Set(scale.domain().map(String)) : undefined;
    let maxGroupSize = 1;
    for (const [key, category] of Object.entries(groupedData)) {
        let groupCount = 0;
        for (const items of Object.values(category)) {
            const grouped = items.find((item) => item.series.grouping !== false);
            if (grouped) {
                groupCount++;
                if (!categoryDomain || categoryDomain.has(key)) layoutSeries.add(grouped.series);
            }
        }
        maxGroupSize = Math.max(maxGroupSize, groupCount);
    }
    const groupSize = Math.max(0, bandSize - groupGap);
    const barSlotSize = groupSize / maxGroupSize;
    const {width: barSize, gap: barGap} = getBarLayout(
        layoutSeries,
        barSlotSize,
        barPadding,
        barMaxWidth,
    );
    return {bandSize, barGap, barSize, barSlotSize, groupSize};
}
