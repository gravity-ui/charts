import type {MeaningfulAny} from './misc';
import type {ChartXAxis, ChartYAxis} from './widget-data/axis';
import type {ChartOptions} from './widget-data/chart';
import type {ChartLegend} from './widget-data/legend';
import type {ChartSeries, ChartSeriesOptions} from './widget-data/series';
import type {ChartSplit} from './widget-data/split';
import type {ChartTitle} from './widget-data/title';
import type {ChartTooltip} from './widget-data/tooltip';

export * from './chart-ui';
export * from './misc';
export * from './widget-data/axis';
export * from './widget-data/base';
export * from './widget-data/chart';
export * from './widget-data/legend';
export * from './widget-data/pie';
export * from './widget-data/scatter';
export * from './widget-data/bar-x';
export * from './widget-data/bar-y';
export * from './widget-data/area';
export * from './widget-data/line';
export * from './widget-data/series';
export * from './widget-data/split';
export * from './widget-data/title';
export * from './widget-data/tooltip';
export * from './widget-data/halo';
export * from './widget-data/treemap';
export * from './widget-data/waterfall';

export type ChartData<T = MeaningfulAny> = {
    chart?: ChartOptions;
    legend?: ChartLegend;
    series: {
        data: ChartSeries<T>[];
        options?: ChartSeriesOptions;
    };
    title?: ChartTitle;
    tooltip?: ChartTooltip<T>;
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis[];
    /** Setting for displaying charts on different plots.
     * It can be used to visualize related information on multiple charts. */
    split?: ChartSplit;
};
