import type {AxisDomain, AxisScale} from 'd3-axis';
import get from 'es-toolkit/compat/get';

import type {PreparedYAxis} from '~core/axes/types';
import type {ChartScale} from '~core/scales/types';
import type {PreparedBarYSeries, PreparedSeriesOptions} from '~core/series/types';
import {getSeriesStackId} from '~core/series/utils';
import {getBarBandContentSize, getBarLayout} from '~core/shapes/bar-width';
import {getDataCategoryValue, isBandScale} from '~core/utils';
import {getBarBandSize} from '~core/utils/band-size';

import type {BarYSeriesData} from '../../types';

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
    const {barMaxWidth, barPadding, groupPadding} = seriesOptions['bar-y'];
    const domain = Object.keys(groupedData);
    const bandSize = getBarBandSize({domain, scale: scale as AxisScale<AxisDomain>});
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
    const groupSize = getBarBandContentSize(bandSize, groupPadding);
    const barSlotSize = groupSize / maxGroupSize;
    const {width: barSize, gap: barGap} = getBarLayout(
        layoutSeries,
        barSlotSize,
        barPadding,
        barMaxWidth,
    );
    return {bandSize, barGap, barSize, barSlotSize, groupSize};
}
