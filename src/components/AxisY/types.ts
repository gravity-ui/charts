import type {DashStyle} from 'src/constants';

import type {BaseTextStyle, HtmlItem, PlotLayerPlacement} from '../../types';

type AxisSvgLabelRowData = {
    text: string;
    x: number;
    y: number;
};

export type AxisSvgLabelData = {
    content: AxisSvgLabelRowData[];
    title?: string;
    style: BaseTextStyle;
    size: {width: number; height: number};
};

export type AxisTickLine = {
    points: [number, number][];
};

export type AxisTickData = {
    line: AxisTickLine | null;
    svgLabel: AxisSvgLabelData | null;
    htmlLabel: HtmlItem | null;
};

export type AxisTitleData = {
    content: string;
    style: BaseTextStyle;
    size: {width: number; height: number};
    x: number;
    y: number;
    rotate: number;
};

export type AxisPlotLineLabel = {
    text: string;
    style: BaseTextStyle;
    x: number;
    y: number;
};

export type AxisPlotLineData = {
    layerPlacement: PlotLayerPlacement;
    x: number;
    y: number;
    width: number;
    points: [number, number][];
    color: string;
    lineWidth: number;
    opacity: number;
    label: AxisPlotLineLabel | null;
    dashStyle: DashStyle;
};

export type AxisPlotBandData = {
    layerPlacement: PlotLayerPlacement;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    opacity: number;
    label: AxisPlotLineLabel | null;
};

export type AxisDomainData = {
    start: [number, number];
    end: [number, number];
    lineColor: string;
};

export type AxisYData = {
    id: string;
    title: AxisTitleData | null;
    domain: AxisDomainData;
    ticks: AxisTickData[];
    plotLines: AxisPlotLineData[];
    plotBands: AxisPlotBandData[];
    width: number;
    left: number;
};
