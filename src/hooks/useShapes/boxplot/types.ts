import type {BoxplotSeriesData} from '../../../types';
import type {HtmlItem} from '../../../types/chart-ui';

export interface WhiskerLine {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface OutlierPoint {
    x: number;
    y: number;
    value: number;
}

export interface PreparedBoxplotData {
    htmlElements: HtmlItem[];
    id: string;
    seriesId: string;
    seriesName: string;
    color: string;
    x?: string | number;
    low: number;
    q1: number;
    median: number;
    q3: number;
    high: number;
    outliers?: number[];
    xPosition: number;
    yLow: number;
    yQ1: number;
    yMedian: number;
    yQ3: number;
    yHigh: number;
    boxWidth: number;
    boxHeight: number;
    whiskerWidth: number;
    whiskerTop: WhiskerLine;
    whiskerBottom: WhiskerLine;
    verticalLineTop: WhiskerLine;
    verticalLineBottom: WhiskerLine;
    outlierPoints: OutlierPoint[];
    outlierRadius: number;
    custom?: BoxplotSeriesData['custom'];
}
