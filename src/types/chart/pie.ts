import type {BaseType} from 'd3';

import type {SeriesType} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData} from './base';
import type {ChartLegend, RectLegendSymbolOptions} from './legend';

export interface PieSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /** The value of the pie segment. */
    value: number | null;
    /** The name of the pie segment (used in legend, tooltip etc). */
    name: string;
    /** Initial visibility of the pie segment. */
    visible?: boolean;
    /** Initial data label of the pie segment. If not specified, the value is used. */
    label?: string;
    /** Individual opacity for the pie segment. */
    opacity?: number;
    /** The individual radius of the pie segment. The default value is series.radius */
    radius?: string | number;
}

export type ConnectorShape = 'straight-line' | 'polyline';
export type ConnectorCurve = 'linear' | 'basic';

export interface PieSeries<T = MeaningfulAny> extends BaseSeries {
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
    /**
     * The minimum allowable radius of the pie.
     *
     * If specified as a percentage, the base for calculation is the height or width of the chart (the minimum value is taken) minus the halo effect.
     *
     * If not specified, the minimum radius is calculated as 30% of the height or width of the chart (the minimum value is taken) minus the halo effect.
     */
    minRadius?: string | number;
    /** Individual series legend options. Has higher priority than legend options in widget data */
    legend?: ChartLegend & {
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
    renderCustomShape?: (args: {series: {innerRadius: number}}) => BaseType | Promise<BaseType>;
    /**
     * Specifies how null or undefined values should be handled in the series.
     *
     * - `'replaceByZero'`: Treat null values as zero
     * - `'break'`: Skip segments with null values (don't render them)
     *
     * @default 'break'
     */
    nullHandling?: 'replaceByZero' | 'break';
}
