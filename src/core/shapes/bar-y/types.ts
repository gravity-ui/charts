import type {LabelData, TooltipDataChunkBarY} from '../../../types';
import type {PreparedBarYSeries} from '../../series/types';
import type {SeriesShapeData} from '../types';

export type PreparedBarYData = Omit<TooltipDataChunkBarY, 'series'> & {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    borderWidth: number;
    borderColor: string;
    /**
     * Source x was null but `nullMode: 'zero'` substituted it with 0. The bar
     * is kept (zero-width) so the x-axis domain and stack/group baselines stay
     * consistent; the data label and tooltip row must skip it.
     */
    excluded?: boolean;
    opacity: number | null;
    series: PreparedBarYSeries;
    isLastStackItem: boolean;
};

export type BarYShapesArgs = {
    shapes: PreparedBarYData[];
    labels: LabelData[];
} & SeriesShapeData;
