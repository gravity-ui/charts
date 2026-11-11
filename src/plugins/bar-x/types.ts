import type {AnnotationAnchor, PreparedAnnotation} from '~core/series/types';
import type {SeriesShapeData} from '~core/shapes/types';
import type {TooltipDataChunkBarX} from '~core/types';

import type {LabelData} from '../../types';

import type {PreparedBarXSeries} from './prepared-series';

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
    opacity: number;
    series: PreparedBarXSeries;
    svgLabels: LabelData[];
    /** The outer segment of the positive or negative part of a stack. */
    isStackEnd: boolean;
    /** Whether the value end is above the segment's baseline in screen coordinates. */
    extendsUp: boolean;
} & SeriesShapeData;

export interface BarXTooltipChunk extends Omit<TooltipDataChunkBarX, 'series'> {
    series: PreparedBarXSeries;
}
