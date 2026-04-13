import type {TextRowData} from '../components/types';
import type {BaseTextStyle, ChartData, ChartTitle} from '../types';
import type {HtmlItem} from '../types/chart-ui';

export type {PreparedChart, PreparedZoom} from '~core/chart/types';

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
