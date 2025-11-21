import type {SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData} from './base';
import type {ChartLegend, RectLegendSymbolOptions} from './legend';

export interface WaterfallSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /**
     * The `x` value. Depending on the context , it may represents:
     * - numeric value (for `linear` x axis)
     * - timestamp value (for `datetime` x axis)
     * - x axis category value (for `category` x axis). If the type is a string, then it is a category value itself. If the type is a number, then it is the index of an element in the array of categories described in `xAxis.categories`
     */
    x?: string | number;
    /**
     * The `y` value. Depending on the context , it may represents:
     * - numeric value (for `linear` y axis)
     */
    y?: number | null;
    /** Data label value of the point. If not specified, the y value is used. */
    label?: string | number;
    /** Individual opacity for the point. */
    opacity?: number;
    /** When this property is true, the point display the total sum across the entire series. */
    total?: boolean;
}

export interface WaterfallSeries<T = MeaningfulAny> extends BaseSeries {
    type: typeof SERIES_TYPE.Waterfall;
    data: WaterfallSeriesData<T>[];
    /** The name of the series (used in legend, tooltip etc). */
    name: string;
    /** The main color of the series (hex, rgba). */
    color?: string;
    /** The color used for positive values. If it is not specified, the general color of the series is used. */
    positiveColor?: string;
    /** The color used for negative values. If it is not specified, the general color of the series is used. */
    negativeColor?: string;
    /** Individual series legend options. Has higher priority than legend options in widget data. */
    legend?: ChartLegend & {
        symbol?: RectLegendSymbolOptions;
        /** The legend item text for positive, negative values and totals. */
        itemText?: {
            /** The legend item text for positive values. */
            positive?: string;
            /** The legend item text for negative values. */
            negative?: string;
            /** The legend item text for totals. */
            totals?: string;
        };
    };
    /**
     * Defines how to handle null values in the data.
     *
     * - `'zero'`: Treat null values as zero
     * - `'skip'`: Omit data points with null values (don't render them)
     *
     * @default 'skip'
     */
    nullMode?: 'zero' | 'skip';
}
