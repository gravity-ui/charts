import type {AnnotationAnchor, PreparedAnnotation} from '~core/series/types';
import type {GradientShapeData, MarkerItem, SeriesShapeData} from '~core/shapes/types';
import type {TooltipDataChunkArea} from '~core/types';

import type {AreaSeriesData, LabelData} from '../../types';

import type {PreparedAreaSeries} from './prepared-series';

export interface PointData {
    annotation?: PreparedAnnotation;
    color?: string;
    data: AreaSeriesData;
    fill?: string;
    percentage?: number;
    hiddenInLine?: boolean;
    series: PreparedAreaSeries;
    x: number;
    y: number | null;
    y0: number;
}

export type MarkerPointData = PointData & {
    y: number;
};

export interface PreparedAreaData extends SeriesShapeData, GradientShapeData {
    annotations: AnnotationAnchor[];
    id: string;
    points: PointData[];
    markers: MarkerItem[];
    color: string;
    opacity: number;
    width: number;
    series: PreparedAreaSeries;
    hovered: boolean;
    active: boolean;
    svgLabels: LabelData[];
}

export interface AreaTooltipChunk extends Omit<TooltipDataChunkArea, 'series'> {
    series: PreparedAreaSeries;
}
