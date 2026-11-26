import type {TooltipDataChunkWaterfall} from '~core/types';

import type {LabelData} from '../../types';

import type {PreparedWaterfallSeries, PreparedWaterfallSeriesData} from './prepared-series';

export interface WaterfallInterval {
    start: number;
    end: number;
    previousIndex: number | undefined;
}

export interface PreparedWaterfallData {
    x: number;
    y: number;
    width: number;
    height: number;
    /** Running balance in plot coordinates, before clipping the column. */
    endY: number;
    previousIndex: number | undefined;
    opacity: number | null;
    series: PreparedWaterfallSeries;
    data: PreparedWaterfallSeriesData;
    label?: LabelData;
    subTotal: number;
}

export interface WaterfallTooltipChunk extends Omit<TooltipDataChunkWaterfall, 'series'> {
    series: PreparedWaterfallSeries;
}
