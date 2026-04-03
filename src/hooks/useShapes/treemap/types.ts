import type {HierarchyRectangularNode} from 'd3-hierarchy';

import type {PreparedTreemapSeries} from '~core/series/types';

import type {HtmlItem, TreemapSeriesData} from '../../../types';

export type TreemapLabelData = {
    text: string;
    x: number;
    y: number;
    nodeData: TreemapSeriesData;
};

export type PreparedTreemapData = {
    labelData: TreemapLabelData[];
    leaves: HierarchyRectangularNode<TreemapSeriesData<any>>[];
    series: PreparedTreemapSeries;
    htmlElements: HtmlItem[];
};
