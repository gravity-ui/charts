import type {HierarchyRectangularNode} from 'd3';

import type {HtmlItem, TreemapSeriesData} from '../../../types';
import type {PreparedTreemapSeries} from '../../useSeries/types';

export type TreemapLabelData = {
    text: string;
    x: number;
    y: number;
    width: number;
    nodeData: TreemapSeriesData;
};

export type PreparedTreemapData = {
    labelData: TreemapLabelData[];
    leaves: HierarchyRectangularNode<TreemapSeriesData<any>>[];
    series: PreparedTreemapSeries;
    htmlElements: HtmlItem[];
};
