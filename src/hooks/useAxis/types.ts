import type {DashStyle} from '../../constants';
import type {
    AxisCrosshair,
    AxisPlotBand,
    BaseTextStyle,
    ChartAxis,
    ChartAxisLabels,
    ChartAxisRangeSlider,
    ChartAxisTitleAlignment,
    ChartAxisTitleRotation,
    ChartAxisType,
    DeepRequired,
    MeaningfulAny,
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

export type PreparedAxisPlotBand = Required<AxisPlotBand> & {
    custom?: MeaningfulAny;
    label: {
        text: string;
        style: BaseTextStyle;
        padding: number;
        qa?: string;
    };
};
type PreparedAxisCrosshair = Required<AxisCrosshair>;

export type PreparedAxisPlotLine = {
    value: number;
    color: string;
    width: number;
    dashStyle: DashStyle;
    opacity: number;
    layerPlacement: PlotLayerPlacement;
    custom?: MeaningfulAny;
    label: {
        text: string;
        style: BaseTextStyle;
        padding: number;
        qa?: string;
    };
};

export type PreparedRangeSlider = DeepRequired<Omit<ChartAxisRangeSlider, 'defaultRange'>> & {
    defaultRange?: ChartAxisRangeSlider['defaultRange'];
};

export type PreparedAxisTickMarks = {
    enabled: boolean;
    length: number;
};

type PreparedBaseAxis = Omit<ChartAxis, 'type' | 'labels' | 'plotLines' | 'plotBands'> & {
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
        rotation: ChartAxisTitleRotation;
        maxWidth: number;
        html: boolean;
    };
    min?: number;
    grid: {
        enabled: boolean;
    };
    maxPadding: number;
    ticks: {
        pixelInterval?: number;
    };
    tickMarks: PreparedAxisTickMarks;
    plotIndex: number;
    plotLines: PreparedAxisPlotLine[];
    plotBands: PreparedAxisPlotBand[];
    crosshair: PreparedAxisCrosshair;
};

export type PreparedXAxis = PreparedBaseAxis & {
    rangeSlider: PreparedRangeSlider;
    position: 'top' | 'bottom';
};

export type PreparedYAxis = PreparedBaseAxis & {
    position: 'left' | 'right';
};

export type PreparedAxis = PreparedXAxis | PreparedYAxis;

export type AxesState = {
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
};
