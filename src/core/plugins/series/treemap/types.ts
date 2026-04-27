import type {HierarchyRectangularNode} from 'd3-hierarchy';

import type {HtmlItem, TreemapSeriesData} from '../../../../types';
import type {PreparedTreemapSeries} from '../../../series/types';

export type TreemapLabelData = {
    text: string;
    x: number;
    y: number;
    nodeData: TreemapSeriesData;
};

export type PreparedTreemapData = {
    type: 'treemap';
    labelData: TreemapLabelData[];
    leaves: HierarchyRectangularNode<TreemapSeriesData<any>>[];
    series: PreparedTreemapSeries;
    htmlElements: HtmlItem[];
};
