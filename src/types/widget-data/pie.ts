import type {BaseType} from 'd3';

import type {SeriesType} from '../../constants';

import type {BaseSeries, BaseSeriesData} from './base';
import type {ChartKitWidgetLegend, RectLegendSymbolOptions} from './legend';

export type PieSeriesData<T = any> = BaseSeriesData<T> & {
    /** The value of the pie segment. */
    value: number;
    /** The name of the pie segment (used in legend, tooltip etc). */
    name: string;
    /** Initial visibility of the pie segment. */
    visible?: boolean;
    /** Initial data label of the pie segment. If not specified, the value is used. */
    label?: string;
    /** Individual opacity for the pie segment. */
    opacity?: number;
};

export type ConnectorShape = 'straight-line' | 'polyline';
export type ConnectorCurve = 'linear' | 'basic';

export type PieSeries<T = any> = BaseSeries & {
    type: typeof SeriesType.Pie;
    data: PieSeriesData<T>[];
    /**
     * The color of the border surrounding each segment.
     * @default `--g-color-base-background` from @gravity-ui/uikit.
     */
    borderColor?: string;
    /**
     * The width of the border surrounding each segment.
     * @default '1px'
     */
    borderWidth?: number;
    /**
     * The corner radius of the border surrounding each segment.
     * @default 0
     */
    borderRadius?: number;
    /** The center of the pie chart relative to the chart area. */
    center?: [string | number | null, string | number | null];
    /**
     * The inner radius of the pie.
     * @default 0
     */
    innerRadius?: string | number;
    /** The radius of the pie relative to the chart area. The default behaviour is to scale to the chart area. */
    radius?: string | number;
    /** Individual series legend options. Has higher priority than legend options in widget data */
    legend?: ChartKitWidgetLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    dataLabels?: BaseSeries['dataLabels'] & {
        /**
         * The distance of the data label from the pie's edge.
         *
         * @default 30
         * */
        distance?: number;
        /**
         * The distance from the data label to the connector.
         *
         * @default 5
         * */
        connectorPadding?: number;
        /**
         * The method that is used to generate the connector path.
         *
         * @default 'polyline'
         * */
        connectorShape?: ConnectorShape;
        /**
         * How to interpolate between two-dimensional [x, y] points for a connector.
         * Works only if connectorShape equals to 'polyline'
         *
         * @default 'basic'
         * */
        connectorCurve?: ConnectorCurve;
    };
    /**
     * Function for adding custom svg nodes for a series
     *
     * @return BaseType
     * */
    renderCustomShape?: (args: {series: {innerRadius: number}}) => BaseType;
};
