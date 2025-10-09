import type React from 'react';

import type {DashStyle, LineCap} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {AreaSeries, AreaSeriesData} from './area';
import type {BarXSeries, BarXSeriesData} from './bar-x';
import type {BarYSeries, BarYSeriesData} from './bar-y';
import type {Halo} from './halo';
import type {LineSeries, LineSeriesData} from './line';
import type {PointMarkerOptions} from './marker';
import type {PieSeries, PieSeriesData} from './pie';
import type {RadarSeries, RadarSeriesData} from './radar';
import type {SankeySeries, SankeySeriesData} from './sankey';
import type {ScatterSeries, ScatterSeriesData} from './scatter';
import type {TreemapSeries, TreemapSeriesData} from './treemap';
import type {WaterfallSeries, WaterfallSeriesData} from './waterfall';

export type ChartSeries<T = MeaningfulAny> =
    | ScatterSeries<T>
    | PieSeries<T>
    | BarXSeries<T>
    | BarYSeries<T>
    | LineSeries<T>
    | AreaSeries<T>
    | TreemapSeries<T>
    | WaterfallSeries<T>
    | SankeySeries<T>
    | RadarSeries<T>;

export type ChartSeriesData<T = MeaningfulAny> =
    | ScatterSeriesData<T>
    | PieSeriesData<T>
    | BarXSeriesData<T>
    | BarYSeriesData<T>
    | LineSeriesData<T>
    | AreaSeriesData<T>
    | TreemapSeriesData<T>
    | WaterfallSeriesData<T>
    | SankeySeriesData<T>
    | RadarSeriesData<T>;

export interface DataLabelRendererData<T = MeaningfulAny> {
    data: ChartSeriesData<T>;
}

export interface BasicHoverState {
    /**
     * Enable separate styles for the hovered series.
     *
     * @default true
     * */
    enabled?: boolean;
    /**
     * How much to brighten/darken the point on hover. Use positive to brighten, negative to darken.
     * The behavior of this property is dependent on the implementing color space ([more details](https://d3js.org/d3-color#color_brighter)).
     * For example in case of using rgb color you can use floating point number from `-5.0` to `5.0`.
     * Rgb color space is used by default.
     *
     * @default 0.3
     */
    brightness?: number;
}

export interface BasicInactiveState {
    /**
     * Enable separate styles for the inactive series.
     *
     * @default true
     * */
    enabled?: boolean;
    /**
     * Opacity of series elements (bars, data labels)
     *
     * @default 0.5
     * */
    opacity?: number;
}

