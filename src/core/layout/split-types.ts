import type {BaseTextStyle} from '../../types';

export type PreparedSplit = {
    plots: PreparedPlot[];
    gap: number;
};

export type PreparedPlot = {
    title: PreparedPlotTitle;
    top: number;
    height: number;
};

export type PreparedPlotTitle = {
    x: number;
    y: number;
    text: string;
    style?: Partial<BaseTextStyle>;
    height: number;
};
