import type {TOOLTIP_TOTALS_BUILT_IN_AGGREGATION} from '../../constants';
import type {DateTimeLabelFormats} from '../../utils/chart/time';
import type {MeaningfulAny} from '../misc';

import type {AreaSeries, AreaSeriesData} from './area';
import type {AxisPlotBand, AxisPlotLine, ChartXAxis, ChartYAxis} from './axis';
import type {BarXSeries, BarXSeriesData} from './bar-x';
import type {BarYSeries, BarYSeriesData} from './bar-y';
import type {CustomFormat, ValueFormat} from './base';
import type {FunnelSeries, FunnelSeriesData} from './funnel';
import type {HeatmapSeries, HeatmapSeriesData} from './heatmap';
import type {LineSeries, LineSeriesData} from './line';
import type {PieSeries, PieSeriesData} from './pie';
import type {RadarSeries, RadarSeriesCategory, RadarSeriesData} from './radar';
import type {SankeySeries, SankeySeriesData} from './sankey';
import type {ScatterSeries, ScatterSeriesData} from './scatter';
import type {TreemapSeries, TreemapSeriesData} from './treemap';
import type {WaterfallSeries, WaterfallSeriesData} from './waterfall';

export interface TooltipDataChunkBarX<T = MeaningfulAny> {
    data: BarXSeriesData<T>;
    series: BarXSeries<T>;
}

export interface TooltipDataChunkBarY<T = MeaningfulAny> {
    data: BarYSeriesData<T>;
    series: BarYSeries<T>;
}

export interface TooltipDataChunkPie<T = MeaningfulAny> {
    data: PieSeriesData<T>;
    series: {
        type: PieSeries['type'];
        id: string;
        name: string;
    };
}

export interface TooltipDataChunkScatter<T = MeaningfulAny> {
    data: ScatterSeriesData<T>;
    series: {
        type: ScatterSeries['type'];
        id: string;
        name: string;
    };
}

export interface TooltipDataChunkLine<T = MeaningfulAny> {
    data: LineSeriesData<T>;
    series: {
        type: LineSeries['type'];
        id: string;
        name: string;
    };
}

export interface TooltipDataChunkArea<T = MeaningfulAny> {
    data: AreaSeriesData<T>;
    series: {
        type: AreaSeries['type'];
        id: string;
        name: string;
    };
}

export interface TooltipDataChunkTreemap<T = MeaningfulAny> {
    data: TreemapSeriesData<T>;
    series: TreemapSeries<T>;
}

export interface TooltipDataChunkSankey<T = MeaningfulAny> {
    data: SankeySeriesData<T>;
    target?: SankeySeriesData<T>;
    series: SankeySeries<T>;
}

export interface TooltipDataChunkWaterfall<T = MeaningfulAny> {
    data: WaterfallSeriesData<T>;
    series: WaterfallSeries<T>;
    subTotal?: number;
}

export interface TooltipDataChunkRadar<T = MeaningfulAny> {
    data: RadarSeriesData<T>;
    series: RadarSeries<T>;
    category?: RadarSeriesCategory;
    closest: boolean;
}

export interface TooltipDataChunkHeatmap<T = MeaningfulAny> {
    data: HeatmapSeriesData<T>;
    series: HeatmapSeries<T>;
}

export interface TooltipDataChunkFunnel<T = MeaningfulAny> {
    data: FunnelSeriesData<T>;
    series: {
        type: FunnelSeries['type'];
        id: string;
        name: string;
    };
}

export type TooltipDataChunk<T = MeaningfulAny> = (
    | TooltipDataChunkBarX<T>
    | TooltipDataChunkBarY<T>
    | TooltipDataChunkPie<T>
    | TooltipDataChunkScatter<T>
    | TooltipDataChunkLine<T>
    | TooltipDataChunkArea<T>
    | TooltipDataChunkTreemap<T>
    | TooltipDataChunkSankey<T>
    | TooltipDataChunkWaterfall<T>
    | TooltipDataChunkRadar<T>
    | TooltipDataChunkHeatmap<T>
    | TooltipDataChunkFunnel<T>
) & {closest?: boolean};

export interface ChartTooltipRendererArgs<T = MeaningfulAny> {
    hovered: TooltipDataChunk<T>[];
    /** Plot lines that intersect with the current pointer position. */
    hoveredPlotLines?: AxisPlotLine[];
    /** Plot bands that contain the current pointer position. */
    hoveredPlotBands?: AxisPlotBand[];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis;
    /** Formatting settings for tooltip header row (includes computed default). */
    headerFormat?: ValueFormat | CustomFormat;
}

