import type {BaseTextStyle} from '~core/types/chart/base';

export interface LabelData {
    text: string;
    x: number;
    y: number;
    style: BaseTextStyle;
    size: {width: number; height: number; hangingOffset?: number};
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
    /** Coordinate space for positioning: 'plot' uses the plot area origin, 'chart' uses the full chart origin. Defaults to 'plot'. */
    scope?: 'plot' | 'chart';
}

export interface ShapeDataWithLabels {
    svgLabels: LabelData[];
    htmlLabels: HtmlItem[];
}

export interface ShapeDataWithHtmlItems {
    htmlElements: HtmlItem[];
}

export type LegendConfig = {
    offset: {
        left: number;
        top: number;
    };
    pagination?: {
        pages: {
            start: number;
            end: number;
        }[];
    };
    maxWidth: number;
    height: number;
    width: number;
};
