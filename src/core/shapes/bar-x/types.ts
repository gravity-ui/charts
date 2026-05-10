import type {LabelData, TooltipDataChunkBarX} from '../../../types';
import type {AnnotationAnchor, PreparedAnnotation, PreparedBarXSeries} from '../../series/types';
import type {SeriesShapeData} from '../types';

export type PreparedBarXData = Omit<TooltipDataChunkBarX, 'series'> & {
    annotation?: PreparedAnnotation;
    annotations: AnnotationAnchor[];
    /**
     * Source y was null but `nullMode: 'zero'` substituted it with 0. The bar
     * is kept (zero-height) so the y-axis domain and stack/group baselines
     * stay consistent; the data label and tooltip row must skip it.
     */
    excluded?: boolean;
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
