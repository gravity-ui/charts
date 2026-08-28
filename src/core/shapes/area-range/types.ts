import type {AreaRangeSeriesData, LabelData} from '../../../types';
import type {PreparedAreaRangeSeries} from '../../series/types';
import type {SeriesShapeData} from '../types';

export interface AreaRangePointData {
    color?: string;
    data: AreaRangeSeriesData;
    fill?: string;
    y0: number | null;
    y1: number | null;
    series: PreparedAreaRangeSeries;
    x: number;
    y: number | null;
}

export type PreparedAreaRangeData = {
    active: boolean;
    color: string;
    hovered: boolean;
    id: string;
    opacity: number;
    points: AreaRangePointData[];
    series: PreparedAreaRangeSeries;
    svgLabels: LabelData[];
    width: number;
} & SeriesShapeData;
