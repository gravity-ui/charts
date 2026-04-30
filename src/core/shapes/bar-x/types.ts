import type {LabelData, TooltipDataChunkBarX} from '../../../types';
import type {PreparedAnnotation, PreparedBarXSeries} from '../../series/types';
import type {SeriesShapeData} from '../types';

export type PreparedBarXData = Omit<TooltipDataChunkBarX, 'series'> & {
    annotation?: PreparedAnnotation;
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number | null;
    series: PreparedBarXSeries;
    svgLabels: LabelData[];
    isLastStackItem: boolean;
    /**
     * the utility field for storing the original height (for recalculations, etc.)
     * should not be used for displaying
     */
    _height: number;
} & SeriesShapeData;
