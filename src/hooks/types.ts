import type {TextRowData} from '../components/types';
import type {
    BaseTextStyle,
    ChartBrush,
    ChartData,
    ChartMargin,
    ChartTitle,
    ChartZoom,
    DeepRequired,
} from '../types';
import type {HtmlItem} from '../types/chart-ui';

export type PreparedZoom = DeepRequired<Omit<ChartZoom, 'enabled' | 'brush'>> &
    DeepRequired<{brush: ChartBrush}>;

export type PreparedChart = {
    margin: ChartMargin;
    zoom: PreparedZoom | null;
};

export type PreparedTitle = Omit<ChartTitle, 'margin' | 'style'> & {
    height: number;
    margin: number;
    style: BaseTextStyle;
    contentRows?: TextRowData[];
    htmlElements?: HtmlItem[];
};

export type PreparedTooltip = ChartData['tooltip'] & {
    enabled: boolean;
    throttle: number;
};
