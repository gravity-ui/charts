import type {SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData, BaseSeriesLegend} from './base';
import type {RectLegendSymbolOptions} from './legend';

export interface HeatmapSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /**
     * The `x` value of the heatmap cell. Depending on the context, it may represents:
     * - numeric value (for `linear` x axis)
     * - timestamp value (for `datetime` x axis)
     * - x axis category value (for `category` x axis). If the type is a string, then it is a category value itself. If the type is a number, then it is the index of an element in the array of categories described in `xAxis.categories`
     */
    x?: number;
    /**
     * The `y` value of the heatmap cell. Depending on the context, it may represents:
     * - numeric value (for `linear` y axis)
     * - timestamp value (for `datetime` y axis)
     * - y axis category value (for `category` y axis). If the type is a string, then it is a category value itself. If the type is a number, then it is the index of an element in the array of categories described in `yAxis[0].categories`
     */
    y?: string | number;
    /** Value of the heatmap cell */
    value?: number | null;
    /** Data label value of the heatmap cell. If not specified, the value is used. */
    label?: string;
}

export interface HeatmapSeries<T = MeaningfulAny> extends BaseSeries {
    type: typeof SERIES_TYPE.Heatmap;
    data: HeatmapSeriesData<T>[];
    /** The name of the series (used in legend, tooltip etc) */
    name: string;
    /** The main color of the series (hex, rgba) */
    color?: string;
    dataLabels?: BaseSeries['dataLabels'];
    /** Individual series legend options. Has higher priority than legend options in widget data */
    legend?: BaseSeriesLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    /**
     * The width of the border surrounding each cell.
     *
     * @default 0
     */
    borderWidth?: number;
    /**
     * The color of the border surrounding each cell.
     */
    borderColor?: string;
    /**
     * Specifies how null or undefined values should be handled in the series.
     *
     * - `'zero'`: Treat null values as zero
     * - `'skip'`: Omit data points with null values (show gaps)
     *
     * @default 'skip'
     */
    nullMode?: 'zero' | 'skip';
}
