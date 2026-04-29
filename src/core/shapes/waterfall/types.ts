import type {LabelData, WaterfallSeriesData} from '../../../types';
import type {PreparedWaterfallSeries} from '../../series/types';
import type {SeriesShapeData} from '../types';

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
} & SeriesShapeData;
