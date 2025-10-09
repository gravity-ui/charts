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
    label?: LabelData;
    htmlElements: HtmlItem[];
    isLastStackItem: boolean;
};
