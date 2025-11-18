import type {ChartXAxis, ChartYAxis} from './chart/axis';
import type {ChartOptions} from './chart/chart';
import type {ChartLegend} from './chart/legend';
import type {ChartRangeSlider} from './chart/range-slider';
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
export * from './chart/zoom';
export * from './chart/halo';
export * from './chart/treemap';
export * from './chart/waterfall';
export * from './chart/sankey';
export * from './chart/radar';
export * from './chart/heatmap';
export * from './chart/brush';
export * from './chart/range-slider';

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
     * Configuration options for the chart range slider component.
     *
     * The range slider allows users to select a specific range of data to display
     * on the chart by adjusting the slider handles.
     *
     * Supported only for `linear`, `datetime`, and `logarithmic` X axis types.
     */
    rangeSlider?: ChartRangeSlider;
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
    /** The color list of palette.
     * If no color is set in series, the colors would be adopted sequentially and circularly from this list as the colors of series.
     *
     * @default ['#4DA2F1', '#FF3D64', '#8AD554', '#FFC636', '#FFB9DD', '#84D1EE', '#FF91A1', '#54A520', '#DB9100', '#BA74B3', '#1F68A9', '#ED65A9', '#0FA08D', '#FF7E00', '#E8B0A4', '#52A6C5', '#BE2443', '#70C1AF', '#FFB46C', '#DCA3D7']
     * */
    colors?: string[];
}
