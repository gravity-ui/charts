import type {TextRowData} from '../components/types';
import type {
    ChartBrush,
    ChartData,
    ChartMargin,
    ChartTitle,
    ChartZoom,
    DeepRequired,
} from '../types';

export type PreparedZoom = DeepRequired<Omit<ChartZoom, 'enabled' | 'brush'>> &
    DeepRequired<{brush: ChartBrush}>;

export type PreparedChart = {
    margin: ChartMargin;
    zoom: PreparedZoom | null;
};

export type PreparedTitle = Omit<ChartTitle, 'margin'> & {
    height: number;
    margin: number;
    contentRows: TextRowData[];
};

export type PreparedTooltip = ChartData['tooltip'] & {
    enabled: boolean;
    throttle: number;
};
