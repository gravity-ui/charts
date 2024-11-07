import type {
    BaseTextStyle,
    ChartKitWidgetAxis,
    ChartKitWidgetAxisLabels,
    ChartKitWidgetAxisTitleAlignment,
    ChartKitWidgetAxisType,
    ChartKitWidgetData,
    ChartMargin,
} from '../../types';

type PreparedAxisLabels = Omit<
    ChartKitWidgetAxisLabels,
    'enabled' | 'padding' | 'style' | 'autoRotation'
> &
    Required<Pick<ChartKitWidgetAxisLabels, 'enabled' | 'padding' | 'margin' | 'rotation'>> & {
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

export type PreparedAxis = Omit<ChartKitWidgetAxis, 'type' | 'labels'> & {
    type: ChartKitWidgetAxisType;
    labels: PreparedAxisLabels;
    title: {
        height: number;
        width: number;
        text: string;
        margin: number;
        style: BaseTextStyle;
        align: ChartKitWidgetAxisTitleAlignment;
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

export type PreparedTitle = ChartKitWidgetData['title'] & {
    height: number;
};

export type PreparedTooltip = ChartKitWidgetData['tooltip'] & {
    enabled: boolean;
};

export type ChartOptions = {
    chart: PreparedChart;
    tooltip: PreparedTooltip;
    title?: PreparedTitle;
};
