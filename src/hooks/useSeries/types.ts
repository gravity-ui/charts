import type {
    DashStyle,
    LayoutAlgorithm,
    LineCap,
    SeriesOptionsDefaults,
    SymbolType,
} from '../../constants';
import type {
    AreaSeries,
    AreaSeriesData,
    BarXSeries,
    BarXSeriesData,
    BarYSeries,
    BarYSeriesData,
    BaseTextStyle,
    ChartLegend,
    ChartSeries,
    ChartSeriesRangeSliderOptions,
    ConnectorCurve,
    ConnectorShape,
    FunnelSeries,
    FunnelSeriesData,
    HeatmapSeries,
    HeatmapSeriesData,
    LineSeries,
    LineSeriesData,
    LineSeriesLineBaseStyle,
    PathLegendSymbolOptions,
    PieSeries,
    PieSeriesData,
    RadarSeries,
    RadarSeriesCategory,
    RadarSeriesData,
    RectLegendSymbolOptions,
    SankeySeries,
    SankeySeriesData,
    ScatterSeries,
    ScatterSeriesData,
    SymbolLegendSymbolOptions,
    TreemapSeries,
    TreemapSeriesData,
    ValueFormat,
    WaterfallSeries,
    WaterfallSeriesData,
} from '../../types';

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

export type PreparedLegendSymbol = RectLegendSymbol | PathLegendSymbol | SymbolLegendSymbol;

export type PreparedLegend = Required<Omit<ChartLegend, 'title' | 'colorScale'>> & {
    height: number;
    lineHeight: number;
    title: {
        enable: boolean;
        text: string;
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
};

export type OnLegendItemClick = (data: {id: string; name: string; metaKey: boolean}) => void;

export type LegendItem = {
    id: string;
    color: string;
    height: number;
    name: string;
    symbol: PreparedLegendSymbol;
    textWidth: number;
    dashStyle?: DashStyle;
    overflowed?: boolean;
    visible?: boolean;
};

export type LegendConfig = {
    offset: {
        left: number;
        top: number;
    };
    maxWidth: number;
    pagination?: {
        pages: {
            start: number;
            end: number;
        }[];
    };
};

export type PreparedHaloOptions = {
    enabled: boolean;
    opacity: number;
    size: number;
};

type BasePreparedSeries = {
    color: string;
    name: string;
    id: string;
    visible: boolean;
    legend: {
        groupId: string;
        itemText: string;
        enabled: boolean;
        symbol: PreparedLegendSymbol;
    };
    cursor: string | null;
    tooltip: ChartSeries['tooltip'];
};

type BasePreparedAxisRelatedSeries = {
    rangeSlider: Required<ChartSeriesRangeSliderOptions> & Partial<LineSeriesLineBaseStyle>;
};

export type PreparedScatterSeries = {
    type: ScatterSeries['type'];
    data: ScatterSeriesData[];
    marker: {
        states: {
            normal: {
                symbol: `${SymbolType}`;
                enabled: boolean;
                radius: number;
                borderWidth: number;
                borderColor: string;
            };
            hover: {
                enabled: boolean;
                radius: number;
                borderWidth: number;
                borderColor: string;
                halo: PreparedHaloOptions;
            };
        };
    };
    yAxis: number;
} & BasePreparedSeries &
    BasePreparedAxisRelatedSeries;

export type PreparedBarXSeries = {
    type: BarXSeries['type'];
    data: BarXSeriesData[];
    stackId: string;
    stacking: BarXSeries['stacking'];
    dataLabels: {
        enabled: boolean;
        inside: boolean;
        style: BaseTextStyle;
        allowOverlap: boolean;
        padding: number;
        html: boolean;
        format?: ValueFormat;
    };
    borderRadius: number;
    yAxis: number;
} & BasePreparedSeries &
    BasePreparedAxisRelatedSeries;

export type PreparedBarYSeries = {
    type: BarYSeries['type'];
    data: BarYSeriesData[];
    stackId: string;
    stacking: BarYSeries['stacking'];
    dataLabels: {
        padding: number;
        enabled: boolean;
        inside: boolean;
        style: BaseTextStyle;
        maxHeight: number;
        maxWidth: number;
        html: boolean;
        format?: ValueFormat;
        allowOverlap: boolean;
    };
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
} & BasePreparedSeries;

export type PreparedHeatmapSeries = {
    type: HeatmapSeries['type'];
    data: HeatmapSeriesData[];
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        html: boolean;
        format?: ValueFormat;
    };
    borderWidth: number;
    borderColor: string;
} & BasePreparedSeries;

