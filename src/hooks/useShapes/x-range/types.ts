import type {TooltipDataChunkXRange} from '../../../types';
import type {PreparedXRangeSeries} from '../../useSeries/types';

export type PreparedXRangeData = Omit<TooltipDataChunkXRange, 'series'> & {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    series: PreparedXRangeSeries;
};
