import type {GradientShapeData, SeriesShapeData} from '~core/shapes/types';
import type {TooltipDataChunkAreaRange} from '~core/types';

import type {AreaRangeSeriesData, LabelData} from '../../types';

import type {PreparedAreaRangeSeries} from './prepared-series';

export interface AreaRangePointData {
    color?: string;
    data: AreaRangeSeriesData;
    fill?: string;
    hiddenInLine?: boolean;
    hiddenInTooltip?: boolean;
    y0: number | null;
    y1: number | null;
    series: PreparedAreaRangeSeries;
    x: number;
    y: number | null;
}

export interface PreparedAreaRangeData
    extends Omit<SeriesShapeData, 'annotations'>, GradientShapeData {
    active: boolean;
    color: string;
    hovered: boolean;
    id: string;
    opacity: number;
    points: AreaRangePointData[];
    series: PreparedAreaRangeSeries;
    svgLabels: LabelData[];
    width: number;
}

export interface AreaRangeTooltipChunk extends Omit<TooltipDataChunkAreaRange, 'series'> {
    series: PreparedAreaRangeSeries;
}
