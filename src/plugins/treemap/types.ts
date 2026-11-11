import type {HierarchyRectangularNode} from 'd3-hierarchy';

import type {SeriesShapeData} from '~core/shapes/types';
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
    series: PreparedTreemapSeries;
} & SeriesShapeData;

export interface TreemapTooltipChunk extends Omit<TooltipDataChunkTreemap, 'series'> {
    series: PreparedTreemapSeries;
}
