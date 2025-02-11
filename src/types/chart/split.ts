import type {BaseTextStyle} from './base';

export interface SplitPlotOptions {
    title?: {
        text: string;
        style?: Partial<BaseTextStyle>;
    };
}

export interface ChartSplit {
    enable: boolean;
    layout?: 'vertical';
    gap?: string | number;
    plots?: SplitPlotOptions[];
}
