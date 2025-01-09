import type {BaseTextStyle} from './chart/base';

export type LabelData = {
    text: string;
    x: number;
    y: number;
    style: BaseTextStyle;
    size: {width: number; height: number};
    textAnchor: 'start' | 'end' | 'middle';
    series: {id: string};
    active?: boolean;
};

export type HtmlItem = {
    x: number;
    y: number;
    content: string;
    size: {width: number; height: number};
};

export type ShapeDataWithHtmlItems = {
    htmlElements: HtmlItem[];
};
