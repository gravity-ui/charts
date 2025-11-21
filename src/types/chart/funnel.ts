import type {DashStyle, SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseDataLabels, BaseSeries, BaseSeriesData} from './base';
import type {ChartLegend, RectLegendSymbolOptions} from './legend';

export interface FunnelSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /** The value of the funnel segment. */
    value: number;
    /** The name of the funnel segment (used in legend, tooltip etc). */
    name: string;
    /** Initial data label of the funnel segment. If not specified, the value is used. */
    label?: string;
}

export interface FunnelSeries<T = MeaningfulAny> extends Omit<BaseSeries, 'dataLabels'> {
    type: typeof SERIES_TYPE.Funnel;
    data: FunnelSeriesData<T>[];
    /** The name of the funnel series. */
    name?: string;
    /** The color of the funnel series. */
    color?: string;
    /** Individual series legend options. Has higher priority than legend options in widget data */
    legend?: ChartLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    /** Lines or areas connecting the funnel segments. */
    connectors?: {
        enabled?: boolean;
        /** The height of the connector area relative to the funnel segment. */
        height?: string | number;
        /** Option for line stroke style */
        lineDashStyle?: DashStyle;
        /** Opacity for the connector line. */
        lineOpacity?: number;
        /** Connector line color. */
        lineColor?: string;
        /** Connector line width in pixels. */
        lineWidth?: number;
        /** Connector area color. */
        areaColor?: string;
        /** Opacity for the connector area. */
        areaOpacity?: number;
    };
    dataLabels?: Omit<BaseDataLabels, 'html' | 'allowOverlap'> & {
        /** Horizontal alignment of the data labels. */
        align?: 'left' | 'center' | 'right';
    };
}
