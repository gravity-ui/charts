import type {HtmlItem, LabelData, TooltipDataChunkBarX} from '../../../types';
import type {PreparedBarXSeries} from '../../useSeries/types';

export type PreparedBarXData = Omit<TooltipDataChunkBarX, 'series'> & {
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number | null;
    series: PreparedBarXSeries;
    label?: LabelData;
    htmlElements: HtmlItem[];
    isLastStackItem: boolean;
};
