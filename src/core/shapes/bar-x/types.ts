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
    /** Extra pixels at the value end to cover the grid stroke, without shifting label anchors. */
    valueEndPadding: number;
    borderWidth: number;
    opacity: number | null;
    series: PreparedBarXSeries;
    svgLabels: LabelData[];
    /** The outer segment of the positive or negative part of a stack. */
    isStackEnd: boolean;
    /** Whether the value end is above the segment's baseline in screen coordinates. */
    extendsUp: boolean;
} & SeriesShapeData;
