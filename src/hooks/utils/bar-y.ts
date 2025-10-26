import type {AxisDomain, AxisScale} from 'd3';
import {max} from 'd3';
import get from 'lodash/get';

import type {BarYSeries, BarYSeriesData} from '../../types';
import {getDataCategoryValue, isBandScale} from '../../utils';
import {MIN_BAR_GAP, MIN_BAR_GROUP_GAP, MIN_BAR_WIDTH} from '../constants';
import type {ChartScale} from '../useAxisScales';
import type {PreparedAxis} from '../useChartOptions/types';
import type {PreparedBarYSeries, PreparedSeriesOptions, StackedSeries} from '../useSeries/types';
import {getSeriesStackId} from '../useSeries/utils';

export function groupBarYDataByYValue<T extends BarYSeries | PreparedBarYSeries>(
    series: T[],
    yAxis: PreparedAxis[],
) {
    const data: Record<string | number, Record<string, {data: BarYSeriesData; series: T}[]>> = {};
    series.forEach((s) => {
        s.data.forEach((d) => {
            const axisIndex = get(s, 'yAxis', 0);
            const seriesYAxis = yAxis[axisIndex];
            const categories = get(seriesYAxis, 'categories', [] as string[]);
            const key =
                seriesYAxis.type === 'category'
                    ? getDataCategoryValue({axisDirection: 'y', categories, data: d})
                    : d.y;

            if (key) {
                if (!data[key]) {
                    data[key] = {};
                }

                const stackId = getSeriesStackId(s as StackedSeries);
                if (!data[key][stackId]) {
                    data[key][stackId] = [];
                }

                data[key][stackId].push({data: d, series: s});
            }
        });
    });

    return data;
}

export function getBandSize({
    domain,
    scale,
}: {
    domain: AxisDomain[];
    scale: AxisScale<AxisDomain> | undefined;
}) {
    if (!scale || !domain.length) {
        return 0;
    }

    if (isBandScale(scale)) {
        return scale.bandwidth();
    }

    const range = scale.range();
    const plotHeight = Math.abs(range[0] - range[1]);

    if (domain.length === 1) {
        return plotHeight;
    }

    // for the numeric or datetime axes, you first need to count domain.length + 1,
    // since the extreme points are located not in the center of the bar, but along the edges of the axes
    let bandWidth = plotHeight / (domain.length - 1);
    domain.forEach((current, index) => {
        if (index > 0) {
            const prev = domain[index - 1];
            const prevY = scale(prev);
            const currentY = scale(current);
            if (typeof prevY === 'number' && typeof currentY === 'number') {
                const distance = Math.abs(prevY - currentY);
                bandWidth = Math.min(bandWidth, distance);
            }
        }
    });

    return bandWidth;
}

export function getBarYLayout(args: {
    plotHeight: number;
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
    const maxGroupSize = max(Object.values(groupedData), (d) => Object.values(d).length) || 1;
    const groupSize = bandSize - groupGap;
    const barGap = Math.max(bandSize * barPadding, MIN_BAR_GAP);
    const barSize = Math.max(
        MIN_BAR_WIDTH,
        Math.min(groupSize / maxGroupSize - barGap, barMaxWidth),
    );

    return {bandSize, barGap, barSize};
}
