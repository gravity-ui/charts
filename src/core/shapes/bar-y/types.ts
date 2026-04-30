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
    opacity: number | null;
    series: PreparedBarYSeries;
    isLastStackItem: boolean;
};

export type BarYShapesArgs = {
    shapes: PreparedBarYData[];
    labels: LabelData[];
} & SeriesShapeData;