export interface ChartTooltipTotalsAggregationArgs<
    T = MeaningfulAny,
> extends ChartTooltipRendererArgs<T> {}

export type ChartTooltipTotalsBuiltInAggregation =
    (typeof TOOLTIP_TOTALS_BUILT_IN_AGGREGATION)[keyof typeof TOOLTIP_TOTALS_BUILT_IN_AGGREGATION];

export type ChartTooltipTotalsAggregationValue = number | string | undefined;

export type ChartTooltipRowRendererArgs = {
    id: string;
    name: string;
    active?: boolean;
    color?: string;
    striped?: boolean;
    value: string | number | null | undefined;
    formattedValue?: string;
    hovered?: TooltipDataChunk<unknown>[];
    /**
     * CSS class name pre-built with active/striped modifiers.
     * Apply it to the root `<tr>` element of the returned row: `<tr className={className}>`.
     */
    className?: string;
};

export type ChartTooltipSortComparator<T = MeaningfulAny> = (
    a: TooltipDataChunk<T>,
    b: TooltipDataChunk<T>,
) => number;

export interface ChartTooltip<T = MeaningfulAny> {
    enabled?: boolean;
    /** Specifies the renderer for the tooltip. If returned null default tooltip renderer will be used. */
    renderer?: (args: ChartTooltipRendererArgs<T>) => React.ReactElement | null;
    /**
     * Defines the way a single data/series is displayed (corresponding to a separate selected point/ruler/shape on the chart).
     * It is useful in cases where you need to display additional information, but keep the general format of the tooltip.
     *
     * The returned React element must be a `<tr>` so that it fits into the table layout used by the tooltip.
     * Apply the `className` arg to the root `<tr>` to get the correct active/striped styles.
     *
     * If a string is returned, it will be parsed as HTML and rendered as-is — the string must be a complete
     * `<tr>...</tr>` element.
     * @example React element
     * ```tsx
     * rowRenderer: ({id, name, value, className}) => (
     *   <tr key={id} className={className}>
     *     <td>{name}</td>
     *     <td>{value}</td>
     *   </tr>
     * )
     * ```
     * @example Raw HTML string
     * ```ts
     * rowRenderer: ({name, value, className}) =>
     *   `<tr class="${className}"><td>${name}</td><td>${value}</td></tr>`
     * ```
     */
    rowRenderer?: ((args: ChartTooltipRowRendererArgs) => React.ReactElement | string) | null;
    pin?: {
        enabled?: boolean;
        modifierKey?: 'altKey' | 'metaKey';
    };
    /** Show tooltip at most once per every ```throttle``` milliseconds */
    throttle?: number;
    /** Formatting settings for tooltip value. */
    valueFormat?: ValueFormat;
    /** Formatting settings for tooltip header row. */
    headerFormat?: ValueFormat | CustomFormat;
    /** Settings for totals block in tooltip */
    totals?: {
        /**
         * The aggregation method for calculating totals.
         * It can be a built-in function (e.g., 'sum') or a custom function.
         * @default 'sum'
         */
        aggregation?:
            | ChartTooltipTotalsBuiltInAggregation
            | ((args: ChartTooltipTotalsAggregationArgs) => ChartTooltipTotalsAggregationValue);
        /**
         * Enables/disables the display of totals
         * @default false
         */
        enabled?: boolean;
        /** The label text for the totals. For built-in aggregations, the label can be omitted. */
        label?: string;
        /** Formatting settings for totals tooltip value. */
        valueFormat?: ValueFormat;
    };
    /**
     * Can be used for the UI automated test.
     * It is assigned as a data-qa attribute to an element.
     */
    qa?: string;
    /**
     * Controls the order of tooltip rows. Applied to `hovered` before rendering.
     * Use a custom comparator `(a, b) => number` for arbitrary ordering.
     */
    sorting?:
        | {
              /**
               * Determines what data should be used to sort by.
               * `'value'` uses the numeric value of each series point: `y` for most series
               * (line, area, bar-x, scatter, waterfall), `x` for bar-y, and `value` for
               * pie, radar, heatmap, treemap, funnel. `null` values are sorted as lowest.
               * @default undefined (sorting disabled)
               */
              key?: 'value' | undefined;
              /**
               * Sorting direction.
               * @default 'asc'
               */
              direction?: 'asc' | 'desc';
          }
        | ChartTooltipSortComparator<T>;
    /**
     * Per-unit date format strings for the default datetime tooltip header.
     * Merged with the library default; omitted keys keep defaults.
     * Ignored when `headerFormat` is set.
     */
    dateTimeLabelFormats?: DateTimeLabelFormats;
}
