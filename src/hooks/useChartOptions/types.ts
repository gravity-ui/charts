import type {ChartBrush, ChartData, ChartMargin, ChartZoom, DeepRequired} from '../../types';

export type PreparedZoom = DeepRequired<Omit<ChartZoom, 'enabled' | 'brush'>> &
    DeepRequired<{brush: ChartBrush}>;

export type PreparedChart = {
    margin: ChartMargin;
    zoom: PreparedZoom | null;
};

export type PreparedTitle = ChartData['title'] & {
    height: number;
};

export type PreparedTooltip = ChartData['tooltip'] & {
    enabled: boolean;
    throttle: number;
};
