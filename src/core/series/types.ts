import type {PreparedAreaSeries} from '../../plugins/area/prepared-series';
import type {PreparedAreaRangeSeries} from '../../plugins/area-range/prepared-series';
import type {PreparedBarXSeries} from '../../plugins/bar-x/prepared-series';
import type {PreparedBarYSeries} from '../../plugins/bar-y/prepared-series';
import type {PreparedFunnelSeries} from '../../plugins/funnel/prepared-series';
import type {PreparedHeatmapSeries} from '../../plugins/heatmap/prepared-series';
import type {PreparedLineSeries} from '../../plugins/line/prepared-series';
import type {PreparedPieSeries} from '../../plugins/pie/prepared-series';
import type {PreparedRadarSeries} from '../../plugins/radar/prepared-series';
import type {PreparedSankeySeries} from '../../plugins/sankey/prepared-series';
import type {PreparedScatterSeries} from '../../plugins/scatter/prepared-series';
import type {PreparedTreemapSeries} from '../../plugins/treemap/prepared-series';
import type {PreparedWaterfallSeries} from '../../plugins/waterfall/prepared-series';
import type {PreparedXRangeSeries} from '../../plugins/x-range/prepared-series';
import type {
    AreaSeries,
    BarXSeries,
    BarYSeries,
    BaseSeries,
    BaseSeriesLegend,
    BaseTextStyle,
    ChartLegend,
    ChartSeriesRangeSliderOptions,
    LineSeriesLineBaseStyle,
    MeaningfulAny,
    PathLegendSymbolOptions,
    RectLegendSymbolOptions,
    SymbolLegendSymbolOptions,
} from '../../types';
import type {DashStyle, SeriesOptionsDefaults, SymbolType} from '../constants';

export type {PreparedAreaRangeSeries} from '../../plugins/area-range/prepared-series';
export type {PreparedAreaSeries} from '../../plugins/area/prepared-series';
export type {PreparedBarXSeries} from '../../plugins/bar-x/prepared-series';
export type {PreparedBarYSeries} from '../../plugins/bar-y/prepared-series';
export type {PreparedFunnelSeries} from '../../plugins/funnel/prepared-series';
export type {PreparedHeatmapSeries} from '../../plugins/heatmap/prepared-series';
export type {PreparedLineSeries} from '../../plugins/line/prepared-series';
export type {PreparedPieSeries} from '../../plugins/pie/prepared-series';
export type {PreparedRadarSeries} from '../../plugins/radar/prepared-series';
export type {PreparedSankeySeries} from '../../plugins/sankey/prepared-series';
export type {PreparedScatterSeries} from '../../plugins/scatter/prepared-series';
export type {PreparedTreemapSeries} from '../../plugins/treemap/prepared-series';
export type {
    PreparedWaterfallSeries,
    PreparedWaterfallSeriesData,
} from '../../plugins/waterfall/prepared-series';
export type {PreparedXRangeSeries} from '../../plugins/x-range/prepared-series';

export type PreparedAnnotation = {
    label: {
        size: {height: number; width: number};
        style: BaseTextStyle;
        text: string;
    };
    popup: {
        backgroundColor: string;
        borderRadius: number;
        offset: number;
        padding: [number, number];
    };
};

export type AnnotationAnchor = {
    annotation: PreparedAnnotation;
    x: number;
    y: number;
};

export type RectLegendSymbol = {
    shape: 'rect';
} & Required<RectLegendSymbolOptions>;

export type PathLegendSymbol = {
    shape: 'path';
    strokeWidth: number;
} & Required<PathLegendSymbolOptions>;

export type SymbolLegendSymbol = {
    shape: 'symbol';
    symbolType: `${SymbolType}`;
} & Required<SymbolLegendSymbolOptions>;

export type PreparedLegendSymbol = (RectLegendSymbol | PathLegendSymbol | SymbolLegendSymbol) & {
    bboxWidth: number;
    opacity?: number;
};

