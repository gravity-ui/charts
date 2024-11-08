import type {SeriesType, SymbolType} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData} from './base';
import type {ChartLegend, RectLegendSymbolOptions} from './legend';

export type ScatterSeriesData<T = MeaningfulAny> = BaseSeriesData<T> & {
    /**
     * The `x` value of the point. Depending on the context , it may represents:
     * - numeric value (for `linear` x axis)
     * - timestamp value (for `datetime` x axis)
     * - x axis category value (for `category` x axis). If the type is a string, then it is a category value itself. If the type is a number, then it is the index of an element in the array of categories described in `xAxis.categories`
     */
    x?: string | number;
    /**
     * The `y` value of the point. Depending on the context , it may represents:
     * - numeric value (for `linear` y axis)
     * - timestamp value (for `datetime` y axis)
     * - y axis category value (for `category` y axis). If the type is a string, then it is a category value itself. If the type is a number, then it is the index of an element in the array of categories described in `yAxis[0].categories`
     */
    y?: string | number;
    /**
     * Corresponding value of axis category.
     *
     * @deprecated use `x` or `y` instead
     */
    category?: string;
    /** Individual radius for the point. */
    radius?: number;
    /** Individual opacity for the point. */
    opacity?: number;
};

export type ScatterSeries<T = MeaningfulAny> = BaseSeries & {
    type: typeof SeriesType.Scatter;
    data: ScatterSeriesData<T>[];
    /** The name of the series (used in legend, tooltip etc) */
    name: string;
    /** The main color of the series (hex, rgba) */
    color?: string;
    /** A predefined shape or symbol for the dot */
    symbolType?: `${SymbolType}`;
    /** Individual series legend options. Has higher priority than legend options in widget data */
    legend?: ChartLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    /** Y-axis index (when using two axes) */
    yAxis?: number;
};
