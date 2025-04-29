import type {BaseType} from 'd3';

import type {SeriesType} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData} from './base';
import type {ChartLegend, RectLegendSymbolOptions} from './legend';

export interface RadarSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /** The value of the radar point. */
    value: number;
    /** The name of the radar category (used in legend, tooltip etc). */
    name?: string;
    /** Initial visibility of the radar point. */
    visible?: boolean;
    /** Individual opacity for the radar point. */
    opacity?: number;
}

export interface RadarSeries<T = MeaningfulAny> extends BaseSeries {
    type: typeof SeriesType.Radar;
    /** The categories for the radar chart. */
    categories?: string[];
    data: RadarSeriesData<T>[];
    /** The name of the radar series. */
    name?: string;
    /** The color of the radar series. */
    color?: string;
    /**
     * The color of the border surrounding the radar area.
     * @default `--g-color-base-background` from @gravity-ui/uikit.
     */
    borderColor?: string;
    /**
     * The width of the border surrounding the radar area.
     * @default 1
     */
    borderWidth?: number;
    /**
     * The opacity of the radar area fill.
     * @default 0.5
     */
    fillOpacity?: number;
    /** Individual series legend options. Has higher priority than legend options in widget data */
    legend?: ChartLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    /**
     * Function for adding custom svg nodes for a series
     *
     * @return BaseType
     * */
    renderCustomShape?: (args: {series: RadarSeries<T>}) => BaseType;
}
