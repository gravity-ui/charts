import type {DashStyle, SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData, BaseSeriesLegend} from './base';
import type {RectLegendSymbolOptions} from './legend';

export interface XRangeSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /**
     * The start value of the bar on the x-axis. Can be a numeric or timestamp value.
     */
    x0: number | string;
    /**
     * The end value of the bar on the x-axis. Can be a numeric or timestamp value.
     */
    x1: number | string;
    /**
     * The `y` value. Depending on the context it may represent:
     * - a category value (for `category` y axis). If string, it is the category itself. If number, it is the index in `yAxis[0].categories`.
     * - a numeric value (for `linear` y axis)
     */
    y?: string | number;
    /** Individual color for the bar. Overrides the series color. */
    color?: string;
    /** Data label value. If not specified, the series name is used. */
    label?: string | number;
    /** Individual opacity for the bar. */
    opacity?: number;
}

export interface XRangeSeries<T = MeaningfulAny> extends BaseSeries {
    type: typeof SERIES_TYPE.XRange;
    data: XRangeSeriesData<T>[];
    /** The name of the series (used in legend, tooltip etc) */
    name: string;
    /** The main color of the series (hex, rgba) */
    color?: string;
    /** Individual opacity for the entire series. */
    opacity?: number | null;
    /**
     * The corner radius of the border surrounding each bar.
     * @default 0
     */
    borderRadius?: number;
    /**
     * The width of the border surrounding each bar.
     * @default 0
     */
    borderWidth?: number;
    /**
     * The color of the border surrounding each bar.
     */
    borderColor?: string;
    /**
     * The dash style of the border surrounding each bar.
     * @default 'Solid'
     */
    borderDashStyle?: DashStyle;
    /** Individual series legend options. Has higher priority than legend options in widget data */
    legend?: BaseSeriesLegend & {
        symbol?: RectLegendSymbolOptions;
    };
}
