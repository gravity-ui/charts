import type React from 'react';

import type {DashStyle} from '../../constants';
import type {
    AxisCrosshair,
    AxisPlotBand,
    BaseTextStyle,
    ChartAxis,
    ChartAxisLabels,
    ChartAxisRangeSlider,
    ChartAxisTitleAlignment,
    ChartAxisType,
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

export type PreparedAxisPlotBand = Required<AxisPlotBand> & {
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
        rotation: number;
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
        // TODO: move?
        dataCount?: number;
    };
    position: 'left' | 'right' | 'top' | 'bottom';
    plotIndex: number;
    plotLines: PreparedAxisPlotLine[];
    plotBands: PreparedAxisPlotBand[];
    crosshair: PreparedAxisCrosshair;
};

export type PreparedXAxis = PreparedBaseAxis & {
    rangeSlider: PreparedRangeSlider;
};

export type PreparedYAxis = PreparedBaseAxis;

export type PreparedAxis = PreparedXAxis | PreparedYAxis;

export type AxesState = {
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
};

export type SetAxes = React.Dispatch<React.SetStateAction<AxesState>>;
