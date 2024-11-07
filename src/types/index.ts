import type {MeaningfulAny} from './misc';
import type {ChartKitWidgetXAxis, ChartKitWidgetYAxis} from './widget-data/axis';
import type {ChartKitWidgetChart} from './widget-data/chart';
import type {ChartKitWidgetLegend} from './widget-data/legend';
import type {ChartKitWidgetSeries, ChartKitWidgetSeriesOptions} from './widget-data/series';
import type {ChartKitWidgetSplit} from './widget-data/split';
import type {ChartKitWidgetTitle} from './widget-data/title';
import type {ChartKitWidgetTooltip} from './widget-data/tooltip';

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

export type ChartKitWidgetData<T = MeaningfulAny> = {
    chart?: ChartKitWidgetChart;
    legend?: ChartKitWidgetLegend;
    series: {
        data: ChartKitWidgetSeries<T>[];
        options?: ChartKitWidgetSeriesOptions;
    };
    title?: ChartKitWidgetTitle;
    tooltip?: ChartKitWidgetTooltip<T>;
    xAxis?: ChartKitWidgetXAxis;
    yAxis?: ChartKitWidgetYAxis[];
    /** Setting for displaying charts on different plots.
     * It can be used to visualize related information on multiple charts. */
    split?: ChartKitWidgetSplit;
};
