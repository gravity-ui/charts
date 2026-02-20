import type {DashStyle} from 'src/constants';

import type {BaseTextStyle, HtmlItem, PlotLayerPlacement, PointPosition} from '../../types';
import type {TextRowData} from '../types';

export type AxisSvgLabelData = {
    x: number;
    y: number;
    angle: number;
    content: TextRowData[];
    title?: string;
    style: BaseTextStyle;
    size: {width: number; height: number};
};

export type AxisTickLine = {
    points: PointPosition[];
};

export type AxisTickData = {
    line: AxisTickLine | null;
    svgLabel: AxisSvgLabelData | null;
    htmlLabel: HtmlItem | null;
};

export type SvgAxisTitleData = {
    html: false;
    content: TextRowData[];
    style: BaseTextStyle;
    size: {width: number; height: number};
    x: number;
    y: number;
    rotate: number;
    offset: number;
};

export type HtmlAxisTitleData = {
    html: true;
    content: string;
    style: BaseTextStyle & React.CSSProperties;
    size: {width: number; height: number};
    x: number;
    y: number;
};

export type AxisPlotLineLabel = {
    text: string;
    style: BaseTextStyle;
    x: number;
    y: number;
    qa?: string;
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
    title: HtmlAxisTitleData | SvgAxisTitleData | null;
    domain: AxisDomainData | null;
    ticks: AxisTickData[];
    plotLines: AxisPlotLineData[];
    plotBands: AxisPlotBandData[];
};
