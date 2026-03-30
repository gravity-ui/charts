import type {
    AxisCrosshair,
    AxisPlotBand,
    AxisPlotShape,
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
import type {DashStyle} from '../constants';

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
    color: string;
    custom?: MeaningfulAny;
    dashStyle: DashStyle;
    hoverThreshold: number;
    label: {
        padding: number;
        qa?: string;
        style: BaseTextStyle;
        text: string;
    };
    layerPlacement: PlotLayerPlacement;
    opacity: number;
    value: number;
    width: number;
};

export type PreparedAxisPlotShape = {
    custom?: MeaningfulAny;
    hitbox: {height: number; width: number; x: number; y: number};
    layerPlacement: PlotLayerPlacement;
    opacity: number;
    renderer: AxisPlotShape['renderer'];
    value: number | string;
    x: number;
    y: number;
};

export type PreparedRangeSlider = DeepRequired<Omit<ChartAxisRangeSlider, 'defaultRange'>> & {
    defaultRange?: ChartAxisRangeSlider['defaultRange'];
};

export type PreparedAxisTickMarks = {
    enabled: boolean;
    length: number;
};

type PreparedBaseAxis = Omit<
    ChartAxis,
    'type' | 'labels' | 'plotLines' | 'plotBands' | 'plotShapes'
> & {
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
    plotShapes: PreparedAxisPlotShape[];
    crosshair: PreparedAxisCrosshair;
};

export type PreparedXAxis = PreparedBaseAxis & {
    rangeSlider: PreparedRangeSlider;
    position: 'bottom';
};

export type PreparedYAxis = PreparedBaseAxis & {
    position: 'left' | 'right';
};

export type PreparedAxis = PreparedXAxis | PreparedYAxis;

export type AxesState = {
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
};
