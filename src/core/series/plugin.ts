import type {ScaleOrdinal} from 'd3-scale';

import type {ChartSeries, ChartSeriesOptions} from '../../types';

import type {PreparedLegend, PreparedSeries} from './types';

export interface PrepareSeriesArgs {
    series: ChartSeries[];
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegend;
    colorScale: ScaleOrdinal<string, string>;
    colors: string[];
}

export interface SeriesPlugin<T extends ChartSeries = ChartSeries> {
    type: T['type'];
    prepareSeries(args: PrepareSeriesArgs): PreparedSeries[] | Promise<PreparedSeries[]>;
}
