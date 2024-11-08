import type {
    BaseTextStyle,
    ChartAxis,
    ChartAxisLabels,
    ChartAxisTitleAlignment,
    ChartAxisType,
    ChartData,
    ChartMargin,
} from '../../types';

type PreparedAxisLabels = Omit<ChartAxisLabels, 'enabled' | 'padding' | 'style' | 'autoRotation'> &
    Required<Pick<ChartAxisLabels, 'enabled' | 'padding' | 'margin' | 'rotation'>> & {
        style: BaseTextStyle;
        rotation: number;
        height: number;
        width: number;
        lineHeight: number;
        maxWidth: number;
    };

export type PreparedChart = {
    margin: ChartMargin;
};

export type PreparedAxis = Omit<ChartAxis, 'type' | 'labels'> & {
    type: ChartAxisType;
    labels: PreparedAxisLabels;
    title: {
        height: number;
        width: number;
        text: string;
        margin: number;
        style: BaseTextStyle;
        align: ChartAxisTitleAlignment;
        maxRowCount: number;
    };
    min?: number;
    grid: {
        enabled: boolean;
    };
    maxPadding: number;
    ticks: {
        pixelInterval?: number;
    };
    position: 'left' | 'right' | 'top' | 'bottom';
    plotIndex: number;
};

export type PreparedTitle = ChartData['title'] & {
    height: number;
};

export type PreparedTooltip = ChartData['tooltip'] & {
    enabled: boolean;
};

export type ChartOptions = {
    chart: PreparedChart;
    tooltip: PreparedTooltip;
    title?: PreparedTitle;
};
