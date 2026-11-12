import type {TooltipDataChunkBarY} from '~core/types';

import type {HtmlItem, LabelData} from '../../types';

import type {PreparedBarYSeries} from './prepared-series';

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

export interface BarYShapesArgs {
    shapes: PreparedBarYData[];
    svgLabels: LabelData[];
    htmlLabels: (HtmlItem & {series: PreparedBarYSeries})[];
}

export interface BarYTooltipChunk extends Omit<TooltipDataChunkBarY, 'series'> {
    series: PreparedBarYSeries;
}
