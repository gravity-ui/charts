import type {LabelData, TooltipDataChunkBarX} from '../../../types';
import type {AnnotationAnchor, PreparedAnnotation, PreparedBarXSeries} from '../../series/types';
import type {SeriesShapeData} from '../types';

export type PreparedBarXData = Omit<TooltipDataChunkBarX, 'series'> & {
    annotation?: PreparedAnnotation;
    annotations: AnnotationAnchor[];
    x: number;
    y: number;
    width: number;
    height: number;
    borderWidth: number;
    opacity: number | null;
    series: PreparedBarXSeries;
    svgLabels: LabelData[];
    isLastStackItem: boolean;
    /** Whether the value end is above the segment's baseline in screen coordinates. */
    extendsUp: boolean;
} & SeriesShapeData;
