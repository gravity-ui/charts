import type {HtmlItem, LabelData, TooltipDataChunkBarY} from '../../../../types';
import type {PreparedBarYSeries} from '../../../series/types';

export type PreparedBarYData = Omit<TooltipDataChunkBarY, 'series'> & {
    type: 'bar-y';
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
    htmlElements: HtmlItem[];
};
