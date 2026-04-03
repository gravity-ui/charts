import type {PreparedScatterSeries} from '~core/series/types';

import type {HtmlItem, ScatterSeriesData} from '../../../types';

type PointData = {
    x: number;
    y: number;
    opacity: number | null;
    data: ScatterSeriesData;
    series: PreparedScatterSeries;
    color: string;
};

export type MarkerData = {
    point: PointData;
    active: boolean;
    hovered: boolean;
    htmlElements: HtmlItem[];
    clipped: boolean;
};

export type PreparedScatterData = MarkerData;
