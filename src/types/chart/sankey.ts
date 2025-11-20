import type {SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData} from './base';
import type {ChartLegend, RectLegendSymbolOptions} from './legend';

export interface SankeySeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    name: string;
    color?: string;
    links: {
        name: string;
        value: number;
    }[];
}

export interface SankeySeries<T = MeaningfulAny> extends BaseSeries {
    type: typeof SERIES_TYPE.Sankey;
    /** The name of the series (used in legend, tooltip etc). */
    name: string;
    data: SankeySeriesData<T>[];
    /** Individual series legend options. Has higher priority than legend options in widget data. */
    legend?: ChartLegend & {
        symbol?: RectLegendSymbolOptions;
    };
}
