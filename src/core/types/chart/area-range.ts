import type {SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData, BaseSeriesLegend} from './base';
import type {SeriesColor} from './gradient';
import type {RectLegendSymbolOptions} from './legend';
import type {ChartSeriesRangeSliderOptions} from './series';

export interface AreaRangeSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    x?: string | number;
    y0: number | null;
    y1: number | null;
    label?: string | number;
}

export interface AreaRangeSeries<T = MeaningfulAny> extends BaseSeries<T> {
    type: typeof SERIES_TYPE.AreaRange;
    data: AreaRangeSeriesData<T>[];
    name: string;
    color?: SeriesColor;
    fillColor?: SeriesColor;
    opacity?: number;
    lineWidth?: number;
    legend?: BaseSeriesLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    yAxis?: number;
    nullMode?: 'connect' | 'skip';
    rangeSlider?: ChartSeriesRangeSliderOptions;
}
