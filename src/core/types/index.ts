import type {ChartXAxis, ChartYAxis} from './chart/axis';
import type {ChartOptions} from './chart/chart';
import type {ChartInteractionItem} from './chart/interaction';
import type {ChartLegend} from './chart/legend';
import type {ChartSeries, ChartSeriesOptions} from './chart/series';
import type {ChartSplit} from './chart/split';
import type {ChartTitle} from './chart/title';
import type {ChartTooltip} from './chart/tooltip';
import type {MeaningfulAny} from './misc';

export * from './misc';
export * from './chart/annotation';
export * from './chart/axis';
export * from './chart/base';
export * from './chart/chart';
export * from './chart/interaction';
export * from './chart/legend';
export type * from './chart/pie';
export type * from './chart/scatter';
export * from './chart/bar-data-labels';
export type * from './chart/bar-x';
export type * from './chart/bar-y';
export type * from './chart/area';
export type * from './chart/area-range';
export type * from './chart/line';
export * from './chart/series';
export * from './chart/split';
export * from './chart/title';
export * from './chart/tooltip';
export * from './chart/zoom';
export * from './chart/halo';
export type * from './chart/treemap';
export type * from './chart/waterfall';
export type * from './chart/sankey';
export type * from './chart/radar';
export type * from './chart/heatmap';
export type * from './chart/funnel';
export * from './chart/gradient';
export * from './chart/brush';
export type * from './chart/x-range';

/** T is point custom metadata; TItem describes the interaction results produced by this chart. */
export interface ChartData<
    T = MeaningfulAny,
    TItem extends ChartInteractionItem = ChartInteractionItem,
> {
    /**
     * General options for the chart.
     */
    chart?: ChartOptions<TItem>;
    /**
     * The color list of palette.
     * If no color is set in series, the colors would be adopted sequentially and circularly from this list as the colors of series.
     * @default ['#4DA2F1', '#FF3D64', '#8AD554', '#FFC636', '#FFB9DD', '#84D1EE', '#FF91A1', '#54A520', '#DB9100', '#BA74B3', '#1F68A9', '#ED65A9', '#0FA08D', '#FF7E00', '#E8B0A4', '#52A6C5', '#BE2443', '#70C1AF', '#FFB46C', '#DCA3D7']
     */
    colors?: string[];
    /**
     * Default state applied on first render.
     */
    defaultState?: {
        /**
         * Position within the plot area to trigger hover on first render.
         * Values can be absolute pixels (`number` or `"100px"`) or percentages (`"50%"`).
         */
        hoveredPosition?: {
            x: number | string;
            y: number | string;
        };
    };
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
        options?: ChartSeriesOptions<T>;
    };
    /**
     * Setting for displaying charts on different plots.
     * It can be used to visualize related information on multiple charts.
     */
    split?: ChartSplit;
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
}
