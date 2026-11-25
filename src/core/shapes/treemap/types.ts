import type {HierarchyRectangularNode} from 'd3-hierarchy';

import type {TreemapSeriesData} from '../../../types';
import type {PreparedTreemapSeries} from '../../series/types';
import type {SeriesShapeData} from '../types';

export type TreemapLabelData = {
    text: string;
    x: number;
    y: number;
    nodeData: TreemapSeriesData;
};

export type PreparedTreemapData = {
    labelData: TreemapLabelData[];
    leaves: HierarchyRectangularNode<TreemapSeriesData<any>>[];
    /** Resolved fill of each leaf: point color, then level color, then series color. */
    colors: Map<HierarchyRectangularNode<TreemapSeriesData>, string>;
    series: PreparedTreemapSeries;
} & SeriesShapeData;
