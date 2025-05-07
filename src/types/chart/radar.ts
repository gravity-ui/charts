import type {SeriesType} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData} from './base';
import type {ChartLegend, RectLegendSymbolOptions} from './legend';
import type {PointMarkerOptions} from './marker';

export interface RadarSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /** The value of the radar point. */
    value: number;
}

export interface RadarSeriesCategory {
    /** The categories for the radar chart. */
    key: string;
    /** Maximum value for current key. */
    maxValue?: number;
}

export type RadarMarkerSymbol = 'circle' | 'square';

export interface RadarMarkerOptions extends PointMarkerOptions {
    symbol?: RadarMarkerSymbol;
}

export interface RadarSeries<T = MeaningfulAny> extends BaseSeries {
    type: typeof SeriesType.Radar;
    /** The categories for the radar chart. */
    categories?: RadarSeriesCategory[];
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
    /** Options for the point markers of line in radar series */
    marker?: RadarMarkerOptions;
}
