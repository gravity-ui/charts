import type {LabelData, TooltipDataChunkXRange} from '../../../types';
import type {PreparedXRangeSeries} from '../../series/types';
import type {SeriesShapeData} from '../types';

export type PreparedXRangeData = Omit<TooltipDataChunkXRange, 'series'> & {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    series: PreparedXRangeSeries;
    svgLabels: LabelData[];
} & SeriesShapeData;
