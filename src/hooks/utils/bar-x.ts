import type {AxisDomain, AxisScale} from 'd3';
import {max} from 'd3';
import get from 'lodash/get';

import type {BarXSeries, BarXSeriesData} from '../../types';
import {MIN_BAR_GAP, MIN_BAR_GROUP_GAP, MIN_BAR_WIDTH} from '../constants';
import type {ChartScale} from '../useAxisScales/types';
import type {PreparedBarXSeries, PreparedSeriesOptions} from '../useSeries/types';

import {getBandSize} from './get-band-size';

export function getBarXLayout<T extends BarXSeries | PreparedBarXSeries>(args: {
    seriesOptions: PreparedSeriesOptions;
    groupedData: Record<string | number, Record<string, {data: BarXSeriesData; series: T}[]>>;
    scale: ChartScale | undefined;
}) {
    const {groupedData, seriesOptions, scale} = args;
    const barMaxWidth = get(seriesOptions, 'bar-x.barMaxWidth');
    const barPadding = get(seriesOptions, 'bar-x.barPadding');
    const groupPadding = get(seriesOptions, 'bar-x.groupPadding');
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
