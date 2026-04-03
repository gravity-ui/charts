import type {PreparedXRangeSeries} from '~core/series/types';

import type {HtmlItem, LabelData, TooltipDataChunkXRange} from '../../../types';

export type PreparedXRangeData = Omit<TooltipDataChunkXRange, 'series'> & {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    series: PreparedXRangeSeries;
    svgLabels: LabelData[];
    htmlLabels: HtmlItem[];
};