export interface PreparedLegendRowItem {
    symbolLeft: number;
    textLeft: number;
}

export interface PreparedLegendRow {
    top: number;
    left: number;
    height: number;
    width: number;
    items: PreparedLegendRowItem[];
}

export interface PreparedLegendOptions extends Required<
    Omit<ChartLegend, 'title' | 'colorScale' | 'width' | 'maxWidth' | 'rowGap' | 'events'>
> {
    width?: ChartLegend['width'];
    maxWidth?: ChartLegend['maxWidth'];
    /** Validated nonnegative pixel spacing between discrete rows. */
    resolvedRowGap: number;
    events: ChartLegend['events'];
    /** Pixel width, constrained to the available layout space for discrete legends and percentage widths. */
    resolvedWidth: number;
    /** Nonnegative chart width after chart margins, before legend and axis space is deducted. */
    availableWidth: number;
    hangingOffset: number;
    lineHeight: number;
    multilineItems: boolean;
    title: {
        enable: boolean;
        hangingOffset: number;
        text: string;
        resolvedText: string;
        width: number;
        resolvedWidth: number;
        margin: number;
        style: BaseTextStyle;
        height: number;
        align: Required<Required<ChartLegend>['title']>['align'];
    };
    ticks: {
        labelsMargin: number;
        labelsLineHeight: number;
        style: BaseTextStyle;
    };
    colorScale: {
        colors: string[];
        domain: number[];
        stops: number[];
    };
}

export interface PreparedLegend extends PreparedLegendOptions {
    height: number;
    rows: PreparedLegendRow[];
    /** Clip discrete content and fit pagination controls to the legend viewport. */
    clipContent: boolean;
    /** Space reserved above discrete rows; zero for the legacy title layout. */
    titleHeight: number;
}

export type OnLegendItemClick = (data: {id: string; name: string; metaKey: boolean}) => void;

export interface LegendItem {
    id: string;
    color: string;
    height: number;
    name: string;
    text: string;
    symbol: PreparedLegendSymbol;
    textWidth: number;
    /** Width available for the label before its visible rows are measured. */
    textMaxWidth?: number;
    textRows?: string[];
    dashStyle?: DashStyle;
    overflowed?: boolean;
    /** Whether SVG label preparation removed any text, independent of row layout. */
    textTruncated?: boolean;
    visible?: boolean;
}

export type PreparedHaloOptions = {
    enabled: boolean;
    opacity: number;
    size: number;
};

export type BasePreparedSeries<TTooltip = BaseSeries['tooltip']> = {
    color: string;
    name: string;
    id: string;
    visible: boolean;
    legend: {
        color?: string;
        groupId: string;
        /** Original series or point legend config, before defaults and ID generation. */
        source?: Readonly<BaseSeriesLegend>;
        itemText: string;
        enabled: boolean;
        symbol: PreparedLegendSymbol;
    };
    cursor: string | null;
    tooltip: TTooltip;
    custom: MeaningfulAny;
};

export type BasePreparedAxisRelatedSeries = {
    rangeSlider: Required<ChartSeriesRangeSliderOptions> & Partial<LineSeriesLineBaseStyle>;
};

export type PreparedSeries =
    | PreparedScatterSeries
    | PreparedBarXSeries
    | PreparedBarYSeries
    | PreparedPieSeries
    | PreparedLineSeries
    | PreparedAreaSeries
    | PreparedAreaRangeSeries
    | PreparedTreemapSeries
    | PreparedWaterfallSeries
    | PreparedSankeySeries
    | PreparedRadarSeries
    | PreparedHeatmapSeries
    | PreparedFunnelSeries
    | PreparedXRangeSeries;

export type PreparedZoomableSeries = Extract<
    PreparedSeries,
    {
        data: Array<unknown>;
    }
>;

export type PreparedSeriesOptions = SeriesOptionsDefaults;

export type StackedSeries = BarXSeries | AreaSeries | BarYSeries;
