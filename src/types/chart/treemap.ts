import type {LayoutAlgorithm, SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData} from './base';
import type {ChartLegend, RectLegendSymbolOptions} from './legend';

export interface TreemapSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /** The name of the node (used in legend, tooltip etc). */
    name: string | string[];
    /** The value of the node. All nodes should have this property except nodes that have children. */
    value?: number;
    /** An id for the node. Used to group children. */
    id?: string;
    /**
     * Parent id. Used to build a tree structure. The value should be the id of the node which is the parent.
     * If no nodes has a matching id, or this option is undefined, then the parent will be set to the root.
     */
    parentId?: string;
}

export interface TreemapSeries<T = MeaningfulAny> extends BaseSeries {
    type: typeof SERIES_TYPE.Treemap;
    data: TreemapSeriesData<T>[];
    /** The name of the series (used in legend, tooltip etc). */
    name: string;
    /** The main color of the series (hex, rgba). */
    color?: string;
    /** Individual series legend options. Has higher priority than legend options in widget data. */
    legend?: ChartLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    /** Set options on specific levels. Takes precedence over series options, but not point options. */
    levels?: {
        /** Decides which level takes effect from the options set in the levels object. */
        index: number;
        /** Can set the padding between all points which lies on the same level. */
        padding?: number;
        /** Can set a color on all points which lies on the same level. */
        color?: string;
    }[];
    layoutAlgorithm?: `${LayoutAlgorithm}`;
    /**
     * Options for the series data labels, appearing next to each data point.
     * */
    dataLabels?: BaseSeries['dataLabels'] & {
        /** Horizontal alignment of the data label inside the tile. */
        align?: 'left' | 'center' | 'right';
    };
    /** Data sorting settings (affects the order in which blocks are displayed inside the chart).
     * If the option is not specified, the data is displayed in the order defined by the user. */
    sorting?: {
        /** Enable or disable sorting. */
        enabled?: boolean;
        /** The sorting direction.
         *
         * @default: 'desc'
         */
        direction?: 'asc' | 'desc';
    };
}
