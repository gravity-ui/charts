import type {DashStyle} from '../../constants';
import type {
    AxisCrosshair,
    AxisPlotBand,
    BaseTextStyle,
    ChartAxis,
    ChartAxisLabels,
    ChartAxisTitleAlignment,
    ChartAxisType,
    ChartBrush,
    ChartData,
    ChartMargin,
    ChartRangeSlider,
    ChartZoom,
    DeepRequired,
    PlotLayerPlacement,
} from '../../types';

type PreparedAxisLabels = Omit<ChartAxisLabels, 'enabled' | 'padding' | 'style' | 'autoRotation'> &
    Required<Pick<ChartAxisLabels, 'enabled' | 'padding' | 'margin' | 'rotation' | 'html'>> & {
        style: BaseTextStyle;
        rotation: number;
        height: number;
        width: number;
        lineHeight: number;
        maxWidth: number;
    };

export type PreparedZoom = DeepRequired<Omit<ChartZoom, 'enabled' | 'brush'>> &
    DeepRequired<{brush: ChartBrush}>;

export type PreparedChart = {
    margin: ChartMargin;
    zoom: PreparedZoom | null;
};

export type PreparedAxisPlotBand = Required<AxisPlotBand> & {
    label: {
        text: string;
        style: BaseTextStyle;
        padding: number;
    };
};
export type PreparedAxisCrosshair = Required<AxisCrosshair>;

export type PreparedAxisPlotLine = {
    value: number;
    color: string;
    width: number;
    dashStyle: DashStyle;
    opacity: number;
    layerPlacement: PlotLayerPlacement;
    label: {
        text: string;
        style: BaseTextStyle;
        padding: number;
    };
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

export type PreparedRangeSlider = DeepRequired<ChartRangeSlider>;