export interface ChartSeriesOptions {
    /** Individual data label for each point. */
    dataLabels?: {
        /** Enable or disable the data labels */
        enabled?: boolean;
        /** Callback function to render the data label */
        renderer?: (args: DataLabelRendererData) => React.SVGTextElementAttributes<SVGTextElement>;
    };
    'bar-x'?: {
        /** The maximum allowed pixel width for a column.
         * This prevents the columns from becoming too wide when there is a small number of points in the chart.
         *
         * @default 50
         */
        barMaxWidth?: number;
        /** Padding between each column or bar, in x axis units.
         *
         * @default 0.1
         * */
        barPadding?: number;
        /** Padding between each value groups, in x axis units
         *
         * @default 0.2
         */
        groupPadding?: number;
        /**
         * The corner radius of the border surrounding each bar.
         * @default 0
         */
        borderRadius?: number;
        dataSorting?: {
            /** Determines what data value should be used to sort by.
             * Possible values are undefined to disable, "name" to sort by series name or "y"
             *
             * @default undefined
             * */
            key?: 'name' | 'y' | undefined;
            /** Sorting direction.
             *
             * @default 'asc'
             * */
            direction?: 'asc' | 'desc';
        };
        /** Options for the series states that provide additional styling information to the series. */
        states?: {
            hover?: BasicHoverState;
            inactive?: BasicInactiveState;
        };
    };
    'bar-y'?: {
        /** The maximum allowed pixel width for a column.
         * This prevents the columns from becoming too wide when there is a small number of points in the chart.
         *
         * @default 50
         */
        barMaxWidth?: number;
        /** Padding between each column or bar, in x axis units.
         *
         * @default 0.1
         * */
        barPadding?: number;
        /** Padding between each value groups, in x axis units
         *
         * @default 0.2
         */
        groupPadding?: number;
        /**
         * The width of the border surrounding each bar.
         *
         * @default 0
         */
        borderWidth?: number;
        /**
         * The color of the border surrounding each bar.
         */
        borderColor?: string;
        /**
         * The corner radius of the border surrounding each bar.
         * @default 0
         */
        borderRadius?: number;
        dataSorting?: {
            /** Determines what data value should be used to sort by.
             * Possible values are undefined to disable, "name" to sort by series name or "x"
             *
             * @default undefined
             * */
            key?: 'name' | 'x' | undefined;
            /** Sorting direction.
             *
             * @default 'asc'
             * */
            direction?: 'asc' | 'desc';
        };
        /** Options for the series states that provide additional styling information to the series. */
        states?: {
            hover?: BasicHoverState;
            inactive?: BasicInactiveState;
        };
    };
    pie?: {
        /** Options for the series states that provide additional styling information to the series. */
        states?: {
            hover?: BasicHoverState & {
                /** Options for the halo appearing outside the hovered slice */
                halo?: Halo;
            };
            inactive?: BasicInactiveState;
        };
    };
    scatter?: {
        /** Options for the series states that provide additional styling information to the series. */
        states?: {
            hover?: BasicHoverState & {
                marker?: PointMarkerOptions & {
                    /** Options for the halo appearing around the hovered point */
                    halo?: Halo;
                };
            };
            inactive?: BasicInactiveState;
        };
    };
    line?: {
        /** Pixel width of the graph line.
         *
         * @default 1
         * */
        lineWidth?: number;
        /** Options for the series states that provide additional styling information to the series. */
        states?: {
            hover?: BasicHoverState & {
                marker?: PointMarkerOptions & {
                    /** Options for the halo appearing around the hovered point */
                    halo?: Halo;
                };
            };
            inactive?: BasicInactiveState;
        };
        /** Options for the point markers of line series */
        marker?: PointMarkerOptions;

        /** Options for line style
         *
         * @default 'Solid'
         * */
        dashStyle?: DashStyle;

        /** Options for line cap style
         *
         * @default 'round' when dashStyle is not 'solid', 'none' when dashStyle is not 'solid'
         * */
        linecap?: `${LineCap}`;
    };
    area?: {
        /** Pixel width of the graph line.
         *
         * @default 1
         * */
        lineWidth?: number;
        /** Options for the series states that provide additional styling information to the series. */
        states?: {
            hover?: BasicHoverState & {
                marker?: PointMarkerOptions & {
                    /** Options for the halo appearing around the hovered point */
                    halo?: Halo;
                };
            };
            inactive?: BasicInactiveState;
        };
        /** Options for the point markers of line series */
        marker?: PointMarkerOptions;
    };
    treemap?: {
        /** Options for the series states that provide additional styling information to the series. */
        states?: {
            hover?: BasicHoverState;
            inactive?: BasicInactiveState;
        };
    };
    waterfall?: {
        /** The maximum allowed pixel width for a column.
         * This prevents the columns from becoming too wide when there is a small number of points in the chart.
         *
         * @default 50
         */
        barMaxWidth?: number;
        /** Padding between each column or bar, in x axis units.
         *
         * @default 0.1
         * */
        barPadding?: number;
        /** Options for the series states that provide additional styling information to the series. */
        states?: {
            hover?: BasicHoverState;
            inactive?: BasicInactiveState;
        };
    };
    radar?: {
        /** Options for the series states that provide additional styling information to the series. */
        states?: {
            hover?: BasicHoverState & {
                marker?: PointMarkerOptions & {
                    /** Options for the halo appearing around the hovered point */
                    halo?: Halo;
                };
            };
            inactive?: BasicInactiveState;
        };
        /** Options for the point markers of radar series */
        marker?: PointMarkerOptions;
    };
}
