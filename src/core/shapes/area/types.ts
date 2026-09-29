import type {AreaSeriesData, LabelData} from '../../../types';
import type {AnnotationAnchor, PreparedAnnotation, PreparedAreaSeries} from '../../series/types';
import type {MarkerItem, SeriesShapeData} from '../types';

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

export type PreparedAreaData = {
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
} & SeriesShapeData;
