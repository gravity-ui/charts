import type {ChartBrush, ChartMargin, ChartPlotPadding, ChartZoom, DeepRequired} from '../types';

export type PreparedZoom = DeepRequired<Omit<ChartZoom, 'enabled' | 'brush'>> &
    DeepRequired<{brush: ChartBrush}>;

export type PreparedChart = {
    margin: ChartMargin;
    plotPadding?: ChartPlotPadding;
    zoom: PreparedZoom | null;
};
