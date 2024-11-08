import type {ChartXAxis, ChartYAxis} from './chart/axis';
import type {ChartOptions} from './chart/chart';
import type {ChartLegend} from './chart/legend';
import type {ChartSeries, ChartSeriesOptions} from './chart/series';
import type {ChartSplit} from './chart/split';
import type {ChartTitle} from './chart/title';
import type {ChartTooltip} from './chart/tooltip';
import type {MeaningfulAny} from './misc';

export * from './chart-ui';
export * from './misc';
export * from './chart/axis';
export * from './chart/base';
export * from './chart/chart';
export * from './chart/legend';
export * from './chart/pie';
export * from './chart/scatter';
export * from './chart/bar-x';
export * from './chart/bar-y';
export * from './chart/area';
export * from './chart/line';
export * from './chart/series';
export * from './chart/split';
export * from './chart/title';
export * from './chart/tooltip';
export * from './chart/halo';
export * from './chart/treemap';
export * from './chart/waterfall';

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
