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
    BoxplotSeries,
    BoxplotSeriesData,
    ChartLegend,
    ConnectorCurve,
    ConnectorShape,
    LineSeries,
    LineSeriesData,
    PathLegendSymbolOptions,
    PieSeries,
    PieSeriesData,
    RectLegendSymbolOptions,
    ScatterSeries,
    ScatterSeriesData,
    SymbolLegendSymbolOptions,
    TreemapSeries,
    TreemapSeriesData,
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
    };
    colorScale: {
        colors: string[];
        domain: number[];
        stops: number[];
    };
};

export type OnLegendItemClick = (data: {name: string; metaKey: boolean}) => void;

export type LegendItem = {
    color: string;
    name: string;
    symbol: PreparedLegendSymbol;
    textWidth: number;
    visible?: boolean;
    dashStyle?: DashStyle;
};

export type LegendConfig = {
    offset: {
        left: number;
        top: number;
    };
    pagination?: {
        limit: number;
        maxPage: number;
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
        enabled: boolean;
        symbol: PreparedLegendSymbol;
    };
    cursor: string | null;
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
} & BasePreparedSeries;

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
    };
    borderRadius: number;
    yAxis: number;
} & BasePreparedSeries;

export type PreparedBarYSeries = {
    type: BarYSeries['type'];
    data: BarYSeriesData[];
    stackId: string;
    stacking: BarYSeries['stacking'];
    dataLabels: {
        enabled: boolean;
        inside: boolean;
        style: BaseTextStyle;
        maxHeight: number;
        maxWidth: number;
        html: boolean;
    };
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
} & BasePreparedSeries;

export type PreparedAreaSeries = {
    type: AreaSeries['type'];
    data: AreaSeriesData[];
    stacking: AreaSeries['stacking'];
    stackId: string;
    lineWidth: number;
    opacity: number;
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        padding: number;
        allowOverlap: boolean;
        html: boolean;
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
} & BasePreparedSeries;

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
    };
    layoutAlgorithm: `${LayoutAlgorithm}`;
} & BasePreparedSeries &
    Omit<TreemapSeries, keyof BasePreparedSeries>;

export type PreparedWaterfallSeries = {
    type: WaterfallSeries['type'];
    data: WaterfallSeriesData[];
    dataLabels: {
        enabled: boolean;
        style: BaseTextStyle;
        allowOverlap: boolean;
        padding: number;
        html: boolean;
    };
    positiveColor: string;
    negativeColor: string;
} & BasePreparedSeries;

export type PreparedBoxplotSeries = {
    type: BoxplotSeries['type'];
    data: BoxplotSeriesData[];
    boxWidth: number;
    whiskerWidth: number;
    showOutliers: boolean;
    outlierRadius: number;
    yAxis: number;
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
    | PreparedBoxplotSeries;

export type PreparedSeriesOptions = SeriesOptionsDefaults;

export type StackedSeries = BarXSeries | AreaSeries | BarYSeries;
