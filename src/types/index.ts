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
export * from './chart/boxplot';
export * from './chart/line';
export * from './chart/series';
export * from './chart/split';
export * from './chart/title';
export * from './chart/tooltip';
export * from './chart/halo';
export * from './chart/treemap';
export * from './chart/waterfall';

export interface ChartData<T = MeaningfulAny> {
    /**
     * General options for the chart.
     */
    chart?: ChartOptions;
    /**
     * The legend displays a labeled box for each data element in the chart.
     * It shows a distinctive symbol paired with a name for every series.
     */
    legend?: ChartLegend;
    /**
     * Represents the series data and series options.
     */
    series: {
        /**
         * Contains data points to be plotted.
         */
        data: ChartSeries<T>[];
        /**
         * Allows for customizing the appearance and behavior of the series.
         */
        options?: ChartSeriesOptions;
    };
    /**
     * The main title of the chart.
     */
    title?: ChartTitle;
    /**
     * Options for the tooltip that appears when the user hovers over a series or point.
     */
    tooltip?: ChartTooltip<T>;
    /**
     * Options for the the X axis.
     */
    xAxis?: ChartXAxis;
    /**
     * Options for the the Y axis or multiple Y axes.
     */
    yAxis?: ChartYAxis[];
    /**
     * Setting for displaying charts on different plots.
     * It can be used to visualize related information on multiple charts.
     */
    split?: ChartSplit;
}
