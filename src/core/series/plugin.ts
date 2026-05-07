import type {Dispatch} from 'd3-dispatch';
import type {ScaleOrdinal} from 'd3-scale';

import type {
    ChartSeries,
    ChartSeriesOptions,
    MeaningfulAny,
    ShapeDataWithLabels,
} from '../../types';
import type {PreparedXAxis, PreparedYAxis} from '../axes/types';
import type {PreparedSplit} from '../layout/split-types';
import type {ChartScale} from '../scales/types';
import type {SeriesShapeData} from '../shapes/types';
import type {GetTooltipDataFn} from '../utils/tooltip-helpers';

import type {PreparedLegend, PreparedSeries, PreparedSeriesOptions} from './types';

export interface PrepareSeriesArgs {
    series: ChartSeries[];
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegend;
    colorScale: ScaleOrdinal<string, string>;
    colors: string[];
}

export interface PrepareShapeDataArgs {
    series: PreparedSeries[];
    boundsWidth: number;
    boundsHeight: number;
    seriesOptions: PreparedSeriesOptions;
    xAxis?: PreparedXAxis | null;
    yAxis?: PreparedYAxis[];
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
    split?: PreparedSplit;
    isOutsideBounds?: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
    otherLayers?: ShapeDataWithLabels[];
}

export interface PrepareShapeDataResult {
    renderData: SeriesShapeData[];
    tooltipItems: MeaningfulAny[];
}

export interface RenderShapesArgs {
    plot: SVGGElement;
    preparedData: SeriesShapeData[];
    seriesOptions: PreparedSeriesOptions;
    boundsWidth: number;
    boundsHeight: number;
    dispatcher?: Dispatch<object>;
}

export interface SeriesPlugin<T extends ChartSeries = ChartSeries> {
    type: T['type'];
    useClipPath?: boolean;
    prepareSeries(args: PrepareSeriesArgs): PreparedSeries[] | Promise<PreparedSeries[]>;
    prepareShapeData(
        args: PrepareShapeDataArgs,
    ): PrepareShapeDataResult | Promise<PrepareShapeDataResult>;
    renderShapes(args: RenderShapesArgs): (() => void) | void;
    getTooltipData: GetTooltipDataFn;
}
