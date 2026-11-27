import type {HierarchyRectangularNode} from 'd3-hierarchy';

import type {ShapeLabels} from '~core/shapes/types';
import type {TooltipDataChunkTreemap} from '~core/types';

import type {TreemapSeriesData} from '../../types';

import type {PreparedTreemapSeries} from './prepared-series';

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
} & Pick<ShapeLabels, 'htmlLabels'>;

export interface TreemapTooltipChunk extends Omit<TooltipDataChunkTreemap, 'series'> {
    series: PreparedTreemapSeries;
}
