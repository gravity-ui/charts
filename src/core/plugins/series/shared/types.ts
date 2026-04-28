import type {Dispatch} from 'd3-dispatch';

import type {HtmlItem} from '../../../../types';
import type {PreparedSeriesOptions} from '../../../series/types';

export interface PreparedSeriesDataItem {
    type: string;
}

export interface ShapeRef {
    key: string;
    className?: string;
    withClipPath?: boolean;
}

export interface ShapeRenderArgs {
    nodes: Record<string, SVGGElement>;
    preparedData: unknown;
    seriesOptions: PreparedSeriesOptions;
    boundsWidth: number;
    boundsHeight: number;
    dispatcher?: Dispatch<object>;
}

export interface ShapeConfig {
    refs: ShapeRef[];
    render(args: ShapeRenderArgs): () => void;
    getHtmlElements(preparedData: unknown): HtmlItem[];
}
