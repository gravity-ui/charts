import type {HtmlItem, LabelData, TooltipDataChunkBarX} from '../../../types';
import type {PreparedBarXSeries} from '../../useSeries/types';

export type PreparedBarXData = Omit<TooltipDataChunkBarX, 'series'> & {
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number | null;
    series: PreparedBarXSeries;
    svgLabels: LabelData[];
    htmlLabels: HtmlItem[];
    isLastStackItem: boolean;
    /**
     * the utility field for storing the original height (for recalculations, etc.)
     * should not be used for displaying
     */
    _height: number;
};
