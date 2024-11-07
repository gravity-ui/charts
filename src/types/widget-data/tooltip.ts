import type {AreaSeries, AreaSeriesData} from './area';
import type {BarXSeries, BarXSeriesData} from './bar-x';
import type {BarYSeries, BarYSeriesData} from './bar-y';
import type {LineSeries, LineSeriesData} from './line';
import type {PieSeries, PieSeriesData} from './pie';
import type {ScatterSeries, ScatterSeriesData} from './scatter';
import type {TreemapSeries, TreemapSeriesData} from './treemap';
import type {WaterfallSeries, WaterfallSeriesData} from './waterfall';

export type TooltipDataChunkBarX<T = any> = {
    data: BarXSeriesData<T>;
    series: BarXSeries<T>;
};

export type TooltipDataChunkBarY<T = any> = {
    data: BarYSeriesData<T>;
    series: BarYSeries<T>;
};

export type TooltipDataChunkPie<T = any> = {
    data: PieSeriesData<T>;
    series: {
        type: PieSeries['type'];
        id: string;
        name: string;
    };
};

export type TooltipDataChunkScatter<T = any> = {
    data: ScatterSeriesData<T>;
    series: {
        type: ScatterSeries['type'];
        id: string;
        name: string;
    };
};

export type TooltipDataChunkLine<T = any> = {
    data: LineSeriesData<T>;
    series: {
        type: LineSeries['type'];
        id: string;
        name: string;
    };
};

export type TooltipDataChunkArea<T = any> = {
    data: AreaSeriesData<T>;
    series: {
        type: AreaSeries['type'];
        id: string;
        name: string;
    };
};

export type TooltipDataChunkTreemap<T = any> = {
    data: TreemapSeriesData<T>;
    series: TreemapSeries<T>;
};

export type TooltipDataChunkWaterfall<T = any> = {
    data: WaterfallSeriesData<T>;
    series: WaterfallSeries<T>;
};

export type TooltipDataChunk<T = any> = (
    | TooltipDataChunkBarX<T>
    | TooltipDataChunkBarY<T>
    | TooltipDataChunkPie<T>
    | TooltipDataChunkScatter<T>
    | TooltipDataChunkLine<T>
    | TooltipDataChunkArea<T>
    | TooltipDataChunkTreemap<T>
    | TooltipDataChunkWaterfall<T>
) & {closest?: boolean};

export type ChartKitWidgetTooltip<T = any> = {
    enabled?: boolean;
    /** Specifies the renderer for the tooltip. If returned null default tooltip renderer will be used. */
    renderer?: (args: {hovered: TooltipDataChunk<T>[]}) => React.ReactElement | null;
};
