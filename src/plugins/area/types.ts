import type {AnnotationAnchor, PreparedAnnotation, PreparedAreaSeries} from '~core/series/types';
import type {BandColumn} from '~core/shapes/band';
import type {GradientShapeData, MarkerItem, SeriesShapeData} from '~core/shapes/types';

import type {AreaSeriesData, LabelData} from '../../types';

export interface AreaGeometry {
    columns: BandColumn[];
    linePath: string | null;
    areaPath: string | null;
}

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
    /** Resolved contribution before cumulative projection, including percent normalization. */
    stackValue?: number;
}

export type MarkerPointData = PointData & {
    y: number;
};

export interface PreparedAreaData extends SeriesShapeData, GradientShapeData {
    annotations: AnnotationAnchor[];
    id: string;
    points: PointData[];
    geometry?: AreaGeometry;
    markers: MarkerItem[];
    color: string;
    opacity: number;
    width: number;
    series: PreparedAreaSeries;
    hovered: boolean;
    active: boolean;
    svgLabels: LabelData[];
}
