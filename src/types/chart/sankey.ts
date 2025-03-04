import type {SeriesType} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData} from './base';

export interface SankeySeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    name: string;
    color?: string;
    links: {
        name: string;
        value: number;
    }[];
}

export interface SankeySeries<T = MeaningfulAny> extends BaseSeries {
    type: typeof SeriesType.Sankey;
    /** The name of the series (used in legend, tooltip etc). */
    name: string;
    data: SankeySeriesData<T>[];
}
