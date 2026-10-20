import type {ChartBrush, ChartMargin, ChartZoom, DeepRequired} from '../types';

export type PreparedZoom = DeepRequired<Omit<ChartZoom, 'enabled' | 'brush'>> &
    DeepRequired<{brush: ChartBrush}>;

export type PreparedChart = {
    margin: ChartMargin;
    zoom: PreparedZoom | null;
};