export type PreparedPieSeries = {
    type: PieSeries['type'];
    data: PieSeriesData;
    value: PieSeriesData['value'];
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    center?: [string | number | null, string | number | null];
    radius?: string | number;
    innerRadius?: string | number;
    minRadius?: string | number;
    stackId: string;
    label?: PieSeriesData['label'];
    dataLabels: {
        enabled: boolean;
        padding: number;
        style: BaseTextStyle;
        allowOverlap: boolean;
        connectorPadding: number;
        connectorShape: ConnectorShape;
        distance: number;
        connectorCurve: ConnectorCurve;
        html: boolean;
        format?: ValueFormat;
    };
    states: {
        hover: {
            halo: PreparedHaloOptions;
        };
    };
    renderCustomShape?: PieSeries['renderCustomShape'];
    opacity: number | null;
} & BasePreparedSeries;

export type PreparedLineSeries = {
    type: LineSeries['type'];
    data: LineSeriesData[];
    lineWidth: number;
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        padding: number;
        allowOverlap: boolean;
        html: boolean;
        format?: ValueFormat;
    };
    marker: {
        states: {
            normal: {
                symbol: `${SymbolType}`;
                enabled: boolean;
                radius: number;
                borderWidth: number;
                borderColor: string;
            };
            hover: {
                enabled: boolean;
                radius: number;
                borderWidth: number;
                borderColor: string;
                halo: PreparedHaloOptions;
            };
        };
    };
    dashStyle: DashStyle;
    linecap: LineCap;
    opacity: number | null;
    yAxis: number;
} & BasePreparedSeries &
    BasePreparedAxisRelatedSeries;

export type PreparedAreaSeries = {
    type: AreaSeries['type'];
    data: AreaSeriesData[];
    stacking: AreaSeries['stacking'];
    stackId: string;
    lineWidth: number;
    opacity: number;
    nullMode: AreaSeries['nullMode'];
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        padding: number;
        allowOverlap: boolean;
        html: boolean;
        format?: ValueFormat;
    };
    marker: {
        states: {
            normal: {
                symbol: `${SymbolType}`;
                enabled: boolean;
                radius: number;
                borderWidth: number;
                borderColor: string;
            };
            hover: {
                enabled: boolean;
                radius: number;
                borderWidth: number;
                borderColor: string;
                halo: PreparedHaloOptions;
            };
        };
    };
    yAxis: number;
} & BasePreparedSeries &
    BasePreparedAxisRelatedSeries;

export type PreparedTreemapSeries = {
    type: TreemapSeries['type'];
    data: TreemapSeriesData[];
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        padding: number;
        allowOverlap: boolean;
        html: boolean;
        align: Required<Required<TreemapSeries>['dataLabels']>['align'];
        format?: ValueFormat;
    };
    layoutAlgorithm: `${LayoutAlgorithm}`;
    sorting: Required<TreemapSeries['sorting']>;
} & BasePreparedSeries &
    Required<Omit<TreemapSeries, keyof BasePreparedSeries>>;

export type PreparedWaterfallSeriesData = WaterfallSeriesData & {index: number};

export type PreparedWaterfallSeries = {
    type: WaterfallSeries['type'];
    data: PreparedWaterfallSeriesData[];
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        allowOverlap: boolean;
        padding: number;
        html: boolean;
        format?: ValueFormat;
    };
} & BasePreparedSeries;

export type PreparedSankeySeries = {
    type: SankeySeries['type'];
    data: SankeySeriesData[];
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        format?: ValueFormat;
    };
} & BasePreparedSeries &
    Omit<SankeySeries, keyof BasePreparedSeries>;

export type PreparedRadarSeries = {
    type: RadarSeries['type'];
    data: RadarSeriesData[];
    categories: RadarSeriesCategory[];
    borderColor: string;
    borderWidth: number;
    fillOpacity: number;
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        padding: number;
        allowOverlap: boolean;
        html: boolean;
        format?: ValueFormat;
    };
    marker: {
        states: {
            normal: {
                symbol: `${SymbolType}`;
                enabled: boolean;
                radius: number;
                borderWidth: number;
                borderColor: string;
            };
            hover: {
                enabled: boolean;
                radius: number;
                borderWidth: number;
                borderColor: string;
                halo: PreparedHaloOptions;
            };
        };
    };
} & BasePreparedSeries;

export type PreparedFunnelSeries = {
    type: FunnelSeries['type'];
    data: FunnelSeriesData;
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        html: boolean;
        format?: ValueFormat;
        align: Required<Required<FunnelSeries>['dataLabels']>['align'];
    };
    connectors: Required<FunnelSeries['connectors']>;
} & BasePreparedSeries;

export type PreparedSeries =
    | PreparedScatterSeries
    | PreparedBarXSeries
    | PreparedBarYSeries
    | PreparedPieSeries
    | PreparedLineSeries
    | PreparedAreaSeries
    | PreparedTreemapSeries
    | PreparedWaterfallSeries
    | PreparedSankeySeries
    | PreparedRadarSeries
    | PreparedHeatmapSeries
    | PreparedFunnelSeries;

export type PreparedZoomableSeries = Extract<
    PreparedSeries,
    {
        data: Array<unknown>;
    }
>;

export type PreparedSeriesOptions = SeriesOptionsDefaults;

export type StackedSeries = BarXSeries | AreaSeries | BarYSeries;
