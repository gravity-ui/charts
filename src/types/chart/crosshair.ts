import type {MeaningfulAny} from '../misc';

import type {AreaSeries, AreaSeriesData} from './area';
import type {BarXSeries, BarXSeriesData} from './bar-x';
import type {BarYSeries, BarYSeriesData} from './bar-y';
import type {LineSeries, LineSeriesData} from './line';
import type {ScatterSeries, ScatterSeriesData} from './scatter';
import type {WaterfallSeries, WaterfallSeriesData} from './waterfall';

export interface CrosshairDataChunkBarX<T = MeaningfulAny> {
    data: BarXSeriesData<T>;
    series: BarXSeries<T>;
}

export interface CrosshairDataChunkBarY<T = MeaningfulAny> {
    data: BarYSeriesData<T>;
    series: BarYSeries<T>;
}

export interface CrosshairDataChunkScatter<T = MeaningfulAny> {
    data: ScatterSeriesData<T>;
    series: ScatterSeries<T>;
}

export interface CrosshairDataChunkLine<T = MeaningfulAny> {
    data: LineSeriesData<T>;
    series: LineSeries<T>;
}

export interface CrosshairDataChunkArea<T = MeaningfulAny> {
    data: AreaSeriesData<T>;
    series: AreaSeries<T>;
}

export interface CrosshairDataChunkWaterfall<T = MeaningfulAny> {
    data: WaterfallSeriesData<T>;
    series: WaterfallSeries<T>;
}

export type CrosshairDataChunk<T = MeaningfulAny> = (
    | CrosshairDataChunkBarX<T>
    | CrosshairDataChunkBarY<T>
    | CrosshairDataChunkScatter<T>
    | CrosshairDataChunkLine<T>
    | CrosshairDataChunkArea<T>
    | CrosshairDataChunkWaterfall<T>
) & {closest?: boolean};
