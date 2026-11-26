import type {ShapeLabels} from '~core/shapes/types';
import type {TooltipDataChunkWaterfall} from '~core/types';

import type {LabelData, WaterfallSeriesData} from '../../types';

import type {PreparedWaterfallSeries} from './prepared-series';

export type PreparedWaterfallData = {
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number | null;
    series: PreparedWaterfallSeries;
    data: WaterfallSeriesData;
    label?: LabelData;
    subTotal: number;
} & Pick<ShapeLabels, 'htmlLabels'>;

export interface WaterfallTooltipChunk extends Omit<TooltipDataChunkWaterfall, 'series'> {
    series: PreparedWaterfallSeries;
}
