import type {BaseTextStyle} from './base';

export type SplitPlotOptions = {
    title?: {
        text: string;
        style?: Partial<BaseTextStyle>;
    };
};

export type ChartSplit = {
    enable: boolean;
    layout?: 'vertical';
    gap?: string | number;
    plots?: SplitPlotOptions[];
};
