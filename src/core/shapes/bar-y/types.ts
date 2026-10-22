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
    /** Resolved corner radius; zero for segments without rounded corners. */
    borderRadius: number;
    opacity: number;
    series: PreparedBarYSeries;
};

export type BarYShapesArgs = {
    shapes: PreparedBarYData[];
    labels: LabelData[];
} & SeriesShapeData;
