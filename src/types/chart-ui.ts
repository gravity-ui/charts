import type {BaseTextStyle} from './chart/base';

export interface LabelData {
    text: string;
    x: number;
    y: number;
    style: BaseTextStyle;
    size: {width: number; height: number};
    textAnchor: 'start' | 'end' | 'middle';
    series: {id: string};
    active?: boolean;
}

export interface HtmlItem {
    x: number;
    y: number;
    content: string;
    size: {width: number; height: number};
    style?: BaseTextStyle & React.CSSProperties;
}

export interface ShapeDataWithHtmlItems {
    htmlElements: HtmlItem[];
}
