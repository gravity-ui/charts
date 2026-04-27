import type {ScaleOrdinal} from 'd3-scale';

import type {
    ChartSeries,
    ChartSeriesOptions,
    ShapeDataWithLabels,
    TooltipDataChunk,
} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import type {ChartScale} from '../../scales/types';
import type {PreparedLegend, PreparedSeries, PreparedSeriesOptions} from '../../series/types';
import type {ShapePoint} from '../../utils/tooltip-helpers';
import type {ZoomState} from '../../zoom/types';

import type {ShapeConfig} from './shared/types';

export interface SeriesPluginPrepareArgs {
    series: ChartSeries[];
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegend;
    colors: string[];
    colorScale: ScaleOrdinal<string, string>;
}

export interface SeriesPluginShapeArgs {
    chartSeries: PreparedSeries[];
    seriesOptions: PreparedSeriesOptions;
    boundsWidth: number;
    boundsHeight: number;
    clipPathId: string;
    split: PreparedSplit;
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
    isOutsideBounds: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
    zoomState?: Partial<ZoomState>;
    otherLayers: ShapeDataWithLabels[];
}

export interface SeriesPluginShapeResult {
    data: unknown;
    shapesData: unknown[];
    layers?: ShapeDataWithLabels[];
    clipPathId?: string;
}

export interface TooltipDataArgs {
    shapesData: unknown[];
    position: [number, number];
    boundsWidth: number;
    boundsHeight: number;
}

export type TooltipDataResult = {
    chunks: TooltipDataChunk[];
    pointsForXAxisLookup?: ShapePoint[];
};

export interface SeriesPlugin {
    type: string;
    prepareSeries(args: SeriesPluginPrepareArgs): PreparedSeries[] | Promise<PreparedSeries[]>;
    prepareShapeData(
        args: SeriesPluginShapeArgs,
    ): SeriesPluginShapeResult | null | Promise<SeriesPluginShapeResult | null>;
    getTooltipData(args: TooltipDataArgs): TooltipDataResult;
    shape: ShapeConfig;
}
