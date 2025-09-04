import type {TDashStyle} from 'src/constants';

import type {
    AxisCrosshair,
    AxisPlotBand,
    BaseTextStyle,
    ChartAxis,
    ChartAxisLabels,
    ChartAxisTitleAlignment,
    ChartAxisType,
    ChartData,
    ChartMargin,
    PlotLayerPlacement,
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

export type PreparedAxisPlotBand = Required<AxisPlotBand>;
export type PreparedAxisCrosshair = Required<AxisCrosshair>;

export type PreparedAxisPlotLine = {
    value: number;
    color: string;
    width: number;
    dashStyle: TDashStyle;
    opacity: number;
    layerPlacement: PlotLayerPlacement;
};

export type PreparedAxis = Omit<ChartAxis, 'type' | 'labels' | 'plotLines' | 'plotBands'> & {
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
    plotLines: PreparedAxisPlotLine[];
    plotBands: PreparedAxisPlotBand[];
    crosshair: PreparedAxisCrosshair;
};

export type PreparedTitle = ChartData['title'] & {
    height: number;
};

export type PreparedTooltip = ChartData['tooltip'] & {
    enabled: boolean;
    throttle: number;
};

export type ChartOptions = {
    chart: PreparedChart;
    tooltip: PreparedTooltip;
    title?: PreparedTitle;
    colors: string[];
};
