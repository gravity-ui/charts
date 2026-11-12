import type {ShapeLabels} from '~core/shapes/types';
import type {TooltipDataChunkXRange} from '~core/types';

import type {LabelData} from '../../types';

import type {PreparedXRangeSeries} from './prepared-series';

export type PreparedXRangeData = Omit<TooltipDataChunkXRange, 'series'> & {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    series: PreparedXRangeSeries;
    svgLabels: LabelData[];
} & Pick<ShapeLabels, 'htmlLabels'>;

export interface XRangeTooltipChunk extends Omit<TooltipDataChunkXRange, 'series'> {
    series: PreparedXRangeSeries;
}
