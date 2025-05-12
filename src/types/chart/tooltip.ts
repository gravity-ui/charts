import type {MeaningfulAny} from '../misc';

import type {AreaSeries, AreaSeriesData} from './area';
import type {ChartXAxis, ChartYAxis} from './axis';
import type {BarXSeries, BarXSeriesData} from './bar-x';
import type {BarYSeries, BarYSeriesData} from './bar-y';
import type {ValueFormat} from './base';
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
}

export interface TooltipDataChunkRadar<T = MeaningfulAny> {
    data: RadarSeriesData<T>;
    series: RadarSeries<T>;
    category?: RadarSeriesCategory;
    closest: boolean;
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
) & {closest?: boolean};

export interface ChartTooltipRendererArgs<T = MeaningfulAny> {
    hovered: TooltipDataChunk<T>[];
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis;
}

export interface ChartTooltip<T = MeaningfulAny> {
    enabled?: boolean;
    /** Specifies the renderer for the tooltip. If returned null default tooltip renderer will be used. */
    renderer?: (args: ChartTooltipRendererArgs<T>) => React.ReactElement | null;
    pin?: {
        enabled?: boolean;
        modifierKey?: 'altKey' | 'metaKey';
    };
    /** Show tooltip at most once per every ```throttle``` milliseconds */
    throttle?: number;
    /** Formatting settings for tooltip value. */
    valueFormat?: ValueFormat;
}
