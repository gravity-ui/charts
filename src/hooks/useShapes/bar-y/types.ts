import type {HtmlItem, LabelData, TooltipDataChunkBarX} from '../../../types';
import type {PreparedBarYSeries} from '../../useSeries/types';

export type PreparedBarYData = Omit<TooltipDataChunkBarX, 'series'> & {
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
