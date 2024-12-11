import type {MeaningfulAny} from '../misc';

import type {AreaSeries, AreaSeriesData} from './area';
import type {ChartXAxis, ChartYAxis} from './axis';
import type {BarXSeries, BarXSeriesData} from './bar-x';
import type {BarYSeries, BarYSeriesData} from './bar-y';
import type {LineSeries, LineSeriesData} from './line';
import type {PieSeries, PieSeriesData} from './pie';
import type {ScatterSeries, ScatterSeriesData} from './scatter';
import type {TreemapSeries, TreemapSeriesData} from './treemap';
import type {WaterfallSeries, WaterfallSeriesData} from './waterfall';

export type TooltipDataChunkBarX<T = MeaningfulAny> = {
    data: BarXSeriesData<T>;
    series: BarXSeries<T>;
};

export type TooltipDataChunkBarY<T = MeaningfulAny> = {
    data: BarYSeriesData<T>;
    series: BarYSeries<T>;
};

export type TooltipDataChunkPie<T = MeaningfulAny> = {
    data: PieSeriesData<T>;
    series: {
        type: PieSeries['type'];
        id: string;
        name: string;
    };
};

export type TooltipDataChunkScatter<T = MeaningfulAny> = {
    data: ScatterSeriesData<T>;
    series: {
        type: ScatterSeries['type'];
        id: string;
        name: string;
    };
};

export type TooltipDataChunkLine<T = MeaningfulAny> = {
    data: LineSeriesData<T>;
    series: {
        type: LineSeries['type'];
        id: string;
        name: string;
    };
};

export type TooltipDataChunkArea<T = MeaningfulAny> = {
    data: AreaSeriesData<T>;
    series: {
        type: AreaSeries['type'];
        id: string;
        name: string;
    };
};

export type TooltipDataChunkTreemap<T = MeaningfulAny> = {
    data: TreemapSeriesData<T>;
    series: TreemapSeries<T>;
};

export type TooltipDataChunkWaterfall<T = MeaningfulAny> = {
    data: WaterfallSeriesData<T>;
    series: WaterfallSeries<T>;
};

export type TooltipDataChunk<T = MeaningfulAny> = (
    | TooltipDataChunkBarX<T>
    | TooltipDataChunkBarY<T>
    | TooltipDataChunkPie<T>
    | TooltipDataChunkScatter<T>
    | TooltipDataChunkLine<T>
    | TooltipDataChunkArea<T>
    | TooltipDataChunkTreemap<T>
    | TooltipDataChunkWaterfall<T>
) & {closest?: boolean};

export type ChartTooltipRendererArgs<T = MeaningfulAny> = {
    hovered: TooltipDataChunk<T>[];
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis;
};

export type ChartTooltip<T = MeaningfulAny> = {
    enabled?: boolean;
    /** Specifies the renderer for the tooltip. If returned null default tooltip renderer will be used. */
    renderer?: (args: ChartTooltipRendererArgs<T>) => React.ReactElement | null;
    pin?: {
        enabled?: boolean;
        modifierKey?: 'altKey' | 'metaKey';
    };
};
