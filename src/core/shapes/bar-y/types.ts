import type {PreparedBarYSeries} from '~core/series/types';

import type {HtmlItem, LabelData, TooltipDataChunkBarY} from '../../../types';

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
    htmlElements: HtmlItem[];
};
